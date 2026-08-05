# SimpleClaw — Server mode

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Web APIs](web-apis.md) · [Agent API](agent-api.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md) · [Release notes](release-notes.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/server-mode.html)
> labels each page with its release and can switch between versions.

**New in 0.7.** SimpleClaw can run with **no window and nobody at the keyboard** — just the
[control API](agent-api.md), as a long-lived service. It's distributed as a **deployment
bundle** on the Releases page: extract it, run `docker compose up -d`, and the thing that
used to be an app on one person's desktop is a service your other systems call.

This is the same agent loop and the same agents as the desktop app. What changes is
everything that assumed a person: no window, no `F9`, no auto-update, and configuration from
the environment instead of a settings screen.

> **New in 0.9 — one runtime, and the app is its client.** Desktop and server are the same
> build: the same startup sequence, the same environment configuration, the same control API,
> and the same web UI, which is why a server hands out a run page that looks like the app.
> Server mode is now only the difference a deployment actually needs — no window, no person —
> rather than a second product. And you no longer need `curl` to work with one: register it in
> the desktop app and the same pages show what it's doing, start runs on it, and
> [send it agents](#sending-an-agent-from-the-desktop-app). See
> [Pointing it at a server](user-guide.md#pointing-it-at-a-server).

---

## Table of contents

1. [When you'd want this](#when-youd-want-this)
2. [What you need](#what-you-need)
3. [What changes in server mode](#what-changes-in-server-mode)
4. [Get it running](#get-it-running)
5. [Bringing your agents](#bringing-your-agents)
6. [Sending an agent from the desktop app](#sending-an-agent-from-the-desktop-app)
7. [Editing a deployed agent from the desktop app](#editing-a-deployed-agent-from-the-desktop-app)
8. [Deleting a run from a remote window](#deleting-a-run-from-a-remote-window)
9. [Letting the desktop app reach it](#letting-the-desktop-app-reach-it)
10. [Configuration](#configuration)
11. [Signing in without a person](#signing-in-without-a-person)
12. [Authentication](#authentication)
13. [Health, readiness, and shutdown](#health-readiness-and-shutdown)
14. [Keeping the disk from filling up](#keeping-the-disk-from-filling-up)
15. [Running it somewhere real](#running-it-somewhere-real)
16. [Security](#security)
17. [Upgrading](#upgrading)
18. [Limits](#limits)

---

## When you'd want this

The desktop app is the right answer when a person is involved — watching a run, taking the
controls, teaching an agent by demonstration. Server mode is for the cases where nobody is:

- **Another system drives it.** Your backend, your workflow engine, or an AI agent of your
  own submits work over the [Agent API](agent-api.md) and reads results back. With the
  desktop app the caller has to be on the same machine; here it doesn't.
- **It should be up when no one is logged in.** A desktop app dies with the session. A
  container is restarted by the platform.
- **It belongs in your deployment, not on a laptop.** The same bundle in staging and
  production, configuration from environment and secrets, logs where your other logs go.

If you just want SimpleClaw to do things on **your own screen**, stay with the desktop app —
server mode can't do that at all, and [the next section](#what-changes-in-server-mode) says
why.

**It isn't either/or.** Since 0.9 the usual arrangement is both: you author and rehearse agents
in the desktop app, push them to a server, and keep using the app as the window onto what that
server is doing. See [Pointing it at a server](user-guide.md#pointing-it-at-a-server).

## What you need

- **Docker**, with Compose. Nothing else — no Node toolchain and no source checkout. The
  bundle carries the compiled application and a Dockerfile that only assembles it.
- **A headless-browser agent that already works.** Build and test it in the desktop app
  first. Server mode runs agents; it can't teach them.
- **Somewhere to keep secrets.** The model API key and any sign-in credentials come from the
  environment, not from files on a share.

**About 3 MB to download, and a few minutes for the first build** — the image pulls Chrome
and Electron, which are not in the bundle.

## What changes in server mode

**Only headless-browser agents run.** There is no desktop in a container, so a
desktop-scope or window-scope agent is refused three separate ways: greyed out in
`GET /v1/capabilities`, a `422` from `POST /v1/runs`, and an error from the scope itself for
any other route into a run. This is deliberate — the alternative is an agent clicking
confidently into a blank virtual screen. Set an agent's
[scope](user-guide.md#where-the-agent-works-scope) to **Headless browser** before deploying
it.

**Nothing that assumes a person exists.** No window, no auto-updater, no global `F9`
shortcut. These aren't disabled behind a flag; the headless entry point simply never calls
them, so nothing added to the desktop app later can accidentally switch them back on.

**Agents are read-only.** Configuration arrives as a **read-time overlay** — the environment
replaces fields as they're read, and nothing is written back. That's what lets the container
treat its own storage as disposable and keep no secret at rest.

**Except for what arrives from a desktop window, which needs nothing set** *(changed in 0.10)*.
Three writes reach in from outside: an **uploaded** agent or scenario, an **edit** to an agent
already here, and **deleting** a finished run's record. All three used to be off behind a
variable (`AUTOPLAY_ALLOW_AGENT_IMPORT`, `AUTOPLAY_ALLOW_SCENARIO_IMPORT`,
`AUTOPLAY_ALLOW_RUN_DELETE`); all three are now simply available, because every deployment
wanted them and what the flags produced in practice was a `501` where the app had a working
button. What the read-only overlay above still protects is untouched: an upload is built
entirely from the caller's bundle, and an edit is applied to the record **on disk** rather than
the env-overlaid one, so neither can round-trip an injected key onto your volume. Setting
`AUTOPLAY_AGENTS_READONLY=1` **explicitly** is the one lever left, and it refuses edits with
`409` — that is how you say *these agent files are not to be modified*. See
[Sending an agent](#sending-an-agent-from-the-desktop-app),
[Editing a deployed agent](#editing-a-deployed-agent-from-the-desktop-app) and
[Deleting a run](#deleting-a-run-from-a-remote-window).

**Schedules run here too** *(changed in 0.10)*. A
[schedule](user-guide.md#running-a-task-later-scheduling) used to need `AUTOPLAY_SCHEDULER=on`;
it is now on in every mode and there is no variable. The thing to know is where the entries
live: in the data directory, so **N replicas sharing one each arm the same timers** and a 09:00
task fires N times. Run **one** replica where schedules matter — the browser and the agent loop
are single-flight anyway. A scheduled run is an ordinary queued job (a `runId`, followable,
stoppable, counted against `AUTOPLAY_MAX_QUEUE`) and waits its turn rather than being skipped
when something else is running.

**Scenarios run here too** *(0.8)*. A [scenario](user-guide.md#running-a-whole-process-scenarios)
saved in the desktop app travels with the agents you mount, and
[`POST /v1/scenarios/{id}/run`](agent-api.md#running-a-whole-scenario) runs its steps across
its agents with nothing on screen. The same rule as above applies per step: a step naming a
desktop-scope agent is refused before step 1, not discovered halfway through. Values the steps
reference but never produce have to arrive as `params` — there's nobody here to be asked.

**It refuses to start when it couldn't work.** No agent in the active organization that
could actually run — no browser-scope agent, or one with no model API key — is a startup
failure with a readable message. So is an unknown provider name, a half-configured JWT
setup, or a half-configured database. Each of these would otherwise surface much later as a
confusing error several layers from the setting that caused it.

## Get it running

**1. Download the bundle.** From the
[Releases page](https://github.com/Simpletruss/simpleclaw-desktop/releases/latest), take
`simpleclaw-server-<version>-docker.tar.gz` — it's listed alongside the desktop installers.

```sh
tar -xzf simpleclaw-server-0.10.1-docker.tar.gz
cd simpleclaw-server-0.10.1
```

**2. Put your agents next to it,** in a folder called `orgs` — see
[Bringing your agents](#bringing-your-agents) for where to copy them from. When you're done
you should have `./orgs/<org>/<agentId>/agent.json`.

**3. Configure it.**

```sh
cp .env.example .env
```

Two settings are genuinely required, and the container won't start without them:

| Setting | |
|---------|--|
| `AUTOPLAY_MODEL_API_KEY` | The key for your vision model. It overrides whatever each `agent.json` carries, so the deployed key can come from your secret store rather than a file on a share. |
| `AUTOPLAY_API_TOKEN` | What callers authenticate with. Generate one — `openssl rand -hex 32`. The server **refuses to start** on a public port without a real credential. |

Also check `AUTOPLAY_ACTIVE_ORG` matches your organization's folder name under `orgs/`.
Everything else in `.env.example` is commented and has a working default.

**4. Start it.**

```sh
docker compose up -d
docker compose logs -f      # the first build takes a few minutes
```

**5. Check it came up.**

```sh
curl http://localhost:8790/v1/ready
# {"ok":true,"version":"0.10.1"}
```

If it exited instead, the log names the reason —
[startup failures are deliberate](#what-changes-in-server-mode), so read it rather than
restarting.

**6. Give it something to do.**

```sh
curl -H "Authorization: Bearer $AUTOPLAY_API_TOKEN" http://localhost:8790/v1/capabilities

curl -X POST http://localhost:8790/v1/runs \
  -H "Authorization: Bearer $AUTOPLAY_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"agentId":"<from capabilities>","goal":"…"}'
```

`POST /v1/runs` returns a `runId` immediately — it does not wait for the run. Follow it on
`GET /v1/runs/{id}/events` or poll `GET /v1/runs/{id}`. The full interface is the
[Agent API](agent-api.md).

*From 0.11*, a script that just wants the answer can add `?wait=<seconds>`: the response is
held until the run finishes (`200`) or the bound expires (`202`, same `runId`), and
`GET /v1/runs/{id}/wait?timeout=<seconds>` keeps waiting on one already going. Keep the bound
under the idle timeout of whatever proxy or ingress sits in front of the container — 120
seconds is the ceiling here for that reason — and note that giving up on a wait never stops
the run. → [Waiting for the answer, in one call](agent-api.md#waiting-for-the-answer-in-one-call)

## Bringing your agents

**Agents are not in the bundle,** by design: an agent is a file, so changing one means
editing JSON on your host and restarting, never rebuilding an image.

The desktop app treats an organization as one self-contained folder, branding and agents
together:

```
orgs/<org>/custom.yml            branding: name, logo, theme
orgs/<org>/logo.svg
orgs/<org>/<agentId>/agent.json  the agent
orgs/<org>/<agentId>/history/    and everything it writes
```

Copy that `orgs` folder out of the desktop app's data directory into `./orgs` beside the
compose file:

| Platform | Where the desktop app keeps it |
|----------|--------------------------------|
| **Windows** | `%APPDATA%\SimpleClaw\orgs` |
| **macOS** | `~/Library/Application Support/SimpleClaw/orgs` |
| **Linux** | `~/.config/SimpleClaw/orgs` |

Copy only the organization you intend to run if you'd rather — then point
`AUTOPLAY_ACTIVE_ORG` at its folder name. **That setting is effectively required:** a folder
with several organizations usually has browser-scope agents in only one, and picking a
different one fails startup with "no browser-scope agent" — correct, but it reads like a
broken deployment rather than a missing setting.

Four more things follow from that folder being a mount:

- **It has to be read-write.** `history/`, `memory.md` and `training/` are siblings of
  `agent.json` in the same per-agent folder, so a read-only mount doesn't fail at startup —
  it fails on the first screenshot.
- **Retention prunes what you mount.** The sweep that stops the disk filling up applies its
  defaults (7-day screenshots, 30-day sessions, 2 GB cap) to whatever is behind the mount.
  Set all three to `0` if `orgs/` is a folder you also use from the desktop app — otherwise
  you'll find your own run history swept.
- **History writes back; `agent.json` does not.** Everything the executor produces lands on
  the mount like any other data. Only the agent files are held read-only, by
  `AUTOPLAY_AGENTS_READONLY`. **Don't turn that off on a folder you care about** — a
  writable roster pass rewrites the agent set and deletes any `agent.json` that isn't in it.
- **Edits need a restart, unless you ask otherwise.** `AUTOPLAY_AGENTS_WATCH_MS` re-checks
  the files on that interval and drops the cache when they change; it's off by default,
  because a deployed executor's agents change when someone deploys and a restart is the
  honest way to pick that up. It's safe during a run either way — the loop keeps the agent it
  started with, so a reload changes what the *next* run sees.

**One mount, not two** *(0.9)*. The image keeps branding and agents in different places —
branding baked in, agents under `{AUTOPLAY_DATA_DIR}/orgs` — and pointing `ORGANIZATIONS_DIR`
at your mounted `orgs/` collapses them again, so a single mount covers both and the container
sees exactly what the desktop app sees. The baked copy stays behind as the no-mount fallback,
so an image run with no mount behaves as it always did.

## Sending an agent from the desktop app

*New in 0.9.*

Copying an `orgs` folder is the deployment-time answer. The everyday one is **Agents → General
→ Upload to a remote server**, which sends the same bundle the **Export** button writes to a
file — the agent's config plus its attached MCP servers, its non-built-in skills, and its
memory — straight to the server's import route. Scenarios go the same way, from the scenario
page. It's the only route into a server that has none of your folders mounted.

Register the server once in **⚙ Settings → Run servers → Remote servers**; the fields and the
**Check** probe are covered in [Pointing it at a server](user-guide.md#pointing-it-at-a-server).

What the button does, if you'd rather do it yourself:

```sh
curl -X POST https://autoplay.example.com/v1/agents/import \
  -H "Authorization: Bearer $AUTOPLAY_API_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @work-order-bot.agent.json
# 201 {"agentId":"work-order-bot","name":"Work Order Bot","skills":2,"supported":true}
```

Four rules worth knowing before you rely on it:

- **Nothing to switch on** *(changed in 0.10)*. This needed `AUTOPLAY_ALLOW_AGENT_IMPORT=1`
  (and `AUTOPLAY_ALLOW_SCENARIO_IMPORT=1` for scenarios) until both flags were removed — an
  executor with no agents and no way to receive one is not a deployment anybody wanted, and the
  upload is how they arrive. **Check** still reports whether a server's *build* has the route, so
  an executor due an update says so up front rather than mid-upload.
- **An upload creates unless you ask otherwise.** A colliding id gets a suffix instead of
  overwriting, so re-uploading an edited agent yields a *second* agent rather than replacing one
  that may be mid-run. **Overwrite** (the checkbox, on by default) replaces it in place instead,
  keeping the run history. Either way the app tells you the name it landed under.
- **Ownership is one-way; correction is not** *(0.10)*. There is still no route that lists or
  deletes agents, and the desktop that authored one overwrites the lot on its next upload — but
  a window pointed at this machine can open a deployed agent's editor and fix its config in
  place. → [Editing a deployed agent](#editing-a-deployed-agent-from-the-desktop-app)
- **`supported` in the response is the thing to read.** It answers *can this server actually
  run what you just sent* — a desktop-scope agent uploads fine and then can't run, because a
  container has no screen. Set its [scope](user-guide.md#where-the-agent-works-scope) to
  **Headless browser** first. A scenario upload likewise names any agents it needs that aren't
  there yet.

An executor is allowed to boot with **no agents at all** — that's its normal first state, and
refusing would be a deadlock, since the only way to put an agent in is the route that needs the
server running. A roster that *has* agents and none of them runnable here does still fail at
startup: something is mounted and nothing in it can run, which means the mount or
`AUTOPLAY_ACTIVE_ORG` is wrong.

## Editing a deployed agent from the desktop app

*New in 0.10.*

Point the title bar at a server, open **Agents**, and clicking one now opens the **same detail
editor** a local agent gets, filled from that machine. Changes save over there as you type — one
coalesced request per pause, not one per keystroke — and a banner says where they are going and
that the next upload from the owning computer overwrites them.

Why this exists: a deployed agent whose persona is wrong, or whose start URL moved, was
previously fixed by finding the laptop it was authored on and re-uploading. Ownership doesn't
move — the desktop still authors agents — but *correcting* one shouldn't require an archaeology
expedition.

**What is editable is the config**, which is what a server stores: persona, scope and start URL,
the model endpoints, planner/executor/observer/chronos settings, REST access, voice. **What is
not** is everything that is a file or a device over there rather than a field — skill bodies,
function folders, the lessons list, the signed-in browser profile, that machine's monitors and
open windows. Those show a note naming what they are and where they live, because a form that
appeared to edit them would in fact have been editing this computer's copies.

Two things the executor tells the window before anyone types, so the form is never optimistic:

- **Whether it will store a change at all.** `AUTOPLAY_AGENTS_READONLY=1`, set *explicitly*, is
  refused with `409`; the fields still show their real values, and the banner carries the
  executor's own reason and names the variable. Server mode's own default read-only behaviour is
  a different thing and does **not** refuse edits — it exists to keep the model-key overlay out
  of `agent.json`, which a patch of the on-disk record can't do anyway.
- **Which model fields its environment pins.** `AUTOPLAY_MODEL_*` wins over anything stored, so
  an edit to one would be kept and then ignored. The banner says so rather than leaving somebody
  to conclude the save failed.

**Secrets don't travel.** API keys, phone credentials, the REST bridge's per-host header values
and the enrolled voiceprint are blanked on the way out. A patch is a **partial**, so a field the
window never touched is never sent — and a blank that *is* sent back is treated as **unchanged**,
never as a deletion. That matters because an editor section saves by sending the object it was
given: ticking an Observer checkbox arrives carrying a blank API key beside it, and taken
literally that would unset a working credential with nothing to say so until the next run failed
to authenticate. To **clear** a secret, upload the agent with credentials included.

```sh
curl -X PATCH https://autoplay.example.com/v1/agents/work-order-bot \
  -H "Authorization: Bearer $AUTOPLAY_API_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"persona":"Close work orders; never reopen one."}'
# 200 {"agent":{…},"editable":true,"envPinned":["baseUrl","apiKey","model"]}
```

`GET /v1/agents/:id` is the read behind the editor: one agent's whole config, secrets blanked,
plus `editable` and `envPinned`. Neither route lists or deletes agents — there is still no
`GET /v1/agents` and no `DELETE`.

## Deleting a run from a remote window

*New in 0.10.*

Reading a deployment's history and being unable to curate it isn't a policy, it's a gap: the
person watching a deployed agent is usually the only one who will ever decide a run is finished
with. The trash button in **Run history** and the bulk **Clean up** now send that decision to
whichever machine holds the run (`DELETE /v1/runs/:id`), and it is the only route on the control
API that destroys anything.

It needs nothing set — `AUTOPLAY_ALLOW_RUN_DELETE` briefly existed and was removed, since a flag
whose off-state greyed out the button on every deployment wasn't worth keeping. What refuses:

- **A run that hasn't finished** — `409`. Deleting the record from under a live loop would leave
  it writing steps into a session that no longer exists. Stop it first.
- **A supervised demonstration** — `409` unless `?force=1`, which is what typing *Yes* in the
  desktop dialog means. The planner builds its plans out of those, so losing one silently
  degrades every later run in a way nothing points back to this call. A bulk clean-up never
  sends it.
- **A live link** — `401`. A run-scoped token doesn't reach this route at all. Someone watching a
  run going wrong may end it (`/stop`); erasing the record of what happened is not supervision.
- **A caller who couldn't read it** — `404`, under `AUTOPLAY_RUN_OWNERSHIP`.

Deletion covers the session record, its screenshots and its rows in any benchmark report, and
there is **no undo**. On a deployment whose history is the audit trail, the thing to control is
who holds the bearer — which is what admits a caller to every other route here too.

Where a *build* is too old to have the route, the button stays on screen and goes disabled with
that as its tooltip, rather than disappearing or offering something that would `404`.

## Letting the desktop app reach it

*New in 0.9.*

One setting lives on the server rather than in the app. The desktop app calls a server
**directly from its window**, so the browser engine applies cross-origin rules: unless the
server names the app's origin, the call is blocked before the server ever sees it, and the
failure looks like a network error with nothing pointing at the fix.

```sh
AUTOPLAY_CORS_ORIGINS=app://renderer,http://localhost:5173
```

`app://renderer` is the packaged app — a real, stable origin your deployment can allow, which
is why the app is served over a registered scheme instead of `file://`. The second entry is
only needed for a build run from source (`npm run dev`); listing both is harmless, and
Settings → Run servers → Remote servers shows the line with a **Copy** button.

There is **no wildcard**, deliberately: this is a list of exactly which origins may drive
software with your agents' authority.

## Configuration

Everything is environment-driven — `.env` in the bundle, or however your platform injects
variables. Nothing set here is written back to disk.

| Group | Variables |
|-------|-----------|
| **Mode** | `AUTOPLAY_DATA_DIR`, `ORGANIZATIONS_DIR`, `AUTOPLAY_ACTIVE_ORG`, `AUTOPLAY_AGENTS_READONLY`, `AUTOPLAY_AGENTS_WATCH_MS` |
| **HTTP** | `AUTOPLAY_HTTP_HOST` (server default `0.0.0.0`), `AUTOPLAY_HTTP_PORT` (8790), `AUTOPLAY_PUBLIC_URL`, `AUTOPLAY_CORS_ORIGINS`, `AUTOPLAY_MAX_QUEUE`, `AUTOPLAY_RUN_TTL_MIN`, `AUTOPLAY_PAUSE_TIMEOUT_MS` |
| **Auth** | `AUTOPLAY_AUTH_MODE` (`static`\|`jwt`), `AUTOPLAY_API_TOKEN`, `AUTOPLAY_JWT_PUBLIC_KEY`, `AUTOPLAY_JWT_ISSUER`, `AUTOPLAY_JWT_AUDIENCE`, `AUTOPLAY_JWT_ALGS`, `AUTOPLAY_JWT_LEEWAY_S`, `AUTOPLAY_JWT_ORG_CLAIM`, `AUTOPLAY_RUN_OWNERSHIP` |
| **Model** | `AUTOPLAY_MODEL_{PROVIDER,BASE_URL,API_KEY,MODEL}`, plus `AUTOPLAY_SYSTEM_MODEL_*` and `AUTOPLAY_DETECTOR_MODEL_*`, which fall back to it field by field |
| **Browser** | `AUTOPLAY_BROWSER_PATH`, `AUTOPLAY_BROWSER_EXTRA_ARGS`, `AUTOPLAY_BROWSER_KEEPALIVE_MS`, `AUTOPLAY_ALLOW_DESKTOP_SCOPE` |
| **Credentials** | `AUTOPLAY_SECRET_<NAME>` — see [below](#signing-in-without-a-person) |
| **Retention** | `AUTOPLAY_HISTORY_IMAGE_DAYS` (7), `AUTOPLAY_HISTORY_DAYS` (30), `AUTOPLAY_HISTORY_MAX_MB` (2048) |
| **Storage** | `AUTOPLAY_STORE` (`file`\|`mongo`), `AUTOPLAY_MONGO_URI`, `AUTOPLAY_MONGO_DB`, `AUTOPLAY_FUNCTION_CACHE_DIR` |

> **Four variables were removed in 0.10** and need no replacement:
> `AUTOPLAY_ALLOW_AGENT_IMPORT`, `AUTOPLAY_ALLOW_SCENARIO_IMPORT`, `AUTOPLAY_ALLOW_RUN_DELETE`
> and `AUTOPLAY_SCHEDULER`. Uploads, agent edits, run deletion and schedules are unconditional;
> setting one of these now does nothing. The caution moved to
> `AUTOPLAY_AGENTS_READONLY=1`, which refuses agent edits — see
> [What changes in server mode](#what-changes-in-server-mode).

Three rules apply across all of them:

- **Any secret can be a file.** Give `<NAME>_FILE` pointing at a mounted path instead of
  `<NAME>` and the value is read from there — which is what a secrets manager or a Docker
  secret gives you. The value then never appears in the process environment, where anything
  able to read `/proc` or a crash dump would find it.
- **An empty value counts as unset.** A platform that renders an absent value as an empty
  string can't blank out a working setting that way. The flip side: a variable you meant to
  set but left empty is silently ignored.
- **The model overlay wins over `agent.json`,** for every agent. That's deliberate, and it's
  the one thing you can't see from outside — so the executor logs at startup which variables
  are overriding what (names only, never values). A stale `AUTOPLAY_MODEL_API_KEY` otherwise
  shows up as a `401` on the first model call and reads like an expired agent credential.

`AUTOPLAY_STORE=mongo` moves agents, history and functions into MongoDB instead of the
filesystem, for deployments where a shared volume isn't the right answer. Setting it
half-way — a URI but no database name — is a startup failure rather than a silent fall back
to empty local storage that would pass its readiness probe and serve an empty agent roster.

## Signing in without a person

A container's storage is disposable and a Chrome profile is bound to the machine that made
it, so the desktop's ["log in once"](user-guide.md#staying-signed-in) profile isn't something a
deployment can rely on. An agent signs in on **every run** instead, from credentials the platform
injects. In the agent's scope:

```jsonc
"browser": {
  "startUrl": "https://app.example.com",
  "credentials": [
    { "name": "Example admin", "usernameSecret": "EXAMPLE_USER", "passwordSecret": "EXAMPLE_PASSWORD" }
  ]
}
```

> **`persistProfile` is gone** *(0.10)*. It used to appear here as `false`; the field was removed
> and every browser agent has a profile directory. Nothing changes for a deployment — the
> container's disk is still disposable, so the profile is empty on each new container and the
> credentials below are still how it signs in. An old `agent.json` that carries the field is
> simply ignored.
>
> Where the profile now **lives** does matter if your agents are on a network mount: it moved out
> of the agent's folder into the app's own data directory. Chrome creates its lock files as
> symlinks inside a profile, SMB shares such as Azure Files refuse to create a symlink at all,
> and Chrome treats that as fatal — so a mounted `orgs/` on that storage used to kill every run
> of a signed-in agent in about 200 ms, before it opened a page. If you want the profile on a
> volume that survives the container, mount `AUTOPLAY_DATA_DIR` on storage that allows symlinks;
> a profile is machine-local state either way.

Only the **names** are stored in the agent. The values come from
`AUTOPLAY_SECRET_EXAMPLE_USER` / `AUTOPLAY_SECRET_EXAMPLE_PASSWORD` (or their `_FILE` form)
and are resolved at the moment of filling, never cached — a rotated secret would otherwise
outlive the rotation meant to invalidate it.

The AI model never sees the value. It gets one tool whose only parameter is an enum of those
names: it can say *"fill the credential called EXAMPLE_PASSWORD into the focused field"* and
nothing more. The value is absent from the tool definition, the prompt, the model's
arguments, the recorded step, and the event stream. That matters because the model reads text
off a web page an attacker may control — anything it can repeat back is something an injected
instruction can ask it to repeat somewhere else.

**What this doesn't solve is MFA or a CAPTCHA.** When a site demands one, unattended sign-in
can't complete. The escape hatch is [takeover](user-guide.md#taking-control-mid-run): a
person opens the run's live link and drives the browser by hand until it's past, then hands
back. Set `AUTOPLAY_PUBLIC_URL` to the address the executor is reached by from outside and
that link is offered automatically; leave it unset and no link is handed out, which is the
right answer for anything nobody can reach.

## Authentication

The desktop app mints a fresh token each launch and writes it to a local file, because the
only callers are on the same machine. A server has to be told what to trust.

**`static`** — one shared bearer token, from `AUTOPLAY_API_TOKEN` (or `_FILE`). Simple, right
for a single trusted caller, and the mode to start with.

**`jwt`** — verify tokens signed by your own identity provider. `AUTOPLAY_JWT_PUBLIC_KEY`,
`AUTOPLAY_JWT_ISSUER` and `AUTOPLAY_JWT_AUDIENCE` are **all required**: without an issuer and
audience the executor would accept any token that key ever signed, for any service.
`AUTOPLAY_JWT_ORG_CLAIM` additionally binds a token to the executor's organization.

Two related settings:

- **`AUTOPLAY_CORS_ORIGINS`** — a comma-separated list of exact origins allowed to call it
  from a browser. There is no wildcard.
- **`AUTOPLAY_RUN_OWNERSHIP`** — restrict each caller to the runs it submitted, rather than
  letting any authenticated caller read or stop any run.

**A non-loopback bind with no real credential is refused at startup.** Publishing a port
while relying on the self-generated per-launch token would expose an interface whose
protection nobody outside the process can know — so it fails loudly instead.

## Health, readiness, and shutdown

| Endpoint | Auth | Use it for |
|----------|------|------------|
| `GET /v1/health` | none | **Liveness.** Deliberately content-free: is the process up. |
| `GET /v1/ready` | none | **Readiness.** `503` until it could actually take a run — which includes having resolved a browser to drive, the failure this image can realistically have. Gate traffic on this one. |
| `GET /v1/status` | yes | The operational view: version, whether a run is in progress, queue depth, whether it's draining. |

Allow a generous startup window before readiness has to pass — a cold start pays for the X
server, Electron, and the first Chrome launch. The bundled compose file allows 90 seconds.

On `SIGTERM` the executor **drains**: it stops accepting new work, stops the active run, and
waits up to 15 seconds for it to reach a terminal state so the run is written to history
rather than lost. **Your platform's termination grace period must exceed that** or it will
`SIGKILL` mid-drain. The bundled compose file sets `stop_grace_period: 30s`; if you deploy
somewhere else, set the equivalent.

## Keeping the disk from filling up

The desktop app needs no retention policy — a person notices a full disk and deletes runs.
An unattended executor's storage is small and nobody is watching it, and every step of every
run writes a screenshot. A 40-step run is several megabytes; a hundred runs a day is most of
a gigabyte, and the failure mode is running out of space in the middle of an unrelated run.

So a sweep runs at startup and every six hours after, applying
`AUTOPLAY_HISTORY_IMAGE_DAYS` (7), `AUTOPLAY_HISTORY_DAYS` (30) and `AUTOPLAY_HISTORY_MAX_MB`
(2048, per agent). Each accepts `0` to disable that rule — and see the mount warning
[above](#bringing-your-agents) before pointing the defaults at a folder you also use from the
desktop app.

## Running it somewhere real

The compose file in the bundle is a working deployment, not just a demo, but a few things
change once it leaves your machine.

**The image.** It's Debian-based (Electron links against glibc and won't run on musl), runs
as a **non-root user**, and starts an X server before Electron because Electron needs a
display on Linux even with no windows. Chrome runs **without its sandbox**, because container
kernels generally forbid the user namespaces it needs and most managed platforms can't grant
`SYS_ADMIN` or a custom seccomp profile. The compensating controls are the non-root user, the
origin seal on the agent's browser, and a scrubbed environment when the browser is spawned.

If your platform wants an image in a registry rather than a build context, build the bundle
once and push it yourself:

```sh
docker build -t your-registry.example.com/simpleclaw-server:0.10.1 .
docker push your-registry.example.com/simpleclaw-server:0.10.1
```

**Storage.** Agents need a read-write filesystem the container can see. On Azure Container
Apps that's an **Azure Files** share mounted where `orgs/` would be, with
`ORGANIZATIONS_DIR` pointed at it — there's no Blob volume type (the options are Azure Files
over SMB, NFS Azure Files, ephemeral, and secret volumes), so fetch from Blob in an init step
if it has to be Blob. The Chrome-profile-on-SMB hazard doesn't apply: without a persistent
profile, the profile is a throwaway in the container's own temp directory.

**Secrets.** Use the `_FILE` form for anything sensitive — `AUTOPLAY_MODEL_API_KEY_FILE`
pointing at a Key Vault or secrets-manager mount, rather than the key at rest in an
`agent.json` on a share several people can read.

**Scaling is by replica, not by concurrency.** One instance performs one run at a time — the
agent loop and its browser are single-flight — and extra work queues, with `queuePosition`
telling the caller where it is. To run more at once, run more instances, and give each its
own storage: two executors sharing one agent's folder will fight over the same run history.

## Security

Server mode changes the threat model. With the desktop app the boundary is your user account
on one machine; here you're publishing **an interface that operates software with your
agents' authority**, reachable by whatever can reach the port.

- **Put a real credential on it.** `static` with a strong token, or `jwt` against your own
  identity provider. The startup refusal only catches the most obvious mistake.
- **Don't expose it to the internet without something in front.** It has authentication, not
  rate limiting, WAF, or DDoS protection.
- **A signed-in agent is the sharp edge.** A caller can drive it with the full authority of
  whatever account it uses on that site — see
  [headless-browser agents](safety-and-privacy.md#headless-browser-agents). Give those
  accounts the least access that does the job.
- **A caller still can't widen an agent's reach.** It may only name agents that already
  exist, in the active organization, and it can't set a start URL, a scope, or a sign-in.
  Those stay decisions made in the agent's configuration.
- **Runs are unattended by definition.** Nobody sees a step go wrong in real time. Every run
  is still recorded and replayable — check them.
- **The bearer is the whole boundary, and it now reaches further** *(0.10)*. With the upload,
  edit and delete switches removed, an authenticated caller can add an agent to the roster,
  change an existing agent's config, and delete a finished run's record — as well as start runs,
  which it always could. Read that as one grant, not four: a token that can `POST /v1/runs`
  already drives that machine's browser against real systems, which is a larger power than
  editing a persona. What it means practically is that the token deserves the care a production
  credential gets, and that `AUTOPLAY_AGENTS_READONLY=1` is available where an operator wants
  the agent files themselves declared off limits.
- **Deleting a run is irreversible, and history is often the audit trail** *(0.10)*. The record,
  its screenshots and its benchmark rows go, with no undo. Supervised demonstrations need an
  explicit `?force=1` and unfinished runs are refused, but nothing else stands in the way — so
  if the evidence of what an agent did matters, keep it somewhere the bearer can't reach as well.
- **A registered server's token sits in the app's config** *(0.9)*, in plain text, the same as
  your model API keys. Anyone with your user account on that machine can read it, so treat the
  desktop app as a place production credentials are kept — and note that from 0.10 that token
  also edits agents and deletes runs on the server.
- **Live links are run-scoped.** A link handed out for takeover authorises that one run: its
  frames, its recorded steps, driving it, and ending it. It doesn't carry your bearer token
  and can't reach another run. Anyone holding it can drive that browser, so treat it as
  sensitive while the run is alive.

The fuller picture, including what it costs you:
[Running it as a server](safety-and-privacy.md#running-it-as-a-server).

## Upgrading

Download the newer bundle, copy your `.env` and `orgs/` folder into it, and:

```sh
docker compose up -d --build
```

Nothing you need to keep lives in the image. There's no auto-update here — that's a desktop
feature, and a service that replaces itself without being asked is not one.

## Limits

- **Browser-scope agents only.** No desktop, no window scope. `AUTOPLAY_ALLOW_DESKTOP_SCOPE=1`
  exists as an escape hatch for a host with a real display, but it isn't what the container is
  for, and there is nothing on a container's virtual screen to operate.
- **One run at a time per instance.** Scale with replicas.
- **No teaching from a server.** Recording a demonstration, editing a persona, and
  configuring scope are done by a person in the desktop app; the server runs what it's given.
  Since 0.9 that app can watch a server, start work on it and upload to it — but it still
  can't *edit* anything there, and it isn't meant to: what a remote view shows belongs to the
  machine that owns it.
- **No MFA or CAPTCHA unattended** — see [signing in](#signing-in-without-a-person).
- **x86-64 only.** The image installs Google Chrome from Google's `amd64` repository, so it
  won't build on an ARM host.
- **No stable API contract yet.** This is a 0.x release; endpoints and payloads may change
  between versions. `GET /v1/health` reports the version you're talking to.

---

Problems getting one up? See
[Server mode and containers](troubleshooting.md#server-mode-and-containers) in
Troubleshooting. For the API itself — endpoints, the event stream, worked examples — see the
[Agent API](agent-api.md).
