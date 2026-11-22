/**
 * fetch-pricing.mjs
 * 从 commandcode.ai 官方文档重新生成 data/goat-pricing.json。
 *
 *   node scripts/fetch-pricing.mjs            # 联网抓取
 *   node scripts/fetch-pricing.mjs --offline  # 只用本地缓存解析
 *
 * 【为什么按表头名取值，而不是按下标】
 * 官方价目表的列会变（曾经是 9 列含 Intelligence / Tok-s，现在只有 7 列）。
 * 按下标取会让「输入/输出/缓存读取/缓存写入」整体错位一格 —— 那正是 1.0.9 之前
 * 数据全错的根因：缓存读取显示成 0，实际读的是「输出」列的右边一列。
 * 所以这里一律先把表头文字归一化成列名，再按列名取单元格。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CACHE_DIR = path.join(ROOT, 'data', '.cache');
const OUT = path.join(ROOT, 'data', 'goat-pricing.json');

const SOURCES = {
  goat: 'https://commandcode.ai/docs/plans/goat',
  pricing: 'https://commandcode.ai/docs/resources/pricing-limits',
  models: 'https://commandcode.ai/docs/reference/cli/models',
};

const offline = process.argv.includes('--offline');

/* ------------------------------------------------------------------ utils */

const unescape = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"');

const text = (html) => unescape(String(html).replace(/<[^>]+>/g, ' ')).replace(/[ \t\u00a0]+/g, ' ').trim();

function money(html) {
  const raw = text(html);
  if (!raw) return null;
  if (/^free$/i.test(raw)) return 0;
  const m = raw.match(/\$\s*([0-9]*\.?[0-9]+)/);
  return m ? Number(m[1]) : null;
}

