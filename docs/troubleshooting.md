# Troubleshooting

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Server mode](server-mode.md) · [Functions](functions.md) · [Safety & privacy](safety-and-privacy.md) · [Release notes](release-notes.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/troubleshooting.html)
> labels each page with its release and can switch between versions.

Quick fixes for the most common issues.

---

| Symptom | Likely cause / fix |
|---------|--------------------|
| No response, errors, or "can't connect" | Re-check **Base URL**, **API key**, and **Model name** in Settings. Confirm the endpoint is reachable from your machine (network/VPN). |
| Model replies but actions seem random | The model may not be **vision-capable**, or the wrong model name is set. Use a vision model. |
| Clicks land in the wrong place | Run in **Dry run** first and verify the marker. Make sure the target window is fully visible on the monitor the agent captures, and isn't moved or resized mid-run. |
| It stops partway through a long task | You may have hit **Max steps**. Increase it in Settings, or split the task into smaller goals. |
| It won't stop | Press **`F9`** — it works even when SimpleClaw is in the background. |
| "It does nothing" | **Dry run** is probably still ON. Turn it off once you're ready for real actions. |
| Actions happen too fast to follow | Increase the **Step delay** in Settings so each step is easier to watch and interrupt. |
| The next screenshot shows the *old* page after a click | Raise **Nav settle** so the page has time to load before the model looks again. |

## Platform-specific

| Symptom | Likely cause / fix |
|---------|--------------------|
| **macOS:** "SimpleClaw can't be opened because it is from an unidentified developer" | The build isn't code-signed yet. **Right-click the app → Open**, then confirm. Only needed the first time. |
| **macOS:** screenshots are blank, or clicks do nothing | Missing permissions. *System Settings → Privacy & Security* → allow SimpleClaw under **Screen Recording** *and* **Accessibility**, then restart the app. |
| **macOS:** an update downloads but never installs | Auto-install needs a signed build. Download the newer `.dmg` from Releases instead. |
| **Linux:** the `.AppImage` won't start | Make it executable: `chmod +x SimpleClaw-*.AppImage`. |
| **Linux:** black screenshots, or `F9` does nothing | You're probably on **Wayland**, which can block screen capture and global hotkeys. Use the in-app **Stop** button, or log into an **X11** session. |
| **Linux/macOS:** the headless-browser scope says no browser was found | It drives your installed **Chrome or Edge**. Install one, or use a desktop/window scope. |

## Headless-browser scope

