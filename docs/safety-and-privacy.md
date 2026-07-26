# Safety & privacy

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Agent API](agent-api.md) · [Plugins](plugins.md) · [Troubleshooting](troubleshooting.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/safety-and-privacy.html)
> labels each page with its release and can switch between versions.

SimpleClaw controls your real mouse and keyboard and sends pictures of your
screen to an AI model. Please read this page before using it on real work.

> **New in 0.4:** a local **Agent API** lets another program tell SimpleClaw to operate this
> computer. Read [Letting another program drive it](#letting-another-program-drive-it) before
> you use it — it hands the keys to software rather than to a person.

> **New in 0.4.2:** an agent can be given **REST API access** — permission to call an
> HTTP API directly instead of clicking through its interface. This is off by default,
> and it is the first feature that lets SimpleClaw send data somewhere other than your
> model endpoint. See [Agents that call an API](#agents-that-call-an-api).

> **From 0.3:** an agent can run in a **headless browser** instead of on your real
> screen, and it can **stay signed in** to that site between runs. That removes some
> risks and adds a different one — see
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

- **A signed-in agent acts as you.** If you use **Stay signed in between runs**, the
  agent operates the site with your account's full authority — every button your user
  can press, it can press. Only enable it for sites where that is acceptable, and
  prefer an account with the least access that still does the job.
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
is configured per agent, on that agent's page under **Planner → Tools**.

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

## Letting another program drive it

*New in 0.4.* SimpleClaw exposes a local [Agent API](agent-api.md), letting another program —
typically another AI agent — hand it work. Nothing uses it until you point something at it,
but be clear about what is reachable once you do.

**What protects it**

- **Local only.** The interface listens on `127.0.0.1`. It is not reachable from your
  network, and there is no remote mode to misconfigure.
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
  - the **site an agent works on**, for a headless-browser agent.

  Nothing else. If you have not enabled REST access, the model endpoint is the only
  destination.

## If something goes wrong

- Press **`F9`** to stop instantly.
- Turn **Dry run** back ON while you reconsider the goal.
- If actions were taken you didn't want, undo them in the affected app as you
  normally would (e.g. Ctrl+Z), then refine your goal and try again in dry-run.
