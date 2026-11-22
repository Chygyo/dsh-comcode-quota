# Command Code 额度监控（DSH 插件）

在 DeepSeek Harness 侧边栏里实时查看 Command Code（GOAT 套餐）的额度消耗：5 小时 / 每周 / 每月三个窗口还剩多少、烧得多快、能不能撑到重置。

这是原桌面应用 [`cc-quota-monitor`](https://github.com/Chygyo/cc-quota-monitor) 的 DSH 载体移植版——原来靠 Electron 托盘窗口和悬浮窗，现在改成侧边栏面板 + 5 个标签页，不再有托盘和独立窗口。

## 安装

两种方式，任选其一：

- **GUI**：打开侧边栏「插件」→ 添加插件 → 选本地目录 `~/.dsh/bundles/dsh-comcode-quota`。
- **命令行**：让 agent 用 `plugin_manager` 的 `install_bundle` 动作，`target` 传包目录的绝对路径。

装好后侧边栏「技能中心」下面会出现一行「额度」。改动 `client.js` 后需要在插件页里关掉再打开一次才会重载。

## 凭据

按优先级自动找，命中即止：

1. **设置页手动填的 Key**（保存在 `~/.dsh/dsh-comcode-quota/settings.json`，权限 600）
2. **DSH 凭据库** —— `COMMANDCODE_API_KEY` / `CMD_GOAT_API_KEY` / `COMMAND_CODE_API_KEY` 三个名字都认。只要你在 DSH 里用过 Command Code 的模型，Key 就已经在那儿了，**装上即用、零配置**。走 `credentials` 服务惰性读取，所以没装凭据提供方的 profile 也能正常安装本插件
3. **环境变量** `CMD_GOAT_API_KEY` / `COMMANDCODE_API_KEY` / `COMMAND_CODE_API_KEY`
4. **`~/.commandcode/auth.json`**（Command Code CLI 登录后生成；文件变化会自动重新拉取）

四条都没走通时，概览页不会只丢一句错误：直接显示三步引导（去哪拿 Key → 存到哪 → 点一下重测），并列出四条来源的实时状态。诊断页和 `POST /api/dsh-comcode-quota/credentials/probe` 能看到同一份清单。

**模型用量**页要的是另一样东西：它读 `/internal/usage/by-model`，走的是浏览器会话 cookie，不是 API Key。读不到时它不会让你去翻 Key，而是告诉你「在本机 Edge/Chrome/Brave/Arc/Vivaldi 里登录一次 commandcode.ai」——插件从本机浏览器配置里解出 cookie（钥匙串授权），不会发去别处。

## 面板

| 标签页 | 内容 |
| --- | --- |
| 概览 | 顶栏（账号、最近拉取）+ 本期用量三张卡（TOKEN 总数、运行总次数、CLOUD 本月分钟）+ 剩余额度大数字 + 三张窗口卡（剩余/总额、已用比例、重置倒计时、消耗速度、预计用完时间、可承受速度、每日预算） |
| 模型用量 | 按模型看真实消耗：请求数、TOKEN 数、额度占比（按本月额度消耗算，不是 token 数），可筛选、点表头排序。数据走官网 `/internal/usage/by-model`，需要浏览器里登录过 commandcode.ai |
| 模型价目表 | 75 个模型的单价表，点表头任意列可排序（默认按单次估算升序，无数据的模型永远排最后）；按你的典型请求画像估算「剩余额度还能跑几次」 |
| 设置 | 凭据来源、API 地址、服务端抓取间隔、超时、历史留存（含清空采样历史）、告警阈值 |
| 诊断 | 版本、Node、凭据来源、数据目录、采样数、最近拉取耗时、错误、原始日志 |

概览与原来的「用量历史」是同一个页面，本期用量直接长在下面，不再单独占一个 tab。CLOUD 卡统计的是云端沙箱按分钟计费的用量，按自然月重置（不是账单周期）。

## 数据落在哪

`~/.dsh/dsh-comcode-quota/`：`settings.json`（配置）、`history.json`（采样点）、`app.log`（运行日志）。删掉这个目录等于恢复出厂设置。

## Host 路由

插件在 Host 侧注册了 11 条路由，全部前置 loopback 校验（非本机、带代理头、跨站来源一律 403）：

```
GET  /api/dsh-comcode-quota/state          # 完整状态（快照 + 派生指标 + 设置摘要）
POST /api/dsh-comcode-quota/refresh        # 立即刷新
GET  /api/dsh-comcode-quota/settings       # 当前设置（手动 Key 只回掩码）
POST /api/dsh-comcode-quota/settings       # 改设置（白名单字段 + 范围校验；{reset:true} 恢复默认）
GET  /api/dsh-comcode-quota/history        # 采样点（?since=<ms>）
POST /api/dsh-comcode-quota/history-clear  # 清空历史
GET  /api/dsh-comcode-quota/pricing        # 价目表（?in=&cache=&out= 覆盖请求画像）
GET  /api/dsh-comcode-quota/by-model       # 按模型用量（走浏览器登录态）
POST /api/dsh-comcode-quota/by-model/refresh
POST /api/dsh-comcode-quota/by-model/probe
POST /api/dsh-comcode-quota/credentials/probe  # 重读四条凭据来源
GET  /api/dsh-comcode-quota/diagnostics    # 诊断信息
```

## 和原项目的差异

- **砍掉**：托盘图标、悬浮窗、系统通知、开机自启、全局快捷键、主题切换、PNG 导出、演示模式
- **保留**：Command Code API 客户端、burn rate / 额度耗尽预测、历史采样、价目表与「还能跑几次」估算
- **新增**：面板内实时刷新（20 秒轮询）、凭据来源可视化、设置字段范围校验

## 许可

MIT，跟原项目一致。
