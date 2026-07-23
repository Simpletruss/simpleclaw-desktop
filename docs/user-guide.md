# SimpleClaw — User guide

[← Docs home](index.html) · [Getting started](getting-started.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md)

The complete manual for SimpleClaw 0.1.x (Windows, macOS, and Linux).

---

## Table of contents

1. [What SimpleClaw is](#what-simpleclaw-is)
2. [How it works](#how-it-works)
3. [The interface](#the-interface)
4. [Running a task](#running-a-task)
5. [Writing good goals](#writing-good-goals)
6. [Action types](#action-types)
7. [Settings reference](#settings-reference)
8. [Current limitations](#current-limitations)
9. [Glossary](#glossary)

---

## What SimpleClaw is

SimpleClaw turns a plain-language request into real actions on your computer.
Instead of clicking through an app yourself, you tell SimpleClaw the outcome you
want — *"open Notepad and type today's date"* — and it operates the screen for
you.

It is a general-purpose **screen agent**: it works with whatever is visible on
your display rather than plugging into any one program. Because it sees the
screen the way you do, it isn't limited to a fixed list of supported apps.

SimpleClaw does **not** think on its own. Every decision comes from a
vision-language AI model that you connect it to. SimpleClaw is the "hands and
eyes"; the model is the "brain".

## How it works

Each task runs as a loop:

```
your goal ─► take a screenshot ─► ask the AI model for the next action
     ▲                                            │
     │                                            ▼
     └──────── repeat until "finished" ◄──── perform the action (mouse/keyboard)
```

1. **You enter a goal** and press Run.
2. **SimpleClaw captures your screen** (the primary display) as an image.
3. **The image and your goal are sent to the AI model**, which replies with a
   short reasoning ("Thought") and a single next **Action**.
4. **SimpleClaw performs that action** on your real mouse/keyboard — unless
   **Dry run** is on, in which case it only shows what it *would* do.
5. The loop repeats until the model decides the task is **finished** or a limit
   or stop is reached.

## The interface

- **Goal bar** — where you type what you want done, with **Run** and **Stop**.
- **Dry run toggle** — plan-only vs. act-for-real. On by default.
- **Screenshot view** — the current capture, with a **marker** showing where the
  model is about to act.
- **Action timeline** — a running list of each step: the model's short reasoning
  and the action it chose.
- **⚙ Settings** — model connection and behavior options.

## Running a task

1. **Type your goal** in the goal bar.
2. Make sure the target app/window is **open and visible** on your primary
   display.
3. Keep **Dry run** ON for the first attempt and press **Run**.
4. **Watch the timeline and the screenshot marker.** In dry-run nothing is
   actually clicked or typed.
5. When satisfied, turn **Dry run** OFF and press **Run** again.
6. **Stop any time** with **`F9`** or the **Stop** button.

The run ends when the model reports **finished**, when you stop it, or when it
reaches the **maximum steps** limit.

## Writing good goals

- **Be specific about the outcome.** "Open Notepad, type 'hello world', and save
  it as note.txt on the Desktop" beats "make a note".
- **Name the target.** "In the open Excel sheet…" tells the model where to work.
- **One task at a time.** Break large jobs into smaller runs you can verify.
- **Set the stage.** Have the relevant window open and visible before you run.
- **Avoid ambiguity.** If several items look alike, describe which one ("the blue
  *Submit* button at the bottom").

## Action types

On each step the model chooses **one** action:

| Action | What it does |
|--------|--------------|
| `click` | Single left-click at a target point. |
| `left_double` | Double-click (e.g. to open an item). |
| `right_single` | Right-click (context menus). |
| `drag` | Press, move, and release — drag from one point to another. |
| `hotkey` | Press a keyboard shortcut (e.g. Ctrl+S). |
| `type` | Type a string of text. |
| `scroll` | Scroll the view up or down. |
| `wait` | Pause briefly (e.g. to let something load). |
| `finished` | Declare the task complete — this ends the run. |

SimpleClaw performs exactly one action per loop, so complex tasks complete as a
sequence of small, visible steps.

## Settings reference

| Setting | Controls | Notes |
|---------|----------|-------|
| **Base URL** | Your AI model's API endpoint | OpenAI-compatible `/v1/chat/completions`. Required. |
| **API key** | Authentication for the endpoint | Required. Stored locally on your machine. |
| **Model name** | Which vision model to use | Must be vision-capable. Required. |
| **Dry run** | Plan-only vs. act-for-real | **On by default.** On = show without executing; Off = actually control input. |
| **Step delay** | Pause between actions | Default about 0.8 seconds. Longer = easier to watch and interrupt. |
| **Max steps** | Cap on actions per run | Default about 30. Stops runaway loops; increase for longer tasks. |

> Exact labels and defaults may vary slightly by version; values reflect
> SimpleClaw 0.1.x.

## Current limitations

SimpleClaw 0.1.x is an early release:

- **Primary display only** — it captures and acts on your main monitor.
- **No built-in browser or remote-machine control** — it drives the local screen.
- **No saved run history** — past runs aren't kept across app restarts.
- **No auto-update** — install new versions manually from Releases.
- **Desktop only** — available for Windows, macOS, and Linux (no mobile builds).

## Glossary

- **Agent / screen agent** — software that perceives the screen and acts on it to
  reach a goal.
- **Vision-language model** — an AI model that understands both images and text;
  it "sees" the screenshot and returns the next action.
- **Endpoint / Base URL** — the network address of your AI model's API.
- **Dry run** — a mode that shows planned actions without performing them.
- **Action** — a single operation (click, type, scroll, …) chosen each step.
- **Step** — one iteration of the loop: screenshot → action.
