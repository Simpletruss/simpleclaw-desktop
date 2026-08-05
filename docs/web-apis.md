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
4. [Variables and environments](#variables-and-environments)
5. [Credentials](#credentials)
6. [Sharing it with your team](#sharing-it-with-your-team)
7. [Running the suite in CI](#running-the-suite-in-ci)
8. [Copying a request as code](#copying-a-request-as-code)
9. [Mixing API steps with screen steps](#mixing-api-steps-with-screen-steps)
10. [Letting an agent call your saved requests](#letting-an-agent-call-your-saved-requests)
11. [What it deliberately doesn't do](#what-it-deliberately-doesnt-do)
12. [What's on disk](#whats-on-disk)
13. [Troubleshooting](#troubleshooting)

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
| **Script translated** | A `pm.test(…)` or `pm.environment.set(…)` line became a real test or capture. No sandbox needed. |
| **Script needs a human** | A script too involved to translate. Kept verbatim, shown on the request, and **never executed**. |
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

Pick a request in the tree and press **Send**. The tabs are Postman's, plus two that replace
its script sandbox:

| Tab | What goes in it |
|--|--|
| **Params** | Query parameters. Rows can be unticked instead of deleted — a parameter you turned off while debugging is one you want back in ten seconds. |
| **Headers** | The same, for headers. |
| **Body** | JSON, raw text, form-urlencoded, or multipart (including file uploads). |
| **Auth** | None, Bearer, Basic, API key — or *inherit*, meaning "whatever the collection says". |
| **Capture** | Pull a value out of the response and bind it to a name, for a later request or a later screen step to use. This is the deterministic replacement for `pm.environment.set(…)`. |
| **Tests** | What must be true of the response: status, a JSON path, a header, body text, elapsed time. Computed from bytes you already have — no model, no cost, same answer on Tuesday. |

The response pane leads with **the verdict** — whether your tests held — with the status code
beside it as a coloured chip. Two states that look the same in most tools are kept apart
here, because collapsing them is how a red suite starts getting ignored:

- **Failed** — the request completed and a test said no.
- **Error** — it never completed: DNS, timeout, connection refused.

**Saving is explicit.** Every save is a file write that will show up in somebody's
`git status`, so "I was looking at this" doesn't become a commit-worthy change.

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
the repo on the first run.

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
request bodies live in their own file (an escaped one-line JSON string is unreviewable), and
ordering is a key on each item rather than a list in a parent file (which would make "we both
added a request" a conflict every time).

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

- **No script sandbox.** Postman scripts are not executed, ever. What they were mostly for —
  chaining a value, asserting a response — is Capture and Tests, which are deterministic,
  reviewable in a diff and free. An untranslatable script is kept and shown, never run.
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

More in [Troubleshooting](troubleshooting.md) and
[Safety & privacy](safety-and-privacy.md#agents-that-call-an-api).
