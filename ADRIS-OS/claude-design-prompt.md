# adris OS — Claude Design brief

Paste this whole thing into Claude Design (or hand it to `/design`) to start the screens from [`plan.md`](./plan.md) §3. Full context — why each screen exists, what "not v1" means, the rest of the product — is in that file; this is the condensed version built specifically to brief a design tool.

---

## The pitch, in one breath

adris OS is a real, bootable operating system — Linux underneath, our own shell on top — built for someone who has never used Linux and never wants to think about the fact that they are. It looks and behaves like something Apple would ship. It is built *around* agents rather than having them bolted on: you tell it what you do, and it builds small things — a button, a panel, a nightly job, even the wallpaper — that do it for you. A two-account startup screen lets someone try it from a USB stick without touching their existing Windows install, and walk away from it just as easily if it's not for them.

**Audience: non-technical business owners first.** Every design decision that has to choose between "clever for someone technical" and "obvious for someone who has never opened a terminal" picks the second. Technical users are still fully served (nothing is hidden or dumbed down — see "Yours to change" in `plan.md` §9), but they are not who the tie-breaks are decided for. This is also why the visual bar is Apple-level, not "acceptable open-source tool" level: for this audience, how it looks *is* how trustworthy it feels.

---

## Visual system — reuse, don't invent

adris OS is a second surface of the same product as the existing adris.tech desktop app, so every screen uses its **actual** design tokens, not a fresh palette:

**Typography**
- UI / headings: `Space Grotesk`, falling back to `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif
- Monospace (code, technical labels, the odd terminal-flavoured detail): `ui-monospace`, `SFMono-Regular`, `Menlo`, monospace

**Accent**
- `#7C5CFF` (primary accent), `#5B3EDF` (dimmed/pressed state)

**Dark theme — "ink" (the default)**
- Background `#0A0A0A` · Surface `#141414` · Surface (raised) `#1E1E1E` · Border `#2A2A2A` · Text `#F2F2F2` · Faint/tertiary text `#8B8B95`

**Light theme — "paper"**
- Background `#FFFFFF` · Surface `#F4F4F5` · Surface (raised) `#E4E4E7` · Border `#D4D4D8` · Text `#09090B` · Faint/tertiary text `#6B6B74`

Design **every screen in both themes.** Something moved between adris OS and the desktop app has to look native in either.

**Why this matters more than usual:** the desktop shell gets *built* by Claude Code directly from what comes out of this design pass, as real React + TypeScript components (see the exact stack in `plan.md` §11). A screen that stays inside real, ordinary layout — flexbox/grid, standard components, nothing that only a specific export format can reproduce — turns into working code in hours. A layout that leans on effects or structure that don't translate turns into a slow rebuild. Keep it buildable, not just pretty.

---

## The screens

Eleven now — design each one as a real, content-filled screen, using the example content below directly rather than lorem ipsum, since it's the actual content the product will show.

### 1. The startup picker
The very first thing anyone sees, before Linux or Windows has even loaded — a themed boot menu, not a plain text list.
- Two large cards, side by side or stacked: 🪟 **Windows** — "your usual desktop", and 🖥️ **adris OS** — "your agents".
- Arrow-key or mouse selection. Whichever was picked last time is visually the default, with a ten-second countdown before it auto-boots.
- Tone: calm, confident, zero jargon — this is the one screen where someone with no technical background has to make a correct choice with no instructions.

### 2. The desktop
The whole product in one image — design this one with the most care.
- **Rail on the right edge of the screen; the rest is the widget canvas.** Not centred, not top-anchored — the home panel lives on the right, permanently.
- **No file icons on the desktop.** The canvas is entirely widgets.
- Windows float and overlap like a normal desktop — this is not a tiling window manager.

### 3. The rail — the home panel
Pinned to the **right edge**, always there, as a real desktop panel (not a floating window) — everything in one place, so nobody has to go looking for it.
- What sits in it, top to bottom: an `Ask adris…` input, a clock, a compact calendar preview (e.g. `10:00 Demo`, `14:30 Vendor call`), an `Agents · 2 running` indicator, notifications, an apps affordance.
- **Pinned, trusted tools live here by default from first boot** — specifically Calendar and the Council (a "put this decision to five advisers" feature) — so a brand-new install already has real, visible capability, not an empty panel waiting to be filled in.
- Should read as a genuine command centre for the day, not a thin sidebar of icons.

