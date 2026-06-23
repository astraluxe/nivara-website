# adris.tech — Product & Financial Reference

Last updated: 2026-06-22 | krew-stream v33 | get-session-key v2 | app v1.0.66 live

---

## AI Model

**All plans: `gemini-3-flash-preview`**
Unified as of krew-stream v32. Was tiered before (lite for free/solo) but lite model was too weak for multi-step tool chains → 110s+ waits. Tiering is now by **token limit only**.

| Direction | Rate |
|-----------|------|
| Input | $0.50 / 1M tokens |
| Output | $3.00 / 1M tokens |
| Blended (~70% in / 30% out) | **~$1.75 / 1M tokens ≈ ₹147 / 1M** |

FX: $1 = ₹84 (check live before quoting — use web_search "USD to INR today")

---

## Plan Pricing & Token Limits

| Plan | Price/month | Token limit/month | AI cost @ 100% (₹165.4/M) | Gateway (2%) | Net profit | Margin |
|------|------------|-------------------|-----------------------------|-------------|------------|--------|
| `free` | ₹0 | 100,000 | ₹16.54 | ₹0 | −₹16.54 | — (acquisition) |
| `explore` | ₹0 | 100,000 | ₹16.54 | ₹0 | −₹16.54 | — (alias of free) |
| `solo` | ₹1,499 | ~~2M~~ **4,000,000** | ₹662 | ₹30 | **₹807** | **53.8%** |
| `builder` | ₹4,999 | ~~8M~~ **16,000,000** | ₹2,646 | ₹100 | **₹2,253** | **45.1%** |
| `business` | ₹14,999 | ~~30M~~ **50,000,000** | ₹8,268 | ₹300 | **₹6,431** | **42.9%** |
| `custom` | Negotiated | Unlimited | Negotiated | — | — | — |

FX used: ₹94.5/$1. Blended Gemini rate: ₹165.4/M tokens. All three paid plans are profitable even at 100% usage.

Valid plan names in DB/code: `free | explore | solo | builder | business | custom`
`growth` and `pro` are NOT valid — never use.

---

## Infrastructure Costs (NOTHING IS FREE AT SCALE)

| Service | Plan/Usage | Monthly Cost | Notes |
|---------|-----------|-------------|-------|
| **Supabase** | Pro | $25 / ₹2,100 | Base fee — database, auth, storage |
| **Supabase Edge Functions** | krew-stream invocations | ~$2 per 1M calls beyond 2M free | Each Krew AI call = 1 invocation. At 0–2M calls/month: included in Pro. Beyond: $2/1M |
| **Supabase Automation** | Edge Function compute | NOT free for PC-off automations | Each scheduled/triggered automation run is a billable Edge Function call |
| **Supabase Realtime** | Mesh / live features | Included in Pro up to 200 concurrent | Beyond 200 concurrent: $10/100 connections |
| **Razorpay** | Payments | 2% per transaction | Applies to every subscription payment |
| **Gemini API** | AI inference | Per token (see above) | Variable — scales with usage |
| **GitHub** | Release storage + CDN | Free tier (public repo) | Has limits — may need paid plan if release binary downloads exceed 1 GB/month bandwidth |
| **Vercel** | Website hosting | Free tier | Scales to Pro ($20/month) if: >100GB bandwidth, custom domains on team, or serverless function limits hit |
| **Domain (adris.tech)** | Annual | ~₹1,500–2,000/year (~₹125–165/month) | Renew annually |

---

## Per-User Cost Model

### At launch (0–50 users, all Supabase costs fixed)

| Cost | Amount | Notes |
|------|--------|-------|
| Supabase Pro base | ₹2,100/month | Fixed regardless of user count |
| Domain | ₹140/month | Fixed |
| **Fixed costs total** | **~₹2,240/month** | Before any AI usage |

### Variable cost per active adris.tech AI user (per month)
*FX: ₹94.5/$. Blended Gemini rate: ₹165.4/M tokens. 100% = worst case (every user maxes their limit).*

| Plan | Revenue | AI cost @ 100% | Razorpay (2%) | Net profit | Margin |
|------|---------|----------------|--------------|------------|--------|
| `free` | ₹0 | ₹16.54 | ₹0 | **−₹16.54** | — |
| `explore` | ₹0 | ₹16.54 | ₹0 | **−₹16.54** | — |
| `solo` | ₹1,499 | ₹662 | ₹30 | **+₹807** | **53.8%** |
| `builder` | ₹4,999 | ₹2,646 | ₹100 | **+₹2,253** | **45.1%** |
| `business` | ₹14,999 | ₹8,268 | ₹300 | **+₹6,431** | **42.9%** |

All paid plans are profitable even if every user maxes their token limit every month.

### Realistic per-user AI cost (assuming 40% of limit used)

| Plan | Realistic AI cost | Net margin |
|------|------------------|-----------|
| `free` | ₹6.60 | −₹6.60 |
| `explore` | ₹6.60 | −₹6.60 |
| `solo` | ₹265 | +₹1,204 (~80%) |
| `builder` | ₹1,058 | +₹3,841 (~77%) |
| `business` | ₹3,307 | +₹11,392 (~76%) |

