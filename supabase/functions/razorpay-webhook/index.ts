import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────────────────
// Razorpay webhook — grants and ends paid plans.
//
// This endpoint is PUBLIC (verify_jwt = false), so the HMAC signature is the ONLY
// thing standing between a stranger and a free Business plan. v19 got that wrong in
// two ways, both verified live against this deployment:
//
//   1. `if (signature && secret)` — a request with NO signature header skipped
//      verification entirely and was processed.
//   2. Neither RAZORPAY_WEBHOOK_SECRET nor RAZORPAY_TEST_WEBHOOK_SECRET was actually
//      set on the project, so even a WRONG signature was accepted (both a missing and
//      a "deadbeef" signature returned 200).
//
// Combined with the notes/email fallback, anyone could POST this URL with a victim's
// email and grant themselves any plan — or send a `subscription.cancelled` and knock a
// paying customer down to free. So this version FAILS CLOSED: no configured secret, or
// no/ bad signature, means nothing is processed.
// ─────────────────────────────────────────────────────────────────────────────

// A plan name only counts if it is one this product actually sells. Previously whatever
// string sat in the notes was written straight into users.plan, and an unknown value
// silently falls back to FREE limits everywhere — a paying customer with a typo in the
// notes would have been charged and given nothing.
const PAID_PLANS = new Set(["solo", "builder", "business"]);

type Rec = Record<string, unknown>;
const entOf = (p: Rec | undefined, k: string): Rec | undefined => ((p?.[k] as Rec | undefined)?.entity as Rec | undefined);
const notesOf = (e: Rec | undefined): Record<string, string> => ((e?.notes as Record<string, string> | undefined) ?? {});

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(raw: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(raw)));
}

