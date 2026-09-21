# SimpleClaw — Agent API

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Records & watchdogs](records-and-watchdogs.md) · [Android devices](android-devices.md) · [Web APIs](web-apis.md) · [Server mode](server-mode.md) · [Cluster](cluster.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md) · [Release notes](release-notes.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/agent-api.html)
> labels each page with its release and can switch between versions.

**New in 0.4.** Another program — most usefully another AI agent — can hand work to
SimpleClaw. It submits a task in plain language, watches the run happen step by step, and
takes the answer back. SimpleClaw becomes the pair of hands for an agent that understands
your business but has no way to touch your systems.

The interface is a small **HTTP API** with a **live event stream**. In the desktop app it is
on `127.0.0.1` only, protected by a token that changes every launch.

> **New in 0.9 — this API is also what the app itself speaks.** A desktop window
> [pointed at a server](user-guide.md#pointing-it-at-a-server) is just another caller on these
> endpoints, which is why the 0.9 additions below are all things a *client* needs: list the
> runs that already happened, read and arm schedules, and upload an agent.
> Anything the app can do here, your own code can do the same way.

> **From 0.7 — the caller no longer has to be on the same machine.** SimpleClaw can run
> [as a headless server](server-mode.md), typically in a container: the same endpoints and
> the same event stream, but reachable over the network and authenticated with a token or a
> JWT you configure. Everything on this page applies to both; where they differ it says so.

---

## Table of contents

1. [What this is for](#what-this-is-for)
2. [Connecting](#connecting)
3. [The endpoints](#the-endpoints)
4. [Watching a run happen](#watching-a-run-happen)
5. [A worked example](#a-worked-example)
6. [How runs behave](#how-runs-behave)
7. [Choosing between several executors](#choosing-between-several-executors)
8. [Rules a caller must follow](#rules-a-caller-must-follow)
9. [Security](#security)
10. [Limits](#limits)
11. [Troubleshooting](#troubleshooting)

---

## What this is for

A capable AI agent can plan a process — *"file the Q1 return for this client, then confirm
it in the client portal"* — and still be unable to perform it, because the systems involved
have no API you're allowed to use, or none at all. SimpleClaw already solves that half: it
operates software the way a person does, through the screen.

Connecting the two puts each where it belongs:

```
      the caller (your agent / app)                   SimpleClaw
  ┌───────────────────────────────┐          ┌────────────────────────┐
  │ understands the business,     │  HTTP    │ knows how to OPERATE   │
  │ decomposes it into operations │ ───────► │ the actual systems     │
  │ decides what to do next       │ ◄─────── │ reports what happened  │
  └───────────────────────────────┘   SSE    └────────────────────────┘
```

The division of labour that makes it work: **the caller owns the flow, SimpleClaw owns one
operation at a time.** Each agent here is taught a small vocabulary of operations by
[demonstration](user-guide.md#running-a-task), so the caller needs to know nothing about the
screens — only which operation it wants next.

## Connecting

**Against a server,** you already know both halves: the address you deployed it at and the
credential you configured. Skip to [the endpoints](#the-endpoints) — the rest of this section
is about finding a *desktop* app on the same machine.

**Against the desktop app,** SimpleClaw publishes where to reach it when it starts, so there
is no port or key to configure by hand. It writes **`autoplay-api.json`** into its own
user-data folder:

```json
{ "port": 8790, "token": "…", "pid": 12345, "version": "0.4.0", "url": "http://127.0.0.1:8790" }
```

| Platform | Folder |
|----------|--------|
| **Windows** | `%APPDATA%\SimpleClaw\` |
| **macOS** | `~/Library/Application Support/SimpleClaw/` |
| **Linux** | `~/.config/SimpleClaw/` |

Read that file, then send the token as a bearer header on every request:

```bash
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8790/v1/health
```

The file is removed when SimpleClaw shuts down, so its presence also answers "is it
running?". A caller should handle its absence as *"SimpleClaw isn't up"* rather than an
error — nothing here can launch the app.

## The endpoints

| Endpoint | What it does |
|----------|--------------|
| `GET /v1/health` | **Liveness**, unauthenticated: the process is up, and its version. |
| `GET /v1/ready` | **Readiness**, unauthenticated: `503` until it could actually take a run. |
| `GET /v1/status` | Whether a run is in progress, how many are queued, whether it's shutting down. *0.14.2:* `?byAgent=1` adds the per-agent load a dispatcher routes on — see [Choosing between several executors](#choosing-between-several-executors). |
| `GET /v1/capabilities` | Every agent, the system it is sealed to, and the operations it has been shown. |
| `POST /v1/runs` | Submit a task. Returns `202` with a `runId` — it does **not** wait for the run, unless you add `?wait=<seconds>` (*0.11*, see [below](#waiting-for-the-answer-in-one-call)). |
| `GET /v1/runs/{id}` | Poll one run: state, step count, a pending question, the final result. |
| `GET /v1/runs/{id}/events` | The live event stream (see below). |
| `POST /v1/runs/{id}/answer` | Answer a run that paused to ask something. |
| `POST /v1/runs/{id}/stop` | Stop a run, or cancel one that is still queued. |
| `POST /v1/runs/{id}/conclude` | End a run but **keep** what it found, as the answer. The gentler half of `/stop`. |
| `POST /v1/window/show` | Bring SimpleClaw's window forward so a person can watch or take over. |
| `GET /v1/runs` | *0.9.* The runs this instance has already done — the history list, newest first. |
| `GET /v1/schedules` | *0.9.* What it has armed, and when each is next due. |
| `POST /v1/schedules` | *0.9.* Arm one: `agentId`, `goal`, and a `spec` (`once`, `interval`, `daily`, `weekly`). |
| `DELETE /v1/schedules/{id}` | *0.9.* Cancel one. `404` if it's already gone. |
| `POST /v1/agents/import` | *0.9.* Upload an agent bundle. Creates by default; `?overwrite=1` replaces one already under that id, keeping its run history. |
| `GET /v1/agents/{id}` | *0.10.* One agent's whole config, for a window opening its editor. Secrets blanked; `editable` says whether an edit would be stored, `envPinned` names the model fields the environment overrides. |
| `PATCH /v1/agents/{id}` | *0.10.* Change fields on an agent already here — a partial, so anything not sent is untouched. `409` when `AUTOPLAY_AGENTS_READONLY` is set explicitly; `400` for `id`/`organization`, which travel by upload. |
| `DELETE /v1/runs/{id}` | *0.10.* Delete a finished run's record — steps, frames, benchmark rows. `409` while it's still going, and `409` for a supervised demonstration unless `?force=1`. |
| `GET /v1/runs/{id}/wait` | *0.11.* Blocks up to `?timeout=<seconds>` (default 30, max 120), then answers with the same body as `GET /v1/runs/{id}`. The polling twin of `/events`, for a caller with no SSE — see [Waiting for the answer, in one call](#waiting-for-the-answer-in-one-call). |
| `POST /v1/agents/{id}/device-session` | *0.16.* Mint a link to a hands-on **device console** on that agent's Android device — install an app, sign into it, accept a dialog. `409` while a task is running. → [Android devices](android-devices.md#setting-the-device-up-by-hand-the-device-console) |
| `GET /v1/cluster` | *0.16, cluster only.* The whole fleet from any node: nodes and free slots, queue depth per agent, singleton roles, dead letters, warnings. → [Cluster mode](cluster.md#what-a-client-has-to-know) |
| `GET` `POST` `DELETE /v1/drain` | *0.16, cluster only.* Take a node out of service and put it back; `GET` is the pre-flight. `?node=<id>` acts on another node. |

> **On the 0.9 routes.** An import always **creates** unless it asks to overwrite: a colliding
> id gets a suffix rather than replacing an agent that may be mid-run. The response carries
> `supported`, which is what tells you whether the thing you just uploaded can actually run
> there — see
> [Sending an agent from the desktop app](server-mode.md#sending-an-agent-from-the-desktop-app).

> **Changed in 0.10 — the deployment switches were removed.** `AUTOPLAY_ALLOW_AGENT_IMPORT`,
> `AUTOPLAY_ALLOW_RUN_DELETE` and `AUTOPLAY_SCHEDULER` are
> gone, and the routes they gated are unconditional: the import route, `DELETE /v1/runs/{id}`
> and the three schedule routes no longer answer `501` on a deployment that "wasn't configured
> for it". A `404` from one of the 0.10 routes on a server that has agents almost always means
> that **executor predates the route** rather than that the id is wrong. Two refusals stay:
> `AUTOPLAY_AGENTS_READONLY=1` (set explicitly) refuses `PATCH` with `409`, and deleting a
> supervised demonstration needs `?force=1`. And schedules being on everywhere means **one
> replica** where they matter — N replicas over one data directory each fire the same entry.

> **Changed in 0.7:** `GET /v1/health` used to return the operational view; that is now
> `GET /v1/status`. Health and readiness were split so a container platform can probe them
> without a credential — health answers "is it up", readiness answers "could it take work",
> which includes having resolved a browser to drive.
>
> `POST /v1/window/show` answers **`501`** on a server — a headless executor has no window
> and nobody standing at it. A caller that renders a "bring it to the front" button needs to
> know there is no front to bring it to, which an `{"ok":true}` that summons nothing would
> hide. Use the run's live link instead, below.

**`GET /v1/capabilities`** is what makes routing possible without hardcoding anything:

```json
{
  "organization": "acme",
  "schedules": true,
  "runDelete": true,
  "agents": [
    {
      "id": "billing-portal",
      "name": "Billing portal",
      "system": "https://billing.example.com/",
      "scopeMode": "browser",
      "operations": [{ "operation": "download an invoice PDF", "sessionId": "…" }]
    }
  ]
}
```

`system` and `operations` are **facts** — where the agent is sealed, and what it has
actually been demonstrated doing. Route on those. `persona` is prose written for the AI
model; it goes stale, the other two don't. An operation that appears nowhere has not been
taught on this machine, and a task needing it will probably fail.

`schedules` and `runDelete` are always `true` from 0.10 — they're **build** signals, not
settings. They used to report whether a deployment had opted in; now that there is nothing to opt
into, what's left is *does this executor have those routes at all*, which a client can't
otherwise ask. An older executor omits them, and a caller reading them as absent knows its
`POST /v1/schedules` or `DELETE /v1/runs/{id}` would `404`.

**`POST /v1/runs`** takes the goal and, optionally, what you already know:

```json
{
  "goal": "file the Q1 2025 return for Redwood Holdings using bundle reference DOC-2024-7741",
  "agentId": "staff-console",
  "outline": ["open a new filing", "enter the bundle reference", "submit"],
  "expect": "the filing number"
}
```

Omit `agentId` and SimpleClaw picks an agent itself — and refuses with `409` plus the agent
list if it can't choose confidently, rather than guessing. `outline` is an optional hint
from a caller that already decomposed the work; `expect` asks for the answer in a
particular shape.

## Watching a run happen

`GET /v1/runs/{id}/events` is a **Server-Sent Events** stream — the same feed SimpleClaw's
own window renders, so a caller's UI can show real progress instead of a spinner. Because
`EventSource` can't set headers, the token may go in the query string here:
`/v1/runs/{id}/events?token=…`.

| Event | Payload |
|-------|---------|
| `state` | The full current state, sent **first** so a late subscriber is never behind. |
| `step` | One completed step: the model's reasoning and the action it took. |
| `activity` | Fine-grained trace within a step. |
| `todos` | The plan, with each item ticked off as it's done. |
| `status` | `running` / `paused` / `finished` / `stopped` / `error`, with the pause reason. |
| `result` | The outcome. The stream closes right after. |

```
event: step
data: {"step":4,"thought":"The bundle reference field is empty","actions":[…]}

event: status
data: {"status":"paused","pauseReason":"ask","message":"Which client should this be under?"}
```

A `paused` status needs reading carefully: `pauseReason: "ask"` means the caller is expected
to answer, while `"takeover"` means **a human at the computer has taken the controls** and
nothing is expected of the caller. Treating those the same is the classic mistake — the
unanswered-pause timeout deliberately doesn't apply during a takeover.

Polling `GET /v1/runs/{id}` works too, and is the simpler choice for a caller that only
wants the outcome.

### Waiting for the answer, in one call

*New in 0.11.* The asynchronous shape above is right for anything with a UI to keep current.
It is the wrong one for a shell script or a backend job that has no conversation to narrate to
and just wants the answer — so those can ask to wait instead:

```sh
# Submit and hold the response for up to 90 seconds.
curl -X POST "http://127.0.0.1:8790/v1/runs?wait=90" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"goal":"what is the status of WO-4417?","agentId":"browser-agent"}'

# Or keep waiting on a run already going, as many times as it takes.
curl "http://127.0.0.1:8790/v1/runs/$RUN_ID/wait?timeout=90" -H "Authorization: Bearer $TOKEN"
```

`wait` and `timeout` are **seconds** — a bare `?wait` means the 30-second default, and anything
over 120 is clamped. There is no unbounded option on purpose: your HTTP client and whatever
proxy sits in front of the executor have their own patience, and a wait that outlives them
loses the result of a run that is still happening. Keep the bound comfortably under your own
timeout and ask again.

What you can rely on:

- **`200` means the run finished**, and only that. The body carries the result.
- **`202` means it didn't**, with the same `runId` a plain `POST` would have returned — so
  *"it outlasted my patience"* and *"I never asked to wait"* leave you holding the same thing.
  `GET /v1/runs/{id}/wait` is always `200`; branch on `state` there, as with the plain read.
- **Waiting never touches the run.** An expired bound, a dropped socket, a cancelled request:
  the run carries on and is still yours by id. `/stop` and `/conclude` are the only things
  that end one.
- **It returns early when nothing else can happen** — the run paused to ask you something
  (`status: "paused"`, `pauseReason: "ask"`). Answer it and wait again. A **takeover** is not
  that: something *is* happening and it isn't yours, so the wait rides it out.
- `?interim=1` also returns on the first interim finding, for a caller that might want to
  `POST /v1/runs/{id}/conclude` on an answer it already has. Off by default — asking for a
  finished run shouldn't hand you a half-done search.
- A run the queue has already forgotten answers **immediately** from the stored record. A poll
  loop whose run gets swept mid-wait doesn't start failing.

MCP's `await_web_task` is the same bound, the same rules and the same implementation, so the
two surfaces can't come to disagree about what waiting means.

### A link a person can open

*New in 0.7.* Some runs need a human eventually — a login the agent can't complete, a step
that has clearly gone wrong, a result someone wants to see for themselves. For those, the
executor serves a **run page** at `/run/{id}`, authorised by a run-scoped token in the link
rather than by your bearer credential, so you can hand it to someone who has no API access.

**One URL for the whole life of the run.** While it's running, the page shows live frames and
a takeover button; once it has finished, the same link shows the conversation, every recorded
screenshot, and the step-by-step trace. A link that used to go blank the moment the run ended
now shows what happened, so it's safe to put in a notification nobody reads for an hour.

The link holder can watch that run, drive it during takeover, and end it — and nothing else.
They can't read the result, answer a question, or reach another run. On a server, set
`AUTOPLAY_PUBLIC_URL` to the address the executor is reached by from outside or no link is
offered at all, which is the correct default for a deployment nobody can reach.

## A worked example

A caller asked *"get Redwood Holdings' exemption certificate reference and file their Q1
return with it"*. It decomposes that into two operations and routes each by system:

1. `GET /v1/capabilities` → two agents: one sealed to the **client portal**, one to the
   **staff console**, each with its own recorded operations.
2. `POST /v1/runs` on the portal agent — *"find the exemption certificate for Redwood
   Holdings and report its bundle reference"*. Subscribe to its events; the `result` carries
   `DOC-2024-7741`.
3. `POST /v1/runs` on the staff console agent — *"file the Q1 2025 return for Redwood
   Holdings using bundle reference DOC-2024-7741, due 15 April 2025"* → result:
   `The filing number is NW-48213.`
4. The caller reports the filing number to its user.

Notice what the caller never had to know: which button submits a filing, that the reference
lives on a different system, or that the due-date field is a native date picker. It named
outcomes; SimpleClaw knew the screens.

The result also carries **`demoCoverage`** — how much of the plan a demonstration informed.
On a *failure* that number is the actionable part: low coverage means this operation was
never taught here, so the fix is to record a demonstration, not to try again.

## How runs behave

- **Submitting is not waiting.** `POST /v1/runs` returns immediately. A run takes minutes
  and can stop to ask a question, so a blocking call would just hang.
- **Queued, and only as parallel as the agent is** *(changed in 0.11.2; the machine-wide cap
  removed in 0.14.2)*. Capacity is the agents' own **Max parallel slots**, each slot a separate
  browser profile in its own process — there is no deployment-level ceiling on top. A task waits
  exactly when *its own* agent's slots are all busy, since one profile means one Chrome and Chrome
  locks it, and `queuePosition` tells the caller where it is. One agent's queue never holds up
  another's. A caller that needs throughput should spread work across *agents* first and across
  executors after that, rather than expect one agent to parallelise —
  [`?byAgent=1`](#choosing-between-several-executors) is how to tell which has room.
- **Questions come back to the caller.** If the agent can't determine something (*"which of
  these two clients do you mean?"*), the run pauses and the question is on the stream.
  Answer it, or stop the run. A pause nobody answers within ten minutes is stopped.
- **A human can still take over.** During a
  [sealed-browser](user-guide.md#taking-control-mid-run) run the person at the machine can
  take the controls — or, on a server, anyone holding the run's live link. The run continues
  when they hand it back.
- **The window is a monitor, not a lock.** In the desktop app, a run submitted this way
  brings SimpleClaw's window up on the run view so someone can watch, and the rest of the app
  stays fully usable. A server has no window; the run page is the equivalent.
- **Every run is in the history** exactly like one you started yourself, so you can replay
  the frames afterwards and see precisely what the caller had it do.

## Choosing between several executors

*New in 0.14.2.*

> **Independent executors only.** If they share one Redis they are a **cluster**, and none of this
> applies: submit to whichever node you can reach and it sorts itself out — there is no capacity to
> compare, no executor to choose, and no `runId` → machine mapping to keep. Skip to
> **[Cluster mode](cluster.md#what-a-client-has-to-know)**, which also covers the one route a
> client must handle differently there.

Several containers can serve the same agent — one per digital worker, or a pool of identical
ones. A dispatcher in front of them has to pick, and plain `/v1/status` cannot answer the
question it is actually asking: `queued` is the **whole** queue's depth, while "can *this agent*
start now" depends on that agent's own slots.

```sh
curl "https://exec-001.example.com/v1/status?byAgent=1" -H "Authorization: Bearer $TOKEN"
```

```jsonc
{
  // `maxConcurrent` is arithmetic, not a limit: the sum of every agent's slots, i.e. what this
  // box could have going at once if every agent were busy. Nothing enforces it.
  "ok": true, "maxConcurrent": 5, "queued": 2, "draining": false,
  "agents": [
    // `free` > 0 means a task sent now STARTS now.
    { "agentId": "acme-clerk", "taskCount": 3, "running": 2, "queued": 1,
      "slots": 4, "busy": 2, "free": 2, "supported": true },
    { "agentId": "acme-filer", "taskCount": 2, "running": 1, "queued": 1,
      "slots": 1, "busy": 1, "free": 0, "supported": true }
  ]
}
```

**Sort on `free`, and fall back to `taskCount` only when every candidate reports `free: 0`.** The
two disagree in both directions, and each disagreement is a misroute: a four-slot agent with three
tasks on it can start yours immediately, while a one-slot agent with a single task cannot. Once
nothing is free, the shallower queue is the better guess.

**`supported: false` means don't send at all.** That executor can't run the agent — a native-window
agent on a deployment with no display, say — and the submission would be refused with `422` rather
than queued. Its `free` is reported as `0` for the same reason: a spare profile on an agent that
cannot run here is not capacity, and a router sorting on `free` would otherwise send it work every
time.

**A task can also wait on memory**, not just on slots: an executor holds an *additional* run back
while under 1 GB is free rather than risking an OOM kill that would take every run in the process
with it. `free` doesn't predict that — it's a fact about the machine, not the agent — so treat a
task that queues with `free > 0` as an under-provisioned executor, and see
[Running more than one run at a time](server-mode.md#running-more-than-one-run-at-a-time).

**It is authenticated**, like `/v1/status` itself: per-agent load is operational intelligence
about what a business is doing, not a probe payload. Use `/v1/health` and `/v1/ready` for probes.

## Rules a caller must follow

- **One operation per run.** Decompose on the caller's side. A run should be something a
  person would describe as a single step.
- **Never resubmit a failed run to "just try again".** SimpleClaw does not auto-retry, for
  the same reason: a resubmitted filing or order is a real duplicate on the far end. When a
  run fails part-way, decide deliberately what to do about the partial work.
- **Never put a password in a goal.** Goal text is recorded in run history. A browser agent
  uses the sign-in [a human gave it once](user-guide.md#staying-signed-in) — that, not the
  goal, is where its authority comes from.
- **Pass values you already know.** If an earlier step produced a reference number, put it
  in the goal rather than making the agent go find it again.
- **Read `pauseReason` before reacting to a pause**, per above.

## Security

Treat this as what it is: **a way for another program to operate real systems.** In the
desktop app it is built to be usable only by software already running as you, on your
machine.

- **The desktop app is local only.** Its socket binds `127.0.0.1` and nothing else — not
  reachable from your network, with no remote mode to misconfigure. A
  [server deployment](server-mode.md) is the deliberate exception, and its security is
  yours to configure: see [its own section](server-mode.md#security).
- **Token-protected.** In the desktop app, every request must carry the token SimpleClaw
  generated at launch and wrote to a file in its own user-data folder — software that cannot
  read your files cannot drive it. A server instead uses the shared token or the JWT issuer
  you configured, and refuses at startup to publish a non-loopback port without one.
- **A caller cannot widen an agent's reach.** It may only name agents that already exist, in
  the organization currently active, and it cannot set an agent's start URL, scope, or
  sign-in. Where an agent may work stays a decision you make in SimpleClaw — which matters,
  because site sealing is a
  [backstop, not a sandbox](safety-and-privacy.md#sealed-browser-agents).
- **Everything else still applies.** `F9` stops a run whoever submitted it. Dry run, step
  delay, and max steps are the agent's settings, not the caller's.

The honest summary of the risk: anything that can authenticate to this interface can ask
SimpleClaw to do whatever one of your agents can do — including acting with the account
authority of a signed-in browser agent. On the desktop that means any program on your
computer able to read your user folder; on a server it means anything holding the credential
and able to reach the port. See
[Safety & privacy](safety-and-privacy.md#letting-another-program-drive-it).

## Limits

- **One run at a time per instance**, as above. Two operations in parallel aren't possible
  within one executor; a [server deployment](server-mode.md) scales with replicas.
- **A caller cannot create or teach agents.** Recording a demonstration, editing a persona,
  and configuring scope are all done by a person in SimpleClaw.
- **The desktop app is local only** — a caller has to run on the same computer. Reaching one
  over the network means [server mode](server-mode.md), where only browser-scope agents run.
- **No stable API contract yet.** This is a 0.x release; endpoints and payloads may change
  between versions. Check `GET /v1/health` for the version you're talking to.

## Troubleshooting

**Nothing is listening / no `autoplay-api.json`.** SimpleClaw isn't running, or was killed
without shutting down cleanly (which can leave a stale file pointing at a dead port).
Starting the app again rewrites it. Callers should treat both cases as "not running".

**`401 Unauthorized`.** Against the desktop app the token is stale — it is regenerated on
every launch, so re-read `autoplay-api.json` rather than caching the value. Against a server,
check the credential matches the configured mode: a bearer token in `static` mode, or a JWT
whose issuer and audience are the ones the executor was told to expect.

**`403` "not in the active organization".** The `agentId` belongs to a different
organization than the one SimpleClaw currently has active. Use an id from
`GET /v1/capabilities`.

**`409` "could not choose an agent confidently".** You omitted `agentId` and routing was
ambiguous. The response lists the agents — name one.

**The run finished but the answer is wrong.** Read it as a run, not an API error: open it in
SimpleClaw's history and replay the frames. Usually the goal was ambiguous, or the operation
was never demonstrated to that agent (check `demoCoverage`).
