import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────────────────
// Subscription status, and cancelling one.
//
// Neither existed. A customer could start a subscription and then had no way to see when it renews,
// what they are being charged, or how to stop it — the only route out was emailing support, and the
// only record of the arrangement lived in Razorpay's dashboard, where the customer cannot see it.
//
// TWO RULES SHAPE THIS FILE.
//
// 1. A CANCELLED MONTH IS STILL A PAID MONTH. Cancelling goes to Razorpay with
//    cancel_at_cycle_end=1, so the card is not charged again and the plan runs to the end of the
//    period already bought. Anything else takes back time someone has paid for.
//
// 2. THE ANSWER MUST NOT DEPEND ON A WEBHOOK ARRIVING. With cancel_at_cycle_end, Razorpay does not
//    send subscription.cancelled until the cycle actually ends, which can be weeks away. If the UI
//    waited for that, a customer would press Cancel, see nothing change, and press it again. So the
//    local row is written immediately — subscription_status='cancelled' with grace_period_end at
//    the period end — and expire_billing_grants() (cron, hourly) does the downgrade when it lapses.
//    The webhook's ENDING branch writes those same two fields, so whichever lands first, they agree.
// ─────────────────────────────────────────────────────────────────────────────

// `apikey` and `x-client-info` are NOT optional here.
//
// supabase-js and the pricing page both send an apikey header alongside the bearer token, so the
// browser's preflight asks for "authorization, apikey, content-type". Allowing only two of those
// three fails the preflight, the fetch rejects before it ever reaches this function, and the page
// simply hangs — which is exactly what "Manage subscription" did: stuck on "Loading your
// subscription…" with nothing in the network tab but a red OPTIONS.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS } });

/** Plans that can be cancelled. Mirrors PAID_PLANS in razorpay-webhook. */
const PAID_PLANS = new Set(["solo", "builder", "business"]);

type Rec = Record<string, unknown>;

/**
 * Live keys, or test keys when the subscription was created in test mode.
 *
 * A subscription created against the test API can only be read or cancelled with the test key, and
 * vice versa. Guessing wrong returns a confusing 400 from Razorpay, so the mode recorded at
 * checkout decides — see razorpay-create-subscription, which stores it on the user row.
 */
