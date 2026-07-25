# Safety & privacy

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Plugins](plugins.md) · [Troubleshooting](troubleshooting.md)

> **Applies to SimpleClaw 0.3.x** (current release). On an older build? Read the
> [0.2.x docs](https://github.com/Simpletruss/simpleclaw-desktop/tree/v0.2.0/docs) ·
> [0.1.x docs](https://github.com/Simpletruss/simpleclaw-desktop/tree/v0.1.2/docs) ·
> every version is listed on [Releases](https://github.com/Simpletruss/simpleclaw-desktop/releases).

SimpleClaw controls your real mouse and keyboard and sends pictures of your
screen to an AI model. Please read this page before using it on real work.

> **New in 0.3:** an agent can run in a **headless browser** instead of on your real
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

## Privacy and data handling

- **Screenshots go to your AI model.** To decide each action, SimpleClaw sends an
  image of the agent's surface — your monitor, the chosen window, or its headless
  browser page — to the model endpoint you configured. Only run it when what's on
  that surface is acceptable to send to that provider.
- **Your API key is stored locally** on your computer in the app's configuration.
  It is **not encrypted**, so:
  - use a key **dedicated to this app**, and
  - protect physical and account access to your machine.
- SimpleClaw talks only to the model endpoint you set. It has no other backend
  and sends your data nowhere else.

## If something goes wrong

- Press **`F9`** to stop instantly.
- Turn **Dry run** back ON while you reconsider the goal.
- If actions were taken you didn't want, undo them in the affected app as you
  normally would (e.g. Ctrl+Z), then refine your goal and try again in dry-run.