---

## Supabase Automation Cost Detail

Every automation that runs when the user's PC is OFF goes through Supabase Edge Functions.

| Trigger | Cost per run |
|---------|-------------|
| Scheduled (e.g. daily brief) | 1 Edge Function call per fire |
| Email/webhook/RSS reactive | 1 Edge Function call per event |
| Krew AI call (adris.tech mode) | 1 Edge Function call per message |

Supabase Pro includes **2M Edge Function invocations/month free**.
Beyond 2M: **$2 per additional 1M calls**.

At 100 active users each sending 20 Krew messages/day:
→ 100 × 20 × 30 = **60,000 krew-stream calls/month** (well within 2M free tier)

At 1,000 active users: 600,000/month — still within Pro free tier.
At 10,000 active users: 6M/month → 4M over limit → **$8 extra/month** — still trivial.

Automations add separately. 50 automations running daily = 50 × 30 = 1,500 extra calls/month — negligible.

---

## Break-Even Analysis

Fixed costs: ~₹2,240/month

| Scenario | Users needed to break even |
|----------|-----------------------------|
| All solo (₹1,499 each, ₹1,175 net) | **2 solo users** cover fixed costs |
| All builder (₹4,999, ₹3,723 net) | **1 builder user** covers fixed costs |
| All free | Never breaks even — needs paid users |

**Target mix for sustainability:** 10 free/explore : 2 solo : 1 builder covers all costs and generates profit.

---

## Revenue Projections (rough)

| Users | Mix assumption | MRR | Monthly costs | Net |
|-------|---------------|-----|--------------|-----|
| 50 | 40 free, 5 solo, 5 builder | 5×₹1,499 + 5×₹4,999 = ₹32,490 | ₹2,240 fixed + ~₹3,000 AI | **+₹27,250** |
| 200 | 140 free, 30 solo, 30 builder | 30×₹1,499 + 30×₹4,999 = ₹194,940 | ₹2,240 + ~₹10,000 AI | **+₹182,700** |
| 500 | 350 free, 75 solo, 75 builder | 75×₹1,499 + 75×₹4,999 = ₹487,350 | ₹2,240 + ~₹25,000 AI | **+₹460,110** |

---

## Two AI Modes (cost impact)

| Mode | Who pays | Impact on us |
|------|----------|-------------|
| **Own Key (BYOK)** | User pays their own Gemini/OpenAI/Claude bill | Zero AI cost to us. User must add key in ConnectApps. |
| **adris.tech AI** | We pay Gemini via krew-stream | Counted against user's monthly token limit. We absorb cost for free/explore users. |

Own Key has NO token limit. adris.tech AI mode enforces the monthly limit via krew-stream.

---

## What krew-stream Does (cost chain)

User sends message → Tauri app → krew-stream Edge Function (Supabase) → Gemini API → streams back

Each krew-stream call:
1. Validates JWT (free, just base64 decode)
2. Checks plan + usage in Supabase DB (1 read + 1 write, ~₹0.00001 per call)
3. Calls Gemini (cost = tokens used × rate)
4. Logs usage to `token_usage` table (1 write)

Total cost per call: mostly the Gemini token cost. Supabase DB calls are negligible.

---

## Version History — Recent Releases

### v1.0.60
- **Token drain fix:** Main agent loop history was unbounded — each tool call resent ALL prior results to the API. Fixed: history capped at first message + last 8 entries per step. Tool results capped at 2000 chars before appending.
- **Browser visibility:** `browser_navigate` now opens user's Chrome immediately so they can see activity. Added 30s timeout to prevent hanging.
- **Personal data rule:** Added hard agent rule — personal account data (LinkedIn, Gmail, Twitter) MUST use `browser_navigate`, never `web_search`.
- **UI cleanup:** Removed "592/2000 tasks" counter from home screen. Now shows plan label only.

### v1.0.61
- **ToolCallBubble labels:** Agent browser calls now show human-readable status: "Scanning linkedin.com", "Opening twitter.com", "Searching '...'" instead of raw tool names.
- **Setup bug fix:** `localStorage` guard was blocking `setup_agent_browser` from ever retrying after a failed install. Removed.

### v1.0.62
- **`fetch_page_text` command:** HTTP fetch + HTML stripper for public pages — no browser needed. Used as a fallback when agent browser isn't available.
- **`read_browser_history` command:** Reads Chrome/Edge SQLite history file to find URLs the user actually visits. Agent checks history before asking user for any URL.
- **`browser_navigate` fallback chain:** agent binary → HTTP fetch → login prompt.
- **Profile URL rule:** Agent must never search by name to find user's own social profiles. Order: check memories → check Chrome history → ask user.

