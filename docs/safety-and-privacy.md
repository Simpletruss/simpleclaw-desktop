# Safety & privacy

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Plugins](plugins.md) · [Troubleshooting](troubleshooting.md)

> **Applies to SimpleClaw 0.2.x** (current release). On an older build? Read the
> [0.1.x docs](https://github.com/Simpletruss/simpleclaw-desktop/tree/v0.1.2/docs) ·
> every version is listed on [Releases](https://github.com/Simpletruss/simpleclaw-desktop/releases).

SimpleClaw controls your real mouse and keyboard and sends pictures of your
screen to an AI model. Please read this page before using it on real work.

---

## Built-in guardrails

- **Dry run (default ON)** — SimpleClaw shows the planned actions without
  clicking or typing anything. Nothing happens for real until you turn it off.
- **Emergency stop — `F9`** — a global shortcut that aborts the run immediately,
  **even when SimpleClaw is not the focused window**. The **Stop** button does
  the same when SimpleClaw is in front.
- **Step delay** — the pause between actions (about 0.8 s by default) gives you
  time to react and hit `F9`.
- **Max steps** — the run stops after a set number of actions (about 30 by
  default) so it can't loop forever.

## Safe-use habits

- Do your first runs on a **disposable window** — a scratch document, not real
  work.
- **Keep a hand near `F9`** whenever Dry run is off.
- **Do not** run SimpleClaw with sensitive material open — banking, financial
  sites, confidential documents, or anything you can't afford to have altered.
- Watch the timeline as it goes and stop the moment it heads somewhere wrong.
- Prefer small, specific goals you can verify over broad, open-ended ones.

## Privacy and data handling

- **Screenshots go to your AI model.** To decide each action, SimpleClaw sends an
  image of your primary display to the model endpoint you configured. Only run it
  when what's on screen is acceptable to send to that provider.
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
