# SimpleClaw — Server mode

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Agent API](agent-api.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md) · [Release notes](release-notes.md)

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

---

## Table of contents

1. [When you'd want this](#when-youd-want-this)
2. [What you need](#what-you-need)
3. [What changes in server mode](#what-changes-in-server-mode)
4. [Get it running](#get-it-running)
5. [Bringing your agents](#bringing-your-agents)
6. [Configuration](#configuration)
7. [Signing in without a person](#signing-in-without-a-person)
8. [Authentication](#authentication)
9. [Health, readiness, and shutdown](#health-readiness-and-shutdown)
10. [Keeping the disk from filling up](#keeping-the-disk-from-filling-up)
11. [Running it somewhere real](#running-it-somewhere-real)
12. [Security](#security)
13. [Upgrading](#upgrading)
14. [Limits](#limits)

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

**The scheduler is off.** A [schedule](user-guide.md#running-a-task-later-scheduling) is a
timer inside one process, and several replicas would each fire the same one. Set
`AUTOPLAY_SCHEDULER=on` if you run exactly one instance and want it anyway — otherwise
schedule from outside and submit over the API.

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
tar -xzf simpleclaw-server-0.7.0-docker.tar.gz
cd simpleclaw-server-0.7.0
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
# {"ok":true,"version":"0.7.0"}
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

## Configuration

Everything is environment-driven — `.env` in the bundle, or however your platform injects
variables. Nothing set here is written back to disk.

| Group | Variables |
|-------|-----------|
| **Mode** | `AUTOPLAY_DATA_DIR`, `ORGANIZATIONS_DIR`, `AUTOPLAY_ACTIVE_ORG`, `AUTOPLAY_AGENTS_READONLY`, `AUTOPLAY_AGENTS_WATCH_MS`, `AUTOPLAY_SCHEDULER` |
| **HTTP** | `AUTOPLAY_HTTP_HOST` (server default `0.0.0.0`), `AUTOPLAY_HTTP_PORT` (8790), `AUTOPLAY_PUBLIC_URL`, `AUTOPLAY_CORS_ORIGINS`, `AUTOPLAY_MAX_QUEUE`, `AUTOPLAY_RUN_TTL_MIN`, `AUTOPLAY_PAUSE_TIMEOUT_MS` |
| **Auth** | `AUTOPLAY_AUTH_MODE` (`static`\|`jwt`), `AUTOPLAY_API_TOKEN`, `AUTOPLAY_JWT_PUBLIC_KEY`, `AUTOPLAY_JWT_ISSUER`, `AUTOPLAY_JWT_AUDIENCE`, `AUTOPLAY_JWT_ALGS`, `AUTOPLAY_JWT_LEEWAY_S`, `AUTOPLAY_JWT_ORG_CLAIM`, `AUTOPLAY_RUN_OWNERSHIP` |
| **Model** | `AUTOPLAY_MODEL_{PROVIDER,BASE_URL,API_KEY,MODEL}`, plus `AUTOPLAY_SYSTEM_MODEL_*` and `AUTOPLAY_DETECTOR_MODEL_*`, which fall back to it field by field |
| **Browser** | `AUTOPLAY_BROWSER_PATH`, `AUTOPLAY_BROWSER_EXTRA_ARGS`, `AUTOPLAY_BROWSER_KEEPALIVE_MS`, `AUTOPLAY_ALLOW_DESKTOP_SCOPE` |
| **Credentials** | `AUTOPLAY_SECRET_<NAME>` — see [below](#signing-in-without-a-person) |
| **Retention** | `AUTOPLAY_HISTORY_IMAGE_DAYS` (7), `AUTOPLAY_HISTORY_DAYS` (30), `AUTOPLAY_HISTORY_MAX_MB` (2048) |
| **Storage** | `AUTOPLAY_STORE` (`file`\|`mongo`), `AUTOPLAY_MONGO_URI`, `AUTOPLAY_MONGO_DB`, `AUTOPLAY_FUNCTION_CACHE_DIR` |

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
it, so the desktop's ["log in once"](user-guide.md#staying-signed-in) persistent profile
isn't available. An agent signs in on **every run** instead, from credentials the platform
injects. In the agent's scope:

```jsonc
"browser": {
  "startUrl": "https://app.example.com",
  "persistProfile": false,
  "credentials": [
    { "name": "Example admin", "usernameSecret": "EXAMPLE_USER", "passwordSecret": "EXAMPLE_PASSWORD" }
  ]
}
```

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
docker build -t your-registry.example.com/simpleclaw-server:0.7.0 .
docker push your-registry.example.com/simpleclaw-server:0.7.0
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