/** Constant-time hex compare — a plain === leaks position through timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: { "Access-Control-Allow-Origin": "*" } });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawBody = await req.text();
  const signature = req.headers.get("X-Razorpay-Signature") ?? "";
  const liveSecret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";
  const testSecret = Deno.env.get("RAZORPAY_TEST_WEBHOOK_SECRET") ?? "";

  // ── Gate 1: a secret must exist. Without one we cannot tell Razorpay from anyone
  // else, so we must not act. 503 (not 200) so Razorpay retries after it's configured
  // and the dashboard shows the failure instead of hiding it behind a green tick.
  if (!liveSecret && !testSecret) {
    console.error("REFUSING: no RAZORPAY_WEBHOOK_SECRET or RAZORPAY_TEST_WEBHOOK_SECRET configured");
    return new Response("Webhook secret not configured", { status: 503 });
  }
  // ── Gate 2: unsigned requests are never Razorpay.
  if (!signature) {
    console.error("REJECTED: missing X-Razorpay-Signature");
    return new Response("Unauthorized", { status: 401 });
  }
  // ── Gate 3: the signature must match one of the configured secrets. Accepting both
  // lets Razorpay TEST-mode point at this same URL without touching the live setup.
  const actual = await hmacHex(rawBody, liveSecret || testSecret);
  let mode: "live" | "test" | null = null;
  if (liveSecret && safeEqual(actual, signature)) mode = "live";
  if (!mode && testSecret) {
    const t = liveSecret ? await hmacHex(rawBody, testSecret) : actual;
    if (safeEqual(t, signature)) mode = "test";
  }
  if (!mode) {
    console.error("REJECTED: signature mismatch");
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: Rec;
  try { payload = JSON.parse(rawBody); } catch { return new Response("Bad JSON", { status: 400 }); }

  const event = String(payload.event ?? "");
  const p = payload.payload as Rec | undefined;
  const sub = entOf(p, "subscription");
  const pay = entOf(p, "payment");
  const ord = entOf(p, "order");
  const subId = String(sub?.id ?? pay?.subscription_id ?? "");
  const payId = String(pay?.id ?? "");
  const amountPaise = Number(pay?.amount ?? ord?.amount ?? 0) || null;

  // Razorpay's own event id — the correct idempotency key. Falls back to the payment or
  // subscription id so a missing header can't turn one charge into repeated grants.
  const eventId = req.headers.get("x-razorpay-event-id") ?? `${event}:${payId || subId}`;

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Notes live on different entities depending on the event; subscription notes are the
  // authoritative pair {user_id, plan} written by razorpay-create-subscription.
  const notes = { ...notesOf(ord), ...notesOf(pay), ...notesOf(sub) };
  let userId = String(notes.user_id ?? "");
  let plan = String(notes.plan ?? "");
  let planSource = plan ? "notes" : "";

  // Mesh passes are one-off orders that ride the same webhook. They carry kind=mesh_pass
  // and no plan, and must not be reported as an unattributed plan payment.
  const isMeshPass = String(notes.kind ?? "") === "mesh_pass";

  const ACTIVATING = ["payment.captured", "subscription.charged", "subscription.activated", "order.paid"];
  // subscription.authenticated is deliberately absent: it fires when the mandate is
  // approved, BEFORE any money moves. Granting on it hands out paid plans for free.
  const ENDING = ["subscription.cancelled", "subscription.completed", "subscription.halted"];
  const relevant = ACTIVATING.includes(event) || ENDING.includes(event);

  // ── Idempotency + audit trail. There was no record of any webhook before this, which
  // is why the tester's failed upgrade had to be diagnosed by guesswork. Every event is
  // now written down, and a replayed event id is answered without touching the plan.
  const logEvent = async (outcome: string, detail: string) => {
    try {
      await supabase.from("payment_events").insert({
        event_id: eventId, event, mode, user_id: userId || null, plan: plan || null,
        subscription_id: subId || null, payment_id: payId || null, amount_paise: amountPaise,
        outcome, detail, raw: payload,
      });
    } catch (e) { console.error("payment_events insert failed", e); }
  };

  if (relevant) {
    const { data: seen } = await supabase.from("payment_events")
      .select("id, outcome").eq("event_id", eventId).maybeSingle();
    if (seen) {
      console.log(`DUPLICATE event_id=${eventId} already handled as ${seen.outcome}`);
      return new Response("ok (duplicate)", { status: 200 });
    }
  }

  // ── Who is this? notes first, then every other handle we hold, so a missing note can
  // never again cost someone the plan they paid for.
  if (!userId) {
    const email = String(pay?.email ?? "");
    if (email) {
      const { data } = await supabase.from("users").select("id").ilike("email", email).maybeSingle();
      if (data?.id) userId = String(data.id);
    }
    if (!userId && subId) {
      const { data } = await supabase.from("users").select("id").eq("razorpay_subscription_id", subId).maybeSingle();
      if (data?.id) userId = String(data.id);
    }
    const custId = String(pay?.customer_id ?? sub?.customer_id ?? "");
    if (!userId && custId) {
      const { data } = await supabase.from("users").select("id").eq("razorpay_customer_id", custId).maybeSingle();
      if (data?.id) userId = String(data.id);
    }
  }

  // ── Which plan? `payment.captured` for a subscription charge arrives with EMPTY notes
  // (they live on the subscription), so v19 depended entirely on subscription.charged
  // also being enabled in the dashboard. If it wasn't, money moved and no plan was ever
  // granted. Ask Razorpay directly instead of depending on webhook configuration.
  if (!plan && subId) {
    const keyId = (mode === "test" ? Deno.env.get("RAZORPAY_TEST_KEY_ID") : "") || Deno.env.get("RAZORPAY_KEY_ID") || "";
    const keySecret = (mode === "test" ? Deno.env.get("RAZORPAY_TEST_KEY_SECRET") : "") || Deno.env.get("RAZORPAY_KEY_SECRET") || "";
    if (keyId && keySecret) {
      try {
        const r = await fetch(`https://api.razorpay.com/v1/subscriptions/${subId}`, {
          headers: { Authorization: "Basic " + btoa(`${keyId}:${keySecret}`) },
        });
        if (r.ok) {
          const s = await r.json() as Rec;
          const sn = notesOf(s);
          if (sn.plan) { plan = String(sn.plan); planSource = "razorpay-api"; }
          if (!userId && sn.user_id) userId = String(sn.user_id);
        } else {
          console.error(`subscription lookup ${subId} -> ${r.status}`);
        }
      } catch (e) { console.error("subscription lookup failed", e); }
    }
  }

  console.log(`WEBHOOK mode=${mode} event=${event} user=${userId || "NONE"} plan=${plan || "NONE"}(${planSource || "-"}) sub=${subId || "NONE"} amount=${amountPaise ?? "-"}`);

  if (!relevant) return new Response("ok (ignored)", { status: 200 });

  if (ACTIVATING.includes(event)) {
    if (isMeshPass) {
      await logEvent("mesh_pass", "one-off Mesh order, not a plan change");
      return new Response("ok", { status: 200 });
    }
    if (!userId || !plan) {
      // Money moved and we cannot act on it — a human must see this. 500 makes Razorpay
      // retry (a later retry may carry the notes), and leaves it red in the dashboard
      // instead of a quiet 200 that hides a paid customer sitting on free.
      await logEvent("unattributed", `userId=${userId || "?"} plan=${plan || "?"} payerEmail=${String(pay?.email ?? "")}`);
      console.error(`UNATTRIBUTED PAYMENT event=${event} sub=${subId} notes=${JSON.stringify(notes)} payerEmail=${String(pay?.email ?? "")}`);
      return new Response("Could not attribute payment", { status: 500 });
    }
    if (!PAID_PLANS.has(plan)) {
      await logEvent("bad_plan", `plan "${plan}" is not a sellable plan`);
      console.error(`BAD PLAN "${plan}" for user=${userId} — refusing to write an unknown plan`);
      return new Response("Unknown plan", { status: 500 });
    }

    const { data: before } = await supabase.from("users")
      .select("plan, usage_period_start").eq("id", userId).maybeSingle();
    if (!before) {
      await logEvent("no_such_user", `user ${userId} not found`);
      console.error(`NO SUCH USER ${userId}`);
      return new Response("No such user", { status: 500 });
    }

    const patch: Record<string, unknown> = { plan, subscription_status: "active", grace_period_end: null };
    if (subId) patch.razorpay_subscription_id = subId;
    const custId = String(pay?.customer_id ?? sub?.customer_id ?? "");
    if (custId) patch.razorpay_customer_id = custId;

    // Only start a fresh allowance window on a real new cycle. payment.captured and
    // subscription.charged both fire for the SAME charge, so resetting unconditionally
    // handed out a second month's tokens seconds after the first.
    const startedAt = before.usage_period_start ? new Date(String(before.usage_period_start)).getTime() : 0;
    const ageDays = startedAt ? (Date.now() - startedAt) / 86_400_000 : Infinity;
    if (before.plan !== plan || ageDays >= 20) patch.usage_period_start = new Date().toISOString();

    const { error } = await supabase.from("users").update(patch).eq("id", userId);
    if (error) {
      await logEvent("update_failed", error.message);
      console.error(`PLAN UPDATE FAILED user=${userId} plan=${plan}`, error);
      return new Response("Update failed", { status: 500 });
    }
    await logEvent("upgraded", `${before.plan} -> ${plan}${patch.usage_period_start ? " (new period)" : " (period kept)"}`);
    console.log(`PLAN UPDATED user=${userId} ${before.plan} -> ${plan} sub=${subId}`);

    if (plan === "business") {
      const { data: existing } = await supabase.from("teams").select("id").eq("owner_id", userId).maybeSingle();
      if (!existing) {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const email = userData?.user?.email ?? "Team";
        const { data: team, error: teamErr } = await supabase.from("teams")
          .insert({ owner_id: userId, name: email.split("@")[0] + "'s Team", plan: "team", max_seats: 10 })
          .select("id").single();
        if (!teamErr && team) {
          await supabase.from("team_members").insert({
            team_id: team.id, user_id: userId, email, role: "admin",
            status: "active", joined_at: new Date().toISOString(),
          });
          await supabase.from("users").update({ team_id: team.id }).eq("id", userId);
        }
      }
    }
    return new Response("ok", { status: 200 });
  }

  // ── Ending. v19 set plan='free' the instant Razorpay said "cancelled" — including the
  // normal "cancel at period end", which took away a month the customer had already paid
  // for. Keep the plan, mark it cancelled, and let it lapse at current_end (expire_billing_grants
  // does the downgrade). subscription.halted means payments are failing, so give a short grace.
  if (!userId) {
    await logEvent("unattributed_end", `sub=${subId}`);
    console.error(`UNATTRIBUTED ENDING event=${event} sub=${subId}`);
    return new Response("ok", { status: 200 });
  }
  const currentEnd = Number(sub?.current_end ?? 0);
  const graceEnd = currentEnd > 0
    ? new Date(currentEnd * 1000).toISOString()
    : new Date(Date.now() + (event === "subscription.halted" ? 3 : 1) * 86_400_000).toISOString();
  const { error: endErr } = await supabase.from("users")
    .update({ subscription_status: "cancelled", grace_period_end: graceEnd }).eq("id", userId);
  if (endErr) {
    await logEvent("end_failed", endErr.message);
    return new Response("Update failed", { status: 500 });
  }
  await logEvent("ending", `access kept until ${graceEnd}`);
  console.log(`ENDING user=${userId} event=${event} access until ${graceEnd}`);
  return new Response("ok", { status: 200 });
});
