/**
 * 浏览器会话 cookie 读取（只用于 Command Code 的 /internal/* 接口）。
 *
 * 为什么需要它：按模型的用量明细挂在 `/internal/usage/by-model` 上，这条路径
 * 只认浏览器登录态的 cookie，不认 apiKey（apiKey 能用的都在 `/alpha/*` 下，
 * 而 `/alpha/*` 没有按模型拆分的接口）。
 *
 * 读取方式（macOS + Chromium 系浏览器）：
 *   1) 把 Cookies 这个 SQLite 库复制到临时目录再读（浏览器开着也不锁库）
 *   2) 密钥在登录钥匙串里（条目名 `Microsoft Edge Safe Storage` 之类）
 *   3) Chromium 的算法：key = PBKDF2-SHA1(密码, "saltysalt", 1003, 16)，
 *      取 `v10` 前缀之后的密文用 AES-128-CBC 解，IV 是 16 个空格。
 *      解出来前 32 字节是域名哈希（Chromium v24 起才有），要剥掉。
 *
 * 拿到的 token 只在本进程内用于向 `api.commandcode.ai/internal/*` 发请求，
 * 不落盘、不外发、不写日志。
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const HOST_SUFFIX = 'commandcode.ai';
const TOKEN_COOKIE = 'session_token';

/** 目前只在 macOS 上验证过；其它平台返回 unsupported，让上层走降级提示。 */
export function platformSupported() {
  return process.platform === 'darwin';
}

/** 探测本机装了哪些 Chromium 系浏览器（只返回确实存在 cookie 库的那些）。 */
export function detectBrowsers() {
  const home = os.homedir();
  const base = path.join(home, 'Library', 'Application Support');
  const candidates = [
    { id: 'edge', name: 'Microsoft Edge', dir: 'Microsoft Edge', keychain: 'Microsoft Edge Safe Storage' },
    { id: 'chrome', name: 'Google Chrome', dir: 'Google/Chrome', keychain: 'Chrome Safe Storage' },
    { id: 'brave', name: 'Brave', dir: 'BraveSoftware/Brave-Browser', keychain: 'Brave Safe Storage' },
    { id: 'arc', name: 'Arc', dir: 'Arc', keychain: 'Arc Safe Storage' },
    { id: 'vivaldi', name: 'Vivaldi', dir: 'Vivaldi', keychain: 'Vivaldi Safe Storage' },
  ];
  const found = [];
  for (const c of candidates) {
    const db = path.join(base, c.dir, 'Default', 'Cookies');
    if (fs.existsSync(db)) found.push({ ...c, db, path: db });
  }
  return found;
}

/** 从登录钥匙串取某个浏览器的加密密码。用户拒绝授权时抛错。 */
function keychainPassword(service) {
  const out = execFileSync('security', ['find-generic-password', '-s', service, '-w'], {
    timeout: 15000,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return out.toString().trim();
}

function decryptChromium(encrypted, password) {
  // Chromium 的 KDF 固定这些参数，跟浏览器版本无关
  const key = crypto.pbkdf2Sync(password, 'saltysalt', 1003, 16, 'sha1');
  const iv = Buffer.alloc(16, 0x20);
  const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  decipher.setAutoPadding(false);
  let out = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  const pad = out[out.length - 1];
  if (pad >= 1 && pad <= 16) out = out.subarray(0, out.length - pad);
  // v24 起在前面塞了 32 字节的 SHA256(host_key)，解出来是二进制，直接丢掉
  if (out.length > 32) out = out.subarray(32);
  return out.toString('utf8');
}

let sqliteModule = null;
function loadSqlite() {
  if (sqliteModule !== null) return sqliteModule;
  try {
    // Node 22+ 的内置模块；宿主是 Node 24，可用
    sqliteModule = require('node:sqlite');
  } catch {
    sqliteModule = false;
  }
  return sqliteModule;
}

/**
 * 读某个浏览器的 commandcode session token。
 * 返回 { ok, token, browser, error? }，绝不抛错。
 */
export function readSessionToken(browser) {
  const sqlite = loadSqlite();
  if (!sqlite) return { ok: false, error: '当前 Node 运行时不支持 node:sqlite，无法读取浏览器 cookie' };
  if (!browser || !browser.db) return { ok: false, error: '没有找到可用的浏览器 cookie 库' };

  const tmp = path.join(os.tmpdir(), `dsh-comcode-quota-${process.pid}-ck.db`);
  let db = null;
  try {
    // 浏览器开着时库是被锁的，复制一份出来读
    fs.copyFileSync(browser.db, tmp);
    db = new sqlite.DatabaseSync(tmp);
    const rows = db
      .prepare(
        `SELECT name, encrypted_value FROM cookies
         WHERE host_key LIKE ? AND length(encrypted_value) > 20`,
      )
      .all(`%${HOST_SUFFIX}%`);

    const target = rows.find((r) => String(r.name).includes(TOKEN_COOKIE));
    if (!target) {
      return { ok: false, browser: browser.name, error: `${browser.name} 里没有找到 commandcode 的登录 cookie，可能还没在这个浏览器登录过` };
    }

    const raw = Buffer.from(target.encrypted_value);
    if (raw.subarray(0, 3).toString() !== 'v10') {
      return { ok: false, browser: browser.name, error: 'cookie 加密格式不认识（不是 v10），可能是新版 Chromium 换了算法' };
    }

    const password = keychainPassword(browser.keychain);
    const token = decryptChromium(raw.subarray(3), password);
    if (!token) return { ok: false, browser: browser.name, error: '解密结果是空的' };
    return { ok: true, token, browser: browser.name, cookieName: target.name };
  } catch (err) {
    const msg = String(err?.message ?? err);
    if (/User canceled|The user name or passphrase/i.test(msg)) {
      return { ok: false, browser: browser.name, error: `钥匙串授权被拒绝（${browser.name} Safe Storage）。授权后才能读取登录态。` };
    }
    return { ok: false, browser: browser.name, error: `读取 cookie 失败：${msg}` };
  } finally {
    try {
      db?.close();
    } catch {
      /* 忽略 */
    }
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* 忽略 */
    }
  }
}

/**
 * 按顺序尝试所有已安装的浏览器，返回第一个成功的。
 * 结果带短缓存，避免每次刷新都去解密一遍（解密要访问钥匙串）。
 */
const CACHE_TTL = 10 * 60 * 1000;
let cache = { at: 0, value: null };

export function resolveSessionToken({ force = false } = {}) {
  if (!platformSupported()) {
    return { ok: false, error: `当前平台（${process.platform}）暂不支持自动读取浏览器登录态` };
  }
  if (!force && cache.value && Date.now() - cache.at < CACHE_TTL) return cache.value;

  const browsers = detectBrowsers();
  if (!browsers.length) {
    return { ok: false, error: '没有检测到已安装的 Edge / Chrome / Brave 等浏览器' };
  }
  const errors = [];
  for (const b of browsers) {
    const res = readSessionToken(b);
    if (res.ok) {
      cache = { at: Date.now(), value: res };
      return res;
    }
    errors.push(res.error);
  }
  return { ok: false, error: errors.join('；'), browsers: browsers.map((b) => b.name) };
}

/** session token 过期或失效时清掉缓存，下次重新读（用户可能刚重新登录）。 */
export function invalidateSession() {
  cache = { at: 0, value: null };
}

export function sessionInfo() {
  if (!platformSupported()) return { supported: false };
  return {
    supported: true,
    cached: Boolean(cache.value?.ok),
    browser: cache.value?.browser ?? null,
    browsers: detectBrowsers().map((b) => b.name),
  };
}
