import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ─────────────────────────────────────────────────────────────────────────────
// Starts a Razorpay subscription for the signed-in user.
//
// The notes written here — {user_id, plan} — are what the webhook reads to decide whose account to
// upgrade and to what. Nothing else in the system carries that pairing, so they are load-bearing.
//
// THERE IS NO TEST MODE. Every subscription started here is a real charge against the live keys.
// The caller was never allowed to ask for test mode — a `test: true` flag from the page would have
// been a way to buy Business for ₹0, since test cards are free and the webhook honours a valid test
// signature — and now the server cannot choose it either. See the block below for why the
// RAZORPAY_MODE branch was removed rather than left switched off.
// ─────────────────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
function jsonErr(msg: string, status: number) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { 'Content-Type': 'application/json', ...CORS } });
}

// Base prices in paise (INR × 100). Kept in step with pricing.html and the desktop UpgradeModal.
const BASE_PRICE_PAISE: Record<string, number> = {
  solo:     149900,  // ₹1,499
  builder:  499900,  // ₹4,999
  business: 1999900, // ₹19,999
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return jsonErr('Method not allowed', 405);

  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return jsonErr('Not authenticated', 401);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
  const { data: { user }, error: authErr } = await supabase.auth.getUser(auth.slice(7));
  if (authErr || !user) return jsonErr('Session expired. Please sign in again.', 401);

  let plan = '', promo_code = '', discount_pct = 0;
  try {
    const body = await req.json();
    plan = body.plan ?? '';
    promo_code = body.promo_code ?? '';
    discount_pct = Number(body.discount_pct ?? 0);
  } catch { return jsonErr('Invalid request body', 400); }

  // ── LIVE ONLY. REAL MONEY, OR NOTHING. ───────────────────────────────────────────────────────
  // This used to branch on RAZORPAY_MODE and reach for the TEST_* keys and plans when it said
  // 'test'. Testing is done, and leaving that branch in place meant the difference between a real
  // charge and a free test card was one environment variable — one that lives in a dashboard, can
  // be changed without a deploy, and leaves no trace in this repository. A checkout that silently
  // stops charging is a worse failure than one that refuses to start, because it looks like it
  // worked. So the choice is gone: there is one set of credentials, and they are the live ones.
  //
  // Restoring test mode is a deliberate code change, reviewed and deployed like any other — see the
  // git history of this file for the branch that used to be here. The TEST_* secrets can stay set;
  // nothing reads them any more.
  const testMode = false;

  const PLAN_IDS: Record<string, string> = {
    solo:     Deno.env.get('SOLO_PLAN_ID')    ?? '',
    builder:  Deno.env.get('BUILDER_PLAN_ID') ?? '',
    business: Deno.env.get('TEAM_PLAN_ID')    ?? '',
  };
  if (!PLAN_IDS[plan]) {
    return jsonErr(`Unknown plan: ${plan} (is ${plan === 'business' ? 'TEAM' : plan.toUpperCase()}_PLAN_ID set?)`, 400);
  }

  const keyId     = Deno.env.get('RAZORPAY_KEY_ID')     ?? '';
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';
  if (!keyId || !keySecret) return jsonErr('Payment not configured (RAZORPAY_KEY_ID/SECRET missing)', 500);
  const creds = btoa(`${keyId}:${keySecret}`);

  // If a promo discount is requested, verify it server-side and create a discounted plan
  let effectivePlanId = PLAN_IDS[plan];
  if (promo_code && discount_pct > 0 && discount_pct <= 80) {
    // Verify the promo code is valid and matches user's active_promo
    const { data: userData } = await supabase
      .from('users')
      .select('active_promo')
      .eq('id', user.id)
      .single();

    const activePromo = userData?.active_promo;
    const promoValid = activePromo?.code === promo_code &&
                       activePromo?.discount_pct === discount_pct;

    if (promoValid && BASE_PRICE_PAISE[plan]) {
      const discountedPaise = Math.round(BASE_PRICE_PAISE[plan] * (1 - discount_pct / 100));
      // Create a one-time discounted Razorpay plan for this user
      const planResp = await fetch('https://api.razorpay.com/v1/plans', {
        method: 'POST',
        headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: 'monthly',
          interval: 1,
          item: {
            name: `adris.tech ${plan.charAt(0).toUpperCase() + plan.slice(1)} — ${discount_pct}% promo`,
            amount: discountedPaise,
            currency: 'INR',
          },
          notes: { user_id: user.id, promo_code, discount_pct },
        }),
      });
      if (planResp.ok) {
        const newPlan = await planResp.json() as { id: string };
        effectivePlanId = newPlan.id;
      }
      // If plan creation fails, fall through to full-price plan
    }
  }

  const rzpResp = await fetch('https://api.razorpay.com/v1/subscriptions', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan_id:         effectivePlanId,
      total_count:     120,
      quantity:        1,
      customer_notify: 1,
      notes:           { user_id: user.id, plan, promo_code: promo_code || undefined },
    }),
  });

  if (!rzpResp.ok) {
    const t = await rzpResp.text();
    console.error('Razorpay error:', t);
    return jsonErr('Payment gateway error. Please try again.', 500);
  }

  const sub = await rzpResp.json() as { id: string };

  // ── Remember the subscription and which environment made it ─────────────────────────────────
  //
  // Written with the service role because the row is the app's record, not the user's to set. Two
  // things depend on it later and neither can work without it:
  //   * razorpay-subscription reads billing_mode to pick the right API key when showing the renewal
  //     date or cancelling — a test subscription cannot be read with a live key.
  //   * the webhook falls back to razorpay_subscription_id to identify a user when notes are absent.
  // Saving it here rather than waiting for the webhook means Cancel works even if a webhook is
  // missed, which is exactly the failure that left a paying tester on the free plan.
  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await admin.from('users')
      .update({ razorpay_subscription_id: sub.id, billing_mode: testMode ? 'test' : 'live' })
      .eq('id', user.id);
  } catch (e) {
    // Not fatal — the webhook writes the same id on activation. Checkout must not fail over this.
    console.error('could not record subscription id', e);
  }

  return new Response(JSON.stringify({ subscription_id: sub.id, plan, key_id: keyId, test_mode: testMode }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
});
