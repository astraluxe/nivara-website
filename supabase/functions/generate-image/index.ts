import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────────────────
// Server-side image generation.
//
// Images are the most expensive thing this product does: one Nano Banana image costs about what
// 78,000 metered text tokens cost, and a Pro image about 268,000. The per-plan cap in the desktop
// app bounds honest use, but the app is a file on someone's disk — it holds the real Gemini key for
// 24h (get-session-key), so a patched build could ignore the cap entirely and spend without limit.
//
// This function is where the cap actually bites: the key never leaves the server, the budget is
// read from the database, and the usage row is written BEFORE the image is returned. The client
// cannot skip any of it. Images on the user's OWN key (NVIDIA FLUX, their own Gemini key) never
// come here — they cost us nothing and stay entirely client-side, which is what makes "connect a
// free key" a genuinely better deal for the user as well as for us.
// ─────────────────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Must stay in step with the desktop app's planConfig.ts.
const IMAGE_UNITS: Record<string, number | null> = {
  free: 0, explore: 0, solo: 70, builder: 235, business: 940, custom: null,
};
const TOKENS_PER_IMAGE_UNIT = 12_000;
const UNITS_PRO = 3.5;
const UNITS_FLASH = 1;
const IMAGE_TASK_TYPE = "krew_image";

// Only models we actually sell. An arbitrary model string from the client must never reach the
// billing path — a caller could otherwise name an expensive model and be charged the cheap rate.
const ALLOWED_MODELS = new Set([
  "gemini-2.5-flash-image",
  "gemini-3-pro-image",
  "gemini-3-pro-image-preview",
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    if (!jwt) return json({ error: "Not signed in." }, 401);

    // Verify the token properly rather than decoding it — this endpoint spends real money, so it
    // must not trust a self-asserted `sub` the way a read-only endpoint might get away with.
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authErr } = await anon.auth.getUser(jwt);
    if (authErr || !user?.id) return json({ error: "Session expired. Please sign in again." }, 401);
    const userId = user.id;

    const body = await req.json().catch(() => ({}));
    const prompt = String(body.prompt ?? "").trim();
    const model = String(body.model ?? "gemini-2.5-flash-image");
    if (!prompt) return json({ error: "No prompt." }, 400);
    if (prompt.length > 4000) return json({ error: "Prompt too long." }, 400);
    if (!ALLOWED_MODELS.has(model)) return json({ error: `Unsupported image model: ${model}` }, 400);

    const units = /pro/i.test(model) ? UNITS_PRO : UNITS_FLASH;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: profile } = await supabase
      .from("users").select("plan, is_blocked, usage_period_start").eq("id", userId).single();
    if (profile?.is_blocked === true) return json({ error: "This account is suspended." }, 403);

    const plan = String(profile?.plan ?? "free");
    const cap = plan in IMAGE_UNITS ? IMAGE_UNITS[plan] : IMAGE_UNITS.free;

    // Count what has already been spent this period. Free/explore are lifetime, matching
    // get-session-key and the app's tokenTracker — all three must agree on the window.
    let spentUnits = 0;
    if (cap !== null) {
      let q = supabase.from("token_usage")
        .select("tokens_consumed")
        .eq("user_id", userId)
        .eq("task_type", IMAGE_TASK_TYPE);
      if (plan !== "free" && plan !== "explore") {
        const monthStart = new Date();
        monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
        q = q.gte("created_at", profile?.usage_period_start ?? monthStart.toISOString());
      }
      const { data: rows } = await q;
      const tokens = (rows ?? []).reduce((s: number, r: { tokens_consumed: number }) => s + (r.tokens_consumed ?? 0), 0);
      spentUnits = tokens / TOKENS_PER_IMAGE_UNIT;

      if (spentUnits + units > cap) {
        // Not an error state for the app: it falls back to stock photography, so the deck is still
        // finished. `remaining` lets it say something accurate instead of guessing.
        return json({
          error: "image_quota_exhausted",
          message: cap === 0
            ? "AI images are available on the paid plans. Connect a free NVIDIA key to generate them at no cost."
            : "You've used this period's AI image allowance. Connect a free NVIDIA key in Connect Apps to keep generating at no cost.",
          plan, cap, used: spentUnits, remaining: Math.max(0, cap - spentUnits),
        }, 429);
      }
    }

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) return json({ error: "Image service not configured." }, 500);

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
        signal: AbortSignal.timeout(90_000),
      },
    );
    if (!r.ok) {
      const t = await r.text();
      console.error(`gemini image ${r.status}: ${t.slice(0, 300)}`);
      // Nothing was generated, so nothing is charged.
      return json({ error: `Image generation failed (${r.status}).` }, 502);
    }

    const v = await r.json();
    const parts = v?.candidates?.[0]?.content?.parts ?? [];
    let dataUri = "";
    for (const part of parts) {
      const inline = part?.inlineData ?? part?.inline_data;
      if (inline?.data) {
        dataUri = `data:${inline.mimeType ?? inline.mime_type ?? "image/png"};base64,${inline.data}`;
        break;
      }
    }
    if (!dataUri) return json({ error: "The model returned no image (it may have refused the prompt)." }, 502);

    // Charge only once an image genuinely exists. Written server-side, so it cannot be skipped by
    // the client the way the old client-emitted meter could.
    const { error: usageErr } = await supabase.from("token_usage").insert({
      user_id: userId,
      task_type: IMAGE_TASK_TYPE,
      tokens_consumed: Math.round(units * TOKENS_PER_IMAGE_UNIT),
      model_used: model,
      model_tier: "image",
      credits_consumed: 0,
    });
    if (usageErr) console.error("image usage insert failed", usageErr);

    return json({
      image: dataUri,
      units,
      remaining: cap === null ? null : Math.max(0, cap - spentUnits - units),
      cap,
    });
  } catch (e) {
    console.error("generate-image error", e);
    return json({ error: String(e) }, 500);
  }
});
