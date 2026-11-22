/**
 * 凭据解析，四条来源（按优先级）：
 *   1) manual —— 插件设置里填写的 API Key
 *   2) dsh    —— DSH 凭据库里的 COMMANDCODE_API_KEY（零配置来源，见 readDshKey）
 *   3) env    —— 宿主进程环境变量（CMD_GOAT_API_KEY / COMMANDCODE_API_KEY）
 *   4) cli    —— Command Code CLI 的登录态 ~/.commandcode/auth.json
 *
 * 这条顺序是实测定的：本机宿主进程里带着 CMD_GOAT_API_KEY，直接可用，不用让用户再登一次。
 * dsh 排在 env 前面，和 DSH 凭据服务自己的优先级一致（存储文件优先于启动环境），
 * 这样用户在 DSH 里换了 Key 之后，插件下一次刷新就会用上新值。
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ENV_KEYS = ['CMD_GOAT_API_KEY', 'COMMANDCODE_API_KEY', 'COMMAND_CODE_API_KEY'];

/** DSH 凭据库里可能存着 Command Code Key 的引用名（按顺序试，先命中先用） */
export const DSH_REF_NAMES = ['COMMANDCODE_API_KEY', 'CMD_GOAT_API_KEY', 'COMMAND_CODE_API_KEY'];

/**
 * 从 DSH 凭据服务里读 Command Code 的 Key。
 *
 * 为什么值得单独做：DSH 的模型路由本身就用 COMMANDCODE_API_KEY 这个引用调 Command Code，
 * 所以凡是能在 DSH 里正常用 Command Code 模型的人，凭据库里必然已经有这个 Key。
 * 读到了就等于新用户零配置。
 *
 * 这里不用 inject 硬依赖 —— 别的 profile 可能没装凭据提供方，硬依赖会让插件整个装不上。
 * 用 ctx.get 惰性拿，拿不到就把这条来源当成「不存在」，继续往下找。
 *
 * @param {any} ctx cordis 上下文
 * @returns {Promise<{ok: boolean, apiKey?: string, ref?: string, source?: string, error?: string}>}
 */
export async function readDshKey(ctx) {
  let svc = null;
  try {
    svc = ctx?.get?.('credentials') ?? null;
  } catch {
    svc = null;
  }
  if (!svc || typeof svc.resolve !== 'function') {
    return { ok: false, error: 'DSH 没有提供凭据服务' };
  }
  const tried = [];
  for (const ref of DSH_REF_NAMES) {
    try {
      const found = await svc.resolve(ref);
      const value = typeof found === 'string' ? found : found?.value;
      if (typeof value === 'string' && value.trim()) {
        const origin = found && typeof found === 'object' ? found.source : null;
        return {
          ok: true,
          apiKey: value.trim(),
          ref,
          source:
            origin === 'file'
              ? `DSH 凭据库 ${ref}`
              : origin === 'env'
                ? `环境变量 ${ref}`
                : `DSH 凭据 ${ref}`,
        };
      }
      tried.push(ref);
    } catch (err) {
      tried.push(`${ref}(${err?.message ?? err})`);
    }
  }
  return { ok: false, error: `DSH 凭据库里没有 ${tried.join(' / ') || DSH_REF_NAMES.join(' / ')}` };
}

export function authFilePath() {
  const home = process.env.COMMANDCODE_HOME || os.homedir();
  return path.join(home, '.commandcode', 'auth.json');
}

export function maskKey(key) {
  if (!key) return '';
  const s = String(key);
  if (s.length <= 14) return `${s.slice(0, 4)}****`;
  return `${s.slice(0, 10)}…${s.slice(-6)}`;
}

export function readCliAuth() {
  const file = authFilePath();
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const json = JSON.parse(raw);
    if (!json.apiKey) return { ok: false, file, error: 'auth.json 里没有 apiKey 字段' };
    return {
      ok: true,
      file,
      apiKey: json.apiKey,
      userId: json.userId ?? null,
      userName: json.userName ?? null,
      keyName: json.keyName ?? null,
      authenticatedAt: json.authenticatedAt ?? null,
      mtimeMs: fs.statSync(file).mtimeMs,
    };
  } catch (err) {
    return { ok: false, file, error: err.code === 'ENOENT' ? '没找到 auth.json，先运行 cmd 登录' : err.message };
  }
}

export function readEnvKey() {
  for (const name of ENV_KEYS) {
    const value = (process.env[name] || '').trim();
    if (value) return { ok: true, source: `环境变量 ${name}`, envName: name, apiKey: value, masked: maskKey(value) };
  }
  return { ok: false, source: '环境变量', error: `宿主进程里没有 ${ENV_KEYS.join(' / ')}` };
}

