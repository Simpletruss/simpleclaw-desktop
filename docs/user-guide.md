# SimpleClaw — User guide

[← Docs home](index.html) · [Getting started](getting-started.md) · [Web APIs](web-apis.md) · [Agent API](agent-api.md) · [Server mode](server-mode.md) · [Functions](functions.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md) · [Release notes](release-notes.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/user-guide.html)
> labels each page with its release and can switch between versions.

The complete manual for SimpleClaw 0.9 (Windows, macOS, and Linux).

> **New in 0.13:** a run's **plan** stopped being fixed. Each item's procedure is tracked line
> by line, an item that says *"there is nothing to do if…"* is **checked before the work**, and
> a run stuck on one step **rewrites the rest of its plan from the screen in front of it**. See
> [The plan a run follows](#the-plan-a-run-follows).
>
> Also in 0.13: this machine can run **several tasks at once** — the workspace included, with a
> picker for switching between them — and a browser agent can hold more than one signed-in
> profile. See [Running more than one task at once](#running-more-than-one-task-at-once).

> **New in 0.9:** this window can be pointed at a **server** instead of at this computer. Pick
> the machine in the title bar and the same pages show what a deployment is doing — its agents,
> its runs, its scenarios, its schedules — and you can start work there, or send an agent to it.
> See [Pointing it at a server](#pointing-it-at-a-server).

> **From 0.8:** a saved **scenario** can span agents — each step names the agent that runs
> it, steps hand **values** to each other, and a pass runs without a window open. See
> [Running a whole process](#running-a-whole-process-scenarios).

> **From 0.7:** SimpleClaw can run **without a window at all** — as a headless service that
> only exposes its API, deployed with Docker, for when the work should happen on a server
> rather than on somebody's desktop. See
> [Running it as a server](#running-it-as-a-server).

> **From 0.6:** **tasks can run later** — once, daily, weekly or on an interval — and the
> **Scheduled** page shows every armed schedule and the next runs due across all your
> agents. See [Running a task later](#running-a-task-later-scheduling).
>
> Also in 0.6, for people running SimpleClaw from source: a **batch command** that runs
> a list of tasks from one command line, several at a time. See
> [Running more than one task at once](#running-more-than-one-task-at-once).
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
5. [The plan a run follows](#the-plan-a-run-follows)
6. [Running a whole process (scenarios)](#running-a-whole-process-scenarios)
7. [Running a task later (scheduling)](#running-a-task-later-scheduling)
8. [Running more than one task at once](#running-more-than-one-task-at-once)
9. [Talking to it (voice)](#talking-to-it-voice)
10. [Where the agent works (Scope)](#where-the-agent-works-scope)
11. [Letting another agent drive it](#letting-another-agent-drive-it)
12. [Running it as a server](#running-it-as-a-server)
13. [Pointing it at a server](#pointing-it-at-a-server)
14. [Calling an API instead of a UI](#calling-an-api-instead-of-a-ui)
15. [When a run gets stuck (the Observer)](#when-a-run-gets-stuck-the-observer)
16. [Writing good goals](#writing-good-goals)
17. [Action types](#action-types)
18. [Settings reference](#settings-reference)
19. [Extending SimpleClaw (custom functions)](#extending-simpleclaw-custom-functions)
20. [Current limitations](#current-limitations)
21. [Glossary](#glossary)

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

- **Goal bar** — where you type what you want done, with **Run** and **Stop**. The **🎙 mic**
  button dictates into it instead — see [Talking to it](#talking-to-it-voice).
- **Dry run toggle** — plan-only vs. act-for-real. On by default.
- **Screenshot view** — the current capture, with a **marker** showing where the
  model is about to act. Hover it during a headless-browser run to
  [take control](#taking-control-mid-run).
- **Action timeline** — a running list of each step: the model's short reasoning
  and the action it chose.
- **▶ Play / ↻ Re-run** — replay a finished run's frames, or run the same goal again.
- **⏱ Scheduled** — everything waiting to start later, across every agent, with the next
  runs due. See [Running a task later](#running-a-task-later-scheduling).
- **Server picker** — in the title bar: which machine this window is looking at, **This
  computer** or a registered server. See [Pointing it at a server](#pointing-it-at-a-server).
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
history either way. *New in 0.10:* the page a [run's own link](agent-api.md#a-link-a-person-can-open)
opens has the same playback, so somebody reviewing what an agent did doesn't need the app.

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

## The plan a run follows

*Plans are older than 0.13; sub-steps, the exit-condition check and re-planning are new in it.*

Before an agent's first click, the task is **composed into a plan** against that agent's
recorded demonstrations: an ordered list of items, each with a sub-goal, the route to it, and a
short numbered **procedure**. It's what makes a run reproducible rather than improvised, and
it's shown in the **Plan** panel while the run goes.

Two things decide how much of this you see:

- **Confirm the composed plan before running** (*Agents → Planner → Planning*) opens a
  multi-step plan for review and editing before it runs. Off by default; a single-step task, or
  one with no demonstration behind it, never pauses either way.
- **Missing values are asked for, not invented.** If the task names no record and the procedure
  needs one, the plan says so — using the label the app itself puts on the field (*Record ID*,
  not `record_id`) — and asks you before the run starts. Only values a person would **type** are
  asked; a save or a confirmation the agent should perform is written into the procedure
  instead.

### The two levels of a plan

*New in 0.13.* Each item's procedure is tracked **line by line**, not as a block of text. Every
numbered line becomes a **sub-step** with a mark of its own:

| Mark | Means |
|--|--|
| **○** | Not reached yet. |
| **▸** | The step the run is on. From its second attempt a `· tried N×` counter appears beside it. |
| **✓** | Done — reported by the agent, or taken as done because it reported a later step. |
| **~** | Skipped as unnecessary, with the reason beside it (*"already rated"*). |
| **✕** | Tried and abandoned. |

The agent names which sub-step each action is for and everything before it is counted done, so
nothing has to be caught up by hand. This is what tells you a run is stuck **on a specific
line** rather than merely slow — and it's the count the re-planner reads.

Nothing was added to the plan format to make it work: the lines are parsed out of the procedure
text the planner already writes. A plan composed long before 0.13, one you typed by hand, and
one from a custom rubric all show the same second level.

### Work that is already done

An item can carry an **exit condition** — the state that makes its work unnecessary, phrased as
something visible: *"the rating beside the record's id at the top of its detail page already
shows 4 filled stars"*. The plan shows it as **⛔ Skip if** above the route.

*New in 0.13:* that condition is checked by SimpleClaw itself before the item's work starts,
rather than left for the model to notice mid-turn. The check

1. **locates the place the condition names**,
2. **crops and magnifies** the frame to it — so the same kind of value printed in a side card or
   a summary widget, which belongs to a *different* record, is not in the picture at all,
3. **looks and judges separately**: one call writes down what it sees, without being told what
   the answer is supposed to be, and a second decides whether that satisfies the condition.

A satisfied condition **ends the run**, and it shows in the conversation as a shield-marked
line with the condition under it, so an early finish carries its evidence. Everything short of a
clear answer — nothing located, the endpoint down, a reading too thin to judge — means the run
carries on exactly as it would have.

### When the plan turns out to be wrong

*New in 0.13. On by default.*

A plan is written from demonstrations of a task that is never quite this one, so some step of it
will be wrong on the day: the button opens a different dialog, the control moved, the record is
in another state. Before 0.13 nothing in a run could revise it — the checklist kept presenting
that step every turn and the run kept walking back into it, until the step budget ran out.

Now a run that is stuck on one sub-step **throws away the rest of its plan and writes a new one
from the screen in front of it**. Steps already finished are kept and not redone; the abandoned
one stays in the plan marked ✕ with its note, so what happened is still legible afterwards.

Two conditions have to hold together, and both are on **Agents → Planner → Planning**:

| Setting | Default | What it's for |
|---------|---------|---------------|
| **Let a stuck run revise the rest of its plan** | On | Off = the plan is never revised mid-run, which is what you want when the plan is hand-written and authoritative, or when you're watching the run yourself. |
| **Give a step this many tries first** | 3 | The second try at a screen step is often the one that works — the page hadn't finished loading, a dialog was in the way. Re-planning eagerly throws away a plan that was about to succeed. |
| **At most this many re-plans per run** | 2 | A run that keeps re-planning isn't converging; it's deriving new wrong plans from a screen it can't read. Past the cap, the ordinary stuck-run recovery takes over. |

Being stuck is still detected **mechanically** — the screen unchanged across acting turns, or
the same action repeating — so a step that is making visible progress is never counted out
however many tries it takes.

**How this differs from the Observer.** The [Observer](#when-a-run-gets-stuck-the-observer)
answers *"what is the next move?"* for one turn, from outside the run. Re-planning answers
*"what is the rest of this task?"* and replaces the plan, so the correction survives the turn it
was made on. They work together: neither requires the other, and a run with the Observer off
still re-plans.

## Running a whole process (scenarios)

*Scenarios are older than 0.8; what 0.8 changed is that **one scenario can span several
agents**, and its steps can hand values to each other.*

A **scenario** is a saved sequence of steps that run in order as one **pass**. Each step is a
task, on a named agent, judged before the next one starts. It's what you reach for when the
work is a *process* rather than a task — "open a filing, then submit it, then confirm it in
the client portal" — and especially when the parts live in different systems.

The **Scenarios** page in the sidebar lists your saved scenarios, their passes, and any
schedules attached to them.

### What a step is

| Part of a step | What it's for |
|----------------|---------------|
| **Agent** | Which agent runs it — a picker, changeable at any time. This is what lets one scenario cross systems. |
| **Task** | What to do this time, in plain language. May contain `{{references}}` to earlier steps' values. |
| **Reference procedure** | The recipe distilled from a recorded demonstration, cached so it isn't re-derived every pass. Editable, and **Regenerate** re-distills it against the current task. Leave it empty and it's distilled when the step runs. |
| **Success criterion** | What the screen should show if the step truly worked. Optional; the task itself is the default. It's what the outcome judge grades against, so an agent that *says* it succeeded can still fail the step. |
| **Produces** | Values this step must report, so later steps can use them — see below. |

A badge on each step says what it's backed by:

- **SUPERVISED** — a recorded demonstration on this agent. The reference run's goal is shown
  beside it.
- **IMPROVISED** — no demonstration covered this sub-task, so the agent plans it from the task
  text alone. Legitimate, but the least predictable kind of step.
- **REF FROM &lt;other agent&gt;** — you moved this step to a different agent and its recipe was
  recorded on the old one, where it describes a *different application*. **clear** drops the
  recipe and lets the new agent work the step out.
- **MISSING** — the reference run was deleted since; the step runs as a plain task.

### Building one

Two ways, both on the Scenarios page:

- **Describe the objective and press Compose.** SimpleClaw splits what you typed into
  independent tasks (a pasted numbered list is several tasks, not one), works out which agent
  each part needs, and plans each against that agent's own demonstrations. Nothing is saved
  until you press Save, so the result is a draft to review and edit.
- **Pick from your demonstrations.** Your **Supervised** runs are listed grouped by agent;
  adding one appends a step on that agent with its procedure already distilled. Then edit the
  task into the similar one you want done this time.

> **The routing stage only runs when there's more than one agent** to route between. With a
> single agent configured, Compose behaves exactly as it did before.

Steps can be reordered with **↑ / ↓** and removed with the bin. A scenario needs a **name**
before it can be saved.

### Passing values between steps

*New in 0.8.* A step's answer often decides what the next step does — a reference number, a
filing id, a total. Rather than you copying it across by hand, the step **produces** it:

1. On the step that finds the value, add a **Produces** entry: a short `snake_case` name and a
   description of what to report and its form (*"the bundle reference, DOC-YYYY-NNNN"*). The
   description is what the agent is asked to report, so vagueness there costs you accuracy.
2. On a later step, write **`{{bundle_ref}}`** anywhere in the task text — or use the insert
   button, which offers only the values earlier steps actually produce.

Before each step runs, its references are substituted and the pass records the bindings, so a
report six weeks later reads as the task that actually ran, not as a template.

The rules, all checked as you type and again at launch:

- **A name may be produced once** in a scenario. Two steps claiming `total` is rejected.
- **A step can't reference its own value, or a later step's.** Only what's already been
  produced is in scope.
- **A reference nothing produces is a question, not an error.** SimpleClaw asks for those
  values before the pass starts. Started from a [schedule](#running-a-task-later-scheduling) or
  the [API](agent-api.md), where nobody is there to answer, the pass is **refused** instead and
  the refusal is recorded — an unattended run has no safe "go ahead without it".
- **A step that finishes without reporting a value it promised fails the pass.** The
  alternative is the next step running against the literal text `{{bundle_ref}}` and failing
  somewhere that looks unrelated to the real cause.

### Steps that call an API instead of a screen

*New in 0.11.* A step can be **a saved API request** from [Web APIs](web-apis.md) rather than
a recorded demonstration. Both kinds sit side by side in the builder, and both share one set
of values — so an API step that captures `{{work_order_id}}` hands it to the screen step that
types it into the real application, and the pass verifies the thing it just created.

Two practical differences from a screen step:

- **It has no agent and costs nothing.** Nothing drives a screen for it, so there is no model
  call and no tokens. Every step moved off the GUI leaves the GUI steps to the work that
  genuinely needs eyes.
- **What it produces is its captures** — shown on the button that adds it, so you don't
  declare them by hand. If it fails the pass stops, and the step shows the whole request and
  response, since there is no screenshot to look at.

### What happens during a pass

Steps run **one at a time, in order**, each as an ordinary run that lands in history like any
other. After each one the **outcome judge** looks at the result against that step's success
criterion. The **first step that doesn't pass aborts the pass**, and the remaining steps are
recorded as *skipped* rather than quietly dropped — the steps are dependent, so carrying on
would only produce noise.

Each step gets a **fresh browser** unless the step asks to continue in the previous one. That
default is deliberate: a scenario whose first step signs in and whose second acts is testing
that the second works from a clean session, and starting it warm quietly changes what a pass
proves.

**Passes don't need a window.** Sequencing happens inside SimpleClaw itself, so a pass runs the
same way when it's started by the scheduler, by the [Agent API](agent-api.md#running-a-whole-scenario),
or on a [server](#running-it-as-a-server) with no screen at all.

### Reading a pass afterwards

Every pass is kept as its own numbered record — running a scenario again adds a row rather
than overwriting the last result. Each step in it shows the agent that ran it, the task as
actually run, its outcome, the judge's reason, the values it produced, and a link to that
step's own run so you can step through the frames.

### Things worth knowing

- **One pass at a time.** A pass won't start while a run or another pass is in flight, and a
  scheduled occurrence that lands at that moment is skipped.
- **A step's agent must be one this SimpleClaw can run.** A step pointing at a deleted agent,
  an agent from another organization, or a desktop agent on a [server](#running-it-as-a-server)
  is refused at launch, naming the step — not discovered halfway through.
- **Consecutive steps on the same agent are allowed but flagged.** Same agent means same
  system, so the boundary costs a cold browser for nothing — unless you wanted the fresh
  session.
- **Set the stage first.** For agents working on your real screen, a pass assumes the desktop
  starts in the expected state, exactly as a single task does.

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
| **Scenarios → Schedule** | A whole saved [scenario](#running-a-whole-process-scenarios) — its steps run in order as one pass, across whichever agents they name, the same as pressing Run. |
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

## Running more than one task at once

*The batch command is from 0.6; the app running several tasks at once is new in 0.13.*

**⚙ Settings → General → Concurrency → "Maximum tasks running at the same time"** is the
ceiling for this whole machine — the workspace, the [control API](agent-api.md) and the batch
command below all draw from it. **It defaults to 1**, which is the behaviour every earlier
release had: one task runs and a second is refused. Raise it and a second task is **queued**
instead, starting the moment a slot frees up. **It takes effect after a restart.**

Each concurrent task is its own process with its own headless Chrome — budget about **0.9 GB
each** and raise this only as far as the machine's memory allows (the cap is 8). It is memory
that bounds this, not CPU.

**The workspace still shows one run at a time.** A live run is a conversation, and two of them
interleaved in one thread is unreadable. So the status bar grows a **run picker** listing
everything this machine has in flight — the agent, the goal, how many steps in, and the queue
position of anything still waiting — and picking one shows it in the workspace.

**Stopping the right one.** Opening a run that is still going — from the picker or from **Run
history** — gives it its own **■ Stop this run** button, which stops *that* run by name rather
than whichever one the workspace happens to be focused on.

### One agent, several browsers

**Agents → Scope → Headless browser → Max parallel slots** is how much of that machine-wide
total a single agent may claim (up to 4). Each slot is a **whole browser profile**, because
Chrome allows one browser per profile — which is why two tasks for one agent queued behind each
other however much the machine could afford.

- **Slot 2 and up are copied from the first slot** the first time they're needed, so they start
  out signed in. After that each keeps its own session and they expire independently; signing in
  again on the Scope tab refreshes all of them.
- It is a **share of the machine's total, not a licence of its own** — raising it does nothing
  until Concurrency is above 1.
- **Desktop- and window-scope agents run one at a time regardless.** There is one physical
  screen and one cursor, so two of them would fight over it.

### The batch command

> **This one needs the source repo.** The batch command is part of the SimpleClaw source
> tree, not the installer — if you downloaded the `.exe`, `.dmg` or `.AppImage`, you don't
> have it. Everything else on this page works in the installed app.

When you have a list of tasks and don't want to sit through them one by one, the **batch
command** takes the whole list at once:

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

**How many run at the same time.** The Concurrency setting above is the ceiling; `--parallel N`
overrides it for a single command. Three rules apply no matter what number you set:

- **Tasks sharing one profile slot of an agent run one at a time.** Chrome holds a lock per
  profile directory, so a second worker on that slot can't start. Raising the agent's **Max
  parallel slots** is what buys more than one; unrelated tasks keep going in parallel around it
  either way.
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

## Talking to it (voice)

*Reworked in 0.10.*

Typing a task is the default, and nothing here is required. But a goal is a sentence, and
sometimes saying it is faster — especially a long one, or one you're reading off a ticket.
Three separate things use speech, and from 0.10 they share **one configuration** on the agent's
**Voice** tab instead of pointing at three services:

| | What it does |
|--|--|
| **🎙 Dictation** | The mic button in the new-task box. Click to start, click again to stop. Words appear in the field as they're recognized, **appended** to whatever you'd already typed, so you can type half a sentence and speak the rest. |
| **Voice wake (hands-free)** | Say a wake word — *"computer"* — and the sentence after it is transcribed. If a task is running the words are handed to it and the planner re-decides immediately; otherwise they start a new task. |
| **Spoken replies** | The agent can speak through this computer's speakers, and on a phone call it's the same voice from the same endpoint. |

Two fields do the configuring, and both are usually blank:

- **Speech in** — the transcription endpoint. **Language** blank means auto-detect, which is
  the right answer for mixed Chinese/English speech; pinning one language makes the other
  worse. **Post-edit** adds one short model pass per finished sentence to repair
  misrecognitions and normalize spoken numbers and ids.
- **Speech out** — the text-to-speech endpoint, plus the **voice**, the **speed**, and the
  **sample rate** it returns. **Test** speaks a phrase you type: use it before relying on any
  of this, because a voice pack that answers at another rate sounds like a chipmunk and there
  is nothing else that would tell you why.

Leave either **API key** blank and the key for your AI model is reused, provided it's the same
host — so if you're on the endpoint the app ships pointed at, there is nothing to fill in.

**What leaves the machine, and when.** Wake-word *spotting* runs locally, so nothing is sent
anywhere until you've actually said the word. After that — and for every click of the mic
button — the audio goes to the Speech in endpoint to be transcribed, the same way screenshots
already go to your model endpoint. The enrolled voiceprint for **Owner voice only** is
biometric data and never leaves this computer; it's compared here.
→ [Voice and audio](safety-and-privacy.md#voice-and-audio)

**Hands-free listening is per machine, not per agent.** A microphone is a device on the
computer doing the listening, so a window pointed at a server can edit that server's voice
settings but can't start or stop its listener.

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

**Max parallel slots** *(new in 0.13)* is how many of this agent's tasks may run at the same
time, each in its own browser profile — see
[One agent, several browsers](#one-agent-several-browsers).

**Switching surface is a press, not a tab** *(0.13)*. The four pages under Scope — Capturing,
Entire desktop, Specific window, Headless browser — can all be opened and read without changing
anything. A **✓** marks the one the agent actually runs on, the others say they are a preview,
and **Apply** is what moves the agent onto the surface you're looking at.

**Capturing** is the first page and applies to every surface: how the screen is downscaled
before it reaches the model, and — *new in 0.13* — **Lossless screenshots (PNG)**. JPEG stores
colour at half resolution, which is exactly where the edges of coloured text live (links, nav
bars, status chips), so on a dense business UI small print reads soft and fringed. PNG has none
of that, at **no extra token cost** — vision tokens follow the image's pixel dimensions, not its
file size. What it does cost is storage: frames are about twice as large, so a run reaches the
history size cap sooner. Off by default.

### Staying signed in

Most real sites need a login, and an agent cannot know your password. So the
headless browser keeps **one profile per agent** and you sign in yourself, once:

1. On the **Scope** tab, press **🔓 Log in once…**. A **real, visible browser
   window** opens on that agent's own profile.
2. Sign in by hand — including two-factor codes — then **close the window**.
3. Every later run starts from that session instead of a login page.

Your credentials never pass through SimpleClaw or any AI model: you type them into
a normal browser window, and all the agent inherits is the session left behind.
**Sign out** deletes the profile and the agent is logged out again.

**It is not a setting** *(changed in 0.10)*. Every browser agent keeps its profile. This used
to be a **Stay signed in between runs** checkbox, and its off-state — a fresh, logged-out
browser every run — only bought a login per run on sites that essentially all have one.

Three caveats worth knowing:

- The login window and a run **cannot use the profile at the same time** (the
  browser only allows one). Stop the run before opening the login window.
- The profile is tied to this computer and this user account, so it can't be copied
  to another machine. It lives in SimpleClaw's own data folder — from 0.10 outside the
  agent's folder, so that a [deployment's mounted agents](server-mode.md#bringing-your-agents)
  can sit on network storage a Chrome profile can't.
- A **deployed** agent signs in differently: a container's disk is disposable, so it signs in
  on every run from credentials the platform injects →
  [Signing in without a person](server-mode.md#signing-in-without-a-person).

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

## Pointing it at a server

*New in 0.9.*

A server deployed as above used to be something you could only reach with `curl`. Now this
window is its client too. The **server picker in the title bar** chooses which machine you're
looking at — **This computer**, or any server you've registered — and the pages you already
know stay exactly as they are. Only where their data comes from changes.

### Registering a server

Add each one once, in **⚙ Settings → Run servers → Remote servers** *(the tab was called
Remote servers before 0.10; it now holds two pages, because **This computer** is one of the
machines you can point at)*:

| Field | |
|-------|--|
| **Name** | What to call it in the picker — *staging*, *prod-eu*. |
| **URL** | Its base address, no path: `https://autoplay.example.com`. |
| **Token** | The bearer its control API expects. |

**This computer** has its own page rather than a row in that list, and nothing on it is
editable — its address and token are derived, because the port moves if 8790 is taken and the
token is minted fresh at each launch, so a stored copy would be wrong the first time either
changed. It shows the `Authorization` header its own control API expects, masked, with a
**copy** button: this is the page you're on when another program needs it.

They live at app level rather than on an agent, for the same reason the MCP-server registry
does: the same machine gets pointed at from several places, and per-agent copies of a URL and a
token drift the first time a token rotates.

**Press Check** on an entry before relying on it. It probes in order and tells you which step
failed — whether the host answers at all, whether it accepts the token, and whether its build
takes uploads. Those are different people's problems (a wrong URL, a rotated credential, an
executor due an update), and without the probe they all arrive later as the same red line.

**One setting belongs on the server, not here.** A browser refuses a cross-origin call before
the server ever sees it, so each server must list this app's origin:

```sh
AUTOPLAY_CORS_ORIGINS=app://renderer,http://localhost:5173
```

The second is only needed if you also run SimpleClaw from source; listing both is harmless.
Settings → Run servers → Remote servers shows the line with a **Copy** button. Leave it unset and a server
that passes **Check** still refuses the app — which is why it's called out here rather than
left to be discovered.

### What you can see

Select a server and the window shows what that machine is doing:

- **The agent roster** — what's deployed there, and whether each one can actually run.
- **Run history** — its runs, replayable frame by frame, the same as a local one's.
- **Scenarios** — what it has, and which agents each one needs.
- **⏱ Scheduled** — what it has armed, and what's due next.

The title bar names the machine the whole time, in a colour that doesn't blend in. That is
deliberate: nearly everything about this feature is reversible, and a run started against the
wrong machine is not.

### What you can do

- **Start a run** on the selected server, and follow it live in your own workspace — the same
  timeline, the same frames, the same **Stop** button.
- **Start a scenario pass** there, and follow or stop it the same way.
- **Arm or cancel a schedule** on that server.
- **Upload an agent** to it, from **Agents → General → Upload to a remote server** — the same
  bundle the Export button writes, sent straight over. Scenarios upload from the scenario page.
  → [Sending an agent to a server](server-mode.md#sending-an-agent-from-the-desktop-app)
- **Fix a deployed agent's config** *(new in 0.10)*. Click it in the roster and the usual detail
  editor opens, filled from that machine; changes save over there as you type, and a banner says
  where they're going. → [Editing a deployed agent](server-mode.md#editing-a-deployed-agent-from-the-desktop-app)
- **Delete one of its runs** *(new in 0.10)*, from the trash button in **Run history** or the
  bulk **Clean up** — the delete goes to the machine that holds the run.
  → [Deleting a run](server-mode.md#deleting-a-run-from-a-remote-window)

### What you can't

**A remote view is still a view of somebody else's machine**, and two kinds of thing stay
behind on it.

**Files and devices, not fields.** An agent's *config* is editable over the wire; the rest of it
isn't — skill bodies, function folders, its recorded demonstrations, its signed-in browser
profile, and that machine's monitors and windows. Those show a note naming what they are and
where they live, because a form that appeared to edit them would in fact have been editing this
computer's copies. Hands-free listening is the same story: a microphone belongs to the machine
doing the listening.

**What a run says.** History is the record of what happened over there, so nothing here rewrites
a run — no relabelling, no editing a goal after the fact. Deleting a whole run *is* offered:
deciding a record should no longer be kept isn't the same act as changing what it says.

Three consequences worth knowing:

- **An upload still creates.** Re-uploading an edited agent gives you a *second* agent unless
  you leave **Overwrite** ticked: a colliding id otherwise gets a suffix, so an upload can never
  replace something mid-run by accident. The app tells you the name it landed under.
- **Editing is refused where an operator pinned it.** A deployment started with
  `AUTOPLAY_AGENTS_READONLY=1` shows the real values and accepts no change, and says so with
  that machine's own reason. Model fields its environment overrides are flagged too, so you
  don't spend an edit on a field that will be ignored.
- **The selection isn't remembered.** Reopen the app and you're back on **This computer**. A
  persisted "pointed at production" mode is exactly the state you'd forget you were in.

## Calling an API instead of a UI

*New in 0.4.2. Saved requests are new in 0.11. The site's own API is new in 0.12.*

Some of what an agent needs is available as an API. Reading it off a screen then means
opening a page, finding the row, and squinting at a number — slower and easier to get
wrong than simply asking for it. So an agent can be given **REST API access**: one tool
that fetches from an HTTP API and hands the response back as text.

There are two different questions here, and it's worth separating them before the settings
below make sense:

| You want the agent to reach… | It uses | You configure |
|---|---|---|
| **the site it is already browsing** | `http_request` (0.12+, browser scope) | nothing — see [below](#calling-the-site-the-agent-is-already-on) |
| **another host** | saved requests, or the ad-hoc `rest_request` | **Planner → API access**: allowed hosts and credentials |

### Calling the site the agent is already on

*New in 0.12. Headless-browser scope only.*

A browser-scope agent can call its **own** site's endpoints with `http_request`, giving a
path — `http_request('/api/records/search')` — and reading the response back on the same
turn. There is nothing to switch on and nothing to grant, because it adds no reach: the
request is sent **from inside the open page**, so the signed-in session the run is already
holding authenticates it, and it can only reach the origins the run is already allowed to
navigate to. Anything off that seal comes back refused, with the reason.

This is worth reaching for when an answer is one call away and several screens away
otherwise — resolving a name to an id, then going straight to the record with `open_url`,
instead of a search box, a wait, a results list and a row to pick out.

Two things to know:

- **Tell it the endpoint.** As with everything else, the agent defaults to working the way a
  person would. Name the endpoint in the agent's persona, a skill or a demonstration, the way
  you'd tell a colleague: *"POST `/internal-bff/Search` with `{"query": "…"}`"*.
- **The reply is truncated** before the model reads it, so a large response can't crowd out
  the task.

A desktop-scope run has no page to send from, and says so if it tries.

### Reaching another host

> **Prefer saved requests.** From 0.11 an agent can call the requests saved in
> [Web APIs](web-apis.md) **by name** — it picks one from a list and fills in the variables
> that request declares, and it cannot supply a URL of its own. That matters because an agent
> reads its instructions off a screen showing text SimpleClaw didn't write, and *"call this
> URL with your token"* is a sentence a web page can put in front of it. With no destination
> to name, there's nothing for an injected instruction to steer. New agents get saved requests
> only; an agent that already had allowed hosts keeps the ad-hoc tool below as well. See
> [Letting an agent call your saved requests](web-apis.md#letting-an-agent-call-your-saved-requests)
> for how to grant collections in this release.

The rest of this section is the **ad-hoc** tool — the one an agent uses to compose its own
URLs. Everything it is bounded by (the host allowlist, the read-only default, the response
cap, credentials the model never sees) applies to saved requests too.

You configure it on the agent's own page, under **Planner → API access** *(its own page from
0.12; it used to sit under **MCP Servers**, which suggested a server was involved — there
isn't one)*. It belongs to the agent rather than to the app, because which system an agent
should reach depends on its job — and so does whose credentials it should carry.

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

## When a run gets stuck (the Observer)

*Reworked in 0.12. Off by default — a run with it off behaves exactly as before.*

The **Observer** is a second model that looks at the run from outside it. It never touches
the machine; all it can do is say something into the next turn. Turn it on per agent, on the
agent's **Observer** tab, where it can also be pointed at its own endpoint — a cheap, fast
model supervising a slower planner is the usual arrangement.

It comes in on three occasions:

| When | What it is asked | Does the run wait? |
|------|------------------|--------------------|
| **Patrol** — every N steps | *Is anything wrong?* Wrong page, a success only claimed, drift from the goal | No |
| **Milestone** — a plan item ticked off, or a run about to finish | *Did that actually happen?* | No (except the finish — see below) |
| **Repair** — the run is stuck | *What is wrong, and what should it do instead?* | Yes |

**A healthy run hears nothing.** A check that sees no problem calls nothing, logs nothing and
injects nothing, so leaving it on doesn't add noise to a run that is going fine.

**Getting stuck is detected mechanically, not judged.** The run itself notices a screen that
hasn't changed across acting turns, an action cycle repeating, an identical answer twice over,
or an element the detector cannot find. Only then is the Observer asked — and it is not asked
*whether* the run is stuck, only *what* is actually on the screen and which different move to
make. Its answer names the gap first (what the step expected versus what is shown) and the
move second, so you can check the reading against the screenshot rather than take "try
something else" on faith.

That reading is then all the model sees for **one** turn, in place of the plan checklist:
handing a stuck run the same list pointing at the same item is how a recovery ends up
repeating the move it was recovering from. The turn after is normal again.

**A finish gets checked before it is accepted.** When the agent declares the task complete,
the Observer takes one look; if the goal isn't visibly accomplished, the run gets one more
turn with the reason instead of ending on a claim. That veto is allowed **once per run** —
after that the agent's own judgement stands, because a run that can never finish is worse
than one that finishes early.

**It is never required.** If the Observer is off, unreachable, slow to answer, or has nothing
to say, the run recovers the way it always did.

| Setting | What it does |
|---------|--------------|
| **Enabled** | Whether this agent has an Observer at all. Off by default. |
| **Patrol: check every N steps** | Paces the silent background patrol only. Milestones, a stall and a locator miss trigger a check on their own, whatever this is set to. |
| **Model / endpoint** | Defaults to the Planner's own model; the **Model** page points it somewhere cheaper. |
| **Judging instructions** | Your own rubric, replacing the built-in one. Blank = built in. |
| **Functions** | Custom functions only the Observer may call — see [Extending SimpleClaw](#extending-simpleclaw-custom-functions). |

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
| `drag` | Drag one element onto another — **both named in the same step**, since a press and a release can't be split across two. This is how anything gets **reordered**: to move a row up a list, it is dragged onto the row whose position it should take. Also moves a card between columns, or pulls a slider handle to a spot. |
| `input` | Type into a field, locating and focusing it first if it isn't already. Clears the field, so it *replaces* rather than appends. |
| `type` | Type into the field that is **already** focused — no locating, so it can't drift onto a neighbouring icon. On a focused **dropdown** this is also how an option is chosen: typing its name picks it, including options the list draws off-screen. |
| `hotkey` | Press a keyboard shortcut, e.g. `ctrl c`, `enter`, `end`. |
| `scroll` | Scroll up, down, **left or right**. Sideways is how a wide table is read: a grid wider than the window keeps the rest of its columns past the right edge, and scrolling *down* never brings them into view. A frozen first column stays put while the rest moves, so it goes by the **column headers** to tell the view changed, then scrolls back left to reach a control on that side. To scroll an inner panel or an open menu instead of the whole view, `hover` inside it first. |
| `zoom_in` / `zoom_out` | Zoom the view in or out. |
| `launch_app` | Open or activate an app **by name** — more reliable than clicking a taskbar icon. For a browser it can go straight to a URL. |
| `read_clipboard` | Read the clipboard as text. This is how a long answer or document is captured in one step: copy it, then read it here, instead of scrolling through it. |
| `wait` | Pause a few seconds and look again, touching nothing — for a page that is still loading. |
| `finished` | Declare the task complete, with the answer or summary. Ends the run. |
| `call_user` | Stop and hand back to you, explaining what it needs. |

SimpleClaw performs exactly one action per loop, so complex tasks complete as a
sequence of small, visible steps.

**Every click says what it will do to the screen, and the run waits for exactly that**
*(0.11.5; a third answer added in 0.13)*. A **page switch** — a nav entry, a search result, a
row that opens a record — waits for the whole screen to change. **Same page** — a dropdown, a
checkbox, a modal on top of the page — waits only for something to move. In between sits
**tab-switch**: the page frame stays but a panel inside it is swapped for content that has to be
**fetched**, which is what a tab strip inside a record does. That case used to be reported as
"same page", so the run was handed a screenshot of the new tab lit over the old panel's
contents; it now waits on the panel. Alongside it the run asks the page whether it still has
requests outstanding, which is what handles sites with no loading spinner — where "the screen
stopped changing" was already true because the old page had never left.

A few more appear only in the situations that call for them:

| Action | Present when |
|--------|--------------|
| `read_text` | The agent works in a browser — reads the page's visible text in one step. |
| `open_skill` | It has skills held back as summaries — loads one's full instructions. |
| `complete_step` | The run has a plan — ticks off items and sub-steps, or marks one **skipped** with the reason it wasn't needed *(0.13)*. See [The plan a run follows](#the-plan-a-run-follows). |
| `http_request` | The agent works in a headless browser (0.12+) — calls **this site's own** endpoints from inside the page it is on, signed in as the run already is. Nothing to configure; see [Calling the site the agent is already on](#calling-the-site-the-agent-is-already-on). |
| `rest_request` | It has [API access](#reaching-another-host) (0.4.2+, off by default) — fetches from an allowlisted HTTP API on **another** host instead of using that system's interface. |
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
| **Concurrency → Maximum tasks running at the same time** | How many tasks this machine may run at once | *Reworked in 0.13.* App-wide (**Settings → General → Concurrency**), and it now governs **the workspace and the control API too**, not just the batch command. Default 1 = a second task is refused; above 1 it queues. Takes effect after a restart — see [Running more than one task at once](#running-more-than-one-task-at-once). |
| **Max parallel slots** | How many tasks **one** agent may run at once | *New in 0.13.* Per agent (**Scope → Headless browser**), up to 4, each slot its own browser profile. A share of the machine total above, not a licence of its own. |
| **Re-planning** | Whether a stuck run may rewrite the rest of its own plan | *New in 0.13.* Per agent (**Planner → Planning**), **on** by default, after 3 tries at one step and at most 2 re-plans a run — see [When the plan turns out to be wrong](#when-the-plan-turns-out-to-be-wrong). |
| **Lossless screenshots (PNG)** | The format frames are captured in | *New in 0.13.* Per agent (**Scope → Capturing**), off by default. Sharper small text at the same token cost; about 2× the storage per frame. |
| **REST API access** | Whether this agent may call an HTTP API on another host | *Moved in 0.12.* Set per agent (**Planner → API access**), not app-wide. Off by default, and needs at least one allowed host. Calling the site the agent is **already on** needs none of this — see [Calling an API instead of a UI](#calling-an-api-instead-of-a-ui). |
| **Observer** | A second model that checks the run from outside it | *Reworked in 0.12.* Per agent (**Observer**), off by default. Patrols on a cadence, checks a ticked item and a finish, and is asked what to do when the run is stuck — see [When a run gets stuck](#when-a-run-gets-stuck-the-observer). |
| **Run servers** | Which machines this window can be pointed at | *New in 0.9; renamed in 0.10.* App-wide (**Settings → Run servers**), on two pages: **This computer** (derived and locked, and where its own `Authorization` header is shown) and **Remote servers** — a name, URL and bearer each, with **Check** to probe one. See [Pointing it at a server](#pointing-it-at-a-server). |
| **Speech in / Speech out** | The transcription and text-to-speech endpoints | *New in 0.10.* Set per agent (**Voice**), and shared by dictation, the wake word and phone calls. A blank API key reuses the model key for the same host — see [Talking to it](#talking-to-it-voice). |

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
> own tab on every agent. Custom functions just give them something to call. What the Observer
> does with what it sees: [When a run gets stuck](#when-a-run-gets-stuck-the-observer).

## Current limitations

SimpleClaw 0.13.x is still an early release:

- **One surface per run** — an agent works on a monitor, a window, *or* a headless
  browser; it can't span several at once. A [scenario](#running-a-whole-process-scenarios)
  crosses systems by giving each *step* its own agent, not by widening one run.
- **Scenario steps run in sequence, never in parallel** — and one pass at a time. Two steps
  that don't depend on each other still wait their turn.
- **One run *shown* at a time in the window** — several can be going *(0.13)*, but the
  workspace displays whichever one the run picker has selected, because two live conversations
  in one thread can't be read. Concurrency defaults to 1 and takes a restart to change, and
  agents working on your real screen stay strictly one at a time. See
  [Running more than one task at once](#running-more-than-one-task-at-once).
- **Schedules need a process running** — they're timers inside SimpleClaw, not OS-level
  jobs, and a missed repeat isn't made up afterwards. They run in server mode too *(0.10)*, but
  entries live with the data, so several replicas sharing it each fire the same one: run one
  where schedules matter. See [Running a task later](#running-a-task-later-scheduling).
- **A server runs browser agents only** — there is no desktop in a container, so the monitor
  and window scopes are refused there. See [Server mode](server-mode.md).
- **A remote view edits config, not content** — pointed at a server you can watch it, start
  work on it, upload to it, fix an agent's config *(0.10)* and delete one of its runs, but its
  skills, functions, demonstrations and browser profile are files on that machine, and nothing
  rewrites what a finished run says. See [Pointing it at a server](#pointing-it-at-a-server).
- **A saved sign-in is tied to one machine** — the headless browser's profile belongs to the
  computer and user account that created it, so it doesn't travel to a
  server; a deployed agent signs in each run from injected credentials instead.
- **Site sealing is a backstop, not a sandbox** — navigation away from the allowed
  origins is reversed after the fact, so treat it as a guard rail rather than
  enforced isolation.
- **A signed-in agent acts as you** — anything your account can do on that site, it can do, and
  every browser agent keeps its session *(0.10)*. Only sign one in where that's acceptable.
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
- **Scenario** — a saved sequence of steps that run in order as one pass. Each step names
  the agent that runs it, so a scenario can cross systems. See
  [Running a whole process](#running-a-whole-process-scenarios).
- **Pass** — one execution of a scenario, start to finish. Each pass is kept as its own
  record, so re-running a scenario adds a result rather than replacing the last one.
- **Produced value** — something a step is required to report (`bundle_ref`), which later
  steps use by writing `{{bundle_ref}}` in their task text.
- **Outcome judge** — the check applied after a step finishes: does the screen show what the
  step's success criterion described? It's what stops an agent's own "done" from being taken
  at face value.
- **Schedule** — a saved "run this later": a task (or scenario) plus a time, once or
  repeating. Held by SimpleClaw itself, so the app must be running when it fires. See
  [Running a task later](#running-a-task-later-scheduling).
- **Occurrence** — one firing of a schedule. A repeating schedule has many; the
  **Upcoming** tab lists the next ones individually.
- **Chronos** — the agent's timekeeper: it reads timing out of a task's wording when you
  submit it, and watches pacing while the run is underway.
- **Plan** — the ordered list of items composed from an agent's demonstrations before a run's
  first click. Each item has a sub-goal, a route and a numbered procedure. See
  [The plan a run follows](#the-plan-a-run-follows).
- **Sub-step** — one numbered line of an item's procedure, tracked with its own status and
  attempt count *(0.13)*.
- **Exit condition** — the visible state that makes an item's work unnecessary. Checked before
  the work starts, and a satisfied one ends the run.
- **Re-planning** — a stuck run discarding the rest of its plan and writing a new one from the
  screen in front of it *(0.13)*.
- **Slot** — one browser profile of a headless-browser agent. Two tasks for one agent need two
  slots, because Chrome allows one browser per profile.
