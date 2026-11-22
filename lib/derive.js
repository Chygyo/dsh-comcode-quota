/**
 * 采样 + 消耗速率 / 耗尽预测。
 * 算法来自原项目 main.js 的 computeDerived / pushSample，原样保留：
 * 以「窗口重置点变化」切段，避免跨越重置算出负数 burn rate。
 */

const round2 = (n) => Math.round(n * 100) / 100;

export function pushSample(store, snap) {
  if (!snap?.windows) return;
  store.addSample({
    t: Date.parse(snap.fetchedAt),
    fh: snap.windows.fiveHour.used,
    wk: snap.windows.weekly.used,
    mo: snap.windows.monthly.used,
    fhCap: snap.windows.fiveHour.cap,
    wkCap: snap.windows.weekly.cap,
    moCap: snap.windows.monthly.cap,
    cost: snap.periodUsage?.totalCost ?? null,
    req: snap.periodUsage?.totalCount ?? null,
    tok: snap.periodUsage?.totalTokens ?? null,
    fhReset: snap.windows.fiveHour.resetAt,
    wkReset: snap.windows.weekly.resetAt,
    moReset: snap.windows.monthly.resetAt,
    sbMin: snap.sandbox ? snap.sandbox.usedMinutes : null,
    sbReset: snap.sandbox ? snap.sandbox.resetAt : null,
  });
}

export function computeDerived(store, snap, now = Date.now()) {
  const out = { burn: {}, projection: {}, generatedAt: now };
  if (!snap?.windows) return out;
  const { samples } = store.getHistory(now - 24 * 3600 * 1000);

  const rateFor = (field, resetField, lookbackMs) => {
    const pts = samples.filter((s) => now - s.t <= lookbackMs && s[field] != null);
    if (pts.length < 2) return null;
    // 以重置点切段，避免跨越窗口重置造成负数
    let seg = pts;
    for (let i = pts.length - 1; i > 0; i--) {
      if (pts[i][resetField] !== pts[i - 1][resetField]) {
        seg = pts.slice(i);
        break;
      }
    }
    if (seg.length < 2) return null;
    const first = seg[0];
    const last = seg[seg.length - 1];
    const dUsed = last[field] - first[field];
    const dTime = last.t - first.t;
    if (dTime < 60_000 || dUsed < 0) return null;
    // 单位是「额度点/小时」，不是美元；旧字段名 usdPerHour 留着兼容，新代码读 pointsPerHour
    return { pointsPerHour: (dUsed / dTime) * 3600_000, spanMs: dTime, points: seg.length };
  };

  const plan = [
    ['fiveHour', 'fh', 'fhReset', 5 * 3600_000],
    ['weekly', 'wk', 'wkReset', 24 * 3600_000],
    ['monthly', 'mo', 'moReset', 24 * 3600_000],
  ];

  for (const [key, field, resetField, lookback] of plan) {
    const w = snap.windows[key];
    const rate = rateFor(field, resetField, lookback);
    out.burn[key] = rate ? { ...rate, pointsPerHour: round2(rate.pointsPerHour), usdPerHour: round2(rate.pointsPerHour) } : null;
    const proj = {
      remainingUsd: w.remaining,
      resetsInMs: w.resetsInMs,
      resetsAt: w.resetAt,
      exhaustsAt: null,
      hoursToExhaust: null,
      exhaustBeforeReset: null,
      neededRateToLast: null,
      dailyBudget: null,
    };
    if (w.resetsInMs && w.resetsInMs > 0) {
      proj.neededRateToLast = round2(w.remaining / (w.resetsInMs / 3600_000));
    }
    if (w.resetAt && w.windowMs) {
      proj.dailyBudget = round2(w.cap / (w.windowMs / 86400000));
    }
    if (rate && rate.pointsPerHour > 0.0001) {
      const hoursLeft = w.remaining / rate.pointsPerHour;
      proj.exhaustsAt = now + hoursLeft * 3600_000;
      proj.hoursToExhaust = round2(hoursLeft);
      proj.exhaustBeforeReset = Boolean(w.resetsInMs && proj.exhaustsAt < w.resetAt);
      // 窗口会先重置时，「3d 15h 后用完」这种数字没有意义（重置就归零了），
      // 只保留「能撑到重置」这个结论；真的撑不到重置时才需要显示具体时刻
      if (w.resetsInMs > 0 && !proj.exhaustBeforeReset) {
        proj.hoursToExhaust = null;
        proj.exhaustsAt = null;
      }
    }
    out.projection[key] = proj;
  }
  return out;
}

