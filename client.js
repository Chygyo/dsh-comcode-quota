window.__ModuleLoader__.load({
  id: 'dsh-comcode-quota',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var React = require('react');
    var h = React.createElement;
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useMemo = React.useMemo;
    var useCallback = React.useCallback;
    var useRef = React.useRef;

    /* ------------------------------------------------------------ 常量 */

    var PANEL_ID = 'dsh-comcode-quota';
    var PANEL_ORDER = 40;
    var NS = 'dsh-comcode-quota';
    var ROUTE = 'api/dsh-comcode-quota';

    /* ------------------------------------------------------------ 词典 */

    var ZH = {
      'byModel.totalRequests': '{n} 次请求',
      'byModel.totalTokens': '{n} tokens',
      'byModel.totalCredits': '消耗 {n} 额度',
      'byModel.updated': '{age} 前更新',
      'byModel.title': '按模型用量',
      'byModel.model': '模型 / 工具',
      'byModel.requests': '请求数',
      'byModel.tokens': 'TOKEN 数',
      'byModel.share': '额度占比',
      'byModel.filter': '筛选模型',
      'byModel.retry': '重试',
      'byModel.empty': '暂时没有按模型的用量数据',
      'byModel.noMatch': '没有匹配的模型',
      'byModel.hint': '这条通道要用浏览器里 commandcode.ai 的登录态才能取到。',
      'entry.label': '额度',
      'panel.title': 'Command Code 额度',
      'panel.refresh': '刷新',
      'panel.refreshing': '刷新中…',
      'panel.never': '还没拉取过',
      'tabs.overview': '概览',
      'tabs.bymodel': '模型用量',
      'tabs.pricing': '模型价目表',
      'tabs.settings': '设置',
      'tabs.diagnostics': '诊断',
      'unit.point': '点',
      'unit.hour': '小时',
      'unit.min': '分',
      'unit.sec': '秒',
      'unit.day': '天',
      'window.fiveHour': '5 小时限制',
      'window.weekly': '每周限制',
      'window.monthly': '每月限制',
      'window.used': '已用',
      'window.resetsIn': '重置倒计时',
      'window.burnRate': '消耗速度',
      'window.exhaustsIn': '预计用完',
      'window.exhaustsBeforeReset': '撑不到重置',
      'window.lastsUntilReset': '能撑到重置',
      'window.neededRate': '可承受速度',
      'window.dailyBudget': '每日预算',
      'window.exceeded': '已触发限制',
      'overview.remainingCredits': '剩余额度',
      'overview.totalPool': '共 {total}',
      'overview.spent': '已花费',
      'overview.plan': '套餐',
      'overview.periodLeft': '本周期剩余',
      'overview.stale': '数据已过期 {age}',
      'overview.warn': '剩余额度偏低',
      'overview.critical': '剩余额度告急',
      'overview.emptyTitle': '暂无数据',
      'overview.noCredential': '没找到 API Key：去「设置」选凭据来源，或填入手动 Key。',
      'setup.title': '还差一步：让插件拿到 Command Code 的 Key',
      'setup.lead': '插件只是替你读 Command Code 的用量，Key 留在本机，不会发到别的地方。下面四条路走通任意一条就行，插件会自动挨个尝试。',
      'setup.step1': '第 1 步 · 去哪拿 Key',
      'setup.step1Body': '登录 commandcode.ai，在设置里的 API Keys 页面新建一个，复制出来。',
      'setup.openKeyPage': '打开 Key 页面',
      'setup.step2': '第 2 步 · 把它交给 DSH（推荐）',
      'setup.step2Body': '打开 DSH 设置 → 模型服务，找到 Command Code，把 Key 填进 COMMANDCODE_API_KEY。插件下次刷新就直接用上，不用再管。',
      'setup.step3': '第 3 步 · 回来点一下重测',
      'setup.step3Body': '插件会立刻重读上面四条来源，不用重启 DSH。',
      'setup.recheck': '重新检测',
      'setup.rechecking': '正在检测…',
      'setup.altTitle': '或者用下面任意一条',
      'setup.altEnv': '启动 DSH 时带上环境变量 CMD_GOAT_API_KEY=…',
      'setup.altCli': '装好 Command Code CLI 并跑一次 cmd 登录（写 ~/.commandcode/auth.json）',
      'setup.altManual': '在下方「设置」页的 API Key 输入框里粘贴一次（只存本机，权限 600）',
      'setup.statusTitle': '四条来源的当前状态',
      'setup.found': '已就绪',
      'setup.missing': '未配置',
      'setup.keyUrl': 'Key 页面：{url}',
      'setup.stillMissing': '还是没找到 Key。确认已经保存后再点一次，或者换下面另一条路。',
      'setup.foundNow': '找到了：{source}',
      'byModel.noSession': '模型用量要读浏览器里的登录态',
      'byModel.noSessionBody': '这个页面按模型拆用量，数据在 commandcode.ai 的登录会话里，插件读不到 API Key 那一份。你只要在这个浏览器里登录过一次 commandcode.ai 就够。',
      'byModel.sessionStep1': '在 {browser} 里打开 commandcode.ai 并登录',
      'byModel.sessionStep2': '回到这里点「重新检测」',
      'byModel.sessionOk': '浏览器登录态：已读到',
      'byModel.sessionNone': '没读到登录态 —— 先在上面的浏览器里登录一次',
      'byModel.sessionNoBrowser': '这台机器上没找到支持的浏览器（支持 Edge / Chrome / Brave / Arc / Vivaldi）',
      'byModel.openSite': '打开 commandcode.ai',
      'byModel.recheck': '重新检测',
      'overview.account': '账号',
      'overview.updated': '更新于 {age} 前',
      'stats.tokens': 'TOKEN 总数',
      'stats.requests': '运行总次数',
      'stats.coverage': '本周期内已用 {hit} 天（共 {total} 天）。',
      'stats.noDaily': '本周期还没有按天的记录 —— 面板开着就会自动累积。',
      'stats.cloud': 'CLOUD',
      'stats.minThisMonth': '分钟（本月）',
      'stats.cloudNote': '按分钟计费 · {date} 重置',
      'pricing.title': '模型价目表',
      'pricing.model': '模型',
      'pricing.input': '输入 $/M',
      'pricing.cacheRead': '缓存读 $/M',
      'pricing.output': '输出 $/M',
      'pricing.perRequest': '单次估算',
      'pricing.capacity': '还能跑',
      'pricing.free': '免费',
      'pricing.estimateFor': '估算窗口',
      'pricing.noSnapshot': '先拉一次快照才能估算剩余次数。',
      'pricing.filter': '筛选模型',
      'pricing.empty': '没有匹配的模型。',
      'pricing.generatedAt': '价目表生成于 {when}',
      'pricing.freeTag': '免费',
      'pricing.context': '上下文长度',
      'pricing.officialNote': '「还能跑」按官方给的分窗口次数 × 剩余比例折算。「单次估算」按一次典型请求（新输入 {in} / 缓存读 {cache} / 输出 {out} tokens）的 token 报价算，和额度点不是同一单位，只用来横向比较模型贵贱。',
      'settings.credentials': '凭据',
      'settings.credentialsMode': '凭据来源',
      'settings.auto': '自动（DSH 凭据库 / 环境变量 / CLI 登录态）',
      'settings.manual': '手动填 API Key',
      'settings.manualKey': 'API Key',
      'settings.manualKeyPlaceholder': '粘贴你的 Command Code API Key',
      'settings.manualKeySaved': '已保存：{masked}',
      'settings.apiBaseUrl': 'API 地址',
      'settings.refresh': '数据刷新',
      'settings.autoRefresh': '自动刷新',
      'settings.refreshInterval': '服务端抓取间隔（秒）',
      'settings.refreshIntervalHint': '控制宿主多久向上游拉一次数据（15–3600 秒）；面板自己读宿主缓存，最快 5 秒、最慢 30 秒刷新一次。',
      'settings.requestTimeout': '请求超时（毫秒）',
      'settings.history': '历史',
      'settings.historyEnabled': '记录采样历史',
      'settings.historyRetention': '历史保留（天）',
      'settings.clearHistory': '采样历史数据',
      'settings.clear': '清空',
      'settings.clearConfirm': '确认清空？',
      'settings.cleared': '采样历史已清空。',
      'settings.thresholds': '告警阈值',
      'settings.warn': '告警于已用 %',
      'settings.critical': '告急于已用 %',
      'settings.save': '保存',
      'settings.saved': '已保存',
      'settings.discard': '放弃改动',
      'settings.reset': '恢复默认',
      'settings.resetConfirm': '把所有设置恢复成默认值？',
      'settings.note': 'Key 只写在本机的 $DSH_HOME/dsh-comcode-quota/settings.json（0600 权限），不会上传。',
      'diagnostics.version': '版本',
      'diagnostics.credential': '凭据',
      'diagnostics.source': '来源',
      'diagnostics.dataDir': '数据目录',
      'diagnostics.interval': '刷新间隔',
      'diagnostics.samples': '采样点数',
      'diagnostics.lastFetch': '最近拉取',
      'diagnostics.errors': '错误',
      'diagnostics.noErrors': '没有错误',
      'diagnostics.log': '最近日志',
      'diagnostics.copy': '复制诊断信息',
      'diagnostics.reload': '重新加载',
      'diagnostics.copied': '已复制',
      'diagnostics.node': 'Node',
      'diagnostics.latency': '接口耗时',
      'diagnostics.copyFailed': '复制失败',
      'common.loading': '加载中…',
      'common.error': '出错了',
      'common.retry': '重试',
      'common.cancel': '取消',
      'common.yes': '是',
      'common.no': '否',
    };

    var EN = {
      'byModel.totalRequests': '{n} requests',
      'byModel.totalTokens': '{n} tokens',
      'byModel.totalCredits': '{n} credits used',
      'byModel.updated': 'Updated {age} ago',
      'byModel.title': 'Usage by model',
      'byModel.model': 'Model / tool',
      'byModel.requests': 'Requests',
      'byModel.tokens': 'Tokens',
      'byModel.share': 'Credit share',
      'byModel.filter': 'Filter models',
      'byModel.retry': 'Retry',
      'byModel.empty': 'No per-model usage yet',
      'byModel.noMatch': 'No matching models',
      'byModel.hint': 'This channel needs a signed-in commandcode.ai session in your browser.',
      'entry.label': 'Quota',
      'panel.title': 'Command Code quota',
      'panel.refresh': 'Refresh',
      'panel.refreshing': 'Refreshing…',
      'panel.never': 'Not fetched yet',
      'tabs.overview': 'Overview',
      'tabs.bymodel': 'Usage by model',
      'tabs.pricing': 'Model pricing',
      'tabs.settings': 'Settings',
      'tabs.diagnostics': 'Diagnostics',
      'unit.point': 'pt',
      'unit.hour': 'h',
      'unit.min': 'm',
      'unit.sec': 's',
      'unit.day': 'd',
      'window.fiveHour': '5-hour limit',
      'window.weekly': 'Weekly limit',
      'window.monthly': 'Monthly limit',
      'window.used': 'Used',
      'window.resetsIn': 'Resets in',
      'window.burnRate': 'Burn rate',
      'window.exhaustsIn': 'Runs out in',
      'window.exhaustsBeforeReset': 'Runs out before reset',
      'window.lastsUntilReset': 'Lasts until reset',
      'window.neededRate': 'Affordable burn',
      'window.dailyBudget': 'Daily budget',
      'window.exceeded': 'Limit reached',
      'overview.remainingCredits': 'Remaining credits',
      'overview.totalPool': 'of {total}',
      'overview.spent': 'Spent',
      'overview.plan': 'Plan',
      'overview.periodLeft': 'Left this period',
      'overview.stale': 'Data is {age} old',
      'overview.warn': 'Remaining credit is getting low',
      'overview.critical': 'Remaining credit is critically low',
      'overview.emptyTitle': 'No data yet',
      'overview.noCredential': 'No API key found. Pick a credential source in Settings, or paste a manual key.',
      'setup.title': 'One step left: give the plugin a Command Code key',
      'setup.lead': 'The plugin only reads your Command Code usage; the key stays on this machine. Any one of the four paths below works — the plugin tries them in order.',
      'setup.step1': 'Step 1 · Get a key',
      'setup.step1Body': 'Sign in to commandcode.ai, open Settings → API Keys, create one and copy it.',
      'setup.openKeyPage': 'Open the key page',
      'setup.step2': 'Step 2 · Hand it to DSH (recommended)',
      'setup.step2Body': 'Open DSH Settings → Model providers, find Command Code, and put the key in COMMANDCODE_API_KEY. The next refresh picks it up automatically.',
      'setup.step3': 'Step 3 · Come back and re-check',
      'setup.step3Body': 'The plugin re-reads all four sources right away — no need to restart DSH.',
      'setup.recheck': 'Check again',
      'setup.rechecking': 'Checking…',
      'setup.altTitle': 'Or use any of these instead',
      'setup.altEnv': 'Start DSH with CMD_GOAT_API_KEY=… in the environment',
      'setup.altCli': 'Install the Command Code CLI and run its login once (writes ~/.commandcode/auth.json)',
      'setup.altManual': 'Paste it once into the API key field on the Settings tab (local only, mode 600)',
      'setup.statusTitle': 'Current state of all four sources',
      'setup.found': 'ready',
      'setup.missing': 'not configured',
      'setup.keyUrl': 'Key page: {url}',
      'setup.stillMissing': 'Still no key. Save it, then check again — or try another path below.',
      'setup.foundNow': 'Found it: {source}',
      'byModel.noSession': 'Usage by model needs your browser session',
      'byModel.noSessionBody': 'This page splits usage per model, and that data lives in the commandcode.ai login session — not in the API key. Signing in to commandcode.ai once in this browser is enough.',
      'byModel.sessionStep1': 'Open commandcode.ai in {browser} and sign in',
      'byModel.sessionStep2': 'Come back here and click "Check again"',
      'byModel.sessionOk': 'Browser session: found',
      'byModel.sessionNone': 'No browser session found — sign in to the browser above first',
      'byModel.sessionNoBrowser': 'No supported browser found on this machine (Edge / Chrome / Brave / Arc / Vivaldi)',
      'byModel.openSite': 'Open commandcode.ai',
      'byModel.recheck': 'Check again',
      'overview.account': 'Account',
      'overview.updated': 'Updated {age} ago',
      'stats.tokens': 'Total tokens',
      'stats.requests': 'Total requests',
      'stats.coverage': 'Used on {hit} of {total} days this period.',
      'stats.noDaily': 'No per-day data in this period yet — it accumulates while the panel runs.',
      'stats.cloud': 'CLOUD',
      'stats.minThisMonth': 'min this month',
      'stats.cloudNote': 'Billed per minute · month resets {date}',
      'pricing.title': 'Model pricing',
      'pricing.model': 'Model',
      'pricing.input': 'Input $/M',
      'pricing.cacheRead': 'Cache read $/M',
      'pricing.output': 'Output $/M',
      'pricing.perRequest': 'Est. per request',
      'pricing.capacity': 'Requests left',
      'pricing.free': 'Free',
      'pricing.estimateFor': 'Estimate for',
      'pricing.noSnapshot': 'Fetch a snapshot first to estimate remaining requests.',
      'pricing.filter': 'Filter models',
      'pricing.empty': 'No matching model.',
      'pricing.generatedAt': 'Pricing generated {when}',
      'pricing.freeTag': 'Free',
      'pricing.context': 'Context window',
      'pricing.officialNote': 'Requests left = official window count × remaining ratio. The per-request figure assumes a typical request of {in} fresh input / {cache} cache-read / {out} output tokens priced by token; it is not in credit units and is only meant for comparing models.',
      'settings.credentials': 'Credentials',
      'settings.credentialsMode': 'Credential source',
      'settings.auto': 'Automatic (DSH credentials / env / CLI login)',
      'settings.manual': 'Manual API key',
      'settings.manualKey': 'API key',
      'settings.manualKeyPlaceholder': 'Paste your Command Code API key',
      'settings.manualKeySaved': 'Saved: {masked}',
      'settings.apiBaseUrl': 'API base URL',
      'settings.refresh': 'Data refresh',
      'settings.autoRefresh': 'Auto refresh',
      'settings.refreshInterval': 'Server fetch interval (seconds)',
      'settings.refreshIntervalHint': 'How often the host pulls from upstream (15–3600s). The panel reads the host cache and refreshes every 5–30s on its own.',
      'settings.requestTimeout': 'Request timeout (ms)',
      'settings.history': 'History',
      'settings.historyEnabled': 'Record sampling history',
      'settings.historyRetention': 'Keep history for (days)',
      'settings.clearHistory': 'Sampling history data',
      'settings.clear': 'Clear',
      'settings.clearConfirm': 'Confirm?',
      'settings.cleared': 'Sampling history cleared.',
      'settings.thresholds': 'Thresholds',
      'settings.warn': 'Warn at used %',
      'settings.critical': 'Critical at used %',
      'settings.save': 'Save',
      'settings.saved': 'Saved',
      'settings.discard': 'Discard changes',
      'settings.reset': 'Reset to defaults',
      'settings.resetConfirm': 'Reset every setting to its default value?',
      'settings.note': 'The key is written only to $DSH_HOME/dsh-comcode-quota/settings.json (mode 0600) and never uploaded.',
      'diagnostics.version': 'Version',
      'diagnostics.credential': 'Credential',
      'diagnostics.source': 'Source',
      'diagnostics.dataDir': 'Data directory',
      'diagnostics.interval': 'Refresh interval',
      'diagnostics.samples': 'Samples',
      'diagnostics.lastFetch': 'Last fetch',
      'diagnostics.errors': 'Errors',
      'diagnostics.noErrors': 'No errors',
      'diagnostics.log': 'Recent log',
      'diagnostics.copy': 'Copy diagnostics',
      'diagnostics.reload': 'Reload',
      'diagnostics.copied': 'Copied',
      'diagnostics.node': 'Node',
      'diagnostics.latency': 'API latency',
      'diagnostics.copyFailed': 'Copy failed',
      'common.loading': 'Loading…',
      'common.error': 'Something went wrong',
      'common.retry': 'Retry',
      'common.cancel': 'Cancel',
      'common.yes': 'Yes',
      'common.no': 'No',
    };

    var boundT;
    function t(key, vars) {
      var text;
      if (boundT) {
        try {
          text = boundT(key, vars);
        } catch (err) {
          text = undefined;
        }
      }
      if (text === undefined || text === null || text === '') text = pick(key);
      if (text === undefined || text === null) text = key;
      if (vars) {
        Object.keys(vars).forEach(function (name) {
          text = String(text).split('{' + name + '}').join(String(vars[name]));
        });
      }
      return String(text);
    }
    function pick(key) {
      var lang = 'zh';
      try {
        if (typeof document !== 'undefined') lang = document.documentElement.lang || 'zh';
      } catch (err) {
        /* ignore */
      }
      var dict = String(lang).toLowerCase().indexOf('en') === 0 ? EN : ZH;
      return dict[key];
    }

    /* ------------------------------------------------------------ 格式化 */

    function num(v, digits) {
      var n = Number(v);
      if (v === null || v === undefined || !isFinite(n)) return '—';
      var d = digits === undefined ? 2 : digits;
      // 大数字加千分位，否则 101439491 这种 Token 数一眼看不出量级
      var fixed = n.toFixed(d);
      var parts = fixed.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return parts.join('.');
    }

    /** 按量级自动选小数位：$0.000518 不能被抹成 $0.00，$65.28 也不需要 5 位 */
    function autoDigits(n, wide) {
      var abs = Math.abs(n);
      if (abs === 0) return 2;
      if (abs < 0.0001) return wide ? 5 : 6;
      if (abs < 0.01) return wide ? 4 : 5;
      if (abs < 1) return wide ? 3 : 4;
      return 2;
    }

    function money(v, digits) {
      var n = Number(v);
      if (v === null || v === undefined || !isFinite(n)) return '—';
      return '$' + n.toFixed(digits === undefined ? autoDigits(n, true) : digits);
    }

    /**
     * 额度点（credit point）。注意「点」和美元是两个量纲：
     * hero 里的「已花费」来自 summary.totalCost 是真美元，窗口卡里的已用/剩余/速度都是点。
     * 两者数值眼下接近（GOAT 定价 1 点≈1 美元），但换模型或缓存命中率一变就会分叉，
     * 所以绝不能共用 $ 前缀。
     */
    function points(v, digits) {
      var n = Number(v);
      if (v === null || v === undefined || !isFinite(n)) return '—';
      var d = digits === undefined ? (Math.abs(n) < 1 ? 3 : 2) : digits;
      return num(n, d) + ' ' + t('unit.point');
    }

    function pointsPerHour(v) {
      if (v === null || v === undefined || !isFinite(Number(v))) return '—';
      return points(v) + '/' + t('unit.hour');
    }

    function price(v, digits) {
      var n = Number(v);
      if (v === null || v === undefined || !isFinite(n)) return '—';
      if (n === 0) return '0';
      // 价目表是 $/M token 的单价；列内固定小数位（见 PRICE_COLUMNS.digits）
      return n.toFixed(digits === undefined ? autoDigits(n, false) : digits);
    }

    function pct(v) {
      var n = Number(v);
      if (v === null || v === undefined || !isFinite(n)) return '—';
      // 同一屏不能出现 36.0% 和 36% 两种精度，统一留 1 位（满 100 才取整）
      return (n >= 100 ? n.toFixed(0) : n.toFixed(1)) + '%';
    }

    function duration(ms) {
      var n = Number(ms);
      if (ms === null || ms === undefined || !isFinite(n) || n <= 0) return '—';
      var s = Math.round(n / 1000);
      var d = Math.floor(s / 86400);
      var hr = Math.floor((s % 86400) / 3600);
      var m = Math.floor((s % 3600) / 60);
      var sec = s % 60;
      if (d > 0) return d + t('unit.day') + ' ' + hr + t('unit.hour');
      if (hr > 0) return hr + t('unit.hour') + ' ' + m + t('unit.min');
      if (m > 0) return m + t('unit.min') + ' ' + sec + t('unit.sec');
      return sec + t('unit.sec');
    }

    function hourLabel(ts) {
      if (!ts) return '—';
      try {
        var d = new Date(ts);
        if (isNaN(d.getTime())) return '—';
        var mo = String(d.getMonth() + 1).padStart(2, '0');
        var dd = String(d.getDate()).padStart(2, '0');
        var hh = String(d.getHours()).padStart(2, '0');
        var mm = String(d.getMinutes()).padStart(2, '0');
        return mo + '-' + dd + ' ' + hh + ':' + mm;
      } catch (err) {
        return '—';
      }
    }

    /* ------------------------------------------------------------ 接口 */

    function ApiError(message, status) {
      this.message = message;
      this.status = status;
    }
    ApiError.prototype = Object.create(Error.prototype);
    ApiError.prototype.constructor = ApiError;

    async function request(path, options) {
      var opts = options || {};
      var headers = new Headers();
      var init = { method: opts.method || 'GET', headers: headers, credentials: 'same-origin' };
      if (opts.body !== undefined) {
        headers.set('content-type', 'application/json');
        init.body = JSON.stringify(opts.body);
      }
      var response;
      try {
        response = await fetch(ROUTE + path, init);
      } catch (err) {
        throw new ApiError((err && err.message) || 'network error', 0);
      }
      var body;
      try {
        body = await response.json();
      } catch (err) {
        body = undefined;
      }
      if (!response.ok) {
        var message =
          body && typeof body === 'object' && typeof body.error === 'string' ? body.error : 'HTTP ' + response.status;
        throw new ApiError(message, response.status);
      }
      return body;
    }

    var api = {
      state: function () {
        return request('/state');
      },
      refresh: function () {
        return request('/refresh', { method: 'POST' });
      },
      settings: function () {
        return request('/settings');
      },
      saveSettings: function (patch) {
        return request('/settings', { method: 'POST', body: patch });
      },
      clearHistory: function () {
        return request('/history-clear', { method: 'POST' });
      },
      pricing: function (profile) {
        var q = [];
        if (profile) {
          if (profile.freshInputTokens !== undefined) q.push('in=' + encodeURIComponent(profile.freshInputTokens));
          if (profile.cacheReadTokens !== undefined) q.push('cache=' + encodeURIComponent(profile.cacheReadTokens));
          if (profile.outputTokens !== undefined) q.push('out=' + encodeURIComponent(profile.outputTokens));
        }
        return request('/pricing' + (q.length ? '?' + q.join('&') : ''));
      },
      diagnostics: function () {
        return request('/diagnostics');
      },
      byModel: function () {
        return request('/by-model');
      },
      refreshByModel: function () {
        return request('/by-model/refresh', { method: 'POST' });
      },
      probeByModel: function () {
        return request('/by-model/probe', { method: 'POST' });
      },
      probeCredentials: function () {
        return request('/credentials/probe', { method: 'POST' });
      },
    };

    /* ------------------------------------------------------------ 样式 */

    var css = `
.ccq_root{height:100%;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:var(--dsw-font-family);overflow:hidden}

/* 标题行的尺度照抄同宿主里「上下文洞察」面板：
   顶部留白 + 20px/500 字重标题 + 右侧胶囊按钮，这样两个面板并排看是一套体系。 */
.ccq_head{flex:none;display:flex;align-items:center;gap:14px;padding:0 22px;padding-top:calc(28px + var(--dsh-frame-top-clearance,0px));margin-bottom:24px;flex-wrap:wrap}
/* 不吃满整行：按钮要紧挨标题，而不是被推到面板最右边 */
.ccq_headText{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center}
.ccq_title{flex:0 auto;min-width:0;margin:0 8px 0 0;font-size:20px;font-weight:500;line-height:28px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* 副标题挪到标题下面一行，不再和标题抢同一行的高度 */
.ccq_sub{margin:2px 0 0;font-size:11.5px;line-height:18px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ccq_headActions{flex:none;display:flex;align-items:center;gap:8px}
.ccq_bannerText{min-width:0;overflow-wrap:anywhere}
.ccq_hintTight{margin-top:4px}

.ccq_btn{color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-specific-input-major);border-radius:9px;padding:6px 12px;font-size:12.5px;font-family:inherit;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s}
.ccq_btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.ccq_btn:disabled{opacity:.5;cursor:default}.ccq_btnPrimary{color:var(--dsw-alias-label-primary-foreground);background:var(--dsw-alias-button-primary-fill);border-color:transparent}
.ccq_btnPrimary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}
.ccq_btnDanger{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-border-l1)}

.ccq_tabs{flex:none;display:flex;gap:2px;padding:0 22px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.ccq_tab{position:relative;border:none;background:none;cursor:pointer;font-family:inherit;font-size:13px;color:var(--dsw-alias-label-secondary);padding:7px 11px 9px;border-radius:7px 7px 0 0}
.ccq_tab:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}
.ccq_tab[data-active]{color:var(--dsw-alias-label-primary);font-weight:600}
.ccq_tab[data-active]:after{content:"";position:absolute;left:9px;right:9px;bottom:-1px;height:2px;border-radius:2px;background:var(--dsw-alias-state-business-primary)}
.ccq_btn:focus-visible{outline:2px solid var(--dsw-alias-state-focus-primary);outline-offset:2px}
.ccq_btnGhost{background:none;border-color:var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary)}
.ccq_btnGhost:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.ccq_tab:focus-visible{outline:2px solid var(--dsw-alias-state-focus-primary);outline-offset:-2px}
.ccq_segBtn:focus-visible{outline:2px solid var(--dsw-alias-state-focus-primary);outline-offset:-2px}

/* 面板随窗口自适应：body 是唯一的滚动容器，子项一律不参与压缩（flex-shrink:0），
   否则内容变多时 flex 会先把子项挤扁、配上下面的 overflow:hidden 直接裁掉最后一行。 */
.ccq_body{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:18px 22px 28px;display:flex;flex-direction:column;gap:16px;scrollbar-width:thin}
.ccq_body > *{flex:0 0 auto;min-width:0}
.ccq_body:focus{outline:none}

.ccq_banner{display:flex;align-items:center;gap:9px;padding:9px 13px;border-radius:10px;font-size:12.5px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-specific-input-major)}
.ccq_banner[data-tone="warn"]{border-color:var(--dsw-alias-state-warn-primary)}
.ccq_banner[data-tone="warn"] .ccq_bannerIcon{color:var(--dsw-alias-state-warn-label)}
.ccq_banner[data-tone="error"]{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}

/* 顶部一行：账号 + 最近拉取时刻（老版本这些散在底部明细里，占两行还和上面重复） */
.ccq_topMeta{display:flex;align-items:baseline;gap:6px 20px;flex-wrap:wrap;font-size:12px;color:var(--dsw-alias-label-secondary);padding:0 2px}
.ccq_topMetaItem{display:flex;align-items:baseline;gap:7px;min-width:0}
.ccq_topMetaKey{color:var(--dsw-alias-label-secondary);flex:none}
.ccq_topMetaVal{color:var(--dsw-alias-label-primary);min-width:0;word-break:break-word}
.ccq_topMetaVal[data-tone="warn"]{color:var(--dsw-alias-state-warn-label)}
.ccq_hero{display:flex;flex-wrap:wrap;align-items:flex-end;gap:8px 18px;padding:16px 18px;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-specific-input-major)}
.ccq_hero .ccq_bar{flex:1 1 100%;min-width:120px}
.ccq_heroMain{display:flex;align-items:baseline;gap:7px}
.ccq_heroValue{font-size:34px;font-weight:680;letter-spacing:-1px;line-height:1.05}
.ccq_heroOf{font-size:13px;color:var(--dsw-alias-label-tertiary)}
.ccq_heroLabel{font-size:11.5px;color:var(--dsw-alias-label-tertiary);margin-bottom:3px}
.ccq_heroFacts{display:flex;flex-wrap:wrap;gap:6px 22px;margin-left:auto}
.ccq_fact{display:flex;flex-direction:column;gap:2px}
.ccq_factValue{font-size:14px;font-weight:600}
.ccq_factLabel{font-size:11px;color:var(--dsw-alias-label-secondary)}

.ccq_grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(215px,100%),1fr));gap:12px}
.ccq_card{border:1px solid var(--dsw-alias-border-l1);border-radius:13px;padding:13px 15px 14px;background:var(--dsw-specific-input-major);display:flex;flex-direction:column;gap:9px;min-width:0}
.ccq_cardHead{display:flex;align-items:center;justify-content:space-between;gap:8px}
.ccq_cardTitle{font-size:12.5px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.ccq_cardValue{display:flex;align-items:baseline;gap:5px}
.ccq_cardValue strong{font-size:22px;font-weight:660;letter-spacing:-0.5px}
.ccq_cardValue span{font-size:11.5px;color:var(--dsw-alias-label-tertiary)}
.ccq_tag{font-size:10.5px;padding:2px 7px;border-radius:20px;border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-tertiary);white-space:nowrap}
.ccq_tag[data-tone="warn"]{border-color:var(--dsw-alias-state-warn-primary)}
.ccq_tag[data-tone="error"]{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}
.ccq_tag[data-tone="ok"]{color:var(--dsw-alias-state-success-primary);border-color:var(--dsw-alias-state-success-primary)}

.ccq_bar{height:6px;border-radius:6px;background:var(--dsw-alias-border-l1);overflow:hidden;position:relative}
.ccq_barFill{height:100%;border-radius:6px;background:var(--dsw-alias-state-business-primary);transition:width .3s}
.ccq_barFill[data-tone="warn"]{background:var(--dsw-alias-state-warn-primary)}
.ccq_barFill[data-tone="error"]{background:var(--dsw-alias-state-error-primary)}
.ccq_barFill[data-tone="ok"]{background:var(--dsw-alias-state-success-primary)}
.ccq_meta{display:flex;flex-wrap:wrap;gap:3px 12px;font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.ccq_meta b{font-weight:600;color:var(--dsw-alias-label-secondary)}
.ccq_hint{font-size:11px;color:var(--dsw-alias-label-secondary);line-height:1.6}

.ccq_rows{display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1);border-radius:13px;overflow:hidden}
.ccq_row{display:flex;align-items:baseline;gap:12px;padding:8px 14px;font-size:12.5px;border-top:1px solid var(--dsw-alias-border-l1)}
.ccq_row:first-child{border-top:none}
.ccq_rowKey{flex:none;width:132px;color:var(--dsw-alias-label-tertiary);font-size:12px}
.ccq_rowVal{flex:1;min-width:0;word-break:break-word}
.ccq_mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px}

/* 首次引导：三步说明 + 四条来源的实时状态。不用 Empty 的居中排版 ——
   这里要读的是步骤和链接，居中对齐会让长句很难扫。 */
.ccq_setup{display:flex;flex-direction:column;gap:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:13px;padding:16px 18px;background:var(--dsw-alias-card-fill)}
.ccq_setupLead{margin:0;font-size:12.5px;line-height:1.65;color:var(--dsw-alias-label-secondary)}
.ccq_setupStep{display:flex;gap:11px;align-items:flex-start}
.ccq_setupStepNum{flex:none;width:20px;height:20px;border-radius:50%;background:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-label-primary-foreground);font-size:11.5px;font-weight:600;display:flex;align-items:center;justify-content:center;margin-top:1px}
.ccq_setupStepBody{display:flex;flex-direction:column;gap:4px;min-width:0;font-size:12.5px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
.ccq_setupStepBody strong{color:var(--dsw-alias-label-primary);font-size:12.5px;font-weight:600}
.ccq_setupLink{align-self:flex-start;text-decoration:none;display:inline-block;margin-top:2px}
.ccq_setupActions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:6px}
.ccq_setupOk{font-size:12px;color:var(--dsw-alias-state-success-primary);font-weight:600}
.ccq_setupAlts{margin:2px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:5px;font-size:11.5px;line-height:1.6;color:var(--dsw-alias-label-secondary)}
.ccq_setupRows{margin-top:2px}
.ccq_rowHead{background:var(--dsw-alias-bg-module-platform);font-size:11px;color:var(--dsw-alias-label-secondary)}
.ccq_setupDot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:7px;background:var(--dsw-alias-border-l2)}
.ccq_setupDot[data-ok]{background:var(--dsw-alias-state-success-primary)}
.ccq_setupState{font-weight:600}
.ccq_setupState[data-ok]{color:var(--dsw-alias-state-success-primary)}

/* 本期用量：两张卡，每张一个大数字 + 一条按天迷你柱状图（对齐官网用量页的观感） */
.ccq_stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:14px}
.ccq_stat{border:1px solid var(--dsw-alias-border-l1);border-radius:13px;padding:14px 16px 12px;display:flex;flex-direction:column;gap:10px;min-width:0}
.ccq_statHead{display:flex;align-items:center;gap:7px;min-width:0}
.ccq_statIcon{flex:none;width:14px;height:14px;display:block;color:var(--dsw-alias-chart-tools)}
.ccq_stat[data-tone="amber"] .ccq_statIcon{color:var(--dsw-alias-state-warn-primary)}
.ccq_statLabel{font-size:12px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ccq_statValue{font-size:30px;font-weight:700;line-height:1.1;letter-spacing:-.5px;font-variant-numeric:tabular-nums;word-break:break-word}
/* 柱子区高度固定，柱子按天等分；没有数据的日期只留一条虚线基线，和官网一样 */
.ccq_bars{display:flex;align-items:flex-end;gap:2px;height:62px;padding-top:2px;overflow:hidden}
.ccq_barSlot{flex:1 1 0;min-width:0;height:100%;display:flex;align-items:flex-end}
.ccq_barCol{width:100%;border-radius:2px 2px 0 0;background:var(--dsw-alias-chart-tools);opacity:.55}
.ccq_barBlock{width:100%;height:52px;border-radius:3px;background:var(--dsw-alias-state-success-secondary);opacity:.75}
.ccq_stat[data-tone="amber"] .ccq_barCol{background:var(--dsw-alias-state-warn-primary)}
.ccq_stat[data-tone="cloud"] .ccq_barCol{background:var(--dsw-alias-state-success-primary)}
.ccq_stat[data-tone="cloud"] .ccq_statIcon{color:var(--dsw-alias-state-success-primary)}
/* 官网 CLOUD 卡是大数字后面跟小字单位，不是独立一行 */
.ccq_statValueSuffix{font-size:13px;font-weight:500;letter-spacing:0;color:var(--dsw-alias-label-secondary);margin-left:8px;vertical-align:0.35em}
.ccq_statAxisNote{justify-content:flex-start}
.ccq_barZero{width:100%;border-bottom:1px dashed var(--dsw-alias-border-l1)}
.ccq_statAxis{display:flex;justify-content:space-between;gap:10px;font-size:11px;color:var(--dsw-alias-label-secondary)}
.ccq_statNote{font-size:11px;color:var(--dsw-alias-label-secondary);line-height:1.5;margin:0}

.ccq_toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.ccq_filterBar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 14px}
.ccq_filterInput{max-width:280px;flex:1 1 200px}
.ccq_filterMeta{display:flex;align-items:center;gap:7px;font-size:11.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.ccq_filterSep{color:var(--dsw-alias-label-tertiary)}
.ccq_seg{display:inline-flex;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;overflow:hidden}
.ccq_segBtn{border:none;background:none;cursor:pointer;font-family:inherit;font-size:12px;padding:5px 11px;color:var(--dsw-alias-label-secondary)}
.ccq_segBtn:hover{background:var(--dsw-alias-interactive-bg-hover)}
.ccq_segBtn[data-active]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font-weight:600}
.ccq_spacer{flex:1}

.ccq_table{border:1px solid var(--dsw-alias-border-l1);border-radius:13px;overflow:hidden}
.ccq_tableScroll{overflow-x:auto}
/* 六列走同一套 grid 模板：表头和表体共享列宽，数字才会真正对齐。
   之前用 flex + 固定 flex-basis，列宽随内容漂、右对齐也救不回来。 */
.ccq_tableInner{min-width:720px}
/* 按模型用量表：模型 / 请求数 / TOKEN / 占比条，列比价目表少，单独一套模板 */
.ccq_tableModel{max-height:none}
.ccq_tableInnerModel{min-width:680px}
/* 占比条要给足长度才有辨析度：29% 和 24% 在 100px 的轨道上几乎看不出差别，
   所以把这一列的权重拉到其它列的 3 倍左右，轨道自然长到 300px 上下 */
.ccq_thModel,.ccq_trModel{grid-template-columns:minmax(150px,1.5fr) minmax(64px,0.5fr) minmax(80px,0.55fr) minmax(400px,3.6fr);column-gap:26px}
/* 占比条的第 0 像素必须落在「额度占比」这一列的第 0 像素上，
   所以这里不留左内边距；条与数字之间的呼吸由 column-gap 负责 */
.ccq_cShare{display:flex;align-items:center;gap:9px;min-width:0}
.ccq_cShareBar{flex:1 1 auto;min-width:300px;height:8px;border-radius:4px;background:var(--dsw-alias-interactive-bg-hover);overflow:hidden}
.ccq_cShareFill{height:100%;border-radius:4px;background:var(--dsw-alias-chart-tools);opacity:.72}
.ccq_cShareText{flex:none;width:46px;text-align:right;font-size:11.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.ccq_th,.ccq_tr{display:grid;grid-template-columns:minmax(170px,1.7fr) repeat(4,minmax(76px,0.85fr)) minmax(88px,0.9fr);align-items:center;gap:14px}
/* 表头与表体必须用同一套左右内边距：列宽由 grid 决定，只要左右 padding 不同，
   内容的左边界就会比表头文字偏移几个像素，看起来像没对齐 */
.ccq_th{font-size:11px;letter-spacing:.2px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-module-platform);border-bottom:1px solid var(--dsw-alias-border-l2);padding:8px 16px}
.ccq_tr{padding:9px 16px;font-size:12.5px;border-top:1px solid var(--dsw-alias-border-l1)}
.ccq_tr:nth-child(odd){background:var(--dsw-alias-card-fill)}
.ccq_tr:hover{background:var(--dsw-alias-interactive-bg-hover)}
.ccq_cModel{display:flex;align-items:center;gap:9px;min-width:0}
.ccq_cModelText{display:flex;flex-direction:column;gap:1px;min-width:0;flex:0 1 auto}
.ccq_cModelName{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ccq_cModelNote{font-size:10.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ccq_ctx{flex:none;font-size:10.5px;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);border-radius:6px;padding:1px 5px}
.ccq_freeTag{flex:none;font-size:10px;font-weight:600;color:var(--dsw-alias-state-success-primary);border:1px solid var(--dsw-alias-state-success-primary);border-radius:6px;padding:1px 5px}
/* 数字列一律左对齐：这样每列内容的左边界与列头文字的左边界是同一条线 */
.ccq_cNum{text-align:left;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.ccq_cNum[data-strong]{color:var(--dsw-alias-label-primary);font-weight:600}
.ccq_cNum[data-muted]{color:var(--dsw-alias-label-tertiary)}
/* 可排序表头 */
.ccq_thBtn{display:flex;align-items:center;gap:3px;border:none;background:none;padding:0;margin:0;font-family:inherit;font-size:11px;letter-spacing:.2px;color:inherit;cursor:pointer;min-width:0}
.ccq_thBtn:hover{color:var(--dsw-alias-label-primary)}
.ccq_thBtn[data-active]{color:var(--dsw-alias-label-primary);font-weight:600}
.ccq_thBtn:focus-visible{outline:2px solid var(--dsw-alias-state-focus-primary);outline-offset:2px;border-radius:4px}
.ccq_thBtnText{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ccq_sortMark{font-size:9px;line-height:1}

.ccq_input{box-sizing:border-box;color:var(--dsw-alias-label-primary);background:var(--dsw-specific-input-major);border:1px solid var(--dsw-alias-border-l1);border-radius:9px;padding:6px 10px;font-family:inherit;font-size:12.5px;outline:none;min-width:0;width:100%}
.ccq_input:focus{border-color:var(--dsw-alias-state-focus-primary)}
.ccq_inputNarrow{width:104px}

.ccq_form{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px 18px;align-items:start}
.ccq_field{display:flex;flex-direction:column;gap:5px;min-width:0}
.ccq_label{font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.ccq_radioRow{display:flex;align-items:center;gap:7px;font-size:12.5px;cursor:pointer;padding:2px 0}
.ccq_radioRow input{accent-color:var(--dsw-alias-state-business-primary);margin:0}

.ccq_section{border:1px solid var(--dsw-alias-border-l1);border-radius:13px;padding:14px 16px 16px;display:flex;flex-direction:column;gap:12px}
.ccq_sectionTitle{margin:0;font-size:13px;font-weight:650}
.ccq_btnRow{display:flex;align-items:center;gap:8px;flex-wrap:wrap}

.ccq_pre{margin:0;padding:11px 13px;border:1px solid var(--dsw-alias-border-l1);border-radius:11px;background:var(--dsw-specific-input-major);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;line-height:1.6;color:var(--dsw-alias-label-secondary);white-space:pre-wrap;word-break:break-word;max-height:260px;overflow:auto}

.ccq_empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:44px 20px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12.5px}
.ccq_trEmpty{display:block;padding:26px 16px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12.5px}
.ccq_empty strong{color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:600}
.ccq_loading{padding:40px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12.5px}

/* 面板宽度自适应：默认跟随窗口，窄窗口下逐级收紧留白与字号。
   这些覆盖必须放在样式表最后 —— 同 specificity 下后写的规则才生效。 */
@media (max-width:720px){
  .ccq_statValue{font-size:26px}
  .ccq_head{padding:0 16px;padding-top:calc(20px + var(--dsh-frame-top-clearance,0px));margin-bottom:18px;gap:8px}
  .ccq_tabs{padding:0 16px}
  .ccq_body{padding:16px 16px 24px;gap:14px}
  .ccq_hero{padding:14px 15px}
  .ccq_heroValue{font-size:30px}
  .ccq_heroFacts{margin-left:0;gap:4px 18px}
}
@media (max-width:520px){
  /* 窄面板（例如 390px）下数字列各固定 76px 会横向溢出，压缩列宽并允许模型名换行 */
  .ccq_tableInner{min-width:640px}
  .ccq_th,.ccq_tr{grid-template-columns:minmax(120px,2fr) repeat(4,minmax(72px,1fr)) minmax(78px,1fr);gap:8px;padding:8px 10px}
  .ccq_cModelNote{display:none}
  .ccq_heroValue{font-size:26px}
  .ccq_body{padding:14px 14px 22px}
  /* 行标签（5 小时限制 / 账号 …）在窄屏不再固定 132px，改上下排 */
  .ccq_row{flex-direction:column;align-items:flex-start;gap:3px;padding:8px 12px}
  .ccq_rowKey{width:auto}
  .ccq_title{font-size:16px}
}
`;

    var tagId = 'dsh-comcode-quota/panel.css';
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {
      try {
        var styleTag = document.createElement('style');
        styleTag.dataset.plugin = 'dsh-comcode-quota';
        styleTag.dataset.pluginCss = tagId;
        styleTag.textContent = css;
        document.head.appendChild(styleTag);
      } catch (err) {
        /* 样式注入失败也不能让面板崩掉 */
      }
    }

    /* ------------------------------------------------------------ 小组件 */

    /**
     * 用「·」把若干节点连起来，自动跳过空项。
     *
     * 筛选行右侧的元信息是按条件出现的（生成时间可能没有、额度消耗可能为 0），
     * 手写分隔符很容易出现前导「·」或连着两个「·」，所以统一走这里。
     * key 是必需的：这些节点会作为数组交给 React，没 key 会在控制台刷警告。
     */
    function joinWithSep(nodes) {
      var out = [];
      nodes.forEach(function (node, i) {
        if (node === null || node === undefined || node === false || node === '') return;
        if (out.length) out.push(h('span', { key: 'sep-' + i, className: 'ccq_filterSep' }, '·'));
        out.push(h(React.Fragment, { key: 'item-' + i }, node));
      });
      return out;
    }


    function tone(usedPct, thresholds) {
      var warn = (thresholds && thresholds.warn) || 70;
      var critical = (thresholds && thresholds.critical) || 90;
      if (usedPct >= critical) return 'error';
      if (usedPct >= warn) return 'warn';
      return 'ok';
    }

    function Bar(props) {
      // 进度条不能只靠颜色区分：补上 ARIA 进度语义，色觉障碍用户也能读
      var v = Math.max(0, Math.min(100, Number(props.value) || 0));
      return h(
        'div',
        {
          className: 'ccq_bar',
          role: 'progressbar',
          'aria-valuenow': Math.round(v),
          'aria-valuemin': 0,
          'aria-valuemax': 100,
          'aria-label': props.label || undefined,
        },
        h('div', {
          className: 'ccq_barFill',
          'data-tone': props.tone || 'ok',
          style: { width: v + '%' },
        }),
      );
    }

    function WindowCard(props) {
      var w = props.window;
      var proj = props.projection;
      var burn = props.burn;
      if (!w) return null;
      var tn = tone(w.usedPct, props.thresholds);
      var exhaustTag = null;
      // 「已用尽」是硬事实，优先于任何预测；预测徽章只在真有 burn rate 时出现，没数据就不瞎标
      if (w.exceeded) {
        exhaustTag = h('span', { className: 'ccq_tag', 'data-tone': 'error' }, t('window.exceeded'));
      } else if (proj && proj.exhaustBeforeReset === true) {
        exhaustTag = h('span', { className: 'ccq_tag', 'data-tone': 'error' }, t('window.exhaustsBeforeReset'));
      } else if (proj && proj.exhaustBeforeReset === false) {
        exhaustTag = h('span', { className: 'ccq_tag', 'data-tone': 'ok' }, t('window.lastsUntilReset'));
      }
      return h(
        'div',
        { className: 'ccq_card' },
        h(
          'div',
          { className: 'ccq_cardHead' },
          h('span', { className: 'ccq_cardTitle' }, w.label),
          exhaustTag,
        ),
        h(
          'div',
          { className: 'ccq_cardValue' },
          h('strong', null, num(w.remaining, 2)),
          h('span', null, '/ ' + num(w.cap, 2)),
        ),
        h(Bar, { value: w.usedPct, tone: tn, label: w.label + ' ' + pct(w.usedPct) }),
        h(
          'div',
          { className: 'ccq_meta' },
          h('span', null, t('window.used') + ' ', h('b', null, pct(w.usedPct))),
          h('span', null, t('window.resetsIn') + ' ', h('b', null, duration(w.resetsInMs))),
        ),
        h(
          'div',
          { className: 'ccq_meta' },
          h(
            'span',
            null,
            t('window.burnRate') + ' ',
            h('b', null, burn ? pointsPerHour(burn.pointsPerHour != null ? burn.pointsPerHour : burn.usdPerHour) : '—'),
          ),
          // 能撑到重置的窗口不给「预计用完」——重置就归零了，那个数字没有意义
          proj && proj.hoursToExhaust
            ? h(
                'span',
                null,
                t('window.exhaustsIn') + ' ',
                h('b', null, duration(proj.hoursToExhaust * 3600000)),
              )
            : null,
        ),
        // 撑到重置的速度上限：跟着各自的窗口走，不再单独占一块
        proj && proj.neededRateToLast !== null && proj.neededRateToLast !== undefined
          ? h(
              'div',
              { className: 'ccq_meta' },
              h('span', null, t('window.neededRate') + ' ', h('b', null, pointsPerHour(proj.neededRateToLast))),
              // 5 小时窗口按天折算没有意义（14 点 / 5 小时 ≈ 每天 67 点），只给跨天的窗口算
              w.windowMs >= 86400000 && proj.dailyBudget !== null
                ? h('span', null, t('window.dailyBudget') + ' ', h('b', null, points(proj.dailyBudget)))
                : null,
            )
          : null,
      );
    }

    /**
     * 「要撑到重置该花多慢」三个窗口并成一列对照 —— 同一个量纲放一起才好比，
     * 塞回每张卡里会变成 4 个并排的 /小时 数字，看不出主次。
     * 「每日预算」只对跨度 ≥ 1 天的窗口有意义：5 小时窗口按天折算出的数字是虚的，会误导人。
     */

    function Empty(props) {
      return h(
        'div',
        { className: 'ccq_empty' },
        h('strong', null, props.title),
        props.hint ? h('span', null, props.hint) : null,
        props.action || null,
      );
    }

    function Segmented(props) {
      return h(
        'div',
        { className: 'ccq_seg', role: 'group', 'aria-label': props.label || undefined },
        props.options.map(function (opt) {
          return h(
            'button',
            {
              key: opt.value,
              type: 'button',
              className: 'ccq_segBtn',
              'data-active': props.value === opt.value ? '' : undefined,
              'aria-pressed': props.value === opt.value ? 'true' : 'false',
              onClick: function () {
                props.onChange(opt.value);
              },
            },
            opt.label,
          );
        }),
      );
    }

    /* ------------------------------------------------------------ 首次引导 */

    /**
     * 没拿到 Key 时的完整引导。
     *
     * 为什么不做成一个「错误提示」：新用户看到「没找到 API Key」只会卡住 ——
     * 他不知道 Key 在哪申请、也不知道 DSH 里其实已经有地方能存。
     * 所以这里把「去哪拿 → 存到哪 → 怎么确认生效」写成三步，
     * 再把四条自动来源的实时状态列出来，让用户能自己判断卡在哪一环。
     */
    function SetupGuide(props) {
      var help = props.help || {};
      var steps = help.steps || [];
      var busyState = useState(false);
      var busy = busyState[0];
      var resultState = useState(null);
      var result = resultState[0];

      var recheck = function () {
        busyState[1](true);
        api
          .probeCredentials()
          .then(function (res) {
            resultState[1]({
              ok: Boolean(res && res.credential && res.credential.ok),
              credential: res && res.credential,
              help: res && res.help,
            });
            if (res && res.credential && res.credential.ok && props.onFound) props.onFound();
          })
          .catch(function (e) {
            resultState[1]({ ok: false, error: e.message || String(e) });
          })
          .then(function () {
            busyState[1](false);
          });
      };

      var stepBlock = function (n, titleKey, bodyKey, extra) {
        return h(
          'div',
          { className: 'ccq_setupStep' },
          h('div', { className: 'ccq_setupStepNum' }, String(n)),
          h(
            'div',
            { className: 'ccq_setupStepBody' },
            h('strong', null, t(titleKey)),
            h('span', null, t(bodyKey)),
            extra || null,
          ),
        );
      };

      return h(
        'div',
        { className: 'ccq_setup' },
        h('h3', { className: 'ccq_sectionTitle' }, t('setup.title')),
        h('p', { className: 'ccq_setupLead' }, t('setup.lead')),
        stepBlock(
          1,
          'setup.step1',
          'setup.step1Body',
          h(
            'a',
            {
              className: 'ccq_btn ccq_btnGhost ccq_setupLink',
              href: help.keyUrl || 'https://commandcode.ai/settings/api-keys',
              target: '_blank',
              rel: 'noreferrer noopener',
            },
            t('setup.openKeyPage'),
          ),
        ),
        stepBlock(2, 'setup.step2', 'setup.step2Body'),
        stepBlock(
          3,
          'setup.step3',
          'setup.step3Body',
          h(
            'div',
            { className: 'ccq_setupActions' },
            h(
              'button',
              { type: 'button', className: 'ccq_btn', onClick: recheck, disabled: busy },
              busy ? t('setup.rechecking') : t('setup.recheck'),
            ),
            result && result.ok
              ? h(
                  'span',
                  { className: 'ccq_setupOk' },
                  t('setup.foundNow', { source: (result.credential && result.credential.source) || '' }),
                )
              : result
                ? h('span', { className: 'ccq_hint' }, result.error || t('setup.stillMissing'))
                : null,
          ),
        ),
        h(
          'ul',
          { className: 'ccq_setupAlts' },
          h('li', null, t('setup.altEnv')),
          h('li', null, t('setup.altCli')),
          h('li', null, t('setup.altManual')),
        ),
        steps.length
          ? h(
              'div',
              { className: 'ccq_rows ccq_setupRows' },
              h('div', { className: 'ccq_row ccq_rowHead' }, h('span', null, t('setup.statusTitle'))),
              steps.map(function (s) {
                return h(
                  'div',
                  { key: s.id, className: 'ccq_row' },
                  h(
                    'span',
                    { className: 'ccq_rowKey' },
                    h('span', { className: 'ccq_setupDot', 'data-ok': s.ok ? '' : undefined }),
                    s.label,
                  ),
                  h(
                    'span',
                    { className: 'ccq_rowVal' },
                    h(
                      'span',
                      { className: 'ccq_setupState', 'data-ok': s.ok ? '' : undefined },
                      s.ok ? t('setup.found') : t('setup.missing'),
                    ),
                    s.detail && s.detail !== (s.ok ? t('setup.found') : t('setup.missing'))
                      ? h('span', { className: 'ccq_hint' }, ' · ' + s.detail)
                      : null,
                  ),
                );
              }),
            )
          : null,
      );
    }

    /* ------------------------------------------------------------ 本期用量 */

    /** 197604422 → 197.6M：卡片上的大数字，量级一眼可读 */
    function compact(v, digits) {
      var n = Number(v);
      if (v === null || v === undefined || !isFinite(n)) return '—';
      var abs = Math.abs(n);
      var d = digits === undefined ? 1 : digits;
      var units = [
        { scale: 1e12, suffix: 'T' },
        { scale: 1e9, suffix: 'B' },
        { scale: 1e6, suffix: 'M' },
        { scale: 1e3, suffix: 'K' },
      ];
      var pick = -1;
      for (var i = 0; i < units.length; i++) {
        if (abs >= units[i].scale) {
          pick = i;
          break;
        }
      }
      if (pick === -1) return num(n, 0);
      // 四舍五入会撑破这一档（999999 → 「1000.0K」），能升就升一档
      if (pick > 0 && Number((abs / units[pick].scale).toFixed(d)) >= 1e3) pick -= 1;
      return (n / units[pick].scale).toFixed(d) + units[pick].suffix;
    }

    function isEn() {
      try {
        if (typeof document !== 'undefined') return String(document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
      } catch (err) {
        /* ignore */
      }
      return false;
    }

    /** 轴标签：中文「11月21日」，英文「Nov 21」 */
    function dayLabel(ts) {
      var d = new Date(Number(ts));
      if (!isFinite(d.getTime())) return '—';
      if (isEn()) {
        var m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return m[d.getMonth()] + ' ' + d.getDate();
      }
      return d.getMonth() + 1 + '月' + d.getDate() + '日';
    }

    /** 本地日期键，和 Host 侧 dailySeries 的分组口径保持一致 */
    function dayKey(ts) {
      var d = new Date(Number(ts));
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    // 官方 /internal/usage/summary 的 daily 是按 UTC 日切的，用本地日切会整体错位一天，
    // 柱子就落到隔壁槽里。凡是数据来自官方接口的卡都用这个键。
    function dayKeyUTC(ts) {
      var d = new Date(Number(ts));
      return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
    }

    /**
     * 一张统计卡：标签 + 大数字 + 按天迷你柱状图 + 起止日期。
     * 柱子按「计费周期内每一天」等分排布，没数据的天只留一条虚线基线 ——
     * 命中的天数一眼可见，不会因为样本少就把仅有的两根柱子拉满整张卡。
     */
    function StatCard(props) {
      var days = props.days || [];
      var periodStart = Number(props.periodStart);
      var periodEnd = Number(props.periodEnd);
      var byDay = useMemo(
        function () {
          var map = {};
          for (var i = 0; i < days.length; i++) map[days[i].date] = days[i];
          return map;
        },
        [days],
      );

      var slots = useMemo(
        function () {
          if (!isFinite(periodStart) || !isFinite(periodEnd) || periodEnd <= periodStart) return [];
          var out = [];
          var utc = !!props.utc;
          var cursor = new Date(periodStart);
          if (utc) {
            cursor.setUTCHours(0, 0, 0, 0);
          } else {
            cursor.setHours(0, 0, 0, 0);
          }
          var guard = 0;
          while (cursor.getTime() <= periodEnd && guard < 400) {
            var key = utc ? dayKeyUTC(cursor.getTime()) : dayKey(cursor.getTime());
            var hit = byDay[key];
            out.push({ date: key, value: hit ? Number(hit[props.field]) || 0 : 0 });
            if (utc) cursor.setUTCDate(cursor.getUTCDate() + 1);
            else cursor.setDate(cursor.getDate() + 1);
            guard++;
          }
          return out;
        },
        [periodStart, periodEnd, byDay, props.field, props.utc],
      );

      // CLOUD 卡是装饰性的：官网用一排等高色块表示「按分钟计费」，不随用量高低变化，
      // 所以不按比例画柱，别让 0 分钟看起来像「数据缺失」。
      if (props.blocks) {
        var blockCount = 11;
        var blocks = [];
        for (var b = 0; b < blockCount; b++) {
          blocks.push(h('div', { key: 'b' + b, className: 'ccq_barSlot' }, h('div', { className: 'ccq_barBlock' })));
        }
        return h(
          'div',
          { className: 'ccq_stat', 'data-tone': props.tone || undefined },
          h(
            'div',
            { className: 'ccq_statHead' },
            h('svg', {
              className: 'ccq_statIcon',
              viewBox: '0 0 16 16',
              width: 14,
              height: 14,
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '1.4',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              'aria-hidden': 'true',
            }, iconPaths(props.field)),
            h('span', { className: 'ccq_statLabel' }, t(props.label)),
          ),
          h('div', { className: 'ccq_statValue' },
            props.value,
            props.valueSuffix ? h('span', { className: 'ccq_statValueSuffix' }, props.valueSuffix) : null),
          h('div', { className: 'ccq_bars', 'aria-hidden': 'true' }, blocks),
          h('div', { className: 'ccq_statAxis ccq_statAxisNote' }, props.axisNote),
          props.note ? h('p', { className: 'ccq_statNote' }, props.note) : null,
        );
      }

      var peak = 0;
      for (var i = 0; i < slots.length; i++) peak = Math.max(peak, slots[i].value);
      var hasData = peak > 0;

      var bars = slots.length
        ? h(
            'div',
            { className: 'ccq_bars', 'aria-hidden': 'true' },
            slots.map(function (s) {
              var ratio = hasData ? s.value / peak : 0;
              // 有值但极小的那天也得看得见，给 6% 的高度下限
              var pctH = ratio > 0 ? Math.max(6, ratio * 100) : 0;
              return h(
                'div',
                { key: s.date, className: 'ccq_barSlot' },
                pctH > 0 ? h('div', { className: 'ccq_barCol', style: { height: pctH.toFixed(1) + '%' } }) : h('div', { className: 'ccq_barZero' }),
              );
            }),
          )
        : null;

      return h(
        'div',
        { className: 'ccq_stat', 'data-tone': props.tone || undefined },
        h(
          'div',
          { className: 'ccq_statHead' },
          h(
            'svg',
            {
              className: 'ccq_statIcon',
              viewBox: '0 0 16 16',
              width: 14,
              height: 14,
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: '1.4',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              'aria-hidden': 'true',
            },
            iconPaths(props.field),
          ),
          h('span', { className: 'ccq_statLabel' }, t(props.label)),
        ),
        h(
          'div',
          { className: 'ccq_statValue' },
          props.value,
          props.valueSuffix ? h('span', { className: 'ccq_statValueSuffix' }, props.valueSuffix) : null,
        ),
        bars,
        // 官网第三张卡没有起止日期轴，改在底部写一句计费口径
        props.axisNote
          ? h('div', { className: 'ccq_statAxis ccq_statAxisNote' }, props.axisNote)
          : h(
              'div',
              { className: 'ccq_statAxis' },
              h('span', null, periodsLabel(periodStart)),
              h('span', null, periodsLabel(periodEnd)),
            ),
        props.note ? h('p', { className: 'ccq_statNote' }, props.note) : null,
      );
    }

    // 三张卡的图标：TOKEN = 圆+十字，次数 = 播放三角，云端 = 云
    function iconPaths(field) {
      if (field === 'min') {
        return [
          h('path', { key: 'c', d: 'M4.4 11.2a2.6 2.6 0 0 1 .3-5.18 3.5 3.5 0 0 1 6.7.9 2.2 2.2 0 0 1-.4 4.28z' }),
        ];
      }
      if (field === 'req') return [h('path', { key: 'p', d: 'M5.5 3.6 11.6 8l-6.1 4.4z' })];
      return [
        h('circle', { key: 'c', cx: 8, cy: 8, r: 5.6 }),
        h('path', { key: 'x', d: 'M8 5.2v5.6M5.2 8h5.6' }),
      ];
    }

    function periodsLabel(ts) {
      return isFinite(Number(ts)) && Number(ts) > 0 ? dayLabel(ts) : '—';
    }

    /**
     * 本期用量：对齐官网用量页那两张卡（TOKEN 总数 / 运行总次数）。
     * 数据来自 snapshot.periodUsage；按天增量由 Host 侧 dailySeries 算好放进 state.daily。
     */
    function UsageStats(props) {
      var state = props.state || {};
      var snap = state.snapshot || {};
      var usage = snap.periodUsage || {};
      var plan = snap.plan || {};
      var daily = state.daily || {};
      var days = daily.days || [];
      var periodStart = daily.periodStart || (plan.currentPeriodStart ? Date.parse(plan.currentPeriodStart) : null);
      var periodEnd = daily.periodEnd || (plan.currentPeriodEnd ? Date.parse(plan.currentPeriodEnd) : null);
      var hitDays = days.filter(function (d) {
        return Number(d.tok) > 0 || Number(d.req) > 0;
      }).length;
      // 「共几天」要按计费周期实际天数算，不能拿「有数据的天数」当分母（刚装上时只有 1 天，会写成 1/1）
      var totalDays = 0;
      if (isFinite(periodStart) && isFinite(periodEnd) && periodEnd > periodStart) {
        totalDays = Math.round((periodEnd - periodStart) / 86400000);
      }
      // 已过去几天：按 UTC 日算，跟柱子的切天口径保持同一条线；
      // 用「有数据的天数」会误导（没用量的一天也是过去的一天）。
      var elapsedDays = 0;
      if (isFinite(periodStart) && periodStart > 0) {
        var startDay = Math.floor(periodStart / 86400000);
        var todayDay = Math.floor(Date.now() / 86400000);
        elapsedDays = Math.max(0, Math.min(totalDays || 999, todayDay - startDay + 1));
      }
      // 只在数据没说全时才提示，别每张卡都重复一遍
      var note = null;
      if (!hitDays) note = t('stats.noDaily');
      else if (totalDays > elapsedDays + 1) note = t('stats.coverage', { hit: hitDays, total: totalDays });

      // 大数字优先用官方 summary 的总量：它和下面那排柱子同源，
      // 用 /alpha 的另一个口径会出现「柱子加起来 ≠ 大数字」的错位（两次抓取之间差几分钟）。
      var totalTok = daily.totalTokens != null ? daily.totalTokens : usage.totalTokens;
      var totalReq = daily.totalRequests != null ? daily.totalRequests : usage.totalCount;
      if (totalTok == null && totalReq == null) return null;

      // 第三张卡：云端沙箱按分钟计费，自然月重置（和账单周期不是一个口径）
      var sb = snap.sandbox || null;
      var sbDaily = state.sandboxDaily || {};
      var sbDays = sbDaily.days || [];
      var sbReset = sb && sb.resetAt ? sb.resetAt : sbDaily.resetAt;
      var sbCard = null;
      if (sb && snap.sandboxAccess !== false) {
        var sbPeriodStart = null;
        if (sbReset) {
          // 自然月起点：重置时间往前推一个月
          var rd = new Date(sbReset);
          rd.setMonth(rd.getMonth() - 1);
          sbPeriodStart = rd.getTime();
        }
        sbCard = h(StatCard, {
          field: 'min',
          label: 'stats.cloud',
          value: num(sb.usedMinutes, 0),
          valueSuffix: t('stats.minThisMonth'),
          days: sbDays,
          periodStart: sbPeriodStart,
          periodEnd: sbReset,
          tone: 'cloud',
          blocks: true,
          axisNote: t('stats.cloudNote', { date: sbReset ? dayLabel(sbReset) : '—' }),
        });
      }

      return h(
        React.Fragment,
        null,
        h(
          'div',
          { className: 'ccq_stats' },
          h(StatCard, {
            field: 'tok',
            label: 'stats.tokens',
            value: compact(totalTok),
            days: days,
            periodStart: periodStart,
            periodEnd: periodEnd,
            utc: true,
          }),
          h(StatCard, {
            field: 'req',
            label: 'stats.requests',
            value: num(totalReq, 0),
            days: days,
            periodStart: periodStart,
            periodEnd: periodEnd,
            tone: 'amber',
            utc: true,
          }),
          sbCard,
        ),
        note ? h('p', { className: 'ccq_statNote' }, note) : null,
      );
    }


    /* ------------------------------------------------ 按模型用量（独立页） */

    // 官网「用量明细」那张表：模型 / 请求数 / TOKEN 数 / 用量占比。
    // 数据来自 /internal/usage/by-model（浏览器 cookie 通道），拿不到时优雅降级。
    // 表格本体和页面壳分开：ByModelTable 只负责「有数据时怎么画」，
    // 加载 / 错误 / 空态由 ByModelTab 管，这样以后别处复用表格也不用带一整套状态。
    var MODEL_SORT_KEYS = ['name', 'requests', 'tokensTotal', 'credits'];

    /** @param props.rows 全部行；@param props.meta 显示在筛选行右侧的统计（请求数/tokens/额度/更新时间） */
    function ByModelTable(props) {
      var rows = props.rows || [];
      var sortState = useState({ key: 'credits', dir: -1 });
      var sort = sortState[0];
      var filterState = useState('');
      var filter = filterState[0];

      var sorted = useMemo(
        function () {
          var q = filter.trim().toLowerCase();
          var list = rows.filter(function (m) {
            if (!q) return true;
            return String(m.name).toLowerCase().indexOf(q) >= 0 || String(m.provider).toLowerCase().indexOf(q) >= 0;
          });
          var out = list.slice();
          out.sort(function (a, b) {
            if (sort.key === 'name') {
              var an = String(a.name).toLowerCase();
              var bn = String(b.name).toLowerCase();
              return an < bn ? -sort.dir : an > bn ? sort.dir : 0;
            }
            return (Number(a[sort.key]) - Number(b[sort.key])) * sort.dir;
          });
          return out;
        },
        [rows, filter, sort],
      );

      var toggleSort = function (key) {
        sortState[1](function (cur) {
          if (cur.key === key) return { key: key, dir: -cur.dir };
          return { key: key, dir: key === 'name' ? 1 : -1 };
        });
      };

      var header = h(
        'div',
        { className: 'ccq_th ccq_thModel' },
        h(HeaderBtn, {
          label: t('byModel.model'),
          active: sort.key === 'name',
          dir: sort.dir,
          onClick: function () { toggleSort('name'); },
        }),
        h(HeaderBtn, {
          label: t('byModel.requests'),
          active: sort.key === 'requests',
          dir: sort.dir,
          onClick: function () { toggleSort('requests'); },
        }),
        h(HeaderBtn, {
          label: t('byModel.tokens'),
          active: sort.key === 'tokensTotal',
          dir: sort.dir,
          onClick: function () { toggleSort('tokensTotal'); },
        }),
        h(HeaderBtn, {
          label: t('byModel.share'),
          active: sort.key === 'credits',
          dir: sort.dir,
          onClick: function () { toggleSort('credits'); },
        }),
      );

      var body = sorted.length
        ? sorted.map(function (m) {
            // 按真实百分比画（29.2% 就是 29.2% 宽），不按最大值归一化 ——
            // 归一化会让 29.2% 看起来像占了全部，与自己旁边的数字自相矛盾
            var w = Math.max(1.5, Math.min(100, Number(m.sharePct) || 0));
            return h(
              'div',
              { className: 'ccq_tr ccq_trModel', key: m.model },
              h(
                'div',
                { className: 'ccq_cModel' },
                h(
                  'div',
                  { className: 'ccq_cModelText' },
                  h('span', { className: 'ccq_cModelName', title: m.model }, m.name),
                  m.provider ? h('span', { className: 'ccq_cModelNote' }, m.provider) : null,
                ),
              ),
              h('div', { className: 'ccq_cNum' }, num(m.requests, 0)),
              h('div', { className: 'ccq_cNum', 'data-strong': '' }, compact(m.tokensTotal)),
              h(
                'div',
                { className: 'ccq_cShare' },
                h('div', { className: 'ccq_cShareBar' }, h('div', { className: 'ccq_cShareFill', style: { width: w + '%' } })),
                h('span', { className: 'ccq_cShareText' }, pct(m.sharePct)),
              ),
            );
          })
        : h('div', { className: 'ccq_trEmpty' }, t('byModel.noMatch'));

      return h(
        React.Fragment,
        null,
        h(
          'div',
          { className: 'ccq_filterBar' },
          h('input', {
            className: 'ccq_input ccq_filterInput',
            type: 'search',
            value: filter,
            placeholder: t('byModel.filter'),
            'aria-label': t('byModel.filter'),
            onChange: function (e) { filterState[1](e.target.value); },
          }),
          // 右侧元信息由父级（ByModelTab）算好传进来，跟筛选框同一行
          h('span', { className: 'ccq_filterMeta' }, props.meta || null),
        ),
        h(
          'div',
          { className: 'ccq_table ccq_tableModel' },
          h('div', { className: 'ccq_tableScroll' }, h('div', { className: 'ccq_tableInner ccq_tableInnerModel' }, header, body)),
        ),
      );
    }

    /**
     * 模型用量页读不到浏览器登录态时的引导。
     *
     * 这里的失败原因和概览页完全不同：API Key 明明可能是好的，只是这一页的数据
     * 只存在于 commandcode.ai 的网页登录会话里。所以不能复用 SetupGuide ——
     * 让用户去翻 API Key 只会白折腾。要说清楚「去哪个浏览器、做什么、做完点哪」。
     */
    function SessionGuide(props) {
      var session = props.session || {};
      var browsers = session.browsers || [];
      var browserName = browsers.length ? browsers.join(' / ') : 'Edge / Chrome';
      var blocked = session.supported === false || (session.supported === true && !browsers.length);

      return h(
        'div',
        { className: 'ccq_setup' },
        h('h3', { className: 'ccq_sectionTitle' }, t('byModel.noSession')),
        h('p', { className: 'ccq_setupLead' }, t('byModel.noSessionBody')),
        blocked
          ? h('p', { className: 'ccq_hint' }, t('byModel.sessionNoBrowser'))
          : h(
              React.Fragment,
              null,
              h(
                'div',
                { className: 'ccq_setupStep' },
                h('div', { className: 'ccq_setupStepNum' }, '1'),
                h(
                  'div',
                  { className: 'ccq_setupStepBody' },
                  h('strong', null, t('byModel.sessionStep1', { browser: browserName })),
                  h(
                    'a',
                    { className: 'ccq_btn ccq_btnGhost ccq_setupLink', href: 'https://commandcode.ai/', target: '_blank', rel: 'noreferrer noopener' },
                    t('byModel.openSite'),
                  ),
                ),
              ),
              h(
                'div',
                { className: 'ccq_setupStep' },
                h('div', { className: 'ccq_setupStepNum' }, '2'),
                h(
                  'div',
                  { className: 'ccq_setupStepBody' },
                  h('strong', null, t('byModel.sessionStep2')),
                  h(
                    'div',
                    { className: 'ccq_setupActions' },
                    h(
                      'button',
                      { type: 'button', className: 'ccq_btn', onClick: props.onRecheck, disabled: props.busy },
                      props.busy ? t('setup.rechecking') : t('byModel.recheck'),
                    ),
                    props.error ? h('span', { className: 'ccq_hint' }, props.error) : null,
                  ),
                ),
              ),
              h(
                'div',
                { className: 'ccq_rows ccq_setupRows' },
                h(
                  'div',
                  { className: 'ccq_row' },
                  h(
                    'span',
                    { className: 'ccq_rowKey' },
                    h('span', { className: 'ccq_setupDot', 'data-ok': session.cached ? '' : undefined }),
                    t('diagnostics.credential'),
                  ),
                  h(
                    'span',
                    { className: 'ccq_rowVal ccq_setupState', 'data-ok': session.cached ? '' : undefined },
                    session.cached ? t('byModel.sessionOk') : t('byModel.sessionNone'),
                  ),
                ),
              ),
            ),
      );
    }

    function ByModelTab(props) {
      var state = props.state || {};
      var data = state.byModel || null;
      var meta = state.byModelMeta || {};
      var err = meta.error || null;
      var errorState = useState(null);
      var error = errorState[0];
      var busyState = useState(false);
      var busy = busyState[0];

      var load = function (force) {
        busyState[1](true);
        var p = force ? api.refreshByModel() : api.byModel();
        return p
          .then(function (res) {
            props.onState(function (cur) {
              return Object.assign({}, cur, { byModel: res.data, byModelMeta: res.meta });
            });
            errorState[1](null);
          })
          .catch(function (e) {
            errorState[1](e.message || String(e));
          })
          .then(function () {
            busyState[1](false);
          });
      };

      // 进这一页时如果宿主还没数据，自己去拉一次（不用等主快照的 60 秒节拍）
      useEffect(
        function () {
          if (!data && !err) load(false);
        },
        [],
      );

      var session = meta.session || {};
      var rows = (data && data.models) || [];
      var showError = error || (err && !rows.length);

      // 筛选行右侧的元信息：请求数 / tokens / 额度消耗，末尾接本页自己的抓取时刻。
      // 不再显示「多少个模型」—— 模型总数对用户没有决策价值，反而把这一行挤满。
      // 抓取时刻放在本页，是因为这条通道（浏览器 cookie）和额度快照的抓取时刻不同，
      // 放到所有 tab 共用的副标题上会随切换来回跳。
      var statItems = data
        ? joinWithSep([
            t('byModel.totalRequests', { n: num(data.totalRequests, 0) }),
            t('byModel.totalTokens', { n: compact(data.totalTokens) }),
            data.totalCredits > 0 ? t('byModel.totalCredits', { n: num(data.totalCredits, 2) }) : null,
            // 这页不放自己的刷新按钮：顶部那个「刷新」已经是全量刷新（额度 + 模型用量）。
            meta.at ? h('span', { className: 'ccq_hint' }, t('byModel.updated', { age: duration(Date.now() - meta.at) })) : null,
          ])
        : null;

      var content;
      if (showError && !rows.length) {
        // 区分「没登录 / 读不到 cookie」和「其它错误」：前者要用户去浏览器登录，后者可以重试
        var kind = (err && err.kind) || '';
        var isSession = kind === 'session' || /登录|cookie|钥匙串/.test((err && err.message) || '');
        content = isSession
          ? h(SessionGuide, { session: session, error: showError, busy: busy, onRecheck: function () { load(true); } })
          : h(Empty, {
              title: t('common.error'),
              hint: showError,
              action: h(
                'button',
                { type: 'button', className: 'ccq_btn', onClick: function () { load(true); } },
                t('common.retry'),
              ),
            });
      } else if (!data) {
        content = h('div', { className: 'ccq_loading' }, t('common.loading'));
      } else if (!rows.length) {
        content = h(Empty, { title: t('byModel.empty'), hint: t('byModel.hint') });
      } else {
        content = h(ByModelTable, { rows: rows, meta: statItems });
      }

      return content;
    }

    /* ------------------------------------------------------------ 概览 */

    function OverviewTab(props) {
      var state = props.state;
      var snap = state && state.snapshot;
      var derived = (state && state.derived) || {};
      var settings = (state && state.settings) || {};
      var thresholds = settings.thresholds || {};

      if (!snap) {
        var emptyCred = (state && state.meta && state.meta.credential) || null;
        var help = state && state.meta && state.meta.credentialHelp;
        // 没 Key 是「还没开始用」，不是「出错了」：给完整引导而不是一句空态。
        if (emptyCred && emptyCred.ok === false && help) {
          return h(SetupGuide, { help: help, onFound: props.onRefresh });
        }
        return h(Empty, {
          title: t('overview.emptyTitle'),
          hint:
            emptyCred && emptyCred.ok === false
              ? t('overview.noCredential')
              : state && state.meta && state.meta.lastError
                ? state.meta.lastError.message
                : null,
          action: h(
            'button',
            { type: 'button', className: 'ccq_btn', onClick: props.onRefresh, disabled: props.refreshing },
            props.refreshing ? t('panel.refreshing') : t('panel.refresh'),
          ),
        });
      }

      var credits = snap.credits || {};
      var plan = snap.plan || {};
      var usage = snap.periodUsage || {};
      var account = snap.account || {};
      var usedPct = credits.totalPool > 0 ? ((credits.totalPool - credits.totalRemaining) / credits.totalPool) * 100 : 0;
      var tn = tone(usedPct, thresholds);
      var ageMs = snap.fetchedAt ? Date.now() - Date.parse(snap.fetchedAt) : null;
      var stale = ageMs !== null && ageMs > 10 * 60 * 1000;
      var cred = (state && state.meta && state.meta.credential) || null;
      var noCred = cred && cred.ok === false;

      // 本页一行：左边账号，右边抓取时刻——和模型用量页工具栏同一套排布（左内容 / 右时间）
      // 与同一条样式。时间必须留在各自页面里：模型用量走浏览器 cookie，是另一条通道，
      // 抓取时刻天然不同，放到所有 tab 共用的头部会来回跳。
      var topBar = h(
        'div',
        { className: 'ccq_topMeta' },
        h(
          'span',
          { className: 'ccq_topMetaItem' },
          h('span', { className: 'ccq_topMetaKey' }, t('overview.account')),
          // 只显示邮箱：名字在顶部副标题里已经有了，这里再写一遍是重复。
          h('span', { className: 'ccq_topMetaVal' }, account.email || account.userName || account.name || '—'),
        ),
        stale
          ? h('span', { className: 'ccq_topMetaVal', 'data-tone': 'warn' }, t('overview.stale', { age: duration(ageMs) }))
          : null,
        h('span', { className: 'ccq_spacer' }),
        snap.fetchedAt
          ? h('span', { className: 'ccq_hint' }, t('byModel.updated', { age: duration(ageMs) }))
          : h('span', { className: 'ccq_hint' }, t('panel.never')),
      );

      return h(
        React.Fragment,
        null,
        topBar,
        tn !== 'ok'
          ? h(
              'div',
              { className: 'ccq_banner', 'data-tone': tn },
              h('span', { className: 'ccq_bannerIcon' }, tn === 'error' ? '⚠' : '•'),
              h('span', null, tn === 'error' ? t('overview.critical') : t('overview.warn')),
            )
          : null,
        noCred
          ? h(
              'div',
              { className: 'ccq_banner', 'data-tone': 'error' },
              h('span', null, '⚠'),
              h('span', null, t('overview.noCredential')),
            )
          : null,
        // 第二栏：本期用量统计卡（顺序：顶部信息 → 统计卡 → 剩余额度 → 三张窗口卡）
        h(UsageStats, { state: state }),
        h(
          'div',
          { className: 'ccq_hero' },
          h(
            'div',
            null,
            h('div', { className: 'ccq_heroLabel' }, t('overview.remainingCredits')),
            h(
              'div',
              { className: 'ccq_heroMain' },
              h('span', { className: 'ccq_heroValue' }, num(credits.totalRemaining, 2)),
              h('span', { className: 'ccq_heroOf' }, t('overview.totalPool', { total: num(credits.totalPool, 2) })),
            ),
          ),
          h(Bar, { value: usedPct, tone: tn, label: t('window.used') + ' ' + pct(usedPct) }),
          h(
            'div',
            { className: 'ccq_heroFacts' },
            h(
              'div',
              { className: 'ccq_fact' },
              h('span', { className: 'ccq_factValue' }, plan.name || plan.planId || '—'),
              h('span', { className: 'ccq_factLabel' }, t('overview.plan')),
            ),
            plan.periodDaysLeft !== null && plan.periodDaysLeft !== undefined
              ? h(
                  'div',
                  { className: 'ccq_fact' },
                  h('span', { className: 'ccq_factValue' }, plan.periodDaysLeft + ' ' + t('unit.day')),
                  h('span', { className: 'ccq_factLabel' }, t('overview.periodLeft')),
                )
              : null,
            h(
              'div',
              { className: 'ccq_fact' },
              h('span', { className: 'ccq_factValue' }, money(credits.totalSpent)),
              h('span', { className: 'ccq_factLabel' }, t('overview.spent')),
            ),
          ),
        ),
        h(
          'div',
          { className: 'ccq_grid' },
          h(WindowCard, {
            window: snap.windows && snap.windows.fiveHour,
            projection: derived.projection && derived.projection.fiveHour,
            burn: derived.burn && derived.burn.fiveHour,
            thresholds: thresholds,
          }),
          h(WindowCard, {
            window: snap.windows && snap.windows.weekly,
            projection: derived.projection && derived.projection.weekly,
            burn: derived.burn && derived.burn.weekly,
            thresholds: thresholds,
          }),
          h(WindowCard, {
            window: snap.windows && snap.windows.monthly,
            projection: derived.projection && derived.projection.monthly,
            burn: derived.burn && derived.burn.monthly,
            thresholds: thresholds,
          }),
        ),
        snap.errors && snap.errors.length
          ? h(
              'div',
              { className: 'ccq_banner', 'data-tone': 'error' },
              h('span', null, '⚠'),
              h(
                'span',
                { className: 'ccq_bannerText' },
                snap.errors
                  .map(function (e) {
                    return (e && (e.friendly || e.message)) || String(e);
                  })
                  .join(' · '),
              ),
            )
          : null,
      );
    }

    /* ------------------------------------------------------------ 价目表 */

    /* 价目表的「估算窗口」选项：按哪个窗口的剩余额度折算还能跑多少次 */
    var WINDOW_FIELDS = [
      { key: 'fiveHour', label: 'window.fiveHour' },
      { key: 'weekly', label: 'window.weekly' },
      { key: 'monthly', label: 'window.monthly' },
    ];

    // digits 按列固定，不再按数值大小自动选位：同一列里小数位必须一样，否则右对齐也看不出高低。
    // 实测分布：单价 0.002–15（4 位够）、单次估算 0.000011–0.027（6 位够）。
    var PRICE_COLUMNS = [
      { key: 'input', label: 'pricing.input', kind: 'price', digits: 4 },
      { key: 'cacheRead', label: 'pricing.cacheRead', kind: 'price', digits: 4 },
      { key: 'output', label: 'pricing.output', kind: 'price', digits: 4 },
      { key: 'perRequest', label: 'pricing.perRequest', kind: 'perRequest', digits: 6 },
    ];
    // 表头点击排序：默认按「单次估算」升序（便宜的在前），再点同一列反向。
    var SORT_KEYS = ['name', 'input', 'cacheRead', 'output', 'perRequest', 'capacity'];


    // 可排序表头：箭头只在当前排序列出现，避免满屏 ▲▼
    function HeaderBtn(props) {
      var active = props.active;
      var dir = props.dir;
      return h(
        'button',
        {
          type: 'button',
          className: 'ccq_thBtn',
          'data-align': props.align === 'right' ? 'right' : undefined,
          'data-active': active ? '' : undefined,
          onClick: props.onClick,
          'aria-label': props.label + (active ? (dir === 1 ? ' ↑' : ' ↓') : ''),
        },
        h('span', { className: 'ccq_thBtnText' }, props.label),
        active ? h('span', { className: 'ccq_sortMark' }, dir === 1 ? '▲' : '▼') : null,
      );
    }

    function PricingTab(props) {
      var state = props.state;
      // 画像不再让用户调：它只影响「单次估算」这一列（token 报价，和额度点差约 100 倍），
      // 抖它改不了任何决策。后端直接用设置里存的 modelProfile。
      var windowState = useState('monthly');
      var windowKey = windowState[0];
      var setWindow = windowState[1];

      var dataState = useState(null);
      var data = dataState[0];
      var setData = dataState[1];
      var errorState = useState(null);
      var error = errorState[0];
      var setError = errorState[1];
      var filterState = useState('');
      var filter = filterState[0];
      var setFilter = filterState[1];
      var loadingState = useState(false);
      var loading = loadingState[0];
      var setLoading = loadingState[1];
      // 默认按「单次估算」升序（便宜的在前）
      var sortState = useState({ key: 'perRequest', dir: 1 });
      var sort = sortState[0];
      var setSort = sortState[1];
      var toggleSort = function (key) {
        setSort(function (prev) {
          if (prev.key === key) return { key: key, dir: -prev.dir };
          return { key: key, dir: key === 'name' ? 1 : 1 };
        });
      };

      // 画像固定，所以不需要把参数带给接口：后端会用设置里的 modelProfile。
      var load = useCallback(function () {
        setLoading(true);
        api
          .pricing()
          .then(function (res) {
            setData(res);
            setError(null);
          })
          .catch(function (err) {
            setError(err.message || String(err));
          })
          .then(function () {
            setLoading(false);
          });
      }, []);

      useEffect(
        function () {
          load();
        },
        [load],
      );

      var remainingForWindow = data && data.windowRemaining ? Number(data.windowRemaining[windowKey]) : null;

      var ratioForWindow = data && data.windowRatio ? data.windowRatio[windowKey] : null;

      var capacityOf = function (m) {
        // 「额度点」和「美元」不是同一个单位：官方 Sonnet 每月 1190 次、剩 70 点时
        // 每次约花 0.0588 点，而按 token 报价算出来只有 $0.0005 —— 两者差上百倍。
        // 所以剩余次数只能用官方给的分窗口次数 × 剩余比例；没官方数据的就老实显示「—」。
        if (m.free) return Infinity;
        // 不按 token 计费的模型（见上面的 tokenPriced 判断）按官方次数折算也没有意义，
        // 因为官方次数是按满额度给的，和 token 价不是一回事 —— 直接不给数字。
        if (!(Number(m.input) > 0 || Number(m.output) > 0) && !m.requestsMonthly && !m.requests5h) return null;
        if (!(Number(m.input) > 0 || Number(m.output) > 0)) return null;
        var official = m.official || null;
        var officialCount =
          official === null
            ? null
            : windowKey === 'fiveHour'
              ? official.fiveHour
              : windowKey === 'weekly'
                ? official.weekly
                : official.monthly;
        if (officialCount != null && ratioForWindow != null && isFinite(ratioForWindow)) {
          return Math.floor(officialCount * ratioForWindow);
        }
        return null;
      };

      var models = useMemo(
        function () {
          var list = (data && data.models) || [];
          var q = String(filter || '').trim().toLowerCase();
          var out = list;
          if (q) {
            out = list.filter(function (m) {
              return (
                String(m.name || '').toLowerCase().indexOf(q) >= 0 ||
                String(m.slug || '').toLowerCase().indexOf(q) >= 0
              );
            });
          }
          var dir = sort.dir === -1 ? -1 : 1;
          // 「还能跑」要现算（依赖当前窗口与剩余比例），排序时不能直接用字段。
          // 返回 null 表示「没有这个数」（显示 — 的、免费模型的、没有官方次数的），
          // 这类行一律排最后 —— 否则一升序它们就顶到最前面，占满第一屏。
          var sortVal = function (m) {
            if (sort.key === 'name') return String(m.name || m.slug || '').toLowerCase();
            if (sort.key === 'capacity') {
              var c = capacityOf(m);
              if (c === null) return null;
              return c === Infinity ? Number.MAX_SAFE_INTEGER : c;
            }
            if (sort.key === 'perRequest') {
              // 免费模型没有「单次估算」这个数（显示的是「免费」），不该混进按价排序里，
              // 否则「最便宜的前十名」全被免费模型占满，看不到付费模型的实际价差。
              if (m.free) return null;
              var tokenPriced = Number(m.input) > 0 || Number(m.output) > 0;
              if (!tokenPriced) return null;
            }
            // null / undefined / '' 表示「这个模型没有这个价」（例如 Flint 没有输出单价），
            // 不能 Number() 成 0 —— 否则一升序它们就被当成「最便宜」顶到最前面。
            var raw = m[sort.key];
            if (raw === null || raw === undefined || raw === '') return null;
            var v = Number(raw);
            return isFinite(v) ? v : null;
          };
          var nameOf = function (m) {
            return String(m.name || m.slug || '');
          };
          return out.slice().sort(function (a, b) {
            var av = sortVal(a);
            var bv = sortVal(b);
            if (sort.key === 'name') return av < bv ? -dir : av > bv ? dir : 0;
            if (av === null && bv === null) return nameOf(a).localeCompare(nameOf(b));
            if (av === null) return 1;
            if (bv === null) return -1;
            if (av === bv) return nameOf(a).localeCompare(nameOf(b));
            return av < bv ? -dir : dir;
          });
        },
        [data, filter, sort, windowKey, ratioForWindow],
      );


      // 出错就早返回，别在错误提示下面再画一张空表格（看着像数据丢了）
      if (error && !data) {
        return h(Empty, {
          title: t('common.error'),
          hint: error,
          action: h('button', { type: 'button', className: 'ccq_btn', onClick: load }, t('common.retry')),
        });
      }

      return h(
        React.Fragment,
        null,
        // 原来的「典型请求画像」三格与「估算窗口」不再作为输入项：
        // 画像只影响「单次估算」这一列（token 报价，和额度点差约 100 倍），
        // 调它改不了任何决策，属于自娱自乐。估算窗口保留在筛选行右侧。
        h(
          'div',
          { className: 'ccq_filterBar' },
          h('input', {
            className: 'ccq_input ccq_filterInput',
            type: 'search',
            placeholder: t('pricing.filter'),
            value: filter,
            onChange: function (e) {
              setFilter(e.target.value);
            },
            'aria-label': t('pricing.filter'),
          }),
          h(
            'span',
            { className: 'ccq_filterMeta' },
            // 不再显示「多少个模型」：模型总数不是决策信息，留着只会把这一行挤满。
            // 顺序保持「生成时间 → 估算窗口」的阅读节奏，分隔符交给 joinWithSep 统一处理。
            loading
              ? t('common.loading')
              : joinWithSep([
                  data && data.generatedAt ? t('pricing.generatedAt', { when: hourLabel(Date.parse(data.generatedAt)) }) : null,
                  h('span', null, t('pricing.estimateFor')),
                ]),
            h(Segmented, {
              value: windowKey,
              onChange: setWindow,
              options: WINDOW_FIELDS.map(function (w) {
                return { value: w.key, label: t(w.label) };
              }),
            }),
          ),
        ),

        remainingForWindow === null
          ? h('div', { className: 'ccq_banner' }, t('pricing.noSnapshot'))
          : null,
        h(
          'div',
          { className: 'ccq_table' },
          h(
            'div',
            { className: 'ccq_tableScroll' },
            h(
              'div',
              { className: 'ccq_tableInner' },
              h(
                'div',
                { className: 'ccq_th' },
                h(HeaderBtn, {
                  label: t('pricing.model'),
                  align: 'left',
                  active: sort.key === 'name',
                  dir: sort.dir,
                  onClick: function () {
                    toggleSort('name');
                  },
                }),
                PRICE_COLUMNS.map(function (col) {
                  return h(HeaderBtn, {
                    key: col.key,
                    label: t(col.label),
                    align: 'left',
                    active: sort.key === col.key,
                    dir: sort.dir,
                    onClick: function () {
                      toggleSort(col.key);
                    },
                  });
                }),
                h(HeaderBtn, {
                  label: t('pricing.capacity'),
                  align: 'left',
                  active: sort.key === 'capacity',
                  dir: sort.dir,
                  onClick: function () {
                    toggleSort('capacity');
                  },
                }),
              ),
              models.length === 0
                ? h('div', { className: 'ccq_trEmpty' }, t('pricing.empty'))
                : models.map(function (m) {
                    var cap = capacityOf(m);
                    // token 价全 0 但又不在免费名单里的模型（例如 Jev，官方标 20 credit tier），
                    // 说明它不按 token 计费；这时报 $0.00 会让人以为随便用不花钱，宁可不显示。
                    var tokenPriced = Number(m.input) > 0 || Number(m.output) > 0;
                    return h(
                      'div',
                      { key: m.slug || m.name, className: 'ccq_tr' },
                      h(
                        'span',
                        { className: 'ccq_cModel' },
                        h(
                          'span',
                          { className: 'ccq_cModelText' },
                          h('span', { className: 'ccq_cModelName', title: m.name || m.slug || '' }, m.name || m.slug || '—'),
                          m.note ? h('span', { className: 'ccq_cModelNote', title: m.note }, m.note) : null,
                        ),
                        m.free ? h('span', { className: 'ccq_freeTag' }, t('pricing.freeTag')) : null,
                        m.context ? h('span', { className: 'ccq_ctx', title: t('pricing.context') }, m.context) : null,
                      ),
                      PRICE_COLUMNS.map(function (col) {
                        var v = m[col.key];
                        var text;
                        if (m.free) {
                          // 免费模型按 token 计价没意义（全是 0），别摆一排 0 和 —；
                          // 单次请求确实是 $0，用「免费」比 $0.000000 清楚。
                          text = col.key === 'perRequest' ? t('pricing.freeTag') : '—';
                        } else if (col.key === 'perRequest') {
                          text = tokenPriced ? money(v, col.digits) : '—';
                        } else {
                          text = price(v, col.digits);
                        }
                        return h(
                          'span',
                          {
                            key: col.key,
                            className: 'ccq_cNum',
                            'data-strong': col.key === 'perRequest' ? '' : undefined,
                            'data-muted': text === '—' ? '' : undefined,
                          },
                          text,
                        );
                      }),
                      h(
                        'span',
                        { className: 'ccq_cNum', 'data-strong': '' },
                        cap === null ? '—' : cap === Infinity ? '∞' : num(cap, 0),
                      ),
                    );
                  }),
            ),
          ),
        ),
        // 画像数字取自后端返回的 profile，不在前端再写一份，免得两边漂移
        h(
          'div',
          { className: 'ccq_hint ccq_statNote' },
          t('pricing.officialNote', {
            in: num((data && data.profile && data.profile.freshInputTokens) || 0, 0),
            cache: num((data && data.profile && data.profile.cacheReadTokens) || 0, 0),
            out: num((data && data.profile && data.profile.outputTokens) || 0, 0),
          }),
        ),
      );
    }

    /* ------------------------------------------------------------ 设置 */

    function SettingsTab(props) {
      var state = props.state;
      var current = (state && state.settings) || {};
      var draftState = useState(null);
      var draft = draftState[0];
      var setDraft = draftState[1];
      var messageState = useState(null);
      var message = messageState[0];
      var setMessage = messageState[1];
      var savingState = useState(false);
      var saving = savingState[0];
      var setSaving = savingState[1];
      var confirmClearState = useState(false);
      var confirmingClear = confirmClearState[0];
      var setConfirmingClear = confirmClearState[1];

      useEffect(
        function () {
          setDraft(JSON.parse(JSON.stringify(current)));
          setMessage(null);
        },
        [JSON.stringify(current)],
      );

      if (!draft) return h('div', { className: 'ccq_loading' }, t('common.loading'));

      var patch = function (key, value) {
        var next = JSON.parse(JSON.stringify(draft));
        next[key] = value;
        setDraft(next);
      };
      var patchThreshold = function (key, value) {
        var next = JSON.parse(JSON.stringify(draft));
        next.thresholds = next.thresholds || {};
        next.thresholds[key] = value;
        setDraft(next);
      };

      var save = function () {
        setSaving(true);
        var body = {
          apiBaseUrl: draft.apiBaseUrl,
          credentialsMode: draft.credentialsMode,
          autoRefresh: Boolean(draft.autoRefresh),
          refreshIntervalSec: Number(draft.refreshIntervalSec) || 60,
          requestTimeoutMs: Number(draft.requestTimeoutMs) || 20000,
          historyEnabled: Boolean(draft.historyEnabled),
          historyRetentionDays: Number(draft.historyRetentionDays) || 30,
          thresholds: {
            warn: Number((draft.thresholds && draft.thresholds.warn) || 70),
            critical: Number((draft.thresholds && draft.thresholds.critical) || 90),
          },
          modelProfile: {
            freshInputTokens: Number((draft.modelProfile && draft.modelProfile.freshInputTokens) || 0),
            cacheReadTokens: Number((draft.modelProfile && draft.modelProfile.cacheReadTokens) || 0),
            outputTokens: Number((draft.modelProfile && draft.modelProfile.outputTokens) || 0),
          },
        };
        // 只在用户真的敲了新 Key 时提交，避免用空值/掩码覆盖已存的 Key
        if (typeof draft.manualApiKey === 'string' && draft.manualApiKey.trim() !== '') {
          body.manualApiKey = draft.manualApiKey.trim();
        }
        api
          .saveSettings(body)
          .then(function () {
            setMessage({ kind: 'ok', text: t('settings.saved') });
            props.onChanged();
          })
          .catch(function (err) {
            setMessage({ kind: 'error', text: err.message || String(err) });
          })
          .then(function () {
            setSaving(false);
          });
      };

      var field = function (labelKey, child) {
        return h('label', { className: 'ccq_field' }, h('span', { className: 'ccq_label' }, t(labelKey)), child);
      };

      return h(
        React.Fragment,
        null,
        message
          ? h(
              'div',
              { className: 'ccq_banner', 'data-tone': message.kind === 'error' ? 'error' : undefined },
              h('span', null, message.text),
            )
          : null,
        h(
          'div',
          { className: 'ccq_section' },
          h('h3', { className: 'ccq_sectionTitle' }, t('settings.credentials')),
          h(
            'div',
            { className: 'ccq_field' },
            h('span', { className: 'ccq_label' }, t('settings.credentialsMode')),
            h(
              'label',
              { className: 'ccq_radioRow' },
              h('input', {
                type: 'radio',
                name: 'ccq-credentialsMode',
                checked: draft.credentialsMode !== 'manual',
                onChange: function () {
                  patch('credentialsMode', 'auto');
                },
              }),
              h('span', null, t('settings.auto')),
            ),
            h(
              'label',
              { className: 'ccq_radioRow' },
              h('input', {
                type: 'radio',
                name: 'ccq-credentialsMode',
                checked: draft.credentialsMode === 'manual',
                onChange: function () {
                  patch('credentialsMode', 'manual');
                },
              }),
              h('span', null, t('settings.manual')),
            ),
          ),
          /*
           * 手动 Key 输入框常显：早先只在「手动」模式或已存过 Key 时才出现，
           * 结果新用户在「自动」模式下根本看不到这个框 —— 引导里让他来这里粘贴，
           * 来了却没有输入框。藏起来省的那点空间不值得制造这种死路。
           */
          h(
            'div',
            { className: 'ccq_field' },
            h('span', { className: 'ccq_label' }, t('settings.manualKey')),
            h('input', {
              className: 'ccq_input',
              type: 'password',
              autoComplete: 'off',
              placeholder: draft.hasManualApiKey
                ? t('settings.manualKeySaved', { masked: draft.manualApiKeyMasked || '••••' })
                : t('settings.manualKeyPlaceholder'),
              value: draft.manualApiKey || '',
              onChange: function (e) {
                patch('manualApiKey', e.target.value);
              },
            }),
            h('span', { className: 'ccq_hint' }, t('settings.note')),
          ),
        ),
        h(
          'div',
          { className: 'ccq_section' },
          h('h3', { className: 'ccq_sectionTitle' }, t('settings.refresh')),
          h(
            'div',
            { className: 'ccq_form' },
            field(
              'settings.apiBaseUrl',
              h('input', {
                className: 'ccq_input',
                value: draft.apiBaseUrl || '',
                onChange: function (e) {
                  patch('apiBaseUrl', e.target.value);
                },
              }),
            ),
            field(
              'settings.refreshInterval',
              h(
                'div',
                null,
                h('input', {
                  className: 'ccq_input ccq_inputNarrow',
                  type: 'number',
                  min: 15,
                  max: 3600,
                  value: draft.refreshIntervalSec,
                  onChange: function (e) {
                    patch('refreshIntervalSec', e.target.value);
                  },
                }),
                h('div', { className: 'ccq_hint ccq_hintTight' }, t('settings.refreshIntervalHint')),
              ),
            ),
            field(
              'settings.requestTimeout',
              h('input', {
                className: 'ccq_input ccq_inputNarrow',
                type: 'number',
                min: 3000,
                max: 120000,
                step: 1000,
                value: draft.requestTimeoutMs,
                onChange: function (e) {
                  patch('requestTimeoutMs', e.target.value);
                },
              }),
            ),
            h(
              'label',
              { className: 'ccq_radioRow' },
              h('input', {
                type: 'checkbox',
                checked: Boolean(draft.autoRefresh),
                onChange: function (e) {
                  patch('autoRefresh', e.target.checked);
                },
              }),
              h('span', null, t('settings.autoRefresh')),
            ),
          ),
        ),
        h(
          'div',
          { className: 'ccq_section' },
          h('h3', { className: 'ccq_sectionTitle' }, t('settings.history')),
          h(
            'div',
            { className: 'ccq_form' },
            h(
              'label',
              { className: 'ccq_radioRow' },
              h('input', {
                type: 'checkbox',
                checked: Boolean(draft.historyEnabled),
                onChange: function (e) {
                  patch('historyEnabled', e.target.checked);
                },
              }),
              h('span', null, t('settings.historyEnabled')),
            ),
            field(
              'settings.historyRetention',
              h('input', {
                className: 'ccq_input ccq_inputNarrow',
                type: 'number',
                min: 1,
                max: 365,
                value: draft.historyRetentionDays,
                onChange: function (e) {
                  patch('historyRetentionDays', e.target.value);
                },
              }),
            ),
            // 破坏性操作放在这里，而不是总览页数据旁边：误点一下趋势曲线就没了。
            // 不用 field(): 它会包一层 <label>，导致按钮文案被重复读一遍。
            h(
              'div',
              { className: 'ccq_field' },
              h('span', { className: 'ccq_label' }, t('settings.clearHistory')),
              h(
                'div',
                { className: 'ccq_btnRow' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'ccq_btn ccq_btnDanger',
                    onClick: function () {
                      if (confirmingClear) {
                        api
                          .clearHistory()
                          .then(function () {
                            setConfirmingClear(false);
                            setMessage({ kind: 'ok', text: t('settings.cleared') });
                          })
                          .catch(function (err) {
                            setMessage({ kind: 'error', text: err.message || String(err) });
                          });
                      } else {
                        setConfirmingClear(true);
                      }
                    },
                  },
                  confirmingClear ? t('settings.clearConfirm') : t('settings.clear'),
                ),
                confirmingClear
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'ccq_btn',
                        onClick: function () {
                          setConfirmingClear(false);
                        },
                      },
                      t('common.cancel'),
                    )
                  : null,
              ),
            ),
          ),
        ),
        h(
          'div',
          { className: 'ccq_section' },
          h('h3', { className: 'ccq_sectionTitle' }, t('settings.thresholds')),
          h(
            'div',
            { className: 'ccq_form' },
            field(
              'settings.warn',
              h('input', {
                className: 'ccq_input ccq_inputNarrow',
                type: 'number',
                min: 1,
                max: 100,
                value: (draft.thresholds && draft.thresholds.warn) || 70,
                onChange: function (e) {
                  patchThreshold('warn', e.target.value);
                },
              }),
            ),
            field(
              'settings.critical',
              h('input', {
                className: 'ccq_input ccq_inputNarrow',
                type: 'number',
                min: 1,
                max: 100,
                value: (draft.thresholds && draft.thresholds.critical) || 90,
                onChange: function (e) {
                  patchThreshold('critical', e.target.value);
                },
              }),
            ),
          ),
        ),
        h(
          'div',
          { className: 'ccq_toolbar' },
          h(
            'button',
            { type: 'button', className: 'ccq_btn ccq_btnPrimary', onClick: save, disabled: saving },
            saving ? t('common.loading') : t('settings.save'),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'ccq_btn',
              onClick: function () {
                setDraft(JSON.parse(JSON.stringify(current)));
                setMessage(null);
              },
            },
            t('settings.discard'),
          ),
          h('span', { className: 'ccq_spacer' }),
          h(
            'button',
            {
              type: 'button',
              className: 'ccq_btn ccq_btnDanger',
              onClick: function () {
                if (typeof window !== 'undefined' && typeof window.confirm === 'function' && !window.confirm(t('settings.resetConfirm'))) return;
                setSaving(true);
                api
                  .saveSettings({ reset: true })
                  .then(function () {
                    setMessage({ kind: 'ok', text: t('settings.saved') });
                    props.onChanged();
                  })
                  .catch(function (err) {
                    setMessage({ kind: 'error', text: err.message || String(err) });
                  })
                  .then(function () {
                    setSaving(false);
                  });
              },
            },
            t('settings.reset'),
          ),
        ),
      );
    }

    /* ------------------------------------------------------------ 诊断 */

    function DiagnosticsTab(props) {
      var dataState = useState(null);
      var data = dataState[0];
      var setData = dataState[1];
      var errorState = useState(null);
      var error = errorState[0];
      var setError = errorState[1];
      var copiedState = useState(null);
      var copied = copiedState[0];
      var setCopied = copiedState[1];

      var load = useCallback(function () {
        api
          .diagnostics()
          .then(function (res) {
            setData(res);
            setError(null);
          })
          .catch(function (err) {
            setError(err.message || String(err));
          });
      }, []);

      useEffect(
        function () {
          load();
        },
        [load],
      );

      if (error) {
        return h(Empty, {
          title: t('common.error'),
          hint: error,
          action: h('button', { type: 'button', className: 'ccq_btn', onClick: load }, t('common.retry')),
        });
      }
      if (!data) return h('div', { className: 'ccq_loading' }, t('common.loading'));

      var cred = data.credential || {};
      var rows = [
        [t('diagnostics.version'), data.version],
        [t('diagnostics.node'), data.node],
        [t('diagnostics.credential'), cred.ok ? t('common.yes') : cred.error || t('common.no')],
        [t('diagnostics.source'), cred.source + (cred.via ? ' · ' + cred.via : '') + (cred.masked ? ' · ' + cred.masked : '')],
        [t('diagnostics.interval'), data.intervalSec + 's'],
        [t('diagnostics.samples'), String(data.sampleCount)],
        [t('diagnostics.lastFetch'), data.snapshotFetchedAt ? hourLabel(Date.parse(data.snapshotFetchedAt)) : t('panel.never')],
        [t('diagnostics.latency'), data.lastRefreshMs !== null && data.lastRefreshMs !== undefined ? data.lastRefreshMs + 'ms' : '—'],
        [t('diagnostics.dataDir'), data.dataDir],
      ];

      var copyText = JSON.stringify(
        { version: data.version, credential: cred, apiBaseUrl: data.apiBaseUrl, intervalSec: data.intervalSec, lastError: data.lastError, snapshotErrors: data.snapshotErrors },
        null,
        2,
      );

      return h(
        React.Fragment,
        null,
        h(
          'div',
          { className: 'ccq_toolbar' },
          h('span', { className: 'ccq_spacer' }),
          copied ? h('span', { className: 'ccq_hint' }, copied) : null,
          h(
            'button',
            { type: 'button', className: 'ccq_btn', onClick: load },
            t('diagnostics.reload'),
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'ccq_btn',
              onClick: function () {
                try {
                  navigator.clipboard.writeText(copyText).then(
                    function () {
                      setCopied(t('diagnostics.copied'));
                    },
                    function () {
                      setCopied(t('diagnostics.copyFailed'));
                    },
                  );
                } catch (err) {
                  setCopied(t('diagnostics.copyFailed'));
                }
              },
            },
            t('diagnostics.copy'),
          ),
        ),
        h(
          'div',
          { className: 'ccq_rows' },
          rows.map(function (row, idx) {
            return h(
              'div',
              { key: 'r' + idx, className: 'ccq_row' },
              h('span', { className: 'ccq_rowKey' }, row[0]),
              h('span', { className: 'ccq_rowVal ccq_mono' }, row[1] === null || row[1] === undefined || row[1] === '' ? '—' : String(row[1])),
            );
          }),
        ),
        h(
          'div',
          { className: 'ccq_section' },
          h('h3', { className: 'ccq_sectionTitle' }, t('diagnostics.errors')),
          data.lastError
            ? h('pre', { className: 'ccq_pre' }, JSON.stringify(data.lastError, null, 2))
            : data.snapshotErrors && data.snapshotErrors.length
              ? h('pre', { className: 'ccq_pre' }, JSON.stringify(data.snapshotErrors, null, 2))
              : h('p', { className: 'ccq_hint' }, t('diagnostics.noErrors')),
        ),
        h(
          'div',
          { className: 'ccq_section' },
          h('h3', { className: 'ccq_sectionTitle' }, t('diagnostics.log')),
          h('pre', { className: 'ccq_pre' }, data.log || '—'),
        ),
      );
    }

    /* ------------------------------------------------------------ 面板 */

    var TABS = ['overview', 'bymodel', 'pricing', 'settings', 'diagnostics'];

    function QuotaPanel() {
      var tabState = useState('overview');
      var tab = tabState[0];
      var setTab = tabState[1];
      var stateState = useState(null);
      var state = stateState[0];
      var setState = stateState[1];
      var errorState = useState(null);
      var error = errorState[0];
      var setError = errorState[1];
      var busyState = useState(false);
      var busy = busyState[0];
      var setBusy = busyState[1];
      var tickState = useState(0);
      var tick = tickState[0];
      var setTick = tickState[1];

      var loadState = useCallback(function () {
        api
          .state()
          .then(function (res) {
            setState(res);
            setError(null);
          })
          .catch(function (err) {
            setError(err.message || String(err));
          });
      }, []);

      // 面板读的是宿主缓存，所以轮询频率跟「服务端抓取间隔」不是一回事：
      // 抓取再慢也别让面板超 30 秒不刷新，抓取再快也别比主机更快地打接口。
      var fetchSec = Number((state && state.settings && state.settings.refreshIntervalSec) || 0);
      var pollSec = Math.max(5, Math.min(fetchSec > 0 ? fetchSec : 20, 30));
      useEffect(
        function () {
          loadState();
          var timer = setInterval(loadState, pollSec * 1000);
          return function () {
            clearInterval(timer);
          };
        },
        [loadState, pollSec],
      );

      // 让「x 分钟前」这类相对时间保持新鲜
      useEffect(
        function () {
          var timer = setInterval(function () {
            setTick(function (n) {
              return n + 1;
            });
          }, 30000);
          return function () {
            clearInterval(timer);
          };
        },
        [],
      );

      var refresh = function () {
        setBusy(true);
        api
          .refresh()
          .then(function (res) {
            setState(res);
            setError(null);
          })
          .catch(function (err) {
            setError(err.message || String(err));
          })
          .then(function () {
            setBusy(false);
          });
      };

      var meta = (state && state.meta) || {};
      var snap = state && state.snapshot;
      var refreshing = busy || Boolean(meta.refreshing);
      var subParts = [];
      if (snap && snap.plan && (snap.plan.name || snap.plan.planId)) subParts.push(snap.plan.name || snap.plan.planId);
      if (snap && snap.account && (snap.account.name || snap.account.userName)) subParts.push(snap.account.name || snap.account.userName);
      // 顶部这行是所有 tab 共用的，不能放更新时间：额度快照和模型用量是两条独立通道
      // （一个 apiKey、一个浏览器 cookie），抓取时刻天然不同，放在共用位置会来回跳。
      // 各页面在自己的内容里显示自己的时间。

      var body;
      if (error && !state) {
        body = h(Empty, {
          title: t('common.error'),
          hint: error,
          action: h('button', { type: 'button', className: 'ccq_btn', onClick: loadState }, t('common.retry')),
        });
      } else if (!state) {
        body = h('div', { className: 'ccq_loading' }, t('common.loading'));
      } else if (tab === 'overview') {
        body = h(OverviewTab, { state: state, onRefresh: refresh, refreshing: refreshing });
      } else if (tab === 'bymodel') {
        body = h(ByModelTab, { state: state, onState: setState });
      } else if (tab === 'pricing') {
        body = h(PricingTab, { state: state });
      } else if (tab === 'settings') {
        body = h(SettingsTab, { state: state, onChanged: loadState });
      } else {
        body = h(DiagnosticsTab, { state: state });
      }

      return h(
        'div',
        { className: 'ccq_root', 'data-dsh-plugin': 'dsh-comcode-quota', 'data-ccq-tick': tick },
        h(
          'div',
          { className: 'ccq_head' },
          h(
            'div',
            { className: 'ccq_headText' },
            h('h2', { className: 'ccq_title' }, t('panel.title')),
            h('p', { className: 'ccq_sub' }, subParts.join(' · ')),
          ),
          h(
            'div',
            { className: 'ccq_headActions' },
            h(
              'button',
              { type: 'button', className: 'ccq_btn ccq_btnPrimary', onClick: refresh, disabled: refreshing },
              refreshing ? t('panel.refreshing') : t('panel.refresh'),
            ),
            // 更新时间只在标题下方那行副标题里显示一处：
            // 这里再放一个「x 秒前更新」会和它重复（同一屏两个相对时间只会让人困惑）。
          ),
        ),
        // 错误信息放在头部按钮旁会把标题挤成 0 宽并让面板横向溢出（长接口报错时更糟），
        // 单独占一整行 banner 更稳，也更容易读
        error
          ? h(
              'div',
              { className: 'ccq_banner', 'data-tone': 'error' },
              h('span', null, '⚠'),
              h('span', { className: 'ccq_bannerText' }, error),
            )
          : null,
        h(
          'div',
          { className: 'ccq_tabs', role: 'tablist' },
          TABS.map(function (key, idx) {
            return h(
              'button',
              {
                key: key,
                type: 'button',
                role: 'tab',
                id: 'ccq-tab-' + key,
                'aria-selected': tab === key ? 'true' : 'false',
                'aria-controls': 'ccq-panel-' + key,
                'aria-label': t('tabs.' + key),
                // 只有选中的 tab 在 Tab 键序列里，其余用左右箭头切换（ARIA tabs 模式）
                tabIndex: tab === key ? 0 : -1,
                className: 'ccq_tab',
                'data-active': tab === key ? '' : undefined,
                onClick: function () {
                  setTab(key);
                },
                onKeyDown: function (e) {
                  var delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                  if (!delta) return;
                  e.preventDefault();
                  var next = TABS[(idx + delta + TABS.length) % TABS.length];
                  setTab(next);
                  var node = typeof document !== 'undefined' ? document.getElementById('ccq-tab-' + next) : null;
                  if (node && node.focus) node.focus();
                },
              },
              t('tabs.' + key),
            );
          }),
        ),
        h(
          'div',
          {
            className: 'ccq_body',
            role: 'tabpanel',
            id: 'ccq-panel-' + tab,
            'aria-labelledby': 'ccq-tab-' + tab,
            tabIndex: -1,
          },
          body,
        ),
      );
    }

    /* ------------------------------------------------------------ 图标 */

    function QuotaPanelIcon(props) {
      var size = (props && props.size) || 16;
      return h(
        'svg',
        {
          'data-dsh-panel-entry': PANEL_ID,
          viewBox: '0 0 16 16',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '1.3',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
        },
        h('path', { d: 'M8 1.8a6.2 6.2 0 1 1-5.4 3.1' }),
        h('path', { d: 'M8 8V4.4' }),
        h('path', { d: 'M8 8l2.6 2.2' }),
        h('circle', { cx: '8', cy: '8', r: '0.9', fill: 'currentColor', stroke: 'none' }),
      );
    }

    /* ------------------------------------------------------------ 注册 */

    function registerPanel(ctx) {
      var slots = ctx.slots;
      if (!slots) return function () {};
      var disposers = [];
      try {
        disposers.push(
          slots.inject('sidebar.panellist', function () {
            return slots.register(
              {
                name: 'sidebar.panellist',
                id: PANEL_ID,
                order: PANEL_ORDER,
                label: function () {
                  return t('entry.label');
                },
              },
              QuotaPanelIcon,
            );
          }),
        );
      } catch (err) {
        console.warn('[dsh-comcode-quota] panellist register failed', err);
      }
      try {
        disposers.push(
          slots.inject('main', function () {
            return slots.register(
              {
                name: 'main',
                key: PANEL_ID,
              },
              QuotaPanel,
            );
          }),
        );
      } catch (err) {
        console.warn('[dsh-comcode-quota] main slot register failed', err);
      }
      return function () {
        for (var i = 0; i < disposers.length; i++) {
          try {
            disposers[i]();
          } catch (err) {
            /* ignore */
          }
        }
      };
    }

    var inject = ['slots'];

    function apply(ctx) {
      // 词典：注册进 Client locale 服务；服务不可用时用内置词典兜底
      try {
        if (ctx.locale && typeof ctx.locale.register === 'function') {
          ctx.effect(function () {
            try {
              return ctx.locale.register(NS, { zh: ZH, en: EN });
            } catch (err) {
              return function () {};
            }
          }, 'dsh-comcode-quota: dictionaries');
        }
        if (ctx.locale && typeof ctx.locale.bind === 'function') {
          boundT = ctx.locale.bind(NS);
        }
      } catch (err) {
        console.warn('[dsh-comcode-quota] locale setup failed', err);
      }

      try {
        ctx.effect(function () {
          return registerPanel(ctx);
        }, 'dsh-comcode-quota: panel');
      } catch (err) {
        console.warn('[dsh-comcode-quota] panel setup failed', err);
      }
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
