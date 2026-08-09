# Troubleshooting

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Web APIs](web-apis.md) · [Server mode](server-mode.md) · [Functions](functions.md) · [Safety & privacy](safety-and-privacy.md) · [Release notes](release-notes.md)

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
| It keeps repeating the same click and never gets past a screen | The run already breaks the loop by itself, but it can only tell the agent to try something else — not *why* the element isn't there. Switch the **Observer** on for that agent (0.12 and later): when the guards catch a stall, the run waits for it to say what is actually on screen and which different move to make. See [When a run gets stuck](user-guide.md#when-a-run-gets-stuck-the-observer). |
| It reported success but nothing changed | Same answer: with the Observer on (0.12+), a `finished()` is checked against the screen first and sent back for one more turn if the goal isn't visibly done — once per run. Without it, the agent's own claim is final. |
| It reports a column or value as *missing* from a wide table | Those columns are past the table's right edge, and it reaches them by scrolling sideways (0.10.1 and later — older builds only ever scrolled up and down). If it still can't, the pane is too narrow to make progress: widen the window, or give a headless-browser agent a wider **viewport** on the Scope tab. |

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
| Signed in, but the next run is logged out | The profile was cleared with **Sign out**, or the site's session expired. Also make sure the login window was closed before the run started. (Before 0.10 a **Stay signed in between runs** checkbox could also be off; every browser agent now keeps its profile.) |
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

## Voice — dictation, wake word, spoken replies

