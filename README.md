<div align="center">

<img src="organization/simpleclaw/logo.svg" width="96" height="96" alt="SimpleClaw logo" />

# SimpleClaw

**Tell your computer what to do — SimpleClaw does it.**

A Windows desktop assistant that carries out on-screen tasks for you from a
plain-language goal. It looks at your screen, decides the next step with a
vision AI model, and drives the mouse and keyboard until the task is finished.

![Platform](https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0a0a0a?style=flat-square)
![License](https://img.shields.io/badge/license-Apache--2.0-FEDB00?style=flat-square&labelColor=0a0a0a)
[![Website](https://img.shields.io/badge/docs-website-FEDB00?style=flat-square&labelColor=0a0a0a)](https://simpletruss.github.io/simpleclaw-desktop/)
[![Download](https://img.shields.io/badge/download-Releases-0a0a0a?style=flat-square)](../../releases)

[**🌐 Website**](https://simpletruss.github.io/simpleclaw-desktop/) ·
[**⬇ Download**](../../releases) ·
[**🚀 Getting started**](docs/getting-started.md) ·
[**📖 User guide**](docs/user-guide.md)

</div>

> [!WARNING]
> **SimpleClaw takes real control of your mouse and keyboard.** Start with
> **Dry run** on, try it on a throwaway window first, and keep your hand near the
> **`F9`** emergency-stop key. See [Safety & privacy](docs/safety-and-privacy.md).

---

## What it does

You describe an outcome — *"open Notepad and type hello world"*, *"sort the table
in the open spreadsheet by the second column"* — and SimpleClaw does it for you on
your real desktop. It's a general-purpose **screen agent**: it works with whatever
is visible on your display, so it isn't limited to a fixed list of apps.

## How it works

```
your goal ─► take a screenshot ─► ask the AI model for the next action
     ▲                                            │
     │                                            ▼
     └──────── repeat until "finished" ◄──── perform the action (mouse/keyboard)
```

Each task runs as a loop of small, visible steps you can watch and stop at any
time. SimpleClaw is the "hands and eyes"; the AI model you connect it to is the
"brain".

## Quick start

1. **Install** — download the latest `SimpleClaw-<version>-setup.exe` from
   [Releases](../../releases) and run it.
2. **Connect your model** — open **⚙ Settings** and set the **Base URL**,
   **API key**, and **Model name** for your OpenAI-compatible vision endpoint.
3. **Run a task** — type a goal, keep **Dry run** ON to preview, then turn it off
   to let it act. Press **`F9`** to stop instantly.

Full walkthrough → [Getting started](docs/getting-started.md).

<details>
<summary><b>What can it do each step?</b></summary>

On every loop the model chooses exactly one action:

| Action | What it does |
|--------|--------------|
| `click` | Single left-click at a point. |
| `left_double` | Double-click (e.g. to open an item). |
| `right_single` | Right-click (context menus). |
| `drag` | Press, move, and release from one point to another. |
| `hotkey` | Press a keyboard shortcut (e.g. Ctrl+S). |
| `type` | Type a string of text. |
| `scroll` | Scroll the view up or down. |
| `wait` | Pause briefly to let something load. |
| `finished` | Declare the task complete and end the run. |

</details>

<details>
<summary><b>Safety at a glance</b></summary>

- **Dry run (default ON)** — preview actions without executing them.
- **Emergency stop `F9`** — aborts instantly, even when SimpleClaw isn't focused.
- **Step delay & max steps** — paced and capped so it can't run away.

More → [Safety & privacy](docs/safety-and-privacy.md).

</details>

## Documentation

| Guide | What's in it |
|-------|--------------|
| [🌐 Website](https://simpletruss.github.io/simpleclaw-desktop/) | The polished overview and hub. |
| [🚀 Getting started](docs/getting-started.md) | Install, connect your model, first task. |
| [📖 User guide](docs/user-guide.md) | Interface, settings, actions, and tips. |
| [🔒 Safety & privacy](docs/safety-and-privacy.md) | Guardrails, safe use, data handling. |
| [🛠 Troubleshooting](docs/troubleshooting.md) | Fixes for common issues. |

## Requirements

- **Windows 10 or 11.**
- A **vision-capable AI model** reachable at an OpenAI-compatible
  `/v1/chat/completions` endpoint (base URL, API key, model name).

## License

[Apache-2.0](LICENSE).