/**
 * 解析当前生效的凭据。
 *
 * 同步函数：DSH 凭据库那条来源异步读取，由调用方（QuotaService）先读好再传进来，
 * 避免把整条解析链都改成 async 后到处 await。
 *
 * @param {{credentialsMode?: string, manualApiKey?: string}} settings
 * @param {{dsh?: {ok: boolean, apiKey?: string, source?: string, error?: string}}} [pre]
 */
export function resolveCredentials(settings = {}, pre = {}) {
  const mode = settings.credentialsMode === 'manual' ? 'manual' : 'auto';

  if (mode === 'manual') {
    const key = (settings.manualApiKey || '').trim();
    if (!key) return { ok: false, mode, source: '手动 API Key', error: '还没填 API Key' };
    return { ok: true, mode, source: '手动 API Key', apiKey: key, masked: maskKey(key), via: 'manual' };
  }

  const dsh = pre.dsh;
  if (dsh && dsh.ok) {
    return {
      ok: true,
      mode,
      source: dsh.source || 'DSH 凭据库',
      ref: dsh.ref ?? null,
      apiKey: dsh.apiKey,
      masked: maskKey(dsh.apiKey),
      via: 'dsh',
    };
  }

  const env = readEnvKey();
  if (env.ok) return { ok: true, mode, ...env, via: 'env' };

  const cli = readCliAuth();
  if (!cli.ok) {
    return {
      ok: false,
      mode,
      source: 'CLI 登录态',
      error: cli.error,
      file: cli.file,
      via: 'cli',
      envError: env.error,
      dshError: dsh?.error ?? null,
    };
  }
  return {
    ok: true,
    mode,
    source: `CLI 登录态 (${cli.file})`,
    file: cli.file,
    apiKey: cli.apiKey,
    masked: maskKey(cli.apiKey),
    userId: cli.userId,
    userName: cli.userName,
    keyName: cli.keyName,
    authenticatedAt: cli.authenticatedAt,
    via: 'cli',
  };
}

/**
 * 全都找不到时，给出「下一步该干什么」—— 首次引导直接用这份清单，
 * 免得 UI 里再硬编码一遍排查顺序（两边写死必然不同步）。
 *
 * @param {{credentialsMode?: string, manualApiKey?: string}} settings
 * @param {{dsh?: object}} [pre]
 */
export function diagnoseCredentials(settings = {}, pre = {}) {
  const mode = settings.credentialsMode === 'manual' ? 'manual' : 'auto';
  const dsh = pre.dsh;
  const env = readEnvKey();
  const cli = readCliAuth();
  const steps = [];
  steps.push({
    id: 'dsh',
    label: 'DSH 凭据库',
    ok: Boolean(dsh && dsh.ok),
    detail: dsh && dsh.ok ? dsh.source : (dsh?.error ?? '还没检查'),
    hint: '在 DSH 设置里保存 COMMANDCODE_API_KEY，插件会自动用上；这是最省事的一条路。',
  });
  steps.push({
    id: 'env',
    label: '宿主环境变量',
    ok: env.ok,
    detail: env.ok ? env.source : env.error,
    hint: '用 CMD_GOAT_API_KEY=... 启动 DSH，或在 DSH 的 .env 里写一行。',
  });
  steps.push({
    id: 'cli',
    label: 'Command Code CLI 登录态',
    ok: cli.ok,
    detail: cli.ok ? cli.file : cli.error,
    hint: '装好 CLI 后跑一次 cmd 登录，凭据会写到 ~/.commandcode/auth.json。',
  });
  steps.push({
    id: 'manual',
    label: '手动填入 Key',
    ok: Boolean((settings.manualApiKey || '').trim()),
    detail: settings.manualApiKey ? maskKey(settings.manualApiKey) : '还没填',
    hint: '在上面「API Key」输入框粘贴一次即可，只存在本机。',
  });
  return { mode, steps, keyUrl: KEY_PAGE_URL, allFailed: steps.every((s) => !s.ok) };
}

/** Command Code 生成 API Key 的页面（官网设置里的 Key 管理页，实测路由存在） */
export const KEY_PAGE_URL = 'https://commandcode.ai/settings/api-keys';

/** 监听 auth.json 变化（CLI 重新登录后自动生效） */
export function watchCliAuth(onChange) {
  const file = authFilePath();
  let watcher = null;
  try {
    watcher = fs.watch(path.dirname(file), (event, name) => {
      if (!name || String(name).toLowerCase() === 'auth.json') onChange();
    });
    watcher.on('error', () => {});
  } catch {
    /* 目录不存在就忽略 */
  }
  return () => {
    try {
      watcher?.close();
    } catch {}
  };
}