function creds(testMode: boolean): { id: string; secret: string } {
  const id = (testMode ? Deno.env.get("RAZORPAY_TEST_KEY_ID") : "") || Deno.env.get("RAZORPAY_KEY_ID") || "";
  const secret = (testMode ? Deno.env.get("RAZORPAY_TEST_KEY_SECRET") : "") || Deno.env.get("RAZORPAY_KEY_SECRET") || "";
  return { id, secret };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Not authenticated" }, 401);

  // The caller's identity comes from their JWT, never from the request body. Taking a user_id from
  // the body would let anyone cancel anyone else's subscription.
  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user }, error: authErr } = await anon.auth.getUser(auth.slice(7));
  if (authErr || !user) return json({ error: "Session expired. Please sign in again." }, 401);

  let action = "status";
  try {
    const body = await req.json();
    action = String(body?.action ?? "status");
  } catch { /* no body — treat as a status request */ }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: row, error: rowErr } = await admin.from("users")
    .select("plan, subscription_status, grace_period_end, razorpay_subscription_id, billing_mode")
    .eq("id", user.id).maybeSingle();
  if (rowErr || !row) return json({ error: "Account not found" }, 404);

  const plan = String(row.plan ?? "free");
  const subId = String(row.razorpay_subscription_id ?? "");
  const testMode = String(row.billing_mode ?? "live") === "test";

  // What Razorpay itself says. This is where the renewal date comes from — keeping our own copy
  // would drift the moment a charge succeeded or failed.
  let rzp: Rec | null = null;
  if (subId) {
    const { id, secret } = creds(testMode);
    if (id && secret) {
      try {
        const r = await fetch(`https://api.razorpay.com/v1/subscriptions/${subId}`, {
          headers: { Authorization: "Basic " + btoa(`${id}:${secret}`) },
        });
        if (r.ok) rzp = await r.json() as Rec;
        else console.error(`subscription lookup ${subId} -> ${r.status}`);
      } catch (e) { console.error("subscription lookup failed", e); }
    }
  }

  const iso = (unixSeconds: unknown): string | null => {
    const n = Number(unixSeconds ?? 0);
    return n > 0 ? new Date(n * 1000).toISOString() : null;
  };

  const localCancelled = String(row.subscription_status ?? "") === "cancelled";

  const status = () => json({
    plan,
    subscription_status: String(row.subscription_status ?? "free"),
    /** Set once cancelled: access continues until this moment, then the cron downgrades. */
    grace_period_end: row.grace_period_end ?? null,
    has_subscription: !!subId,
    test_mode: testMode,
    /** Razorpay's own view, when there is a subscription to look at. */
    razorpay_status: rzp ? String(rzp.status ?? "") : null,
    /** When the card gets charged next. Meaningless once cancellation is scheduled. */
    next_charge_at: rzp ? iso(rzp.charge_at) : null,
    /** End of the period already paid for — the date access really runs to. */
    current_end: rzp ? iso(rzp.current_end) : null,
    /** True when billing has been told to stop at the end of this cycle. */
    cancel_scheduled: localCancelled || (rzp ? String(rzp.status ?? "") === "cancelled" || !!rzp.end_at : false),
  });

  if (action === "status") return status();
  if (action !== "cancel") return json({ error: `Unknown action: ${action}` }, 400);

  // ── Cancel ────────────────────────────────────────────────────────────────
  if (!PAID_PLANS.has(plan)) return json({ error: "You are not on a paid plan." }, 400);
  // Already done. Say so rather than calling Razorpay a second time.
  if (localCancelled) return status();
  if (!subId) {
    // A plan granted by hand (support, a comp, an early-bird grant) has no Razorpay subscription
    // behind it, so there is no billing to stop. Reporting "cancelled" would be a lie, and taking
    // the plan away while cancelling nothing would be worse.
    return json({
      error: "This plan wasn't set up through Razorpay, so there's no billing to cancel. Email support and we'll sort it out.",
      no_subscription: true,
    }, 400);
  }

  const { id, secret } = creds(testMode);
  if (!id || !secret) return json({ error: "Payments are not configured." }, 500);

  let currentEnd = Number(rzp?.current_end ?? 0);
  try {
    const r = await fetch(`https://api.razorpay.com/v1/subscriptions/${subId}/cancel`, {
      method: "POST",
      headers: { Authorization: "Basic " + btoa(`${id}:${secret}`), "Content-Type": "application/json" },
      // 1 = stop at the end of the cycle already paid for. NEVER 0 — that ends it on the spot and
      // takes back the remainder of a month the customer has already been charged for.
      body: JSON.stringify({ cancel_at_cycle_end: 1 }),
    });
    const out = await r.json() as Rec;
    if (!r.ok) {
      const desc = String((out?.error as Rec | undefined)?.description ?? "");
      console.error(`cancel ${subId} -> ${r.status} ${desc}`);
      return json({ error: desc || "Razorpay could not cancel this subscription. Please try again." }, 502);
    }
    if (!currentEnd) currentEnd = Number(out.current_end ?? 0);
  } catch (e) {
    console.error("cancel failed", e);
    return json({ error: "Could not reach the payment gateway. Please try again." }, 502);
  }

  // Fall back to a month out if Razorpay returned no period end, so access always has a definite
  // end date rather than an open one.
  const graceEnd = currentEnd > 0
    ? new Date(currentEnd * 1000).toISOString()
    : new Date(Date.now() + 30 * 86_400_000).toISOString();

  const { error: updErr } = await admin.from("users")
    .update({ subscription_status: "cancelled", grace_period_end: graceEnd })
    .eq("id", user.id);
  if (updErr) {
    // Razorpay HAS cancelled by this point, so this must fail loudly: the customer cannot be told
    // it did not work when their billing has in fact stopped.
    console.error("cancel: local update failed", updErr);
    return json({
      error: "Billing was stopped, but we couldn't update your account. Contact support so we can finish it.",
    }, 500);
  }

  // The same audit trail the webhook writes to, so a cancellation is not invisible next to charges.
  try {
    await admin.from("payment_events").insert({
      event_id: `cancel:${subId}:${Date.now()}`,
      event: "subscription.cancel_requested",
      mode: testMode ? "test" : "live",
      user_id: user.id, plan, subscription_id: subId,
      outcome: "cancel_scheduled",
      detail: `cancel_at_cycle_end, access until ${graceEnd}`,
      raw: { requested_by: "user", grace_period_end: graceEnd },
    });
  } catch (e) { console.error("payment_events insert failed", e); }

  return json({
    ok: true,
    cancelled: true,
    plan,
    subscription_status: "cancelled",
    grace_period_end: graceEnd,
    access_until: graceEnd,
    message: "Your subscription is cancelled. You keep everything until the end of the period you have already paid for.",
  });
});
