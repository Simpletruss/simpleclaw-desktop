<div align="center">

<img src="organization/simpleclaw/logo.svg" width="96" height="96" alt="SimpleClaw logo" />

# SimpleClaw

**Tell your computer what to do — SimpleClaw does it.**

A desktop assistant for Windows, macOS, and Linux that carries out on-screen
tasks for you from a plain-language goal. It looks at your screen, decides the
next step with a vision AI model, and drives the mouse and keyboard until the
task is finished.

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-0a0a0a?style=flat-square)
![License](https://img.shields.io/badge/license-Apache--2.0-FEDB00?style=flat-square&labelColor=0a0a0a)
[![Website](https://img.shields.io/badge/docs-website-FEDB00?style=flat-square&labelColor=0a0a0a)](https://simpletruss.github.io/simpleclaw-desktop/)
[![Download](https://img.shields.io/badge/download-Releases-0a0a0a?style=flat-square)](https://github.com/Simpletruss/simpleclaw-desktop/releases/latest)

[**🌐 Website**](https://simpletruss.github.io/simpleclaw-desktop/) ·
[**⬇ Download**](https://github.com/Simpletruss/simpleclaw-desktop/releases/latest) ·
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

**New in 0.10 — fix a deployment where it runs, and talk to it.** Clicking an agent on a remote
server now opens the **same editor** a local one gets: correct its persona or its start URL in
place, without going back to the laptop that authored it. Its secrets stay on that machine, and
a deployment can still declare its agent files off limits. Runs can be **deleted** wherever they
live — with a second confirmation for the supervised demonstrations the planner learns from. Four
deployment switches are **gone** (`AUTOPLAY_ALLOW_AGENT_IMPORT`, `AUTOPLAY_ALLOW_SCENARIO_IMPORT`,
`AUTOPLAY_ALLOW_RUN_DELETE`, `AUTOPLAY_SCHEDULER`): uploads, deletes and schedules just work, and
schedules now run in server mode too. And SimpleClaw **listens and speaks** — a mic button
dictates a task, a wake word steers a run in flight, and the agent can answer through your
speakers, all from one pair of speech endpoints. See
[Talking to it](docs/user-guide.md#talking-to-it-voice) and
[Release notes](docs/release-notes.md).

**From 0.9 — one app, this computer or a server.** The desktop app and a deployed server
stopped being two separate things. A **server picker in the title bar** chooses which machine
the window is looking at — **This computer**, or any server you've registered under
**⚙ Settings → Run servers** — and the pages don't change, only where their data comes from.
Pointed at a deployment you see its agents, its run history, its scenarios and its schedules;
you can start a run or a whole scenario pass there and watch it live; and you can **send an
agent to it** from **Agents → General → Upload to a remote server** instead of copying folders
around. Agents are still authored on the machine that owns them and pushed — an upload creates
rather than overwriting unless you ask it to. Underneath, both modes
are now one build and one runtime: the same startup, the same configuration, the same API, the
same web UI. See [Pointing it at a server](docs/user-guide.md#pointing-it-at-a-server).

**From 0.8 — one saved process, several agents.** A **scenario** is an ordered list of steps
run as a single pass, and each step now names **which agent runs it** — so a process that
starts in a client portal and finishes in a staff console is one scenario instead of two you
sequence by hand. Steps hand values to each other: a step declares what it must report
(*the bundle reference*), and a later step writes `{{bundle_ref}}` in its task. Describe the
whole objective and **Compose** divides it into steps and routes each one for you. A pass runs
without a window open — from the scheduler, or over the API with
`POST /v1/scenarios/{id}/run`. See
[Running a whole process](docs/user-guide.md#running-a-whole-process-scenarios).

**From 0.7 — it can run as a server.** SimpleClaw doesn't have to be an app on somebody's
desktop. It can run **headless** — no window, nobody watching — exposing only its API, and it
ships as a **deployment bundle** on the [Releases page](https://github.com/Simpletruss/simpleclaw-desktop/releases/latest)
(`simpleclaw-server-<version>-docker.tar.gz`): extract it, `docker compose up -d`, and Docker
is the only prerequisite. Another system
hands it work over the network, follows each step live, and reads the answer back. Only
[headless-browser](docs/user-guide.md#where-the-agent-works-scope) agents run there (a
container has no desktop), and they sign in each run from credentials the platform injects
rather than from a saved profile. See [Server mode](docs/server-mode.md).

**From 0.6 — it can run on a schedule.** A task doesn't have to start when you ask for
it: schedule it for later or on a repeat (once, daily, weekly, or every N minutes), and
SimpleClaw wakes the right agent itself when the time comes. A **Scheduled** page shows
every armed schedule and the next runs due across all your agents, and scheduled runs are
labelled in history so you can tell them from work you started by hand. See
[Running a task later](docs/user-guide.md#running-a-task-later-scheduling).

If you run SimpleClaw from source, 0.6 added a **batch command** that takes a list of
tasks and runs them from one command line — several at a time if you raise the new
**Settings → General → Runs** limit. See
[Running many tasks at once](docs/user-guide.md#running-many-tasks-at-once-advanced).

Also in 0.6: model settings start with a **provider you pick by name** — Floxi, OpenAI,
Anthropic, Google, Qwen, or any OpenAI-compatible server of your own — which fills in that
provider's address and models for you ([Connect your AI model](docs/getting-started.md#2-connect-your-ai-model)),
and the always-on-top **run bar** stands in for the window whenever the window isn't on
screen ([The run bar](docs/user-guide.md#the-run-bar)).

**New in 0.4 — other agents can use it.** A local **Agent API** lets another AI agent hand
work to SimpleClaw: it decomposes your process, SimpleClaw carries out one operation at a
time on the real systems, streams each step back as it happens, and reports the answer.
That's the missing half for systems with no usable API — the agent plans, SimpleClaw
operates. See [Agent API](docs/agent-api.md).

**From 0.3 — it can also work off-screen.** Point an agent at a website and it runs
in its own **headless browser**, sealed to that site: nothing touches your screen or
mouse, so you keep working while the task runs. Sign in to it **once by hand** and
later runs start already signed in — and you can **take the controls** yourself
mid-run whenever a step needs a human (a login, a 2FA code, or an agent that's stuck).
See [Where the agent works](docs/user-guide.md#where-the-agent-works-scope).

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

1. **Install** — download the build for your OS from
   [Releases](https://github.com/Simpletruss/simpleclaw-desktop/releases/latest)
   (Windows `.exe`, macOS `.dmg`, or Linux `.AppImage`) and run it.
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
| `drag` | Drag one element onto another — how a list gets reordered, or an item moved. |
| `hotkey` | Press a keyboard shortcut (e.g. Ctrl+S). |
| `type` | Type a string of text. |
| `scroll` | Scroll the view up, down, left or right — sideways is how a wide table's off-screen columns get read. |
| `wait` | Pause briefly to let something load. |
| `finished` | Declare the task complete and end the run. |

</details>

<details>
<summary><b>Safety at a glance</b></summary>

- **Dry run (default ON)** — preview actions without executing them.
- **Emergency stop `F9`** — aborts instantly, even when SimpleClaw isn't focused.
- **Step delay & max steps** — paced and capped so it can't run away.
- **Scope** — confine an agent to one window, or to a headless browser sealed to a
  single site, instead of your whole desktop. Note that a browser agent you've signed
  in **acts with your account's authority** on that site.

More → [Safety & privacy](docs/safety-and-privacy.md).

</details>

## Documentation

> **On an older build?** The [docs site](https://simpletruss.github.io/simpleclaw-desktop/)
> publishes every released version — each page says which release it belongs to, and the
> version menu in its header switches between them. The files linked below are the copies
> in *this* branch or tag.

| Guide | What's in it |
|-------|--------------|
| [🌐 Website](https://simpletruss.github.io/simpleclaw-desktop/) | The polished overview and hub. |
| [🚀 Getting started](docs/getting-started.md) | Install, connect your model, first task. |
| [📖 User guide](docs/user-guide.md) | Interface, settings, actions, scopes, scenarios, and tips. |
| [🔌 Agent API](docs/agent-api.md) | Let another AI agent hand work to SimpleClaw (0.4 and later). |
| [🐳 Server mode](docs/server-mode.md) | Run it headless in a container — deployment, configuration, secrets (0.7 and later). |
| [🧩 Custom functions](docs/functions.md) | Give the agent a function of your own, no rebuild (0.5 and later). |
| [🔒 Safety & privacy](docs/safety-and-privacy.md) | Guardrails, safe use, data handling. |
| [🛠 Troubleshooting](docs/troubleshooting.md) | Fixes for common issues. |
| [🗒 Release notes](docs/release-notes.md) | What changed in each release, newest first. |

## Requirements

**A desktop OS** — Windows, macOS, or Linux (or, from 0.7, a container host: see
[Server mode](docs/server-mode.md)):

| Platform | Download | Notes |
|----------|----------|-------|
| **Windows 10 / 11** (x64) | `.exe` installer | Updates itself in the background. |
| **macOS** (Intel & Apple Silicon) | universal `.dmg` / `.zip` | Not code-signed yet — on first launch **right-click → Open** to get past Gatekeeper. Grant **Screen Recording** and **Accessibility** under *System Settings → Privacy & Security*, or it can't see the screen or move the pointer. Update by downloading the newer `.dmg`. |
| **Linux** (x64) | `.AppImage` | `chmod +x` it, then run. **X11 works best** — under Wayland the compositor may block screen capture and the global `F9` hotkey. |

Also needed:

- A **vision-capable AI model** reachable at an OpenAI-compatible
  `/v1/chat/completions` endpoint (base URL, API key, model name).
- **Google Chrome or Microsoft Edge** — only for the
  [headless-browser scope](docs/user-guide.md#where-the-agent-works-scope). The
  desktop and window scopes don't need it.

Nothing extra is needed for the [Agent API](docs/agent-api.md) — it's built into the app and
speaks plain HTTP, so a caller can be written in any language. To reach that API from another
machine, run SimpleClaw in [server mode](docs/server-mode.md); the desktop app's own API is
loopback-only by design.

## License

[Apache-2.0](LICENSE).
