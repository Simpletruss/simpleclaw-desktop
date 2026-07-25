# Getting started

[← Docs home](index.html) · [User guide](user-guide.md) · [Plugins](plugins.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/getting-started.html)
> labels each page with its release and can switch between versions.

This page takes you from zero to your first task in a few minutes.

---

## 1. Install SimpleClaw

1. Open the [Releases page](https://github.com/Simpletruss/simpleclaw-desktop/releases/latest)
   and download the build for your operating system:
   - **Windows 10/11** (x64) — the `.exe` installer
   - **macOS** (Intel or Apple Silicon) — the `.dmg` disk image (one universal
     build runs natively on both)
   - **Linux** (x64) — the `.AppImage`
2. Run the installer/app and follow the prompts.
3. Launch **SimpleClaw** from your applications menu, Start menu, or desktop shortcut.

> On the website the download button detects your OS automatically.

### First launch, per platform

SimpleClaw has to *see* your screen and *drive* your pointer, and each OS gates that
differently:

- **Windows** — nothing extra. Install and run.
- **macOS** — the build isn't code-signed yet, so the first launch needs
  **right-click → Open** (double-clicking shows "cannot be opened"). Then open
  *System Settings → Privacy & Security* and allow SimpleClaw under both
  **Screen Recording** and **Accessibility** — without them it either sees a blank
  screen or can't move the pointer. Restart the app after granting them.
- **Linux** — make the file executable first (`chmod +x SimpleClaw-*.AppImage`), then
  run it. An **X11** session works best: under **Wayland** the compositor can block
  both screen capture and the global `F9` hotkey, in which case use the in-app
  **Stop** button and consider logging into an X11 session instead.

> **Updates:** Windows and Linux builds update themselves in the background. macOS
> builds don't (that needs code signing) — download the newer `.dmg` when you want to
> upgrade.

## 2. Connect your AI model

SimpleClaw needs a **vision-capable AI model** to see your screen. You point it at
your provider once.

1. Open **⚙ Settings**.
2. Enter:
   - **Base URL** — your provider's API address (an OpenAI-compatible
     `/v1/chat/completions` endpoint).
   - **API key** — your access key for that provider.
   - **Model name** — the exact vision model to use.
3. Save.

> Don't have these details? Ask whoever set up your AI model access for the base
> URL, key, and model name.

## 3. Run your first task (safely)

1. Open a **throwaway window** to practice on — e.g. an empty Notepad document.
2. In the **goal bar**, type a small, concrete goal:
   > Open Notepad and type "hello world"
3. Leave **Dry run** ON and press **Run**.
   - In dry-run, SimpleClaw *shows* the actions it would take but does **not**
     move your mouse or type.
4. Watch the **Action timeline** and the **screenshot marker** to confirm it's
   aiming at the right places.
5. When you're satisfied, turn **Dry run** OFF and press **Run** again to let it
   act for real.
6. To stop at any moment, press **`F9`** or click **Stop**.

## 4. Optional — run it on a website instead of your screen

If your task lives in a web app, an agent can work in its **own headless browser**
rather than on your real desktop — in the background, without touching your mouse.

1. Open the agent's **Scope** tab and choose **Headless browser**.
2. Enter the **start URL**. The agent is sealed to that site.
3. If the site needs a login, press **🔓 Log in once…**, sign in by hand in the
   window that opens (2FA included), then close it. Later runs start signed in.
4. Run your task as usual. Hover the frame while it runs to **take the controls**
   yourself if a step needs a human.

Details and caveats → [Where the agent works](user-guide.md#where-the-agent-works-scope).

## Next steps

- Read the full [User guide](user-guide.md) for the interface, settings, scopes, and
  the complete list of actions.
- Review [Safety & privacy](safety-and-privacy.md) before using it on real work.
- Hit a snag? See [Troubleshooting](troubleshooting.md).
