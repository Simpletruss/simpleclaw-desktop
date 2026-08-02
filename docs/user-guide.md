# SimpleClaw — User guide

[← Docs home](index.html) · [Getting started](getting-started.md) · [Agent API](agent-api.md) · [Server mode](server-mode.md) · [Functions](functions.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md) · [Release notes](release-notes.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/user-guide.html)
> labels each page with its release and can switch between versions.

The complete manual for SimpleClaw 0.7 (Windows, macOS, and Linux).

> **New in 0.7:** SimpleClaw can run **without a window at all** — as a headless service that
> only exposes its API, deployed with Docker, for when the work should happen on a server
> rather than on somebody's desktop. See
> [Running it as a server](#running-it-as-a-server).

> **From 0.6:** **tasks can run later** — once, daily, weekly or on an interval — and the
> **Scheduled** page shows every armed schedule and the next runs due across all your
> agents. See [Running a task later](#running-a-task-later-scheduling).
>
> Also in 0.6, for people running SimpleClaw from source: a **batch command** that runs
> a list of tasks from one command line, several at a time. See
> [Running many tasks at once](#running-many-tasks-at-once-advanced).
>
> Two smaller 0.6 changes: model settings start with a **provider you pick by name**
> ([Settings reference](#settings-reference)), and the **run bar** now stands in for the
> window whenever the window isn't on screen ([The run bar](#the-run-bar)). Everything that
> changed, release by release → **[Release notes](release-notes.md)**.

> **From 0.5:** you can **give an agent a function of your own** — a tool it (or one of its
> supervisors) can call instead of clicking through an interface. Two small files in a folder,
> live on the next run. See [Extending SimpleClaw](#extending-simpleclaw-custom-functions).

> **From 0.4:** **another program can hand work to SimpleClaw.** A local **Agent API**
> lets another AI agent submit a task in plain language, watch it happen step by step, and
> take the answer back. See [Letting another agent drive it](#letting-another-agent-drive-it).

> **From 0.3:** an agent can work inside a **headless browser** instead of your
> real screen — in the background, sealed to one site, with its own saved sign-in —
> and you can **take control** of that browser mid-run when something needs a
> human. See [Where the agent works](#where-the-agent-works-scope).

---

## Table of contents

1. [What SimpleClaw is](#what-simpleclaw-is)
2. [How it works](#how-it-works)
3. [The interface](#the-interface)
4. [Running a task](#running-a-task)
5. [Running a task later (scheduling)](#running-a-task-later-scheduling)
6. [Running many tasks at once (advanced)](#running-many-tasks-at-once-advanced)
7. [Where the agent works (Scope)](#where-the-agent-works-scope)
8. [Letting another agent drive it](#letting-another-agent-drive-it)
9. [Running it as a server](#running-it-as-a-server)
10. [Calling an API instead of a UI](#calling-an-api-instead-of-a-ui)
11. [Writing good goals](#writing-good-goals)
12. [Action types](#action-types)
13. [Settings reference](#settings-reference)
14. [Extending SimpleClaw (custom functions)](#extending-simpleclaw-custom-functions)
15. [Current limitations](#current-limitations)
16. [Glossary](#glossary)

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
- **⏱ Scheduled** — everything waiting to start later, across every agent, with the next
  runs due. See [Running a task later](#running-a-task-later-scheduling).
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

### The run bar

When a **real** run (dry run off) is going and the SimpleClaw window isn't on screen, a slim
always-on-top **run bar** appears near the top of your primary display and stands in for the
window. It carries what you'd otherwise be missing:

- the run's **status and current step**, with the live action text underneath,
- the **tokens** the run has used so far,
- **Stop** — the same emergency stop as `F9`,
- **⤢ Workspace** — bring the main window back.

It never takes keyboard focus, so it can't steal a keystroke from the app the agent is
driving. Dry runs don't get a bar; you're watching the window for those.

**Why the window goes away.** An agent working on your real screen has to have the window
out of the way — otherwise the window sits under the agent's own clicks — so those runs
minimize it. A **headless-browser** run started from the window *keeps* the window, because
that's where the live browser view and [taking control](#taking-control-mid-run) live. A run
that came from somewhere else — the [Agent API](agent-api.md), or a
[schedule](#running-a-task-later-scheduling) coming due — minimizes it either way: you were
working in another app and didn't ask to look at this one.

**The two are never on screen together** *(0.6.2)*. Press **⤢ Workspace** and the window
comes back while the bar steps aside; minimize the window yourself mid-run and the bar takes
over again, without you having to ask for it twice. If the agent stops to ask you something,
the bar grows an answer box — unless the window is up, in which case the question is waiting
in the run view where you're already looking.

When the run ends, the bar closes. A window the **run** minimized is restored; a window
**you** put away stays put.

## Running a task later (scheduling)

*New in 0.6.*

A task doesn't have to start when you ask for it. You can hand it to SimpleClaw's
**scheduler**, which holds it and starts the run itself at the time you set — once, or on
a repeat. Schedules are saved to disk, so they survive closing and reopening the app.

Times are **local** and go down to the **minute**; there are no seconds anywhere.

### Four ways to schedule something

| Where | What it schedules |
|-------|-------------------|
| **New Task → Schedule** | The task you just described, on the agent that was matched to it. The one-off case: "not now, at 3pm." |
| **Agent → Chronos → Schedule** | A standing wake-up for *that* agent: a task plus a time, kept with the agent. Use it for recurring work ("every day at 09:30, check for new work orders"). |
| **Scenarios → Schedule** | A whole saved scenario — its steps run in order as one pass, the same as pressing Run. |
| **Just say when** | Put the timing in the task itself — *"in 10 minutes, …"*, *"every day at 9, …"* — and **Chronos** reads it out of the wording and schedules the run instead of starting it. |

Every one of them offers the same four repeat kinds:

| Repeat | Fires |
|--------|-------|
| **Once** | At one date and time you pick. |
| **Every day** | At an `HH:MM` clock time, daily. |
| **Every week** | On a weekday at an `HH:MM` clock time. |
| **Every…** | On an interval — every N minutes or hours, counted from when you created it. |

Before you confirm, the dialog states **when the first pass lands** as an absolute time
plus a countdown ("First pass 7/29/2026, 8:00 AM (in 30m) · repeats every Wednesday at
08:00") — a spec like "every Monday at 09:00" is easy to misread as "starting this Monday"
when it isn't.

### Seeing what's scheduled

The **Scheduled** page in the sidebar is the full picture, across every agent, in two tabs:

- **Schedules** — the definitions, grouped by agent: one row per schedule with its
  countdown, what it runs, how it repeats, and when it next fires.
- **Upcoming** — the next **10 actual runs**, soonest first, with repeating schedules
  **expanded**: an "every 30 min" schedule appears as several rows, marked `×2`, `×3`, …
  for which firing of it each row is.

Both tabs share a filter bar — **agent**, **tasks vs. scenarios**, and **when** (next
hour / today / next 7 days). The strip labelled **⏱ Scheduled** beside a run's workspace
shows the same entries in passing and links here with **See all**.

**Cancelling** asks for confirmation first, and says whether you're stopping one run or
every future run of a repeating schedule. It can't be undone — the timing has to be
entered again — which is exactly why it asks.

### What happens when one comes due

- **The app has to be running.** A schedule is a timer inside SimpleClaw, not a Windows
  Task Scheduler entry or a background service. If the app is closed at that moment,
  nothing fires.
- **It wakes the agent it was created for** — not whichever agent you happen to have
  selected. That agent's own settings apply, including its **Dry run** state.
- **One run at a time still holds.** If a run or scenario pass is already in flight, the
  occurrence is **skipped**: a repeating schedule simply tries again next time, but a
  one-off is dropped rather than queued.
- **Missed repeats are not made up.** After a restart, a repeating schedule rolls forward
  to its next future time — a daily 09:00 task doesn't run five times because the app was
  closed for five days.
- **A past-due one-off runs shortly after launch.** If you closed the app before a
  one-time schedule fired, it fires soon after the app is next opened.

### Finding scheduled runs afterwards

Every run the scheduler started is stamped with the built-in **Schedule** label, so
**Run history** distinguishes work that happened while nobody was watching from work you
started yourself. Filter the history by that label to see only scheduled runs. (The label
is applied automatically and can't be renamed or deleted, like **Supervised** for recorded
demonstrations.)

> **Pacing is a separate job.** Chronos also watches the clock *during* a run and nudges
> the agent when it's falling behind — that's the **Chronos → Pacing** page, unrelated to
> when a run starts.

## Running many tasks at once (advanced)

*New in 0.6.*

> **This one needs the source repo.** The batch command is part of the SimpleClaw source
> tree, not the installer — if you downloaded the `.exe`, `.dmg` or `.AppImage`, you don't
> have it. Everything else on this page works in the installed app. The **Runs** setting
> below is visible either way, but it only takes effect for the batch command.

The window runs **one task at a time**, on purpose (see
[Current limitations](#current-limitations)). When you have a list of tasks and don't want
to sit through them one by one, the **batch command** takes the whole list at once:

```bash
npm run batch -- --agent "Northwind Staff" \
  --task "Open the Clients page and report how many clients are listed" \
  --task "Open the Filings page and report the newest filing"

npm run batch -- --agent "Northwind Staff" --file tasks.txt --parallel 3
```

A task list is a plain text file, one goal per line. Lines starting with `#` are ignored,
and a line can send its task to a different agent with `agent :: `:

```
# tasks.txt
Open the Clients page and report how many clients are listed
Open the Filings page and report the newest filing
Northwind Portal :: Sign in and report the current filing status
```

Useful flags: `--parallel N` (how many at once), `--timeout N` (give up on a task after N
minutes), and `--list` (print what *would* run and stop, so you can check the list before
committing to it).

### How many run at the same time

**Settings → General → Runs → "Maximum tasks running at the same time"** is the ceiling.
**It defaults to 1**, which means tasks run one after another — the same behavior as
before, unless you deliberately raise it. `--parallel N` overrides it for a single command.

Each task runs in **its own process, with its own browser**, which is what makes it safe to
run several at once — but it also means each one costs a browser's worth of memory. Raise
the limit as far as your machine comfortably allows, not higher.

Three rules apply no matter what number you set:

- **Tasks that share a signed-in agent run one at a time.** An agent with **Stay signed in**
  turned on has one saved browser profile, and a profile can only be open in one browser.
  Those tasks are queued behind each other automatically; unrelated tasks keep going in
  parallel around them.
- **Agents that work on your real screen never run in parallel.** They'd fight over one
  mouse. Those need an explicit `--allow-desktop` flag, and even then the whole batch runs
  one at a time.
- **Dry-run agents are refused.** Dry run waits for you to press **Continue** at each step,
  and nobody is watching a batch. Turn dry run off on the agent first.

### What you get back

Progress streams as it happens, tagged by task number, and the command ends with a summary:

```
✓ [1] finished   2 steps   6s  Northwind Staff: Open the Clients page…
✗ [2] timeout  128 steps  300s  Northwind Staff: Open the Filings page…
✓ [3] finished   7 steps  19s  Northwind Staff: Sign in and report…

2/3 finished, 1 failed
```

Every task is saved to **Run history** like any other run, so you can open one afterwards
and step through what it did. The command exits with an error code if any task didn't
finish, which is what you'd check when running it from a script.

The whole list is **checked before anything starts** — a misspelled agent name in task 9
stops the batch before task 1 opens a browser.

> **If a task stops to ask a question, it's over.** There's nobody there to answer, so that
> task is abandoned and its question is reported instead of the answer. Tasks you intend to
> batch should be ones you've already watched succeed on their own.

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

## Letting another agent drive it

*New in 0.4.*

SimpleClaw has a small **Agent API** on your own machine, which lets another program give
it work. The other agent understands your business process and breaks it into steps;
SimpleClaw carries out one step at a time on the actual systems and reports back what
happened.

This is worth setting up when the systems involved have no usable API — the situation
SimpleClaw exists for — and you want an agent to run a whole process end to end rather than
you driving each part by hand.

In short:

- The caller **finds SimpleClaw automatically**: the app publishes its local port and a
  fresh token to a file in its own data folder at launch.
- It can **ask what this machine can do** — each agent, the system it is sealed to, and the
  operations it has been shown — and route each step to the right agent.
- It submits **one operation at a time** and gets the agent's closing answer back. If the
  agent stops to ask a question, the question goes to the caller.
- It can **watch the run live**: a step-by-step event stream carries the same progress
  SimpleClaw's own window shows, so a caller's UI can display real work rather than a
  spinner.
- Runs are **queued**: SimpleClaw still does one thing at a time, and every run lands in
  the normal history where you can replay it.
- In the desktop app the interface is **local-only and token-protected** — but any program
  running as you can reach it, which is the trade-off to understand before enabling it. To
  let a caller reach it from another machine, see [Running it as a server](#running-it-as-a-server).

The endpoints, the event stream, and the rules a calling agent must follow →
**[Agent API](agent-api.md)**.

## Running it as a server

*New in 0.7.*

Everything above assumes SimpleClaw is an app on your desktop, with you nearby. It doesn't
have to be. SimpleClaw can also run **headless** — no window, no `F9`, nobody watching — as a
long-lived service that only exposes its API. It's distributed as a **deployment bundle** on
the Releases page — extract it, run `docker compose up -d` — so it can live alongside your
other services instead of on one person's machine.

Reach for it when:

- another system should be able to hand SimpleClaw work **without a person or a laptop being
  involved** — your backend, a workflow engine, or an AI agent of your own;
- the work should keep happening **when nobody is logged in**;
- you want the **same thing in staging and production**, configured by environment and
  secrets rather than by a settings screen.

Three things to know before planning around it:

- **Only headless-browser agents run there.** A container has no desktop, so a desktop- or
  window-scope agent is refused rather than allowed to click into a blank screen. Set an
  agent's [scope](#where-the-agent-works-scope) to a headless browser before deploying it.
- **Signing in works differently.** There's no persistent Chrome profile to "log in once"
  into, so an agent signs in on every run from credentials the platform supplies — and a site
  demanding MFA or a CAPTCHA still needs a person, who joins through the run's live link and
  [takes the controls](#taking-control-mid-run).
- **One run at a time, per instance,** exactly as in the app. More throughput means more
  instances, not more parallelism inside one.

Deployment, configuration, secrets, and health checks →
**[Server mode](server-mode.md)**. Read
[Running it as a server](safety-and-privacy.md#running-it-as-a-server) in Safety & privacy
first: an unattended agent reachable over a network is a different risk from the same agent
on your desk.

## Calling an API instead of a UI

*New in 0.4.2.*

Some of what an agent needs is available as an API. Reading it off a screen then means
opening a page, finding the row, and squinting at a number — slower and easier to get
wrong than simply asking for it. So an agent can be given **REST API access**: one tool
that fetches from an HTTP API and hands the response back as text.

You configure it on the agent's own page, under **Planner → MCP Servers → REST API access**.
It belongs to the agent rather than to the app, because which system an agent should
reach depends on its job — and so does whose credentials it should carry.

To turn it on you need two things:

1. **Enabled**, and
2. at least one **allowed host** (e.g. `api.example.com`, one per line;
   `*.example.com` covers subdomains).

Until both are set the agent has no API tool at all. That is deliberate: a tool the agent
can see is a tool it will try, so an unconfigured one would only waste steps getting
refused.

The rest of the settings:

| Setting | What it does |
|---------|--------------|
| **Allow writes** | Off = the agent may only read (`GET`/`HEAD`). On = it may also `POST`/`PUT`/`PATCH`/`DELETE`. |
| **Credentials** | A header to attach per host — e.g. `Authorization: Bearer …`. Added by SimpleClaw, never shown to the AI model. |
| **Truncate response at** | How much of a reply the agent reads. Long responses are cut so they can't crowd out the task. |
| **Timeout** | How long to wait for a response before giving up. |

Two things worth knowing:

- **The agent won't use it just because it exists.** It defaults to doing things the way
  a person would — on screen. Tell it in the agent's persona or a skill which endpoints
  are available and when to prefer them.
- **Read the safety notes first.** This is the one feature that sends your data somewhere
  other than your model endpoint → **[Agents that call an API](safety-and-privacy.md#agents-that-call-an-api)**.

## Writing good goals

- **Be specific about the outcome.** "Open Notepad, type 'hello world', and save
  it as note.txt on the Desktop" beats "make a note".
- **Name the target.** "In the open Excel sheet…" tells the model where to work.
- **One task at a time.** Break large jobs into smaller runs you can verify.
- **Set the stage.** Have the relevant window open and visible before you run.
- **Avoid ambiguity.** If several items look alike, describe which one ("the blue
  *Submit* button at the bottom").

## Action types

On each step the model chooses **one** action. The pointer ones say *what* to click
rather than *where* — the agent describes the element ("Sell button on the right panel")
and SimpleClaw finds it, checks the spot, and acts, all within the one step.

| Action | What it does |
|--------|--------------|
| `click` | Click the described element. |
| `double` | Double-click it — e.g. to open a desktop icon. |
| `right` | Right-click it, to open a context menu. |
| `hover` | Move the pointer onto it **without** clicking. Two uses: reveal the tooltip of a value that is cut off on screen, and aim the next `scroll` at an open menu or an inner panel. |
| `input` | Type into a field, locating and focusing it first if it isn't already. Clears the field, so it *replaces* rather than appends. |
| `type` | Type into the field that is **already** focused — no locating, so it can't drift onto a neighbouring icon. |
| `hotkey` | Press a keyboard shortcut, e.g. `ctrl c`, `enter`, `end`. |
| `scroll` | Scroll up, down, left or right. |
| `zoom_in` / `zoom_out` | Zoom the view in or out. |
| `launch_app` | Open or activate an app **by name** — more reliable than clicking a taskbar icon. For a browser it can go straight to a URL. |
| `read_clipboard` | Read the clipboard as text. This is how a long answer or document is captured in one step: copy it, then read it here, instead of scrolling through it. |
| `wait` | Pause a few seconds and look again, touching nothing — for a page that is still loading. |
| `finished` | Declare the task complete, with the answer or summary. Ends the run. |
| `call_user` | Stop and hand back to you, explaining what it needs. |

SimpleClaw performs exactly one action per loop, so complex tasks complete as a
sequence of small, visible steps.

A few more appear only in the situations that call for them:

| Action | Present when |
|--------|--------------|
| `read_text` | The agent works in a browser — reads the page's visible text in one step. |
| `open_skill` | It has skills held back as summaries — loads one's full instructions. |
| `complete_step` | The run has a plan — ticks off the current item and moves to the next. |
| `rest_request` | It has [API access](#calling-an-api-instead-of-a-ui) (0.4.2+, off by default) — fetches from an allowlisted HTTP API instead of using that system's interface. |
| *MCP tools* | You attached an MCP server to the agent — its tools are offered alongside these. |

> Names and wording follow SimpleClaw 0.4.2. Earlier versions used a lower-level
> vocabulary (`left_double`, `right_single`) that named a point instead of an element.

## Settings reference

| Setting | Controls | Notes |
|---------|----------|-------|
| **Provider** | Which service an endpoint belongs to | *New in 0.6.* Floxi (the hosted gateway the app ships pointed at), OpenAI, Anthropic, Google, Qwen, or Custom for any other OpenAI-compatible server. Picking one fills in the two fields below — see [Connect your AI model](getting-started.md#2-connect-your-ai-model). |
| **Base URL** | Your AI model's API endpoint | OpenAI-compatible `/v1/chat/completions`. Pre-filled from the provider, and editable. Required. |
| **API key** | Authentication for the endpoint | Required. Stored locally on your machine. |
| **Model name** | Which vision model to use | Must be vision-capable. A provider with a known catalog lists its models; Custom lists whatever the endpoint reports and accepts free text. Required. |
| **Dry run** | Plan-only vs. act-for-real | **On by default.** On = show without executing; Off = actually control input. |
| **Step delay** | Pause after every action | Default 0.5 s. Longer = easier to watch and interrupt. |
| **Nav settle** | Extra pause after an action that navigates | Default 0.5 s, added on top of Step delay only after a click or an Enter-terminated entry, so the next screenshot isn't of the old page. Raise it for slow-loading sites. |
| **Max steps** | Cap on actions per run | Default 30. Stops runaway loops; increase for longer tasks. |
| **Scope** | Which surface the agent works on | Whole monitor, a single window, or a headless browser — see [Where the agent works](#where-the-agent-works-scope). |
| **Runs → Maximum tasks running at the same time** | How many tasks the batch command may run at once | App-wide (**Settings → General → Runs**). Default 1 = one after another. Only affects the source-only batch command, not the window or the Agent API — see [Running many tasks at once](#running-many-tasks-at-once-advanced). |
| **REST API access** | Whether this agent may call an HTTP API | Set per agent (**Planner → MCP Servers**), not app-wide. Off by default, and needs at least one allowed host — see [Calling an API instead of a UI](#calling-an-api-instead-of-a-ui). |

> Exact labels and defaults may vary slightly by version; values reflect
> SimpleClaw 0.6.x.

## Extending SimpleClaw (custom functions)

A **custom function** gives the agent one function of your own — a way to *look something up*
or *do something* directly instead of clicking through an interface for it. Say your
customers' details live behind an API: a function turns that into a single call the agent
can make, which is faster than navigating the CRM and can't mis-click.

You write two small files in a folder — `tool.json` (what the model is shown) and
`index.mjs` (what runs when it's called) — and it's live on the next run, with no rebuild.
Functions belong to **one agent**, stored beside its skills and memory, so each agent has
exactly the functions its job needs.

One field decides **who** gets the tool — and which tab you manage it on:

| `owner` | Who can call it | Manage it in |
|---------|-----------------|--------------|
| `planner` | The agent itself, while working | **Planner → Functions** |
| `observer` | The Observer, while judging whether the run went wrong | **Observer → Functions** |
| `chronos` | Chronos, while judging whether the run is behind | **Chronos → Functions** |

Each of those tabs has its own **Functions** page, which lists that caller's tools, scaffolds a
working starter, and opens the folder for editing. A supervisor can call a tool, read the answer, and
only then decide — so it can check a claim against golden data, or read a recorded timing
before calling a run late.

You don't configure *when* it gets called; you write that in prose — in the tool's own
description, the agent's persona, or a skill. Full details and worked examples:
**[Custom functions](functions.md)**.

> The **Observer** and **Chronos** themselves aren't add-ons — they're built in, each with its
> own tab on every agent. Custom functions just give them something to call.

## Current limitations

SimpleClaw 0.7.x is still an early release:

- **One surface per run** — an agent works on a monitor, a window, *or* a headless
  browser; it can't span several at once.
- **One run at a time in the window** — and over the [Agent API](agent-api.md), which
  queues rather than running in parallel. Running several at once means either the
  source-only [batch command](#running-many-tasks-at-once-advanced), which starts a
  separate process per task, or several [server](#running-it-as-a-server) instances.
- **Schedules need a process running** — they're timers inside SimpleClaw, not OS-level
  jobs, and a missed repeat isn't made up afterwards. In server mode they're off by default,
  because several replicas would each fire the same one. See
  [Running a task later](#running-a-task-later-scheduling).
- **A server runs browser agents only** — there is no desktop in a container, so the monitor
  and window scopes are refused there. See [Server mode](server-mode.md).
- **A saved sign-in is tied to one machine** — the headless browser's "stay signed in"
  profile belongs to the computer and user account that created it, so it doesn't travel to a
  server; a deployed agent signs in each run from injected credentials instead.
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
- **Agent API** — the local interface another program uses to submit tasks to SimpleClaw and
  follow them, so another agent's abilities include "operate this computer". See
  [Agent API](agent-api.md).
- **Operation** — one unit of work a caller hands over: a single business step an agent has
  been demonstrated doing, like "submit a filing".
- **Schedule** — a saved "run this later": a task (or scenario) plus a time, once or
  repeating. Held by SimpleClaw itself, so the app must be running when it fires. See
  [Running a task later](#running-a-task-later-scheduling).
- **Occurrence** — one firing of a schedule. A repeating schedule has many; the
  **Upcoming** tab lists the next ones individually.
- **Chronos** — the agent's timekeeper: it reads timing out of a task's wording when you
  submit it, and watches pacing while the run is underway.
