import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────────────────
// Grant the plan the moment the card clears, without waiting for a webhook.
//
// WHY THIS EXISTS. Until now the only thing that could grant a plan was razorpay-webhook, which
// refuses to act unless it can prove a request came from Razorpay — and that proof needs a webhook
// secret configured at BOTH ends. With either end missing, a customer paid and nothing happened:
// money moved, the plan never landed, and the app went on showing Free. That is exactly what
// happened to a real paying customer here.
//
// But the webhook is not the only signed message Razorpay sends. When checkout succeeds in the
// browser, Razorpay hands the page a receipt — payment id, subscription id, and an HMAC signature
// over the pair, signed with the API key secret. That secret is already configured. So the receipt
// can be verified server-side right now, with nothing new to set up, and the plan granted while the
// customer is still looking at the success screen.
//
// TRUST, CAREFULLY. The browser is not trusted: it hands over three strings and this function
// proves them. Two independent checks must both pass.
//   1. The HMAC must match, computed with the key secret the browser has never seen.
//   2. Razorpay's own API must confirm the subscription is live and say which plan it is for.
// Check 2 is what makes forgery pointless even if check 1 were somehow satisfied — the plan comes
// from Razorpay's record of the subscription, never from anything the caller sent.
//
// THE WEBHOOK IS STILL NEEDED, and this does not replace it. It covers the FIRST payment, which is
// the one a person is waiting on. Monthly renewals and cancellations happen when nobody is at the
// keyboard, so only a webhook can carry those.
// ─────────────────────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS } });

/** Only plans this product actually sells. Mirrors razorpay-webhook. */
const PAID_PLANS = new Set(["solo", "builder", "business"]);

type Rec = Record<string, unknown>;

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(raw: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(raw)));
}

