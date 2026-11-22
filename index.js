/**
 * dsh-comcode-quota —— Host 半。
 *
 * 职责：
 *   1. 读凭据（手动 Key > 宿主 env > CLI 登录态）→ 拉 Command Code 用量 API
 *   2. 定时采样，落 $DSH_HOME/dsh-comcode-quota/history.json
 *   3. 把快照 / 派生指标 / 设置 / 价目表 / 诊断信息挂成 HTTP 路由给面板用
 *
 * 只 import node:* 和同目录相对模块 —— 不依赖任何裸包，装到哪个宿主都不会解析失败。
 * apply 内任何错误只 log 不抛：外部插件把 Web shell 拖死是不可接受的。
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CommandCodeClient, ApiError, DEFAULT_BASE } from './lib/api.js';
import { resolveCredentials, diagnoseCredentials, readDshKey, watchCliAuth, maskKey } from './lib/credentials.js';
import { Store, DSH_HOME } from './lib/store.js';
import { computeDerived, dailySeries, pushSample, sandboxSeries } from './lib/derive.js';
import { capacity as capacityOf, load as loadPricing, decorate as decoratePricing, requestCost } from './lib/pricing.js';
import { isLoopbackRequest, writeJson, readBody } from './lib/guard.js';
import { fetchByModel, fetchDailyUsage, probeSession } from './lib/usagemodel.js';
import { sessionInfo } from './lib/websession.js';

const PKG_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const PKG_NAME = 'dsh-comcode-quota';
const ROUTE_BASE = `/api/${PKG_NAME}`;
const LOG = (msg) => console.log(`[${PKG_NAME}] ${msg}`);
const WARN = (msg) => console.warn(`[${PKG_NAME}] ${msg}`);

/** 把最少量的插件信息提供给 client 展示 */
function packageVersion() {
  return '1.0.0';
}

class QuotaService {
  constructor(ctx) {
    this.ctx = ctx;
    this.store = new Store();
    this.snapshot = null;
    this.derived = null;
    // DSH 凭据库里读到的 Command Code Key（异步读一次，缓存在这儿；
    // buildState 是同步的，不能在里面 await，所以靠这个字段传递）
    this.dshCred = null;
    // 按模型用量：走浏览器 cookie 通道，与 /alpha/* 的快照互不阻塞
    this.byModel = null;
    this.byModelError = null;
    this.byModelAt = 0;
    // 官方按天用量（cookie 通道）。拿不到时 buildState 会退回本地采样推出的 dailySeries。
    this.dailyOfficial = null;
    this.byModelRefreshing = false;
    this.lastError = null;
    this.refreshing = false;
    this.nextRefreshAt = null;
    this.timer = null;
    this.stopWatchAuth = null;
    this.lastRefreshMs = null;
  }

  settings() {
    return this.store.getSettings();
  }

  intervalSec() {
    const s = this.settings();
    const base = Math.max(15, Number(s.refreshIntervalSec) || 60);
    // 剩余不足 15% 时加速到 20s，及时预警
    const tightest = this.snapshot?.windows
      ? Math.min(...Object.values(this.snapshot.windows).map((w) => (w.cap > 0 ? w.remainingPct : 100)))
      : 100;
    return tightest <= 15 ? Math.min(base, 20) : base;
  }

  credentialInfo() {
    const cred = resolveCredentials(this.settings(), { dsh: this.dshCred });
    if (!cred.ok) return { ok: false, source: cred.source, error: cred.error, file: cred.file ?? null, mode: cred.mode };
    return { ok: true, source: cred.source, masked: cred.masked, via: cred.via, mode: cred.mode, userName: cred.userName ?? null, file: cred.file ?? null };
  }

  /**
   * 读一次 DSH 凭据库里的 Command Code Key。
   * 失败只是「这条来源没命中」，不影响后面的 env / CLI 兜底，所以永远不抛。
   */
  async syncDshCredential() {
    try {
      this.dshCred = await readDshKey(this.ctx);
    } catch (err) {
      this.dshCred = { ok: false, error: String(err?.message ?? err) };
    }
    return this.dshCred;
  }

  /** 首次引导用：把「四条来源各自什么状态 + 该去哪拿 Key」一次给全 */
  credentialDiagnosis() {
    return diagnoseCredentials(this.settings(), { dsh: this.dshCred });
  }

