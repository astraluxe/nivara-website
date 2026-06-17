# adris.tech — Product & Financial Reference

Last updated: 2026-06-13 | krew-stream v33 | get-session-key v2 | app v1.0.37

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

| Plan | Price/month | Token limit/month | Max AI cost to us | Notes |
|------|------------|-------------------|-------------------|-------|
| `free` | ₹0 / $0 | 100,000 | ₹14.70 / $0.175 | Acquisition plan — we absorb the cost |
| `explore` | ₹0 / $0 | 100,000 | ₹14.70 / $0.175 | Same as free — internal alias only, not a separate visible plan |
| `solo` | ₹1,499 / $15 | 2,000,000 | ₹294 / $3.50 | |
| `builder` | ₹4,999 / $49 | 8,000,000 | ₹1,176 / $14.00 | |
| `business` | TBD | 30,000,000 | ₹4,410 / $52.50 | Shown as "Team" in UI |
| `custom` | Negotiated | Unlimited | Negotiated | Internal/enterprise — NOT public |

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

| Plan | Revenue | Max AI cost | Razorpay (2%) | Net per user (worst case) |
|------|---------|-------------|--------------|--------------------------|
| `free` | ₹0 | ₹14.70 | ₹0 | **−₹14.70** |
| `explore` | ₹0 | ₹14.70 | ₹0 | **−₹14.70** |
| `solo` | ₹1,499 | ₹294 | ₹30 | **+₹1,175** |
| `builder` | ₹4,999 | ₹1,176 | ₹100 | **+₹3,723** |
| `business` | TBD | ₹4,410 | TBD | depends on pricing |

"Worst case" = user consumes full token allowance every month. Most users use 20–40%.

### Realistic per-user AI cost (assuming 30% of limit used)

| Plan | Realistic AI cost | Net margin |
|------|------------------|-----------|
| `free` | ₹4.40 | −₹4.40 |
| `explore` | ₹4.40 | −₹4.40 |
| `solo` | ₹88 | +₹1,381 |
| `builder` | ₹353 | +₹4,546 |

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

## Key Financial Rules

1. **Supabase is NOT free** — Pro plan costs $25/month minimum, always
2. **Automation runs cost money** — each Edge Function call for PC-off automations is billable beyond 2M/month
3. **Free/explore users are a loss** — treat them as acquisition cost, not revenue
4. **Business plan price must be set** — must exceed ₹4,410 AI cost + ₹100 Razorpay + margin
5. **Razorpay 2%** applies to every payment — factor into all net margin calculations
6. **Domain renewal** — ₹1,500–2,000/year, don't forget it
7. **GitHub releases are free** for public repos but may hit bandwidth limits at scale