### 4. A widget, in three states
Design one representative widget (e.g. "Today's outreach"), placed on the widget canvas, three times over:
- **Resting** — its normal idle state, showing real data (`12 ready · 3 sent`, next action time).
- **Working** — visibly doing something right now (an agent actively running inside it) — this state needs to read as "alive," not just a spinner.
- **Finished** — just completed something, with a clear, satisfying "done" state before it settles back to resting.
- Also show one **user-added** widget with a visibly dashed border and a small `you added this` label (e.g. "Vendor chaser ✦ — Tue mornings") — the dashed-border distinction between shipped and added widgets needs to read clearly at a glance, on the canvas among the shipped ones (Calendar, Council, Today's outreach, Inbox `4 need a reply`, local-model status `qwen · idle`, Disk & battery `62% · 4h left`).

### 5. Desktop styles
**Not one fixed look for the widget canvas — several.** Design **2–3 genuinely different visual treatments** of the same desktop (same widgets, different spacing, different widget chrome, different density — think "minimal and airy" versus "dense dashboard" versus something in between), and the small picker UI for switching between them. Switching styles should feel as easy and low-stakes as switching a wallpaper always has, not a settings-menu chore. (The exact style names/directions are open — invent 2–3 real, distinct ones here rather than one generic "alt theme.")

### 6. Wallpaper
The background itself, as its own screen, separate from desktop style:
- A simple picker for a static image.
- **A path for an agent-coded wallpaper** — someone types what they want ("something calm, dark blue, moving slowly") and Codex, Claude Code or a local model writes a small generative background instead of pulling a stock image. Design the request flow (a short prompt field, a preview, an apply/regenerate step) — this is one of the most literal instances of "a computer that writes its own tools" in the whole product, worth making feel a little special rather than buried in a settings list.

### 7. The launcher
What appears when the corner key is pressed — behaves like Start/Spotlight: type, and something happens. Keep it minimal — a search field, a short result list, nothing more.

### 8. Files
The file manager window — this is the screen people will judge the product's trustworthiness by, so it needs real polish.
- Every folder gets an automatic colour and icon from its own name, no setup required. Show a representative set: ₹ **Invoices**, 📄 **Contracts**, 📸 **Photos**, 👥 **Clients**, 📊 **Reports**, 💾 **Backups** — six visibly different colours, clearly legible without reading the labels.
- A padlock icon on any folder that's been locked.
- Show how the mounted Windows drive appears alongside adris OS's own folders — it should look native, not like an imported/foreign volume.

### 9. The locked-folder prompt
One small, focused dialog — right-click a folder → Lock → set a passcode. Needs:
- A passcode entry field.
- A **clear, honest warning**, not buried in fine print: forgetting the passcode means the files are unrecoverable — there is no backdoor. This dialog is where people decide whether to trust the product's security claims, so the tone should be plain and serious, not scary or over-designed.

### 10. Settings
Deliberately small and written in plain words — this is explicitly **not** meant to look like a control panel with forty toggles. A short list of real, human-readable settings: theme (paper/ink), desktop style, wallpaper, what's in the rail, connected accounts, and similar. Nothing more.

### 11. First run
The onboarding a brand-new person sees, once, before ever reaching the desktop. Exactly **three questions** — no more — that set up the experience for them. (What those three questions actually ask is still open — design the screen shape and flow; the exact question copy can be filled in once decided.)

---

## What NOT to design (out of scope for this pass)

Per `plan.md` §13, these are real and coming, but not part of the screens above — don't let them creep in:
- An app store / browsing GitHub repos
- Any UI for "agents writing your everyday widgets" automatically (the coded *wallpaper* above is explicitly in scope — it's a different, much lower-risk thing; see `plan.md` §6)
- Server-mode-specific UI (lid-closed indicators, etc.)
- Cross-machine pairing/connection UI (the "agents across machines" idea)

---

## One thing worth remembering while designing

The product's own tagline: *"adris OS is a computer that writes its own tools. You tell it what you do, and it builds small things — a button, a panel, a nightly job — that do it for you."* Every screen should feel like it belongs to a computer that's quietly doing real work for its owner, not a Linux desktop that happens to have agents attached to it.
