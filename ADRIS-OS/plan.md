# adris OS — Plan

**Status:** awaiting approval · nothing built yet
**Written:** 24 Aug 2026 · **Target ship:** 14 Sep 2026 (3 weeks)
**Scope of this folder:** everything about adris OS — code, docs, assets, design exports — lives under `ADRIS-OS/`. Nothing outside this folder is touched by this project, and the adris.tech desktop app (`nivara-desktop/`) keeps shipping on its own schedule, untouched by this plan. **One stated exception:** the waitlist described in [§2](#2-three-weeks-honestly) is a page on the public adris.tech website — it has to live in the website's own files to actually be part of the site, so that one piece of Week 1 work happens outside `ADRIS-OS/` on purpose, not by drift.

---

## STATUS BOARD — read this first

Everything below this section is the *plan*. This table is the *state*: what is genuinely working, what is half-done, what has not been started. It is the thing to check before picking up work, and the thing to update when finishing any.

**Rule for this table: `✅` means seen working, not written.** A thing is only ✅ when it has actually been run and observed doing what it claims. Anything believed-to-work-but-unverified is `🟡`. This rule exists because it was broken once (25 Aug: LibreOffice reported as launched when it had crashed — the check trusted a file appearing on disk rather than the program running), and that cost more time than being cautious would have.

### The targets

| # | Target | State | Where |
|---|---|---|---|
| 1 | Real bootable OS, Linux underneath | 🟡 **partial** — running on WSL2 Ubuntu 24.04 as the dev VM; the custom bootable ISO is not started | [§2](#2-three-weeks-honestly), [§11](#11-how-it-is-built--and-the-exact-stack) |
| 2 | Ordinary Ubuntu apps present and working | ✅ **done** — LibreOffice Writer/Calc/Impress, Files, text editor, terminal, browser: all installed, configured, verified running | [§6](#6-agents-as-citizens-of-the-os) |
| 3 | Agents drive real applications (never rebuilt) | ✅ **done** — an agent produced a genuine 5KB `.docx` via headless LibreOffice, zero document code of ours | [§6](#6-agents-as-citizens-of-the-os) |
| 4 | Agents can run anything on the system | ✅ **done** — bridge `/run` executes arbitrary commands; verified writing files and reading real output | [§6](#6-agents-as-citizens-of-the-os) |
| 5 | adris OS shell (rail, widgets, dock, wallpaper) | ✅ **done** — React/TS, runs fullscreen with no browser chrome | [§5](#5-the-desktop) |
| 6 | A full desktop session — "a second computer" | ✅ **done** — XFCE over RDP; verified listening on 3390 and reachable from Windows. Connect with Remote Desktop to `localhost:3390` | [§5](#5-the-desktop), `vm/run-desktop.sh` |
| 7 | Coding agents (Claude Code, Codex) extend the OS | 🟡 **mechanism proven**, not yet wired to those specific tools | [Targets](#targets--what-adris-os-has-to-achieve) |
| 8 | An adris bar inside every application | ❌ **not started** — needs the compositor work; see [§11](#11-how-it-is-built--and-the-exact-stack) | — |
| 9 | Windows files openable from adris OS | 🟡 **works in the dev VM** via `/mnt/c`; the real NTFS mount for a booted install is untested | [§8](#8-files-folders-and-locks) |
| 10 | Permissions: everything allowed by default, changeable in Settings | ❌ **not started** — dev bridge is currently all-or-nothing | [§9](#9-making-it-yours) |
| 20 | **Off switch** — stop adris OS taking over, go back to Windows, without uninstalling | ❌ **not started** — design settled, needs the startup picker first | [§10](#10-going-back-to-windows) |
| 11 | Files with colours/icons from their names, lockable | ❌ **not started** | [§8](#8-files-folders-and-locks) |
| 12 | Wallpaper: pick one, or have an agent code it | 🟡 **picker done + one image**; the agent-coded path is UI-only, not wired | [§6](#6-agents-as-citizens-of-the-os) |
| 13 | Connect other hardware (WiFi/Bluetooth/wired) easily | ❌ **not started** | [§7](#7-agents-across-machines) |
| 14 | Agents across machines | ❌ **not started** — open thread, deliberately unscoped | [§14.3](#143-agents-across-machines) |
| 15 | Server mode (lid shut, work continues) | ❌ **not started** | [§13](#13-not-in-v1--and-when-it-comes) |
| 16 | Looping — agents that keep themselves going | ❌ **not started** | [§14.2](#142-looping--an-agent-that-keeps-itself-going) |
| 17 | App store — install from GitHub | ❌ **not started** | [§13](#13-not-in-v1--and-when-it-comes) |
| 18 | Startup picker + installer (Windows or adris OS) | ❌ **not started** | [§4](#4-getting-on-to-it) |
| 19 | adris.tech website waitlist | ❌ **not started** — blocked on deciding the perks | [§2](#2-three-weeks-honestly) |

### What's built, file by file

| Piece | File | State |
|---|---|---|
| Desktop shell | `frontend/src/components/Desktop.tsx` | ✅ working |
| Rail (right-edge home panel) | `frontend/src/components/Rail.tsx` | ✅ working, launches real apps |
| One widget box, paged, draggable | `frontend/src/components/widgets/WidgetCarousel.tsx` | ✅ working |
| Centre clock | `frontend/src/components/CenterClock.tsx` | ✅ working |
| Dock | `frontend/src/components/Dock.tsx` | ✅ working, launches real apps |
| Wallpaper layer + picker | `frontend/src/components/Wallpaper*.tsx` | ✅ gallery works; Generate tab is UI-only |
| Agent ↔ Linux bridge | `vm/agent-bridge.mjs` | ✅ working (`/launch`, `/run`, `/apps`, `/health`) |
| Install the real apps | `vm/setup-desktop.sh` | ✅ working |
| Run shell + bridge | `vm/run-os.sh` | ✅ working |
| Fullscreen session | `vm/run-session.sh` | ✅ working |
| Status check | `vm/status.sh` | ✅ working |
| Full desktop session (XFCE/RDP) | `vm/run-desktop.sh` | ✅ working — verified listening + reachable |

### How to run it

Every command goes through `wsl`, from a normal Windows terminal (or prefixed with `!` in Claude Code). `PLAN` below is `/mnt/c/Users/amogh/OneDrive/Desktop/NIVARA/ADRIS-OS`.

| What you want | Command |
|---|---|
| **Just run adris OS** ← start here | **Double-click `ADRIS-OS/START-ADRIS-OS.bat`.** Starts everything and opens Remote Desktop; adris OS then appears fullscreen by itself on login. Nothing else to do. |
| The same thing, from a terminal | `wsl -d Ubuntu -u root -e bash $PLAN/vm/start-adris-os.sh` then Remote Desktop to `localhost:3390` |
| The plain Ubuntu desktop, without adris OS auto-opening | `wsl -d Ubuntu -u root -e bash $PLAN/vm/run-desktop.sh` — user `amogh`. Password is in `vm/.local-credentials.txt` (gitignored — see note below) |
| Check what's installed / running | `wsl -d Ubuntu -u root -e bash $PLAN/vm/status.sh` |
| Live status, refreshing | `wsl -d Ubuntu -u root -e watch -n 2 bash $PLAN/vm/status.sh` |
| Install the real apps (first time) | `wsl -d Ubuntu -u root -e bash $PLAN/vm/setup-desktop.sh` |
| adris OS fullscreen, no desktop around it | `wsl -d Ubuntu -e bash $PLAN/vm/run-session.sh` |
| Shell + bridge only, view from a Windows browser | `wsl -d Ubuntu -e bash $PLAN/vm/run-os.sh` → `http://localhost:5173` |
| Push a code edit into the running VM | `wsl -d Ubuntu -e bash $PLAN/vm/sync-to-wsl.sh` |

**Ports:** `5173` the adris OS shell · `7717` the agent bridge · `3390` the Ubuntu desktop over RDP.

**Where the VM password lives — and why not here.** The dev VM's Remote Desktop login is in `vm/.local-credentials.txt`, which is gitignored and must stay that way. It is deliberately *not* written into this file: `plan.md` is part of the `nivara-website` repo, which **auto-deploys to the public site on every push** — a password here would be readable at adris.tech and permanent in git history, since removing it from a later commit does not remove it from the earlier ones. To set or reset it: `wsl -d Ubuntu -u root -e passwd amogh` from a normal Windows terminal (a real terminal, because it prompts interactively).

### Next, in order

1. **Permissions model** — everything allowed by default, switchable in Settings, replacing the dev bridge's all-or-nothing. This is the one that has to exist before any of this ships.
2. **The adris bar inside every app** — a chat/command strip in every window, not only in the shell. Needs compositor work, because it means drawing into applications we did not write.
3. **Files** — colours and icons derived from folder names, and real per-folder locking.
4. **Windows files from a booted install** — works in the dev VM via `/mnt/c`; the real NTFS mount is untested.
5. **Agent-coded wallpaper** — the UI exists; wire it to a real model.

---

## Targets — what adris OS has to achieve

Written down separately, on top, because everything below is *how*; this is *why*, and it is what every later decision gets checked against.

- **Coding agents are first-class citizens, not guests.** Claude Code, Codex and other coding agents can connect to adris OS and build, extend or fix it — the same way they build anything else. The product's whole premise is a computer that writes its own tools, so an agent working on the OS is normal operation, not an integration bolted on afterward.
- **Real capability on the desktop from the first boot, not an empty canvas.** The desktop app already has a Calendar and the Council (the multi-agent "put this decision in front of five advisers" feature) — proven, already trusted, already what people use. Both are pinned on the rail by default, in the UI, from day one — see [§5](#5-the-desktop). Alongside them, a small set of other well-known, already-proven agent tools ship pre-installed the same way. This is a *different* case from the store below: our own known-good tools shipping by default need no sandbox, because we already trust them — that's what makes it possible to have this in v1 while the store (arbitrary, untrusted repos) is not.
- **A real agent team, not one voice.** Agents can spawn sub-agents for pieces of a task and run genuine multi-agent workflows — several agents working a job together the way a team would, not one generalist doing everything alone. See [§6](#6-agents-as-citizens-of-the-os).
- **Agents that actually touch documents.** Open a file, read it, write it, build a spreadsheet or a slide deck — directly, as a normal part of doing the job, not "here's what you should put in a document." See [§6](#6-agents-as-citizens-of-the-os).
- **A store agents can pull from, not just people.** Downloading a GitHub repo has to result in something an agent can genuinely call and use mid-task — not only a window a person double-clicks. Two consumers of the same store: a human browsing it, and an agent reaching into it. See [§14 Open threads](#14-open-threads--not-yet-scoped) — this is real, wanted, and deliberately not yet scoped.
- **It notices your day and writes you a tool for it, unprompted.** The deepest version of "a computer that writes its own tools": when the same task keeps coming back — the same kind of request, day after day — the system notices the pattern itself and builds a small, dedicated application or widget that does it directly next time, instead of the user asking an agent to do it fresh every single day. The tool it builds always lands in the *yours-to-change* space from [§9](#9-making-it-yours) — a new widget, a new automation — and never touches the *sealed* core; that boundary is what makes an agent allowed to build things unprompted something safe rather than alarming. Flagged in [§13](#13-not-in-v1--and-when-it-comes) ("agents that write your widgets," weeks 5–8) for when it actually ships — it is a target from day one of the plan even though the building starts later.
- **Agents that keep going without being re-asked.** An agent can prompt itself to continue a task, or hand a task off to another agent to carry the next step — a loop, not a single question-and-answer — so something that takes many steps over hours or days keeps advancing without the user re-typing the same instruction each time it needs to continue. This is the mechanism underneath Server mode below and the multi-agent teamwork in [§6](#6-agents-as-citizens-of-the-os) — one OS-level loop primitive, not a separate trick per feature. See [§14.2](#142-looping--an-agent-that-keeps-itself-going) for the shape of it and what's still unresolved.
- **Server mode.** The lid is down, the screen is off, the laptop is on — and an agent that was already given a task keeps working on it in the background, exactly as if someone were sitting in front of it. Flagged in [§13](#13-not-in-v1--and-when-it-comes) as weeks 6–8, not v1, but it is a target from day one, not an afterthought added later.
- **Connecting to other hardware is as easy as pairing a Bluetooth speaker.** WiFi, Bluetooth or wired — whichever's actually available — discover what's nearby, tap it, done, no non-technical person ever sees an IP address. This is the general transport everything else in this section runs on.
- **Agents (and people) reaching across machines, when it's wanted.** Two adris OS users who know each other — same office, same friend group — can pair their machines using that same connection, and from then on their agents can ask each other for exactly what a task needs, nothing more, over the network they're already on. People can message each other the same way. Genuinely useful overnight, when several paired machines are all in server mode and nobody is awake to relay anything by hand. Real, wanted, and **not yet scoped** — see [§7](#7-agents-across-machines) for the shape of it and why it stays supervised.
- **More than one look, chosen the way a wallpaper is chosen.** The widget canvas isn't one fixed design — several genuinely different desktop styles ship, and picking between them is as easy as picking a wallpaper always was, not a settings-menu chore. See [§5](#5-the-desktop) and the new screen in [§3](#3-claude-design-comes-first).
- **A wallpaper an agent codes for you, not just a picture you upload.** Ask for one and Codex, Claude Code or a local model writes it — small, generative, genuinely "yours" the way nothing off a stock wallpaper site is. It's pure rendering with no privileged access at all, which makes it one of the lowest-risk instances of "a computer that writes its own tools" in this whole document — worth considering for v1 itself rather than automatically deferred. See [§6](#6-agents-as-citizens-of-the-os).
- **A real, whole-day operating system.** Not a shell wrapped around Windows, not a kiosk mode — something a person actually works their whole day inside, the way they work inside macOS or Windows today.
- **Non-technical people and small businesses first.** Linux already serves developers well; that is not the gap. The gap — and the actual opportunity — is the business owner who has never opened a terminal and never will. Wherever a choice comes down to "easier for someone technical" versus "safe and clear for someone who is not," the second one wins. Technical users are still genuinely served (see [§9](#9-making-it-yours) — full change-anything power is real), but they are not who the tie-breaks are decided for.
- **Genuinely well designed, not just functional.** The screens in [§3](#3-claude-design-comes-first) exist because "looks and behaves like something Apple would ship" is a target in its own right, not a nice-to-have that happens if there's time left. For the non-technical audience this plan is written for, how it looks *is* how trustworthy it feels — a good-looking, easy-to-use OS is not decoration on top of the real product, it is part of the product.
- **A computer, not a feature.** The measure of success is someone running a full working day on it without thinking about the fact that it is Linux underneath, the same way nobody thinks about Unix while using a Mac.

---

## Build log

**25 Aug 2026.** The real Claude Design pass came back — `design of adris.OS.html`, one canvas file, all screens. Richer than the brief in `claude-design-prompt.md` was written to expect, in ways worth recording because they're now the actual reference:

- Every widget is one object — a 20px-radius "plate" with a lit top edge and a floor shadow, so it reads as resting on the wallpaper rather than a flat rectangle — 7 shipped kinds (Clock, Calendar, Focus, Inbox, System, Battery, Council) plus Today's outreach shown in all three states (resting/working/finished) and a user-added variant (same body, dashed border).
- The rail is confirmed on the **right edge**, 312px, and is a real component tree: `AskField → Clock → MonthCalendar → Agenda → AgentsRow → Notifications → AppButtons → Account`. Calendar and Council are pinned in `AppButtons` from first boot, exactly as [Targets](#targets--what-adris-os-has-to-achieve) says.
- A bottom-centre floating dock exists alongside the rail — not in the original 9/11-screen brief, but real in the design and now built.
- Desktop styles and Wallpaper turned out to be genuinely two different screens, not one — matching the split already made in [§5](#5-the-desktop)/[§6](#6-agents-as-citizens-of-the-os) two conversations ago.

**Frontend scaffolded at `ADRIS-OS/frontend/`** — Vite + React + TypeScript, exactly as pinned in [§11](#11-how-it-is-built--and-the-exact-stack). Design tokens in `src/tokens.css` are read directly off the real design file (both Ink and Paper), not the flatter placeholder palette the brief shipped with — that file is now stale where the two disagree.

**Built and working:** `WidgetCard` (the one plate every widget shares) plus all 7 shipped widgets and Today's outreach in its three states; the Rail; TopBar; the bottom Dock; a `Desktop` screen composing all of it; `WallpaperLayer` (the actual background) and `WallpaperPicker` (Gallery tab wired to a real, extensible manifest — one image today, `purple-mountain.png`, the one supplied; more are just a file drop + one line in `lib/wallpapers.ts`). `tsc -b` and `vite build` both clean.

**Honestly not done:** the Generate tab of the wallpaper picker is built exactly as designed but **not wired to a real agent** — pressing Generate shows the intended flow and says plainly that nothing is connected yet, rather than faking a result. Files, the Launcher, Settings and First-run are not built. Only one desktop style exists so far, not the 2-3 the design calls for.

**Test loop:** `ADRIS-OS/vm/run-in-wsl.sh` runs the frontend entirely inside the WSL2 Ubuntu VM already on this machine — its own native npm install, kept separate from the Windows-side one (sharing `node_modules` across the OS boundary breaks on native binaries like rollup's). Confirmed reachable at `http://localhost:5173` from a normal Windows browser with nothing installed on the Windows side to make it run. **This is not yet the real adris OS VM** from [§2](#2-three-weeks-honestly) — that's a custom-built Ubuntu image booted in QEMU, still Week 1 Day 3 of the actual OS and not started. This is specifically for testing the frontend shell while that doesn't exist yet. A second script, `sync-to-wsl.sh`, re-syncs the running copy after an edit without restarting the dev server (Vite hot-reloads).

**Installing into the VM needs no password — use `wsl -u root`.** Worth writing down because it cost real time to discover. Inside the VM, `sudo` prompts for the Ubuntu account password, so any scripted `sudo apt-get install` simply *hangs forever with no output* — it looks like a slow download and is actually a prompt nobody can answer. WSL sidesteps this entirely: `wsl -d Ubuntu -u root -e bash -lc "…"` runs as root directly, because the Windows side already authenticated the user. So the rule for anything scripted against this VM:

```
# hangs on an unanswerable prompt — never do this from a script
wsl -d Ubuntu -e bash -lc "sudo apt-get install -y <pkg>"

# works, no password anywhere
wsl -d Ubuntu -u root -e bash -lc "DEBIAN_FRONTEND=noninteractive apt-get install -y <pkg>"
```

`vm/setup-desktop.sh` still uses `sudo`, which is correct when a person runs it themselves in a terminal — it just cannot be driven headlessly. **No password is stored anywhere in this repo, and none should be**: `plan.md` lives in the `nivara-website` repo, which auto-deploys to the public site on push, so anything written here is potentially world-readable.

**GUI works, verified on screen (25 Aug).** WSLg gives the VM a real display (`DISPLAY=:0`, `WAYLAND_DISPLAY=wayland-0`), and Linux windows draw directly onto the Windows desktop. Confirmed by launching an actual Ubuntu window and having it appear. Two findings from doing it:
- `xterm` is the terminal to use. `zutty` (the one Ubuntu ships by default) needs OpenGL and core-dumps under WSLg's software renderer.
- Launch GUI apps with `setsid … </dev/null &`, not a bare `nohup … &`. A process started inside `wsl -e bash -lc "…"` is killed when that command returns, so the window flashes up and vanishes — which is exactly what happened on the first attempt.

**Also 25 Aug — first look, and it was too crowded.** Seeing it running surfaced two real problems the design file itself didn't show, because a static canvas doesn't show density the way a running screen does:

- **Widgets read as opaque painted plates, not glass.** The design calls them "plates" and that's exactly what they looked like once real — solid gradients sitting on top of the wallpaper rather than translucent surfaces it showed through. Fixed: `WidgetCard`, the rail, the top bar and the dock now use a genuinely translucent background plus `backdrop-filter: blur(...)`, not an opaque tint. The wallpaper's own dark scrim (originally there so text stayed legible over a bright image) is mostly removed — legibility is the glass blur's job now, not a global darkening of the picture underneath it.
- **Eight widgets on one canvas was too many, and two were pure duplicates.** Clock and Calendar each said something the rail was *already saying*, permanently, on the right edge of the same screen. Cut down to three things: one **TodayPanel** — a single "main info" card (what's next, the running focus session, battery/inbox/agents as three small numbers) that replaces what used to be five separate cards (Clock, Calendar, Focus, Inbox, System, Battery) — plus **Today's outreach** (the clearest demonstration of an agent visibly working) and **Council** (a real, distinct feature, not a duplicate of anything in the rail). The removed individual widget components (`ClockWidget.tsx`, `CalendarWidget.tsx`, etc.) are not deleted — they're real, working components, just not all crammed onto the canvas at once. They're the natural start of a widget catalogue once [§13](#13-not-in-v1--and-when-it-comes)'s app store exists.

**25 Aug, later — the base flips to Ubuntu, and the VM becomes a real computer.** Two things changed, and the second is the bigger one:

- **Ubuntu LTS replaces Fedora as the base**, for the reason set out in ["Why Ubuntu, specifically"](#why-ubuntu-specifically--and-what-linux-vs-ubuntu-actually-means) in §11 — it is the most-used desktop Linux by a wide margin, which for a non-technical audience is a support argument, not a popularity one. Worth noting the plan had said Fedora while *every actual test so far ran on Ubuntu 24.04* in the WSL VM; this makes the document agree with reality.
- **The shell stopped being a picture of an OS.** Until now the frontend was a UI with nothing behind it. Added `vm/agent-bridge.mjs` (launches real applications, and is the same surface an agent uses — see [§6](#6-agents-as-citizens-of-the-os)), `vm/setup-desktop.sh` (installs LibreOffice Writer/Calc/Impress, Files, a text editor, a terminal), and `vm/run-os.sh` (starts the bridge and the shell together). The dock now launches **the real LibreOffice**, through WSLg, in its own window.

**Third UI pass, same day** — the "still crowded" feedback:
- **One widget box, not several.** Everything that was a separate card is now a *page* inside a single box, with dots underneath showing which page you're on (solid = here, faint = elsewhere). Adding a page is one array entry — deliberately the shape an agent extending the stack would use.
- **It's draggable.** Grab the handle at its top, put it where you like; the position is remembered.
- **The clock moved to top-centre**, large, where the eye actually goes — and the rail's duplicate copy of it is gone.
- **"Calm · Focused · In control" is gone** from the top bar (marketing copy on a desktop), and the awkward floating theme/wallpaper strip is folded into the top bar's right side as proper icon buttons.

**25 Aug, end of day — a real desktop, and three failures worth keeping.**

The apps were installed and running, and it still wasn't right: *"i am on windows i wanted all this in the vm a different screen running on my windows like a different computer."* That was a correct complaint about a real architectural limit, not a misconfiguration.

**WSLg draws individual Linux windows onto the Windows desktop. It does not create a desktop.** So LibreOffice appeared as one more window among the Windows ones, with no Ubuntu behind it — no wallpaper, no panel, nothing that reads as another computer. Genuinely useful for driving one app; useless for showing an operating system.

**The fix: a real desktop environment served over RDP.** `vm/run-desktop.sh` runs XFCE inside the VM and exposes it via xrdp; Windows' built-in Remote Desktop connects to `localhost:3390` and you get a whole Ubuntu desktop in its own window. **Verified**: xrdp and xrdp-sesman running, listening on 3390, and `Test-NetConnection` from Windows returns true. Three things that each fail *silently* and are handled in the script rather than left to be rediscovered:
- **`~/.xsession` must name the session.** Without it xrdp starts something undefined and lands on a grey screen — the classic "it connects but there's nothing there."
- **Port 3390, not 3389.** Windows' own Remote Desktop service can hold 3389; the symptom is a connection that opens and instantly closes.
- **No systemd in WSL2.** `systemctl start xrdp` does nothing at all — it must be started directly, which is most of why this is a script and not a documentation line.

**Three mistakes made today, and what each one changed:**

1. **An install that never ran, reported as running.** `sudo apt-get install` inside the VM sat on a password prompt nobody could answer. With no output, it looks exactly like a slow download — and it was described as "installing" for a long stretch while nothing happened. *Fix:* `wsl -u root` needs no password at all (documented in the Test loop section above), so nothing scripted should ever call `sudo` here.
2. **"LibreOffice should be opening on your screen" — it had crashed.** The completion check used `command -v libreoffice`, and apt writes binaries to disk well before it configures the package. The binary existed; the program could not run. *Fix:* every check now uses `dpkg -l | grep '^ii'` (installed **and** configured), and `vm/status.sh` shows a distinct `~ unpacking, not usable yet` for exactly that window. This is also where the STATUS BOARD's rule comes from: **a green tick means seen working, not written.**
3. **Epiphany's application mode, twice.** It refuses `--application-mode` unless the profile directory already exists *and* its name starts with `org.gnome.Epiphany.WebApp_` — two separate hard errors, one after the other. Both messages are now in the script's comments.

**Also proven today, and the most important single result:** an agent wrote content, drove headless LibreOffice, and produced a genuine 5,046-byte `.docx` using the real MS Word 2007 XML filter — **with no document-generation code of ours**. That is [§6](#6-agents-as-citizens-of-the-os)'s whole claim, working. And it is not LibreOffice-specific: the bridge's `/run` executes any command on the system, so "agents use whatever is installed" is the actual mechanism, not an aspiration.

**25 Aug, later still — one command, and adris OS actually on screen.**

The desktop worked and it still wasn't the product: *"idk if that is ubuntu or not… this one looks normal to me, the background isn't good nor i find anything related to adris-os in this."* Both halves fair.

- **It looked unfamiliar because it is XFCE, not GNOME.** Ubuntu's default desktop is GNOME (what most people have seen); XFCE was chosen here because it is far lighter and much more reliable over RDP. Same Ubuntu underneath, different face — but that was never said out loud, so it just looked wrong. **If the familiar Ubuntu look matters more than RDP smoothness, `ubuntu-desktop` can be installed instead** — heavier, and GNOME over xrdp is known to be fussier, which is the trade.
- **There was no adris OS on it because nothing started it.** The shell was served at a URL, and finding it meant opening a browser and typing that URL — homework, not an operating system.

**`vm/start-adris-os.sh` + `START-ADRIS-OS.bat` fix the second properly.** One double-click now: starts xrdp, the bridge and the shell, opens Remote Desktop — and writes two XFCE autostart entries so that on login **adris OS opens itself, fullscreen**, with the adris wallpaper behind it and XFCE's own desktop icons hidden. Nothing to click, no URL to type.

Two details that make it work rather than half-work:
- The autostart entry **waits for the shell's port** before launching the browser (up to 40s). On a cold login the browser otherwise arrives first, shows a connection error, and sits there — looking exactly like the product is broken.
- The wallpaper is set from a **second autostart entry, not from the script**. `xfconf-query` needs a live session bus, so setting it at script time fails on a desktop that has not started yet.

**Autostart only applies at login.** After running the script the first time, log out and back in (or reconnect RDP) — an already-open session will not retroactively run it.

**25 Aug, evening — adris OS verified ON SCREEN, by screenshot.**

Twice in a row it was reported as running while the screen showed a bare XFCE desktop. The fix for that was not another check — it was **looking**: `scrot` installed in the VM, capture display `:10`, open the PNG. That is now the standard for anything visual, and it immediately proved both the failure and, after the fixes, the success. **A screenshot is the only acceptable evidence that a UI works.**

**What the screenshots showed:** first a bare XFCE desktop with its mouse logo and no adris OS at all; then, after the fixes, adris OS filling the screen — purple-mountain wallpaper, the centred clock, the Today widget with its page dots, the rail with agenda / running agents / apps, and the dock. Also caught a real bug no status check would have: **every app icon was a broken-square glyph**, because the VM had no emoji font (`fonts-noto-color-emoji`, now installed).

**Why "app mode" was abandoned.** Epiphany's `--application-mode` gives a chromeless window and has *three* separate hidden requirements — profile directory must exist, must be named `org.gnome.Epiphany.WebApp_*`, and a matching `.desktop` file must be registered with xdg-desktop-portal. With all three satisfied it still aborted (`trying to access web app settings outside web app mode`). Replaced with: launch the browser normally, then have **wmctrl** move the window to the current workspace and fullscreen it. Not fragile, and it does exactly what app mode was for.

**Two traps that made failure look like success:**
- **`pgrep` is not proof of a window.** A crashed browser sits un-reaped in the process table, so a process check reports "running" for something with no window and no future. Worse, the launcher's own "already open?" guard used `pgrep` and matched one of these husks — so it exited immediately and opened nothing, silently. Both now ask **wmctrl** whether a window exists.
- **XFCE opened the window on workspace 3**, where it was invisible. Looked identical to nothing having launched.

**Launching into an already-open session was tried and deliberately abandoned.** A GUI app started by root for another user fights dconf, D-Bus and xdg-desktop-portal simultaneously (`unable to create directory /run/user/0/dconf`, `Failed to create XdpPortal instance: Permission denied`), and even importing the session's real `DISPLAY`/`DBUS_SESSION_BUS_ADDRESS`/`XDG_RUNTIME_DIR` out of `/proc/<session-pid>/environ` did not put a window on screen reliably. The identical launcher run *inside* the session works every time. So the script no longer pretends: if a session is open it says to log out and back in, or to use the **"adris OS" icon now placed on the desktop and in the applications menu**. Honest instruction beats a clever mechanism that works four times in five.

**References checked, as asked, with what was actually found (not guessed):**
- [**omarchy**](https://github.com/basecamp/omarchy) (Basecamp) — a real, shipped "opinionated Linux distribution," organized into `config/`, `themes/`, `applications/`, with a 51-chapter user manual and a documented "make your own theme" system. Validates two decisions already in this plan rather than changing anything: being *opinionated* rather than maximally configurable ([§1](#1-what-we-are-building)), and treating real, plain-language documentation as part of the product, not an afterthought.
- [**LinuxKit**](https://github.com/linuxkit/linuxkit) — a genuinely interesting architecture (the OS is composed from small container images, declared in YAML, "everything replaceable") — but by its own documentation, built for container/Kubernetes workloads, not general-purpose desktop use. Considered and **not adopted**: an Ubuntu base ([§11](#11-how-it-is-built--and-the-exact-stack)) stays the right tool for a desktop OS with a GUI that ordinary files and ordinary apps have to run on.
- [**Akira**](https://github.com/akiraux/Akira) — a native Linux design app (Vala + GTK), explicitly labelled by its own README as early-development, not production-ready. The lesson taken is the one already practiced here: say plainly what isn't finished (see the wallpaper Generate tab above) rather than letting a UI imply a capability that isn't real yet.
- [**torvalds/linux**](https://github.com/torvalds/linux) — the kernel itself, organised by subsystem (`arch/`, `drivers/`, `fs/`, `net/`, `mm/`). Confirms the *Sealed* line already drawn in [§9](#9-making-it-yours): this is proven work being used, not rewritten.

---

## 1. What we are building

Not a program that runs on Windows. An operating system you choose at startup, that looks and behaves like something Apple would ship, and that is built *around* agents rather than having them bolted on.

Underneath it is Linux, the same way macOS is Unix underneath and ChromeOS is Linux underneath. Nobody writes an operating system from nothing — Apple did not, Google did not — and nor should we. What makes it *ours* is everything above that line: the desktop, the files, the widgets, the agents, the way it installs, and the fact that it is all yours to change.

**The one-sentence version, for anyone who asks:**
> adris OS is a computer that writes its own tools. You tell it what you do, and it builds small things — a button, a panel, a nightly job — that do it for you.

The desktop app stays exactly as it is. It keeps shipping, keeps earning, keeps getting fixes. adris OS is a second, separate thing in its own folder. Nothing about this plan touches the `.exe`.

---

## 2. Three weeks, honestly

Three weeks is enough to ship a real, installable, genuinely good adris OS v1 — but only if we are strict about what goes in it. It is **not** enough for the app store, agents that write your widgets, or the security lockdown. Those are weeks four onward — see [§13 Not in v1](#13-not-in-v1--and-when-it-comes).

Better to say that now than hand over something half-finished on 14 September.

### The day-to-day loop — a VM first, real hardware as the last-mile check

Re-flashing a USB stick or reinstalling a partition to test one change would make three weeks impossible — that loop alone can take longer than the change did. So the everyday loop through Weeks 1 and 2 is a **virtual machine**, not a physical install:

- Every build boots straight into a VM from the command line — `qemu-system-x86_64 -enable-kvm -m 4G -cdrom adris-os.iso` against the day's ISO, or booting the built disk image directly. No GUI VM manager, no manual clicking through a wizard — one command, a boot in seconds, and it can be scripted so an agent (Claude Code included) can boot its own build, check it actually came up, and report back without a human doing it by hand each time.
- This is also *why* the language pin in [§11](#11-how-it-is-built--and-the-exact-stack) matters as much as it does: a VM-first loop only pays off if the same command works unattended, twenty times a day, which means the build has to be scriptable and reproducible — Ubuntu's own image-building tooling (live-build / Cubic) is built with exactly this workflow in mind.
- **What a VM cannot tell us**, and why Week 3 still tests on real machines: actual wifi chips, sleep/resume, screen brightness and multi-monitor behaviour, real BitLocker/Secure Boot interaction, and whether the installer genuinely behaves on a disk that isn't emulated. That is precisely what Week 3's "test and fix, on at least three different real machines" step ([below](#week-3--make-it-something-a-stranger-can-install-814-sep)) exists for. **The VM is the everyday loop; real hardware is the last-mile check before anyone else touches this — one does not replace the other.**
- Practical effect on the schedule: Days 1–14 (Weeks 1–2) run almost entirely in a VM, which is what makes iterating on the desktop, Files and widgets fast enough to fit the three weeks at all. Only Week 3 needs a physical machine, and by then the thing being tested has already been through hundreds of VM boots.

### Week 1 — Design it, then make it boot (25–31 Aug)

| Day | Work |
|---|---|
| 1–2 | **Claude Design.** Every screen, before a line of code: startup picker, desktop, rail, widget canvas, Files window, locked-folder prompt, settings. See [§3](#3-claude-design-comes-first). |
| 3 | **The base.** An Ubuntu image that builds reliably and boots on real hardware. Wayland, floating windows, no tiling. See [§11](#11-how-it-is-built--and-the-exact-stack) for why Ubuntu. |
| 4 | **The shell lives.** The adris rail pinned to the screen edge as a real desktop panel, not a window. |
| 5–7 | **The desktop.** Widget canvas, launcher, tray, calendar and agent input wired to the real agents. |

**By Sunday:** it boots into something that looks like the design.

### Also in Week 1 — the adris.tech waitlist

Runs alongside the OS work above, on the public website, not inside this folder (see the exception noted at the top of this document). The point is to start collecting real interest while the OS itself is still being built, not to wait until 14 September to find out if anyone wants it.

**What it is:**
- A "Join the adris OS waitlist" button placed **in the content of the page**, not only tucked into the header or footer — somewhere a visitor reading the page actually scrolls past it. Lives on the main marketing page, and the same button/link appears in a few of the other existing pages too (e.g. `pricing.html`, `why-adris.html`) so it isn't only reachable from one place.
- It leads to its **own dedicated page** — a real page in the site (not a modal), the same way `download.html` or `join.html` already are their own pages.

**The two ways to join:**
- **Signed in** (the site already has an auth flow via Supabase): one click, no form. Their account email joins the waitlist directly.
- **Signed out:** they type an email address to join.

**Open decision — not guessed at here:** the spec mentions the two paths get "their own perks," but what those perks actually *are* (early build access, a discount, a priority onboarding call, something else) hasn't been said yet. Needs an answer before the page copy can be finalised — flagged here rather than invented.

**Where it's built:** the website's existing stack — plain HTML/CSS/vanilla JS, matching every other page in the site, and a new Supabase table (e.g. `adris_os_waitlist`: email, source page, signed-in user id if any, joined-at) alongside the tables the site already uses for auth and billing. No new framework, no new backend — this is a small, ordinary feature on infrastructure that already exists.

### Week 2 — Make it a computer you can work on (1–7 Sep)

| Day | Work |
|---|---|
| 8–10 | **Files.** The window with coloured, icon-marked folders, and the padlock — folders you can put a passcode on. |
| 11–12 | **The widgets that ship with it.** Calendar, Today's outreach, inbox, notes, local model, system health. Real ones, not placeholders. |
| 13 | **Bring your work across.** Existing agents, Brain and campaigns arrive from the desktop app; the Windows disk is mounted so your files are simply there. This is also where the agent team and document capability in [§6](#6-agents-as-citizens-of-the-os) mostly comes from — porting what the desktop app already does, not building it fresh. |
| 14 | **Additions.** Claude Code, Codex or a local model can add a widget or an automation, and every change is undoable. |

**By Sunday:** you could run a working day on it.

### Week 3 — Make it something a stranger can install (8–14 Sep)

| Day | Work |
|---|---|
| 15–16 | **The switch.** One download on Windows that makes the USB stick and reboots you into adris OS. |
| 17–18 | **The startup picker.** The two-account screen — Windows or adris OS — with logos, arrow keys, a default after ten seconds. |
| 19 | **The installer.** Keep Windows, install alongside, handle BitLocker and Secure Boot properly rather than hoping. |
| 20–21 | **Test and fix.** On at least three different real machines. Whatever breaks gets fixed, not documented. |

**14 September:** adris OS v1, installable by someone who has never seen Linux.

---

## 3. Claude Design comes first

Design the front end first, so we can see where we want what — agreed, and it should be the first two days, not something that happens alongside the building.

Once the shell is code, changing the layout costs a day. Before it is code, it costs a minute. So the whole visual language gets settled while it is still a picture.

### The screens to design

Started as nine; now eleven — desktop styles and wallpaper are new, added below as their own screens rather than folded into "the desktop."

1. **The startup picker.** Two cards — Windows and adris OS. The first thing anyone sees.
2. **The desktop.** The rail and the widget canvas. The whole product in one image.
3. **The rail — the home panel.** Pinned to the **right edge** of the screen, always there, working like a home panel: everything in one place — agent input, calendar, running agents, notifications, apps. Calendar and the Council are pinned in it from first boot (see [§5](#5-the-desktop)).
4. **A widget, in three states.** Resting, working, and finished. Widgets are most of what anyone looks at.
5. **Desktop styles.** Not one fixed look — design **2–3 genuinely different visual treatments** for the widget canvas (spacing, widget chrome, how much is shown at once), switchable the way a wallpaper is. See [§5](#5-the-desktop).
6. **Wallpaper.** The background itself, separately from desktop style — including the picker for a **generative, agent-coded** wallpaper (see [§6](#6-agents-as-citizens-of-the-os)), not only a static image.
7. **The launcher.** What appears when you press the key in the corner.
8. **Files.** Folder colours, folder icons, the padlock, how the Windows drive appears.
9. **The locked-folder prompt.** One small dialog, but it is the one people judge the security by.
10. **Settings.** Deliberately small, and written in plain words.
11. **First run.** The three questions we ask a new person, and nothing more.

Design both the light and the dark version. The desktop app already carries them (`paper` and `ink`), and adris OS should be the same two worlds so anything moved between them still looks right.

**A note for anyone designing these from outside:** the design can come from anywhere — Claude Design, a contractor, whoever — but it gets *built* against the exact stack pinned in [§11](#11-how-it-is-built--and-the-exact-stack). A screen designed with that in mind (real React components, no exotic layout that only a specific design tool can export) turns into working code in hours; one that ignores it turns into a rebuild. Worth sending contributors that section before they start.

**The ready-to-use brief:** [`claude-design-prompt.md`](./claude-design-prompt.md), in this same folder, is the condensed version of this section written specifically to hand to Claude Design (or any designer) — the pitch, the real colours/fonts already used by the desktop app, and every screen spelled out with the actual content to put on them.

---

## 4. Getting on to it

A two-account screen at startup — that is exactly right, and it is achievable: it is what a properly themed boot picker looks like.

- 🪟 **Windows** — your usual desktop
- 🖥️ **adris OS** — your agents

Arrow keys or mouse. Whichever you picked last time is the default after ten seconds, so a machine used one way every day stops asking.

### How someone actually gets there

1. **They download one file on Windows.** One link, one click, no instructions to follow.
2. **It writes a USB stick for them.** They plug one in; it explains what it is about to do, then does it. No Rufus, no ISO, no BIOS folklore.
3. **It restarts the computer into adris OS.** It sets that up itself rather than telling them to press F12 at the right moment.
4. **They try it, changing nothing.** Running from the stick. Their Windows disk is untouched. They can pull the stick out and be back where they started.
5. **If they like it, one button installs it.** Windows stays. The startup picker appears from then on.

**The one genuinely dangerous step, named:** making room on the disk is the only part of this that can lose someone's data, and Windows 11 encrypts the drive by default, which makes it riskier still. The installer refuses to touch the disk until it has confirmed the BitLocker recovery key is saved. Better to stop someone at that screen than to be the reason a business loses its files.

---

## 5. The desktop

Familiar enough that nobody has to be taught, then better than what they left.

**Layout, roughly:**
- **Right edge: the rail**, working as a home panel — `Ask adris…` input, clock, calendar preview (`10:00 Demo`, `14:30 Vendor call`), `Agents · 2 running`, notifications, apps, all in one place.
- **The rest of the screen: the widget canvas** — e.g. *Today's outreach* (`12 ready · 3 sent`), *Inbox* (`4 need a reply`), *GST due* (`11 days`), *Local model* (`qwen · idle`), *Vendor chaser ✦ — you added this — Tue mornings*, *Disk & battery* (`62% · 4h left`).
- Dashed edges mark widgets that were **added** to a machine, distinguishing them from ones it shipped with.

**Decisions already made:**
- **No files on the desktop.** The desktop is where widgets live; files live in Files. A wallpaper strewn with icons is the thing every clean desktop is reacting against.
- **Mouse and keyboard, both, always.** Windows float and overlap exactly as people expect. Shortcuts exist for whoever wants them and are invisible to everyone else.
- **The rail is the one thing that is always there, on the right edge** — type into it and something happens, and beside it the day's calendar, what the agents are doing, and what needs you.
- **The known, trusted tools are already on the rail — nobody goes looking for them.** Calendar and the Council sit there from first boot, exactly as they do in the desktop app today, because they are already what people use and already trusted (see [Targets](#targets--what-adris-os-has-to-achieve)). A new person's rail is not empty on day one; it already has real capability pinned to it.
- **A launcher that behaves like Start.** Corner key, type, enter. Nobody needs teaching.
- **More than one desktop style, picked the way a wallpaper is picked.** The widget canvas isn't a single fixed look — a handful of genuinely different visual treatments ship (spacing, widget chrome, how dense or spacious it feels), and switching between them is a couple of clicks in Settings, not a rebuild. Which specific styles ship is a design-pass decision, not fixed here.
- **The wallpaper itself is a separate choice from the desktop style** — pick an image, or have an agent code one (see [§6](#6-agents-as-citizens-of-the-os)).

---

## 6. Agents, as citizens of the OS

Everything in this section is what "built around agents rather than having them bolted on" ([§1](#1-what-we-are-building)) actually means in practice. Most of it is not new work — it is what the desktop app's agents already do, ported so it works exactly the same way inside adris OS. What *is* new is named as such below.

### The roster it ships with

The existing Krew agent team from the desktop app comes across as part of "bring your work across" in [§2 Week 2, Day 13](#week-2--make-it-a-computer-you-can-work-on-17-sep) — the same specialists, the same Brain, the same campaigns, working the same way. Alongside them: **Hermes** — a new agent, not something that exists in the codebase today, worth being clear about that rather than implying it's already built. What exactly Hermes is for isn't scoped yet; it's named here as a target because the idea is good and worth building deliberately rather than rushing into the three-week window. Sits in [§13 Not in v1](#13-not-in-v1--and-when-it-comes) until it has a real spec.

### Sub-agents, and a proper team, not one generalist

The desktop app already has this shape — `delegate_to_agent` for a single specialist, `plan_workflow` for an ordered pipeline of several, the Council for several advisers arguing a decision out together. adris OS carries the same pattern, and it is the mechanism the target above ("a real agent team, not one voice") actually runs on: a task that genuinely needs several kinds of expertise gets split and handed to the agents that own each part, the same way it already works in chat today — just as native to the OS as opening a window is.

### Agents that touch documents directly

Also already real in the desktop app (`generate_document` and the underlying doc-generation code write actual `.pdf`/`.xlsx`/`.docx`/`.pptx` files, not descriptions of what should go in one). The target here is making that a normal, first-class OS capability rather than a chat feature reached through one app: an agent opening a file in Files, reading it, editing it, or building a new spreadsheet or slide deck as part of finishing a task — the same way a person would, just faster. Ported alongside the rest of the agent runtime in Week 2.

### Agents drive the real applications — we don't rebuild them

The single most important consequence of building on a real distribution ([§11](#11-how-it-is-built--and-the-exact-stack)): **adris OS never reimplements a word processor, a spreadsheet or a presentation tool.** Ubuntu already ships LibreOffice Writer, Calc and Impress, a file manager, a text editor and a terminal — the same binaries every Ubuntu user has, maintained by people who have been doing it for two decades. Our job is to launch and drive them, not to compete with them.

This is what "agents use the software" means concretely:

- The **dock launches the real application.** Clicking LibreOffice Writer in adris OS opens LibreOffice Writer — the actual program, in its own window, not a web imitation of one.
- An **agent asked to build a deck runs Impress**, the same way a person would. The document capability described above (`generate_document` and the rest, ported from the desktop app) is about producing files; this is about driving the applications that open and edit them.
- Both go through **one bridge**, not two paths — `vm/agent-bridge.mjs` in the dev VM today: the dock POSTs an app id to it, and an agent uses the same service to run a command. One surface, two callers, which is why the dock and the agents can never drift apart in what they're able to do.

**And Ubuntu is fully codeable — that is a reason for the choice, not a caveat.** Ubuntu is an ordinary Linux system: an agent can write a file, install a package, add a script, wire up a scheduled job, or build a small tool, exactly as a developer would. Nothing about picking a friendly distribution locks that down. **Verified working, 25 Aug**: an agent went through the bridge, created a file in the VM's home directory and ran a shell command, and got real output back (`Ubuntu 24.04.2 LTS`). That is the mechanism behind ["it notices your day and writes you a tool for it"](#targets--what-adris-os-has-to-achieve) — the agent isn't confined to a sandbox of our own invention, it is working on a real computer.

The boundary on that power is the one [§9](#9-making-it-yours) already draws, and it is a *permission* boundary rather than a capability one: agent-built things live in the yours-to-change space (widgets, automations, scripts, installed packages) and never rewrite the sealed core (kernel, installer, encryption, the permission model itself).

**On security, stated plainly, because the dev bridge is deliberately permissive:** the development bridge binds to all interfaces and has an unrestricted (token-guarded) `/run`. That is acceptable only inside a throwaway VM. It must never ship that way — the real thing is the Rust system layer in [§11](#11-how-it-is-built--and-the-exact-stack), enforcing the permission model this document has described from the start. The dev bridge already allow-lists `/launch` to a fixed set of applications regardless, so the loose part is exactly one endpoint and it is named.

### Wallpapers, coded rather than only chosen

Ask for one — "something calm, dark blue, moving slowly" — and Codex, Claude Code or a local model writes it: a small generative program that renders the desktop background, not a static file pulled from a stock site. It's the most literal instance of "a computer that writes its own tools" ([§1](#1-what-we-are-building)) in the whole plan, and worth calling out separately from the "notices your day and writes you a tool" target because it's simpler and safer than that one in a specific way: **a wallpaper is pure rendering.** It draws to a surface and does nothing else — no file access, no network, no agent permissions to reason about — so it doesn't need the widget sandbox that gates everything else in [§13](#13-not-in-v1--and-when-it-comes) to be safe to ship. That makes it a genuine candidate for v1 (Week 2, Day 14 — "Additions" — already has room for exactly this kind of thing), not something that has to wait for weeks 4–8 the way most agent-written output does.

Sits alongside the desktop-style picker in [§5](#5-the-desktop) as one of the screens in [§3](#3-claude-design-comes-first) — a person can pick a still image, or hand the job to an agent instead.

---

## 7. Agents across machines

The idea: two adris OS users who actually know each other — same office, a friend group — pair their machines once, and from then on their agents (and the people themselves) can reach each other over the network, asking for exactly what a task needs rather than syncing everything. Genuinely valuable overnight, when several paired machines are all in server mode ([Targets](#targets--what-adris-os-has-to-achieve)) and nobody is awake to relay anything by hand.

This is written down in real detail because it's a good idea, not because it's decided — it is **not in v1**, and it is not simple. Treat everything below as the shape of the answer, not a commitment to build it this way.

### The general case: any hardware, not only another adris OS

The agent-to-agent pairing above is one specific use of a broader thing worth stating as its own target: **connecting to other hardware has to be easy enough for someone non-technical to do it themselves** — a laptop, a printer, a phone, another computer that isn't running adris OS at all — over whichever of WiFi, Bluetooth or a wired connection is actually available, the same unglamorous way pairing a Bluetooth speaker already is for anyone. This is the transport layer; the agent-pairing story above is the most interesting thing built on top of it, not the whole of what it's for.

- **The bar is "as easy as pairing a speaker," not "as easy as configuring a network."** Discover what's nearby, tap the one you mean, done — no IP addresses, no ports, no manually trusting a certificate.
- **Wired stays an option, not an afterthought.** A direct cable is the most reliable connection there is — faster, no interference, works when WiFi is congested or absent — and shouldn't be a second-class path just because it's the least glamorous one.
- **This is the same system layer as everything else that touches a network or another machine** — see the Rust row for cross-machine connections in [§11](#11-how-it-is-built--and-the-exact-stack). A connection request is exactly the kind of privileged operation that layer exists to gate, whether the other end is a paired adris OS user or a printer that has never heard of any of this.

### Can it work without a central database? Yes — but it changes what the feature actually promises

WhatsApp needs a server because it guarantees delivery even when you're offline for a week — that guarantee is what the database is *for*. Giving that up is what makes a database avoidable:

- **Pairing, once.** The two users exchange a one-time code or key — closer to how Tailscale or Syncthing pair a device than how a chat app adds a contact. This establishes *trust*, not a conversation; nothing about a message is stored by this step.
- **Same office, same network:** the simplest and most solid case. Machines on the same LAN find each other directly (local network discovery — no internet, no external server, no third party ever sees the traffic). This alone probably covers "same office" entirely.
- **Different networks (friends elsewhere):** two home networks generally can't find each other's live address without *some* third party's help — this is a basic fact of how home internet connections work (NAT), not a design choice. The honest fix is a small **rendezvous** service: it introduces two already-paired machines to each other's current address and then gets out of the way — closer to a phone switchboard connecting a call than a mailbox holding letters. It never sees or stores what's actually said; once the two machines are connected, everything flows directly between them, encrypted, and the rendezvous step forgets it happened.
- **The real trade-off, stated plainly:** no database means no store-and-forward. If the other machine is off or asleep (not in server mode) when something is sent, it is not sitting in an inbox waiting — it simply doesn't arrive until both are online together, or it's asked for again later. That is a genuinely different promise than WhatsApp's, and worth being upfront about rather than discovering it in use.

### Only what the task needs — never a sync

An agent talking to a paired user's agent asks a specific, named question — "what's your open slot Tuesday," "do you have file X," "did that step finish" — and gets a specific, named answer. Never a blanket sync, never standing access to the other person's Brain, calendar or files. This is the cross-machine version of the rule already in [§11](#11-how-it-is-built--and-the-exact-stack) ("an agent can never be given more permission than the agent that created it") — extended so it also holds across a network boundary between two different people's machines, which is a harder promise to keep than within one machine and deserves its own real design pass before anything ships.

### People, not just agents

The same paired connection is also just a way for the two *users* to message each other directly — no separate app, no separate account, the same "no central store" trade-off applies (a message sent while the other machine is offline doesn't arrive until it's back). Simpler than the agent-to-agent case, but shares the same pairing and connection mechanism, so it is worth building as one feature rather than two.

### Supervision — this is the part that must not be gotten wrong

Two machines' agents making decisions together, unsupervised, is exactly the kind of thing that can quietly go wrong in a way that costs someone real work. So the plan splits tasks into two kinds, and the split is the safety mechanism, not a suggestion:

- **Server-mode-safe** — bounded, reversible, low-stakes, and from a pre-approved category the user set up in advance: relaying a status, fetching a fact that was already explicitly shared, a routine check the user already signed off on. These can run overnight, agent to agent, without asking each time.
- **Needs a human, always** — anything that sends, changes, deletes or commits to something on the user's behalf, or reaches a person/machine that hasn't been paired before. These wait for the user, even if that means waiting until morning. No exceptions for "it seemed urgent" — an agent that guesses wrong here is the actual risk this whole section exists to prevent.

This is a stricter version of the same rule [§13](#13-not-in-v1--and-when-it-comes) already states for server mode generally ("power, heat, and what happens when something needs you at 3am") — cross-machine makes the stakes of getting that wrong higher, not lower, because now someone else's machine and someone else's trust are involved too.

**Where this sits:** logged here as a real, wanted target with a real technical answer to "can this work without a database" — but it needs its own design pass (pairing UX, exactly what counts as a pre-approved category, what the failure mode looks like when a rendezvous step is unreachable) before it gets a place on the week-by-week timeline. See [§14.3](#143-agents-across-machines).

---

## 8. Files, folders and locks

Two specific asks, both good calls — one because it makes a screen readable at a glance, one because it is the feature people ask about before they trust a computer with anything.

### Every folder gets a colour and an icon, from its name

No setup, no right-clicking. adris OS recognises what a folder is for and marks it, so a window full of folders can be read without reading any words.

| Folder | Icon |
|---|---|
| Invoices | ₹ |
| Contracts | 📄 |
| Photos | 📸 |
| Clients | 👥 |
| Reports | 📊 |
| Backups | 💾 |

Names we do not recognise still get a colour, worked out from the name itself — so the same folder is the same colour on every machine, and two folders side by side are never the same shade. You can override any of it, but you should never have to.

### A passcode on the folders that need one

Right-click a folder → **Lock** → set a passcode. It closes, and opening it asks for the code.

**Real, not decorative.** A lock that only hides a folder from our own window is theatre — the files are still sitting there for anything else to read. Locking genuinely encrypts the folder's contents, so someone who takes the laptop, or boots it from a USB stick, gets nothing readable out of it.

Which means the honest warning has to be on that dialog: **forget the passcode and the files are gone.** There is no way for us to open them, and any product that says otherwise was never really encrypting anything.

### Your Windows files are simply there

Nothing to import, no sync, no duplicate copies. adris OS mounts the Windows disk and shows Documents, Desktop, Downloads and the rest exactly where they were. A spreadsheet edited here on Tuesday is the same file, already correct, when Windows opens it on Wednesday.

---

## 9. Making it yours

The Framework-laptop comparison, made concrete: they sell a laptop whose parts you can open, swap and understand. This is the software version — the parts you use every day are readable, changeable and revertible, while the engine stays sealed.

### Yours to change

Anything Claude Code, Codex or a local model can add for you:
- Widgets — new ones, or changes to the ones you have
- Automations and scheduled jobs
- Agents, and what each one is allowed to do
- Theme, layout, what sits in the rail
- Desktop style, and the wallpaper — including one an agent codes for you ([§6](#6-agents-as-citizens-of-the-os))
- Folder colours and icons
- Anything you install

### Sealed

The parts that must not break, because a broken one means a computer that will not start:
- The kernel and drivers
- The desktop shell itself
- Startup, the picker, the installer
- Folder encryption
- Updates

### Everything you change is undoable

Your settings, widgets, agents and automations live in one version-controlled folder that keeps its own history. Every change — whether you made it or an agent did — is recorded with a note saying what it was. Undo is one button, not a feature we have to invent, and it works even for a change made three weeks ago.

It also means the whole machine is portable: that folder *is* your workspace. Copy it and you have moved — which is what makes [§10](#10-going-back-to-windows) true.

---

## 10. Going back to Windows

This has to be genuinely easy or nobody will risk trying it in the first place. It is not an escape hatch bolted on at the end — it is a consequence of how the thing is built.

- **Restart and pick Windows.** It is on the startup screen, every time. Nothing to undo, nothing to uninstall.
- **Your files never moved.** They were on the Windows disk the whole time, being edited in place.
- **Your work comes with you.** The desktop app reads the same workspace folder, so your agents, Brain and campaigns are there when you get back.
- **Removing it completely** is deleting the partition and the startup entry — one screen in Settings, and Windows boots the way it did before.
- **Locked folders travel as encrypted files** — readable from Windows with the same passcode, not stranded on the other side.

### Taking over the machine, and handing it back

The intended shape, stated plainly because it decides a lot of other things: **adris OS takes over the computer while it is on, and hands it back on request.** Not a program running inside Windows, and not a replacement that burns the bridge behind it.

**While adris OS is running, it is the computer.** It is what boots, what draws the screen, what owns the keyboard. Windows is still there, whole and untouched, on its own partition — it simply is not the thing running. That is the same relationship any two operating systems on one machine have; nothing is being disabled or damaged, it just isn't the one in charge right now.

**Going back is a switch, not an uninstall.** Two levels, and the difference matters for a non-technical owner:

| What they want | What they do | What happens |
|---|---|---|
| "Use Windows for a bit" | Restart, pick Windows at the startup screen | Ordinary dual boot. adris OS stays installed, exactly as it was. |
| "Stop adris OS taking over" | **Settings → Turn off adris OS** — one switch | The machine goes straight back to booting Windows every time. adris OS stays on disk, and the same switch turns it back on. Nothing is deleted, nothing needs reinstalling. |
| "Remove it entirely" | Settings → Remove adris OS | The partition and the startup entry go. Windows boots exactly as it did before. Their files were never inside adris OS to begin with. |

**Why the middle row exists at all.** For the audience this is built for, "I want to stop using this" and "I want to erase this" are completely different feelings, and offering only the second one makes trying the first one frightening. A single **off switch** — reversible, no data touched, no reinstall to come back — is what makes installing it a low-stakes decision rather than a commitment. **Being easy to leave is what makes it safe to try**, and that is a feature, not a concession.

**The four things this has to be, in the order a non-technical person meets them:**
1. **Easy to install** — one download, one click, no ISO-burning folklore ([§4](#4-getting-on-to-it)).
2. **Easy to get into** — it starts itself and shows the desktop; nothing to launch or configure ([§5](#5-the-desktop)).
3. **Easy to learn** — familiar shapes, plain words, real documentation ([§1](#1-what-we-are-building), and the omarchy note in the Build log).
4. **Easy to leave** — the table above. One switch to stop, one to remove, files untouched either way.

**Not built yet** — this is the design, not the state. Today the switch does not exist because the startup picker and installer do not exist ([§4](#4-getting-on-to-it), items 18 and 10 on the [status board](#status-board--read-this-first)). It is written down now because it constrains how the installer and Settings get built, and deciding it afterwards would mean rebuilding both.

---

## 11. How it is built — and the exact stack

Everything above the line is ours; everything below it is proven work we are not repeating.

**Pinned now, on purpose, so nobody has to guess or argue about it later:** design and code coming in from outside this team — a contractor, a Claude Design export, anything — targets this exact stack. Not because it's the only stack that could work, but because it's the stack our own agents (Claude Code included) already know cold from `nivara-desktop`, so the same team and the same agents move between the OS and the desktop app without switching languages, conventions or muscle memory. That's a real speed advantage, not a preference.

| Layer | What we use | Language | Why |
|---|---|---|---|
| The desktop shell + every widget | Our own shell — React | **TypeScript** | Every widget is a React component — what you can read, what Claude Code writes best, and what our design system already targets. Same language the desktop app's UI is already written in. |
| The system layer — permissions, the widget sandbox, native glue to the compositor | A thin native layer, Tauri-style | **Rust** | Memory-safe, fast, and already exactly how `nivara-desktop`'s backend is built — the same skillset and the same agents carry straight over. This is also where the agent-permission rule below gets *enforced*, not just stated, so it has to be a language that makes that safe to write. |
| Screen and windows | An existing, proven Wayland compositor (wlroots-based — e.g. a configured/extended minimal compositor such as `labwc` or `sway`, set to float, not tile) | Mostly C (upstream) + our config/glue in Rust | We are not writing a compositor from scratch — that is its own multi-year project. We configure and lightly extend a proven one. Tiling is a setting, not a law; floating is what everyone already understands. |
| Panels on the screen edge | Layer-shell | Rust bindings over the C protocol | What turns a window into a real desktop panel. Confirmed working from a native package — but **not** from an AppImage, which forces a compatibility mode that breaks it. |
| Base system + the custom ISO | **Ubuntu LTS** + its own image tooling (live-build / Cubic) | Python/shell (Ubuntu's own tooling — we are not introducing a new one) | The most-used desktop Linux by a wide margin, which is the whole argument — see "Why Ubuntu, specifically" below. LTS releases are supported for years, so a machine we ship does not need re-basing every nine months. |
| Locked folders | Filesystem-level encryption | Rust (calling proven system libraries — not reimplementing crypto) | Real encryption per folder, unlocked by passcode, readable from Windows too. |
| Windows files | The kernel's own NTFS support | — (kernel-level, no app code) | Read and write the Windows disk directly. No copying, no sync, nothing to go wrong. |
| Your workspace (settings, widgets, agent config, undo history) | A single version-controlled folder | Git itself + a thin TypeScript layer for the undo UI | Gives us undo, history and portability without building any of them from scratch. |
| The switch — USB writer + installer trigger, run from Windows | A small Windows helper | **Rust** | Same reasoning as the system layer — one language for anything that touches the OS or the disk, on either side of the picker. |
| Agent orchestration, sub-agents and document I/O ([§6](#6-agents-as-citizens-of-the-os)) | The same agent runtime patterns as the desktop app | **TypeScript** (agent logic) calling into the **Rust** system layer for anything privileged | An agent asking "open this folder" or "schedule this job" is a widget-shaped request; an agent asking to touch the disk or another agent's permissions is a system-layer request. Keeping that split by language keeps it visible in the code, not just in a comment. |
| Cross-machine pairing and connections ([§7](#7-agents-across-machines), not yet scoped) | A peer-to-peer connection layer, once designed | **Rust** | Anything that opens a network connection to another person's machine is exactly the kind of privileged, trust-sensitive operation the system layer exists for — never left to the widget layer. |
| The public website / waitlist ([§2](#2-three-weeks-honestly)) | The existing adris.tech site | HTML/CSS/vanilla **JavaScript** + **Supabase** | Not part of the OS build — matches what the rest of the live site already is. No reason to introduce anything new for one page. |

**In short, for anyone joining from outside: if it renders on screen, it's TypeScript/React. If it touches the system, the disk, a permission, or another machine, it's Rust. If it's OS-image plumbing, it's Ubuntu's own Python/shell tooling. If it's the public website, it's what the website already is. Nothing else.**

### Why Ubuntu, specifically — and what "Linux vs Ubuntu" actually means

Worth settling in plain words, because the question comes up constantly and the two names get used as if they were alternatives:

**They are not two competing things.** Linux is the *kernel* — the core that talks to the hardware. It is not something a person uses directly; on its own it has no desktop, no windows, no file manager, no way to install an app. **Ubuntu is a distribution**: the Linux kernel *plus* everything that makes it a usable computer — a desktop, drivers, an installer, an app store, a package manager, and years of work making all of it hold together. Asking "Ubuntu or Linux" is like asking "a car or an engine." **You cannot ship "Linux" to a business owner. You ship a distribution.**

So the real question was only ever *which* distribution, and the answer follows straight from [Targets](#targets--what-adris-os-has-to-achieve) — non-technical people first:

- **Ubuntu is the most-used desktop Linux by a wide margin**, and that is not a popularity contest, it's a support argument: the largest pool of existing users, the most "how do I…" answers already written, the most third-party software that ships an Ubuntu build first (usually a `.deb`), and the most hardware vendors who certify against it. For an audience that will search the web the moment something goes wrong, being on the distribution the entire internet already writes about is a genuine feature.
- **LTS releases are supported for years.** A machine sold to a business cannot need re-basing every nine months. This is also why the earlier Fedora pick was wrong for this specific audience — Fedora moves fast and is superb for developers, which is exactly the audience we already said we are *not* optimising the tie-breaks for.
- **It's what we're already testing on.** The WSL VM the frontend runs in today is Ubuntu 24.04 LTS. The plan said Fedora while every actual test ran on Ubuntu — this section makes the document agree with reality rather than the other way round.

**And "the tech requirements from Linux" still hold, because Ubuntu *is* Linux.** Nothing about choosing Ubuntu gives up kernel-level capability — the same kernel, the same drivers, the same terminal, the same ability to run anything Linux runs. A technical user who wants to go straight down to the metal has every bit of that available. Ubuntu adds a well-maintained, well-tested layer on top; it removes nothing from underneath.

**Where adris OS sits in that stack:**

| Layer | What it is | Who it's for |
|---|---|---|
| Linux kernel | Hardware, drivers, processes, filesystems | Nobody uses this directly |
| **Ubuntu LTS** | Desktop plumbing, drivers, package manager, the ordinary Linux apps (LibreOffice and the rest) | The proven base we don't rewrite ([§9 Sealed](#9-making-it-yours)) |
| **adris OS** | Our shell, rail, widgets, Files, the agent runtime, the installer and startup picker | **This is the part that is ours** |

Ordinary Ubuntu applications keep working, and are meant to — see [§6](#6-agents-as-citizens-of-the-os): the plan has never been to re-code a word processor. LibreOffice, a PDF viewer, a browser and the rest are already there because they are part of the distribution, and the agents *drive those real applications* rather than us reimplementing them.

**One rule worth writing down now, because it is cheap today and expensive later:**
> An agent can never be given more permission than the agent that created it.

Permissions only narrow going down. It is the thing that makes agents creating agents safe rather than alarming — and it is the rule everything in [§14](#14-open-threads--not-yet-scoped) has to be checked against before it ships. [§7](#7-agents-across-machines) is this same rule extended across a network boundary between two people's machines, which is why it needs its own design pass rather than inheriting this one automatically.

---

## 12. Licensing

Raised as a plan: put an MIT licence on the ADRIS-OS GitHub repo, with an open question about whether that means the source has to be public. Worth separating into two different decisions, because they get conflated easily and they are not actually the same choice.

**The license text and public visibility are two separate switches.** A `LICENSE` file with the MIT text in a repo does nothing on its own — licensing only matters once someone else is actually given the code. A **private** repo with an MIT `LICENSE` file sitting in it is completely normal (plenty of projects prep their license before ever going public) and commits to nothing yet. The repo can stay private for as long as we want, with the file ready for the day it flips to public.

**What MIT actually grants, once the repo *is* public:** anyone can use it, modify it, and sell it — including a rebranded competitor — with no obligation to share their changes back (unlike GPL/AGPL, which force that) and no obligation to do anything beyond keeping the original license notice attached. That's the trade-off: maximum trust and adoption, zero defensive moat. Good for a widget SDK or shell API we *want* people building on top of; bad for anything we'd rather competitors couldn't simply take.

**A split that already fits the plan, rather than being a new decision:** [§9](#9-making-it-yours) already draws the line between *Sealed* (kernel glue, the installer, folder encryption, the agent-permission model — the parts that must not break) and *Yours to change* (widgets, automations, theme, agent config). The natural place for an MIT licence, when the repo does go public, is the SDK/API surface that lets people build widgets and agents against adris OS — the same surface §9 already calls "yours to change." The *Sealed* half is the part worth keeping closed for longer, license or no license, simply because it's what a fork could most easily turn into a competing, rebranded product.

**Practical recommendation, not a legal opinion:** add the MIT `LICENSE` file to the repo now if there's a wish to have it ready — it costs nothing and settles the question in advance. Keep the **repository itself private** until the Sealed/Yours-to-change split above is actually real in the code, not just in this document, then decide visibility deliberately rather than by default. Flipping a private repo public later is one click; un-forking a public one that got copied on day one is not possible at all.

This isn't legal advice — worth a real lawyer's five minutes before the repo actually goes public, especially on anything involving trademarks (the "adris" name itself is not covered by any code license).

---

## 13. Not in v1 — and when it comes

Everything here is worth building. None of it fits in three weeks alongside a bootable operating system, and pretending otherwise is how the date slips.

| Left out | Why not now | When |
|---|---|---|
| **The app store** — install anything from GitHub | A repository is not an app. Making arbitrary source run reliably is weeks of work on its own. | Weeks 4–7 |
| **Agents that write your widgets** — including noticing a task that repeats every day and building a dedicated tool for it *unprompted*, not only when asked (see [Targets](#targets--what-adris-os-has-to-achieve)) | Needs the widget kit and the sandbox finished first. It is the best idea we have and it deserves more than a rushed fortnight. | Weeks 5–8 |
| **Hermes** ([§6](#6-agents-as-citizens-of-the-os)) | Not yet scoped — a new agent, not something being ported from the desktop app. Deserves a real spec before a timeline. | After it's scoped |
| **Looping** — the self/agent-to-agent continuation primitive ([§14.2](#142-looping--an-agent-that-keeps-itself-going)) that Server mode and multi-agent teamwork actually run on | Needs the runaway-loop check and the supervision split worked out first — see the open questions in §14.2. | Weeks 6–8, alongside Server mode |
| **Server mode** — lid shut, work continues | Power, heat and what happens when something needs you at 3am. Genuinely hard to get right. | Weeks 6–8 |
| **Agents across machines** ([§7](#7-agents-across-machines)) | Cross-machine trust, pairing and supervision — the highest-stakes item on this whole list, since it involves someone else's machine, not just the user's own. Needs its own design pass, not a rushed build. | Not yet timed — see [§14.3](#143-agents-across-machines) |
| **Default-deny lockdown** | Security that half works is worse than none, because people trust it. | Weeks 8+ |
| **Cloud sync** | Copying the folder covers it for v1. | Weeks 6+ |
| **Running Windows software** (Tally and similar) | Depends on the Tally test in [§15](#15-risks). Until then, Windows stays one restart away — which is why the startup picker matters. | After the test |

---

## 14. Open threads — not yet scoped

Ideas raised in planning that are **not yet decided** and are not in the week-by-week plan above. Written down here so they aren't lost, and so nothing gets built against them until they're actually resolved.

### 14.1 GitHub repo → a widget/tab, usable by the user *and* the agents

Not a normal "app store install" — the ask is specifically that a downloaded repo can become something an **agent calls as a tool**, not only something a human opens as a window. This is the same gap the table in [§13](#13-not-in-v1--and-when-it-comes) already names ("a repository is not an app") but made concrete in a direction the current app-store line doesn't fully cover — and it is one of the named [Targets](#targets--what-adris-os-has-to-achieve) at the top of this document, so it is real and wanted, just not yet scoped:

- Needs a manifest format — something like `adris-widget.json` — declaring what a repo *is*: UI it renders (if any), what OS/agent capabilities it needs, what it exposes as a callable tool.
- Needs the sandbox from [§11](#11-how-it-is-built--and-the-exact-stack) to exist first — the "an agent can never be given more permission than the agent that created it" rule only holds once there's a real permission boundary to enforce it against. Building the repo-loader before the sandbox means shipping something that can't actually be trusted yet.
- Two consumers, not one: a person opening it as a widget, and an agent discovering it can be called as a tool. Worth deciding whether that's one mechanism or two before design work starts.

**Decision needed:** does this fold into the existing "app store" line in [§13](#13-not-in-v1--and-when-it-comes) (weeks 4–7), or is it different enough to be its own line item with its own timeline?

### 14.2 Looping — an agent that keeps itself going

Started as three unresolved readings of "looping"; now resolved to a specific one. **Not** a widget type (that's automations, already covered in [§9](#9-making-it-yours) under *Yours to change*), and not a UI pattern — it's an **OS-level loop primitive**: an agent can re-prompt *itself* to carry on a task ("keep checking this," "keep going until X is true"), or hand off to *another* agent to take the next step, without the user re-typing the instruction each time it needs to continue. It survives reboots and shows up on the rail as a real, visible running thing — not a background process nobody can see.

This is not a new, unproven idea — Claude Code itself already has a working version of exactly this (a "keep going, check in periodically, stop when nothing's changing" loop with its own pacing). adris OS needs the same shape as a first-class OS primitive rather than something one tool happens to do, because it's what [Server mode](#targets--what-adris-os-has-to-achieve) and the multi-agent teamwork in [§6](#6-agents-as-citizens-of-the-os) both actually run on underneath — one mechanism, not a separate trick built into each feature.

**What's still open:**
- **What stops it from looping on nothing.** A step counter alone isn't enough — an agent that "keeps going" but produces nothing new for several cycles has to recognise that and stop and ask, not burn the rest of the day repeating itself.
- **Where the supervision line falls.** The same server-mode-safe / needs-a-human split [§7](#7-agents-across-machines) requires for cross-machine work applies here too, on a single machine: a loop that only checks a status is fine running unsupervised; a loop that sends, changes or deletes something on every cycle is not, and needs the same "always waits for a person" rule.
- **"Prompt another agent" can mean two different things.** The same machine's own team ([§6](#6-agents-as-citizens-of-the-os)), or reaching across to a paired user's agents ([§7](#7-agents-across-machines)) — those need different supervision rules, so this should not be designed as one undifferentiated mechanism even though it feels like the same idea.

Because it underlies Server mode, it likely lands around the same time — see [§13](#13-not-in-v1--and-when-it-comes).

### 14.3 Agents across machines

The full shape of this is written out in [§7](#7-agents-across-machines) — pairing, a no-database peer-to-peer connection, agents asking each other for only what a task needs, people messaging each other the same way, and a hard split between what's allowed to run unsupervised in server mode and what always waits for a human. Logged as its own open thread, separately from the other two above, because it's the biggest one here: it's the only item on this whole list where getting a decision wrong doesn't just cost the user their own work, it involves someone else's machine and someone else's trust too.

**Decisions needed before this can be timed at all:**
- What exactly counts as a "pre-approved category" a task can fall into to run unsupervised in server mode — this list has to be specific and small, not a general permission.
- How pairing actually works for someone non-technical — a code they read out loud to a friend on a call, a QR code, something else.
- What happens when the rendezvous step (needed for two different home networks to find each other) is down — does the feature just quietly not work that day, and is that acceptable.

---

## 15. Risks

| Risk | How bad | What we do |
|---|---|---|
| Tally and other Windows-only business software | High | Test it in week 1, not week 3. Either way Windows stays on the startup screen, which is why this changes the pitch rather than the plan. |
| The installer damages someone's Windows | High | Refuse to resize until the BitLocker key is confirmed saved. Test on three real machines in week 3. Offer "install to a second drive" as the safe route. |
| An unsupervised agent-to-agent decision, once [§7](#7-agents-across-machines) exists, does something wrong on someone's machine | High | This is exactly why §7 is not in v1 and stays an open thread rather than a scoped feature: the server-mode-safe / needs-a-human split has to be designed and tested before any cross-machine agent action runs without a person watching. |
| Hardware that does not work — wifi, sleep, screens | Medium | Ubuntu has the broadest hardware support and the most certified machines of any desktop Linux, and is what most vendors test against. Ship a list of machines actually tested rather than claiming it runs everywhere. |
| Three weeks is not enough | Medium | The order is the mitigation: week 1 gives something that boots, week 2 something usable, week 3 something installable. A slip loses the last item, never the whole thing. The [VM-first loop](#the-day-to-day-loop--a-vm-first-real-hardware-as-the-last-mile-check) is what makes Weeks 1–2 fast enough to actually hold that order. |
| Panels do not work with our shell | Low | Evidence says they do from a native package. Day 4 settles it, and the fallback — a full-screen window — costs almost nothing. |
| A repo goes public before the Sealed/Yours-to-change split is real (see [§12 Licensing](#12-licensing)) | Medium | Keep the repo private by default; only make it public as a deliberate decision once the split actually exists in code. |

---

## 16. Before I start

Five things. The first four are the user's call; the last one can be decided on day one by default if there's no objection.

1. **Approve the three-week scope.** A bootable, installable adris OS with the desktop, Files and widgets — store, agent-written widgets, Hermes, cross-machine agents and server mode land in weeks four onward. If the store needs to be in v1, something else has to come out — say which.
2. **Design the screens.** Days one and two, in Claude Design. Whatever comes out of that gets built exactly as designed, against the stack pinned in [§11](#11-how-it-is-built--and-the-exact-stack) — most leverage, least effort, right here.
3. **Say what the waitlist perks are.** The Week 1 waitlist ([§2](#2-three-weeks-honestly)) needs a real answer for what a signed-in join and an email-only join each actually get, before the page copy can be written.
4. **Decide repo visibility now, or decide to decide it later.** Add the MIT `LICENSE` file whenever — it's free — but say whether the ADRIS-OS repo goes public immediately or stays private until the Sealed/Yours-to-change split is real (see [§12](#12-licensing)).
5. **Test Tally in week 1.** Half a day, and it decides whether this is for the businesses already being sold to, or a different audience — worth knowing on day three, not day twenty. (The base is settled: Ubuntu LTS — see [§11](#11-how-it-is-built--and-the-exact-stack).)

---

*Drafted 24 August 2026 · target 14 September 2026 · adris OS lives entirely under `ADRIS-OS/` (with the one stated exception in the header above) and does not affect the desktop app, which continues shipping on its own schedule. Nothing in this plan has been built yet.*
