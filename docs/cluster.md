# SimpleClaw — Cluster mode

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Records & watchdogs](records-and-watchdogs.md) · [Android devices](android-devices.md) · [Web APIs](web-apis.md) · [Agent API](agent-api.md) · [Server mode](server-mode.md) · [Functions](functions.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md) · [Release notes](release-notes.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/cluster.html)
> labels each page with its release and can switch between versions.

**New in 0.16.** Several executors can share **one queue**. Point them at the same Redis and they
stop being separate machines a caller has to choose between: a task is submitted to **whichever
node you can reach**, appended to a queue every node reads, and started by the first node with a
free slot for that agent.

That one change removes most of what was hard about running more than one executor. There is no
dispatcher to write, no `runId` → machine mapping to keep, and no capacity to compare before
sending work. A node dying costs only what it had already started. And the app grows a **Cluster**
page that manages the whole fleet from wherever you happen to be connected.

**It is opt-in.** Configure Redis and the process is a node; don't, and it is exactly the executor
it was before this existed — which is also what the desktop app runs on. A single container needs
nothing new.

---

## Table of contents

1. [When you'd want this](#when-youd-want-this)
2. [What it changes](#what-it-changes)
3. [Turning it on](#turning-it-on)
4. [What every node needs](#what-every-node-needs)
5. [The Cluster page](#the-cluster-page)
6. [Taking a node out of service (draining)](#taking-a-node-out-of-service-draining)
7. [When a node dies](#when-a-node-dies)
8. [Agents replicate themselves](#agents-replicate-themselves)
9. [Per-agent cluster settings](#per-agent-cluster-settings)
10. [What a client has to know](#what-a-client-has-to-know)
11. [Android devices in a cluster](#android-devices-in-a-cluster)
12. [Limits worth knowing before you deploy](#limits-worth-knowing-before-you-deploy)
13. [Troubleshooting](#troubleshooting)

---

## When you'd want this

Four reasons, and any one of them is enough:

- **More capacity than one machine can hold.** Each concurrent run is a worker process and a
  Chrome — budget about 0.9 GB — so a roster that wants twelve at once wants more than one box.
  → [Running more than one run at a time](server-mode.md#running-more-than-one-run-at-a-time)
- **A machine dying shouldn't lose the queue.** Work that hasn't started isn't inside any node: it
  is in Redis, and another node reads it. Nothing has to be handed over, because nothing is held.
- **Rolling restarts without a maintenance window.** **Drain** a node, let it finish what it has,
  patch it, put it back — while the rest of the fleet keeps taking work.
- **One place to see and manage the fleet.** Every node answers identically about every run, so
  the app pointed at any one of them shows the whole deployment.

**One node is a perfectly good cluster.** Even alone it buys the fleet view, the drain button,
schedule timers held by one node, and a queue that outlives the process — so turning it on for a
single container is a reasonable thing to do, not a contradiction.

**When you wouldn't.** One container that comfortably holds your roster needs none of this, and
Redis is one more thing that can be down. Standalone mode isn't a fallback path — it's the one the
desktop app has always run.

## What it changes

| | Standalone | Cluster |
|--|--|--|
| **Where the queue lives** | In the executor's memory | In Redis, shared |
| **Who picks the machine** | The caller, from `/v1/status?byAgent=1` | Nobody. A node reads the queue while it has a free slot |
| **Who can answer about a run** | The executor that took it | Any node, from the shared ledger |
| **A restart** | Loses whatever was queued | Keeps it (with Redis persistence on) |
| **A machine dying** | Loses its queue too | Loses only what it had already started |
| **Schedule timers** | Every replica arms them, so you ran one | Held by exactly one node at a time |
| **Managing it** | Per machine | The **Cluster** page, from any node |

Everything else is the same: same API, same routes, same bodies, same bearer, same `run_…` ids. A
client written against a single executor keeps working — with
[one exception](#the-one-thing-a-client-must-handle-differently).

## Turning it on

**Give the process a Redis endpoint.** That, and nothing else, is what makes it a node.

There are two forms, and the split isn't cosmetic:

```sh
# Self-hosted Redis — the one-line form.
AUTOPLAY_REDIS_URL=redis://redis:6379

# A MANAGED Redis (Azure Managed Redis, Azure Cache) — separate variables.
AUTOPLAY_REDIS_HOST=rpc.<region>.redis.azure.net
AUTOPLAY_REDIS_PORT=10000
AUTOPLAY_REDIS_PASSWORD=…        # or AUTOPLAY_REDIS_PASSWORD_FILE=/run/secrets/redis
AUTOPLAY_REDIS_TLS=1             # implied by port 10000 or 6380
```

A managed access key is base64 — it ends in `=` and may hold `+` or `/` — and pasting one into
`rediss://:<key>@host:10000` produces a URL whose parse is wrong in a way that surfaces as an auth
failure against a host that is plainly reachable. So the key gets its own variable, where it also
gets the `_FILE` form a secrets mount provides. **Setting both forms is an error** rather than a
precedence rule: two connection specifications in one environment is a deployment mid-edit, and
choosing one silently is how a container ends up talking to the wrong Redis.

Then say who this node is:

| Variable | |
|----------|--|
| `AUTOPLAY_NODE_ID` | This node's name in the fleet. **Unique, and stable across restarts.** Defaults to the hostname — which for a container is its short id, a new value every time it's recreated. Set it. |
| `AUTOPLAY_NODE_URL` | Where **clients** reach this node. Used for the redirect that sends a caller to the node running a task. Absent is a real degradation, not a default — see [below](#the-one-thing-a-client-must-handle-differently). |
| `AUTOPLAY_CLUSTER_NS` | The key prefix every node of **one** cluster shares. Two deployments on one Redis differ only by this. Defaults to the active organization. |
| `AUTOPLAY_CLUSTER_AGENT_SYNC` | `on` (default), `push`, `off` — see [Agents replicate themselves](#agents-replicate-themselves). |
| `AUTOPLAY_REDIS_CLUSTER` | Force the sharded client instead of detecting it. Rarely needed. |

### Turn on Redis persistence

Without it, a Redis restart drops **every task that was queued and hadn't started** — the one
data-loss surface this design has. Self-hosted, that's one flag:

```sh
redis-server --appendonly yes --appendfsync everysec
```

On a managed service it's a resource setting in the portal, not something `CONFIG SET` can change.
`everysec` rather than `always`: a task is worth at most a second of exposure, and `always` costs
an fsync per write on a path that carries every heartbeat.

### A half-configured cluster is refused

`AUTOPLAY_NODE_ID`, `AUTOPLAY_NODE_URL`, `AUTOPLAY_CLUSTER_NS`, `AUTOPLAY_CLUSTER_AGENT_SYNC` or
any `AUTOPLAY_REDIS_*` detail set with **no Redis endpoint beside it** fails at startup, naming the
variable. It isn't a fallback, because the fallback would be the one failure worth protecting
against: a node that looks healthy, accepts work nobody else can see, and never appears in the
fleet — with one absent variable as the cause and nothing anywhere connecting the two.

> Nothing set is a decision. Some of it set is a typo.

### A two-node deployment, whole

```yaml
services:
  redis:
    image: redis:7-alpine
    command: ['redis-server', '--appendonly', 'yes', '--appendfsync', 'everysec']
    volumes: ['redis-data:/data']
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s

  node-1:
    image: simpleclaw-server
    depends_on: { redis: { condition: service_healthy } }
    ports: ['8801:8790']
    environment: &node-env
      AUTOPLAY_AUTH_MODE: static
      AUTOPLAY_API_TOKEN: ${AUTOPLAY_API_TOKEN}          # THE SAME on every node
      AUTOPLAY_MODEL_API_KEY: ${AUTOPLAY_MODEL_API_KEY}
      ORGANIZATIONS_DIR: /data/orgs
      AUTOPLAY_REDIS_URL: redis://redis:6379
      AUTOPLAY_CLUSTER_NS: prod-eu
      AUTOPLAY_NODE_ID: node-1
      AUTOPLAY_NODE_URL: https://exec-1.example.com      # reachable BY CLIENTS
    volumes:
      - node-1-data:/data          # per node: Chrome profiles live in here
      - shared-orgs:/data/orgs     # shared: agents and run history
    shm_size: '1gb'
    stop_grace_period: 45s

  node-2:
    image: simpleclaw-server
    depends_on: { redis: { condition: service_healthy } }
    ports: ['8802:8790']
    environment:
      <<: *node-env
      AUTOPLAY_NODE_ID: node-2
      AUTOPLAY_NODE_URL: https://exec-2.example.com
    volumes:
      - node-2-data:/data
      - shared-orgs:/data/orgs
    shm_size: '1gb'
    stop_grace_period: 45s

volumes:
  redis-data: {}
  shared-orgs: {}
  node-1-data: {}
  node-2-data: {}
```

Every difference between the two nodes is deliberate and every sameness is load-bearing — which is
the subject of the next section.

> **Running from source?** The desktop app reads the cluster variables out of a gitignored `.env`
> as well as the real environment, so a development node needs no shell exports. It's the only
> group of settings that works that way: they open a socket at boot and reach no stored object.

## What every node needs

Six rules. Each one fails **silently** when it's missed — a cluster that looks healthy and behaves
wrongly — which is why they're worth reading once rather than discovering.

| | |
|--|--|
| **One token** | `AUTOPLAY_API_TOKEN` must be set and **identical on every node**. Left unset, each node mints its own from its data directory, and a client holding one node's token is refused by the rest: "submit to any node" stops being true and every redirect breaks with it. The single easiest thing to get wrong. |
| **One agents mount** | Point every node at the same `orgs` directory. The agents themselves also [replicate over Redis](#agents-replicate-themselves), so this isn't required for the roster — but it's what makes run history and screenshots **one fleet-wide record** instead of a pile you merge by hand. Nodes report a digest of their roster and the Cluster page flags a mismatch, because a drifted mount is otherwise invisible. |
| **Node-local browser profiles** | `/data/browser-profiles` must be a **per-node** volume. A Chrome profile is bound to the machine that created it and Chrome holds a `SingletonLock` per profile directory, so two nodes sharing one fight over it — and a copied profile comes back signed out. This is why an agent signed in by hand is effectively pinned to that node: give it [credentials](server-mode.md#signing-in-without-a-person) so it signs itself in anywhere, or [pin it](#per-agent-cluster-settings) on purpose. |
| **A unique, stable node id** | Set `AUTOPLAY_NODE_ID`. A container id is unique and useless: it changes on recreate, so the fleet collects a dead entry per restart and anything pinned to it points at a node that never comes back. |
| **A reachable node URL** | `AUTOPLAY_NODE_URL` is how **other clients** reach this node. Behind a single Kubernetes Service VIP, pods need a headless service, pod DNS or a node port — a VIP is not an address for *one* node. |
| **One namespace** | `AUTOPLAY_CLUSTER_NS` is the only thing separating two deployments that share a Redis. A rehearsal pointed at production's Redis without its own namespace **reads production's queue and runs production's tasks**. |

## The Cluster page

Two things appear in the app the moment it's talking to a cluster — either because this computer is
a node, or because the server the window is [pointed at](user-guide.md#pointing-it-at-a-server) is
one.

**A badge in the title bar**, next to the server picker, and both states are shown deliberately:
*standalone* says a task started here runs here and nowhere else; *clustered* says it goes to a
shared queue and may run on a different machine from the one named beside it. Nothing else in the
window would tell you. Clustered, the badge is a button to the page.

**A Cluster item on the sidebar**, next to Scheduled — a dashboard rather than a settings page,
because the numbers on it move on their own and it's what you watch during a rollout or an
incident. Every figure comes from **one request to one node**: every node answers identically, so
the page never fans out, and a node being unreachable is a fact about that node rather than a hole
in the view.

What's on it:

| Section | What it tells you |
|---------|-------------------|
| **Worth fixing** | The misconfigurations that don't raise anything — see [below](#the-warnings-and-what-each-one-means). Absent when there are none. |
| **Summary strip** | Nodes taking work, draining, offline · free slots out of total · running · waiting. |
| **Nodes** | One card each: **Ready / Draining / Offline**, its app version (so a half-finished rollout is visible), when its heartbeat last landed, one chip per agent with that agent's free slots — or *cannot run here* — the ids of what it's running, and its client-reachable URL. Plus the **Drain** / **Take work again** button. |
| **Waiting for** | Per agent: how many tasks are queued, how many are pinned to a specific node, and how long the oldest has waited. That last number is the one that says *add capacity*. |
| **Singleton roles** | Which node currently holds `scheduler`, `reaper` and `history-sweep`. Each runs on exactly one node at a time. |
| **Given up on** | Tasks that exhausted their retries and are waiting for a person. They aren't queued any more and no node will pick them up. |

Heartbeats land every 5 seconds and a node is called **offline** after 15 — three missed beats.
Dead, restarting and partitioned from Redis are deliberately **not** distinguished, because the
handling is identical: stop expecting work from it, and let the reaper decide what happens to what
it was holding.

### The warnings, and what each one means

This list is the answer to the risk the whole feature carries: every serious way to misconfigure a
cluster leaves it looking healthy. None of these raise an error anywhere else.

- **"Nodes disagree about the agent roster."** Two nodes' agent directories differ, so the same
  task behaves differently depending on where it lands. Check that every node mounts the same
  `orgs` directory — and the whole of it, not a subdirectory.
- **"*node* advertises no reachable URL."** Its runs can't be watched, driven or taken over from
  another node. Set `AUTOPLAY_NODE_URL`.
- **"*agent* has no stored credentials and is not pinned to a node."** Its login lives in one
  node's Chrome profile, so runs that land elsewhere start at a login page. Add credentials, or
  pin it.
- **"*N* task(s) are queued for *agent*, which no online node can run."** They will wait
  indefinitely. This is the difference between *busy*, which always resolves, and *structurally
  stuck*, which never does.

## Taking a node out of service (draining)

**Drain** on a node's card — or `POST /v1/drain` — and it stops reading the queue immediately.

**Nothing is transferred, because nothing is held.** A node only ever takes a task it can start at
once, so everything still waiting is in Redis where a node with room will read it. Runs already
going keep going until they finish. It's reversible: **Take work again** puts it back.

Before it happens, the node is asked what draining it would mean — and the answer comes from that
node, because it knows two things the fleet view doesn't: which runs it is actually holding, and
which of its agents no other online node can run.

| The dialog says | What to do about it |
|-----------------|---------------------|
| **"*N* runs will finish first"**, listed by agent and goal | Nothing. That's the wait, not a problem. |
| **"Another node can run *X*, but every one of them is full"** | Nothing, unless the queue matters — new tasks for those agents will wait rather than start. |
| **"*X* can only run here"** | The one worth stopping for. Tasks for those agents will sit in Redis until this node comes back — indefinitely, and silently. Usually an agent pinned here, or one whose sign-in exists only on this machine. A tickbox offers to **cancel** the ones already waiting instead of leaving them stranded; they're marked *owner-lost* for a person to look at. |

**A drain never refuses.** The moment a node most needs taking out of service is exactly the moment
the rest of the fleet is least able to absorb its work, and a button that refused then would make
rolling deployments impossible on the days they matter. You're told the consequences; the drain
proceeds.

A rolling restart is then just: drain, wait for its runs to finish, restart it, **Take work
again**, next node.

> **From the app you can drain a peer**, not only the node the window is connected to — the request
> is carried to it over Redis. An older server that doesn't understand that ignores the instruction
> and would drain *itself*, so against one of those the page offers the button on the connected
> node only, and says why.

## When a node dies

**Tasks that hadn't started need nothing.** They were never inside a node. Whichever node next has
a free slot reads them, and no operator does anything.

**Tasks that were running cannot be resumed.** Their state is a live browser on a machine that's
gone: a half-filled form, a page mid-navigation, cookies in a profile nobody else can read. There
is no checkpoint, so the only available meaning of *recover* is **run the whole task again** — and
for an agent that had already created a work order, that creates a second one.

So the choice belongs to the agent, and the default is the conservative one:

- **`fail`** *(default)* — the task is marked **owner-lost** and left for a person. Correct for
  anything that writes: creating a record, submitting a form, sending a message.
- **`restart`** — the task goes back on the queue and runs again from step 0. Correct only for work
  that is idempotent by nature: reading, searching, reporting.

→ [Per-agent cluster settings](#per-agent-cluster-settings)

**One honest edge, stated because it's the sharpest in the design.** A node that is *partitioned*
from Redis — still alive, still driving its browser, unable to renew its claim — can't be told
apart from one that crashed. For a `fail` agent that costs nothing. For a `restart` agent it means
the task can briefly run in **two** places, until the partitioned node reads the claim again and
stops itself. That's the price of `restart`, and the reason it's opt-in per agent rather than a
cluster-wide default.

**A task is retried at most three times.** After that it's marked owner-lost and moved to the
dead-letter list — the **Given up on** figure. Nothing picks those up again; they're waiting for a
person to decide.

The reaper that does all this runs on exactly one node at a time, and looks every 15 seconds.

## Agents replicate themselves

**Publish an agent to any node and the fleet has it. Edit it on any node and the fleet follows.**
On by default (`AUTOPLAY_CLUSTER_AGENT_SYNC=on`), and it's what makes a cluster manageable from
wherever you happen to be connected.

A write publishes the same portable bundle an [upload](server-mode.md#bringing-your-agents)
carries — the config, its MCP server definitions, its own skills and its memory — and every other
node applies it. A node **joining with an empty disk pulls the whole roster at boot**, which is
worth stating plainly: a fresh container with no agents directory at all comes up serving the
fleet's agents.

```
[agents] organization "simpleclaw" has no agents yet — waiting for an upload
[cluster] applied "work-order-bot" (f87bed1877e249f5) from node-1
[cluster] agent sync: 1 change(s) applied at boot
```

| | |
|--|--|
| **Secrets never travel** | The published bundle is stripped of API keys, phone credentials and voiceprints, and a node applying one puts **its own** stored values back for every blanked field. A node that never had the key uses what its environment injects — the arrangement a deployment should be using anyway. |
| **The model endpoint stays per node** | An agent is published as it is **on disk**, not as this node reads it, so one container's injected `baseUrl`/`model` is never spread across the fleet. |
| **A shared mount costs nothing** | A node that already holds identical content records the revision and writes nothing, so the recommended arrangement doesn't turn one upload into N rewrites of the same file. |
| **Applying is not publishing** | A node publishes only what a person changed **on it**. That, plus a per-node record of the last revision applied, is what stops two nodes trading an agent back and forth. |
| **Deletes travel too** | Deleting an agent leaves a tombstone, so a node that was down when it happened removes its copy when it comes back instead of resurrecting it. |
| **Run-time memory does not** | The memory an agent writes to *itself* during a run is deliberately not published: it would put the fleet in a write loop on the busiest path there is, and two nodes running the same agent would overwrite each other. Editing memory in the UI **does** publish — that's an edit, not a side effect. |

**What is never replicated:** run history and recorded demonstrations (large, and already shared
through the history storage), and the **browser profile** — bound to the machine that created it and
written by a live browser, so copying one produces a silently signed-out slot. An agent that must
sign in on a node it has never run on needs
[credentials](server-mode.md#signing-in-without-a-person).

**The other two modes:**

- `push` does everything `on` does **and seeds at boot** — publishing agents the cluster has never
  heard of. That's what you want the first time a fleet adopts this and one node already holds
  everything. It's opt-in because a desktop holding personal agents, pointed at a production
  namespace, would otherwise push all of them into it.
- `off` disables replication entirely, for a deployment whose shared mount already *is* the
  replication.

## Per-agent cluster settings

Two fields on an agent, in its `agent.json` (or over the
[Agent API](server-mode.md#editing-a-deployed-agent-from-the-desktop-app)). Neither has a control
in the editor yet — they're deployment decisions, and most agents want neither.

```jsonc
{
  "cluster": {
    // Run this agent ONLY on this node. For an agent whose sign-in lives in one machine's
    // Chrome profile. An agent with stored credentials needs no pin — that's the arrangement
    // a cluster wants.
    "pinNode": "node-1",

    // What happens to a RUNNING task when the node holding it dies.
    //   "fail"    (default) — mark it owner-lost, leave it for a person
    //   "restart"           — run it again from step 0; idempotent work only
    "interruptPolicy": "fail"
  }
}
```

A pinned agent's tasks go to a stream only that node reads, so they're counted separately on the
Cluster page — the **Pinned** column — and they wait for that node rather than spreading.

## What a client has to know

Almost nothing. **Submit to whichever node you can reach**; there's no capacity to compare and no
executor to choose. The
[dispatcher you'd write for independent executors](agent-api.md#choosing-between-several-executors)
isn't wrong here, it's unnecessary: a node reads the queue only while it has a slot, so the work
spreads itself.

| What you call | On a cluster |
|---|---|
| `POST /v1/runs` | Queued for the fleet, answering immediately with a `run_…` every node knows. `422` when **no** node can run that agent (not just this one); `429` with `retryAfterSeconds` once **100** tasks are already waiting for it. |
| `GET /v1/runs/:id` | Answered by any node. Two fields are added: `executor` (the node running it) and `executorUrl` (where to reach that node). |
| `GET /v1/runs/:id/events` | Served by whichever node you asked — the owner republishes its events, so the stream is identical wherever you attach. |
| `?wait=` · `GET /v1/runs/:id/wait` | Unchanged, from any node. |
| `/answer` `/stop` `/conclude` `/pause` | Work from any node. The request is carried to the owner and you get **its** verdict — no redirect. |
| `GET /v1/runs` · `/history` · `/history/:step/screenshot` | The whole fleet's history, because the nodes share one storage mount. No merging by hand. |
| `DELETE /v1/runs/:id` | Unchanged, including the `409` while a run is still going — wherever it's going. |
| `GET /v1/status?byAgent=1` | Still **this node's** own capacity. In a cluster that's a health reading, not a routing input. |
| `GET /v1/cluster` | **New.** The whole fleet: nodes and their free slots, queue depth per agent, who holds each singleton role, the dead-letter count, and a `warnings` list. The read that replaces `/v1/status?byAgent=1` for anything watching the deployment. |
| `GET` `POST` `DELETE /v1/drain` | **New.** `GET` is the pre-flight — what draining this node would mean. `POST` drains, `DELETE` undoes it. `?node=<id>` acts on **another** node, forwarded over Redis. |
| `POST /v1/drain/cancel-stranded` | **New.** Give up on tasks queued for agents only this node can run — the tickbox in the drain dialog, as a route. Body: `{"agentIds":["…"]}`. |

```jsonc
// GET /v1/cluster — the same answer from every node
{
  "self": "node-1", "namespace": "prod-eu",
  "nodes": [
    { "nodeId": "node-1", "state": "ready", "version": "0.16.0",
      "url": "https://exec-1.example.com", "seenAt": 1756200000000,
      "agents": [{ "agentId": "work-order-bot", "taskCount": 3, "running": 2, "queued": 1,
                   "slots": 4, "busy": 2, "free": 2, "supported": true }],
      "activeRunIds": ["run_a1b2"], "rosterDigest": "f87bed18" },
    { "nodeId": "node-2", "state": "draining", "…": "…" }
  ],
  "queues":  [{ "agentId": "work-order-bot", "depth": 3, "pinned": 0, "oldestWaitMs": 41000 }],
  "dlqCount": 0,
  "leaders": [{ "role": "reaper", "nodeId": "node-1" },
              { "role": "scheduler", "nodeId": "node-1" },
              { "role": "history-sweep", "nodeId": "node-2" }],
  "warnings": []
}
```

A plain load balancer in front of the fleet is fine — every node answers the same. Keep the
per-node addresses reachable anyway, for the redirect below.

### The one thing a client must handle differently

`/live`, `/input` and `/takeover` drive a browser on a **specific machine**, so they can't be
answered anywhere else. Asked of a node that doesn't own the run, they answer **`307`** to the
owner — and **`Authorization` does not survive a cross-origin redirect** (the Fetch standard strips
it), so a client that follows one blindly lands on a `401` from a node that is working perfectly.
Two correct shapes:

```sh
# Read where it is, then go there yourself.
EXEC=$(curl -s "$ANY_NODE/v1/runs/$RUN_ID" -H "Authorization: Bearer $TOKEN" | jq -r .executorUrl)
curl -N "$EXEC/v1/runs/$RUN_ID/live" -H "Authorization: Bearer $TOKEN"
```

```js
// Or follow the redirect manually, re-attaching the credential.
const res = await fetch(url, { headers, redirect: 'manual' })
const target = res.status === 307 ? res.headers.get('location') : url
const live = await fetch(target, { headers })   // the header is added again, deliberately
```

A node whose `AUTOPLAY_NODE_URL` is unset answers **`503` with an explanation** instead of
redirecting somewhere nobody can reach.

### MCP

The tool surface is unchanged, and an MCP client still connects to one node for the length of a
conversation. Two things changed underneath:

- **A conversation can follow a run it didn't start on this node.** `check_web_task`,
  `await_web_task`, `answer_web_task`, `finish_web_task` and `stop_web_task` resolve through the
  shared ledger and reach the owner over Redis — which is why those verbs are commands rather than
  redirects: an MCP client can't follow a redirect at all.
- **`list_web_agents` reports the FLEET's capacity**, not the node answering. A model connected to
  a full node would otherwise be told to wait, or to pick a different agent, while idle nodes sat
  beside it.

## Android devices in a cluster

A [phone-scope agent](android-devices.md) needs a **device**, and being a node doesn't imply one
the way it implies a network. So a node with no device attached and no `AUTOPLAY_ADB_HOST`
advertises its phone agents as **cannot run here** — visible as that chip on the node's card — and
phone tasks are only read by nodes that actually have a device. Without that, pull-based dispatch
would hand a phone task to whichever node had a slot, device or not.

Two consequences worth planning for:

- **The device is per node, and it isn't exclusive.** Two nodes pointed at the *same*
  `AUTOPLAY_ADB_HOST` will both take phone tasks for it, and nothing on the device stops two runs
  driving one screen. Give each node its own device, or pin the agent to one node.
- **Phone runs are serialised** on a node — there's no per-agent parallelism for this scope — so a
  phone agent's throughput scales with nodes-and-devices, not with slots.

The [device console](android-devices.md#setting-the-device-up-by-hand-the-device-console) is per
node too: it opens the device *that node* reaches.

## Limits worth knowing before you deploy

- **Redis without persistence loses queued work.** Everything else survives a Redis restart; tasks
  that hadn't started don't. Turn on AOF.
- **100 tasks per agent is the ceiling.** Past that, submissions get `429` with
  `retryAfterSeconds` — a caller looping on failure is better told so than allowed to build a
  backlog nobody will work through.
- **`restart` can double-run across a partition.** See [When a node dies](#when-a-node-dies).
- **A hand-signed-in agent is pinned in practice.** Chrome profiles don't move between machines.
  Credentials, or `pinNode`.
- **Dead letters wait for a person.** There's no requeue button; they're a decision, not a retry.
- **A desktop node doesn't run the history sweep.** In a desktop-only fleet that role reads
  *nobody*, which is expected. In a deployed fleet it means nothing is sweeping — check a server
  node is up.
- **Roster drift is reported, not repaired.** The page tells you the mounts differ; fixing the
  mount is yours.
- **One namespace per deployment, and nothing enforces it.** Two deployments on one Redis with the
  same namespace are one cluster, whether you meant that or not.

## Troubleshooting

**`AUTOPLAY_NODE_ID is set, but no Redis endpoint is`** — the half-configured refusal. Add the
Redis endpoint, or remove the cluster-only variables to run standalone on purpose.

**`AUTOPLAY_REDIS_URL and AUTOPLAY_REDIS_HOST are both set — pick one form`** — two connection
specifications. Keep the URL for self-hosted Redis, the separate variables for a managed endpoint.

**`401` from one node and not another** — the tokens differ. `AUTOPLAY_API_TOKEN` must be set and
identical on every node; unset, each mints its own.

**A `401` immediately after a redirect** — you followed a `307` and the `Authorization` header was
stripped. See
[the one thing a client must handle differently](#the-one-thing-a-client-must-handle-differently).

**`503` on `/live`, `/input` or `/takeover`** — the owning node advertises no URL. Set
`AUTOPLAY_NODE_URL` on it.

**A bare `MOVED 3687 10.0.0.4:8501`** — the endpoint is a sharded Redis cluster and detection got
it wrong. Set `AUTOPLAY_REDIS_CLUSTER=1`.

**An auth failure against a Redis that is plainly reachable** — a managed access key pasted into a
URL. Use `AUTOPLAY_REDIS_HOST` + `AUTOPLAY_REDIS_PASSWORD` instead.

**Tasks queued and nothing running them** — read **Worth fixing**. Either no online node supports
that agent, or the ones that do are full; the two look identical in a queue depth, and only the
first never resolves.

**A node reappears under a new name after every restart** — `AUTOPLAY_NODE_ID` is unset and
defaulting to a container id. Set it.

**A rehearsal ran production's tasks** — it had no `AUTOPLAY_CLUSTER_NS` of its own. That's the only
thing separating two deployments on one Redis.

**The fleet says a node is offline but it's clearly up** — three heartbeats missed, so either its
process is stuck or it can't reach Redis. `GET /v1/ready` still answers on a node that's healthy but
partitioned, which is how you tell those apart.

---

[← Docs home](index.html) · [Server mode](server-mode.md) · [Agent API](agent-api.md) · [Troubleshooting](troubleshooting.md)
