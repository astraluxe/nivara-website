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
// 1. A CANCELLED MONTH IS STILL A PAID MONTH — but the promise is kept HERE, not at Razorpay. See
//    the cancel call below: Razorpay is told to stop billing immediately, because its
//    cancel_at_cycle_end option was measured doing nothing at all, and we hold access open
//    ourselves via grace_period_end instead.
//
// 2. THE ANSWER MUST NOT DEPEND ON A WEBHOOK ARRIVING. The local row is written immediately —
//    subscription_status='cancelled' with grace_period_end at the period end — and
//    expire_billing_grants() (cron, hourly) does the downgrade when it lapses. The webhook's ENDING
//    branch writes those same two fields, so whichever lands first, they agree.
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
    .select("plan, subscription_status, grace_period_end, razorpay_subscription_id, billing_mode, team_id")
    .eq("id", user.id).maybeSingle();
  if (rowErr || !row) return json({ error: "Account not found" }, 404);

  // ── Is this person on someone else's team? ────────────────────────────────
  //
  // A member has plan='business' and no subscription of their own, which is indistinguishable from
  // a hand-granted plan unless we look. Without this the panel told them "this plan was set up
  // manually, email support if you want it changed" — wrong, and alarming for someone whose team
  // is paying perfectly normally. They cannot cancel it either: it is not their subscription.
  let team: { name: string; ownerEmail: string; isOwner: boolean } | null = null;
  if (row.team_id) {
    const { data: t } = await admin.from("teams")
      .select("name, owner_id").eq("id", String(row.team_id)).maybeSingle();
    if (t) {
      const isOwner = String(t.owner_id) === user.id;
      let ownerEmail = "";
      if (!isOwner) {
        const { data: o } = await admin.from("users").select("email").eq("id", String(t.owner_id)).maybeSingle();
        ownerEmail = String(o?.email ?? "");
      }
      team = { name: String(t.name ?? "your team"), ownerEmail, isOwner };
    }
  }

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
  const rzpCancelled = rzp ? String(rzp.status ?? "") === "cancelled" || !!rzp.ended_at : false;

  const status = () => json({
    plan,
    subscription_status: String(row.subscription_status ?? "free"),
    /** Set once cancelled: access continues until this moment, then the cron downgrades. */
    grace_period_end: row.grace_period_end ?? null,
    has_subscription: !!subId,
    test_mode: testMode,
    /** Razorpay's own view, when there is a subscription to look at. */
    razorpay_status: rzp ? String(rzp.status ?? "") : null,
    /** When the card gets charged next. Null once cancelled — there is no next payment, and
     *  showing one was the date the panel kept insisting on after a cancellation. */
    next_charge_at: (localCancelled || rzpCancelled) ? null : (rzp ? iso(rzp.charge_at) : null),
    /** End of the period already paid for — the date access really runs to. */
    current_end: rzp ? iso(rzp.current_end) : null,
    /**
     * True when billing has been told to stop at the end of this cycle.
     *
     * NOT `end_at`. That field is the date the subscription would finish naturally after its
     * total_count cycles — checkout requests 120 months, so end_at sits in 2036 on a perfectly
     * healthy subscription. Reading it as a cancellation marker made the panel announce
     * "Cancelled — no further payments will be taken" to someone who had merely opened it to look.
     *
     * `ended_at` (past tense) is the one that means it actually stopped. Otherwise the authority is
     * our own row: cancel writes subscription_status='cancelled' at the moment of the request,
     * because with cancel_at_cycle_end Razorpay keeps the status 'active' until the cycle runs out.
     */
    cancel_scheduled: localCancelled || rzpCancelled,
    /** Set when the plan comes from a team rather than the caller's own purchase. */
    team_member: !!team && !team.isOwner,
    team_owner: !!team && team.isOwner,
    team_name: team ? team.name : null,
    team_owner_email: team && !team.isOwner ? team.ownerEmail : null,
  });

  if (action === "status") return status();
  if (action !== "cancel") return json({ error: `Unknown action: ${action}` }, 400);

  // ── Cancel ────────────────────────────────────────────────────────────────
  if (!PAID_PLANS.has(plan)) return json({ error: "You are not on a paid plan." }, 400);
  if (team && !team.isOwner) {
    // Their access is derived from the team's subscription. Cancelling it is the owner's decision
    // and the owner's billing; there is nothing here for a member to stop.
    return json({
      error: `Your plan comes from ${team.name}. Only the team owner${team.ownerEmail ? ` (${team.ownerEmail})` : ""} can change or cancel it.`,
      team_member: true,
    }, 403);
  }
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
      // CANCEL AT RAZORPAY IMMEDIATELY. ACCESS IS HELD OPEN BY US, NOT BY THEM.
      //
      // The obvious choice is cancel_at_cycle_end=1 — "stop after the month they paid for" — and it
      // is what this used to send. Measured against the live API on a real subscription, Razorpay
      // answers 200 and then does NOTHING: status stays "active", has_scheduled_changes stays
      // false, remaining_count stays 119. The customer is told they have cancelled and is charged
      // again next month. A silent no-op on the one call that stops taking someone's money is the
      // worst possible failure here.
      //
      // 0 genuinely cancels — verified: status becomes "cancelled" and ended_at is set, so no
      // further charge can happen. Their paid month is then protected on OUR side instead:
      // grace_period_end below is set to the period end, the plan keeps working until then, and
      // expire_billing_grants() downgrades afterwards. Billing is Razorpay's to stop; access is
      // ours to grant, so each is handled where it can actually be guaranteed.
      body: JSON.stringify({ cancel_at_cycle_end: 0 }),
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
