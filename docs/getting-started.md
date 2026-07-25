# Getting started

[← Docs home](index.html) · [User guide](user-guide.md) · [Plugins](plugins.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md)

> **Applies to SimpleClaw 0.2.x** (current release). On an older build? Read the
> [0.1.x docs](https://github.com/Simpletruss/simpleclaw-desktop/tree/v0.1.2/docs) ·
> every version is listed on [Releases](https://github.com/Simpletruss/simpleclaw-desktop/releases).

This page takes you from zero to your first task in a few minutes.

---

## 1. Install SimpleClaw

1. Open the [Releases page](https://github.com/Simpletruss/simpleclaw-desktop/releases/latest)
   and download the build for your operating system:
   - **Windows** — the `.exe` installer
   - **macOS** — the `.dmg` disk image
   - **Linux** — the `.AppImage` (make it executable, then run it)
2. Run the installer/app and follow the prompts.
3. Launch **SimpleClaw** from your applications menu, Start menu, or desktop shortcut.

> Supported on **Windows 10/11**, **macOS**, and **Linux**. On the website the
> download button detects your OS automatically.

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

## Next steps

- Read the full [User guide](user-guide.md) for the interface, settings, and the
  complete list of actions.
- Review [Safety & privacy](safety-and-privacy.md) before using it on real work.
- Hit a snag? See [Troubleshooting](troubleshooting.md).
