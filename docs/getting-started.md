# Getting started

[← Docs home](index.html) · [User guide](user-guide.md) · [Agent API](agent-api.md) · [Server mode](server-mode.md) · [Functions](functions.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md) · [Release notes](release-notes.md)

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

A fresh install already points at a **hosted gateway**, so there's nothing to install
locally to get started — you only need a key for it.

1. Open **⚙ Settings** and open the model settings for the **Planner**.
2. Pick your **Provider** (*new in 0.6*). Choosing one fills in its address and offers its
   models, so usually the only thing left to type is the key:

   | Provider | Points at | You supply |
   |----------|-----------|------------|
   | **Floxi** | The hosted gateway SimpleClaw ships with — the default | An API key |
   | **OpenAI** · **Anthropic** | That vendor's cloud API | An API key |
   | **Google** | A local inference server on `localhost:8080`, serving Google models. Change the address to `https://generativelanguage.googleapis.com/v1beta` to use the Gemini cloud API instead | A key, for the cloud API |
   | **Qwen** | A local inference server on `localhost:8080` | Nothing, if it's on this machine |
   | **Custom (OpenAI-compatible)** | Any other server speaking `/v1/chat/completions` — your own vLLM, LM Studio, llama.cpp, or a company gateway | The address, and a key if it wants one |

3. Check the three fields under it:
   - **Base URL** — the API address. Pre-filled from the provider; editable.
   - **API key** — your access key. Stored locally on your machine, never sent anywhere
     but that endpoint.
   - **Model name** — the exact model to use. **It must be vision-capable**, since the
     agent works from screenshots. Providers with a known catalog list their models here;
     a Custom endpoint lists whatever it reports itself, and takes free text.
4. Save.

> Don't have these details? Ask whoever set up your AI model access for the provider, base
> URL, key, and model name.

> **Changing provider replaces the address and model** in that field with the new
> provider's defaults — it doesn't merge with what you had. Note anything custom before
> switching.

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

## 5. Optional — have it run later, or every day

*New in 0.6.* Once a task works, you don't have to be there to start it. On the New Task
screen press **Schedule** instead of Launch and pick a time — once, daily, weekly, or every
N minutes. For work that repeats, put it on the agent itself: **Agent → Chronos →
Schedule**. You can also just say when in the task ("*every day at 9, check for new work
orders*") and SimpleClaw schedules it for you.

The sidebar's **Scheduled** page lists every armed schedule and the next runs due, for all
your agents. Two things to know before relying on it: SimpleClaw must be **running** when a
schedule fires, and the agent's own **Dry run** setting still applies — so turn dry-run off
on that agent, or the scheduled run will only plan.

Details → [Running a task later](user-guide.md#running-a-task-later-scheduling).

## 6. Optional — chain steps into one process

*New in 0.8.* When the work is a sequence — open a filing, submit it, then confirm it in the
client portal — save it as a **scenario** and run the whole thing in one go. Each step names
the agent that runs it, so a process spanning two systems is one scenario rather than two
tasks you start by hand, and a step can hand a value it found (a reference number, a total) to
the steps after it.

The quickest way in: on the **Scenarios** page, describe the whole objective and press
**Compose**. SimpleClaw splits it into steps, routes each to the agent whose system it needs,
and shows you a draft to review before anything is saved. Every step is judged as it finishes,
and the first one that doesn't pass stops the rest.

Details → [Running a whole process](user-guide.md#running-a-whole-process-scenarios).

## 7. Optional — let another AI agent hand it work

*New in 0.4.* If you're building with an AI agent of your own, it can give SimpleClaw
operations to carry out and read the answers back — useful when the systems in your process
have no API to automate.

While SimpleClaw is running it publishes a local address and access token to a file in its
own data folder; a program that reads those can submit tasks, follow each step live, and
collect the result. The endpoints, the event stream, and the security trade-off →
[Agent API](agent-api.md).

## 8. Optional — run it on a server instead of a desktop

*New in 0.7.* Once an agent works reliably against a website, it doesn't have to live on your
machine. SimpleClaw can run **headless** — no window, nobody watching — as a service that
only exposes its API. Download `simpleclaw-server-<version>-docker.tar.gz` from the same
Releases page as the installers, extract it, and `docker compose up -d`. Docker is the only
prerequisite.

This is for the case where another system should be able to hand it work with no person and
no laptop involved. Two constraints shape it: only **headless-browser** agents run there (a
container has no desktop), and the agent signs in on every run from credentials you supply
rather than from a saved profile.

Everything it needs — deployment, configuration, secrets, health checks →
[Server mode](server-mode.md).

## 9. Optional — point this app at that server

*New in 0.9.* A deployment isn't something you have to poke at with `curl`. Add it once under
**⚙ Settings → Remote servers** (a name, its URL, its token) and the **server picker in the
title bar** switches this window between **This computer** and that server.

Pointed at it, the pages you already know show what *it* is doing — its agents, its run history,
its scenarios, its schedules — and you can start a run or a scenario pass there and watch it
live. Sending an agent over is **Agents → General → Upload to a remote server**, which beats
copying folders around.

Two things to expect the first time: the server has to list this app's origin in
`AUTOPLAY_CORS_ORIGINS` (Settings shows the line to copy), and it only accepts agents if it was
started with `AUTOPLAY_ALLOW_AGENT_IMPORT=1`. Press **Check** on the entry and it tells you
which of those is missing.

Details → [Pointing it at a server](user-guide.md#pointing-it-at-a-server).

## Next steps

- Read the full [User guide](user-guide.md) for the interface, settings, scopes, and
  the complete list of actions.
- Review [Safety & privacy](safety-and-privacy.md) before using it on real work.
- Hit a snag? See [Troubleshooting](troubleshooting.md).
