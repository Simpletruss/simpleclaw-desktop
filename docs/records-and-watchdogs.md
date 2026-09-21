# SimpleClaw — Records & watchdogs

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Android devices](android-devices.md) · [Web APIs](web-apis.md) · [Agent API](agent-api.md) · [Server mode](server-mode.md) · [Cluster](cluster.md) · [Functions](functions.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md) · [Release notes](release-notes.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/records-and-watchdogs.html)
> labels each page with its release and can switch between versions.

**New in 0.18.** Two features that share one mechanism, which is why they share a page.

**The ledger** lets one task work through **a thousand records** — a spreadsheet of work orders,
a list of accounts, a queue read off a screen — without the list ever being in the model's head.
The set is written to disk, the agent is handed **one record at a time**, and what happened to
each is written down as it goes.

**A watchdog** is a schedule that **watches a page**. It looks every few minutes, remembers
everything it has ever seen in a ledger of its own, and starts a flow for each record that is new.
The ledger is what makes "new" mean anything — nothing compares pixels, and nothing parses the
DOM.

---

## Table of contents

1. [Part one: the ledger](#part-one-the-ledger)
   - [When a ledger turns on](#when-a-ledger-turns-on)
   - [What the agent sees](#what-the-agent-sees)
   - [Watching it go](#watching-it-go)
   - [The record table](#the-record-table)
   - [Resuming an interrupted run](#resuming-an-interrupted-run)
   - [Where a ledger lives](#where-a-ledger-lives)
   - [Limits](#limits)
2. [Part two: watchdogs](#part-two-watchdogs)
   - [The three parts of a watchdog](#the-three-parts-of-a-watchdog)
   - [Setting one up](#setting-one-up)
   - [What one check actually does](#what-one-check-actually-does)
   - [The watch line](#the-watch-line)
   - [Its ledger, and its history record](#its-ledger-and-its-history-record)
   - [Two agents, two browsers](#two-agents-two-browsers)
   - [Watchdogs on a server](#watchdogs-on-a-server)
3. [The control API](#the-control-api)
4. [Troubleshooting](#troubleshooting)

---

# Part one: the ledger

A task that has to do the same thing to a long list of records hits three walls, and they are all
the same wall:

- **The set doesn't fit.** A thousand work-order numbers is about 12 000 tokens. The opening
  message is re-sent on every turn, so putting the list there costs that on every request for the
  whole run — and it is still only the list, with nothing said about what has been done to it.
- **The progress doesn't fit either, and it grows.** Whatever holds *"412 done, these 3 failed"*
  is re-read every turn and gets longer with every record. A run that reports each record as it
  goes exhausts its context by arithmetic, not by doing anything wrong.
- **The answer doesn't fit.** A final report a thousand lines long is not something anyone reads,
  and not a payload anything downstream can carry.

So all three live on disk instead, and the agent is shown exactly two things per turn: **the one
record it is working on**, and **the counts**.

## When a ledger turns on

It is decided **per run**, not per agent, and you don't switch it on anywhere. Either of these
does it:

- **An attached file holds a list** — five or more records in a csv, tsv or xlsx, or more than
  twenty lines in a txt. Below that it is something a run can simply read and hold.
- **The plan has a repeating step** — an item the planner marked as *"do this for each …"*.

An ordinary one-shot task is deliberately **not** offered the ledger: a model handed it on a task
with one record will sometimes use it anyway, and then spend a turn per record on bookkeeping it
never needed.

**Attach the file, don't paste the list.** The opening message carries a *summary* of an
attachment — its columns and a sample of rows — and the ledger reads the **whole** file when it
loads it, including the rows you were only shown a sample of. Pasting a thousand rows into the
goal puts them back in the context the ledger exists to keep them out of.
→ [Task files](user-guide.md#running-a-task)

## What the agent sees

Once the set is loaded, the run works in a loop of three moves:

1. **Take a record.** It arrives as *"record 413 of 1000"* with its whole row — every column the
   file carried, not just the key.
2. **Do the work on it**, in the app, exactly as it would for a one-off task.
3. **Settle it and take the next one.** That is a single move, on purpose: the record just
   finished is marked **done**, **failed** or **skipped** with a one-line note, and the next one
   comes back in the same answer. There is no way to take a record without saying how the last one
   ended.

**The conversation is cleared at every record boundary.** Record 413 starts as fresh as record 1
— everything it needs is the record it was handed and what is on the screen. That is what makes
the cost flat instead of climbing.

**The note is the answer, on a task that reads rather than changes.** For *"check the status of
each of these"*, the per-record note is the result — it is asked for the words on the screen
(`Status: Cancelled`), not a description of what the agent did next.

The agent can also **look through the set without being handed work** — what is left, what failed,
whether a particular record is even in the file — which is how it answers a question about the set
instead of guessing from what it remembers.

## Watching it go

A run that is working through a set says so **above the conversation**: a chip with the set's name
and the counts, next to the task's attachments. Click it and the whole set opens as a table.

Because the ledger is a file beside that run's session — not something in the running process's
memory — **progress is readable while the run is still going**, from the window, from another
machine's window pointed at this one, and from the control API.

The run's **final answer** is a summary with the tally in it, and the exceptions listed as
exceptions. The place to go for anything more specific is the table.

## The record table

Everything the set holds, one screenful at a time:

- **Filter by status** — pending, done, failed, skipped, or all.
- **Search** — matched against the key, the row's values *and* the note, which is how you find
  *"every record whose failure mentions permission"*.
- **Open a record on its own** to see its full row and its note.
- **Export** the whole set, the current filter, or a hand-picked list of rows, as **CSV** or
  **JSON**.
- **Forget records** — drop them from the set for good. On a watchdog this means *"see it as new
  again next time"*, which is how you make a watchdog re-do work it has already done; the
  confirmation says so.

The counts above the table are always for the **whole set**, never for the filter, so narrowing to
the four failures doesn't make it look like there are four records.

## Resuming an interrupted run

**Re-run the task and load the same file again.** Already-settled records are not redone — the
ledger recognises the keys it already holds, and the run picks up at the first one nobody has
finished. Resuming is one indexed lookup, not a replay of a progress log.

This is also what protects a set from **two processes**: taking a record is a single transaction,
so two runs that open the same ledger cannot both be handed record 413. For a task that *cancels*
things, a double-hand-out is damage, not a duplicate.

## Where a ledger lives

| | Where the set is kept |
|--|--|
| **Desktop app, or one container** | A SQLite file beside that run's session and screenshots, retained and deleted with the run |
| **A deployment with a database** | Rows in Mongo, keyed by node and by set |

It is the **same connection string** that already decides where the run index lives — not a new
switch, and not a per-ledger choice. → [Server mode](server-mode.md)

**Why the database option exists:** a watchdog's ledger lives under the agent tree, and in a
container that tree is usually a network (SMB) mount. SMB does not give SQLite the locks it asks
for, so opening the set threw `database is locked` on every check — which meant the watch never
got as far as working out what was new, which meant the flow it exists to start never started, and
the only evidence was a 0-byte file. If you run SimpleClaw in a container with a mounted agent
tree, **give it a database.**

The bulk-task ledger stays on SQLite in every deployment, which is safe for the reason the watch
ledger wasn't: it is one run's own set, written by one process, in that run's own folder, and
deleted with it.

## Limits

| | |
|--|--|
| Records in one set | 20 000 |
| Columns kept per record | 12 |
| Characters kept per value | 200 |
| Rows the agent gets from one look at the set | 50 |
| Rows the table pages at a time | 100 |

---

# Part two: watchdogs

A watchdog answers *"something appears on this page every so often — deal with each one."* You
describe **where to look**; SimpleClaw does the looking on a clock, works out what is new, and
runs a flow against each new record.

**A watchdog is a schedule entry.** It is armed and fired by the same scheduler as
*"run this at nine every morning"*, on the machine the agent lives on.
→ [Scheduling](user-guide.md#running-a-task-later-scheduling)

## The three parts of a watchdog

Three jobs, three owners, and everything else follows from keeping them apart:

| | Who does it |
|--|--|
| **Waiting** | The **schedule**. Firing again in three minutes *is* the wait. Nothing waits inside a run. |
| **Working out what's new** | The **ledger**. What a check reported goes into the schedule's own set, which ignores a key it already holds. |
| **Looking** | The **run** — and only looking: open the page, read it, report, finish. |

The third one has to be said out loud, because a person describes the **standing** job when they
set one up: *"watch this page and when the work-order number changes, run the flow."* That is the
right description of the arrangement and the **wrong instruction for one run**. Taken literally it
produced a model that sat on the page re-screenshotting every few seconds until its steps ran out
— 44 of them, all *"still B9895972"*, ending in an error with nothing reported.

So what you write is treated as **where to look**, and SimpleClaw appends the rest of the deal.
The form shows you the exact text a check will send, folded shut at the foot of it — open it once
and the arrangement stops being something you have to take on trust.

## Setting one up

**Agent → Chronos → Watchdog.** It is its own page rather than a mode of Chronos → Schedule: the
two share a mechanism, but *"do this task at nine"* and a standing arrangement with three parts
are not the same thing to fill in.

**The task** is where to look, in your own words: *"open the ARN queue and read the work orders
listed there."* Nothing about waiting, and nothing about the flow.

**Repeat** is the cadence. Minutes, not hours — a queue nobody is watching is the point of it. The
default is every three minutes.

Then four questions:

1. **Which column names a record** — `work order number`, `invoice #`, `ticket id`. **Required**,
   and the only one whose wrong answer is silent. Without it a run asked for each item *"exactly as
   it appears on the page"* wrote down the whole row: `B9853530 - Additional Repairs Needed
   (Invitation Homes, Canceled), Air Conditioning/Heating -> Unit -> Not Cooling`. That is one
   record to a reader and **three keys** to the ledger, which splits the list on commas — so a
   single work order arrived as three, two of which flowed off to an agent that could not find
   them. And even read whole, a row is unstable as a key: the status in it changes between checks,
   and the same work order comes back as new.
   *It is not a second way of saying what a record is* — the task already says that. It answers the
   narrower question the task genuinely doesn't: of everything printed on that row, which part is
   its name.
2. **Which flow to start**, by its Start node.
3. **What to tell the working agent**, once per record. Optional — the record always goes in as the
   flow's input regardless, so a flow whose nodes say what they are for needs nothing here. Write
   `{{record}}` where the record should appear.
4. **Which agent runs the flow.** Leave it empty and the watching agent does it too. See
   [Two agents, two browsers](#two-agents-two-browsers) for why you usually shouldn't.

You are **not** asked which graph, what a record is called, or what the flow calls its payload.
The graph is the one this install is configured for; the flow is asked what it calls its own input.
Each of those would only have been a place for two answers to the same question to drift apart.

## What one check actually does

1. **The reading run is submitted** against the schedule's own conversation, so it lands on the
   browser the last check left — the page where it was, signed in if the portal allowed it.
2. **It re-opens the page**, first thing, before reading anything. See below.
3. **It reports everything it was sent to read** — all of it, not just what looks new — one value
   per item, from the column you named.
4. **That list goes into the ledger**, which ignores every key it already holds. What it *did* add
   is, by construction, what nobody has seen before.
5. **Every record still pending** — new this time, or left over from a firing that died — gets the
   flow started for it, with the record as the flow's input, and is settled when that flow ends:
   done, or failed with why.

**Why it re-opens the page every time.** Checks share one browser, so the second check opens on the
tab the first one left — and that tab has been in the **background** in between. Chrome keeps the
renderer awake, but nothing makes the page ask the server anything: a server-rendered list is
whatever it was when it was fetched, and even one that polls is throttled to nothing while hidden.
The tab goes on painting a screen that is minutes old and **looks entirely healthy**.

This was first read as a settling problem and given a settling fix — bring the tab to the front,
wait a few seconds, reload only if it then listed nothing. That is wrong in the one case that
matters: a stale page does not list *nothing*, it lists the **last** thing, so the reload never
fired. Measured over 12 consecutive checks on one watchdog across 50 minutes, 3 of them happened to
navigate and 9 read the paint — and the 9 produced **byte-identical screenshots**. The reported
work order changed on exactly the 3 that navigated. From the outside that is *"it has been stuck on
B9853634 all afternoon."*

Re-opening costs the same two steps the waiting did, and it is the only move that puts a question to
the server.

**Checks that don't happen.** A firing that arrives while the last one is still working is
**skipped**, and so is one that arrives with no browser profile free. Nothing is lost — the ledger
already holds everything the next check needs, and the next check reads the same page.

**Every wait is bounded**, and each bound means something different: how long a submitted check may
stand in the queue, how long the reading run may take **once it has started** (charged from the
run, so a busy executor's own delay is never reported as a slow portal), and how long **one
record's flow** may take — which is what stops a wedged flow holding the watchdog, and every firing
behind it, for ever.

## The watch line

Wherever schedules are listed, a watch entry carries a second line under it:

```
👁  runs Confirm caller for each new record as Field Ops  ·  running the flow for B9857099
    ·  21 done, 1 waiting, 3 failed                                              [ Ledger ]
```

- **What it runs, and as whom** — the flow agent's name appears only when it isn't the watcher.
- **Where it is right now** — *checking the page…*, *running the flow for …*, or *checked 3m ago ·
  saw 14, 2 new*.
- **The counts**, from the ledger.
- **Skips**, shown as skips and never as errors — *"3 checks skipped: no free profile"*. A skip is
  not a failed check, and showing it as one sends somebody to look at the portal for a problem that
  is on this machine. It is shown at all because the line otherwise still reads *"checked 12m ago"*,
  which on its own looks like a watchdog keeping up.
- **The last error**, if the last check failed.
- **Ledger**, which opens the same table [Part one](#the-record-table) describes.

## Its ledger, and its history record

These are two different things and it is worth knowing which to open.

**The ledger is the account.** Every record the watchdog has ever seen, when it was first seen,
what became of it, and why a failure failed. Kept **in full**, for as long as the schedule exists.
This is what to read for anything that isn't from the last hour.

**The history record is the last few checks.** A watchdog writes **one** record and every check
appends to it — because a check is not a piece of work with a beginning and an end, it is the same
standing job done again. Recorded the ordinary way it minted a session every three minutes: twenty
an hour, nearly all of them *"records: none"*, burying the ones that found something. The record
keeps roughly the **last twenty steps** — about the last dozen checks — because the screenshots are
nearly all of the bytes, and a watchdog running for months at three-minute intervals would
otherwise keep paying for pictures of an empty queue.

**The flows are not in it.** Each record the watchdog acts on gets **its own walk and its own
record**, which is what you actually want to open when the question is *"what happened to
B9857099?"*

## Two agents, two browsers

Watching and doing the work are two jobs, and they want two different agents more often than not.

**Watching is reading a list**: a small persona, no skills, cheap and fast, built to look and
report. **The flow is the real work**, and it needs the agent that knows the system — its sign-in,
its skills, its memory of where things are. Run as the watcher, a flow spends thirty steps hunting
for a screen the other agent knows by name, and then stops at its step cap.

They do **not** share a browser, which falls out of how browsers are parked rather than being a
setting: a conversation parks one browser per agent, so the flow agent gets its own profile and its
own sign-in, kept warm across checks exactly like the watcher's.

## Watchdogs on a server

A desktop pointed at an executor manages that executor's watchdogs the same way it manages its own
— the Watchdog page composes the same answers and sends them over the control API.

- **Creating** one arms it on that machine, on that machine's clock.
- **Editing** one changes it **in place, keeping its id**. That matters more than it looks: the
  ledger every check has been writing into for weeks is kept under that id, so a cancel-and-recreate
  would throw away everything the watchdog has ever seen and start the work again from the top.
- **The watch line** polls the executor for its live counts, so the line above renders against a
  machine across the internet exactly as it does against this one.
- **The ledger** reads, exports and forgets down the wire.

What stays on that machine is everything the entry is made of: its browser, its ledger and the
flows it starts. → [Pointing it at a server](user-guide.md#pointing-it-at-a-server)

---

## The control API

Everything above has a route. → [Agent API](agent-api.md)

**Create a watchdog** — an ordinary recurring schedule with a `watch` block:

```http
POST /v1/schedules
Content-Type: application/json

{
  "agentId": "queue-watcher",
  "goal": "Open the ARN queue and read the work orders listed there.",
  "spec": { "kind": "interval", "everyMs": 180000 },
  "watch": {
    "recordKey": "work order number",
    "startId": "confirm-caller",
    "message": "Work order {{record}} has just appeared in the queue.",
    "flowAgentId": "field-ops"
  }
}
```

`graphId`, `definitionId` and `inputKey` are accepted too, for a caller that knows better than the
defaults. Everything else about a schedule — `spec`, `budgetMs`, the tenancy check on `agentId` —
works exactly as it does without a `watch`.

**Change one in place**, keeping its id and its ledger:

```http
PATCH /v1/schedules/<id>
```

The body is the same shape `POST` takes, minus the agent — an entry's agent is part of the name its
ledger is kept under, and cannot move.

**The live counts** behind every watch line:

```http
GET /v1/watch-status
```

**A watchdog's ledger:**

```http
GET    /v1/schedules/<id>/ledger?status=failed&query=permission&offset=0&limit=100
POST   /v1/schedules/<id>/ledger      → { "status": "...", "query": "...", "keys": [...], "format": "csv" | "json" }
DELETE /v1/schedules/<id>/ledger      → { "keys": ["B9857099", ...] }
```

`GET` pages it; `limit=0` asks for the counts and no rows, which is how a window decides whether to
offer the table at all. `POST` is the **export**, and it is a POST because its filter can carry a
hand-picked list of keys — a body, not a query string — and because what comes back is a document.
`DELETE` makes the watchdog **forget** those records, which means it will see them as new on its
next check.

A schedule that keeps no ledger answers `404`.

---

## Troubleshooting

**The watchdog reports the same record over and over, or hasn't moved all afternoon.**
Almost always a stale page — but 0.18 re-opens the page on every check, so if you are seeing this
on 0.18, check the reading run's steps: it should call `open_url` first, every time. If the task
you wrote tells it to stay on the page, rewrite the task as *where to look* rather than as the
standing job.

**One work order arrives as three records, and two of them are nonsense** (`Canceled`, a trade
path). The record key column is blank or names the wrong column, so the whole row is being written
down and split on its commas. Fix it in the Watchdog page, then delete the bad keys from the ledger
so they stop counting as seen.

**`database is locked` on every check, and the ledger is a 0-byte file.**
A container with the agent tree on an SMB mount. Give the deployment a database — see
[Where a ledger lives](#where-a-ledger-lives).

**The watch line says "checks skipped: no free profile".**
This agent's browser profiles are all busy. Nothing is lost; the next check reads the same page. If
it is constant, give the agent more profiles or give the flow its own agent.
→ [One agent, several browsers](user-guide.md#one-agent-several-browsers)

**The flow runs but can't find anything.** It is probably running as the watching agent. Give it
the agent that knows the system — see [Two agents, two browsers](#two-agents-two-browsers).

**A long task stopped part-way and I don't want it to redo the first 400 records.**
Re-run it and let it load the same file. Settled records are not redone. If you *want* some of them
redone, open the table, select them and delete them first.

**The ledger table is empty on a run that clearly worked through a list.**
The run never loaded a ledger — most likely the list was pasted into the goal rather than attached,
or the attachment holds fewer than five records. See
[When a ledger turns on](#when-a-ledger-turns-on).

---

[← Docs home](index.html) · [User guide](user-guide.md) · [Agent API](agent-api.md) · [Server mode](server-mode.md) · [Troubleshooting](troubleshooting.md)
