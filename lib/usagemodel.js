/**
 * 按模型用量（官网「用量明细」那张表）。
 *
 * 接口在 `/internal/usage/by-model`，只认浏览器 cookie，不认 apiKey ——
 * 所以这里单独走一条路，和 lib/api.js 的 `/alpha/*` 客户端分开。
 *
 * 返回字段（实测）：
 *   { model, requests, requestsFailed, tokensIn, tokensOut, tokensTotal,
 *     creditsTotal, consumedFreeCredits, consumedMonthlyCredits, consumedPurchasedCredits }
 *
 * `/internal/usage/charts` 也一并拉了，但 v1 只在诊断页显示条数，没做趋势图。
 */

import { resolveSessionToken, invalidateSession } from './websession.js';

export const USAGE_BASE = 'https://api.commandcode.ai';

/** 把 provider 前缀剥掉：`z-ai/glm-5.3-flash` → `glm-5.3-flash` */
function shortName(model) {
  const s = String(model || '');
  const i = s.indexOf('/');
  return i >= 0 ? s.slice(i + 1) : s;
}

/** 把 provider 前缀拿出来：`z-ai/glm-5.3-flash` → `z-ai` */
function providerOf(model) {
  const s = String(model || '');
  const i = s.indexOf('/');
  return i >= 0 ? s.slice(0, i) : '';
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * 归一化：算出每条占比，并按消耗降序。
 *
 * 「用量占比」按**本月额度消耗**（consumedMonthlyCredits）算，不是按 token：
 * 实测官网那张表的百分比与这个字段逐行吻合（29.2 vs 29.4、24.2 vs 24.2、
 * 11.6 vs 11.7、3.2 vs 3.2），而按 token 算出来是 0.4% / 18.4% / 79.0%，
 * 与官网差得离谱 —— 因为不同模型的单价差上百倍，光看 token 数不代表花了多少钱。
 *
 * 兜底顺序：本月额度 → 总消耗 → 总 token（老数据没有额度字段时才退化）。
 */
export function normalizeByModel(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const used = (r) => {
    const monthly = num(r.consumedMonthlyCredits);
    const purchased = num(r.consumedPurchasedCredits);
    const free = num(r.consumedFreeCredits);
    const sumConsumed = monthly + purchased + free;
    if (sumConsumed > 0) return sumConsumed;
    const total = num(r.creditsTotal);
    if (total > 0) return total;
    return 0;
  };

  const totalCredits = list.reduce((s, r) => s + used(r), 0);
  const totalTokens = list.reduce((s, r) => s + num(r.tokensTotal), 0);
  const totalRequests = list.reduce((s, r) => s + num(r.requests), 0);
  const denom = totalCredits > 0 ? totalCredits : totalTokens;

  const models = list.map((r) => {
    const credits = used(r);
    const share = denom > 0 ? ((credits > 0 ? credits : 0) / denom) * 100 : 0;
    return {
      model: String(r.model || ''),
      name: shortName(r.model),
      provider: providerOf(r.model),
      requests: num(r.requests),
      requestsFailed: num(r.requestsFailed),
      tokensIn: num(r.tokensIn),
      tokensOut: num(r.tokensOut),
      tokensTotal: num(r.tokensTotal),
      credits,
      creditsMonthly: num(r.consumedMonthlyCredits),
      sharePct: Math.round(share * 10) / 10,
    };
  });
  models.sort((a, b) => b.credits - a.credits || b.tokensTotal - a.tokensTotal);

  return {
    models,
    totalTokens,
    totalRequests,
    totalCredits,
    totalModels: models.length,
    shareBasis: totalCredits > 0 ? 'credits' : 'tokens',
  };
}

/**
 * 拉一次按模型用量。返回 { ok, data?, error?, status? }，绝不抛错。
 */
export async function fetchByModel({ timeout = 15000, session = null } = {}) {
  const sess = session ?? resolveSessionToken();
  if (!sess.ok) {
    return { ok: false, error: sess.error, kind: 'session', browsers: sess.browsers ?? [] };
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), Math.max(3000, timeout));
  try {
    const res = await fetch(`${USAGE_BASE}/internal/usage/by-model`, {
      method: 'GET',
      headers: {
        // 只放这一个 cookie，不带浏览器里其它任何东西
        Cookie: `${sess.cookieName || '__Secure-commandcode_prod_.session_token'}=${sess.token}`,
        Accept: 'application/json',
        'User-Agent': 'dsh-comcode-quota/1.0',
      },
      signal: ac.signal,
    });

    if (res.status === 401 || res.status === 403) {
      // cookie 过期了：清缓存，下次刷新会重读（用户可能刚重新登录）
      invalidateSession();
      return { ok: false, error: '登录态已失效，请在浏览器里重新登录 commandcode.ai', status: res.status, kind: 'session' };
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `接口返回 ${res.status}${text ? `：${text.slice(0, 120)}` : ''}`, status: res.status, kind: 'http' };
    }
    const body = await res.json();
    if (!body || body.success === false) {
      return { ok: false, error: body?.error?.message || '接口返回失败', kind: 'api' };
    }
    return { ok: true, data: normalizeByModel(body.data), browser: sess.browser };
  } catch (err) {
    const msg = err?.name === 'AbortError' ? '请求超时' : String(err?.message ?? err);
    return { ok: false, error: msg, kind: 'network' };
  } finally {
    clearTimeout(timer);
  }
}

/** 诊断用：这条通道到底能不能用、卡在哪一步。 */
export async function probeSession({ timeout = 8000 } = {}) {
  const sess = resolveSessionToken({ force: true });
  if (!sess.ok) return { ok: false, step: 'cookie', error: sess.error, browsers: sess.browsers ?? [] };
  const res = await fetchByModel({ timeout, session: sess });
  if (!res.ok) return { ok: false, step: res.kind || 'api', error: res.error, browser: sess.browser };
  return { ok: true, browser: sess.browser, models: res.data.totalModels, tokens: res.data.totalTokens };
}
