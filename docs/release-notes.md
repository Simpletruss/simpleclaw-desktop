# SimpleClaw — Release notes

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Web APIs](web-apis.md) · [Agent API](agent-api.md) · [Server mode](server-mode.md) · [Functions](functions.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/release-notes.html)
> labels each page with its release and can switch between versions.

What each release added, newest first. Installers for every release are on the
[Releases page](https://github.com/Simpletruss/simpleclaw-desktop/releases).

**Which version am I on?** **⚙ Settings → About** shows it, next to a short *What's new* for
the last few releases. The docs you're reading now describe **0.15.x** — use the version menu
at the top of any page to read an older release's docs instead.

---

## 0.15 — Every send you made, kept

*Current release.*

**The API client remembers every Send you made.** A request is a single mutable file: the moment
you change a header the previous version is gone, and the response that went with it was never
anywhere but on screen. So *"it worked an hour ago — what was different?"* is the one question a
workspace could not answer, however carefully it was committed. Every **Send a person makes** is
now recorded against its own request — the last **25** — and any of them can be reopened: the
editor shows that request **as it went out**, params, headers, body, auth and scripts included,
and the pane shows the response it got, with its tests, its timings and its script output.
→ [The last sends of a request](web-apis.md#the-last-sends-of-a-request)

**A past send is read-only, and there are two ways out of it.** The fields don't take typing and
**Save is not rendered at all** rather than greyed out — a disabled Save beside an old version
invites the reading *"this would overwrite the request with it"*, which is a different button's
job. **Send** runs that version and makes it the current one. **Restore** does the same without
sending, for *"put it back, I want to change something first"*. Both turn the snapshot back into
an ordinary draft before anything happens, which is what keeps every state on screen describable
in one sentence: re-running a past version **is** editing the request to be that version again,
and nothing is written to disk until you Save.

**A literal credential is never written down.** A `{{secret:NAME}}` reference is kept — it is a
name, and a name being safe to write down is the entire point of the vault. A token **pasted**
into the Auth tab is not: the Auth tab only converts a paste into a reference on Save, so a
paste-then-Send has a live token in the draft, and storing that would put a plaintext credential
on disk that until then had only been in memory. It is masked out of the whole entry, and the
entry records that it was — so Restore leaves your current credential alone instead of
overwriting it with dots, and the snapshot says out loud that re-sending it uses the credential
you have now rather than the one that went out.

**None of it reaches git.** History lives under `.apiclient/`, which the workspace gitignores and
the sync backend skips — the same place the pending-merge cache lives, and the only place this
could have gone. An entry is nothing but a timestamp and a snapshot, which is exactly the mutable
metadata a shared workspace refuses to carry, and two people's Sends are not a thing to merge.
Only what a **person** sent is recorded, and that is stamped by the app rather than passed by the
caller: a scenario's API step, `npm run apitest` and an agent's saved-request call leave nothing
behind.

**Send is a Cancel while the request is in the air.** It used to disable itself and read
*Sending…*, which left the only way out of a request that hangs being the 30-second timeout — or
restarting the app, because switching to another request doesn't stop the one already sent. One
button with two jobs, so the way out is the control you started it with, and there is no fourth
state to learn. A cancelled send **reports itself as cancelled** instead of blaming the timeout
for something you did.

**The credential padlock is a toggle, and the icon is the state.** Open means the value is in the
clear in that environment; closed means it is in this machine's vault and the row holds a
reference. Unlocking **clears the row without deleting the saved credential**, because nothing
can read a value back out of the vault to put it in the box — so the credentials panel below now
also lists the saved credentials that no environment refers to, which is what keeps an unlocked
one reachable instead of stranded. **Save now says what it wrote**, by name: saving several
environments at once and seeing only the dirty dots disappear is a thing *stopping*, not a thing
happening, and the honest reading of it was "did that do anything?"
→ [Credentials](web-apis.md#credentials)

**A workspace row says which repository it is a checkout of.** Two clones of the same team
repository, or a fork and its upstream, cannot be told apart by folder name or by path — so each
row in **Web APIs → workspace list** now carries its git remote, shortened to the part people
recognise, with the service's own mark beside it and the full URL in the tooltip. It is read from
that folder's own `.git/config` on every listing rather than from anything this app stored, so it
is blank rather than wrong after someone runs `git remote set-url` in a terminal. **A workspace
connected to nothing says so**, because "no line here" and "this is shared with nobody" look
identical otherwise, and the second is what surprises someone whose edits never reach their team.
Credentials are stripped from the URL **in the main process, before it crosses to the window** —
a workspace cloned by hand with `https://<token>@github.com/…` has that token in `.git/config`,
and rendering the string would print it into a settings page, every screenshot of one, and the
support bundle that follows. The workspace name is also the way in now, instead of an Open button
that had to hide itself on the row that was already open and shifted the other controls sideways
under your pointer.

**One SimpleClaw per machine.** A second launch brings the existing window back rather than
starting a second app. Two instances were never a duplicate window, they were **two writers**:
the settings, the agent roster and the schedules are rewritten whole with no compare-and-swap, so
the second instance silently reverts the first, and both would bind the control API port, arm the
scheduler, and reap each other's browsers at boot. The relaunch is answered by showing the window
**except while a run has it minimized** — the run put it away on purpose and the run bar is
standing in for it, so dropping the window back on screen would break the run you were called
away from. This applies to development builds too: a source checkout and an installed build share
one user-data directory, so they are two writers whichever way round you start them.

**Parallel runs work in an installed build.** A second concurrent run executes in a worker
process, and the pool started one by naming the entry file in its arguments — which means
something only to an *unpackaged* Electron. In an installed build that argument is ignored and
the child booted **the desktop app again**: a second window, a second port bind, a second browser
cleanup, dying seconds later in an error dialog on the first write its worker flag forbids, while
the pool reported only *"worker … exited before it was ready"*. Which process a launch becomes is
now decided in one place from the environment rather than from arguments, so the path a release
depends on is the one a development run exercises. A run executor that somehow loads the desktop
entry now fails immediately and says why, instead of falling over later somewhere unrelated.

**Also in this release**

- **A long response body is kept out of the history file.** Past 256 KB an entry keeps its
  status, headers, timing and the request — everything that makes it comparable — and drops the
  body, saying so. The file is rewritten in full on every Send, so that ceiling is what each
  click pays for.
- **The credentials panel stopped making an IPC round-trip per keystroke.** It keyed its caches
  on an array its caller rebuilt on every render.
- **The request-picker dropdowns page.** Long lists render in chunks with placeholders for the
  next page, and the keyboard is never paged: arrows, Home and End walk the whole list and reveal
  what they land on.

**Point releases in this series**

| Release | What it added |
|---------|---------------|
| **0.15.0** | Per-request send history, cancellable sends, the environment padlock as a toggle, the repository line in the workspace list, one-instance-per-machine, and the packaged-build worker fix. |

---

## 0.14 — A real browser window, and a wait the Planner names

**Browser scope is now called *Sealed browser*, and it can be a real window.** The name changed
because "headless" described the *mechanism* and the seal is the point: one Chrome, one origin,
its own signed-in profile, navigation off-site bounced back. What is new underneath is a
**Driver** choice on that tab. **Headless (CDP)** is the default and is exactly what browser
scope has always been — the page is captured from the renderer, clicks are injected over the
DevTools protocol, nothing on your screen moves. **Native window** runs the same sealed Chrome
*with a window*, on a display the executor owns: pixels come off the framebuffer and input goes
through the operating system.
→ [The driver: headless, or a real window](user-guide.md#the-driver-headless-or-a-real-window)

**What that buys is everything outside the page.** Under the native driver the model sees the
whole browser — address bar, tab strip, download shelf — and the things that are not web content
at all and that the DevTools protocol cannot reach: the OS file picker an upload opens, a print
dialog, `alert()`. Its clicks and keystrokes are real X events, so a page receives them with
`isTrusted` set exactly as it would from a person, and a site that gates on that stops treating
the agent as a script. The prompt follows the driver: under the headless driver the agent is
told there is no address bar and `open_url` is the only way to reach an address, and under the
native driver it is not told that, because there plainly is one in front of it.

**It costs a display, and where there isn't one the run is refused rather than downgraded.** An
X display has one pointer and one keyboard focus, so two native runs cannot share it — and the
only display the desktop app has belongs to the person sitting at it, which is the one thing
sealed-browser scope exists in order not to touch. So the native driver is served **only by an
executor running its own virtual display** (the container does, and now ships a window manager
and a clipboard owner so a window has a title bar, gets placed, and a copy outlives the tab that
made it). Anywhere it cannot be served, the agent is reported **unsupported with the specific
reason** and the run never starts — no silent fall back to headless, which would produce a run
that behaves unlike the agent that was configured and nothing downstream that could tell.
→ [The native driver on a deployment](server-mode.md#the-native-browser-driver)

**The agent now says how long to let the app work before it looks again.** Every wait the run
already had was a *ceiling* that returns the moment its own condition holds — did anything move,
has it stopped moving, does the page report itself loaded — and on an app that acknowledges a
click before it has anything to show, the honest answer to all of them is "immediately". A
measured run shows both failure modes: a click that "reacted after 56ms" and "settled after
196ms" handed over a frame of an app that was still drawing, and an SPA navigation reported ready
within ~100ms because `readyState` completes in a beat, the in-flight request counter cannot see
what an *iframe* fetches, and the site's spinners carry no `aria-busy`. Neither the pixels nor
the page can answer this. The Planner can: it knows what it just clicked. So it now declares a
**`wait`** with every click, double-click and `open_url` — 250ms for a checkbox or a dropdown,
2–5 seconds for a save that goes over the network or a panel whose contents are fetched, up to 15
for a page it has seen be slow — and if your goal text says how long something takes, it uses
that number.
→ [What the agent declares with each action](user-guide.md#what-the-agent-declares-with-each-action)

**No answer it can give is unsafe.** The declaration is a **floor measured from the moment the
action fired**, not a sleep bolted on the end: a click that already spent fifteen seconds in the
page-switch wait pays nothing extra, and a declaration under what the settles already spent is
free. 250ms is the minimum and the default, applied to the clicking verbs and navigations whether
or not anything was declared — a scroll or a hotkey still pays nothing, since its result is on
screen the moment it stops. The ceiling is the agent's own **Nav settle**, so the knob that
already meant "the longest this run will wait on one action" governs this too. And the repeat
guard **ignores** the field: being more patient about a click is not a different click, so 250 →
1000 → 3000 on the same dead button still trips the loop breaker.

**Before and after, in the screenshot pane.** A step card shows the frame its Planner *reasoned
over*, which is always the picture from **before** its action — so a step whose click took five
seconds to land read as "the click did nothing", while the frame proving otherwise sat one card
further down. The pane now has a **before / after** toggle. "After" is not a new capture: it is
the next step's frame, which the loop takes once the settles and the declared `wait` are done, so
it is precisely what the harness handed the model — and it is labelled with the gap between the
two (`+5.0s after the action`). The aim marker is hidden on the after frame, because those
coordinates describe where the click was pointed on the *old* screen. The toggle hides itself on
a step with no successor and says so when a successor's frame is still streaming in.

**Smaller things.** The scope an agent runs on is named the same way everywhere — the roster
cards and the New-task agent picker used to print the raw mode (`browser scope`) beside a tab a
person had just set to *Sealed browser*. The **User-Agent override** field is shown for the
headless driver only, since its whole purpose is the `HeadlessChrome` token a real window never
sends. The curated model lists dropped `qwen3.8-27b`. And the dev container's CORS default now
includes the desktop app's own origin, which is what a "could not be reached" with nothing in the
container's log was.

**Point releases in this series**

| Release | What it added |
|---------|---------------|
| **0.14.2** | **A machine-wide concurrency cap no longer exists.** How many tasks an executor runs at once is the sum of the agents' own **Max parallel slots**, and a task waits exactly when *its own* agent's profiles are all busy — so one agent's queue can never hold up another's. `AUTOPLAY_MAX_CONCURRENT_RUNS` is retired and no longer read (a leftover line in an env file does nothing), and **Settings → General → Concurrency** is gone with it: a number in two places, one of which was invisible from the window that submitted the task, was what made a queued run impossible to explain. **Memory holds a task instead of killing the machine** — no *additional* run starts while under 1 GB is free, read from the container's own limit rather than the host's, reported as *Waiting for memory on this machine* and retried; the first run is always admitted. → [Running more than one run at a time](server-mode.md#running-more-than-one-run-at-a-time) |
| | **`GET /v1/status?byAgent=1`**, for a dispatcher choosing between several executors. Plain `queued` is the *whole* queue's depth, which cannot answer "can **this** agent start now" — the per-agent view reports `slots`, `busy` and `free` so a caller can route on "a task sent now starts now". → [Choosing between executors](agent-api.md#choosing-between-several-executors) |
| **0.14.1** | **A JSON body can carry comments and a trailing comma.** A hand-written body accumulates alternatives — three models, two providers, the endpoint that worked yesterday — and JSON has nowhere to put them. `// ` line comments and `/* */` blocks are now stripped immediately before the body is sent, so the server never sees the leniency; the trailing comma goes with them, because commenting out the last entry of an object is what leaves one. Strings are never touched — `"https://…"` contains a `//` and so does almost every real body — and the space after `// ` is required for the same reason. **JSON bodies only**: deleting `//` out of a raw XML or CSV body would be corruption rather than leniency. **Open data folder works for a container on this machine**, with nothing configured: the executor only knows its own side of the mount, so the app asks Docker which container publishes the port this window is talking to and what it binds there, then opens the run's own folder. Bind mounts only — a named volume lives inside the Docker VM and reports "no folder" rather than a path that happens to parse — and the entry's **Local data folder** field is the override for a native process, a proxy or an SSH tunnel. **A failed model endpoint says what actually happened** (DNS, refused, TLS, timeout, the wrong port) instead of a bare network error, and the agent editor's fields carry hover hints explaining what they change. |
| **0.14.0** | The Sealed browser rename and the native window driver, the Planner-declared `wait`, and the before/after toggle in the screenshot pane. |

---

## 0.13 — A plan that can change its mind, and more than one run at a time

**A plan step that keeps failing is no longer asserted for the rest of the run.** A plan is
written before the first click, from demonstrations of a task that is never quite this one, so
some of its steps are wrong on the day. Until now nothing in a run could revise one: the guards
could break a repetition and the supervisor could suggest one better move, but the checklist
went on presenting the same wrong instruction every turn and the run walked back into it — on
one measured run, twelve turns alternating between "Click the blue star icon in the top" and
cancelling the dialog it opened. A run that is **detectably** stuck on one step now **rewrites
the remaining plan from the screen in front of it** and carries on. Finished steps are kept,
the abandoned one stays visible and marked failed, and the correction lasts — this is the
difference from the Observer's repair, which is worth exactly one turn.
→ [When the plan turns out to be wrong](user-guide.md#when-the-plan-turns-out-to-be-wrong)

**On by default, at three tries and two re-plans.** Both numbers are on **Agents → Planner →
Planning**, and both are deliberately shy: the second try at a GUI step is often the one that
works — the page had not finished loading, a dialog was in the way — and a run that keeps
re-planning is not converging, it is deriving new wrong plans from a screen it cannot read.
Being stuck is still detected mechanically (screen unchanged, or the same action repeating), so
a step making visible progress is never counted out, and past the cap the ordinary stuck-run
recovery takes over.

**The plan has a second level, and it shows which line the run is on.** A plan item's procedure
used to be a block of numbered text under a single "in progress" heading — six lines, no
indication which of them had happened. Each line is now its own tracked **sub-step** with its
own mark: ✓ done, ▸ in progress, ~ skipped as unnecessary, ✕ tried and abandoned, plus a
**· tried N×** counter from the second attempt onward. The agent reports
which sub-step each action belongs to, everything before it is counted done automatically, and
a step it decides is unnecessary is skipped **with the reason attached**. Nothing was asked of
the planner to make this work — the lines are parsed out of the procedure it already writes, so
a plan composed months ago, a hand-written one, and one from a custom rubric all get it.
→ [The plan a run follows](user-guide.md#the-plan-a-run-follows)

**"This work is already done" is now checked by the app, not read off a busy screen.** An item
can carry an exit condition — *the rating beside the record's id at the top already shows four
stars* — and asking the Planner to notice it, on a turn whose real business was choosing the
next click, kept failing the same way: a detail page shows the same **kind** of value in three
places, and the copy in a side card belongs to a different record. The check is now a step the
harness takes on its own. It **locates the place the condition names**, crops and magnifies the
frame to it so the look-alike is not in the picture at all, and then asks two separate
questions — one call describes what is there **without being told what the answer should be**,
a second judges that description against the condition. It reads as a shield-marked line in the
conversation, so a run that stopped early shows its evidence. It can only ever end a run on a
clear answer: a detector that finds nothing, an endpoint that is down, a reading too thin to
judge all return nothing and the run proceeds exactly as it would have.

**The workspace runs more than one task at a time.** **⚙ Settings → General → Concurrency**
governs this whole machine — the window, the control API and the batch command alike. At 1
(the default) it behaves as it always has and a second task is refused; above 1 the second task
is **queued** and starts as soon as a slot frees up, and the status bar grows a **run picker**
listing everything in flight — agent, goal, step count, queue position — so you can switch
which one the workspace is showing. The workspace still shows **one run at a time**, because a
live run is a conversation and two interleaved in one thread is unreadable. Takes effect after
a restart.
→ [Running more than one task at once](user-guide.md#running-more-than-one-task-at-once)

**One agent, several signed-in browsers.** How much of that total a single agent may claim is
its own **Max parallel slots** (**Agents → Scope → Headless browser**, up to 4). Each slot is a
whole browser profile, because Chrome allows one browser per profile — which is why two tasks
for one agent used to queue behind each other no matter what the machine could afford. Slot 2
and up are **copied from the first slot** the first time they are needed, so they start out
signed in; afterwards each holds its own session. Desktop- and window-scope agents are still
held to one at a time whatever the setting says: there is one physical screen and one cursor.

**The run clock starts when you asked, not when the run did.** Planning a task — splitting it,
picking the demonstrations, composing the items — is regularly longer than the run's first few
steps, and you waited through all of it. The live meter now measures from the moment the task
was submitted, which is what the saved run's own history row always measured, so a run's clock
and its history entry finally agree. The conversation also **follows the live tail**: each
arriving step is selected as well as scrolled to, so the screenshot and detail panes beside it
show the step you are looking at. Selecting an earlier step by hand pauses the following, and
selecting the newest one resumes it.

**A tab that is lit is not a tab that has loaded.** Clicking a tab inside a record — a panel
that must be **fetched** before it appears — was reported as "same page", so the run waited
only for something to move (the tab's own highlight, 30 ms) and was handed a screenshot of the
new tab lit over the **previous** panel's content. Calling it a page switch is not the fix
either: a panel swap moves about 13% of the frame against the 35% a page switch waits for, so
the run would burn its whole navigation budget and still be shown the stale screen. There is a
third answer now — the Planner says **tab-switch** for a click that swaps a panel inside the
page, and the run waits on the panel, not on the page. Measured on the run that motivated it:
447 ms over a stale panel before, 3.4 s and the right screen after.

**A page is asked whether it is still loading.** Alongside the frame comparison, the run counts
the page's own outstanding fetches and waits for them to drain — with a ten-second age limit, so
a site holding a stream or a long-poll open forever is not mistaken for one that never finishes
loading. This is what handles the sites with no spinner, where "the screen stopped changing" was
already true because the old page had never left.

**Clicks land on the thing you meant.**

- **A wrapped link is hit, not the gap beside it.** A link that wraps across two lines leaves
  empty space at the end of the first line, and a click aimed there passed through to the page
  behind. A click that lands on nothing now snaps to the actionable element within a few pixels,
  and the trace says what it snapped onto.
- **A submit button stopped being described as a text field.** "Change this record" was read as
  "this is somewhere to type", so a **WRITE COMMENT** button was located as *"WRITE COMMENT
  button at the bottom right input"*. The Planner now says what the target **is** — button,
  link, icon or text — separately from what pressing it achieves.
- **A native dropdown offers what it actually contains.** When the focused control is a
  `<select>`, its real options are listed to the agent, and it picks one by typing its name.
  A browser draws that list **outside** the page, so a click aimed at a row in it passes straight
  through and only closes the list — which is why an agent trying to click one could never
  finish. Options beyond the first 40 are counted rather than listed.
- **A stray text selection is cleared** before the next action, so a drag that ended up
  highlighting half a paragraph does not steer the click after it.

**Web APIs: the response pane became a reader.** It was pretty-printed text in a box, which is
not what anyone does with a response all day. JSON now renders as a **foldable tree** where
every folded node states its size — folding that hides the count hides the thing you were
looking for — and a string that is *itself* JSON gets an **as JSON** button, because that is
the shape real APIs return. A **format picker** (JSON, XML, HTML, YAML, JavaScript, Markdown,
Raw) defaults to the `Content-Type` and falls back to sniffing the body, since plenty of APIs
answer `text/plain` for JSON. **Ctrl+F** searches with a match count, next/previous and
wrap-around — and it searches **inside the tree**, expanding what it needs to, because a search
reporting twelve results while showing none is worse than one reporting none. **Copy** and
**Save** write the body **as displayed**, and Save names the file after the request and extends
it from the format on screen. **Clear** drops the result only; the request, its draft and its
captured values are untouched.
→ [Reading the response](web-apis.md#reading-the-response)

**GraphQL requests, and panes you can resize.** A **GraphQL** body mode with two boxes, sent as
`{"query": …, "variables": …}` — blank variables are **omitted** rather than sent as `{}`, which
some servers reject. Variables stay text until Send, because a syntax error in JSON you are
halfway through typing is not an error worth interrupting you with; at Send it is reported as
one. Postman's `graphql` mode imports with both fields intact. The request/response split and
the query/variables split are draggable and remember where you put them.

**A collection can be organised without leaving the app.** The tree was read-only: requests
arrived by Postman import or `git clone`, and anything structural meant editing files by hand.
Now — **add a request**, rename in place, delete behind a confirmation that counts what goes
with it, create and delete collections, and **folders** to any depth with add, rename, delete,
duplicate and copy/paste. **Drag and drop** reorders among siblings, moves into folders and
crosses collections. Within a collection a move is a real **rename on disk**, so git records the
subtree as moved rather than as a delete plus an add, and a pasted request or folder gets **new
ids** — a paste that reused them would move the original instead of copying it. **Workspaces**
are created by name rather than by pointing a folder picker at an empty directory and trusting
it to be scaffolded, and both *remove from list* and *delete the folder* are reachable from the
sidebar.
→ [Organising a collection](web-apis.md#organising-a-collection)

**Fixed in Web APIs:** unsaved edits to a request survived only until you clicked another
request — the editor was keyed by request id, so switching unmounted it and took your typing
with it, silently and permanently. Drafts now live in the page, one per request. **Copy did
nothing at all** (the clipboard API is denied to this window, and the failure went to an
unhandled promise); it now copies, and says so when it can't. Saving no longer makes the page
jump while the sync bar re-reads `git status`, a failed tree write reports into the error banner
instead of looking like a button that was never wired up, and moving a folder beside a
same-named sibling no longer renames onto it.

**Also in this release**

- **Lossless screenshots, optionally.** **Agents → Scope → Capturing → Lossless screenshots
  (PNG)** turns off JPEG's chroma subsampling, which halves the resolution of colour exactly
  where the edges of coloured text live — links, nav bars, status chips. On a dense business UI
  that is 43.6 dB against 46.1 dB measured on the frame the model receives. **Vision tokens are
  unchanged**, since they follow the image's pixel dimensions and not its file size; the cost is
  storage, roughly 2× per frame. Off by default.
- **Switching scope is a deliberate press.** The Scope tab's four pages used to *be* the
  setting, so tabbing over to look at the headless-browser options moved the agent onto them.
  A ✓ badge marks the surface that is live, the other pages say they are a preview, and
  **Apply** is what moves the agent.
- **A plan's missing values are asked for the way the app labels them** — *Record ID*, not
  `record_id` — and only things a person would actually type: a save or a confirmation the
  agent should carry out is written into the procedure instead of being asked of you.
- **Opening the running run from History no longer freezes its plan.** The saved snapshot
  shadowed the live plan for the rest of the run.

**Point releases in this series**

| Release | What it added |
|---------|---------------|
| **0.13.0** | Mid-run re-planning, plan sub-steps, the exit-condition check, machine-wide concurrency with per-agent browser slots, `tab-switch` waiting and the page-busy probe, click snapping and native dropdowns, PNG capture, and the Web APIs response viewer and collection editing. |

---

## 0.12 — Ask the page's own API, and a supervisor that steps in

**An agent can ask the site it is on for an answer, instead of clicking five screens to
read one.** A browser-scope run gets **`http_request`**: give it a path
(`/api/records/search`), and the request goes out **from inside the open page** — so the
session the run is already signed in with is what authenticates it. No key, no token, no
allowlist, nothing to configure. That is what makes it different from the ad-hoc
[REST tool](user-guide.md#calling-an-api-instead-of-a-ui), which reaches *another* host and
therefore still needs both. Look an id up, then `open_url` the path the answer names: two
steps in place of a search box, a wait, a results list and a squint at a row.
→ [Calling the site the agent is already on](user-guide.md#calling-the-site-the-agent-is-already-on)

**It is bounded by the same seal the run already has.** The request can only reach the
origins the run may navigate to; off-seal comes back refused, with the reason, on the same
turn. This grants nothing new on purpose: the agent can already click any button on those
pages, and asking the endpoint behind the button directly is *less* authority than pressing
it, not more. Replies are truncated before the model reads them, so a large JSON body cannot
crowd out the task. Browser scope only — a desktop run has no page to send from, and is told
so rather than left guessing.
→ [Agents that call an API](safety-and-privacy.md#agents-that-call-an-api)

**Teach it the endpoint the way you'd tell a colleague.** A skill or a demonstration that
says *"POST /internal-bff/Search with `{query}`"* is enough; a method written in prose but
omitted from the call is corrected (a request with a body is a POST, never a GET, which used
to come back `405` and read as a broken endpoint). There is no picker and no allowlist to
fill in, because there is nothing to grant.

**The supervisor no longer only watches — it gets asked, and it can hold a finish.** The
Observer used to run on a cadence and whisper a note into the next turn. It now works three
ways: a **silent patrol** on that same cadence, a **check at milestones** (an item ticked
off, a run about to be declared done), and a **repair** the run *waits* for when it is
demonstrably stuck. Detection stays where it was — mechanical guards that compare frames and
watch for a repeating action — so the model is never asked *whether* something is wrong, only
**what**. Its answer must name the gap first: what the plan item expected, what the screen
actually shows, and then one move that differs from the one being repeated.
→ [When a run gets stuck](user-guide.md#when-a-run-gets-stuck-the-observer)

**A rescued turn stops being handed back the context it was stuck in.** Breaking a loop
already cleared the run's history, but the plan brief was re-rendered in full every turn, so
the model got the same checklist pointing at the same item and re-derived the same move. That
one turn now shows the supervisor's reading of the current screen instead — plus the item in
question and its neighbours by title — and the turn after is normal again. It is a jolt, not
a mode.

**A run can no longer end on a success it only claimed.** `finished()` gets one look at the
screen before it is accepted; if the goal is not visibly accomplished, the run gets one more
turn with the reason. Once per run, because a supervisor that disagrees twice is disagreeing
with judgement rather than catching a mistake, and a run that can never finish is worse than
one that finishes early. The plan's own auto-finish goes through the same gate — ticking your
way to the end is not a way around it.

**Nothing above changes a run with the Observer switched off** (which is the default), and a
healthy run with it on reads exactly as it did: a check that sees nothing wrong says nothing,
logs nothing and costs nothing. When the supervisor is unreachable, times out, or has no
verdict, the run falls back to the recovery it always had.

**Also in this release**

- **REST API access has its own page**, at **Planner → API access**. It was filed under
  **MCP Servers**, which told every reader the opposite of the truth: `rest_request` is a
  built-in capability with no server, protocol or transport anywhere in it.
- **The activity feed reads an API call as a path**, `http_request('/api/records/search')`,
  rather than burying it in escaped JSON — the path is the part you scan a feed for.
- **A locked install no longer displays the model id.** Provider and endpoint stay on
  screen, because the first thing anyone debugging a `401` needs is who served the request
  and from where; which model backs the product is not something that install can change.

**Point releases in this series**

| Release | What it added |
|---------|---------------|
| **0.12.0** | `http_request` for a browser-scope agent, the supervisor's repair and finish gate, and API access on its own page. |

---

## 0.11 — Web APIs: the Postman alternative

**There is a full API client in the app now.** Collections, requests, environments,
authentication, and a response pane that leads with whether your checks held — under
**Web APIs** in the left rail. The tabs are the ones you already know (Params, Headers, Body,
Auth), plus the two that do without Postman's script sandbox: **Capture** pulls a value out of
a response for a later step, and **Tests** says what must be true of it. Both are
deterministic, reviewable in a diff, and cost nothing to run. *(From 0.11.4 there is a
**Scripts** tab as well, for the exports those two can't express — see the point releases
below.)*
→ [Web APIs](web-apis.md)

**Sending a request never spends a token.** Not "cheap" — zero, and structurally so: no part
of this path can reach an AI model, and a test fails the build if one ever appears on it. The
app charges for what a screen agent burns; a tool that sends HTTP has nothing to charge for.

**Your Postman collections import in one step, and the report tells you the truth.**
**⚙ Settings → API workspaces → Import from Postman** takes collection and environment
exports (v2/v2.1) and converts them. Every lossy decision is named against the request it
happened in — a `pm.environment.set(…)` turned into a capture, a script too involved to
translate (kept and shown; from 0.11.4 it also runs), an OAuth 2 flow that isn't performed, a literal token
lifted out into `{{secret:NAME}}`. Re-importing later **merges instead of duplicating**, and
requests your export didn't mention are left alone. Your original export is archived beside
the collection with its credentials stripped.
→ [Coming from Postman](web-apis.md#coming-from-postman)

**A workspace is a git repository — that's the whole sharing model.** No seats, no cloud
account, no sync service holding your requests: the folder is the repo, and **Save**,
**Get changes** and **Share** are commit, pull and push in words the half of your team who
never open a terminal can use. Save works offline. One request per file means a conflict is
*"which version of Create order?"* with both in front of you, not a text merge of a JSON blob
— and a push rejected because somebody shared first is an instruction, not an error.
→ [Sharing it with your team](web-apis.md#sharing-it-with-your-team)

**A credential cannot be committed.** Files carry the *name* of a credential
(`{{secret:STAGING_TOKEN}}`), never its value; the value comes from `AUTOPLAY_SECRET_*` in the
environment or from this machine's OS-encrypted store, and the environment always wins so CI
can override a laptop. Before every commit the files are scanned — known token shapes,
credential-looking fields, high-entropy strings — and a finding **refuses the commit**. It
cannot be switched off, because a push cannot be undone.
→ [Credentials](web-apis.md#credentials)

**`git clone && npm run apitest` is the whole CI setup.** The runner is plain Node — no
Electron, no display — with selectors, environments, `--read-only` for pointing at
production, and a JSON report. **A selector that matches nothing is a refusal, not a green
run**: a renamed collection quietly dropping out of CI and reporting "all passed" is the one
outcome the runner exists to prevent.
→ [Running the suite in CI](web-apis.md#running-the-suite-in-ci)

**One pass can do the API half and the screen half.** A scenario step can now *be* a saved
API request, sharing its variables with the steps around it: create a work order over the API,
capture its id, then let an agent open the real application and check the screen actually
shows it. Postman can't reach the GUI; a browser driver can't reach a desktop app. API steps
also need no agent and no model, so every step moved off the GUI stops burning tokens.
→ [Mixing API steps with screen steps](web-apis.md#mixing-api-steps-with-screen-steps)

**An agent can call your saved requests by name — and cannot invent a URL.** That's a much
smaller thing to hand a model that reads its instructions off a web page: with no destination
to name, an injected *"call this URL with your token"* has nothing to steer. New agents get
saved requests only; an agent that already had allowed hosts keeps its ad-hoc tool too.
→ [Letting an agent call your saved requests](web-apis.md#letting-an-agent-call-your-saved-requests)

**Any request, as code you can paste — without the token in it.** cURL, PowerShell, HTTP,
JavaScript, Python, C# or Go, generated by the same builder that puts the request on the wire.
Where the credential goes, the code reads the same environment variable the app reads: runnable
by whoever has it, useless in a ticket comment.
→ [Copying a request as code](web-apis.md#copying-a-request-as-code)

**A run can be waited on in one call.** For a script or a backend job with no UI to keep
current, `POST /v1/runs?wait=90` holds the response until the run finishes (`200`) or your
bound expires (`202`, with the same run id), and `GET /v1/runs/{id}/wait` keeps waiting on one
already going. Giving up on a wait never touches the run, and a run that pauses to ask a
question comes back immediately rather than sitting out the clock.
→ [Waiting for the answer in one call](agent-api.md#waiting-for-the-answer-in-one-call)

**Also in this release**

- **A page's own dialogs no longer end a run.** A JavaScript `alert`/`confirm`/`prompt`
  freezes the page it appears on until something answers it; SimpleClaw now answers — `alert`
  and the leave-page prompt accepted, `confirm`/`prompt` **cancelled**, because auto-OK on
  *"Delete this record?"* is not a decision a tool should make — and then tells the agent what
  it answered, so a cancelled confirm reads as *"that didn't happen"* instead of *"my click
  missed"*.
- **macOS no longer quits when Screen Recording hasn't been granted.** Opening an agent's
  Scope page could take the whole app down, including for headless-browser agents that never
  capture a screen. Those pages now only ask the OS for a capture when the picture is the
  point, and go through Electron — which asks for the permission properly — when it is.
- **The Phone shortcut left the rail** to make room for **Web APIs**. Outbound calling is
  unchanged and still configured per agent, under **Agents → Phone**.

**Point releases in this series**

| Release | What it added |
|---------|---------------|
| **0.11.5** | **A drag can be held across turns.** `drag` had to name where it starts and where it lands in the same step — fine for dropping a card into a column, useless for a slider, because you cannot say where to let go until you have seen where you got to. **`drag_press`** grabs a control and nudges it *without* letting go, hands back a fresh screenshot, and takes another nudge — or **`drag_release`** — with the value you are aiming for carried over from the grab, so it stops drifting as the handle moves. Volume, zoom, time pickers, date ranges and hand-drawn sliders that are not an `<input type=range>` at all now land **on** a value instead of near one, and a handle moved with the keyboard is tracked the same way. Two guards worth knowing: dragging is the last resort — a field showing the value, or a **Now** / **Today** / preset button, is one action and is tried first — and a held control blocks every other click, so the grip releases itself after a few turns. |
| | **Scrolling says how far.** `scroll` takes **`ticks`** (one notch ≈ 100 px). The default stays a small nudge, which is what you want to bring a row out from under a sticky toolbar; covering ground is now `ticks=10` — roughly one screen — instead of nudging fifteen times and running out of steps. The opposite failure is fixed too: a full screen past content a sticky header was covering used to skip it in silence. |
| | **A run waits for the screen, not for the clock.** **Step delay** and **Nav settle** are now ceilings rather than sleeps — the loop compares a cheap low-resolution frame from before and after an action and moves on the moment they differ, so an ordinary click costs tens of milliseconds and only a genuine page load spends the whole budget. The defaults come down with it (step delay 500 → 200 ms, nav settle 600 → 300 ms); raise Nav settle for a slow site and you are raising a ceiling, not a toll every click pays. A probe that stops answering is abandoned after a second and the viewport it borrowed is put back, instead of leaving the next screenshot at the probe's resolution. |
| | **The Planner declares where it is, instead of the app inferring it.** Every action now carries the **screen** it is looking at, measured against the goal, and **`samePage`** — whether this action happens on the page the last one left behind. Both used to be guessed by matching English phrases in the model's own sentences, which is a guess that cannot work in any other language and that a reworded prompt could break at any time. |
| | **A rule whose point is "there is nothing to do" gets checked before the work.** Planning lifts it out of the procedure into the item's own **exit condition**, phrased as something visible on screen ("this work order has already been rated"), and the plan shows it as **⛔ Skip if** above the route — the difference between *"this will re-rate a rated work order"* and *"this will stop"*. Rules in a demonstration can also no longer be lost in planning: a line that reads as a rule rather than a click (*"if the order is already closed, skip it"*, *"don't change the due date"*) and is not already in the plan is carried forward **verbatim** into the item it guards. |
| | **One API key for everything that hasn't got its own.** **⚙ Settings → General → Model → Default API key**, or `AUTOPLAY_DEFAULT_API_KEY`, is used by any model, grounder or speech endpoint whose own key is blank — one place to paste it instead of one per endpoint per agent. It is applied per request on the way out and never written into an `agent.json`, so it cannot leak into a file you share; a development checkout can keep it in `.env`, which is what makes a clone with no credential in any agent file work. |
| | **A list you already have skips the planner.** **Use as steps**, beside Compose on the Scenarios page, opens what you typed in the builder exactly as written — one step per line, no model call and no wait — for when you know the list and only wanted somewhere to put it. The Observer's reasoning effort is a saved setting now rather than one that reset. |
| | Fixed: **arrow and navigation keys are recorded** in a demonstration. Arrow, Home, End, PageUp, PageDown, Delete, Insert and bare function keys captured nothing at all, so walking a dropdown with Down or scrolling with PageDown left no trace in the recording and replayed as though it had never happened. |
| **0.11.4** | **Postman scripts run.** The **Scripts** tab holds a request's pre-request and post-response JavaScript, and Send executes it: `pm.environment.set`, `pm.test`, `pm.expect`, `pm.request` rewriting, `console`. Captures and Tests are still the better answer where they fit — deterministic, reviewable, and the only version that runs in CI or under an agent — but a real Postman export carries scripts no fixed vocabulary covers, and porting forty by hand is a migration nobody finishes. **Two things to know:** this is somebody's code running on your machine, arriving over git (scripts are stored as `.js` files beside their request precisely so a reviewer can read them), and the isolation is against accidents, not intent. Scripts do **not** run in `npm run apitest` or when an agent calls a saved request. → [Scripts](web-apis.md#scripts) · [Safety](safety-and-privacy.md#scripts-in-an-api-workspace) |
| | **Send sends what's on screen.** Unsaved edits go on the wire, so changing a header and pressing Send no longer sends the old one. Save stays a separate press, because a save is a file write somebody sees in `git status`. |
| | **Several collections stay open at once** in the tree, and which ones survives a restart — expanding one no longer folds the others, and a folder holding only other folders is finally visible. Collections load as you open them, so thirty of them still draw instantly. |
| | **The JSON body box behaves like an editor**: it closes braces, brackets and quotes, steps over a closer you type, takes both halves on Backspace, and keeps your indent on Enter — which also means `{{` opens the variable completion in the same two keystrokes. **A body on `DELETE` or `OPTIONS`** is now sent, since those are ordinary in real APIs; `GET`/`HEAD` still can't carry one and say so. Dropdowns no longer get clipped by the pane they're in. |
| **0.11.3** | Fixes for runs executing in a worker process: **taking control** works on one, a takeover pause is no longer misreported as a manual pause (so the watchdog could stop the run), a worker can read the MCP registry, a retiring worker **closes** its browser rather than killing it — which used to lose the sign-in it was holding — and a sign-in done any way but the *log in once* link now survives the next browser close. Remote runs show their screenshots again. |
| **0.11.2** | **Two runs at a time per executor** (`AUTOPLAY_MAX_CONCURRENT_RUNS`, default 2), each in its own process with its own browser, and **never two for the same agent** — one agent means one Chrome profile, and Chrome locks it. **Signing in to a deployed agent from anywhere:** `POST /v1/agents/:id/login-session` mints a 10-minute link that puts you in the executor's own browser, MFA and all, and closing it rewrites session cookies to a 30-day expiry so *log in once* means once rather than once per run. Also: the to-do list shows in the web view. → [Concurrency](server-mode.md#running-more-than-one-run-at-a-time) · [Signing in by hand](server-mode.md#signing-in-by-hand-on-a-machine-with-no-screen) |
| **0.11.1** | Date and time inputs are read and filled correctly, and remote control works in server mode. |
| **0.11.0** | The Web APIs client, Postman import, API steps in scenarios, saved requests as an agent tool, the `apitest` CI runner, code snippets, and `?wait=` on the runs API. |

---

## 0.10 — Correct a deployment, and talk to it

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
| **0.10.1** | **Sideways scrolling.** A table wider than the window keeps the rest of its columns past the right edge, and the agent now scrolls to them instead of reporting the value as absent from the system. Two things had made those columns look like they did not exist: scrolling *down* never moves them, and a frozen first column leaves the left of the screen identical afterwards — so it reads the **column headers** to tell that the view moved, and scrolls back left for a control on that side. → [Action types](user-guide.md#action-types) |
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
parallel. → [Running many tasks at once](user-guide.md#running-more-than-one-task-at-once)

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
