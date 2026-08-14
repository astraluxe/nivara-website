import { createClient } from "jsr:@supabase/supabase-js@2";

const CLIENT_PEPPER = "nv-adris-2026-k7X9mP3q";

// Must stay in step with PLAN_CONFIG in the desktop app (src/lib/planConfig.ts) and PLAN_LIMIT in
// AccountPanel. These were previously half the advertised figures, so paid users were cut off at
// 50% of the allowance their app showed them.
const PLAN_LIMITS: Record<string, number> = {
  free:       100_000,
  explore:    100_000,
  solo:     4_000_000,
  builder: 16_000_000,
  business: 50_000_000,
  custom: Number.MAX_SAFE_INTEGER,
};

// Free tiers are capped for the LIFETIME of the account, not per month — the desktop app has always
// treated them that way, but this function used a monthly window, so a free account quietly earned a
// fresh 100k every month.
//
// This set was left EMPTY, which made the fix above inert: every caller of getMonthlyUsage() in the
// app passes isLifetime=true for free/explore (AccountPanel, HomeModule, KrewChat, coder/AIChat), and
// the website sells the tier as "50 tasks · lifetime" — but this function kept counting from the 1st
// of the month and kept handing out keys after the lifetime cap was spent. Client-side said "done",
// server-side said "carry on", and the server is the one holding the API key.
const LIFETIME_PLANS = new Set<string>(["free", "explore"]);

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacXorMask(userId: string, nonce: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(CLIENT_PEPPER),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${userId}:${nonce}`)
  );
  return new Uint8Array(sig);
}

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: cors });
    }

    // Decode JWT payload — gateway has already verified signature (verify_jwt: true)
    const parts = jwt.split(".");
    if (parts.length < 2) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: cors });
    }
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    const userId = payload.sub as string;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Invalid token payload" }), { status: 401, headers: cors });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Plan and usage are still fetched in parallel. Usage now comes back unfiltered with its
    // timestamp so the window (lifetime vs this month) can be applied once the plan is known —
    // keeping one round trip rather than making the usage query wait on the plan query.
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const [planRes, usageRes] = await Promise.all([
      supabase.from("users").select("plan, is_blocked, usage_period_start, extra_credits, team_id").eq("id", userId).single(),
      supabase.from("token_usage")
        .select("tokens_consumed, created_at")
        .eq("user_id", userId),
    ]);

    // A blocked account was still handed a working key — the block only ever affected the UI.
    if (planRes.data?.is_blocked === true) {
      return new Response(JSON.stringify({ error: "This account is suspended. Contact support." }), {
        status: 403, headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    const plan = (planRes.data?.plan as string) ?? "free";
    // users.extra_credits existed but was never read anywhere — a goodwill top-up had no effect.
    // It is now added on top of the plan allowance, so support can hand someone more tokens with
    // one UPDATE instead of moving them to a paid plan they didn't buy.
    const bonus = Math.max(0, Number(planRes.data?.extra_credits ?? 0) || 0);

    // ── ONE TEAM, ONE ALLOWANCE, SHARED ──────────────────────────────────────────────────────
    //
    // A Team subscription buys 50M tokens. Every member was being given that figure in full, so a
    // ten-seat workspace drew 500M tokens against a single ₹19,999 payment — ten times what was
    // sold. The allowance belongs to the TEAM, so it is divided across the seats actually in use.
    //
    // Counted from active members only: a pending invite has nobody spending against it, and
    // letting invitations shrink everyone's allowance before they are even accepted would make the
    // number jump around for no visible reason. The owner is an active member too (the webhook
    // inserts that row), so a solo workspace divides by one and nothing changes for them.
    //
    // extra_credits is added AFTER the division: a goodwill top-up is granted to one person and
    // should not be quietly shared out among their colleagues.
    let teamSize = 1;
    const teamId = planRes.data?.team_id ? String(planRes.data.team_id) : "";
    if (teamId) {
      const { count } = await supabase.from("team_members")
        .select("id", { count: "exact", head: true })
        .eq("team_id", teamId).eq("status", "active");
      teamSize = Math.max(1, Number(count ?? 1) || 1);
    }
    const planAllowance = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    const share = plan === "custom" ? planAllowance : Math.floor(planAllowance / teamSize);
    const limit = share + bonus;
    const isLifetime = LIFETIME_PLANS.has(plan);
    // Paid plans count from the BILLING period, not the 1st of the calendar month — which is what
    // the app's tokenTracker.getMonthlyUsage() has always done. With the two using different
    // windows, a subscription that renews mid-month had the app and the server disagreeing about
    // how much was left, in both directions.
    const periodStart = planRes.data?.usage_period_start
      ? new Date(String(planRes.data.usage_period_start)).getTime()
      : monthStart;
    const rows = (usageRes.data ?? []) as { tokens_consumed: number; created_at: string }[];
    const used = rows.reduce((s, r) => {
      if (!isLifetime && new Date(r.created_at).getTime() < periodStart) return s;
      return s + (r.tokens_consumed ?? 0);
    }, 0);
    const remaining = Math.max(0, limit - used);

    if (remaining <= 0 && plan !== "custom") {
      return new Response(JSON.stringify({
        error: isLifetime
          ? "You've used your free token allowance. Upgrade your plan, or switch to your own API key or a local model to keep going."
          : "Monthly token limit reached. Please upgrade your plan.",
      }), {
        status: 429, headers: { ...cors, "Content-Type": "application/json" }
      });
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY")!;
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500, headers: cors
      });
    }

    // Generate nonce and encrypt key with HMAC-SHA256 XOR mask
    const nonce = crypto.randomUUID();
    const mask = await hmacXorMask(userId, nonce);
    const keyBytes = new TextEncoder().encode(geminiKey);
    const encrypted = new Uint8Array(keyBytes.length);
    for (let i = 0; i < keyBytes.length; i++) {
      encrypted[i] = keyBytes[i] ^ mask[i % 32];
    }

    // Key session expires in 24 hours
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    return new Response(JSON.stringify({
      enc: toHex(encrypted),
      nonce,
      plan,
      remaining: plan === "custom" ? 999_999_999 : remaining,
      // The app shows an allowance next to the usage, and it has to be the REAL one. Without these
      // a team member's screen read "x / 50,000,000" while the server cut them off at a tenth of
      // it — the client and the server disagreeing about the same number, which is exactly the
      // class of bug that makes people think they have been robbed.
      limit: plan === "custom" ? 999_999_999 : limit,
      team_size: teamSize,
      expires_at: expiresAt,
    }), {
      headers: { ...cors, "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("get-session-key error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: cors
    });
  }
});
