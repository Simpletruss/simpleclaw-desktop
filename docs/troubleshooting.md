# Troubleshooting

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Plugins](plugins.md) · [Safety & privacy](safety-and-privacy.md)

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

## Still stuck?

- Re-read [Getting started](getting-started.md) to confirm setup.
- Check the [User guide](user-guide.md) settings reference.
- Make sure you're on the latest build from the [Releases page](https://github.com/Simpletruss/simpleclaw-desktop/releases).
