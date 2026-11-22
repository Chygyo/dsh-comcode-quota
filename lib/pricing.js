/**
 * GOAT 价目表：加载 + 单次请求成本 / 剩余额度可跑次数估算
 *
 * 【单位说明，别搞混】
 * - 「额度点」是 Command Code 自己的计费单位，GOAT 每月 100 点，1 点大约等于 1 美元。
 * - 「单次估算」按官方 token 报价算出来的美元数，只用于横向比较模型贵贱；
 *   它和额度点不是同一单位（官方给的 Requests / month 是权威口径，差可达 100 倍）。
 * - 「还能跑」优先用官方给的每窗口次数（requests5h / requestsMonthly），
 *   只有当官方没给时，才退回「剩余额度 ÷ 单次估算」这种粗略推算，并且标注出来。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRICING_FILE = path.join(PKG_ROOT, 'data', 'goat-pricing.json');

const FALLBACK = {
  generatedAt: null,
  models: [],
  limits: { fiveHour: 20, weekly: 50, monthly: 100 },
  plan: { name: 'GOAT', monthlyPrice: 10, monthlyCreditsIncluded: 100 },
  requestProfile: { freshInputTokens: 800, cacheReadTokens: 50000, outputTokens: 175, cacheWriteTokens: 0 },
};

let cache = null;

export function load({ fresh = false } = {}) {
  if (cache && !fresh) return cache;
  try {
    const json = JSON.parse(fs.readFileSync(PRICING_FILE, 'utf8'));
    json.file = PRICING_FILE;
    cache = json;
  } catch {
    cache = { ...FALLBACK, file: PRICING_FILE, missing: true };
  }
  return cache;
}

/**
 * 按典型 agent 请求画像估算单次请求成本（美元）
 * cost = Σ (tokens / 1e6) * pricePerMillion
 *
 * 缓存读取缺价时退回输入价（官方对多数模型确实同价或缺省）；
 * 缓存写入缺价时按 0 计，并在 breakdown 里体现 —— 不要拿输入价顶替，
 * 因为缓存写入通常比输入贵一个量级（如 Claude 5.5：输入 $2 / 缓存写入 $2.5）。
 */
export function requestCost(model, profile) {
  const p = {
    freshInputTokens: 800,
    cacheReadTokens: 50000,
    outputTokens: 175,
    cacheWriteTokens: 0,
    ...profile,
  };
  const per = (tokens, price) => (tokens / 1e6) * (Number(price) || 0);
  const input = per(p.freshInputTokens, model.input ?? 0);
  const cacheRead = per(p.cacheReadTokens, model.cacheRead ?? model.input ?? 0);
  const cacheWrite = per(p.cacheWriteTokens, model.cacheWrite ?? 0);
  const output = per(p.outputTokens, model.output ?? 0);
  const total = input + cacheRead + cacheWrite + output;
  return { input, cacheRead, cacheWrite, output, total, breakdown: { input, cacheRead, cacheWrite, output } };
}

/** 官方每窗口次数（优先）→ 对象或 null */
export function officialRequests(model) {
  if (!model) return null;
  const fiveHour = Number(model.requests5h);
  const weekly = Number(model.requestsWeekly);
  const monthly = Number(model.requestsMonthly);
  if (!monthly && !weekly && !fiveHour) return null;
  return {
    fiveHour: Number.isFinite(fiveHour) && fiveHour > 0 ? fiveHour : null,
    weekly: Number.isFinite(weekly) && weekly > 0 ? weekly : null,
    monthly: Number.isFinite(monthly) && monthly > 0 ? monthly : null,
  };
}

/**
 * 给定剩余额度，估算各模型还能跑多少次
 * @param remainingUsd 该窗口剩余额度（点）
 * @param windowKey    fiveHour | weekly | monthly
 * @param ratio        该窗口剩余比例（remaining / cap）
 */
export function capacity(remainingUsd, model, profile, windowKey = 'monthly', ratio = null) {
  const c = requestCost(model, profile);
  const official = officialRequests(model);
  const officialForWindow = official ? official[windowKey] : null;

  if (officialForWindow && Number.isFinite(ratio) && ratio !== null) {
    // 官方口径：满额度能跑 N 次，剩多少比例就能跑 N × 比例
    const requests = Math.max(0, Math.floor(officialForWindow * ratio));
    return { ...c, requests, basis: 'official', officialForWindow, ratio };
  }
  if (officialForWindow) {
    return { ...c, requests: officialForWindow, basis: 'official', officialForWindow, ratio: 1 };
  }
  if (!c.total || c.total <= 0) {
    return { ...c, requests: null, basis: 'none' };
  }
  // 没有官方次数时才退回粗算，UI 上要标出这是推算值
  if (!Number.isFinite(remainingUsd) || remainingUsd <= 0) {
    return { ...c, requests: 0, basis: 'estimated' };
  }
  return { ...c, requests: Math.floor(remainingUsd / c.total), basis: 'estimated' };
}

/** 给价目表补充派生字段 */
export function decorate(data, profile) {
  const models = (data.models || []).map((m) => {
    const c = requestCost(m, profile);
    return {
      ...m,
      perRequest: Number(c.total.toFixed(6)),
      perRequestBreakdown: c.breakdown,
      official: officialRequests(m),
    };
  });
  return { ...data, models };
}