For agents whose **Scope** is a headless browser
([user guide](user-guide.md#where-the-agent-works-scope)).

| Symptom | Likely cause / fix |
|---------|--------------------|
| Nothing in the frame area for the first 10–25 s | Normal on a cold start — the browser has to launch and load the page. That area names the phase it's in and counts the seconds; if the count climbs well past ~30 s, the site itself is slow or unreachable. |
| "That profile is already in use" | The agent's browser profile can only be open once. Close the **Log in once** window, or stop the run, then try again. |
| The agent is stuck on a login page | It cannot know your password. Use **Scope → 🔓 Log in once…**, sign in by hand in the window that opens, close it, and run again. |
| Signing in bounces back to the start page | The login goes through a different host. Add it under **Scope → Also allow these origins** (e.g. your SSO domain) — outside origins are sent back by design. |
| Signed in, but the next run is logged out | **Stay signed in between runs** is off, or the profile was cleared with **Sign out**. Also make sure the login window was closed before the run started. |
| "No Chrome/Edge found" | This scope drives your installed Chrome (or Edge). Install one, or use a desktop/window scope instead. |
| Small buttons get mis-clicked | Try a **smaller viewport** on the Scope tab. A higher resolution can make small targets *harder* to hit, not easier — 1280×800 is the default for that reason. |
| Take control shows the page below 100 % | The window can't fit the viewport at 1:1, so it scales down instead of cropping (cropping would hide parts you need to click). Maximize or enlarge the window for exact 1:1. |
| `Esc` doesn't reach the page while driving it | `Esc` is reserved for handing control back. Hand back and let the agent press it, or use the on-page control instead. |

## Scheduled tasks

For tasks set to run later or on a repeat
([user guide](user-guide.md#running-a-task-later-scheduling)).

| Symptom | Likely cause / fix |
|---------|--------------------|
| The time passed and nothing ran | SimpleClaw has to be **open** when a schedule fires — it's a timer in the app, not a Windows/macOS scheduled job. A one-off you missed runs shortly after you next open the app; a repeat rolls forward to its next time. |
| It "ran" but nothing happened on screen | That agent's **Dry run** is on, so the run only planned. Dry run belongs to the agent, not to the schedule — turn it off on the agent that the schedule wakes. |
| An occurrence was skipped | Something else was running at that moment (SimpleClaw does one thing at a time). A repeating schedule tries again next time; a **one-off is dropped**, not queued. |
| A repeat didn't catch up after the app was closed for days | By design — missed repeats aren't made up. A daily 09:00 task runs once at the next 09:00, not once per missed day. |
| The wrong agent ran it | A schedule wakes the agent it was **created for**, whichever agent is selected in the window. Check the **Scheduled** page: entries are grouped by agent. |
| A schedule fires but the run errors immediately | Usually the target app/window isn't in the state the task assumes, or two copies of SimpleClaw are open and competing for the screen. Open the run from **Run history** (it carries the **Schedule** label) to see where it stopped. |
| I can't find a schedule I created | The sidebar's **Scheduled** page lists every one across all agents; clear the agent/type/when filters if the list looks short. A one-off disappears once it has fired. |

## Running many tasks at once

For the batch command
([user guide](user-guide.md#running-many-tasks-at-once-advanced)). It ships with the
**source repo only** — there's no batch command in the installed app.

| Symptom | Likely cause / fix |
|---------|--------------------|
| `npm run batch` isn't recognised | You're in an installed copy, not a source checkout. The batch command lives in the SimpleClaw source tree; the `.exe`/`.dmg`/`.AppImage` doesn't include it. |
| I raised **Runs** but tasks still go one at a time | Three things override the number: tasks sharing an agent with **Stay signed in** on (one saved browser profile, so they queue), agents that work on your **real screen** (they'd fight over one mouse), and passing `--parallel 1`. The startup line prints the limit actually in force. |
| Nothing ran and it listed problems instead | The whole list is validated first, deliberately. Fix every line it names — usually a misspelled agent, an agent still in **Dry run**, or a real-screen agent without `--allow-desktop`. |
| A task ended with "paused for input with nobody to answer" | The agent stopped to ask a question mid-run and no one was there. Batch only suits tasks you've already watched succeed unattended; make the goal specific enough that it doesn't need to ask. |
| One task timed out at the same number of minutes every time | That's `--timeout` doing its job. Either the goal is too big for the limit or the agent is stuck in a loop — open the run in **Run history** and read the steps before raising it. |
| It got slower, or the machine ran out of memory | Every parallel task starts its own browser. Lower **Runs** (or `--parallel`) until it fits; this is bounded by memory, not by processor cores. |
| I can't find the runs afterwards | They're in **Run history** like any other run, under the agent that carried each one out. The summary line prints each task's session id. |

## Server mode and containers

For a headless deployment ([Server mode](server-mode.md)). Almost everything here is a
**startup** failure on purpose — a misconfigured executor is meant to die with a readable
message rather than pass its probes and fail on the first real request.

| Symptom | Likely cause / fix |
|---------|--------------------|
| `no display available — start Xvfb before Electron` | Electron needs an X server on Linux even with no windows. The image's entrypoint starts one; you'll only see this running the entry point yourself, or with a broken entrypoint. |
| `no browser-scope agent` at startup | The active organization has no agent that could run here — desktop and window scopes are refused in server mode. Either point `AUTOPLAY_ACTIVE_ORG` at the org that has your browser agents, or change the agent's [scope](user-guide.md#where-the-agent-works-scope). |
| `no model API key for: <agent>` at startup | A browser-scope agent in the active org has no key, in its own file or from the environment. Set `AUTOPLAY_MODEL_API_KEY` (or `_FILE`) — it applies to every agent. |
| It starts, then every run `401`s on the first model call | An `AUTOPLAY_MODEL_*` variable is overriding the key in `agent.json`, and it's the wrong one. The overlay always wins; the startup log names which variables are overriding what. |
| `422` from `POST /v1/runs` | That agent's scope isn't a headless browser. `GET /v1/capabilities` greys out the ones that can't run here. |
| `501` from `POST /v1/window/show` | Expected — a headless executor has no window. Use the run's live link instead. |
| Refuses to start, complaining about the bind and the token | It won't publish a non-loopback port protected only by a token it generated itself, because nothing outside the process could know it. Set `AUTOPLAY_AUTH_MODE` with a real credential. |
| Startup names a half-configured setting | `jwt` mode needs public key, issuer *and* audience; `AUTOPLAY_STORE=mongo` needs both URI and database. Half of either is a hard stop rather than a silent fallback. |
| The container is killed before runs finish | The platform's termination grace period is shorter than the drain. It stops accepting work and gives the active run up to 15 s to write itself to history; allow more than that. |
| Readiness never passes on a cold start | A first start pays for the X server, Electron and the first Chrome launch. Allow ~90 s before `/v1/ready` has to answer. |
| An env var seems to be ignored | An empty value counts as **unset** by design, so a platform rendering `-e FOO=` can't blank out a working setting. Check the variable actually has a value. |
| Agents look wrong, or the roster is empty | The mount isn't where the executor is reading from. Agents come from `{AUTOPLAY_DATA_DIR}/orgs` unless `ORGANIZATIONS_DIR` says otherwise — and in Git Bash on Windows, `MSYS_NO_PATHCONV=1` before `docker run`, or container paths get rewritten to Windows ones. |
| Edits to `agent.json` don't take effect | Live reload is off unless `AUTOPLAY_AGENTS_WATCH_MS` is set; without it, restart. A reload also only affects the **next** run, not one already going. |
| Agent files got rewritten or deleted | `AUTOPLAY_AGENTS_READONLY` was turned off against a real mount. Don't — migration state lives in the container, so each start looks like a first start and a writable roster pass rewrites the set. Restore from a copy. |
| My desktop run history disappeared | Retention swept the mount. The defaults (7-day screenshots, 30-day sessions, 2 GB) apply to whatever is behind it — set all three to `0` for a folder you also use from the app. |
| Scheduled tasks never fire | Schedules are off in server mode; several replicas would each fire the same one. `AUTOPLAY_SCHEDULER=on` if you run exactly one instance. |
| A run stalls on a login page | Unattended sign-in can't pass MFA or a CAPTCHA. Open the run's live link and [take the controls](user-guide.md#taking-control-mid-run) — and set `AUTOPLAY_PUBLIC_URL`, or no link is handed out. |
| A browser request is refused cross-origin | `AUTOPLAY_CORS_ORIGINS` takes exact origins, comma-separated. There is no wildcard. |

## Still stuck?

- Re-read [Getting started](getting-started.md) to confirm setup.
- Check the [User guide](user-guide.md) settings reference.
- Make sure you're on the latest build from the [Releases page](https://github.com/Simpletruss/simpleclaw-desktop/releases).