  async refresh(reason = 'manual') {
    if (this.refreshing) return { ok: false, error: { message: '正在刷新中' } };
    this.refreshing = true;
    const started = Date.now();
    try {
      const settings = this.settings();
      // 每次刷新都重读 DSH 凭据库：用户在 DSH 里换了 Key，下一秒就该用上新的
      await this.syncDshCredential();
      const cred = resolveCredentials(settings, { dsh: this.dshCred });
      if (!cred.ok) {
        this.lastError = { message: cred.error, raw: cred.error, at: Date.now(), status: 0 };
        return { ok: false, error: this.lastError };
      }
      const client = new CommandCodeClient({
        baseUrl: settings.apiBaseUrl || DEFAULT_BASE,
        apiKey: cred.apiKey,
        timeout: Math.max(3000, Number(settings.requestTimeoutMs) || 20000),
      });
      const snap = await client.snapshot();
      this.snapshot = snap;
      this.derived = computeDerived(this.store, snap);
      pushSample(this.store, snap);
      this.store.log('info', `refresh ok (${reason}) 5h=${snap.windows.fiveHour.remaining} wk=${snap.windows.weekly.remaining} mo=${snap.windows.monthly.remaining}`);
      if (snap.errors?.length) this.store.log('warn', `partial errors: ${JSON.stringify(snap.errors)}`);
      this.lastError = null;
      // 模型用量搭同一趟车更新：面板读的是 /state 里的 byModel 字段，
      // 这里不跟着刷的话，那一页只有重启后才变一次。
      // 自动刷新用 fire-and-forget（由 refreshByModel 自己的 60 秒节流控制，
      // 不每 60 秒读一次钥匙串）；手动刷新要 await，否则接口返回的还是旧数字。
      if (reason === 'manual') await this.refreshByModel('manual');
      else this.refreshByModel('auto').catch(() => {});
      return { ok: true };
    } catch (err) {
      this.lastError = { message: err.friendly ?? err.message, raw: err.message, at: Date.now(), status: err.status ?? 0 };
      this.store.log('error', `refresh failed (${reason}): ${err.message}`);
      return { ok: false, error: this.lastError };
    } finally {
      this.refreshing = false;
      this.lastRefreshMs = Date.now() - started;
      this.schedule();
    }
  }

  /**
   * 拉按模型用量。这条通道独立于主快照：
   *   - 依赖浏览器 cookie，可能失败（没登录、cookie 过期、钥匙串拒绝），
   *     失败时只记错误、不影响额度那一半继续工作；
   *   - 自动刷新时按 60 秒节流（跟主快照同一个节拍），钥匙串本身另有 10 分钟
   *     缓存，所以不会每 60 秒就去解锁一次钥匙串。
   */
  async refreshByModel(reason = 'auto') {
    if (this.byModelRefreshing) return { ok: false, error: { message: '正在刷新中' } };
    const age = Date.now() - this.byModelAt;
    if (reason === 'auto' && this.byModel && age < 60 * 1000) return { ok: true, skipped: true };
    this.byModelRefreshing = true;
    const timeout = Math.max(5000, Number(this.settings().requestTimeoutMs) || 15000);
    try {
      // 按天用量和按模型用量走同一条 cookie 通道，同一个节拍一起拉，省一次钥匙串解锁。
      const [res, daily] = await Promise.all([
        fetchByModel({ timeout }),
        fetchDailyUsage({ timeout }),
      ]);
      if (daily.ok && daily.days.length) {
        // 官方 daily 只给 periodStart，不给 periodEnd；柱状图要靠两者算槽位，
        // 这里补上当前订阅周期的结束时间（同一份 snapshot 里的值，口径一致）。
        const snapEnd = this.snapshot?.plan?.currentPeriodEnd ? Date.parse(this.snapshot.plan.currentPeriodEnd) : null;
        this.dailyOfficial = { ...daily, periodEnd: Number.isFinite(snapEnd) ? snapEnd : null };
      }
      if (res.ok) {
        this.byModel = res.data;
        this.byModelError = null;
        this.byModelAt = Date.now();
        this.store.log('info', `by-model ok (${reason}) ${res.data.totalModels} models ${(res.data.totalTokens / 1e6).toFixed(1)}M tokens`);
        return { ok: true };
      }
      this.byModelError = { message: res.error, at: Date.now(), kind: res.kind ?? 'unknown' };
      this.store.log('warn', `by-model failed (${reason}): ${res.error}`);
      return { ok: false, error: this.byModelError };
    } catch (err) {
      this.byModelError = { message: String(err?.message ?? err), at: Date.now(), kind: 'unexpected' };
      this.store.log('error', `by-model crashed (${reason}): ${err?.message ?? err}`);
      return { ok: false, error: this.byModelError };
    } finally {
      this.byModelRefreshing = false;
    }
  }

