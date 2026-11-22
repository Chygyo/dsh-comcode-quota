/** GOAT 价目表：加载 + 单次请求成本 / 剩余额度可跑次数估算 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRICING_FILE = path.join(PKG_ROOT, 'data', 'goat-pricing.json');

const FALLBACK = {
  generatedAt: null,
  models: [],
  limits: { fiveHour: 14, weekly: 35, monthly: 70 },
  plan: { name: 'GOAT', monthlyPrice: 10, monthlyCreditsIncluded: 70 },
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

/** 给定剩余额度，估算各模型还能跑多少次 */
export function capacity(remainingUsd, model, profile) {
  const c = requestCost(model, profile);
  if (!c.total || c.total <= 0) return { ...c, requests: Infinity };
  return { ...c, requests: Math.floor(remainingUsd / c.total) };
}

/** 给价目表补充派生字段 */
export function decorate(data, profile) {
  const models = (data.models || []).map((m) => {
    const c = requestCost(m, profile);
    return {
      ...m,
      perRequest: Number(c.total.toFixed(6)),
      perRequestBreakdown: c.breakdown,
      official: m.requests5h ? { fiveHour: m.requests5h, weekly: m.requestsWeekly, monthly: m.requestsMonthly } : null,
    };
  });
  return { ...data, models };
}
