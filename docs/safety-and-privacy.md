# Safety & privacy

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Web APIs](web-apis.md) · [Agent API](agent-api.md) · [Server mode](server-mode.md) · [Functions](functions.md) · [Troubleshooting](troubleshooting.md) · [Release notes](release-notes.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/safety-and-privacy.html)
> labels each page with its release and can switch between versions.

SimpleClaw controls your real mouse and keyboard and sends pictures of your
screen to an AI model. Please read this page before using it on real work.

> **New in 0.11.4:** a [Web APIs](web-apis.md) request can carry **Postman scripts, and they
> run** — JavaScript that arrives in your workspace over git, or in somebody's collection
> export. That is code from other people executing on your machine, so read
> [Scripts in an API workspace](#scripts-in-an-api-workspace) before you pull one.

> **New in 0.10:** SimpleClaw can **listen and speak** — dictation, a wake word, and spoken
> replies — so a microphone is now one of its inputs. See [Voice and audio](#voice-and-audio).
> A window pointed at a server can also **edit a deployed agent** and **delete its runs**, both
> of which change or destroy something on a machine that isn't this one — see
> [Pointing it at a server](#pointing-it-at-a-server).

> **New in 0.9:** this app can be **pointed at a server** — which means it now holds
> credentials for machines other than this one, and can start work on them. See
> [Pointing it at a server](#pointing-it-at-a-server).

> **From 0.8:** a **scenario** can carry work across several agents and systems in one
> unattended pass, with values from one system typed into the next. See
> [Processes that run themselves](#processes-that-run-themselves).

> **From 0.7:** SimpleClaw can run as a **headless server**, usually in a container, with
> its API reachable over the network rather than only from this machine. That is a different
> threat model from everything else on this page — see
> [Running it as a server](#running-it-as-a-server).

> **New in 0.4:** a local **Agent API** lets another program tell SimpleClaw to operate this
> computer. Read [Letting another program drive it](#letting-another-program-drive-it) before
> you use it — it hands the keys to software rather than to a person.

> **New in 0.4.2:** an agent can be given **REST API access** — permission to call an
> HTTP API directly instead of clicking through its interface. This is off by default,
> and it is the first feature that lets SimpleClaw send data somewhere other than your
> model endpoint. See [Agents that call an API](#agents-that-call-an-api).

> **From 0.3:** an agent can run in a **headless browser** instead of on your real
> screen, and it **stays signed in** to that site between runs (always, from 0.10). That
> removes some risks and adds a different one — see
> [Headless-browser agents](#headless-browser-agents).

---

## Built-in guardrails

- **Dry run (default ON)** — SimpleClaw shows the planned actions without
  clicking or typing anything. Nothing happens for real until you turn it off.
- **Emergency stop — `F9`** — a global shortcut that aborts the run immediately,
  **even when SimpleClaw is not the focused window**. The **Stop** button does
  the same when SimpleClaw is in front.
- **Step delay** — the pause after every action (0.5 s by default) gives you time to
  react and hit `F9`.
- **Max steps** — the run stops after a set number of actions (30 by default) so it
  can't loop forever.
- **Scope** — an agent can be confined to a **single window**, or to a **headless
  browser** sealed to one site, instead of having your whole desktop available.
- **REST access is off, empty, and read-only until you say otherwise** — an agent gets
  no API tool at all until you both switch it on and name the hosts it may call, and
  even then it can only read (`GET`) unless you allow writes.

## Safe-use habits

- Do your first runs on a **disposable window** — a scratch document, not real
  work.
- **Keep a hand near `F9`** whenever Dry run is off.
- **Do not** run SimpleClaw with sensitive material open — banking, financial
  sites, confidential documents, or anything you can't afford to have altered.
- Watch the timeline as it goes and stop the moment it heads somewhere wrong.
- Prefer small, specific goals you can verify over broad, open-ended ones.
- **Only schedule tasks you've already watched succeed.** A
  [scheduled run](user-guide.md#running-a-task-later-scheduling) starts with nobody
  present: it takes your real mouse and keyboard at that moment, whatever else you were
  doing, and there's no one to press `F9`. Prefer a **headless-browser** agent for
  scheduled work, keep the goals narrow, and check the run afterwards in **Run history**
  (scheduled runs carry the **Schedule** label).
- **The same goes double for a batch.** The
  [batch command](user-guide.md#running-more-than-one-task-at-once) starts a whole list
  unattended, and with the **Runs** limit above 1, several at the same time — so a bad goal
  is repeated rather than caught. Use `--list` to check what will run before you commit to
  it, `--timeout` so nothing can grind on indefinitely, and headless-browser agents rather
  than ones that take your real screen (batch refuses to run those in parallel at all, but
  it will still run them one at a time if you pass `--allow-desktop`).

## Headless-browser agents

An agent scoped to a **headless browser** is safer in the obvious way and riskier in
one specific way. Both are worth understanding before you point one at a real system.

**What it removes**

- **Your screen and mouse are never touched.** Nothing can click the wrong window,
  steal focus, or type into whatever you happened to be doing.
- **It's confined to one site.** The agent starts at a URL you choose and navigation
  outside that origin is sent back, so it can't wander off onto other sites.
- **`F9` still stops it**, and Dry run still applies.

**What it adds**

- **A signed-in agent acts as you.** Once you've signed one in, it operates the site with
  your account's full authority — every button your user can press, it can press. From
  0.10 every browser agent keeps its session (it's no longer a checkbox), so only sign one
  in where that is acceptable, and prefer an account with the least access that still does
  the job. **Sign out** on the Scope tab ends it.
- **Site sealing is a backstop, not a sandbox.** Navigation away from the allowed
  origins is *reversed after the fact* rather than blocked at the network level, and
  the browser runs on your own computer with your own network access. Treat it as a
  guard rail against wandering, not as isolation from a hostile page.

**What happens to your credentials**

- You type them into a **real browser window** that SimpleClaw opens for you
  (**Scope → Log in once**). They do **not** pass through SimpleClaw, and they are
  **never sent to the AI model** — the model only ever sees pictures of the page.
- What persists is the **session** the browser stored, in a profile folder belonging
  to that agent, protected by your operating-system user account like any other
  browser profile. **Sign out** deletes it.
- The AI model *does* see whatever the signed-in pages show — customer records,
  invoices, anything on screen. That is the same consideration as any other scope:
  only run it where sending those images to your model provider is acceptable.
- The profile is tied to this computer and user account and can't be copied to
  another machine.

**Taking over**

While a headless-browser run is live you can **take control** and drive the page
yourself — for a login, a two-factor code, or to unstick it. The agent is paused for
as long as you hold control, but it only yields **after the step it was already
performing**, so one last action may land as you take over. Control returns to the
agent only when you explicitly hand it back (**Hand back** or `Esc`), never because
your mouse left the panel.

## Agents that call an API

*New in 0.4.2.* An agent can be granted **REST API access**: one tool that fetches from
an HTTP API directly, instead of opening the site and reading values off the screen. It
is configured per agent, on that agent's page under **Planner → API access** *(its own page
from 0.12; before that, under MCP Servers)*.

**The site the agent is already on is a separate question — and a smaller one.** *New in
0.12.* A headless-browser agent can call **its own site's** endpoints with `http_request`
without any of the configuration below. Nothing here governs it, and nothing needs to:

- The request is sent **from inside the open page**, so it is authenticated by the session
  the run is already signed in with. There is no credential to store, and none is attached.
- It reaches only the origins the run may **navigate** to — the same seal, checked the same
  way. Off-seal is refused, and the agent is told why.
- It is **less** authority than the click it replaces, not more. The agent can already press
  any button on those pages, and those buttons call this same API.
- Replies are **truncated** before the model reads them, so a large response cannot crowd
  out the task.

Stated plainly: a page that can talk the agent into an action can talk it into an
`http_request` too. What that buys is an action on the site the agent is already working —
one it could have performed by clicking — which is why the origin seal, rather than a second
allowlist, is the control that matters here. Everything below is about a *different* risk:
reaching a host the run is **not** on.

**From 0.11, prefer saved requests.** An agent can be pointed at collections in
[Web APIs](web-apis.md) and call those requests **by name**, supplying only the variables each
one declares. The safety difference is the whole point: the ad-hoc tool hands the model a URL
field, and the model fills it in after reading a screen full of text nobody at your
organization wrote. A saved request has no destination to steer — the worst an injected
instruction achieves is calling something you already sanctioned, with different values.
Everything below still applies underneath it, because *what may be called* and *where we may
go* are different questions and neither answers the other.

It is per agent on purpose. Which system an agent may reach — and whose credentials it
carries — belongs to that agent's job. A scheduling agent and a billing agent reach
different systems, and neither should be holding the other's token.

**Why this needs care.** The agent decides what to fetch by reading its screen, and that
screen shows text SimpleClaw did not write: web pages, ticket bodies, email. Text like
that can try to talk the agent into making a request you never wanted. The protections
are therefore about limiting the damage such an instruction could do:

- **A host allowlist you write yourself.** The agent can only call hosts you name. An
  empty list means it gets no tool at all — not "everything allowed". The list is
  re-checked on every redirect, so a page cannot bounce the agent somewhere else.
- **Reads only, by default.** `POST`/`PUT`/`PATCH`/`DELETE` need a separate switch.
- **Credentials the model never sees.** Tokens are stored with the agent and attached to
  the request by SimpleClaw itself, so they are not in the AI model's prompt and not in
  the saved history of a run. They are also dropped if a redirect leads to another host.
- **Bounded responses.** A reply is truncated before the agent reads it, so a huge
  response cannot crowd out the task the agent was given.
- **Internal addresses stay out of reach.** Cloud metadata and other link-local
  addresses are always refused, even if something resolves to them.

**What to decide before enabling it:**

- List the **narrowest hosts** that do the job, not a whole domain, and prefer
  `api.example.com` over `*.example.com`.
- Use a **dedicated credential with the least access** the task needs — a read-only key
  where you can get one.
- Leave **writes off** unless the agent's job genuinely is to change data.
- Remember the token is **stored unencrypted** with the agent, the same as your model API
  key (see [Privacy and data handling](#privacy-and-data-handling)).

## Credentials in an API workspace

*New in 0.11.* A [Web APIs](web-apis.md) workspace is a folder of plain files, usually a git
repository shared with colleagues — so the question that governs its design is what must never
end up in it.

- **A file holds the name of a credential, never the value.** `{{secret:STAGING_TOKEN}}` is
  what gets committed; the value is looked up when the request is sent.
- **Values live outside the repository.** Either in the environment
  (`AUTOPLAY_SECRET_STAGING_TOKEN`, or `…_FILE` pointing at a mounted file — how a container
  or CI job supplies one) or in this machine's OS-encrypted credential store, in the app's own
  data folder. The environment wins, so an operator can override a laptop's saved copy without
  editing anything. If the OS has no credential store, saving **fails** and names the variable
  to set instead — there is no cleartext fallback.
- **Every commit is scanned first, and a finding refuses it.** Known token shapes,
  credential-looking fields holding a literal, and high-entropy strings. It is not a setting
  and cannot be switched off: a push cannot be undone, and rotating the credential is the only
  remedy — if anyone notices.
- **An imported Postman export is archived with its credentials stripped**, and says so in the
  file. Exports carry tokens in the clear; keeping one verbatim would defeat everything above.
- **A copied code snippet reads the credential from the environment** rather than embedding
  it, so the snippet you paste into a ticket is not a leak.
- **Requests are sent to whatever host they name** — that is the tool's job, and a person
  pressing **Send** is the authority for it. The host allowlist exists for the *agent* path,
  where a model chose to make the call. Point a workspace at production deliberately, and use
  `--read-only` when a CI run only needs to look.

## Scripts in an API workspace

*New in 0.11.4.* A request can carry Postman **pre-request** and **post-response** scripts,
and SimpleClaw runs them. This is the one place in the product where code someone else wrote
executes on your computer without you having written or approved it line by line, so it gets
its own section.

**What is actually true**

- **The code arrives the way the requests do.** A workspace is a git repository. **Get
  changes** can bring in a script a colleague wrote — or one that came along in a collection
  they exported from somewhere else and imported here. An import from a Postman export brings
  scripts in verbatim.
- **The isolation is against accidents, not intent.** Scripts run in a fresh JavaScript
  context with no `require`, no `process`, no `fetch`, no timers, no access to the app's own
  code, and a 2-second limit. That stops a runaway loop and a typo. It does **not** stop a
  script that is trying to get out: reaching the host from inside Node's `vm` is a documented
  property of the runtime. A hostile script gets what a Node program run as you gets.
- **So the defence is that you read it.** Scripts are stored as ordinary `.js` files beside
  their request, precisely so they show up in a diff with syntax highlighting and can be
  commented on line by line. Review them like the rest of the pull request.
- **Nothing about a script reaches a model or spends a token.** The API path has no model on
  it, and a test fails the build if one ever appears.
- **A script is not run where a human didn't ask for it.** An **agent** calling a saved
  request never runs its scripts — otherwise granting a collection to an agent would be
  granting arbitrary code execution to something that reads its instructions off web pages.
  The CI runner (`npm run apitest`) doesn't run them either. Scripts run on **Send** and in a
  **scenario step** you built.
- **`pm.environment.set` writes into a committed file.** The value lands in the selected
  environment, so a token a script stores there will be caught by the pre-commit secret scan
  — which is the scan working, not failing. Use `{{secret:NAME}}` for anything real.

**Habits that fit the design**

- Skim the `.js` files in any workspace you clone, and in any collection you import, before
  you press Send. `git log -p -- '*.js'` over a workspace is a short read.
- Prefer **Capture** and **Tests** where they'll do. They're deterministic, they run in CI and
  under an agent, and there is no code to trust.
- Treat "who can push to this repository" as the access control it is. It always governed
  which URLs the suite would call; now it governs which code your machine will run.

## Processes that run themselves

*New in 0.8.* A [scenario](user-guide.md#running-a-whole-process-scenarios) runs several steps
in a row, across several agents, from one press of Run — or from a schedule, with nobody
there. The individual steps are ordinary runs with the usual brakes; what's new is the chain.

**What the design already does for you**

- **It stops at the first failure.** Every step is judged against its success criterion, and
  a step the judge rejects aborts the pass. The steps after it are recorded as skipped, not
  attempted — so a broken prerequisite can't feed a step that submits something.
- **It won't act on a value it never got.** A step that finishes without reporting a value it
  promised fails the pass, rather than letting the next step run with a literal
  `{{placeholder}}` in the text it types.
- **Unattended launches don't guess.** Started from a schedule or the API, a pass missing a
  value is refused rather than run without it. Only in the app — where a person is looking —
  is there a "run anyway".
- **Each step is a separate run in history**, replayable frame by frame, so an odd result is
  traceable to the step that caused it.

**What to weigh before saving one**

- **A pass is a chain of real actions.** Judge it by what the *whole* sequence can do, not by
  the worst single step. The riskiest step should be one you'd be comfortable running
  unattended on its own.
- **Values cross systems.** A reference read from one application is typed into another —
  that's the point, and it also means a scenario moves data between systems on a schedule.
  Check that hand-off is one your organization is happy with.
- **Aborting mid-pass leaves partial work.** Steps already completed have happened; nothing
  is rolled back. Prefer an order that puts the irreversible step last, and read the pass
  record before re-running rather than starting again from step 1.
- **Never write a password into a step.** Step text is stored in the scenario and in every
  pass record. Let the agent use the sign-in
  [a human gave it once](user-guide.md#staying-signed-in).

## Letting another program drive it

*New in 0.4.* SimpleClaw exposes a local [Agent API](agent-api.md), letting another program —
typically another AI agent — hand it work. Nothing uses it until you point something at it,
but be clear about what is reachable once you do.

**What protects it**

- **Local only.** In the desktop app the interface listens on `127.0.0.1`. It is not
  reachable from your network, and there is no remote mode to misconfigure. (Running it
  deliberately as a [server](#running-it-as-a-server) is the exception, and a separate
  decision.)
- **A fresh token each launch**, written to a file inside SimpleClaw's own user-data folder.
  Software that cannot read your files cannot drive it.
- **A caller cannot widen an agent's reach.** It may only use agents that already exist, and
  it cannot set a start URL, a scope, or a sign-in. Those stay yours to decide.
- **All the usual brakes still work.** `F9` stops a run whoever started it, and Dry run,
  step delay, and max steps remain the agent's own settings.

**What it costs you**

- **Any program running as you can use it.** File permissions and a loopback socket are the
  whole boundary; there is no per-caller approval prompt. Any program on your account that
  can read your files can do anything one of your agents can do.
- **A signed-in browser agent is the sharp edge.** A caller can drive it with your account's
  full authority on that site — the same risk as
  [staying signed in](#headless-browser-agents), now reachable by software.
- **The caller's model sees the outcome.** SimpleClaw reports the agent's closing answer
  back, so whatever the agent read on screen to answer with can end up at the caller's
  model provider, not only yours.
- **Runs are unattended by nature.** Nobody is watching each step, so prefer agents scoped
  to a **single site or window** for this, keep those accounts to the least access that
  does the job, and check the run history afterwards — every run submitted this way is
  recorded and replayable like any other.

**Habits worth keeping**

- Point callers at agents whose worst possible action you can live with.
- Quit SimpleClaw when you're not using it: no app, no interface — the published port and
  token file go away with it.
- Never put a password into a task you send in — goal text is stored in run history. Let the
  agent use the sign-in [a human gave it once](user-guide.md#staying-signed-in) instead.
- **Don't have a caller retry a failed run to "try again".** SimpleClaw won't retry on its
  own for the same reason: a resubmitted form is a real duplicate on the far end.

## Running it as a server

*New in 0.7.* SimpleClaw can run [headless](server-mode.md) — no window, nobody at the
keyboard — with its API reachable over the network. Most of this page assumes a person is
present and can hit `F9`. Here nobody is, so read this before deploying one.

**What's different, in your favour**

- **It can't touch a real desktop.** Only headless-browser agents run in server mode, and a
  desktop- or window-scope agent is refused rather than allowed to click into a blank virtual
  screen. The blast radius is the sites the agents are sealed to.
- **No secret at rest.** Model keys and sign-in credentials come from the environment or a
  mounted secret file, and agent files are held read-only so an injected key can't be written
  back into one.
- **The model still never sees a credential.** Sign-in works through a tool whose only
  parameter is the *name* of a secret; the value is absent from the prompt, the model's
  arguments, the recorded step, and the event stream.
- **Every run is still recorded** and replayable, exactly like one started by hand.

**What's different, against you**

- **The boundary is now a credential, not your login.** In the desktop app the protection is
  that a caller must already be running as you on your machine. On a server it's whatever
  token or JWT you configured, and anything that can reach the port. Configure it properly:
  [Authentication](server-mode.md#authentication).
- **Don't put it on the public internet bare.** It authenticates callers; it does not rate
  limit, filter, or absorb abuse. Put it behind whatever fronts your other services.
- **A signed-in agent acts with a real account's authority**, unattended, whenever a caller
  asks. Give those accounts the least access that does the job — this is the same sharp edge
  as [staying signed in](#headless-browser-agents), now available to software around the
  clock.
- **Nobody sees a run go wrong.** There is no `F9` and no one watching the frames. Prefer
  agents whose worst possible action you can live with, and read the history.
- **Live links are shareable by design.** A run's link lets whoever holds it watch that run,
  drive its browser during takeover, and end it — without your API credential. That is the
  point (it's how a person gets past an MFA prompt), but treat the link as sensitive while
  the run is alive, and don't set a public URL for an executor that shouldn't be reachable.
- **Chrome runs without its sandbox** in the container, because container kernels generally
  forbid the privileges it needs. The compensating controls are a non-root user, the origin
  seal on the agent's browser, and a scrubbed environment at browser launch — real, but not
  the same as the sandbox.

## Pointing it at a server

*New in 0.9.*

Registering a server in **⚙ Settings → Run servers → Remote servers** makes this app a client of
that deployment: it can watch what the server is doing, start runs and scenario passes on it, arm
and cancel its schedules, upload agents to it, and — from 0.10 — edit a deployed agent's config
and delete its runs. See
[Pointing it at a server](user-guide.md#pointing-it-at-a-server) for how it works. Five things
that follow, worth deciding before you register production:

- **Your machine now holds production credentials.** Each entry's bearer token is stored in the
  app's configuration in plain text, the same as your model API keys, readable by anything
  running as you. A laptop that can reach staging and production is now as sensitive as those
  servers are.
- **Starting a remote run is a real action on a real system,** taken from a window that looks
  identical whichever machine it's pointed at. That's why the title bar names the machine at all
  times and in a colour that stands out — but the safeguard is attention, not a confirmation
  dialog. Check the picker before you press Run.
- **Uploading an agent puts new software in front of your sites.** From 0.10 the route needs
  nothing switched on (`AUTOPLAY_ALLOW_AGENT_IMPORT` was removed), so the bearer for a server is
  what decides who may do it. An upload still creates rather than overwrites unless it asks to,
  so it can't silently replace something mid-run.
- **Editing a deployed agent changes what runs unattended** *(0.10)*. A window pointed at a
  server can rewrite that agent's persona, its start URL or its model endpoint, and the next
  scheduled run uses the new version — with nobody watching. Its **secrets never travel**: keys,
  phone credentials and the enrolled voiceprint are blanked on the way out, and a blank coming
  back is treated as unchanged rather than as a deletion. Where an operator wants the files
  themselves declared off limits, `AUTOPLAY_AGENTS_READONLY=1` on the server refuses edits.
- **Deleting a run destroys evidence** *(0.10)*. The record, its screenshots and its benchmark
  rows go, with no undo — and on a deployment, that history is often the only account of what an
  agent did. Supervised demonstrations need an explicit confirmation (typing *Yes*) because the
  planner learns from them; unfinished runs are refused. If the record matters for audit, keep a
  copy somewhere the server's bearer cannot reach.
- **The reach is still narrow.** Nothing here rewrites what a finished run *says*, an agent's
  files (skills, functions, demonstrations, browser profile) stay on the machine that holds them,
  the server accepts calls only from origins it names in `AUTOPLAY_CORS_ORIGINS` (there is no
  wildcard), and a live run link carries no bearer — it authorises that one run and nothing else.

## Voice and audio

*New in 0.10.*

Speech is optional and off until you use it, but a microphone is a different kind of input from
a screenshot, so it's worth being precise about when audio leaves the machine.

- **Nothing is captured until you ask.** Dictation opens the microphone when you click the mic
  button and closes it when you click again. Hands-free listening only runs while **Voice wake**
  is enabled and started.
- **Wake-word spotting is local.** The word itself is detected on this computer, so with
  hands-free listening on, audio is *not* streamed anywhere until you have actually said it.
- **After that, audio goes to the endpoint you configured** — the **Speech in** address on the
  agent's Voice tab — to be transcribed, and the text of a spoken reply goes to **Speech out** to
  be synthesized. These are your endpoints, the same as your model endpoint; if you leave the API
  key blank they reuse your model key on the same host, which means the same provider hears it.
- **Post-edit sends the transcript to a model.** With it on, each finished sentence gets one
  short model pass to repair misrecognitions — so the text (not the audio) reaches your model
  endpoint too.
- **A voiceprint never leaves the machine.** The recording you enroll for **Owner voice only** is
  reduced to an embedding, stored in that agent's config on this computer, and compared here. It
  is biometric data, and it is excluded from agent exports and from anything the control API
  hands out.
- **What is transcribed becomes a task.** A dictated sentence is a goal like any other, and a
  wake-word sentence can steer a run that is already in progress. Treat an open microphone near
  other people the way you would treat an open goal bar.

## Privacy and data handling

- **Screenshots go to your AI model.** To decide each action, SimpleClaw sends an
  image of the agent's surface — your monitor, the chosen window, or its headless
  browser page — to the model endpoint you configured. Only run it when what's on
  that surface is acceptable to send to that provider.
- **Your API key is stored locally** on your computer in the app's configuration.
  It is **not encrypted**, so:
  - use a key **dedicated to this app**, and
  - protect physical and account access to your machine.
  Any **API credentials** you give an agent for [REST access](#agents-that-call-an-api)
  are stored the same way — unencrypted, in that agent's own folder.
- **SimpleClaw has no backend of its own.** It never reports to a server we run. The only
  places your data goes are ones you configure:
  - the **model endpoint** you set, which receives the screenshots and the task;
  - any **API host you allowlist** for an agent, if you turn on REST access (0.4.2+) —
    including the request bodies that agent sends;
  - the **site an agent works on**, for a headless-browser agent;
  - the **speech endpoints** you set, if you use voice (0.10+) — see
    [Voice and audio](#voice-and-audio);
  - any **server you register** and point the window at (0.9+), which receives whatever you
    start, upload or delete there.

  Nothing else. With none of those turned on, the model endpoint is the only destination.

## If something goes wrong

- Press **`F9`** to stop instantly.
- Turn **Dry run** back ON while you reconsider the goal.
- If actions were taken you didn't want, undo them in the affected app as you
  normally would (e.g. Ctrl+Z), then refine your goal and try again in dry-run.