  schedule() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (!this.settings().autoRefresh) {
      this.nextRefreshAt = null;
      return;
    }
    const sec = this.intervalSec();
    this.nextRefreshAt = Date.now() + sec * 1000;
    this.timer = setInterval(() => {
      this.nextRefreshAt = Date.now() + this.intervalSec() * 1000;
      this.refresh('auto').catch(() => {});
    }, sec * 1000);
    // 不拖住宿主进程退出
    this.timer.unref?.();
  }

  restart() {
    this.schedule();
  }

  buildState() {
    const settings = this.settings();
    const pricing = loadPricing();
    return {
      snapshot: this.snapshot,
      derived: this.derived,
      // 本计费周期内按天的用量（mini 柱状图数据源）。
      // 优先用官方 /internal/usage/summary 的 daily：它覆盖整个账单周期，
      // 而本地采样只能从装机那一刻开始，跨天时会退化成「只有今天一根柱子」。
      daily: this.dailyOfficial || dailySeries(this.store, this.snapshot),
      // 云端沙箱按天分钟数（自然月口径，独立于账单周期）
      sandboxDaily: sandboxSeries(this.store, this.snapshot),
      // 按模型用量（浏览器 cookie 通道；可能为 null —— 未登录/过期时 UI 要能降级）
      byModel: this.byModel,
      byModelMeta: {
        at: this.byModelAt || null,
        error: this.byModelError,
        session: sessionInfo(),
      },
      meta: {
        appName: 'Command Code 额度监控',
        version: packageVersion(),
        refreshing: this.refreshing,
        nextRefreshAt: this.nextRefreshAt,
        lastError: this.lastError,
        intervalSec: this.intervalSec(),
        lastRefreshMs: this.lastRefreshMs,
        credential: this.credentialInfo(),
        // 首次引导的数据源：四条来源各自状态 + Key 的获取页面
        credentialHelp: this.credentialDiagnosis(),
        apiBaseUrl: settings.apiBaseUrl,
        hasPricing: Boolean(pricing?.models?.length),
        pricingGeneratedAt: pricing?.generatedAt ?? null,
        sampleCount: this.store.getHistory(0).samples.length,
        dataDir: path.join(DSH_HOME, PKG_NAME),
      },
      settings: this.sanitizedSettings(),
    };
  }

  /** 对外输出的设置：手动 Key 只给掩码 */
  sanitizedSettings() {
    const s = this.settings();
    const { manualApiKey, ...rest } = s;
    return { ...rest, hasManualApiKey: Boolean(manualApiKey), manualApiKeyMasked: manualApiKey ? maskKey(manualApiKey) : '' };
  }

  handleSettingsPatch(patch) {
    const next = { ...(patch || {}) };
    // 只接受白名单字段，避免外部往设置文件里塞任意键
    const allowed = ['apiBaseUrl', 'credentialsMode', 'manualApiKey', 'autoRefresh', 'refreshIntervalSec', 'requestTimeoutMs', 'historyEnabled', 'historyRetentionDays', 'thresholds', 'modelProfile'];
    const filtered = {};
    for (const k of allowed) if (k in next) filtered[k] = next[k];
    if (filtered.refreshIntervalSec !== undefined) {
      filtered.refreshIntervalSec = Math.min(3600, Math.max(15, Number(filtered.refreshIntervalSec) || 60));
    }
    if (filtered.requestTimeoutMs !== undefined) {
      filtered.requestTimeoutMs = Math.min(120000, Math.max(3000, Number(filtered.requestTimeoutMs) || 20000));
    }
    if (filtered.credentialsMode !== undefined && !['auto', 'manual'].includes(filtered.credentialsMode)) {
      delete filtered.credentialsMode;
    }
    if (filtered.historyRetentionDays !== undefined) {
      filtered.historyRetentionDays = Math.min(365, Math.max(1, Math.round(Number(filtered.historyRetentionDays) || 30)));
    }
    // 阈值必须是 0-100 的百分比，且 critical 不得低于 warn（否则告警顺序错乱）
    if (filtered.thresholds !== undefined) {
      const clampPct = (v, fallback) => Math.min(100, Math.max(0, Number(v) || fallback));
      const warn = clampPct(filtered.thresholds?.warn, 70);
      const critical = clampPct(filtered.thresholds?.critical, 90);
      filtered.thresholds = { warn, critical: Math.max(warn, critical) };
    }
    // 典型请求画像：只留三个非负整数 token 数
    if (filtered.modelProfile !== undefined) {
      const toInt = (v, fallback) => Math.min(10_000_000, Math.max(0, Math.round(Number(v) || fallback)));
      const p = filtered.modelProfile || {};
      filtered.modelProfile = {
        freshInputTokens: toInt(p.freshInputTokens, 800),
        cacheReadTokens: toInt(p.cacheReadTokens, 50000),
        outputTokens: toInt(p.outputTokens, 175),
      };
    }
    if (filtered.apiBaseUrl !== undefined) {
      const url = String(filtered.apiBaseUrl || '').trim();
      if (!/^https?:\/\/[^\s]+$/i.test(url)) delete filtered.apiBaseUrl;
      else filtered.apiBaseUrl = url.replace(/\/+$/, '');
    }
    this.store.saveSettings(filtered);
    if ('autoRefresh' in filtered || 'refreshIntervalSec' in filtered) this.restart();
    return this.sanitizedSettings();
  }
}

