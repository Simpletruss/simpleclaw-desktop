# SimpleClaw — Web APIs

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Agent API](agent-api.md) · [Server mode](server-mode.md) · [Functions](functions.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md) · [Release notes](release-notes.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/web-apis.html)
> labels each page with its release and can switch between versions.

*New in 0.11.*

**Web APIs** is a full HTTP client built into SimpleClaw: collections, requests,
environments, authentication, captures and tests. If you use Postman, everything here will
be familiar within a minute — the tabs have the same names and your collections import in
one step.

Three things make it different from the tool you're replacing:

- **It costs nothing to use.** Sending a request never reaches an AI model, so it never
  spends a token. Not "cheap" — zero, structurally, and enforced by a test that fails the
  build if a model provider ever appears on this code path.
- **A workspace *is* a git repository.** Sharing with your team means the thing you already
  do with code: commit, push, pull, review a diff. No seats, no cloud account, no sync
  service holding your requests.
- **It's in the same app as the agent.** One scenario can create a record over the API and
  then have an agent open the real application and check the screen actually shows it.
  Postman can't reach the GUI; a browser driver can't reach a desktop app.

---

## Table of contents

1. [Opening a workspace](#opening-a-workspace)
2. [Coming from Postman](#coming-from-postman)
3. [Sending a request](#sending-a-request)
4. [Scripts](#scripts)
5. [Variables and environments](#variables-and-environments)
6. [Credentials](#credentials)
7. [Sharing it with your team](#sharing-it-with-your-team)
8. [Running the suite in CI](#running-the-suite-in-ci)
9. [Copying a request as code](#copying-a-request-as-code)
10. [Mixing API steps with screen steps](#mixing-api-steps-with-screen-steps)
11. [Letting an agent call your saved requests](#letting-an-agent-call-your-saved-requests)
12. [What it deliberately doesn't do](#what-it-deliberately-doesnt-do)
13. [What's on disk](#whats-on-disk)
14. [Troubleshooting](#troubleshooting)

---

## Opening a workspace

**Web APIs** is in the left rail. On first open it has nothing in it, because a workspace is
a folder you choose rather than a hidden database.

Press **+** at the top of the workspace list and pick one of two ways in:

| | When to use it |
|--|--|
| **Open a folder…** | Starting fresh, or you already have a checkout. Any folder works; SimpleClaw scaffolds the few files it needs the first time. |
| **Clone a repository…** | Joining a team. Paste the repository URL — it lands in a sub-folder named after the repo, and a private one asks for a token when it turns out to need one, not before. |

The switcher at the top of the page changes which workspace you're looking at, and
**⚙ Settings → API workspaces** is where you rename one, show it in your file manager, drop
it from the list (the folder is untouched) or delete the folder outright.

**This machine remembers where your checkouts are; the workspace itself doesn't.** Which
environment you have selected, and any credential you saved, are yours alone — pushing
"I am pointed at Production" onto everyone who pulls would be a bad day for somebody.

**In the tree, several collections can stand open at once** *(from 0.11.4)*, and which ones
you left open survives a restart. Expanding one no longer folds the others, so comparing two
requests that live in different collections is a matter of looking at them. A collection is
read from disk the first time you open it rather than up front, which is why a workspace with
thirty of them still draws instantly. A folder holding nothing but other folders shows up
too, so its name and description can be reached.

## Coming from Postman

**⚙ Settings → API workspaces → Import from Postman → Choose files…** takes a Collection
v2/v2.1 export, an environment export, or several of both at once, and converts them into
files in the workspace that's currently open.

Then **read the report**, because it is part of the product rather than a courtesy. A
migration that says "imported successfully" while quietly dropping the seven scripts that
fetch your auth token is how a team discovers six weeks later that none of their tests were
ever authenticating. Every lossy decision is listed, named by the request it happened in:

| Note | What it means |
|--|--|
| **Credential extracted** | A literal token in the export became `{{secret:NAME}}`. Supply the value once (see [Credentials](#credentials)) and it is never in a file again. |
| **Script translated** | A `pm.test(…)` or `pm.environment.set(…)` line also became a real test or capture — the version a reviewer can read in a diff. The script itself comes across whole and still runs. |
| **Script needs a human** | Lines with no capture/assertion equivalent. *From 0.11.4* the script is kept **and runs as JavaScript** — [read it before you trust it](#scripts), and port what you can. |
| **Path variable** | `:orderId` became `{{orderId}}` and now needs a value. |
| **Dynamic variable** | `{{$guid}}`, `{{$timestamp}}` and friends. Nothing evaluates these. |
| **Unsupported auth** | An OAuth 2 flow, AWS SigV4 or NTLM. Bearer, Basic and API key all convert. |
| **Unsupported body** | A binary file body. |

Three behaviours worth knowing:

- **Re-importing merges, it doesn't duplicate.** A team doesn't migrate on one afternoon.
  Importing the same collection two weeks later updates what's there instead of producing a
  parallel copy of everything.
- **Requests the export didn't mention are left alone.** Deleting on the strength of
  somebody's stale export isn't recoverable, so it doesn't happen — the report tells you how
  many were untouched so you can delete them by hand if they really are gone.
- **The original export is archived beside the collection, with its credentials removed.**
  Migration is one-way and there is no export back to Postman, so keeping the source is how
  you check the conversion. It is not a working export any more, and it says so in the file.

**Folder-level auth is flattened onto each request** at import. An inheritance chain you have
to open three files to evaluate is exactly the kind of thing that makes a request work for
its author and 401 for everybody else.

## Sending a request

Pick a request in the tree and press **Send**. The tabs are Postman's, plus two that do
deterministically what its script sandbox was mostly used for:

| Tab | What goes in it |
|--|--|
| **Params** | Query parameters. Rows can be unticked instead of deleted — a parameter you turned off while debugging is one you want back in ten seconds. |
| **Headers** | The same, for headers. |
| **Body** | JSON, raw text, form-urlencoded, or multipart (including file uploads). The JSON box closes your braces, brackets and quotes, steps over a closer you type yourself, takes both halves on Backspace, and keeps your indent on Enter — so `{{` also opens the variable completion, which is the same two keystrokes. |
| **Auth** | None, Bearer, Basic, API key — or *inherit*, meaning "whatever the collection says". |
| **Capture** | Pull a value out of the response and bind it to a name, for a later request or a later screen step to use. This is the deterministic replacement for `pm.environment.set(…)`. |
| **Tests** | What must be true of the response: status, a JSON path, a header, body text, elapsed time. Computed from bytes you already have — no model, no cost, same answer on Tuesday. |
| **Scripts** | *New in 0.11.4.* Postman pre-request and post-response JavaScript, which **runs**. A dot on the tab means this request has some. See [Scripts](#scripts). |

**Send sends what's on screen.** *From 0.11.4*, unsaved edits go on the wire, so changing a
header and pressing Send doesn't quietly send the old one — Send is the action that costs
nothing and writes nothing, and needing to commit first was the wrong price for an
experiment. **Saving stays a separate press**, because a save is a file write that shows up
in somebody's `git status`, and "I was looking at this" shouldn't become a commit.

The response pane leads with **the verdict** — whether your tests held — with the status code
beside it as a coloured chip. Two states that look the same in most tools are kept apart
here, because collapsing them is how a red suite starts getting ignored:

- **Failed** — the request completed and a test said no.
- **Error** — it never completed: DNS, timeout, connection refused.

Anything the request's scripts did — `pm.test` results (passing ones included), `console`
output, what a script bound — is shown **beside** the saved tests rather than mixed into
them, so *"was that the collection or was that the script?"* is answerable at a glance.

**A body on `DELETE` or `OPTIONS` is sent.** Those are ordinary in real APIs, and refusing
them would just mean reaching for cURL. `GET` and `HEAD` are the exceptions: the editor still
lets you write a body there (the request may be mid-edit, and the [code snippet](#copying-a-request-as-code)
renders it faithfully for tools that can send it) and says plainly that this app won't.

## Scripts

*New in 0.11.4. Before that, an imported script was kept, shown, and never executed.*

**Postman pre-request and post-response scripts run.** The **Scripts** tab on any request
holds the two events, and a dot on the tab — plus a line along the bottom of the editor —
says a request has one before you press Send.

| Event | When it runs | What it can do |
|--|--|--|
| **Pre-request** | Before the request is built, and *before* `{{variables}}` are substituted — the only order in which setting one is useful. | Set variables; rewrite `pm.request` (url, headers, body). |
| **Post-response** | After the response arrives, before the request's own captures and tests are graded. | Set variables; declare `pm.test(…)` results. |

This module was deliberately built without a script engine: a capture *is* a one-line
`pm.environment.set`, and a suite whose behaviour lives in JavaScript is one a reviewer can't
read in a diff. That reasoning still holds, and **Capture and Tests are still the better
answer where they fit**. What it didn't account for is the collection you already have: a
real export signs payloads, derives nonces and branches on responses, and *"hand-port forty
of those before this tool is usable"* is a migration nobody finishes.

> **Two consequences to be clear-eyed about — neither is a bug.**
>
> - **This is somebody's code running on your machine.** A workspace is a git repository, so
>   **Get changes** can bring in a script a colleague wrote, or one that arrived in a
>   collection they imported from elsewhere. The sandbox (below) isolates against
>   *accidents*, not against intent. **Review scripts the way you review any code you pull**,
>   because that is exactly what they are.
> - **A request with a script is no longer deterministic.** Same inputs, possibly different
>   bytes on the wire. Nothing about it costs a token or reaches a model — the free-path
>   guarantee is untouched — but *"reviewable in a diff"* is now only as true as the script.

### Where scripts run, and where they don't

| Path | Scripts |
|--|--|
| **Send**, in the app | **Run.** You opened the request and pressed the button. |
| A **scenario's API step** | **Run.** Same send path, same authority — you built the scenario. |
| `npm run apitest` (CI) | **Not run.** The runner grades the committed document with its captures and assertions. |
| An **agent** calling a saved request | **Not run,** deliberately. A model reads instructions off screens SimpleClaw didn't write; *"call the request the operator sanctioned"* must not become *"execute code"*. It sends what the document says and grades what the assertions say. |

**That gap is worth planning around:** a request whose pre-request script builds its auth
header works on your desk and in a scenario, and 401s in CI. Where a script has a
capture/assertion equivalent, writing it in the **Capture** and **Tests** tabs is what makes
the request behave the same everywhere.

### The sandbox, honestly

Scripts run through Node's `vm` in a **fresh global**: no `require`, no `process`, no
`fetch`, no timers, no reach into the app's own scope, and a **2-second** limit that turns a
`while (true)` into a blip. Execution is synchronous — `async`/`await` parse, but a returned
promise isn't waited on, and Postman scripts are overwhelmingly straight-line anyway.

**It is not a security boundary, and calling it one would be a lie.** Reaching the host realm
from inside a `vm` context is a documented property of Node, not a hole that can be patched
here. A script that means harm gets what a Node program gets. The real mitigation is that
scripts arrive through git and are stored as ordinary `.js` files — so read them.

### What `pm` supports

| | |
|--|--|
| **Variables** | `pm.environment` · `pm.collectionVariables` · `pm.globals` · `pm.variables`, each with `.get` `.set` `.has` `.unset` `.toObject` `.replaceIn`. All four are views of **one bag** — this app resolves `{{x}}` from a single flat set of values per run, and a `set` that appeared to work but that nothing could read would be worse than the simplification. Names match loosely, the way `{{refs}}` do: `AccessToken`, `access_token` and `access token` are one variable. |
| **Request** | `pm.request.method` · `.url` (readable and assignable, as a string or via `toString()`) · `.body` · `.headers.get/has/add/upsert/remove`. A pre-request script sees the document's values with their `{{refs}}` **unresolved**, as Postman does; anything it writes is substituted afterwards, and an unresolved reference in *its* edits refuses the send just like one you typed. |
| **Response** | `pm.response.code` · `.status` · `.responseTime` · `.responseSize` · `.text()` · `.json()` · `.headers.get/has`, and the assertion style `pm.response.to.have.status/header/body/jsonBody`, `pm.response.to.be.ok/success/error`. |
| **Tests** | `pm.test(name, fn)` — each result is listed in the response pane, passing ones included, since a script is opaque compared to a row in the Tests tab. |
| **Assertions** | `pm.expect(x)` in chai's shape: `equal` `eql` `include` `match` `property` `length`/`lengthOf` `above` `below` `a`/`an`, the getters `ok` `true` `false` `null` `undefined` `empty`, `deep.equal`/`deep.include`, `not.*`, and the `to`/`that`/`which`/`and`/`is` connectives. **This is not chai** — it's the matchers real tests use. Anything unimplemented is *absent* rather than wrong, so a script using it fails with "not a function" naming the matcher, which is a bug report you can act on. |
| **Logging** | `console.log/warn/error`, shown in the response pane, prefixed with which script wrote them. |
| **Not supported** | `pm.sendRequest` — it throws, naming itself. Add a second request instead, which is a thing your colleagues can see. |

### `pm.environment.set` writes to the environment

A declared [capture](#variables-and-environments) lives for one run by design. A script
calling `pm.environment.set` is asking for Postman's behaviour — the variable is *in* the
environment afterwards — so the send path honours it: the value is written into the
**selected environment**, into the row that already has that name if there is one, and the
response pane logs what it saved. Nothing selected means nothing to write, and it says so
rather than inventing an environment for you.

> **`environments/<name>.env.json` is a committed file.** A token a script writes there will
> appear in your `git status`, and the [pre-commit secret scan](#credentials) will flag it —
> that is the scan doing its job, not misfiring. Two ways to keep the real credential out of
> the repository: reference it as `{{secret:NAME}}`, resolved from this machine at send time,
> or have the script store something that isn't itself the secret.

### On disk, and from an older workspace

Each script is a **`.js` sidecar** beside its request — `create-order.prerequest.js`,
`create-order.test.js` — not a `"line\nline"` string inside the JSON. That's the point: these
run, they arrive through git, and the only real defence is that somebody reads them, which
means syntax highlighting, line comments in a review, and a readable diff. The file is the
source of truth for the text, so editing it in your own editor (or taking a colleague's side
of a merge) is picked up with no further step, and a renamed request **moves** its scripts so
git keeps their history.

A workspace imported before 0.11.4 parked its scripts in the request document. Those are read
as if they were in the new field — nothing needs a migration pass — and the first time you
edit one from the Scripts tab it's written out properly. Opening a collection to look at it
doesn't rewrite forty files.

## Variables and environments

Anywhere you can type, you can write a reference:

| Syntax | Resolved from |
|--|--|
| `{{baseUrl}}` | The selected environment, then the collection's own variables, then whatever an earlier request captured. |
| `{{secret:GH_TOKEN}}` | A credential — see below. Never stored in the workspace. |
| `{{$guid}}` | **Nothing.** Postman generates these; SimpleClaw doesn't, and reports them at import so they aren't a surprise later. |

Fields colour their references as you type and complete them from `{{`. The colour is decided
by the same code that does the substituting, which matters for the third state: text like
`{{my.host}}` is **not** a reference (there's no `.` in the alphabet), so it would go on the
wire with the braces still in it. It's painted as unrecognised rather than as a promise
nothing will keep.

**Later sources win**: a captured value beats an environment value, which beats a collection
default. Environments are edited in place — add, rename, delete, change a value — from the
environment button at the top of the page.

**A capture lives for one run and then vanishes.** There's deliberately no "save this into
the environment" option: the value a suite most wants to keep is a bearer token from a login
step, environment files are committed, and writing one there would put a live credential in
the repo on the first run. A script's `pm.environment.set` *does* write to the environment,
because that is what the call means in Postman and a script that silently didn't would be
worse — with the commit scan as the backstop. See
[`pm.environment.set` writes to the environment](#pmenvironmentset-writes-to-the-environment).

## Credentials

**A credential never enters the workspace.** What a file holds is the *name* of one —
`{{secret:STAGING_TOKEN}}` — and the value is looked up at send time from, in order:

1. **The environment** — `AUTOPLAY_SECRET_STAGING_TOKEN` (or `…_FILE` pointing at a mounted
   file). This is what CI and a container use, and it wins over anything saved locally so an
   operator can override a laptop's copy without editing anything.
2. **This machine's credential store** — what the **Auth** tab writes when you type a token
   into it, encrypted by the OS (Keychain, DPAPI, libsecret) and kept in the app's own data
   folder, never in the repository.

If the OS has no credential store available, saving **fails and names the environment
variable to set instead**. There is no "we'll just base64 it" fallback — that would be a
credential at rest in cleartext, invisible to somebody relying on the word *encrypted*.

Saved values are **scoped per workspace**, because two repositories both using `API_TOKEN`
for different systems is the normal case, not an edge one.

For an imported collection whose credentials sit one hop away — the request says
`{{authToken}}`, the environment says `{{secret:STAGING_AUTHTOKEN}}` — the page offers to
fill in every unresolved name it can find in the text, so you don't have to go hunting.

> **The commit gate.** Before anything is committed, the files are scanned for credentials:
> known token shapes (`ghp_…`, `AKIA…`, a PEM header), fields called *password* / *token* /
> *authorization* holding a literal, and high-entropy strings. A finding **refuses the
> commit** and points at the line. It cannot be turned off, because a push cannot be undone —
> rotating the credential is the only remedy, and only if somebody notices. A genuine false
> positive is silenced by adding its **SHA-256 fingerprint** to `secretScanAllow` in
> `apiclient.json` — hashes rather than the literals, so the allowlist can't itself become
> the leak, and committed so a teammate doesn't have to dismiss it again. In 0.11 that entry
> is added by hand; there is no button for it yet.

## Sharing it with your team

The workspace is the repository, so collaboration is two buttons in the bar at the top of the
page — and the vocabulary is deliberately not git's, because half the people who need to
press them don't open a terminal.

| Button | What it does |
|--|--|
| **Save** | Commits your changes. **Works offline** — saving shouldn't wait on a network. |
| **Get changes** | Fetches and merges what other people shared. |
| **Share** | Pushes. A rejection ("somebody shared first") is shown as an instruction to get changes and try again, not as an error. |

**Connect a repository** sets the remote. A token is asked for at the moment an operation
actually needs one, and once you've supplied it the operation finishes — you don't press
Share twice.

**Conflicts are per request, and there are no `<<<<<<<` markers.** One request per file is
what makes that possible: the question is *"which version of Create order do you want?"* —
with both versions in front of you — rather than *"which half of this JSON blob?"*. Nothing
is written to your folder until you've picked, so cancelling is safe.

**Nothing about the layout is accidental**, and it's worth knowing if you review these diffs:
request bodies live in their own file (an escaped one-line JSON string is unreviewable),
scripts live in `.js` files beside their request for the same reason and one more — they
*run*, so a reviewer needs to be able to comment on line 14 — and ordering is a key on each
item rather than a list in a parent file (which would make "we both added a request" a
conflict every time).

## Running the suite in CI

A workspace is a git checkout with no Electron in it, so `git clone && npm run apitest` is
the whole setup — no display, no GPU, no desktop app.

```sh
npm run apitest                                        # everything in the workspace
npm run apitest -- --env staging orders                # one collection, one environment
npm run apitest -- --workspace ./api --env ci --json report.json
npm run apitest -- --env prod --read-only              # skip anything that writes
npm run apitest -- --list                              # print the plan, send nothing
```

| Option | |
|--|--|
| `-w, --workspace <dir>` | Which checkout. Defaults to the current directory, else the workspace open in the app. |
| `-e, --env <name>` | Environment whose values are in scope. |
| `--read-only` | Only `GET`/`HEAD`. The safe way to point a run at production. |
| `--json <path>` | A machine-readable report as well as the console output. |
| `--bail` | Stop at the first failure. |
| `--timeout <sec>` | Per-request timeout. Default 30. |
| `-v, --verbose` | Show each request exactly as sent — *including* resolved credentials — and full bodies. |

Exit codes: **0** all passed · **1** something failed · **2** nothing ran.

That third one is the point of the whole runner. **A selector that matches nothing is a
refusal, never a green zero-step run** — a renamed collection silently dropping out of CI,
reported as "all tests passed", is the failure this tool is built to make impossible. A
missing environment is refused the same way.

Requests run **sequentially, sharing one variable bag**, so a login step's captured token is
in scope for the request that needs it. Order comes from the workspace, not from the order
you typed the selectors, so the run is reproducible.

**Credentials in CI come from the environment** (`AUTOPLAY_SECRET_*`), are named if unset,
and are masked in output. Captured values — a bearer token out of a login response — are
handled by never printing header values at all: normal output shows capture *names*, and the
JSON report lists header names without them. `--verbose` overrides that on your screen; the
report file never shows them.

## Copying a request as code

**Code** on any request emits it as cURL, PowerShell, HTTP, JavaScript (`fetch`), Python
(`requests`), C# (`HttpClient`) or Go (`net/http`) — for a CI job, a bug report, or a
colleague's terminal.

**The snippet never contains a credential.** Where the token goes, the emitted code reads the
same `AUTOPLAY_SECRET_*` environment variable the app reads, in that language's idiom. It's
runnable by anyone who has the credential and useless to anyone who doesn't — which is what a
snippet pasted into a ticket needs to be.

The code is generated by the same builder that puts the request on the wire, so the query
string, the auth header, the serialized body and the content type are what **Send** actually
sends.

## Mixing API steps with screen steps

A [scenario](user-guide.md#running-a-whole-process-scenarios) is a sequence of steps run in
one pass. From 0.11 a step can be **a saved API request** instead of a recorded
demonstration — the two sources sit side by side in the scenario builder, and the API pool is
labelled *free — no tokens*.

Both kinds of step share **one variable bag**, and that's the whole feature:

1. An **API step** creates a work order and captures `{{workOrderId}}` from the response.
2. A **screen step** opens the real application, types that same `{{workOrderId}}` into the
   search box, and checks the record shows what it should.

Neither half of that is available anywhere else: Postman can't reach the application's UI,
and a browser driver can't reach a desktop app. What each API step will produce is shown on
the button that adds it, so you can see which value the next step will have to work with.

An API step has **no agent** — nothing drives a screen for it — so it needs no model, spends
nothing, and doesn't wait for the run queue. Every step you move off the GUI is a step that
stops burning tokens, which leaves the GUI steps to the things that genuinely need eyes. When
one fails, the pass stops and the step shows the full request and response, since there's no
screenshot to fall back on.

## Letting an agent call your saved requests

An agent with API access gets a tool that calls **your saved requests, by name**. It picks
one from a list and fills in the variables that request declares — **it cannot supply a URL**.

That's a much smaller authority than the ad-hoc `rest_request` tool
([Calling an API instead of a UI](user-guide.md#calling-an-api-instead-of-a-ui)), and the
difference matters: an agent reads its instructions off a screen that shows text SimpleClaw
didn't write, so *"call this URL with your token"* is a sentence a web page can put in front
of it. With saved requests there's no destination to steer — the worst an injected
instruction can do is call something you already sanctioned with different values. It's also
simply more reliable: no guessing at an API's shape, no turns burned discovering that an
endpoint needs a trailing slash.

Everything the ad-hoc tool is bounded by still applies underneath: the host allowlist, the
read-only default (`POST`/`PUT`/`PATCH`/`DELETE` need the writes switch, and are otherwise
not even listed to the model), the response cap, and credentials attached by SimpleClaw
rather than shown to the model.

**A request's [scripts](#scripts) do not run on this path** — deliberately, and it is the
same reasoning one step further. Granting an agent a collection would otherwise mean granting
it arbitrary JavaScript execution at the end of a chain that began with text on a web page.
It sends what the document says and grades what its assertions say.

> **Granting it, in 0.11.** Which collections an agent may call is stored on the agent, as
> `restApi.collectionIds` (the collection's folder name), with `restApi.mode` set to
> `saved-only` for saved requests alone or `saved+adhoc` to keep the URL tool as well. There
> is **no picker for this in the agent editor yet** — set it in the agent's `agent.json`
> (under the app's data folder, `orgs/<organization>/<agent id>/agent.json`) or with
> `PATCH /v1/agents/:id` against a deployment. New agents default to `saved-only`; an agent
> that already had allowed hosts before upgrading keeps both tools, so nothing it can do
> today disappears.

## What it deliberately doesn't do

Knowing the edges up front is cheaper than discovering them mid-migration.

- **Scripts run, but not everywhere and not in a real sandbox.** They run on **Send** and in
  a scenario step; they do **not** run in `npm run apitest` or when an agent calls a saved
  request. The isolation is against accidents, not intent. `pm.sendRequest` isn't supported,
  `pm.expect` is the matchers real tests use rather than all of chai, and Postman's dynamic
  variables (`{{$guid}}`) still don't evaluate. Full detail: [Scripts](#scripts).
- **No export back to Postman.** Migration is one-way; the redacted archive of your original
  export is what you keep instead.
- **No AI assertions.** "The model decides whether this response looks right" is a fine
  feature and a terrible default: a test suite that answers differently on Tuesday isn't one.
- **OAuth 2 flows, AWS SigV4 and NTLM aren't performed.** Bearer, Basic and API key are.
- **A binary file body** isn't supported (a *multipart file part* is).
- **A file attached by absolute path** works only on the machine that picked it, and is
  called out as such. A path relative to the workspace — the file committed beside the
  request — is the form that works for everyone who clones, and the only form an agent may
  send.
- **Requests run one after another**, sharing their variable bag. That's not a parallelism
  gap: captures chain, so a login has to finish before the request using its token starts.

## What's on disk

Plain files, one request each, meant to be read in a pull request:

```
<workspace>/
  apiclient.json                          the workspace itself
  collections/orders/
    collection.json                       name, variables, collection-level auth
    _archive/postman-orders.json          your original export, credentials removed
    requests/
      list-orders.request.json
      create-order.request.json
      create-order.body.json              the body, so a diff is readable
      create-order.prerequest.js          a script, so a reviewer can read it
      create-order.test.js
      customers/
        folder.json
        get-customer.request.json
  environments/staging.env.json
```

There are no timestamps and no version fields in these files: git's history is the version,
and a field that changes on every save turns each commit into noise that hides the one line
that actually changed.

## Troubleshooting

| Symptom | What's happening |
|--|--|
| **Send is refused before anything is sent** | An unresolved variable or a credential this machine has no value for. The message names it; there's no status code because nothing left the machine. |
| **"Cannot save the value safely"** | No OS credential store on this machine. Set `AUTOPLAY_SECRET_<NAME>` in the environment instead — the message gives you the exact variable name. |
| **A commit is refused for a credential** | The pre-commit scan found one, and it can't be switched off. Replace the literal with `{{secret:NAME}}` and save the value; if it genuinely isn't a credential, allowlist its fingerprint in `apiclient.json`. |
| **Share is rejected** | Somebody pushed first. **Get changes**, resolve anything conflicting, then **Share** again. |
| **`apitest` exits 2 having run nothing** | A selector matched nothing, the environment name doesn't exist, or the workspace has no requests. All three are refusals by design. |
| **The agent doesn't use its saved requests** | Check the collection is granted to that agent and that the request is a `GET`/`HEAD` unless writes are enabled — a write is not even listed to a read-only agent. |
| **`{{something}}` arrived literally at the server** | It isn't a reference the resolver recognises (a `.` in the name, for instance). The field paints those differently from real references. |
| **A request works on Send but fails in `npm run apitest`** | Its [script](#scripts) isn't running there — the CI runner grades the committed document. Move what the script does into a Capture or a Test. |
| **A script's variable wasn't saved** | No environment is selected, so `pm.environment.set` had nowhere to go. The response pane says so; pick one beside the URL. |
| **A script "ran past its time limit"** | The 2-second cap. Scripts are synchronous here, so an `await` that never settles reads as a hang. |
| **`pm.…` is "not a function"** | That matcher or helper isn't implemented — the surface is [what real tests use](#what-pm-supports), and it says the name rather than answering wrongly. |
| **Save is refused after a script ran** | `pm.environment.set` put a value in a committed environment file and the secret scan caught it. Use `{{secret:NAME}}` instead. |

More in [Troubleshooting](troubleshooting.md) and
[Safety & privacy](safety-and-privacy.md#agents-that-call-an-api).
