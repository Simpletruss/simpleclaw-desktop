# SimpleClaw — Android devices

[← Docs home](index.html) · [Getting started](getting-started.md) · [User guide](user-guide.md) · [Records & watchdogs](records-and-watchdogs.md) · [Web APIs](web-apis.md) · [Agent API](agent-api.md) · [Server mode](server-mode.md) · [Cluster](cluster.md) · [Functions](functions.md) · [Safety & privacy](safety-and-privacy.md) · [Troubleshooting](troubleshooting.md) · [Release notes](release-notes.md)

> **Version note.** This file is the copy in whatever branch or tag you're browsing.
> The [docs site](https://simpletruss.github.io/simpleclaw-desktop/android-devices.html)
> labels each page with its release and can switch between versions.

**New in 0.16.** An agent can drive an **Android device** — an emulator in a container, or a
phone plugged into the machine running SimpleClaw. It is a fourth
[scope](user-guide.md#where-the-agent-works-scope), alongside Entire desktop, Specific window
and Sealed browser.

The agent sees the device's screen and acts on it by touch: taps, swipes, the Back and Home
keys, typing into the field it has focused. Your own screen and mouse are never involved,
so — like a sealed browser and unlike a desktop-scope agent — a run can happen while you
carry on working, and it can happen on a server with no screen at all.

---

## Table of contents

1. [What you need](#what-you-need)
2. [Step 1 — get `adb`](#step-1--get-adb)
3. [Step 2 — get a device](#step-2--get-a-device)
4. [Step 3 — point an agent at it](#step-3--point-an-agent-at-it)
5. [Step 4 — run your first task](#step-4--run-your-first-task)
6. [How the agent operates a phone](#how-the-agent-operates-a-phone)
7. [Preparing the device](#preparing-the-device)
8. [Setting the device up by hand (the device console)](#setting-the-device-up-by-hand-the-device-console)
9. [In server mode](#in-server-mode)
10. [What this scope does *not* do](#what-this-scope-does-not-do)
11. [Troubleshooting](#troubleshooting)

---

## What you need

Two things, and they are independent:

- **`adb`** — the Android Debug Bridge command-line tool, on the machine running SimpleClaw
  (the *executor*). This is how SimpleClaw talks to the device.
- **A device** — an emulator, or a real phone. It does not have to be on the same machine;
  `adb` reaches devices over TCP.

The device is never "inside" SimpleClaw. It is a separate thing that SimpleClaw connects to,
which is why the same setup works for an emulator container, a phone on your desk, and a
device farm somewhere else.

---

## Step 1 — get `adb`

`adb` ships in Google's **platform-tools**, a self-contained zip — you do not need Android
Studio.

| Platform | Download |
|----------|----------|
| Windows | [platform-tools-latest-windows.zip](https://dl.google.com/android/repository/platform-tools-latest-windows.zip) |
| macOS | [platform-tools-latest-darwin.zip](https://dl.google.com/android/repository/platform-tools-latest-darwin.zip) |
| Linux | [platform-tools-latest-linux.zip](https://dl.google.com/android/repository/platform-tools-latest-linux.zip) |

Extract it anywhere. **You do not have to add it to `PATH`** — SimpleClaw looks for it in the
places an Android SDK normally lands:

1. `AUTOPLAY_ADB_PATH`, if you set it — an explicit path to the executable, which always wins
2. `adb` on `PATH`
3. `$ANDROID_HOME/platform-tools/` and `$ANDROID_SDK_ROOT/platform-tools/`
4. The per-platform default:
   - **Windows** — `%LOCALAPPDATA%\Android\Sdk\platform-tools\` (Android Studio) and
     `%LOCALAPPDATA%\Android\platform-tools\` (a bare zip)
   - **macOS** — `~/Library/Android/sdk/platform-tools/`
   - **Linux** — `~/Android/Sdk/platform-tools/`, then `/usr/lib/android-sdk/platform-tools/`

Neither Android Studio nor the platform-tools zip edits `PATH`, so "installed but invisible"
is the normal state on a desktop — hence the search. If it still isn't found, the error names
every location it tried, and `AUTOPLAY_ADB_PATH` is the override.

> **Server mode** needs none of this: the container image installs `adb` itself.

---

## Step 2 — get a device

### Option A — an emulator in a container

Good for unattended work: it is disposable, it is identical on every machine, and nobody has
to keep a phone charged and plugged in.

**It needs hardware virtualisation** — `/dev/kvm`. Check rather than assume:

```sh
docker run --rm --privileged alpine ls /dev/kvm
```

- **Linux** — present.
- **Windows 11 with the WSL2 backend** — **absent until the module is loaded**, then present. WSL2
  genuinely does nested virtualisation; what's missing is that Docker Desktop's own
  `docker-desktop` distro doesn't load `kvm_intel`/`kvm_amd` at boot, so `/dev/kvm` isn't there at
  all. One command fixes it:

  ```sh
  wsl -d docker-desktop -e sh -c "modprobe kvm_intel"   # kvm_amd on an AMD CPU
  ```

  **It does not survive a Docker Desktop or Windows restart**, so re-run it whenever you bring the
  emulator up. This is worth knowing rather than rediscovering: a machine that worked yesterday
  fails today with nothing a person can see having changed, and the emulator's own error names
  QEMU rather than a kernel module. If the distro reports neither `vmx` nor `svm` in
  `/proc/cpuinfo`, nested virtualisation is off altogether — check the BIOS/UEFI and
  `nestedVirtualization` in `%USERPROFILE%\.wslconfig`; a `modprobe` can't fix that one.
- **macOS** — absent, with nothing to load. Docker Desktop's VM exposes no KVM at all, so run the
  emulator outside Docker (Android Studio's own emulator is fine) and point SimpleClaw at it over
  TCP.
- Also absent on any machine with virtualisation disabled in firmware.

Without KVM an emulator falls back to full CPU emulation and takes minutes per screen, which
fails every timeout in the agent loop rather than merely running slowly. There is no useful
software fallback.

A minimal service:

```yaml
services:
  emulator:
    image: budtmo/docker-android:emulator_14.0
    privileged: true
    devices:
      - /dev/kvm
    environment:
      EMULATOR_DEVICE: 'Samsung Galaxy S10'
      WEB_VNC: 'true'
    ports:
      - '5555:5555'   # adb
      - '6080:6080'   # noVNC — watch the screen in a browser
```

**Cold boot takes minutes**, not seconds, and `adb` connections are refused for the whole of
it. SimpleClaw retries the connect across that window, so a run started too early waits rather
than failing — but the first boot after `up` is genuinely slow. Watch it come up at
<http://localhost:6080>.

### Option B — a real phone

1. On the phone: **Settings → About phone**, tap **Build number** seven times to unlock
   Developer options.
2. **Settings → Developer options → USB debugging**, on.
3. Plug it into the executor machine and accept the *Allow USB debugging?* prompt. Tick
   **Always allow from this computer**, or you will re-accept it on every reconnect.
4. Confirm the executor can see it:

   ```sh
   adb devices
   ```

Leave **Device address** empty for a USB phone — that field is only for devices reached over
TCP.

---

## Step 3 — point an agent at it

Open the agent, go to **Scope**, pick **Android device**, and press **Apply**. Opening the tab
only previews it; the ✓ marks the scope actually in force.

| Field | What to put in it |
|-------|-------------------|
| **Device address** | The device's `host:port`, for a device reached over TCP. Leave empty for a phone on USB. |
| **Device serial** | Which device, when the executor has several attached — the names `adb devices` prints. Leave empty when there is exactly one. |
| **Start app** | Opened at the start of every run. An app name (`Chrome`) or a package (`com.android.chrome`). Optional. |
| **Start URL** | Opened at the start of every run, after the start app, and **named to the model as where the work is**. Set this whenever the work lives in a web portal. |
| **Expected screen size** | A *check*, not a setting — see [below](#expected-screen-size-is-a-check). Leave empty. |

### Which host is the device on?

This is the one field people get wrong, because **the right answer depends on where the agent
runs, not on where the device is**:

| The agent runs… | Device address |
|-----------------|----------------|
| In the desktop app, emulator container on the same machine | `localhost:5555` — the port the container publishes |
| In a container, emulator as a sidecar on the same compose network | `emulator:5555` — the service name |
| In a container, emulator on the Docker host | `host.docker.internal:5555` |
| Anywhere, phone on USB | *(empty)* |

A compose service name does not resolve from the desktop app, and `localhost` inside a
container is that container itself.

`AUTOPLAY_ADB_HOST` sets the default for every phone agent on an executor, so one image can
serve whatever device a deployment happens to wire up. The per-agent field overrides it.

### Always set a Start URL for web work

If the agent's job lives in a web portal, **fill in Start URL**. Without it the model has
nowhere to learn the address, and a model told to work "in Tricon Residential" will construct
`tricon-residential.<something>.com` from the task's wording and navigate to a host that does
not exist. With it set, the address is opened before the first screenshot and stated to the
model as the only one it should use.

### Expected screen size is a check

Taps are sent in the device's own pixels and there is no second coordinate space to choose, so
this field cannot rescale anything. Filled in, it is compared against what the device reports
and the run is **refused** if they disagree — useful for catching a phone that rotated or an
emulator recreated from a different profile.

To actually change the resolution, change the device: `adb shell wm size 1080x2280` (plus
`wm density`, or the UI renders at the wrong scale).

**It is not the knob for how much detail the model sees.** That is
**Scope → Capturing → Capture size**. A 1440×3040 phone reaches the model as 606×1280 at the
default 1280 — fine for tapping, tight for small print. Raising it to 1920 gives 909×1920.

---

## Step 4 — run your first task

Start with something that needs no sign-in, so you are testing the plumbing and not the app:

> Open Settings and tell me the Android version.

Watch the run pane. The first screenshot should be the device's screen, and the step log opens
with a line naming what it bound to:

```
Scope: Android device localhost:5555 (1440x3040), opened at com.android.chrome → https://portal.example.com
```

If that line is there, `adb`, the device and the agent are all wired up correctly.

---

## How the agent operates a phone

The agent has the same action vocabulary as everywhere else; what changes is what each action
*means* on a touch screen.

| Action | On a phone |
|--------|-----------|
| **click** | A tap. |
| **left_double** | Two taps. |
| **right_single** | A **long press** — a touch screen has no second button, and long-press opens the same contextual menu a right-click does. |
| **move** (hover) | **Nothing.** There is no hover on a touch device. It is not an error: the model sees the screen unchanged and moves on. |
| **drag** | A swipe between the two points. |
| **scroll** | A swipe. Scrolling *down* moves the finger *up*, which is what reveals content further down. Swipes stay clear of the screen edges, where the system claims the gesture for the back-gesture or the notification shade. |
| **hotkey** | Device keys only: `back`, `home`, `recents`, `menu`, `enter`, `search`, `tab`, `escape`, `delete`, `space`, arrow keys, `power`, `wake`, `volume_up`, `volume_down`, `notifications`. **Desktop combinations like `ctrl c` do not exist** and are refused rather than silently ignored. |
| **type** | Types into the field the agent has already tapped. **ASCII only** — see below. |
| **launch_app** | Opens an app by name (`Chrome`) or package (`com.android.chrome`). The name is resolved against the apps actually installed on the device. |
| **open_url** | Hands the link to the device, which may open a browser or deep-link straight into an app. For a web page prefer this over launching a browser first. |

### Typing is ASCII-only

`adb` types by mapping each character to a key code, and anything outside ASCII silently
becomes nothing at all. Rather than let the model watch an empty field after a successful-looking
type — and try again forever — non-ASCII text is a **loud error**.

If you need other characters, install an IME such as **ADBKeyBoard** on the device, or design
the task to pick the value from the UI instead of typing it.

### App names are resolved against the device

`launch_app('Chrome')` works: the name is matched against the apps that actually appear in the
device's launcher. A package name works too and is never second-guessed.

If a name matches more than one app the run **reports the ambiguity** instead of picking one —
opening the wrong app would let the run carry on acting on a screen nobody expected. Name the
package exactly when that happens.

---

## Preparing the device

A device that a person has never used is not ready for an agent. Spend five minutes on it once
and every later run is shorter and steadier. Do it on the device itself if you can reach it, and
through the [device console](#setting-the-device-up-by-hand-the-device-console) if you can't.

- **Clear the first-run wizards.** Open the apps the agent will use and tap through their
  welcome screens yourself. Chrome's *"Welcome to Chrome — Add account to device"* page
  otherwise greets every single run.
- **Sign in where you can.** The session persists on the device, so the agent starts past the
  login. See [the limitation below](#what-this-scope-does-not-do) for why this matters more
  here than for a sealed browser — a phone agent can't fill a stored credential, so a sign-in
  you do once is the only sign-in there is.
- **Turn off anything that moves on its own.** Screen savers, animated wallpapers and
  auto-rotate all make the screen change under the agent.
- **Keep the screen awake.** *Developer options → Stay awake* while charging.
- **Emulator state lives in the container.** It survives a restart, but `docker compose down`
  and back up gives you a fresh device with all the wizards again. Use a volume, or expect to
  redo this.

---

## Setting the device up by hand (the device console)

All of the above needs **hands on the device** — and the device is usually not somewhere you can
walk up to. It's in a container, or in another region, and on a server there is no window to put
an emulator's own screen in. So the hands become **a link**.

Open the agent, **Scope → Android device**, press **Apply**, then **📱 Open device console…**.
A page opens in your browser showing the device's screen; your pointer and keystrokes go back to
it as taps, swipes and text. Install an app, sign into it, accept a permission dialog, trust a
certificate — **whatever you leave on the device is what the agent's next run starts from.** It is
the same device, not a copy.

It works the same whether the device is on this computer or on a server the window is
[pointed at](user-guide.md#pointing-it-at-a-server) — unlike a browser profile, which is a
directory on a disk and so has two different answers. A device is reached over TCP from wherever
the agent runs, so a link is the honest answer in both cases. From a script:

```sh
curl -X POST https://autoplay.example.com/v1/agents/work-order-bot/device-session \
  -H "Authorization: Bearer $AUTOPLAY_API_TOKEN"
# 201 {"session":{"id":"dev_…","agentId":"work-order-bot","serial":"emulator:5555",
#                "viewport":{"width":1080,"height":2340},"ready":true,"expiresAt":…},
#      "url":"https://autoplay.example.com/device/dev_…?t=…"}
```

The page names the **serial it actually bound**, which matters more here than for a browser
profile: one executor can reach several devices, and the address in an agent's scope is a request
rather than an answer — an empty one resolves against whatever happens to be attached. It also
gives you the three buttons a keyboard hasn't got: **‹ Back**, **Home** and **Recents**.

When you're done, press **Done — release the device** so a run can use it again.

What the console is, and is not:

- **It refuses while a task is running.** There is no lock that would stop two things driving one
  device the way Chrome's profile lock does, so a run and a person tapping the same screen would
  simply corrupt each other's work. Stop the run first.
- **It is not a mid-run takeover.** The sealed browser's
  [hover-and-take-the-controls](user-guide.md#taking-control-mid-run) has no phone equivalent yet:
  this is a *setup* tool, used between runs.
- **The frame refreshes about twice a second.** Fine for installing and signing in; wrong for
  anything that moves.
- **Typing carries ASCII only**, for the same reason [the agent's does](#typing-is-ascii-only).
  For other characters, tap the device's own on-screen keyboard rather than using yours.
- **It is a credential.** The link expires in minutes and is a live remote control on that device
  while it lasts. Nothing is recorded: no screenshots, no keystrokes.
- **Anything the executor can reach.** A phone on USB, an emulator sidecar, a device farm — it all
  goes over `adb`. That's the point: an emulator image's own noVNC page (`:6080`) exists only
  because that one image happens to bundle a VNC server, and nothing else does.

> A remote server that predates this — or has no device to reach — reports no console. The button
> still works and says which of the two it is; the fallback is `adb` from a machine that can reach
> the device (`adb connect`, then `adb install`).

---

## In server mode

Phone scope runs in a container, which desktop and window scope cannot: what a container lacks
is a *screen*, and `adb` needs a network. A phone-scope agent is accepted by
`/v1/capabilities` and `POST /v1/runs` exactly as a browser-scope one is.

Add an emulator as a sidecar and point the executor at it:

```yaml
services:
  simpleclaw:
    environment:
      AUTOPLAY_ADB_HOST: emulator:5555

  emulator:
    image: budtmo/docker-android:emulator_14.0
    privileged: true
    devices: ['/dev/kvm']
```

Reach it by **service name**, not `localhost` — see
[Which host is the device on?](#which-host-is-the-device-on) The host must expose `/dev/kvm`,
which rules out most managed container platforms; a VM you control, or a machine on your own
hardware, is the realistic home for this.

Set the device up through the
[device console](#setting-the-device-up-by-hand-the-device-console) — that's what it exists for:
a deployed executor has no window to put an emulator's screen in.

**In a [cluster](cluster.md), a node with no device won't take phone work.** Dispatch is
pull-based, so any node with a free slot would otherwise read a phone task and fail it for want of
a device. A node with nothing attached and no `AUTOPLAY_ADB_HOST` therefore advertises its phone
agents as *cannot run here*, and the Cluster page shows which nodes those are.
→ [Android devices in a cluster](cluster.md#android-devices-in-a-cluster)

---

## What this scope does *not* do

Worth reading before you plan a deployment around it. These are real limitations, not
oversights waiting to be discovered mid-run.

- **There is no seal.** A sealed browser bounces navigation outside its origin; a phone does
  not. The containment *is the device* — the agent can leave the app it started in and reach
  anything installed. **Give an agent a device that holds only what it should see.** Start app
  and Start URL say where to begin; they do not fence the agent in.
- **Stored credentials cannot be filled.** The `fill_secret` action is sealed-browser only, so
  a phone agent has no safe way to enter a password: typing one as an ordinary action would
  write it into the step record and back into the model's context. **Sign the device in
  yourself** and let the session persist.
- **No takeover mid-run.** The sealed browser's hover-and-take-the-controls has no phone
  equivalent. You can drive the device by hand *between* runs — that's the
  [device console](#setting-the-device-up-by-hand-the-device-console) — but not while one is
  going, and the console refuses while a task is running for exactly that reason.
- **Phone runs take turns.** Unlike a sealed browser there is no *Max parallel slots*, so two
  phone agents are serialised even when they drive different devices. In a
  [cluster](cluster.md#android-devices-in-a-cluster) that means a phone agent's throughput scales
  with nodes-and-devices rather than with slots.
- **Typing is ASCII-only**, as above.
- **Held drags are not available.** `adb` submits a swipe as one complete gesture, so the
  observe-and-step drag a desktop agent can do (pull a slider, look, pull again) has no
  equivalent. Use a plain drag with both endpoints.

---

## Troubleshooting

**`adb not found (tried "adb")`** — the executor has no `adb`. The message lists every
location it searched; put platform-tools in one of them, or set `AUTOPLAY_ADB_PATH` to the
executable. On the desktop app, **restart it after setting an environment variable** — a
running process keeps the environment it started with.

**`Could not reach the Android device at … within 120s`** — nothing is answering at that
address. An emulator that has just started is normal and the connect retries across it; if it
persists, check the port is published, and check you used the right host for where the *agent*
runs — see [Which host is the device on?](#which-host-is-the-device-on)

**`Android device … connected but never finished booting`** — `adb` reached the device before
Android was up, and it never got there. Watch the emulator's own console; on a machine without
KVM, boot can genuinely take longer than the timeout.

**The emulator container exits naming QEMU, on Windows** — `/dev/kvm` isn't there. The
`docker-desktop` distro doesn't load the module at boot and doesn't keep it across a restart, so
this is the same machine that worked yesterday. Run
`wsl -d docker-desktop -e sh -c "modprobe kvm_intel"` and bring it up again — see
[Option A](#option-a--an-emulator-in-a-container).

**The device console won't open** — three reasons, and it says which: **a task is running** on that
device (stop it first — nothing stops two things driving one screen, so it's refused rather than
allowed to corrupt the run), the agent's **applied** scope isn't Android (press **Apply**, not just
open the tab), or the executor can't reach a device at all.

**The device console link stopped working** — it expires in minutes, by design. Press the button
again.

**The console's screen doesn't keep up** — it refreshes about twice a second. It's built for
installing and signing in, not for watching something animate.

**`N Android devices are attached`** — set **Device serial** to say which one this agent
drives. Picking one arbitrarily would give two runs of the same agent two different phones
with nothing recording which.

> An emulator container that publishes 5555 to the host shows up **twice** on that host — once
> as the TCP device you connected to, once as a local emulator `adb` found by scanning. Filling
> in **Device address** avoids the question entirely.

**`This agent pins a WxH screen, but … reports WxH`** — the
[expected screen size](#expected-screen-size-is-a-check) does not match the device. Clear the
field, or change the device with `wm size`.

**`Could not find an app called "X"`** — no installed app matches. Check the spelling, or give
the package name; `adb shell pm list packages` lists them.

**`"X" matches N apps`** — the name is ambiguous. Name the package exactly.

**`This device can only type ASCII through adb`** — the text contains non-ASCII characters. See
[Typing is ASCII-only](#typing-is-ascii-only).

**`"ctrl c" is not a key this device has`** — the model reached for a desktop shortcut. It is
refused deliberately; the available keys are in the
[action table](#how-the-agent-operates-a-phone).

**The run acts on the wrong screen at step 1** — the agent starts on whatever the device is
showing. Set **Start app** or **Start URL** so every run begins from a known place; SimpleClaw
waits for the screen to settle before taking the first screenshot.

**The model invents a web address** — set **Start URL**. See
[Always set a Start URL for web work](#always-set-a-start-url-for-web-work).

**Taps land slightly off** — almost always a device whose resolution changed mid-life. Fill in
**Expected screen size** so a mismatch is refused loudly instead of drifting.