/* ------------------------------------------------------------------ 路由 */

function routesFor(service) {
  const guard = (req, res) => {
    if (!isLoopbackRequest(req)) {
      writeJson(res, 403, { error: 'forbidden: loopback-only' });
      return false;
    }
    return true;
  };

  return [
    {
      kind: 'exact',
      path: `${ROUTE_BASE}/state`,
      handler: async (req, res) => {
        if (!guard(req, res)) return;
        if (req.method !== 'GET') return writeJson(res, 405, { error: 'method not allowed' });
        try {
          writeJson(res, 200, service.buildState());
        } catch (err) {
          WARN(`state failed: ${err.message}`);
          writeJson(res, 500, { error: err.message });
        }
      },
    },
    {
      kind: 'exact',
      path: `${ROUTE_BASE}/refresh`,
      handler: async (req, res) => {
        if (!guard(req, res)) return;
        if (req.method !== 'POST') return writeJson(res, 405, { error: 'method not allowed' });
        try {
          const result = await service.refresh('manual');
          writeJson(res, 200, { ...service.buildState(), result });
        } catch (err) {
          WARN(`refresh failed: ${err.message}`);
          writeJson(res, 500, { error: err.message });
        }
      },
    },
    {
      kind: 'exact',
      path: `${ROUTE_BASE}/settings`,
      handler: async (req, res) => {
        if (!guard(req, res)) return;
        try {
          if (req.method === 'GET') return writeJson(res, 200, { settings: service.sanitizedSettings(), meta: service.buildState().meta });
          if (req.method === 'POST') {
            const body = await readBody(req);
            if (body?.reset === true) {
              service.store.resetSettings();
              service.restart();
            } else {
              service.handleSettingsPatch(body);
            }
            return writeJson(res, 200, { settings: service.sanitizedSettings() });
          }
          return writeJson(res, 405, { error: 'method not allowed' });
        } catch (err) {
          WARN(`settings failed: ${err.message}`);
          writeJson(res, err.status || 400, { error: err.message });
        }
      },
    },
    {
      kind: 'exact',
      path: `${ROUTE_BASE}/history`,
      handler: async (req, res) => {
        if (!guard(req, res)) return;
        if (req.method !== 'GET') return writeJson(res, 405, { error: 'method not allowed' });
        try {
          const url = new URL(req.url || '/', 'http://localhost');
          const since = Number(url.searchParams.get('since')) || 0;
          const history = service.store.getHistory(since);
          writeJson(res, 200, { samples: history.samples, count: history.samples.length });
        } catch (err) {
          writeJson(res, 500, { error: err.message });
        }
      },
    },
    {
      kind: 'exact',
      path: `${ROUTE_BASE}/history-clear`,
      handler: async (req, res) => {
        if (!guard(req, res)) return;
        if (req.method !== 'POST') return writeJson(res, 405, { error: 'method not allowed' });
        service.store.clearHistory();
        writeJson(res, 200, { ok: true });
      },
    },
    {
      kind: 'exact',
      path: `${ROUTE_BASE}/pricing`,
      handler: async (req, res) => {
        if (!guard(req, res)) return;
        if (req.method !== 'GET') return writeJson(res, 405, { error: 'method not allowed' });
        try {
          const settings = service.settings();
          const url = new URL(req.url || '/', 'http://localhost');
          const profile = {
            ...(settings.modelProfile || {}),
            ...(url.searchParams.get('in') ? { freshInputTokens: Number(url.searchParams.get('in')) || 0 } : {}),
            ...(url.searchParams.get('cache') ? { cacheReadTokens: Number(url.searchParams.get('cache')) || 0 } : {}),
            ...(url.searchParams.get('out') ? { outputTokens: Number(url.searchParams.get('out')) || 0 } : {}),
            ...(url.searchParams.get('write') ? { cacheWriteTokens: Number(url.searchParams.get('write')) || 0 } : {}),
          };
          const windowKey = ['fiveHour', 'weekly', 'monthly'].includes(url.searchParams.get('window'))
            ? url.searchParams.get('window')
            : 'monthly';
          const data = decoratePricing(loadPricing(), profile);
          const remaining = service.snapshot?.credits?.totalRemaining ?? null;
          const windows = service.snapshot?.windows ?? null;
          writeJson(res, 200, {
            generatedAt: data.generatedAt,
            sources: data.sources ?? null,
            plan: data.plan ?? null,
            limits: data.limits ?? null,
            profile,
            remaining,
            windowRemaining: windows ? { fiveHour: windows.fiveHour.remaining, weekly: windows.weekly.remaining, monthly: windows.monthly.remaining } : null,
            // 各窗口已用比例，供 UI 把「官方满额度可跑次数」折算成剩余次数
            windowRatio: windows
              ? {
                  fiveHour: windows.fiveHour.cap ? windows.fiveHour.remaining / windows.fiveHour.cap : null,
                  weekly: windows.weekly.cap ? windows.weekly.remaining / windows.weekly.cap : null,
                  monthly: windows.monthly.cap ? windows.monthly.remaining / windows.monthly.cap : null,
                }
              : null,
            windowKey,
            // 每个模型在该窗口下的可跑次数：官方给次数就用官方口径，否则标 estimated
            models: data.models.map((m) => {
              const cap = capacityOf(remaining, m, profile, windowKey, windows ? windows[windowKey]?.remaining / windows[windowKey]?.cap : null);
              return {
                ...m,
                remainingRequests: cap.requests,
                remainingRequestsBasis: cap.basis,
              };
            }),
          });
        } catch (err) {
          WARN(`pricing failed: ${err.message}`);
          writeJson(res, 500, { error: err.message });
        }
      },
    },
    {
      kind: 'exact',
      path: `${ROUTE_BASE}/by-model`,
      handler: async (req, res) => {
        if (!guard(req, res)) return;
        if (req.method !== 'GET') return writeJson(res, 405, { error: 'method not allowed' });
        try {
          // 首次访问且还没数据时同步拉一次，省得用户手动点刷新
          if (!service.byModel && !service.byModelRefreshing) await service.refreshByModel('lazy');
          writeJson(res, 200, {
            data: service.byModel,
            meta: { at: service.byModelAt || null, error: service.byModelError, session: sessionInfo() },
          });
        } catch (err) {
          writeJson(res, 500, { error: err.message });
        }
      },
    },
    {
      kind: 'exact',
      path: `${ROUTE_BASE}/by-model/refresh`,
      handler: async (req, res) => {
        if (!guard(req, res)) return;
        if (req.method !== 'POST') return writeJson(res, 405, { error: 'method not allowed' });
        try {
          const result = await service.refreshByModel('manual');
          writeJson(res, 200, {
            result,
            data: service.byModel,
            meta: { at: service.byModelAt || null, error: service.byModelError, session: sessionInfo() },
          });
        } catch (err) {
          writeJson(res, 500, { error: err.message });
        }
      },
    },
    {
      kind: 'exact',
      path: `${ROUTE_BASE}/by-model/probe`,
      handler: async (req, res) => {
        if (!guard(req, res)) return;
        if (req.method !== 'POST') return writeJson(res, 405, { error: 'method not allowed' });
        try {
          writeJson(res, 200, await probeSession({ timeout: 10000 }));
        } catch (err) {
          writeJson(res, 500, { error: err.message });
        }
      },
    },
    {
      kind: 'exact',
      path: `${ROUTE_BASE}/credentials/probe`,
      handler: async (req, res) => {
        if (!guard(req, res)) return;
        if (req.method !== 'POST') return writeJson(res, 405, { error: 'method not allowed' });
        try {
          // 引导页的「重新检测」按钮：用户刚在 DSH 里存好 Key，这里立刻重读一遍凭据库
          await service.syncDshCredential();
          const diagnosis = service.credentialDiagnosis();
          const cred = service.credentialInfo();
          writeJson(res, 200, { credential: cred, help: diagnosis });
        } catch (err) {
          writeJson(res, 500, { error: err.message });
        }
      },
    },
    {
      kind: 'exact',
      path: `${ROUTE_BASE}/diagnostics`,
      handler: async (req, res) => {
        if (!guard(req, res)) return;
        if (req.method !== 'GET') return writeJson(res, 405, { error: 'method not allowed' });
        try {
          const settings = service.settings();
          const cred = service.credentialInfo();
          writeJson(res, 200, {
            version: packageVersion(),
            node: process.version,
            dshHome: DSH_HOME,
            dataDir: path.join(DSH_HOME, PKG_NAME),
            credential: cred,
            credentialHelp: service.credentialDiagnosis(),
            apiBaseUrl: settings.apiBaseUrl,
            intervalSec: service.intervalSec(),
            autoRefresh: settings.autoRefresh,
            refreshing: service.refreshing,
            lastRefreshMs: service.lastRefreshMs,
            lastError: service.lastError,
            snapshotErrors: service.snapshot?.errors ?? [],
            sampleCount: service.store.getHistory(0).samples.length,
            snapshotFetchedAt: service.snapshot?.fetchedAt ?? null,
            byModel: {
              at: service.byModelAt || null,
              models: service.byModel?.totalModels ?? 0,
              tokens: service.byModel?.totalTokens ?? 0,
              error: service.byModelError,
              session: sessionInfo(),
            },
            log: service.store.readLog(80),
          });
        } catch (err) {
          writeJson(res, 500, { error: err.message });
        }
      },
    },
  ];
}