### v1.0.63
- **Option B — Playwright + system Chrome:** Created `scripts/agent-browser/index.js` — Node.js Playwright wrapper using system Chrome (no separate browser download, ~10MB `playwright-core` only). `setup_agent_browser` detects Node.js and silently installs in the background.
- **4-tier fallback:** `run_browser_persistent` now tries: system binary → local binary → **Node.js Playwright** → HTTP fetch.
- **Persistent sessions:** Playwright uses a dedicated Chrome profile at `%LOCALAPPDATA%\adris.tech\browser-session`. User logs in once per site; sessions saved forever.
- **Smart API routing:** System prompt routing table — if Gmail is connected → use `gmail_search`, never `browser_navigate`. Same for LinkedIn, Notion, Slack, GitHub. Connected apps = 4× fewer tokens.
- **Connect Apps banner:** Added "Connected apps use up to 4× fewer AI tokens" banner to the Connect Apps screen.

### v1.0.64
- **Single Chrome window:** Removed the duplicate `open_in_system_browser` call from `browser_navigate`. Playwright already opens a visible Chrome — calling both was opening two windows for every navigation. `open_in_system_browser` now only fires when no browser automation is available.
- **Hard STOP on login required:** Login wall messages now say "STOP ALL TOOL CALLS" explicitly. Previously the agent would hit a LinkedIn login wall and continue with `web_search` anyway.
- **False-positive login detection fix:** LinkedIn logged-in pages contain "sign in" in the nav/footer. Old detection matched that and wrongly returned LOGIN REQUIRED even when real post content was present. New rule: only flag as login page if content is **< 400 chars AND has login form keywords at the top** — or has an explicit `authwall` marker.
- **SPA content wait:** Playwright script now scrolls ⅓ down + waits 2.5s after `networkidle` so LinkedIn/Gmail JavaScript finishes rendering before text is captured.
- **Script auto-update:** `setup_agent_browser` re-writes the agent-browser.js script whenever the embedded version differs from disk — so script fixes reach existing users without reinstalling.

### v1.0.66 (current)
- **Token limit increase:** Solo 2M→4M, Builder 8M→16M, Business 30M→50M. All plans remain profitable even at 100% usage. FX: ₹94.5/$, blended Gemini ₹165.4/M tokens.
- **Strikethrough UI:** UpgradeModal shows old token count struck-through with new count highlighted in green, making the increase visible to users deciding to upgrade.
- **fin.md cost model updated:** Per-user cost table, realistic usage table, and revenue projections all reflect new limits.

### v1.0.65
- **Auto-save personal URLs:** After every successful `browser_navigate`, the URL is silently matched and saved to memory: `linkedin_url`, `linkedin_activity_url`, `linkedin_notifications_url`, `gmail_url`, `twitter_url`, `github_url`, `notion_url`, `instagram_url`, `reddit_url`. Only saves if value changed.
- **Smart URL recall:** System prompt tells agents to call `recall_memory("linkedin_url")` etc. before ever asking the user for a URL. After first visit, agent always knows where to go.
- **Standard fallback entry URLs:** Agent knows LinkedIn feed, Gmail inbox, Twitter home etc. for first-time visits — no searching, no asking.

---

## Token Drain — Root Causes & Fixes (v1.0.60)

| Root Cause | Impact | Fix Applied |
|------------|--------|-------------|
| Main agent loop: history unbounded | Each tool-call step sent ALL prior steps' results to API; 4–8 steps × growing context = 50–200K tokens/task | History capped at first message + last 8 entries after each step |
| Tool results added full to history | Results (up to 3000 chars) replayed in full every subsequent API call | Tool results capped at 2000 chars before appending to history |
| Agent used web_search for personal data | "Check my LinkedIn posts" → generic B2B research, never opened browser → 11% tokens wasted | Browser rules: personal account data MUST use browser_navigate |
| Connected app not used when available | Agent opened browser for Gmail even when Gmail API was connected | Smart routing: connected API tools always preferred over browser (4× cheaper) |

### Token budgets per task (post-fix estimates)
| Task type | Pre-fix | Post-fix |
|-----------|---------|---------|
| Simple Q&A (no tools) | ~3K | ~3K (unchanged) |
| Single web_search | ~6K | ~4K |
| LinkedIn read (browser_navigate) | ~15K | ~8K |
| Gmail read (API when connected) | ~15K | ~3K |
| Complex research (4 searches) | ~40K | ~18K |
| Multi-agent workflow (3 agents) | ~120K | ~50K |

---

## Key Financial Rules

1. **Supabase is NOT free** — Pro plan costs $25/month minimum, always
2. **Automation runs cost money** — each Edge Function call for PC-off automations is billable beyond 2M/month
3. **Free/explore users are a loss** — treat them as acquisition cost, not revenue
4. **Business plan price must be set** — must exceed ₹4,410 AI cost + ₹100 Razorpay + margin
5. **Razorpay 2%** applies to every payment — factor into all net margin calculations
6. **Domain renewal** — ₹1,500–2,000/year, don't forget it
7. **GitHub releases are free** for public repos but may hit bandwidth limits at scale