function num(html) {
  const raw = text(html).replace(/,/g, '');
  const m = raw.match(/^([0-9]+(?:\.[0-9]+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

const key = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** 表头文字 → 归一化列名，例如 "Cache read ↕" → "cacheread" */
function normalizeHeader(cellHtml) {
  return key(text(cellHtml).replace(/[↕↑↓]/g, ''));
}

function tablesOf(html) {
  return [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0]);
}

function rowsOf(tableHtml) {
  return [...tableHtml.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((row) =>
    [...row[0].matchAll(/<(td|th)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => m[2])
  );
}

/* --------------------------------------------------------------- parsers */

/** 主价目表：按表头名对齐列，缺列就是 null */
function parseMainTable(html) {
  const models = [];
  for (const table of tablesOf(html)) {
    const rows = rowsOf(table);
    if (rows.length < 2) continue;
    const header = rows[0].map(normalizeHeader);
    const col = (name) => header.indexOf(key(name));
    const iModel = col('Model');
    const iInput = col('Input');
    const iOutput = col('Output');
    if (iModel < 0 || iInput < 0 || iOutput < 0) continue;
    // 档次表也有 Model/Input/Output，但它带「Monthly credits」列、没有「Cache read」
    // 不排除的话会把同一批模型重复计一遍（140 而不是 75）
    if (header.some((h) => h.includes('monthlycredits'))) continue;
    if (!header.some((h) => h.includes('cache'))) continue;

    const iCtx = col('Context');
    const iCacheRead = col('Cache read');
    const iCacheWrite = col('Cache write');
    const iCaps = col('Caps');

    for (const raw of rows.slice(1)) {
      const cell = (i) => (i >= 0 && i < raw.length ? raw[i] : null);
      const nameCell = cell(iModel);
      if (nameCell == null) continue;

      // 名字在 <span class="truncate ..."> 里；带 badge / 副行的模型要单独剥出来
      const anchor = nameCell.match(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
      const trunc = anchor ? anchor[2].match(/<span[^>]*truncate[^>]*>([\s\S]*?)<\/span>/i) : null;
      const name = text(trunc ? trunc[1] : anchor ? anchor[2] : nameCell);
      if (!name || /^model$/i.test(name)) continue;

      const slug = anchor ? anchor[1].replace(/^.*\/models\//, '').replace(/^\//, '') : null;

      // note：优先取 title 属性；否则取名字后面多出来的那截文字
      const full = text(nameCell);
      const titleAttr = nameCell.match(/title="([^"]{4,})"/);
      let note = null;
      if (titleAttr) note = unescape(titleAttr[1]);
      else if (full.length > name.length + 1 && full.startsWith(name)) {
        const tail = full.slice(name.length).replace(/^[\s·-]+/, '').trim();
        if (tail) note = tail;
      }

      const inputRaw = text(cell(iInput) || '');
      const ctx = text(cell(iCtx) || '');
      const ctxNum = ctx ? Number(ctx.replace(/[^0-9.]/g, '')) : null;
      const capsText = text(cell(iCaps) || '');

      models.push({
        name,
        slug,
        note,
        context: ctx || null,
        contextTokens: Number.isFinite(ctxNum) ? Math.round(ctxNum * (/M$/i.test(ctx) ? 1e6 : /K$/i.test(ctx) ? 1e3 : 1)) : null,
        input: money(iInput >= 0 ? cell(iInput) : null),
        output: money(iOutput >= 0 ? cell(iOutput) : null),
        cacheRead: iCacheRead >= 0 ? money(cell(iCacheRead)) : null,
        cacheWrite: iCacheWrite >= 0 ? money(cell(iCacheWrite)) : null,
        // 输入价带 "+1" 说明该模型还有分时段价（peak / off-peak），这里只记数量
        inputVariants: Number((inputRaw.match(/\+\s*(\d+)/) || [])[1] || 0),
        caps: capsText && capsText !== '—' ? capsText.replace(/^\+\s*/, '') : null,
        free: /^free$/i.test(inputRaw),
      });
    }
  }
  return models;
}

/** 官方估算表：Model / Requests / 5 hours / week / month */
function parseEstimateTable(html) {
  const out = [];
  for (const table of tablesOf(html)) {
    const rows = rowsOf(table);
    if (rows.length < 2) continue;
    const header = rows[0].map(normalizeHeader);
    if (!header.some((h) => h.startsWith('requests'))) continue;
    const i5 = header.findIndex((h) => h.startsWith('requests') && /hours/.test(h));
    const iWk = header.findIndex((h) => h.startsWith('requests') && /week/.test(h));
    const iMo = header.findIndex((h) => h.startsWith('requests') && /month/.test(h));
    if (i5 < 0 || iMo < 0) continue;
    for (const raw of rows.slice(1)) {
      const name = text(raw[0] || '');
      if (!name) continue;
      out.push({
        name,
        requests5h: num(raw[i5]),
        requestsWeekly: iWk >= 0 ? num(raw[iWk]) : null,
        requestsMonthly: num(raw[iMo]),
      });
    }
  }
  return out;
}

/** 档次表：Model / Input / Output / Cache Read / Cache Write / Monthly credits */
function parseCreditTierTable(html) {
  const out = [];
  for (const table of tablesOf(html)) {
    const rows = rowsOf(table);
    if (rows.length < 2) continue;
    const header = rows[0].map(normalizeHeader);
    const iModel = header.indexOf('model');
    const iInput = header.indexOf('input');
    const iOutput = header.indexOf('output');
    const iCr = header.indexOf('cacheread');
    const iCw = header.indexOf('cachewrite');
    const iCredits = header.findIndex((h) => /monthlycredits/.test(h));
    if (iModel < 0 || iInput < 0 || iCredits < 0) continue;
    for (const raw of rows.slice(1)) {
      const name = text(raw[iModel] || '');
      if (!name) continue;
      out.push({
        name,
        input: money(raw[iInput]),
        output: iOutput >= 0 ? money(raw[iOutput]) : null,
        cacheRead: iCr >= 0 ? money(raw[iCr]) : null,
        cacheWrite: iCw >= 0 ? money(raw[iCw]) : null,
        creditTiers: [...text(raw[iCredits] || '').matchAll(/\$([0-9.]+)/g)].map((m) => Number(m[1])),
      });
    }
  }
  return out;
}

/** 从正文抓窗口限额：「5-hour limit - up to $20 of usage」 */
function parseWindowLimits(plain) {
  const pick = (re) => {
    const m = plain.match(re);
    return m ? Number(m[1]) : null;
  };
  return {
    fiveHour: pick(/5-hour limit\s*[-–—:]\s*(?:up to\s*)?\$?([0-9]+(?:\.[0-9]+)?)/i),
    weekly: pick(/Weekly limit\s*[-–—:]\s*(?:up to\s*)?\$?([0-9]+(?:\.[0-9]+)?)/i),
    monthly: pick(/Monthly limit\s*[-–—:]\s*(?:up to\s*)?\$?([0-9]+(?:\.[0-9]+)?)/i),
  };
}

/* ------------------------------------------------------------------ fetch */

async function get(name, useOffline) {
  const file = path.join(CACHE_DIR, `${name}.html`);
  if (useOffline) return fs.readFileSync(file, 'utf8');
  const res = await fetch(SOURCES[name], {
    headers: { 'user-agent': 'Mozilla/5.0 (dsh-comcode-quota pricing fetcher)' },
  });
  if (!res.ok) throw new Error(`${SOURCES[name]} -> HTTP ${res.status}`);
  const html = await res.text();
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(file, html, 'utf8');
  return html;
}

export async function updatePricing({ offline: offlineOverride } = {}) {
  const useOffline = offlineOverride ?? offline;
  const goatHtml = await get('goat', useOffline);
  let modelsHtml = '';
  try {
    modelsHtml = await get('models', useOffline);
  } catch (e) {
    console.warn('models page unavailable:', e.message);
  }

  const plain = text(
    goatHtml.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  ).replace(/\s{2,}/g, ' ');

  const models = parseMainTable(goatHtml);
  const estimates = parseEstimateTable(goatHtml);
  const tiers = parseCreditTierTable(goatHtml);

  const estByKey = new Map();
  for (const e of estimates) if (!estByKey.has(key(e.name))) estByKey.set(key(e.name), e);
  const tierByKey = new Map();
  for (const t of tiers) {
    const k = key(t.name);
    if (!tierByKey.has(k) || (t.creditTiers.length > (tierByKey.get(k).creditTiers.length || 0))) tierByKey.set(k, t);
  }

  // modelId 供 `cmd --model <id>` 使用，从 Available Models 文档的 <code> 里捞
  const idByKey = new Map();
  for (const m of modelsHtml.matchAll(/<code[^>]*>([a-zA-Z0-9][a-zA-Z0-9._:\/-]{2,60})<\/code>/g)) {
    const id = unescape(m[1]);
    if (!/[a-z]/i.test(id)) continue;
    idByKey.set(key(id.split('/').pop()), id);
  }

  for (const m of models) {
    const k = key(m.name);
    const est = estByKey.get(k);
    const tier = tierByKey.get(k);
    if (est) {
      m.requests5h = est.requests5h;
      m.requestsWeekly = est.requestsWeekly;
      m.requestsMonthly = est.requestsMonthly;
    }
    if (tier) {
      m.creditTiers = tier.creditTiers;
      m.input ??= tier.input;
      m.output ??= tier.output;
      m.cacheRead ??= tier.cacheRead;
      m.cacheWrite ??= tier.cacheWrite;
    }
    const id = idByKey.get(k) || idByKey.get(key(m.name.replace(/\s*\(latest\)\s*/i, '')));
    if (id) m.modelId = id;
  }

  const limits = parseWindowLimits(plain);
  const payload = {
    generatedAt: new Date().toISOString(),
    sources: SOURCES,
    plan: { name: 'GOAT', monthlyPrice: 10, monthlyCreditsIncluded: 100 },
    limits: {
      fiveHour: limits.fiveHour ?? 20,
      weekly: limits.weekly ?? 50,
      monthly: limits.monthly ?? 100,
    },
    // 官方文档给出的典型 agent 请求画像（用于把额度换算成「单次估算」）
    // pricing-limits 原文：~700–1K input、~125–200 output、~42K–56K cache reads
    requestProfile: { freshInputTokens: 800, cacheReadTokens: 50_000, outputTokens: 175, cacheWriteTokens: 0 },
    models,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf8');
  console.log(
    `OK -> ${OUT}\n  models=${models.length} estimates=${estimates.length} tiers=${tiers.length} limits=${JSON.stringify(payload.limits)}`
  );
  return { file: OUT, models: models.length, estimates: estimates.length, tiers: tiers.length, limits: payload.limits };
}

const invokedDirectly = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedDirectly) {
  updatePricing().catch((err) => {
    console.error('pricing fetch failed:', err.message);
    process.exitCode = 1;
  });
}