/* ------------------------------------------------------------- 插件入口 */

export const inject = ['webServer'];

export function apply(ctx) {
  let service;
  try {
    service = new QuotaService(ctx);
  } catch (err) {
    WARN(`init failed: ${err.message}`);
    return;
  }

  // 路由注册：任何一条失败都不许把 web shell 拖崩
  ctx.effect(
    () => {
      const disposers = [];
      for (const route of routesFor(service)) {
        try {
          disposers.push(ctx.webServer.register(route));
        } catch (err) {
          WARN(`route ${route.path} register failed: ${err.message}`);
        }
      }
      return () => {
        for (const dispose of disposers) {
          try {
            dispose();
          } catch {}
        }
      };
    },
    `${PKG_NAME}: routes`,
  );

  // 首次拉取 + 定时调度（延后一拍，别跟宿主启动抢 CPU）
  const boot = setTimeout(() => {
    service.refresh('boot').catch((err) => WARN(`boot refresh failed: ${err.message}`));
    // 按模型用量单独延后一点：它要访问钥匙串，别和主刷新抢
    setTimeout(() => {
      service.refreshByModel('boot').catch((err) => WARN(`boot by-model failed: ${err.message}`));
    }, 2500).unref?.();
  }, 1200);
  boot.unref?.();

  // CLI 重新登录后自动生效
  try {
    service.stopWatchAuth = watchCliAuth(() => {
      service.refresh('auth-change').catch(() => {});
    });
  } catch (err) {
    WARN(`auth watch failed: ${err.message}`);
  }

  ctx.effect(
    () => () => {
      try {
        clearTimeout(boot);
      } catch {}
      try {
        if (service.timer) clearInterval(service.timer);
      } catch {}
      try {
        service.stopWatchAuth?.();
      } catch {}
    },
    `${PKG_NAME}: lifecycle`,
  );

  LOG(`ready (routes under /${ROUTE_BASE}/*, data at ${path.join(DSH_HOME, PKG_NAME)})`);
}
