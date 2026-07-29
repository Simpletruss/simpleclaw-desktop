# Troubleshooting

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Functions](functions.md) · [Safety & privacy](safety-and-privacy.md)

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

## Still stuck?

- Re-read [Getting started](getting-started.md) to confirm setup.
- Check the [User guide](user-guide.md) settings reference.
- Make sure you're on the latest build from the [Releases page](https://github.com/Simpletruss/simpleclaw-desktop/releases).
