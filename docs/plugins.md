# SimpleClaw — Plugin developer guide

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/plugins.html)
> labels each page with its release and can switch between versions.

**Plugins arrived in SimpleClaw 0.2** — nothing on this page works on 0.1.x. This is the
complete reference for writing, installing, and distributing them. It's aimed at
developers — if you just want to *use* a plugin someone gave you, skip to
[Install a plugin](#install-a-plugin).

---

## Table of contents

1. [What a plugin is](#what-a-plugin-is)
2. [Concepts](#concepts)
3. [The management surfaces](#the-management-surfaces)
4. [Where plugins live](#where-plugins-live)
5. [Anatomy of a plugin](#anatomy-of-a-plugin)
6. [Quickstart — your first plugin](#quickstart--your-first-plugin)
7. [Lifecycle phases](#lifecycle-phases)
8. [Manifest reference](#manifest-reference)
9. [Two ways to write one](#two-ways-to-write-one)
10. [The `ctx` API](#the-ctx-api)
11. [The model a plugin runs on](#the-model-a-plugin-runs-on)
12. [Native tools (tool-calling)](#native-tools-tool-calling)
13. [Export shapes](#export-shapes)
14. [Settings panels (optional config UI)](#settings-panels-optional-config-ui)
15. [Built-in plugins](#built-in-plugins)
16. [Worked examples](#worked-examples)
17. [Install a plugin](#install-a-plugin)
18. [Safety & performance](#safety--performance)

---

## What a plugin is

A **plugin** extends SimpleClaw **without touching or rebuilding the app**. You drop a
folder in, enable it, and it applies on the next run.

A plugin contributes a **sub-agent**: a small unit of logic that hooks into the agent's
turn lifecycle at one of a few **phases**. The most common use is a QA-style **completion
check** — a rule that inspects a finished run and can send the agent back to keep working
if the task isn't really done.

The core agent — the screenshot → decide → act loop and its safety guards — stays fixed.
Plugins hang off it; they never replace it. (The shipped Judge / Observer helpers are
themselves sub-agents built on this same framework.)

## Concepts

- **Plugin** — an installed folder containing a `manifest.yml` and, for code plugins, an
  entry script. Installed once per organization, shared by every agent in it.
- **Sub-agent** — the unit a plugin exposes: logic bound to one lifecycle **phase**.
- **Phase** — *when* a sub-agent runs in a turn: `pre-turn`, `finish-gate`,
  `post-step`, or `post-turn`. See [Lifecycle phases](#lifecycle-phases).
- **Pipeline** — the ordered set of sub-agents an *agent* runs: the always-present
  built-ins plus the sub-agent plugins that agent opted into.
- **`ctx`** — the read-mostly view of the live run each sub-agent receives, plus the
  explicit channels it writes through. See [The `ctx` API](#the-ctx-api).

**Installing a plugin does nothing on its own.** Installation makes it *available*
org-wide; a run only uses it once an agent **opts in** by adding it to that agent's
pipeline. These are two deliberate steps.

## The management surfaces

| Surface | Scope | What you do there |
|---------|-------|-------------------|
| **Settings → Plugins** | Organization-wide | Install from a folder, enable/disable, remove, open the plugin folder. Also shows a read-only overview of the built-ins. |
| **Agent editor → Sub-Agents** | Per agent | Add an installed plugin to *this* agent's pipeline and set its run order. The built-in Judge/Observer are always present here and configured in their own panels. |

Rule of thumb: **Settings installs; the agent opts in.** An installed plugin is inert for
a given agent until it's added on that agent's Sub-Agents tab.

## Where plugins live

Installed plugins live under the app's per-user data folder, one folder per plugin id:

```
<userData>/orgs/<org>/plugins/<id>/            # org-wide: every agent in the org
<userData>/orgs/<org>/<agentId>/plugins/<id>/   # one agent only (agent-level override)
```

`<userData>` is the standard Electron per-user data directory for the app:

| OS | `<userData>` |
|----|--------------|
| Windows | `%APPDATA%\SimpleClaw` |
| macOS | `~/Library/Application Support/SimpleClaw` |
| Linux | `~/.config/SimpleClaw` |

On a stock install `<org>` is `default`. Agent-level plugins **override or extend**
org-level ones of the same id, so you can pin a customization to a single agent.

> You normally don't navigate here by hand — use **Settings → Plugins → Open folder**.
> But knowing the layout helps when scripting installs or debugging.

## Anatomy of a plugin

A plugin is just a folder:

```
my-plugin/
├── manifest.yml        # required — declares id, phase, and config
├── index.mjs           # optional — your code, when the manifest names it in `entry`
├── instruction.md      # optional — a long prompt/rubric, when using a built-in type
├── tools.json          # optional — native tool schemas (code plugins); see Native tools
└── <tool>.mjs          # optional — one handler per tool declared in tools.json
```

- **`manifest.yml`** is the only required file. The minimum is `id` + `phase`.
- **`index.mjs`** holds your logic. Point `entry` at it to run arbitrary code.
- **`instruction.md`**, when present, is the source of truth for the plugin's `prompt`
  (a rubric is easier to write as prose than squeezed into YAML). It overrides an inline
  `prompt:` in the manifest.
- **`tools.json`** declares the plugin's native tools (standard OpenAI shape); each tool's
  handler is a sibling `<name>.mjs`. See [Native tools](#native-tools-tool-calling).

## Quickstart — your first plugin

Goal: veto a run's completion unless the final result mentions `Order #`. Two files.

**1. `manifest.yml`**

```yaml
id: order-check              # stable id; also the key it writes in ctx.results
name: Order Confirmation Check
phase: finish-gate           # run when the agent claims the task is done
enabled: true
order: 50                    # lower runs first within a phase
entry: index.mjs             # run our own code (below)
params:
  mustInclude: 'Order #'
```

**2. `index.mjs`**

```js
export function run(ctx) {
  const need = ctx.manifest.params?.mustInclude
  if (!need) return                                  // nothing to assert → pass

  const claim = String(ctx.finishClaim || '')        // the completion message being judged
  const passed = claim.includes(need)

  ctx.setResult({ mustInclude: need, passed })        // record on the shared blackboard
  ctx.emit({
    pluginId: ctx.manifest.id,
    kind: passed ? 'info' : 'veto',
    message: passed ? `Found "${need}"` : `"${need}" not present`
  })

  if (!passed) {
    ctx.vetoFinish(
      `Not done: the result must show "${need}". Go back, make it visible, then continue.`
    )
  }
}
```

**3. Install & enable**

1. **Settings → Plugins → Install from folder…**, pick the `order-check` folder.
2. Open the agent you want to guard → **Sub-Agents** → add **Order Confirmation Check**.
3. Run a task. When the agent declares it finished, your check runs; a veto sends it
   back to keep working. No rebuild — edit the files and the next run picks them up.

## Lifecycle phases

A sub-agent binds to **exactly one** phase, named by `phase:` in the manifest (a code
plugin may instead set it in its exported `meta.phase`; the manifest is the fallback).

| Phase | When it runs | Blocking? | Typical use |
|-------|--------------|-----------|-------------|
| `pre-turn` | After the screen is captured, before the model plans the next step. | Yes (awaited) | Inject context/advice before planning. |
| `finish-gate` | When the agent declares the task complete. | **Yes — can veto the finish** | End-of-run assertions ("is it *really* done?"). |
| `post-step` | After each step's action, before the next plan. | Yes (awaited) | Per-step assertions: verify the step, force a redo, or hard-stop. |
| `post-turn` | After the turn's action. | No (fire-and-forget) | Advisory supervisors; adds no latency. |

Notes that matter when you write one:

- **`finish-gate`** is where QA end-of-run checks live. `ctx.finishClaim` holds the
  completion message; `ctx.vetoFinish(reason)` rejects it and `reason` becomes corrective
  advice for the next turn (subject to the loop's reject budget).
- **`post-step`** is blocking and runs right after the action is recorded, so the *last*
  entry in `ctx.recentTurns` is the step you're judging. Use `injectAdvice` to force a
  redo or `requestStop` to hard-fail.
- **`post-turn`** is **not awaited** — its `injectAdvice` lands on a later turn, and it
  can't veto anything. Keep truly non-blocking work here.

> Time-based pacing isn't a plugin phase — it's handled by the built-in **Chronos** core
> supervisor (configured in the agent editor's Chronos tab), not by sub-agents.

## Manifest reference

| Field | Required | Meaning |
|-------|----------|---------|
| `id` | **yes** | Stable id. Also the key this plugin writes in `ctx.results[id]`, and the folder name when installed. |
| `phase` | **yes** | One of `pre-turn` \| `finish-gate` \| `post-step` \| `post-turn`. |
| `name` | no | Display name in the UI. Defaults to `id`. |
| `enabled` | no | Default `true`. `false` keeps the folder but skips the plugin. |
| `order` | no | Lower runs first within a phase. Default `100`. |
| `entry` | no | External `.mjs`/`.js` file (relative to the folder) exporting `run(ctx)` or a default sub-agent. **When present it wins over `type`.** |
| `type` | no | Built-in to bind when there's no `entry` (`judge` \| `observer`). |
| `prompt` | no | Prompt/rubric override (for built-in types). An `instruction.md` next to the manifest overrides this. |
| `model` | no | A sub-agent's *default* standalone endpoint: `{ provider, baseUrl, apiKey, model, temperature, maxTokens, reasoningEffort }`. This is a fallback — the per-agent **Model** setting overrides it. See [The model a plugin runs on](#the-model-a-plugin-runs-on). |
| `mcpServerIds` | no | Ids of MCP servers this plugin intends to call via `ctx.mcp`. Declared intent, not a sandbox — see [Calling tools](#calling-tools-mcp-and-built-in). |
| `skills` | no | Skill names to enable for this plugin. |
| `params` | no | Free-form; reaches the plugin as `ctx.manifest.params`. Fixed at author time — for *user-editable* config use `settings`. |
| `settings` | no | A settings-panel schema. Rendered as a per-agent config UI; values arrive as `ctx.settings`. See [Settings panels](#settings-panels-optional-config-ui). |

Native tools are **not** a manifest field — they live in a dedicated `tools.json` (with a
sibling `<name>.mjs` handler each). See [Native tools](#native-tools-tool-calling).

A malformed manifest (missing `id`, or an invalid/absent `phase`) is **skipped with a
warning**, never crashing a run.

## Two ways to write one

### 1. Declarative (no code) — reuse a built-in

Bind to a built-in by `type` and configure it. For a custom LLM completion check, use the
built-in `judge` with your own rubric and (optionally) model — no `entry`, no code:

```yaml
id: invoice-check
name: Invoice Submitted?
phase: finish-gate
enabled: true
type: judge                 # built-in LLM judge; no `entry`
prompt: |
  Decide whether the invoice was actually submitted. Answer "done" only if a
  confirmation number is visible on screen.
model:                      # optional — omit to judge with the agent's own model
  provider: openai-compatible
  baseUrl: http://localhost:1234/v1
  model: your-vision-model
```

### 2. Code (`.mjs`) — arbitrary logic

Point `entry` at a `.mjs`/`.js` that exports `run(ctx)` (or a default sub-agent object).
`run` may be `async`.

```yaml
id: qa-assertion
phase: finish-gate
enabled: true
entry: index.mjs
params: { mustInclude: 'Order #' }
```

```js
export function run(ctx) {
  const need = ctx.manifest.params?.mustInclude
  const ok = String(ctx.finishClaim || '').includes(need)
  ctx.setResult({ passed: ok })
  if (!ok) ctx.vetoFinish(`Must include "${need}" — keep working.`)
}
```

Entry scripts are loaded as ES modules (`.mjs`) in the app's main process (Node). Use
`import`/`export`, not `require`.

## The `ctx` API

Every sub-agent's `run(ctx)` receives one context object — a read-mostly **facade** over
the live run. You **read** the shared transport and **write** only through the explicit
channels below.

### Read (properties)

| Property | Type | Notes |
|----------|------|-------|
| `ctx.agent` | object | The running agent's full config. |
| `ctx.agentId` | string | The agent's id. |
| `ctx.goal` | string | The run's goal. |
| `ctx.turn` | number | Current step number (monotonic within the run). |
| `ctx.screenshot` | string \| null | Current screen as a `data:` URL, or `null` before the first capture. |
| `ctx.convo` | array | The model-facing conversation so far (read-only). |
| `ctx.todos` | array | The persistent task checklist (read-only). |
| `ctx.recentTurns` | array | Recent planner turns, oldest first. On `post-step`, the **last** entry is the step that just ran. |
| `ctx.results` | object | Prior plugins' outputs this run, keyed by plugin id — a shared blackboard. |
| `ctx.settings` | object | This plugin's resolved settings (schema defaults merged with the agent's overrides). |
| `ctx.model` | object | The model resolved for this sub-agent (see [The model a plugin runs on](#the-model-a-plugin-runs-on)): `{ endpoint, usingPlannerModel, maxTokens, temperature, chat() }`. Call `await ctx.model.chat(messages)` to run an LLM; pass `{ tools: ctx.tools }` for tool-calling. |
| `ctx.tools` | array | This plugin's native tools (loaded from its `tools.json`), as model-ready schemas. Pass to `ctx.model.chat(msgs, { tools: ctx.tools })` to let the model call them. See [Native tools](#native-tools-tool-calling). |
| `ctx.observe(opts?)` | method | Convenience: the host assembles the standard prompt (your rubric + goal + recent steps + current screenshot), runs the model with `ctx.tools`, dispatches any calls, and returns the final text. A one-line wrapper over `ctx.model.chat(msgs, { tools })`. |
| `ctx.memory` | object | The agent's memory (distilled lessons): `{ read(), lessons(), has(text), record(lesson) }`. `record` is `async` and dedupes (exact + semantic) + caps in the core. See [Memory & learning](#memory--learning). |
| `ctx.humanNotes` | string[] | Instructions the **human** injected during *this* run (newest last) — e.g. the fix a user typed when the run was stuck. Empty when there was no intervention. Distinct from supervisor/plugin advice, which never appears here. |
| `ctx.manifest` | object | This plugin's own manifest — `params` live at `ctx.manifest.params`. |
| `ctx.signal` | AbortSignal | Aborted when the run stops; bail out of long work when it fires. |
| `ctx.finishClaim` | string \| undefined | **`finish-gate` only** — the completion message being judged. |
| `ctx.trigger` | boolean \| undefined | **`post-turn` only** — `true` when the turn raised a suspicious signal (error, locator miss, loop-guard hit). |

### Write (methods)

| Method | Effect |
|--------|--------|
| `ctx.setResult(value)` | Write this plugin's output to `ctx.results[id]`. |
| `ctx.injectAdvice(note)` | Whisper an advisory note into the next planning turn. |
| `ctx.vetoFinish(reason)` | **`finish-gate` only** — reject the completion; `reason` becomes corrective advice and forces another turn. No-op elsewhere. |
| `ctx.recordLesson(lesson)` | Save a durable lesson to the agent's memory (`async`; the host dedupes + caps, resolves whether appended). Shorthand for `ctx.memory.record`. |
| `ctx.wake()` | Cut short the inter-step wait so the next turn starts now. |
| `ctx.requestStop(reason)` | Ask the run to stop. Honored where the host allows it. Stronger than advice — use sparingly. |
| `ctx.emit(event)` | Stream a structured activity line to the run log / UI. |

### Calling tools (MCP and built-in)

```js
ctx.mcp.available            // boolean — is a tool runtime attached to this agent?
await ctx.mcp.callTool(name, args)   // call a tool by name → text result
```

`args` may be an object (JSON-encoded for you) or a raw JSON string. `callTool` rejects
when no tool runtime is attached, so guard on `ctx.mcp.available`. This is how a
sub-agent reaches an external service — e.g. a step assertion that queries a golden-data
API for the value a step should have produced.

**`mcpServerIds` in the manifest declares intent, it does not sandbox you.** It documents
which servers your plugin means to reach, and it is what an operator reads when deciding
whether to trust the plugin — but it is not enforced at the call. Treat it as a promise
you are making, and keep to it.

**This is not limited to MCP tools.** `callTool` reaches the agent's whole tool runtime,
so from 0.4.2 it can also call `rest_request` when that agent has
[API access](user-guide.md#calling-an-api-instead-of-a-ui) enabled — even though it is a
built-in capability rather than a server, and so appears in no `mcpServerIds`. That
agent's own allowlist, credentials and read-only setting still apply; a plugin cannot
widen them.

### An activity event

```js
ctx.emit({
  pluginId: ctx.manifest.id,
  kind: 'info',            // 'info' | 'advice' | 'veto' | 'lesson' | 'error'
  message: 'short line for the run log',
  detail: 'optional longer text'
})
```

### Memory & learning

Each agent keeps a **memory** — a short, self-owned log of durable lessons (a fix it found
after getting stuck) that the host injects into the agent's prompt so it stops repeating
the same mistake. Memory itself is **core infrastructure** (the store and the prompt
injection live in the app); a plugin only *operates* on it, through `ctx.memory`:

```js
ctx.memory.read()                  // full memory markdown (lessons + any user prose); '' if none
ctx.memory.lessons()               // just the distilled lessons, as plain strings
ctx.memory.has(text)               // true if `text` already appears in a lesson (case-insensitive)
const saved = await ctx.memory.record(lesson)  // dedupes + caps in the CORE; resolves true/false
```

**Dedupe is the host's job — don't re-implement it.** `ctx.memory.record` is `async` and,
before appending, runs a cheap exact/substring check **and** a *semantic* check via the
sub-agent's model, so a paraphrase of an existing lesson is dropped (best-effort: it records
on any model error). It also enforces the memory cap. It resolves `true` if the lesson was
actually added, `false` if it was empty or already covered — so a learning plugin just calls
it, no `has()` guard needed:

```js
if (await ctx.memory.record(lesson)) ctx.emit({ pluginId: ctx.manifest.id, kind: 'lesson', message: `Learned: ${lesson}` })
```

`ctx.recordLesson(lesson)` is a shorthand for `ctx.memory.record(lesson)` (same dedupe, same
`Promise<boolean>`).

Pair this with **`ctx.humanNotes`** — the instructions the user injected during this run —
to capture the "stuck → the user's fix → remember it" loop. See the
[self-learning worked example](#post-turn-self-learning-distill-lessons-into-memory).

## The model a plugin runs on

Any sub-agent that calls an LLM gets a **system-provided model control** — you don't
build it yourself. In the agent editor, every sub-agent's settings panel shows a **Model**
group with one toggle:

- **Use the agent's own model** (default) — the sub-agent runs on the same model/endpoint
  the agent plans with. One model, one endpoint to configure.
- **Off → a standalone endpoint** — a separate, usually cheaper/faster model just for this
  sub-agent (handy for a lightweight watcher or judge).

The resolved result arrives at **`ctx.model`**, so your `entry` code never has to read
endpoints or import an HTTP client:

```js
export async function run(ctx) {
  const verdict = await ctx.model.chat([
    { role: 'system', content: 'Answer only "yes" or "no".' },
    { role: 'user', content: `Does this look done?\n${ctx.finishClaim ?? ''}` }
  ])
  if (!/yes/i.test(verdict)) ctx.vetoFinish('Not done yet.')
}
```

`ctx.model` is `{ endpoint, usingPlannerModel, maxTokens, temperature, chat(messages, opts?) }`.
`chat` uses the run's abort signal and the resolved token/temperature defaults unless you
override them in `opts`.

**Precedence** (highest first): the agent's per-plugin **Model** setting → the manifest's
`model:` (a plugin author's default standalone endpoint) → the agent's own model. So a
plugin can *ship* a sensible standalone default in its manifest, and a user can still
override it in the UI.

## Native tools (tool-calling)

Instead of asking the model for a text marker and parsing it (`FIX: …`, `LESSON: …`), a
plugin can expose **native tools** the model calls directly. You declare each tool's
**schema** as data and write its **handler** as a sibling `<name>.mjs` (code). When the
plugin passes the tools to `ctx.model.chat`, the host runs the model, dispatches every tool
call to its handler, feeds the result back, and loops until the model stops calling — so
the model's calls do the work.

**1. Declare the tools in `tools.json`** — a dedicated file next to the manifest, in the
**standard OpenAI tools shape**, so the same schemas are portable to other tool-calling
systems:

```json
[
  {
    "type": "function",
    "function": {
      "name": "record_lesson",
      "description": "Save a durable, reusable lesson to memory so the agent stops repeating a mistake.",
      "parameters": {
        "type": "object",
        "properties": { "lesson": { "type": "string", "description": "Shortest reusable \"problem -> solution\" tip." } },
        "required": ["lesson"]
      }
    }
  }
]
```

The handler for each tool is a sibling `<name>.mjs` (e.g. `record_lesson.mjs`). To point a
tool at a different filename, add a top-level `"file": "path/to/handler.mjs"` next to
`"type"`/`"function"` — a non-standard key other systems harmlessly ignore.

`tools.json` is read only for **code plugins** (`entry` set) — a `type`-bound built-in
never uses tools. It accepts a bare array or a `{ "tools": [...] }` wrapper.

**2. Write the handler** — `record_lesson.mjs`, exporting `run(ctx, args)`:

```js
export async function run(ctx, args) {
  const lesson = String(args.lesson || '').trim()
  if (!lesson) return 'skipped: empty lesson'
  const saved = await ctx.memory.record(lesson)   // core dedupes (exact + semantic) + caps
  return saved ? `recorded: ${lesson}` : 'skipped: already covered'
}
```

Every handler is called `(ctx, args)`: `args` is the model's parsed arguments, and `ctx`
is the *same* facade the plugin's `run` receives — so a tool can `ctx.memory.record(...)`,
`ctx.injectAdvice(...)`, `ctx.vetoFinish(...)`, `ctx.emit(...)`, call MCP, and so on. The
return value (stringified) is fed back to the model as that call's result.

> No dedupe in the handler: `ctx.memory.record` already drops exact **and** *semantic*
> duplicates (a paraphrase of an existing lesson) in the core — see
> [Memory & learning](#memory--learning). The handler just records and reports the result.

**3. Run the model** — from `index.mjs`. The easy path is **`ctx.observe()`**: the host
assembles the prompt for you (your rubric from `instruction.md`, plus the goal, recent
steps, and the current screen), runs the model with `ctx.tools`, and dispatches any tool
call to its handler:

```js
export async function run(ctx) {
  await ctx.observe()
}
```

Need a different prompt or context? Build the messages yourself and call
`ctx.model.chat(messages, { tools: ctx.tools })` — `ctx.observe()` is just a convenience
wrapper over exactly this:

```js
await ctx.model.chat(
  [
    { role: 'system', content: 'Judge the run; call record_lesson / inject_advice when warranted.' },
    { role: 'user', content: [
      { type: 'text', text: `Goal: ${ctx.goal}` },
      { type: 'image_url', image_url: { url: ctx.screenshot } }
    ] }
  ],
  { tools: ctx.tools }        // ctx.tools = the schemas loaded from tools.json
)
```

Either way, the write happens because the *model* called `record_lesson` and the host ran
the handler — your code neither parses text nor records anything itself.

Notes:

- **Code plugins only.** Tools are resolved only when the manifest sets `entry` (the code
  that calls `ctx.model.chat`). A `type`-bound built-in never reads `ctx.tools`.
- **Bounded loop.** The host loops the model↔tool exchange a few rounds, then stops — a
  backstop against a model that never stops calling.
- **Fail-soft dispatch.** A missing or throwing handler is answered with an `error: …`
  tool result (fed back to the model), never a crash.
- **Local small models.** Native tool-calling reliability varies on small local VLMs. If a
  call is skipped, `chat` still returns the model's text — keep a text fallback if that
  matters for your model.

> **Worked example.** **Settings → Plugins → Observer → Install** scaffolds exactly this:
> a `tools.json`, its `record_lesson.mjs` + `inject_advice.mjs` handlers, and an
> `index.mjs` that supervises the run with a single `ctx.observe()` call.

## Export shapes

The loader accepts these export shapes from a sub-agent's `entry` file:

**1. A bare `run` function** (named or default) — the common case. Its phase comes from
the manifest:

```js
export function run(ctx) { /* … */ }
```

**2. A full sub-agent object** (default export) — when you want to set the phase or
`blocking` in code:

```js
export default {
  meta: { id: 'my-plugin', phase: 'finish-gate', blocking: true },
  run(ctx) { /* … */ }
}
```

A sub-agent binds to exactly one phase. For shape 2, `meta.phase` on the object takes
precedence over the manifest's `phase`; `meta.blocking` marks a `finish-gate` plugin as
awaited (able to veto). An `async settle()` can be added to await in-flight work (e.g. a
fire-and-forget `post-turn` observer) so token usage settles at teardown.

## Settings panels (optional config UI)

Instead of editing YAML `params`, a plugin can declare a **settings schema**. When
present, the agent editor renders a config panel for it (in the Sub-Agents tab), stores
the values **per agent**, and delivers them to `run` as `ctx.settings` — so a plugin never
ships UI, only this data.

> **The Model group is added for you.** Every sub-agent's panel already includes a
> host-provided **Model** group at the top (use the agent's own model, or a standalone
> endpoint) — don't declare `usePlannerModel`/`model` fields yourself. See
> [The model a plugin runs on](#the-model-a-plugin-runs-on).

For example:

```yaml
id: order-check
name: Order Confirmation Check
phase: finish-gate
entry: index.mjs
settings:
  menu:
    location: agent          # a panel in the agent editor (per-agent scope)
    label: Order Check
  fields:
    - kind: text
      key: mustInclude
      label: Completion must include
      help: The finish is vetoed unless this exact text is present.
      default: 'Order #'
```

```js
export function run(ctx) {
  const need = ctx.settings?.mustInclude   // ← from the panel, with the schema default merged in
  // …
}
```

### Field kinds

| Kind | Renders | Key props |
|------|---------|-----------|
| `text` | Single-line input | `key`, `label`, `help?`, `default?`, `placeholder?` |
| `textarea` | Multi-line input | `key`, `label`, `help?`, `default?`, `rows?` |
| `number` | Numeric input | `key`, `label`, `help?`, `default?`, `min?`, `max?`, `step?` |
| `toggle` | On/off switch | `key`, `label`, `help?`, `default?` |
| `select` | Dropdown | `key`, `label`, `help?`, `default?`, `options: {value,label}[]` |
| `component` | A named rich host widget (e.g. a model-endpoint picker) | `key`, `component`, `label?`, `props?` |
| `group` | A labeled group of nested fields | `label`, `fields[]` |
| `note` | Static help text | `text` |

`key` may be dotted (`model.temperature`) to nest values. The panel writes only
overrides; unset fields fall back to `default`. A settings schema is **just data** — it's
safe to load; only an `entry` script is executable code.

## Built-in plugins

Two sub-agents ship in the box. They're configured per agent (each has its own panel);
you can also **bind to them by `type`** in your own manifest (see
[Declarative](#1-declarative-no-code--reuse-a-built-in)).

| Built-in | Phase | What it does |
|----------|-------|--------------|
| **Judge** | `finish-gate` | When the agent declares the task done, judges the final screen against the goal and can send the run back to keep working. |
| **Observer** | `post-turn` | Watches the trajectory after each turn, injects a corrective note when the run drifts, and can record a durable lesson. |

**Overriding a built-in.** Install an org-level folder with the **same id** (`judge` /
`observer`) to retune or replace it — a custom prompt/model, or even your own `entry`
code. Its phase is pinned to the built-in's. The plugin manager can scaffold a commented
override folder (manifest + starter `instruction.md` + starter `index.mjs`) for you to
hand-edit; deleting the folder reverts to the shipped default.

> **Chronos** (wall-clock pacing / time budgets) used to be a third built-in here. It's
> now a **core** supervisor, configured in the agent editor's own **Chronos** tab — not a
> plugin, and not bindable by `type`.

## Worked examples

### Finish-gate: veto unless the result includes a string

See the [Quickstart](#quickstart--your-first-plugin) above — the minimal, canonical
`finish-gate` plugin.

### Post-step: assert every step, with an optional external lookup

A `post-step` plugin runs after each action and can force a redo or hard-fail. It matches
an assertion to the current step, optionally fetches the expected value from an MCP
knowledge base, checks the step's result, and acts on the verdict.

```yaml
id: qa-step-assertion
name: QA Step Assertion
phase: post-step
enabled: true
order: 50
entry: index.mjs
mcpServerIds: []            # set to your MCP server id(s) to enable KB lookups
params:
  hardFail: false           # true = stop on the first failed step; false = nudge a redo
  maxRedosPerStep: 1
  assertions:
    - whenStepMatches: 'search'
      expectText: 'results'
    - whenStepMatches: 'create work order'
      mcp: { tool: 'kb_lookup', args: { key: 'latest_work_order_id' } }
    - whenStepMatches: 'submit'
      expectText: 'submitted'
```

```js
export async function run(ctx) {
  const params = ctx.manifest?.params ?? {}
  const assertions = Array.isArray(params.assertions) ? params.assertions : []
  if (assertions.length === 0) return

  const last = ctx.recentTurns[ctx.recentTurns.length - 1] // post-step → the step just run
  if (!last) return
  const evidence = `${last.response || ''}\n${last.outcome || ''}`.toLowerCase()

  // Pick the assertion whose `whenStepMatches` appears in the step's thought.
  const rule = assertions.find(
    (a) => a.whenStepMatches && evidence.includes(String(a.whenStepMatches).toLowerCase())
  )
  if (!rule) return

  // Expected value: a literal, or fetched from an external knowledge base via MCP.
  let expect = rule.expectText
  if (rule.mcp?.tool && ctx.mcp.available) {
    try {
      expect = (await ctx.mcp.callTool(rule.mcp.tool, rule.mcp.args ?? {})).trim().slice(0, 200)
    } catch {
      return // don't block the run on a KB outage
    }
  }
  if (!expect) return

  const passed = evidence.includes(String(expect).toLowerCase())
  ctx.emit({ pluginId: ctx.manifest.id, kind: passed ? 'info' : 'veto',
    message: passed ? `Step passed: "${expect}"` : `Step FAILED: expected "${expect}"` })
  if (passed) return

  if (params.hardFail) ctx.requestStop(`Step assertion failed: expected "${expect}".`)
  else ctx.injectAdvice(`The last step didn't produce "${expect}" — redo it before moving on.`)
}
```

### Post-turn: self-learning (distill lessons into memory)

A `post-turn` sub-agent that reflects on the trajectory and records durable lessons to the
agent's [memory](#memory--learning) — so the agent stops repeating mistakes. It's
fire-and-forget (never blocks the loop), learns from two sources (a mistake the run
recovered from, and a fix the user typed while stuck via `ctx.humanNotes`), asks the model
for **at most one** short "problem → solution" line, and skips anything already known. A
full copy of this plugin ships as a worked example under `organization/<org>/plugins/`.

```yaml
id: self-learning
name: Self-Learning
phase: post-turn
enabled: true
order: 60
entry: index.mjs
settings:
  menu: { location: agent, label: Self-Learning }
  fields:
    - kind: number
      key: everySteps
      label: Reflect every N steps (baseline)
      min: 1
      default: 4
    - kind: toggle
      key: learnFromRecovery
      label: Learn from mistakes the run recovered from
      default: true
    - kind: toggle
      key: learnFromHuman
      label: Learn from the user's guidance when stuck
      default: true
```

```js
export async function run(ctx) {
  const s = ctx.settings ?? {}
  const everySteps = Math.max(1, Number(s.everySteps ?? 4))
  // Reflect on a suspicious turn (error / loop / locator miss) or on the baseline cadence.
  if (!ctx.trigger && ctx.turn % everySteps !== 0) return

  const humanNotes = s.learnFromHuman !== false ? (ctx.humanNotes ?? []) : []
  const recovered = s.learnFromRecovery !== false && ctx.recentTurns.some((t) => t.outcome)
  if (!recovered && humanNotes.length === 0) return   // nothing worth learning from yet

  const known = ctx.memory.lessons()
  let reply
  try {
    reply = await ctx.model.chat([
      { role: 'system', content:
        'Extract AT MOST ONE durable, reusable lesson as the shortest "problem -> solution" ' +
        'line. It qualifies only if the run hit a real difficulty and found what works, OR the ' +
        'user gave guidance that unstuck it. If nothing qualifies or it is already known, reply ' +
        'exactly NONE.' },
      { role: 'user', content:
        `GOAL: ${ctx.goal}\n\nALREADY KNOWN:\n${known.map((l) => `- ${l}`).join('\n') || '(none)'}` +
        `\n\nUSER GUIDANCE THIS RUN:\n${humanNotes.map((h) => `- ${h}`).join('\n') || '(none)'}` }
    ], { maxTokens: 120 })
  } catch { return }                                   // reflection is advisory
  if (ctx.signal.aborted) return

  const lesson = String(reply || '').replace(/^[-*\s]+/, '').replace(/\s+/g, ' ').trim()
  if (!lesson || /^none$/i.test(lesson)) return

  // record dedupes (exact + semantic) + caps in the core; announce only a real save.
  if (await ctx.memory.record(lesson)) ctx.emit({ pluginId: ctx.manifest.id, kind: 'lesson', message: `Learned: ${lesson}` })
}
```

> The built-in **Observer** already does this same learning when its **Self-learning**
> toggle is on — this example is the standalone, hackable version of that faculty.

## Install a plugin

1. **Settings → Plugins → Install from folder…** and pick the plugin's folder (the one
   containing `manifest.yml`). It's copied into the org-wide plugins folder.
2. Toggle it **enabled** if needed. Installed but disabled = kept on disk, skipped.
3. Open the agent that should use it → **Sub-Agents** → **add** the plugin and set its
   order. Remember: installing alone changes nothing for a run until an agent opts in.
4. Run a task. To iterate, edit the plugin's files and just run again — **no rebuild**.

To share a plugin, zip its folder; the recipient installs it the same way. To remove one,
use **Settings → Plugins → Remove**.

## Safety & performance

- **Loading is fail-soft.** A malformed manifest or a throwing entry is skipped with a
  console/UI warning and never crashes a run. A `finish-gate` plugin that errors does
  **not** block the finish (it fails open).
- **Keep gates fast.** `pre-turn`, `finish-gate`, and `post-step` are **awaited** — they
  add latency to the loop. Do the minimum; push heavy/advisory work to `post-turn`.
- **Honor `ctx.signal`.** Bail out of loops and async work when the run is aborted.
- **Trust boundary.** A `settings`/`params` schema is just data and safe to load. An
  `entry` script is real code that runs in the app's main process — only install plugins
  you trust, exactly as you would any script on your machine.
- **`post-turn` can't gate.** It's fire-and-forget; use it for advice, not enforcement.

---

[← Docs home](index.html) · [User guide](user-guide.md) · [Troubleshooting](troubleshooting.md)
