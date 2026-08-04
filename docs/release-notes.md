# SimpleClaw — Release notes

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Agent API](agent-api.md) · [Server mode](server-mode.md) · [Functions](functions.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/release-notes.html)
> labels each page with its release and can switch between versions.

What each release added, newest first. Installers for every release are on the
[Releases page](https://github.com/Simpletruss/simpleclaw-desktop/releases).

**Which version am I on?** **⚙ Settings → About** shows it, next to a short *What's new* for
the last few releases. The docs you're reading now describe **0.10.x** — use the version menu
at the top of any page to read an older release's docs instead.

---

## 0.10 — Correct a deployment, and talk to it

*Current release.*

**A deployed agent is fixable from the window looking at it.** 0.9 made a server something
this app could watch and drive; the one thing it couldn't do was *change* anything, so a
deployed agent with a wrong persona or a moved start URL meant finding the laptop it was
authored on. Now clicking an agent in a remote roster opens the **same detail editor** a local
one gets, filled from that machine, and edits save over there as you type — one request per
pause, not per keystroke. A banner names where the changes are going.
→ [Editing a deployed agent](server-mode.md#editing-a-deployed-agent-from-the-desktop-app)

**What is editable is a field; what isn't is a file or a device.** Persona, scope, start URL,
the model endpoints, planner/executor/observer settings, REST access and voice are config, and
config is what a server stores. Skill bodies, function folders, recorded demonstrations, the
signed-in browser profile and that machine's monitors are not — those show a note saying what
they are and where they live, because a form that appeared to edit them would in fact have been
editing this computer's copies. Two things the server says up front so the form is never
optimistic: whether it will accept edits at all (`AUTOPLAY_AGENTS_READONLY=1` still refuses
them), and which model fields its environment pins so an edit would be stored and then ignored.
**Secrets never travel** — keys, phone credentials and the enrolled voiceprint are blanked on
the way out, and a blank coming back is treated as *unchanged*, never as "delete it".

**Runs can be deleted on whichever machine holds them.** The trash button in **Run history**
and the bulk **Clean up** now work over a remote view too, sending the delete to the host that
owns the run. What still refuses: a run that hasn't finished, and a **supervised demonstration**
unless you confirm by typing *Yes* — those are what the planner builds its plans out of, so
losing one silently degrades every later run. Deletion covers the record, its screenshots and
its benchmark rows, and there is no undo.
→ [Deleting a run](server-mode.md#deleting-a-run-from-a-remote-window)

**Nothing left to switch on.** Four deployment variables are **gone**, and what they gated is
simply available: `AUTOPLAY_ALLOW_AGENT_IMPORT`, `AUTOPLAY_ALLOW_SCENARIO_IMPORT`,
`AUTOPLAY_ALLOW_RUN_DELETE` and `AUTOPLAY_SCHEDULER`. Each one turned a working button in the
app into a `501` until somebody found the variable, and every deployment wanted them on.
**Schedules now run in every mode** — the thing to know is that entries live in the data
directory, so N replicas sharing one each arm the same timers; run **one** replica where
schedules matter. The caution that remains is `AUTOPLAY_AGENTS_READONLY=1`, which is how an
operator says *these agent files are not to be modified*.

**One speech setting, three uses.** Phone calls, the wake word and dictation used to point at
three different services on three different ports. Now the agent's **Voice** tab has **Speech
in** (realtime transcription, the server deciding where sentences end) and **Speech out**
(streamed text-to-speech), and both serve every path. Leave the API key blank and the model key
is reused for the same host, so the usual case is nothing to configure. Speech out also plays
through **this computer's speakers**, with a **Test** button beside it that speaks a phrase you
type — the fastest way to find out a voice pack is at the wrong sample rate.
→ [Talking to it](user-guide.md#talking-to-it-voice)

**Dictate a task instead of typing it.** The new-task box has a **mic button**: click to start,
click to stop, and the words land in the field as they're recognized, appended to whatever you
had already typed. No wake word, no model call to decide whether you meant it — you pressed a
button, which says it better than a keyword can.

**A shared run link plays back too.** ▶ **Play** stepping through a finished run's frames was a
desktop-only control; the run page a link opens now has it, so someone reviewing what an agent
did doesn't need the app installed to watch it happen.

**Every browser agent keeps its signed-in profile — and profiles moved out of your agent
folders.** "Stay signed in between runs" is no longer a checkbox: almost every real target is
behind a login, so its off-state only bought a login per run. The profile now lives in the app's
own data directory rather than inside the agent's folder, which is what makes a **deployment on
network storage** work: Chrome creates lock files as symlinks inside its profile, SMB shares
like Azure Files refuse to create a symlink, and Chrome treated that as fatal — so every run of
a signed-in agent on a mounted `orgs/` died in about 200 ms, before opening a page. Nothing is
lost by moving it: a profile is machine-local state that another executor could never have used.
Existing profiles are migrated on first launch.

**⚙ Settings → Run servers.** The tab that was *Remote servers* now holds both kinds of machine
on two pages — **This computer** and **Remote servers** — because it always listed both and
naming it after one of them made the other read like a server somebody forgot to configure.
**This computer** also shows the `Authorization` header its own control API expects, masked,
with a copy button: that's the page you're on when you need it.

**Point releases in this series**

| Release | What it added |
|---------|---------------|
| **0.10.0** | Remote agent editing, deleting runs on any machine, the four deployment switches removed, one shared speech configuration with desktop playback and dictation, playback on a shared run link, always-persistent browser profiles stored outside `orgs/`, and **Settings → Run servers**. |

---

## 0.9 — One app, this computer or a server

**The desktop app and a deployed server stopped being two separate products.** 0.7 made
SimpleClaw deployable and 0.8 made it orchestrate a process, but a deployment was still
something you could only reach with `curl`: agents arrived by copying a folder, and watching a
server meant reading its logs. Now the app you already use is the client for both. A
**server picker in the title bar** chooses which machine the window is looking at — **This
computer**, or any server you've registered — and the pages don't change, only where their
data comes from.
→ [Pointing it at a server](user-guide.md#pointing-it-at-a-server)

**Everything a server is doing, in the window you already have.** Pointed at a server, the
roster shows the agents deployed there and whether each one can run, **Run history** lists its
runs and replays them frame by frame, the scenario page lists its scenarios, and **⏱ Scheduled**
shows what it has armed. The title bar names the machine at all times, in a colour you can't
miss — *"am I looking at my laptop or at production?"* must never be a question you have to go
somewhere else to answer.

**Start work there and watch it happen.** Launch a run or a whole scenario pass on the
selected server and it streams into your workspace exactly like a local one — the same
timeline, the same frames, the same **Stop**. You can arm and cancel that server's schedules
too. What you could not do from a remote view was **edit**: agents and their history were
authored on the machine that owns them, so the page said so and offered to switch you back.
*(0.10 opened one half of that — an agent's config is editable in place; its files and its
history still are not.)*

**Send an agent to a server instead of copying folders.** **Agents → General → Upload to a
remote server** POSTs the same bundle the Export button writes — config, attached MCP servers,
non-built-in skills, memory — to `POST /v1/agents/import`. Scenarios upload the same way from
the scenario page. It's the only route into a server with none of your folders mounted, and
uploads always **create**: a colliding id gets a suffix rather than overwriting what's running.
Both routes were **off unless asked for**, per deployment — `AUTOPLAY_ALLOW_AGENT_IMPORT=1` and
`AUTOPLAY_ALLOW_SCENARIO_IMPORT=1`. *(0.10 removed both switches; uploads need nothing set.)*
→ [Sending an agent to a server](server-mode.md#sending-an-agent-from-the-desktop-app)

**Register each server once.** **⚙ Settings → Remote servers** holds the name, URL and bearer
for each one — app-level, like the MCP-server registry, because the same machine gets pointed
at from several places and a per-agent copy of a token drifts the first time one rotates.
**This computer** is always the first entry, derived and locked. **Check** on any entry probes
it in three steps and names which one failed: `/v1/health` proves the URL, `/v1/capabilities`
proves the token, and an empty POST to the import route reports whether uploads are enabled at
all.

**One build, one runtime, both modes.** The desktop entry point and the headless one already
shared the agent loop; now they share the rest — the same startup sequence, the same
environment configuration, the same control API, and the same web UI, which is why a server
hands out a **run page** that looks like the app rather than a bare JSON endpoint. In a
container, pointing `ORGANIZATIONS_DIR` at your mounted `orgs/` collapses branding and agents
into a **single mount**, so the container sees exactly what the desktop app sees.

**One thing to set on the server.** A browser blocks a cross-origin call before the server
ever sees it, so each server has to list the app's origin in `AUTOPLAY_CORS_ORIGINS` —
`app://renderer` for a packaged build, plus `http://localhost:5173` if you also run from
source. Settings → Remote servers shows the exact line to copy. Without it a perfectly healthy
server that passes **Check** still refuses the app.
→ [Letting the app reach it](server-mode.md#letting-the-desktop-app-reach-it)

**Point releases in this series**

| Release | What it added |
|---------|---------------|
| **0.9.1** | **Drag and drop.** The agent can reorder a list, move an item between columns, or pull a handle — work no click can do, because a drag-only list offers no button to press. It names both ends of the drag in one step, then re-reads the order to confirm the drop was accepted. → [Action types](user-guide.md#action-types) |
| **0.9.0** | The server picker, remote views of runs/scenarios/schedules, remote runs and passes, agent and scenario upload, the server registry with **Check**, and one runtime behind both modes. |

---

## 0.8 — Scenarios across agents

**One saved process can now span several agents.** A [scenario](user-guide.md#running-a-whole-process-scenarios)
is an ordered list of steps run as a single **pass**, and each step names **which agent runs
it** — so a process that starts in a client portal and finishes in a staff console is one
scenario rather than two you sequence by hand. Steps that used to be stuck on the agent that
recorded them can be re-pointed with a picker, and the builder warns when a step still carries
a recipe recorded on a different application.
→ [Running a whole process](user-guide.md#running-a-whole-process-scenarios)

**Steps hand values to each other.** A step declares what it **produces** — a short name and
what to report — and any later step writes `{{that_name}}` in its task text. The value is
substituted before the step starts, and the pass records what was bound. A `{{reference}}`
that nothing produces isn't an error: SimpleClaw asks for it before the pass begins, or takes
it from the `params` an API caller supplies.
→ [Passing values between steps](user-guide.md#passing-values-between-steps)

**Describe the whole objective and let it be divided.** **Compose** now runs a routing stage
first: it splits what you typed into system-bounded steps, assigns each to the agent whose
system it needs, and works out which values have to cross between them — then plans each step
against that agent's own demonstrations, as before. With a single agent configured nothing
changes; the divider isn't consulted at all.

**A pass no longer needs a window.** Sequencing moved out of the renderer, so a pass runs from
the [scheduler](user-guide.md#running-a-task-later-scheduling) or over the API with nothing on
screen — including [in server mode](server-mode.md). Each step is judged as it finishes; the
first step the outcome judge rejects aborts the pass and the rest are marked skipped. A step
that finishes but never reports a value it promised **fails**, rather than letting the next
step run against a literal `{{placeholder}}`.

**Scenarios over the Agent API.** `GET /v1/scenarios` lists them with the agents each one
touches, `POST /v1/scenarios/{id}/run` starts a pass and returns `202` with a `passId`, and
`/v1/passes/{id}` polls it, streams it, or stops it. This is the surface for an orchestrator
that wants a whole process rather than one operation at a time.
→ [Running a whole scenario](agent-api.md#running-a-whole-scenario)

**Fixed:** `POST /v1/runs/{id}/conclude` — end a run but keep what it found — was documented
and implemented but unreachable over HTTP; the route table had drifted from the matcher. It
now answers, and the run page's link token may use it.

**Point releases in this series**

| Release | What it added |
|---------|---------------|
| **0.8.0** | Per-step agents, values between steps, the routing stage in Compose, headless passes, and the scenario API. |

---

## 0.7 — Runs as a server

**SimpleClaw doesn't have to be an app on somebody's desktop.** It can run **headless** — no
window, no `F9`, nobody watching — exposing only its control API, so another system can hand
it work over the network and read the answers back. It's distributed as a **deployment
bundle** on the Releases page (`simpleclaw-server-<version>-docker.tar.gz`): extract it, run
`docker compose up -d`, and Docker is the only prerequisite. Agents come from a folder you
mount rather than from the image, and the model key and any sign-in credentials come from
the environment, so nothing sensitive sits at rest in the deployment.
→ [Server mode](server-mode.md)

**Only headless-browser agents run there**, because a container has no desktop — a
desktop- or window-scope agent is refused rather than allowed to click into a blank virtual
screen. And with no saved Chrome profile to sign in once, a deployed agent signs in on every
run from credentials the platform injects; the model only ever sees the *name* of a secret,
never its value.

**One link for a run's whole life.** The URL a run hands out shows live frames and a takeover
button while it's running, and the conversation, every screenshot and the step trace once
it's finished. A link that used to go blank the moment the run ended now shows what happened
— which is what makes it safe to put in a notification nobody reads for an hour. It's also
how a person gets an unattended run past an MFA prompt.
→ [A link a person can open](agent-api.md#a-link-a-person-can-open)

**API changes worth knowing.** `GET /v1/health` is now a content-free liveness probe and
`GET /v1/ready` a readiness one — both unauthenticated, so a container platform can probe
them; the operational view it used to return moved to `GET /v1/status`. `POST /v1/window/show`
answers `501` on a server, which has no window to show.

**Point releases in this series**

| Release | What it added |
|---------|---------------|
| **0.7.0** | Server mode, the deployment bundle, and the run link that outlives the run. |

---

## 0.6 — Runs on a schedule

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
