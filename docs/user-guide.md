# SimpleClaw — User guide

[← Docs home](index.html) · [Getting started](getting-started.md) · [Plugins](plugins.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/user-guide.html)
> labels each page with its release and can switch between versions.

The complete manual for SimpleClaw 0.3 (Windows, macOS, and Linux).

> **New in 0.3:** an agent can work inside a **headless browser** instead of your
> real screen — in the background, sealed to one site, with its own saved sign-in —
> and you can **take control** of that browser mid-run when something needs a
> human. See [Where the agent works](#where-the-agent-works-scope).

---

## Table of contents

1. [What SimpleClaw is](#what-simpleclaw-is)
2. [How it works](#how-it-works)
3. [The interface](#the-interface)
4. [Running a task](#running-a-task)
5. [Where the agent works (Scope)](#where-the-agent-works-scope)
6. [Writing good goals](#writing-good-goals)
7. [Action types](#action-types)
8. [Settings reference](#settings-reference)
9. [Extending SimpleClaw (plugins)](#extending-simpleclaw-plugins)
10. [Current limitations](#current-limitations)
11. [Glossary](#glossary)

---

## What SimpleClaw is

SimpleClaw turns a plain-language request into real actions on your computer.
Instead of clicking through an app yourself, you tell SimpleClaw the outcome you
want — *"open Notepad and type today's date"* — and it operates the screen for
you.

It is a general-purpose **screen agent**: it works with whatever is visible on
your display rather than plugging into any one program. Because it sees the
screen the way you do, it isn't limited to a fixed list of supported apps.

SimpleClaw does **not** think on its own. Every decision comes from a
vision-language AI model that you connect it to. SimpleClaw is the "hands and
eyes"; the model is the "brain".

## How it works

Each task runs as a loop:

```
your goal ─► take a screenshot ─► ask the AI model for the next action
     ▲                                            │
     │                                            ▼
     └──────── repeat until "finished" ◄──── perform the action (mouse/keyboard)
```

1. **You enter a goal** and press Run.
2. **SimpleClaw captures the agent's surface** as an image — a monitor, a single
   window, or its own headless browser (see [Scope](#where-the-agent-works-scope)).
3. **The image and your goal are sent to the AI model**, which replies with a
   short reasoning ("Thought") and a single next **Action**.
4. **SimpleClaw performs that action** on your real mouse/keyboard — unless
   **Dry run** is on, in which case it only shows what it *would* do.
5. The loop repeats until the model decides the task is **finished** or a limit
   or stop is reached.

## The interface

- **Goal bar** — where you type what you want done, with **Run** and **Stop**.
- **Dry run toggle** — plan-only vs. act-for-real. On by default.
- **Screenshot view** — the current capture, with a **marker** showing where the
  model is about to act. Hover it during a headless-browser run to
  [take control](#taking-control-mid-run).
- **Action timeline** — a running list of each step: the model's short reasoning
  and the action it chose.
- **▶ Play / ↻ Re-run** — replay a finished run's frames, or run the same goal again.
- **⚙ Settings** — model connection and behavior options.

## Running a task

1. **Type your goal** in the goal bar.
2. Make sure the target app/window is **open and visible** on your primary
   display.
3. Keep **Dry run** ON for the first attempt and press **Run**.
4. **Watch the timeline and the screenshot marker.** In dry-run nothing is
   actually clicked or typed.
5. When satisfied, turn **Dry run** OFF and press **Run** again.
6. **Stop any time** with **`F9`** or the **Stop** button.

The run ends when the model reports **finished**, when you stop it, or when it
reaches the **maximum steps** limit.

**Replaying a run.** Once a run is over, **▶ Play** steps back through its frames
at 2 per second, so you can watch what happened without re-running anything.
**↻ Re-run** starts the same goal again as a fresh run; the finished one stays in
history either way.

## Where the agent works (Scope)

By default an agent works on your **real screen**. Each agent's **Scope** tab picks
its surface instead, once, and every run of that agent uses it:

| Scope | What the agent sees and acts on |
|-------|--------------------------------|
| **Entire desktop** | A whole monitor — your real mouse and keyboard. Pick which monitor if you have several. |
| **Specific window** | One app window. Screenshots are cropped to it and clicks are offset into it, so the rest of your desktop is out of bounds. |
| **Headless browser** *(new in 0.3)* | A dedicated browser that runs **offscreen**, sealed to one site. Your screen and mouse are never touched, so you can keep working while the task runs. |

### Headless browser

Point it at a **start URL** and the agent gets its own browser opened there. Two
things follow from it being a separate, invisible browser:

- **It runs in the background.** Nothing moves your cursor and nothing steals focus;
  you can use your computer normally while a task runs.
- **It is sealed to that site.** Navigation outside the start URL's origin is sent
  back. If signing in goes through a separate host (an SSO page, say), add that host
  under **Also allow these origins** or the agent will bounce off it.

Set the **viewport** here too. There is no physical screen, so this size *is* the
whole surface the agent sees — and bigger is not automatically better: small
targets can get harder to hit as resolution rises. 1280×800 is the default and a
good starting point.

### Staying signed in

Most real sites need a login, and an agent cannot know your password. So the
headless browser keeps **one profile per agent** and you sign in yourself, once:

1. On the **Scope** tab, keep **Stay signed in between runs** on (the default).
2. Press **🔓 Log in once…**. A **real, visible browser window** opens on that same
   profile.
3. Sign in by hand — including two-factor codes — then **close the window**.
4. Every later run starts from that session instead of a login page.

Your credentials never pass through SimpleClaw or any AI model: you type them into
a normal browser window, and all the agent inherits is the session left behind.
**Sign out** deletes the profile and the agent is logged out again.

Two caveats worth knowing:

- The login window and a run **cannot use the profile at the same time** (the
  browser only allows one). Stop the run before opening the login window.
- The profile is tied to this computer and this user account, so it can't be copied
  to another machine.

Turning the setting **off** gives a fresh, logged-out browser on every run — only
useful for sites with no sign-in at all.

### Taking control mid-run

Some steps only a human can do: a login you'd rather type yourself, a two-factor
code, a CAPTCHA, or an agent that's simply stuck. While a headless-browser run is
live, **hover the frame** in the run pane and a **🖐 Take control** button appears.

Pressing it pauses the agent and opens the page **full-window at actual size**, with
your mouse and keystrokes going straight into it — no crosshair or grid in the way.
Hand it back with the **Hand back** button or **`Esc`**.

Deliberate details:

- **Hovering only offers the button**; it never pauses the agent by itself, and moving
  the mouse away never hands control back — the agent would start clicking again right
  under your hands.
- The agent stops **after the step it was already performing**, so one last action can
  still land in the moment you take over.
- `Esc` is used for handing back, so it isn't sent to the page while you're driving.

### Starting up

A headless browser has to launch and load the page before the agent sees anything,
which is regularly 10–25 seconds on a cold start. The frame area reports what it's
doing (starting the browser → waiting for the debugger → opening the page) with a
seconds counter, so a slow start is distinguishable from a stuck one.

## Writing good goals

- **Be specific about the outcome.** "Open Notepad, type 'hello world', and save
  it as note.txt on the Desktop" beats "make a note".
- **Name the target.** "In the open Excel sheet…" tells the model where to work.
- **One task at a time.** Break large jobs into smaller runs you can verify.
- **Set the stage.** Have the relevant window open and visible before you run.
- **Avoid ambiguity.** If several items look alike, describe which one ("the blue
  *Submit* button at the bottom").

## Action types

On each step the model chooses **one** action:

| Action | What it does |
|--------|--------------|
| `click` | Single left-click at a target point. |
| `left_double` | Double-click (e.g. to open an item). |
| `right_single` | Right-click (context menus). |
| `drag` | Press, move, and release — drag from one point to another. |
| `hotkey` | Press a keyboard shortcut (e.g. Ctrl+S). |
| `type` | Type a string of text. |
| `scroll` | Scroll the view up or down. |
| `wait` | Pause briefly (e.g. to let something load). |
| `finished` | Declare the task complete — this ends the run. |

SimpleClaw performs exactly one action per loop, so complex tasks complete as a
sequence of small, visible steps.

## Settings reference

| Setting | Controls | Notes |
|---------|----------|-------|
| **Base URL** | Your AI model's API endpoint | OpenAI-compatible `/v1/chat/completions`. Required. |
| **API key** | Authentication for the endpoint | Required. Stored locally on your machine. |
| **Model name** | Which vision model to use | Must be vision-capable. Required. |
| **Dry run** | Plan-only vs. act-for-real | **On by default.** On = show without executing; Off = actually control input. |
| **Step delay** | Pause after every action | Default 0.5 s. Longer = easier to watch and interrupt. |
| **Nav settle** | Extra pause after an action that navigates | Default 0.5 s, added on top of Step delay only after a click or an Enter-terminated entry, so the next screenshot isn't of the old page. Raise it for slow-loading sites. |
| **Max steps** | Cap on actions per run | Default 30. Stops runaway loops; increase for longer tasks. |
| **Scope** | Which surface the agent works on | Whole monitor, a single window, or a headless browser — see [Where the agent works](#where-the-agent-works-scope). |

> Exact labels and defaults may vary slightly by version; values reflect
> SimpleClaw 0.3.x.

## Extending SimpleClaw (plugins)

**Plugins** add behavior to SimpleClaw without reinstalling or rebuilding it — you drop a
folder in from **⚙ Settings → Plugins** and it takes effect. A plugin contributes a
**sub-agent** that runs *inside* a task to shape how it goes — for example a **completion
check** that inspects the finished screen and sends the agent back if the job isn't really
done, or a per-step check.

Installing makes a plugin available to the whole organization; it only affects an agent
once you **add it** on that agent's **Sub-Agents** tab. To build your own, see the
**[Plugin developer guide](plugins.md)**.

**Plugins can use tools.** A plugin that runs its own logic can call an AI model and give
it **tools** to invoke directly — actions like "record a lesson to memory", "nudge the
run", or "send it back to keep working" — instead of coaxing the model to reply in a fixed
text format and parsing that. This *native tool-calling* is more reliable and is how the
built-in **Observer** learns. **Settings → Plugins → Observer → Install** drops a complete,
working tool-calling example into a folder you can read and adapt; the mechanics are in the
[developer guide](plugins.md#native-tools-tool-calling).

> **Pacing / time limits** (e.g. "finish within 10 minutes") aren't a plugin — they're
> built in as **Chronos**, configured on each agent's **Chronos** tab.

## Current limitations

SimpleClaw 0.3.x is still an early release:

- **One surface per run** — an agent works on a monitor, a window, *or* a headless
  browser; it can't span several at once.
- **The headless browser is local** — it runs on your own computer, and its saved
  sign-in is tied to this machine and user account. There is no remote or
  cloud-hosted browser, and no remote-machine control.
- **Site sealing is a backstop, not a sandbox** — navigation away from the allowed
  origins is reversed after the fact, so treat it as a guard rail rather than
  enforced isolation.
- **A signed-in agent acts as you** — anything your account can do on that site,
  it can do. Only turn "Stay signed in" on for sites where that's acceptable.
- **Desktop only** — Windows, macOS, and Linux; no mobile builds.
- **Platform maturity differs** — Windows is the most exercised. macOS builds aren't
  code-signed yet (right-click → Open on first launch, and they don't self-update),
  and on Linux an X11 session is recommended because Wayland can block screen capture
  and the global `F9` hotkey. See
  [Getting started](getting-started.md#first-launch-per-platform).

## Glossary

- **Agent / screen agent** — software that perceives the screen and acts on it to
  reach a goal.
- **Vision-language model** — an AI model that understands both images and text;
  it "sees" the screenshot and returns the next action.
- **Endpoint / Base URL** — the network address of your AI model's API.
- **Dry run** — a mode that shows planned actions without performing them.
- **Action** — a single operation (click, type, scroll, …) chosen each step.
- **Step** — one iteration of the loop: screenshot → action.
- **Scope** — the surface an agent works on: a monitor, one window, or a headless
  browser.
- **Headless browser** — a browser with no visible window. SimpleClaw drives it
  offscreen, so a task can run without touching your screen or mouse.
- **Origin** — the scheme + host of a URL (`https://app.example.com`). A
  headless-browser agent is sealed to the start URL's origin.
- **Take control** — pausing the agent to drive its headless browser yourself.
