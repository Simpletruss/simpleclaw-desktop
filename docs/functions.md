# SimpleClaw — Custom functions

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Web APIs](web-apis.md) · [Agent API](agent-api.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md) · [Release notes](release-notes.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/functions.html)
> labels each page with its release and can switch between versions.

**Functions arrived in SimpleClaw 0.5.** Nothing on this page works on 0.2–0.4.

An **function** gives an agent one function of your own — a way to *look something up* or
*do something* directly, instead of clicking through a user interface for it. You write two
small files, drop the folder in, and it's live on the next run. No rebuild, no framework, no
lifecycle to learn.

---

## Table of contents

1. [What a function is](#what-a-function-is)
2. [Quickstart](#quickstart)
3. [`owner` — whose tool it is](#owner--whose-tool-it-is)
4. [Telling the agent *when* to call it](#telling-the-agent-when-to-call-it)
5. [`tool.json` reference](#tooljson-reference)
6. [The handler](#the-handler)
7. [`ctx` reference](#ctx-reference)
8. [Returning a result](#returning-a-result)
9. [Where functions live](#where-functions-live)
10. [Worked examples](#worked-examples)
11. [Testing and troubleshooting](#testing-and-troubleshooting)
12. [Safety](#safety)

---

## What a function is

One function is one **tool** the AI model can call. It's a folder with two files:

```
my_extension/
  tool.json    what the model is shown — a standard OpenAI function schema, plus `owner`
  index.mjs    export async function run(ctx, args) → the tool result
```

The model decides *when* to call it and with what arguments; SimpleClaw runs your
`index.mjs` and feeds whatever you return back to the model as the tool result. That's the
whole contract.

Two things make it worth reaching for:

- **It skips the UI.** Reading a customer record through an API is one call that can't
  mis-click. Every screenshot-and-click alternative is slower and can go wrong.
- **It brings in facts the screen doesn't have.** Golden data, a price list, the expected
  end state for a test case — the model can't see any of that, and guessing is worse than
  asking.

Functions belong to **one agent**, stored beside its skills and memory — a scheduling
agent and a billing agent need different functions, and neither should be offered the
other's. Every enabled one is offered on that agent's every run; there's no separate opt-in
step.

## Quickstart

1. Open the agent, then the **Functions** page under whoever should be able to call the tool
   — **Planner → Functions** for the agent itself, **Observer → Functions** or **Chronos →
   Functions** for a supervisor.
2. Type a tool name (e.g. `lookup_customer`) and press **Add function**.
3. The folder opens. It already contains a working `tool.json` and `index.mjs` — the tool is
   callable right now; it just reports that it isn't implemented yet.
4. Edit `tool.json`: write a `description` that says **what it does and when to call it**,
   and describe the arguments you want.
5. Edit `index.mjs`: replace the placeholder return with the real work.
6. Start a run. Saved edits apply on the **next run** — no restart, no rebuild.

Your first real handler usually looks like this:

```js
export async function run(ctx, args) {
  const res = await fetch(`https://api.example.com/orders/${args.id}`, {
    headers: { Authorization: `Bearer ${process.env.MY_API_TOKEN}` },
    signal: ctx.signal, // so a stopped run cancels the request
  })
  if (!res.ok) return `Lookup failed: HTTP ${res.status}`
  const order = await res.json()
  return `Order ${order.id}: ${order.status}, due ${order.dueDate}`
}
```

## `owner` — whose tool it is

`owner` is the one field in `tool.json` that isn't standard OpenAI. It decides **which
model** is offered the tool — and therefore **which tab** you manage it on:

| `owner` | Who can call it | Managed in | Reach for it when |
|---------|-----------------|------------|-------------------|
| `planner` | **The agent itself**, mid-run, alongside its click/type tools. | Planner → Functions | The agent needs to read or do something directly rather than through a UI: look up a record, fetch a price, file a ticket. |
| `observer` | **The Observer** — the supervisor that patrols a run, checks a ticked item and a finish, and (from 0.12) is asked what to do when the run is [stuck](user-guide.md#when-a-run-gets-stuck-the-observer) — while it decides what went wrong. | Observer → Functions | The supervisor needs a fact it can't read off the screen in order to judge: what this task is *supposed* to produce, whether a record really changed in the backing system. |
| `chronos` | **Chronos** — the pacing supervisor, on its own wall-clock timer — while it decides whether the run is behind. | Chronos → Functions | The clock alone doesn't say "late": how long this kind of job usually takes, whether a queue it depends on is backed up. |

Anything else — or a missing `owner` — is treated as `planner`.

Both supervisors must be **enabled** on their tab for their tools ever to be called. When one
has functions it may call a tool, read the result, and only then answer — up to three rounds
per check, so a model that would rather keep querying still has to decide.

## Telling the agent *when* to call it

There's no setting for this — you write it in prose, in any of three places:

1. **The tool's own `description`** — start here. The model reads it every turn, so this is
   the highest-leverage text you'll write. Say what the tool does, **when to call it**, and
   what to do when it answers "not found".
2. **The agent's persona** — *Agent editor → General*. Good for a standing preference:
   *"Prefer `lookup_customer` over opening the CRM whenever you only need to read details."*
3. **A skill** the agent has enabled — best for a longer rule with steps or exceptions.

A description that says only what the tool *is* leaves the model guessing. Compare:

> ❌ `"Looks up a customer."`
>
> ✅ `"Look up a customer's contact details by id or exact name. Call this INSTEAD of
> navigating the CRM UI whenever you only need to READ details. It is read-only — do not
> call it to change anything. If it answers 'no customer matches', the value is wrong; do
> not retry it."`

## `tool.json` reference

The standard OpenAI function shape, plus our two keys:

```json
{
  "type": "function",
  "owner": "planner",
  "enabled": true,
  "function": {
    "name": "lookup_customer",
    "description": "What it does AND when to call it.",
    "parameters": {
      "type": "object",
      "properties": {
        "id": { "type": "string", "description": "The customer id, e.g. C-1001." }
      },
      "required": ["id"]
    }
  }
}
```

| Key | Required | Meaning |
|-----|----------|---------|
| `function.name` | no | The tool name the model calls. Defaults to the folder name. Letters, digits, `_`, `-`, `.`. |
| `function.description` | no (but write one) | What the tool does and when to call it. |
| `function.parameters` | no | JSON Schema for the arguments. Omit for a no-argument tool. |
| `owner` | no | `planner` (default), `observer`, or `chronos`. |
| `enabled` | no | `false` keeps the folder but stops offering the tool. Toggled by the checkbox on its tab. |
| `file` | no | Handler filename. Defaults to `index.mjs`. |
| `type` | no | Present for portability with other tool-calling systems; ignored. |

A flattened form — `{ "name": …, "description": …, "parameters": … }` with no `function`
wrapper — is also accepted.

Two folders declaring the **same tool name** is a conflict: one is skipped, with a warning
on the **Functions** page.

## The handler

`index.mjs` is plain ESM running in the app's Node process. Export `run(ctx, args)` — or a
default function:

```js
export async function run(ctx, args) { … }
// or
export default async function (ctx, args) { … }
```

You can `import` anything Node offers (`node:fs`, `node:https`, `fetch`, …) and read files
next to your handler:

```js
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(readFileSync(join(HERE, 'data.json'), 'utf8'))
```

Read such files **per call** rather than once at import, so editing the data takes effect
immediately.

## `ctx` reference

| Field | What it is |
|-------|-----------|
| `ctx.agent` | The running agent's full config. |
| `ctx.agentId` | The agent's id. |
| `ctx.org` | The organization this run belongs to. |
| `ctx.owner` | `'planner'`, `'observer'` or `'chronos'` — which tool list this call came from. |
| `ctx.goal` | The run's goal (`''` outside a run). |
| `ctx.step` | The current step number (`0` when unknown). |
| `ctx.screenshot` | The current screen as a data URL, or `null` when the caller has no frame. |
| `ctx.signal` | An `AbortSignal` that fires when the run stops. Pass it to your `fetch`. |
| `ctx.callTool(name, args)` | Call an **MCP** tool the agent has attached, by name; resolves with its text result. Rejects when the agent has no MCP runtime — and refuses to call another function. |
| `ctx.log(message)` | Write one line to the app log, prefixed with your tool's name. |

`args` is exactly what the model passed, matching your `parameters` schema. Validate it —
the model can get it wrong.

## Returning a result

Whatever you return becomes the tool result the model reads next:

| You return | The model sees |
|------------|----------------|
| a string | it, verbatim |
| an object / array | its JSON |
| `null` / nothing | `ok` |
| a thrown error | `ERROR: <message>` |

Three habits that pay off:

- **Keep it short and labelled.** `Status: Closed` reads far more reliably than a nested
  JSON blob. Return what the task needs and no more — every extra field is context the model
  has to wade through.
- **A miss is an answer, not a failure.** Return `No customer matches id "X" — check the
  value on screen` rather than throwing. That's a sentence the model can act on; an error
  invites it to retry the same wrong input.
- **Throwing is safe.** It comes back as `ERROR: …` text and is never a failed run.
  Unparseable arguments are reported the same way, without your handler running.

## Where functions live

One folder per tool, in the **agent's own** data folder — beside that agent's skills,
memory and run history:

```
<userData>/orgs/<org>/<agentId>/functions/<folder>/
```

| OS | `<userData>` |
|----|--------------|
| Windows | `%APPDATA%\SimpleClaw` |
| macOS | `~/Library/Application Support/SimpleClaw` |
| Linux | `~/.config/SimpleClaw` |

On a stock install `<org>` is `default`. You normally don't navigate here by hand — the
folder button on any **Functions** page opens the exact folder for a tool (or the agent's
whole `functions/` dir).

Sharing one is a matter of zipping the folder; installing it is unzipping it into another
agent's `functions/` dir. There's no packaging format and nothing to register. Giving a
second agent the same tool means copying the folder — deliberately, so one agent's functions
never leak into another's.

## Worked examples

The SimpleClaw repository ships three complete, runnable examples — one per owner — under
[`examples/functions/`](https://github.com/Simpletruss/simpleclaw-desktop). Copy a folder
into an agent's `functions/` dir and replace its data file with a call to your real system.

Each arrives with `"enabled": false`: it appears in the list but is offered to no model until
you tick its box. Read the handler, point it at your own data, *then* enable it.

**`lookup_customer` (owner: `planner`)** — the agent looks a customer up instead of
navigating the CRM. Shows an argument schema, reading a data file beside the handler, short
labelled output, and answering a miss as an answer:

```js
export async function run(ctx, args) {
  const id = String(args.id ?? '').trim()
  if (!id) return 'Give either an id or a name.'
  ctx.log(`looking up ${id} (step ${ctx.step})`)

  const found = readCustomers().find((c) => c.id.toLowerCase() === id.toLowerCase())
  if (!found) return `No customer matches id "${id}". Check the value on screen, or search the CRM UI instead.`

  return [`Customer ${found.id} — ${found.name}`, `Status: ${found.status}`, `Phone: ${found.phone}`].join('\n')
}
```

**`expected_result` (owner: `observer`)** — the Observer asks what a task is *supposed* to
produce, so a claimed success can be checked against the spec instead of vibes:

```js
export async function run(ctx, args) {
  // The model paraphrases; fall back to the run's real goal.
  const query = key(args.goal) || key(ctx.goal)
  const hit = readExpectations().find((e) => key(e.goal) === query)
  if (!hit) return `No expectation recorded for "${args.goal || ctx.goal}". Judge from the screen as usual.`

  return `Recorded expectation for: ${hit.goal}\nThe screen should show: ${hit.expected}`
}
```

**`typical_duration` (owner: `chronos`)** — Chronos asks how long this kind of task normally
takes, so "4 minutes in" reads as early or late instead of being guessed at. Note that it
returns the *comparison*, not just a number — don't make a small model do arithmetic:

```js
export async function run(ctx, args) {
  const hit = readTimings().find((t) => key(t.goal) === (key(args.goal) || key(ctx.goal)))
  if (!hit) return `No timing recorded for "${args.goal || ctx.goal}". Judge from the goal and the clock as usual.`

  return `Typical: ${hit.typicalMinutes} min (usually ${hit.typicalSteps} steps).\nTreat it as behind past ${hit.lateAfterMinutes} min.`
}
```

## Testing and troubleshooting

The **Functions** page on the owner's tab is where problems surface:

| What you see | What it means |
|--------------|---------------|
| The tool isn't listed | No valid `tool.json` in the folder (or its JSON is malformed). Check the **Folders that could not be read** box below the list. |
| **no handler** badge | `tool.json` names a handler file that isn't there. |
| `must export run(ctx, args)` warning | The handler loaded but exports no callable `run` / default function. |
| `duplicate tool name` warning | Two folders declare the same name; one was skipped. |
| Listed and enabled, but never called | The model didn't think it applied. Sharpen the `description`, or state the rule in the agent's persona. For a supervisor's tool, check that supervisor is enabled on the agent. |
| Not on the tab you expected | Its `owner` sends it elsewhere. A tool with no valid `owner` shows up under Planner. |

Calls appear in the run's activity trace like any other tool call, and anything you
`ctx.log()` goes to the app log.

## Safety

**A function is code you are choosing to run**, in the app's own process, with your user
account's privileges — the same trust level as a script you'd run yourself. It can read and
write files, reach the network, and see the run's goal, the current screenshot, and the
agent's configuration (including credentials on that config).

- **Only install functions you wrote or trust**, and read the handler before enabling one
  someone sent you. There is no sandbox.
- **Keep secrets out of the folder.** Read tokens from the environment or an OS keychain
  rather than hardcoding them in `index.mjs` — the folder is easy to copy or zip, and it
  travels with the agent.
- **Prefer read-only tools.** A tool that changes data will be called by a model that
  sometimes misreads a screen. If it must write, make it narrow and validate its arguments.
- **Don't let a function weaken a boundary.** If an agent is scoped to one window or one
  site, a tool that reaches everywhere quietly removes that limit.
- Slow tools cost real time: the Planner waits for the result, and an Observer call has a
  three-round budget. Keep them quick, and pass `ctx.signal` so a stopped run cancels
  in-flight work.

See also [Safety & privacy](safety-and-privacy.md).
