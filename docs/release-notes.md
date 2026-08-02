# SimpleClaw — Release notes

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Agent API](agent-api.md) · [Functions](functions.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/release-notes.html)
> labels each page with its release and can switch between versions.

What each release added, newest first. Installers for every release are on the
[Releases page](https://github.com/Simpletruss/simpleclaw-desktop/releases).

**Which version am I on?** **⚙ Settings → About** shows it, next to a short *What's new* for
the last few releases. The docs you're reading now describe **0.6.x** — use the version menu
at the top of any page to read an older release's docs instead.

---

## 0.6 — Runs on a schedule

*Current release.*

**A task doesn't have to start when you ask for it.** Hand it to the **scheduler** and it
starts the run itself — once at a set time, every day, every week, or on an interval. You
can also just say when in the task itself (*"in 10 minutes, …"*) and let **Chronos** read
the timing out of the wording. Schedules are saved to disk and survive restarting the app.
→ [Running a task later](user-guide.md#running-a-task-later-scheduling)

**The Scheduled page shows everything that's waiting**, across every agent: the schedules
themselves with their countdowns, and the next 10 actual runs due with repeating schedules
expanded. Filter by agent, by tasks vs. scenarios, or by when.

**Several tasks can run at once** — for people running SimpleClaw from source. The **batch
command** takes a list of goals (or a text file, one per line) and works through it, up to N
at a time, each task in its own process with its own browser. Tasks sharing a signed-in
agent still queue behind each other, and agents that drive your real screen never run in
parallel. → [Running many tasks at once](user-guide.md#running-many-tasks-at-once-advanced)

**Pick your model provider by name.** The endpoint editor now starts with a provider —
Floxi, OpenAI, Anthropic, Google, Qwen, or Custom for anything else OpenAI-compatible —
and fills in that provider's address and model list for you. Existing settings are
untouched: whatever you had typed keeps working, and an endpoint already pointed at the
hosted gateway is simply relabelled *Floxi*. → [Connect your AI model](getting-started.md#2-connect-your-ai-model)

**The run bar stands in for the window whenever the window is away.** While a full-auto run
is going, the slim always-on-top bar — progress, **Stop**, and **⤢ Workspace** — appears
whenever the main window isn't on screen, including when you minimize it yourself, and gets
out of the way the moment the window comes back. → [The run bar](user-guide.md#the-run-bar)

**Point releases in this series**

| Release | What it added |
|---------|---------------|
| **0.6.2** | The provider picker, and the run bar following the main window. |
| **0.6.0** | Scheduling, the Scheduled page, the batch command, and the ceiling on how many tasks run at the same time. |

> 0.6.1 was published ahead of 0.6.0 by mistake; everything in it is also in 0.6.0, and
> 0.6.2 supersedes both. Install the newest one.

---

## 0.5 — Custom functions

**Give an agent a function of your own** — a way to look something up or do something
directly, instead of clicking through an interface for it. Two small files in a folder
(`tool.json` and `index.mjs`), live on the next run, no rebuild. Functions belong to one
agent, stored beside its skills and memory.

One field, `owner`, decides who may call it: the **Planner** while it works, the
**Observer** while it judges whether a run went wrong, or **Chronos** while it judges
whether a run is behind. → [Custom functions](functions.md)

Functions **replace the dynamic plugins** of 0.2–0.4, and the Observer became part of the
agent itself rather than an add-on. Nothing on the functions page works on 0.2–0.4.

---

## 0.4 — Work with other agents

**Another program can hand work to SimpleClaw.** A local **Agent API** lets another AI agent
submit a task in plain language, follow the run step by step over an event stream, and take
the answer back. Runs submitted this way queue into the same history as the ones you start
yourself. → [Agent API](agent-api.md)

**An agent can call an allowlisted HTTP API** instead of driving that system's interface
(0.4.2+, off by default, set per agent). Faster than navigating a UI, and it can't
mis-click. → [Calling an API instead of a UI](user-guide.md#calling-an-api-instead-of-a-ui)

Also in this series: the action vocabulary was reworded (0.4.2) to name the *element* being
acted on rather than a bare point, and **scenarios gained batch controls** (0.4.5).

---

## 0.3 — Headless browser

**An agent can work inside its own browser** instead of on your real screen — in the
background, sealed to one site, so it can't wander off and can't fight you for the mouse.

**Sign in once.** With **Stay signed in**, that browser keeps its profile, so later runs
start already authenticated.

**Take the controls mid-run** when something needs a human — a CAPTCHA, an unexpected
prompt — then hand them back and let the run continue.
→ [Where the agent works](user-guide.md#where-the-agent-works-scope)

---

## 0.2 — Dynamic plugins

Extended the agent pipeline with plugins that could be added and managed without a rebuild,
plus automatic updates for the app itself.

> Plugins were **superseded by [custom functions](functions.md) in 0.5**. If you're reading
> the 0.2–0.4 docs for their plugin pages, use the version menu — the current docs describe
> functions instead.

---

## 0.1 — The screen agent

The first release: turn a plain-language goal into real clicks and typing, working from
what's on screen with no per-app integration. **Dry run was on by default** — showing the
actions without performing them — and **`F9`** stopped a run instantly. Both are still
true. → [Getting started](getting-started.md)

---

[← Docs home](index.html) · [Releases](https://github.com/Simpletruss/simpleclaw-desktop/releases) · [Troubleshooting](troubleshooting.md)
