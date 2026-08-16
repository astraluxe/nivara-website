import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Is checkout open?
//
// WHY THIS EXISTS. The pages carried a hardcoded PAYMENTS_LOCKED flag, so opening the shop was a
// manual edit in one repo that had to be made in the right order relative to a Supabase secret no
// browser can see. Get that order wrong and every visitor could buy a real plan with a free test
// card, with nothing on the page looking wrong. So the answer comes from the server, which is the
// only place that knows, and the pages unlock themselves.
//
// WHAT CHANGED AT GO-LIVE. This used to also report a `mode`, read from RAZORPAY_MODE, and refuse
// to open while that said 'test'. That branch is gone from razorpay-create-subscription — there is
// now exactly one set of credentials and they are the live ones — so a mode here would be
// describing a choice that no longer exists. `mode` is still returned, always "live", because the
// pricing page and the desktop app read it; it is now a statement, not a question.
//
// The remaining gates are the two that can still legitimately hold checkout shut:
//   * live keys must exist, or customers reach a checkout that fails at the last step;
//   * CHECKOUT_ALLOWLIST, which restricts buying to named testers.
//
// Deliberately public (verify_jwt false): asked before anyone signs in, and it reveals nothing —
// only whether the shop is open. No keys, no plan ids.
// ─────────────────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve((req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const restricted = (Deno.env.get("CHECKOUT_ALLOWLIST") ?? "").trim().length > 0;
  const hasLiveKeys = !!(Deno.env.get("RAZORPAY_KEY_ID") && Deno.env.get("RAZORPAY_KEY_SECRET"));

  const open = hasLiveKeys && !restricted;

  return new Response(JSON.stringify({
    open,
    mode: "live",
    restricted,
    reason: open ? "open" : !hasLiveKeys ? "no_live_keys" : "restricted_to_allowlist",
    // A short, honest line the page can show instead of inventing its own copy — and instead of the
    // hardcoded "Reopens Fri 31 Jul", which was a date that came and went while checkout stayed shut.
    message: open
      ? ""
      : !hasLiveKeys
        ? "Checkout is being set up. Please check back shortly."
        : "Checkout is open to invited testers only right now.",
  }), {
    headers: {
      "Content-Type": "application/json",
      // Short cache: long enough to spare the function on a busy page, short enough that a change
      // takes effect within a minute rather than whenever a CDN decides.
      "Cache-Control": "public, max-age=30",
      ...CORS,
    },
  });
});