*New in 0.10.* For the mic button and the agent's **Voice** tab
([user guide](user-guide.md#talking-to-it-voice)).

| Symptom | Likely cause / fix |
|---------|--------------------|
| The mic button flashes an error and stops | Microphone permission was denied, or another app holds the device. Allow the microphone for SimpleClaw in your OS privacy settings (**macOS:** *Privacy & Security → Microphone*), then click again. |
| The mic opens but no words appear | **Speech in** can't be reached. Check its Base URL on the agent's Voice tab, and its API key — a blank key only works when the host is the same one your model key belongs to. |
| The transcript is in the wrong language, or mixes badly | Leave **Language** blank for auto-detect. Pinning one language makes the other worse, which matters for mixed Chinese/English speech. |
| Numbers, ids or names come out wrong | Turn on **Post-edit**: one short model pass per finished sentence normalizes spoken numbers and ids. It only rewrites settled text, never the words appearing as you speak. |
| **Test** speaks, but too fast, too slow, or squeaky | The **sample rate** doesn't match what your voice pack returns — nothing in the protocol reports it, so it's a setting. Try 24000 (the default) or the rate your endpoint documents. **Speed** is separate (0.25–4). |
| **Test** does nothing at all | **Speech out** can't be reached, or the endpoint doesn't do `response_format: pcm`. The error appears beside the button. |
| The wake word never triggers | Use a real dictionary word — coined names often aren't recognized. Also check **Voice wake** is enabled *and* started (**Start listening**), and that you're on the machine doing the listening. |
| It reacts to speech that wasn't meant for it | Turn on **Commands only**, which drops utterances that aren't instructions, and/or **Owner voice only** after enrolling your voice. Both cost a little latency per utterance. |
| A window pointed at a server can't start listening | Correct — a microphone belongs to the machine doing the listening. You can edit that server's voice settings, but its listener starts there. |

## Running many tasks at once

For the batch command
([user guide](user-guide.md#running-many-tasks-at-once-advanced)). It ships with the
**source repo only** — there's no batch command in the installed app.

| Symptom | Likely cause / fix |
|---------|--------------------|
| `npm run batch` isn't recognised | You're in an installed copy, not a source checkout. The batch command lives in the SimpleClaw source tree; the `.exe`/`.dmg`/`.AppImage` doesn't include it. |
| I raised **Runs** but tasks still go one at a time | Three things override the number: tasks sharing one browser agent (one saved profile, so they queue), agents that work on your **real screen** (they'd fight over one mouse), and passing `--parallel 1`. The startup line prints the limit actually in force. |
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
| Scheduled tasks never fire | From 0.10 schedules run in every mode and `AUTOPLAY_SCHEDULER` is gone, so check the entry itself and that the process stayed up. On an older build, that variable was required. |
| One scheduled task ran several times | Several replicas share one data directory, so each armed the same timer. Run **one** replica where schedules matter. |
| Chrome dies instantly with `Failed to create … SingletonLock: Permission denied` | The browser profile is on storage that refuses symlinks (Azure Files and other SMB shares). From 0.10 profiles live under `AUTOPLAY_DATA_DIR/browser-profiles`, not in the mounted `orgs/` — put *that* path on storage that allows symlinks, or leave it in the container. |
| A run stalls on a login page | Unattended sign-in can't pass MFA or a CAPTCHA. Either sign the agent in once over a [sign-in link](server-mode.md#signing-in-by-hand-on-a-machine-with-no-screen) (*0.11.2*), or open the run's live link and [take the controls](user-guide.md#taking-control-mid-run). Both need `AUTOPLAY_PUBLIC_URL` set, or no link is handed out. |
| A sign-in link answers `409` | Chrome locks a profile directory, so a link can't open while a run is using that agent's browser or a warm one still holds it. Wait for the run, or stop it. |
| The agent was signed in and came back signed out | Before *0.11.3* a retiring worker killed its browser instead of closing it, and the profile never got the session written. Update. Otherwise: the profile lives under `AUTOPLAY_DATA_DIR`, so a new revision or replica move loses it, and the site may expire the session on its own schedule. |
| Two tasks for one agent still run one after the other | By design — an agent has one browser profile and Chrome locks it. Concurrency (`AUTOPLAY_MAX_CONCURRENT_RUNS`, default 2) is across *different* agents. |
| Runs die together with no obvious error | An OOM kill takes down every run on the instance. Budget ~0.9 GB per concurrent slot, or set `AUTOPLAY_MAX_CONCURRENT_RUNS=1`. |
| **Take control** does nothing on a busy server | Fixed in *0.11.3* — a run executing in a worker process couldn't be taken over, and a takeover pause was reported as a manual one, so the watchdog could stop the run out from under you. Update. |
| A browser request is refused cross-origin | `AUTOPLAY_CORS_ORIGINS` takes exact origins, comma-separated. There is no wildcard. |

## Pointing the app at a server

*New in 0.9.* For a desktop window pointed at a remote server
([Pointing it at a server](user-guide.md#pointing-it-at-a-server)). Press **Check** on the entry
first — it probes the URL, then the token, then uploads, and names which one failed.

| Symptom | Likely cause / fix |
|---------|--------------------|
| *"could not be reached. If the host is up, it may not list this app's origin"* | Almost always the **CORS** list. The server must name this app's origin: `AUTOPLAY_CORS_ORIGINS=app://renderer,http://localhost:5173`. Settings → Run servers → Remote servers shows the line with a Copy button. A browser blocks the call before the server sees it, so its own logs show nothing. |
| **Check** passes but every page is empty | Right server, wrong organization — you're seeing a real, empty roster. Check `AUTOPLAY_ACTIVE_ORG` on that server. |
| *"rejected the token"* | Wrong or rotated bearer. Paste the credential **only** — a value that already starts with `Bearer ` becomes `Bearer Bearer …` and 401s. The app strips it, but a proxy in front may not. |
| *"does not accept uploaded agents"* / `501` | On 0.10 there is nothing to switch on, so this means that **executor is an older build** (it needed `AUTOPLAY_ALLOW_AGENT_IMPORT=1`, or `AUTOPLAY_ALLOW_SCENARIO_IMPORT=1` for scenarios). Set the variable there, or update it. |
| The upload worked but the agent won't run | The response's `supported` was false — usually a desktop- or window-scope agent on a server that has no screen. Set its [scope](user-guide.md#where-the-agent-works-scope) to **Headless browser** and upload again. |
| Uploading twice gave me two agents | An upload **creates** unless **Overwrite** is ticked, so a colliding id gets a suffix rather than replacing something possibly mid-run. Delete the old one deliberately, or upload with Overwrite. |
| A scenario is there but won't run | It names agents that aren't on that server yet. The upload result lists them; upload those agents too. |
| Typing in a remote agent's editor does nothing | That deployment pinned `AUTOPLAY_AGENTS_READONLY=1`, which refuses edits with `409`; the banner names it. Unset it there, or edit locally and upload. |
| An edit saved but the agent still uses the old value | A model field the server's environment pins (`AUTOPLAY_MODEL_*`) always wins over what's stored. The editor flags those fields — change the deployment's environment instead. |
| Some sections of a remote agent won't edit | Skills, functions, demonstrations, the signed-in profile and that machine's monitors are files and devices over there, not config. Each says where it lives. |
| *"cannot open an agent's config"* / *"cannot delete runs"* | That executor's **build** predates `GET /v1/agents/:id` or `DELETE /v1/runs/:id`. Update it; there is no setting for either. |
| Deleting a run was refused | A run still in flight is refused until it's stopped, and a **supervised demonstration** needs the extra confirmation (type *Yes*) because the planner learns from it. |
| Arming a schedule answers `501` | An older build without unconditional schedules — it needed `AUTOPLAY_SCHEDULER=on`. From 0.10 the route is always there. |
| It reopened pointed at this computer | Deliberate — the selection isn't persisted, so you can't be left unknowingly pointed at production. |

## Web APIs (0.11 and later)

| Symptom | Likely cause / fix |
|---------|--------------------|
| **Send** is refused and no status code is shown | Nothing left the machine: a variable with no value, or a `{{secret:…}}` this machine can't resolve. The message names it. |
| *"cannot save the value safely"* when typing a token | This machine has no OS credential store (a Linux box without libsecret, typically). Set `AUTOPLAY_SECRET_<NAME>` in the environment instead — the message gives the exact name. |
| **Save** is refused because of a credential | The pre-commit scan found one, and it cannot be switched off. Replace the literal with `{{secret:NAME}}` and save the value; if it genuinely isn't a credential, allowlist its fingerprint in `apiclient.json`. |
| **Share** is rejected | Somebody pushed first. **Get changes**, resolve anything conflicting, then **Share** again — that's the normal loop, not a failure. |
| A private repository won't clone or push | It needs a token, which is asked for at the moment an operation needs one and stored with OS encryption. |
| `npm run apitest` exits `2` having sent nothing | A selector matched nothing, the named environment doesn't exist, or the workspace has no requests. All three refuse on purpose — a green zero-step run is worse than a red one. |
| `{{something}}` arrived at the server with the braces still in it | It isn't a reference the resolver recognises (a `.` in the name, for example). Those are painted differently from real references as you type. |
| An imported request 401s where Postman didn't | Postman substitutes its stored value; here the token is a `{{secret:…}}` name that needs a value on this machine. The import report lists every credential it extracted. |
| The agent ignores its saved requests | Check the collection is granted to that agent, and that the request is `GET`/`HEAD` unless writes are enabled — a write isn't even listed to a read-only agent. |
| A request passes on **Send** but fails in `npm run apitest` or under an agent | Its [script](web-apis.md#scripts) doesn't run on those paths (*0.11.4*) — CI and agents grade the committed document. Move what the script does into a **Capture** or a **Test**. |
| A script set a variable and nothing kept it | `pm.environment.set` writes to the **selected** environment; with none selected there's nowhere to put it, and the response pane says so. |
| A script "ran past its time limit" / `pm.x is not a function` | Scripts get 2 seconds and run synchronously, and `pm.expect` implements the matchers real tests use rather than all of chai — an absent one names itself instead of answering wrongly. |
| A `GET` sent no body | Deliberate: `fetch` rejects a body on `GET`/`HEAD` before a packet leaves. `DELETE` and `OPTIONS` bodies *are* sent (*0.11.4*); the copied code snippet still renders a `GET` body faithfully for tools that can send one. |

More detail on all of these: [Web APIs](web-apis.md#troubleshooting).

## Still stuck?

- Re-read [Getting started](getting-started.md) to confirm setup.
- Check the [User guide](user-guide.md) settings reference.
- Make sure you're on the latest build from the [Releases page](https://github.com/Simpletruss/simpleclaw-desktop/releases).
