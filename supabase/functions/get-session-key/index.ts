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
const LIFETIME_PLANS = new Set<string>([]);

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
      supabase.from("users").select("plan").eq("id", userId).single(),
      supabase.from("token_usage")
        .select("tokens_consumed, created_at")
        .eq("user_id", userId),
    ]);

    const plan = (planRes.data?.plan as string) ?? "free";
    const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
    const isLifetime = LIFETIME_PLANS.has(plan);
    const rows = (usageRes.data ?? []) as { tokens_consumed: number; created_at: string }[];
    const used = rows.reduce((s, r) => {
      if (!isLifetime && new Date(r.created_at).getTime() < monthStart) return s;
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