/** 本地日期键 YYYY-MM-DD（按运行机器的时区分组，和用户看到的日期一致） */
function localDayKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 本计费周期内「按天」的用量增量，供总览页两张卡的迷你柱状图使用。
 *
 * 每个采样点的 tok / req 是「周期累计值」，所以单日增量 = 当天最后一条 - 当天之前最近一条。
 * 基线取「上一条采样」（哪怕那一天在本机没有记录，也用它当起点），避免跨天把前一天的量算进来。
 */
export function dailySeries(store, snap) {
  const start = snap?.plan?.currentPeriodStart ? Date.parse(snap.plan.currentPeriodStart) : null;
  const end = snap?.plan?.currentPeriodEnd ? Date.parse(snap.plan.currentPeriodEnd) : null;
  const { samples } = store.getHistory(0);
  const days = [];

  let prev = null;
  const byDay = new Map();
  for (const s of samples) {
    if (s.tok == null && s.req == null) continue;
    if (start != null && s.t < start) {
      prev = s;
      continue;
    }
    const key = localDayKey(s.t);
    const bucket = byDay.get(key);
    if (!bucket) {
      // 周期内第一天的基线是「周期开始时的累计值」= 0；之后的每天用前一天最后一条当基线
      const inPeriod = prev && !(start != null && prev.t < start);
      byDay.set(key, {
        date: key,
        baseTok: inPeriod ? prev.tok : 0,
        baseReq: inPeriod ? prev.req : 0,
        last: s,
      });
    } else {
      bucket.last = s;
    }
    prev = s;
  }

  for (const b of byDay.values()) {
    const tok = b.baseTok != null && b.last.tok != null ? Math.max(0, b.last.tok - b.baseTok) : 0;
    const req = b.baseReq != null && b.last.req != null ? Math.max(0, b.last.req - b.baseReq) : 0;
    days.push({ date: b.date, tok, req });
  }
  days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return { days, periodStart: start, periodEnd: end };
}

/**
 * 云端沙箱按天用量（分钟）。沙箱按自然月重置，和账单周期不是同一个口径，
 * 所以单独算一条：月度基线在 resetAt 变化或跨月时归零。
 */
export function sandboxSeries(store, snap) {
  const sb = snap?.sandbox ?? null;
  const { samples } = store.getHistory(0);
  const days = [];
  const byDay = new Map();

  let prev = null;
  let monthKey = null;
  for (const s of samples) {
    if (s.sbMin == null) continue;
    const resetKey = s.sbReset ?? null;
    // 重置时间变了 = 进入新的自然月，累计值回到 0
    if (monthKey !== null && resetKey !== monthKey) {
      prev = { ...s, sbMin: 0 };
      monthKey = resetKey;
      byDay.clear();
    } else if (monthKey === null) {
      monthKey = resetKey;
    }
    const key = localDayKey(s.t);
    const bucket = byDay.get(key);
    if (!bucket) {
      byDay.set(key, { date: key, base: prev ? prev.sbMin : 0, last: s });
    } else {
      bucket.last = s;
    }
    prev = s;
  }

  for (const b of byDay.values()) {
    const mins = b.base != null && b.last.sbMin != null ? Math.max(0, b.last.sbMin - b.base) : 0;
    days.push({ date: b.date, min: round1(mins) });
  }
  days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return { days, resetAt: sb?.resetAt ?? null, limitMinutes: sb?.limitMinutes ?? 0 };
}

function round1(v) {
  return Number.isFinite(v) ? Math.round(v * 10) / 10 : 0;
}