/** Constant-time compare — a plain === leaks position through timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json({ error: "Not authenticated" }, 401);

  // Whose account gets upgraded comes from the JWT, never from the body. Otherwise a valid receipt
  // could be replayed against somebody else's account.
  const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user }, error: authErr } = await anon.auth.getUser(auth.slice(7));
  if (authErr || !user) return json({ error: "Session expired. Please sign in again." }, 401);

  let paymentId = "", subscriptionId = "", signature = "";
  try {
    const b = await req.json();
    paymentId = String(b?.razorpay_payment_id ?? "");
    subscriptionId = String(b?.razorpay_subscription_id ?? "");
    signature = String(b?.razorpay_signature ?? "");
  } catch { return json({ error: "Invalid request body" }, 400); }

  if (!paymentId || !subscriptionId || !signature) {
    return json({ error: "Incomplete payment receipt" }, 400);
  }

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: row } = await admin.from("users").select("plan, usage_period_start, billing_mode").eq("id", user.id).maybeSingle();
  const testMode = String(row?.billing_mode ?? "live") === "test";

  const keyId = (testMode ? Deno.env.get("RAZORPAY_TEST_KEY_ID") : "") || Deno.env.get("RAZORPAY_KEY_ID") || "";
  const keySecret = (testMode ? Deno.env.get("RAZORPAY_TEST_KEY_SECRET") : "") || Deno.env.get("RAZORPAY_KEY_SECRET") || "";
  if (!keyId || !keySecret) return json({ error: "Payments are not configured." }, 500);

  const log = async (outcome: string, detail: string, plan?: string) => {
    try {
      await admin.from("payment_events").insert({
        event_id: `verify:${paymentId}`,
        event: "checkout.verified",
        mode: testMode ? "test" : "live",
        user_id: user.id, plan: plan ?? null,
        subscription_id: subscriptionId, payment_id: paymentId,
        outcome, detail,
        raw: { source: "browser-receipt" },
      });
    } catch (e) { console.error("payment_events insert failed", e); }
  };

  // ── Check 1: the signature. For a SUBSCRIPTION the signed string is
  //    payment_id + "|" + subscription_id — note the order, which is the reverse of the one-off
  //    order flow (order_id + "|" + payment_id). Getting it backwards rejects every real payment.
  const expected = await hmacHex(`${paymentId}|${subscriptionId}`, keySecret);
  if (!safeEqual(expected, signature)) {
    await log("bad_signature", "HMAC did not match the receipt");
    console.error(`BAD SIGNATURE user=${user.id} payment=${paymentId} sub=${subscriptionId}`);
    return json({ error: "This payment could not be verified." }, 400);
  }

  // ── Check 2: ask Razorpay. The plan comes from THEIR record of the subscription, so nothing the
  //    browser said decides what the customer receives.
  let sub: Rec;
  try {
    const r = await fetch(`https://api.razorpay.com/v1/subscriptions/${subscriptionId}`, {
      headers: { Authorization: "Basic " + btoa(`${keyId}:${keySecret}`) },
    });
    if (!r.ok) {
      await log("lookup_failed", `subscription lookup returned ${r.status}`);
      return json({ error: "Could not confirm the payment with Razorpay. It will be applied shortly." }, 502);
    }
    sub = await r.json() as Rec;
  } catch (e) {
    console.error("subscription lookup failed", e);
    await log("lookup_error", String(e));
    return json({ error: "Could not reach Razorpay. Your payment is safe and will be applied shortly." }, 502);
  }

  // ── Check 3: DID MONEY ACTUALLY MOVE? ─────────────────────────────────────
  //
  // The subscription's status is not proof of payment. "authenticated" means the mandate was
  // approved and nothing has been charged yet — razorpay-webhook deliberately ignores
  // subscription.authenticated for precisely this reason, because granting on it hands out paid
  // plans for free. An earlier version of this file accepted it and would have done exactly that.
  //
  // So the payment is checked directly, and "captured" is the only answer that means the money is
  // ours. "authorized" is a hold, not a payment, and can still be voided.
  let pay: Rec;
  try {
    const r = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      headers: { Authorization: "Basic " + btoa(`${keyId}:${keySecret}`) },
    });
    if (!r.ok) {
      await log("payment_lookup_failed", `payment lookup returned ${r.status}`);
      return json({ error: "Could not confirm the payment with Razorpay. It will be applied shortly." }, 502);
    }
    pay = await r.json() as Rec;
  } catch (e) {
    console.error("payment lookup failed", e);
    await log("payment_lookup_error", String(e));
    return json({ error: "Could not reach Razorpay. Your payment is safe and will be applied shortly." }, 502);
  }

  const payStatus = String(pay.status ?? "");
  if (payStatus !== "captured") {
    await log("not_captured", `payment status is "${payStatus}"`);
    return json({ error: `Payment is not complete yet (status: ${payStatus}).` }, 409);
  }

  // The receipt must tie the payment to THIS subscription. Without this, a captured payment from
  // anywhere could be presented alongside somebody's subscription id.
  const paySub = String(pay.subscription_id ?? "");
  if (paySub && paySub !== subscriptionId) {
    await log("payment_mismatch", `payment belongs to ${paySub}`);
    return json({ error: "This payment does not match the subscription." }, 400);
  }

  const notes = (sub.notes as Record<string, string> | undefined) ?? {};
  const plan = String(notes.plan ?? "");
  if (!PAID_PLANS.has(plan)) {
    await log("bad_plan", `subscription notes carry plan "${plan}"`);
    console.error(`BAD PLAN "${plan}" on subscription ${subscriptionId}`);
    return json({ error: "Could not tell which plan this payment was for. Contact support." }, 500);
  }

  // The subscription must belong to the caller. Notes carry the user_id written at checkout; if it
  // names someone else, this is a receipt being replayed against the wrong account.
  const notedUser = String(notes.user_id ?? "");
  if (notedUser && notedUser !== user.id) {
    await log("wrong_user", `subscription belongs to ${notedUser}`);
    console.error(`RECEIPT REPLAY user=${user.id} sub belongs to ${notedUser}`);
    return json({ error: "This payment belongs to a different account." }, 403);
  }

  // ── Grant it. Same rules as the webhook, deliberately: only start a fresh allowance window on a
  //    real new cycle, so paying and then re-verifying cannot hand out a second month of tokens.
  const patch: Record<string, unknown> = {
    plan,
    subscription_status: "active",
    grace_period_end: null,
    razorpay_subscription_id: subscriptionId,
  };
  const custId = String(sub.customer_id ?? "");
  if (custId) patch.razorpay_customer_id = custId;

  const startedAt = row?.usage_period_start ? new Date(String(row.usage_period_start)).getTime() : 0;
  const ageDays = startedAt ? (Date.now() - startedAt) / 86_400_000 : Infinity;
  if (row?.plan !== plan || ageDays >= 20) patch.usage_period_start = new Date().toISOString();

  const { error: updErr } = await admin.from("users").update(patch).eq("id", user.id);
  if (updErr) {
    await log("update_failed", updErr.message, plan);
    console.error(`PLAN UPDATE FAILED user=${user.id} plan=${plan}`, updErr);
    return json({ error: "Payment verified but your account could not be updated. Contact support." }, 500);
  }

  await log("upgraded", `${row?.plan ?? "unknown"} -> ${plan} (verified from browser receipt)`, plan);
  console.log(`PLAN GRANTED (verify) user=${user.id} ${row?.plan} -> ${plan} sub=${subscriptionId}`);

  // Business buys a team. Same as the webhook, and guarded the same way so two routes to the grant
  // cannot create two teams.
  if (plan === "business") {
    const { data: existing } = await admin.from("teams").select("id").eq("owner_id", user.id).maybeSingle();
    if (!existing) {
      const email = user.email ?? "Team";
      const { data: team, error: teamErr } = await admin.from("teams")
        .insert({ owner_id: user.id, name: email.split("@")[0] + "'s Team", plan: "team", max_seats: 10 })
        .select("id").single();
      if (!teamErr && team) {
        await admin.from("team_members").insert({
          team_id: team.id, user_id: user.id, email, role: "admin",
          status: "active", joined_at: new Date().toISOString(),
        });
        await admin.from("users").update({ team_id: team.id }).eq("id", user.id);
      }
    }
  }

  return json({ ok: true, plan, subscription_status: "active" });
});
