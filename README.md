# Command Code quota (DSH plugin)

Live Command Code (GOAT plan) quota monitoring in the DeepSeek Harness sidebar: how much is left in the 5-hour / weekly / monthly windows, how fast it burns, and whether it lasts until reset.

This is a DSH re-host of the desktop app [`cc-quota-monitor`](https://github.com/Chygyo/cc-quota-monitor). The Electron tray window and floating widget are gone; the UI is now a sidebar panel with five tabs.

## Install

**Recommended: one-click tarball** (no clone, no dependencies, no build)

Paste this URL into **Plugins → Add plugin** in DSH:

```
https://github.com/Chygyo/dsh-comcode-quota/releases/download/v1.0.0/dsh-comcode-quota.tgz
```

Or have an agent call `plugin_manager` with `action: install_bundle` and that same URL as `target`. The plugin is dependency-free plain JS and works as soon as it is enabled.

**Developer route**: clone the repo and pass the package directory as `target`, or drop the directory at `~/.dsh/bundles/dsh-comcode-quota` and install from there.

After enabling, a **Quota** row appears in the sidebar below Skill explorer. Client-side edits to `client.js` need the plugin toggled off and on again to reload.

> If install reports an unsatisfied `engines.dsh`: this plugin needs DSH ≥ 0.2.2-rc.3. Older harness versions lack the `sidebar.panellist` panel slot, so the entry would never show up.

## Credentials

Resolved in this order, first hit wins:

1. **Manual key** saved from the Settings tab (stored in `~/.dsh/dsh-comcode-quota/settings.json`, mode 600)
2. **DSH credential store** — refs `COMMANDCODE_API_KEY`, `CMD_GOAT_API_KEY`, `COMMAND_CODE_API_KEY`. If you already use Command Code models in DSH, the key is in there and this plugin needs **zero setup**. Read through the `credentials` service (looked up lazily, so a profile without a credential provider still installs fine)
3. **Environment** `CMD_GOAT_API_KEY` / `COMMANDCODE_API_KEY` / `COMMAND_CODE_API_KEY`
4. **`~/.commandcode/auth.json`** written by the Command Code CLI (change triggers an automatic refresh)

When none of the four works, the Overview tab does not show a bare error: it shows a three-step setup guide (where to get a key, where to put it, a "check again" button) plus the live state of all four sources. The same list is available at `POST /api/dsh-comcode-quota/credentials/probe`.

The **Usage by model** tab needs something else: it reads `/internal/usage/by-model`, which is authenticated by the browser session cookie, not by an API key. If that tab reports no session, sign in to commandcode.ai once in Edge/Chrome/Brave/Arc/Vivaldi on the same machine — the plugin decrypts the cookie from the local browser profile (Keychain-backed) and never sends it anywhere else. It explains exactly that instead of reusing the API-key guide.

## Tabs

| Tab | Contents |
| --- | --- |
| Overview | Top bar (account, last fetch), three this-period cards (total tokens, total requests, CLOUD minutes this month), a large remaining-credit figure, and three window cards (remaining/total, used %, reset countdown, burn rate, projected exhaustion, rate ceiling to last until reset, daily budget) |
| Usage by model | Real spend per model: requests, tokens and credit share (share is based on credits consumed this month, not token count). Filterable and sortable. Reads the official `/internal/usage/by-model` endpoint, so it needs a signed-in commandcode.ai session in your browser |
| Pricing | Per-million prices for 75 models. Click any column header to sort (defaults to estimated cost ascending; rows without a value always sort last), plus a "how many more requests" estimate from your request profile |
| Settings | Credential source, API base URL, server fetch interval, timeout, history retention (including clearing samples), thresholds |
| Diagnostics | Version, Node, credential source, data directory, sample count, last fetch latency, errors, raw log |

The period totals and the per-day bars live inside Overview instead of taking a tab of their own.

## Where data lives

`~/.dsh/dsh-comcode-quota/`: `settings.json`, `history.json`, `app.log`. Deleting the directory resets everything.

## Host routes

Eleven routes, all behind a loopback guard (off-machine, proxied, or cross-site requests get 403):

```
GET  /api/dsh-comcode-quota/state
POST /api/dsh-comcode-quota/refresh
GET  /api/dsh-comcode-quota/settings
POST /api/dsh-comcode-quota/settings   # whitelisted + range-checked; {reset:true} restores defaults
GET  /api/dsh-comcode-quota/history    # ?since=<ms>
POST /api/dsh-comcode-quota/history-clear
GET  /api/dsh-comcode-quota/pricing    # ?in=&cache=&out= overrides the request profile
GET  /api/dsh-comcode-quota/by-model   # per-model usage (browser session)
POST /api/dsh-comcode-quota/by-model/refresh
POST /api/dsh-comcode-quota/by-model/probe
POST /api/dsh-comcode-quota/credentials/probe   # re-read all four credential sources
GET  /api/dsh-comcode-quota/diagnostics
```

## Differences from the original

- **Dropped**: tray icon, floating widget, system notifications, launch-at-login, global hotkey, theme switcher, PNG export, demo mode
- **Kept**: Command Code API client, burn-rate and exhaustion projection, history sampling, pricing table and request-capacity estimate
- **Added**: in-panel polling every 20 s, visible credential source, range validation on every settable field

## License

MIT, same as the original.
