/**
 * 路由信任围栏：只放行本机 loopback 浏览器，外加已配对设备的转发。
 * 这套检查照 dsh-doc（references/verification.md + skill-center-workbuddy/lib/index.js:44-176）的范式来。
 */

const LOOPBACK_NAMES = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function isLoopbackAddress(addr) {
  if (!addr) return false;
  const a = String(addr).replace(/^::ffff:/, '');
  return a === '::1' || /^127\./.test(a);
}

function stripPort(host) {
  if (!host) return '';
  const h = String(host).trim().toLowerCase();
  if (h.startsWith('[')) return h.slice(0, h.indexOf(']') + 1);
  return h.split(':')[0];
}

/** 请求是否来自本机浏览器（拒绝代理 / 跨站发起） */
export function isLoopbackRequest(req) {
  try {
    const addr = req.socket?.remoteAddress;
    if (!isLoopbackAddress(addr)) return false;

    // 经过代理时 remoteAddress 仍是 loopback，但会带这些头 —— 一律拒绝
    if (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.headers['forwarded']) return false;

    const host = stripPort(req.headers.host);
    if (!LOOPBACK_NAMES.has(host)) return false;

    const site = req.headers['sec-fetch-site'];
    if (site === 'cross-site') return false;

    const origin = req.headers.origin;
    if (origin) {
      try {
        if (stripPort(new URL(origin).host) !== host) return false;
      } catch {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function writeJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

export function readBody(req, limit = 1024 * 256) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let tooLarge = false;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      // 超限后不再累积，但要读完，否则没法把 413 回给客户端（直接 destroy 只会让 curl 看到空响应）
      if (size > limit) {
        tooLarge = true;
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (tooLarge) {
        const err = new Error(`body too large (limit ${limit} bytes)`);
        err.code = 'BODY_TOO_LARGE';
        err.status = 413;
        return reject(err);
      }
      const text = Buffer.concat(chunks).toString('utf8').trim();
      if (!text) return resolve({});
      try {
        resolve(JSON.parse(text));
      } catch (err) {
        err.status = 400;
        reject(err);
      }
    });
    req.on('error', reject);
  });
}
