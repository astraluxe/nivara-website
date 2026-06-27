// Supabase Edge Function — mesh-create-order
// Creates a Razorpay order for a standalone Mesh pass.
// SECURITY: the client sends ONLY the selection (devices / duration / hours).
// The PRICE is computed here, server-side, from the table below — so editing the
// website's JavaScript can never change what the user is actually charged.
// The user MUST be logged in (we verify their Supabase JWT) — no anonymous payers.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ── Server-authoritative price table (mirrors the website calculator) ─────────
const BASE: Record<string, number>     = { hour: 15, day: 59, week: 179, month: 399 }; // ₹ for the base device count
const EXTRA: Record<string, number>    = { hour: 2,  day: 6,  week: 18,  month: 40 };  // ₹ per extra device
const HRS: Record<string, number>      = { hour: 1,  day: 24, week: 168, month: 720 }; // pass length in hours
const BASE_DEV: Record<string, number> = { hour: 5,  day: 10, week: 10,  month: 10 };
const MAX_DEVICES = 100;

function priceFor(devices: number, dur: string, hours: number) {
  if (!(dur in BASE)) return null;
  const baseDev = BASE_DEV[dur];
  if (!Number.isInteger(devices) || devices < baseDev || devices > MAX_DEVICES) return null;
  const extra = devices - baseDev;
  let rupees: number, passHours: number;
  if (dur === "hour") {
    if (!Number.isInteger(hours) || hours < 1 || hours > 24) return null;
    rupees = (BASE.hour + extra * EXTRA.hour) * hours;
    passHours = hours;
  } else {
    rupees = BASE[dur] + extra * EXTRA[dur];
    passHours = HRS[dur];
  }
  return { rupees, paise: rupees * 100, passHours };
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only." }, 405);
  try {
    // 1) require a logged-in user
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    if (!jwt) return json({ error: "Please sign in to buy Mesh." }, 401);
    const userRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${jwt}`, apikey: Deno.env.get("SUPABASE_ANON_KEY")! },
    });
    if (!userRes.ok) return json({ error: "Please sign in to buy Mesh." }, 401);
    const user = await userRes.json();
    if (!user?.id) return json({ error: "Please sign in to buy Mesh." }, 401);

    // 2) compute the price ourselves from the selection (never trust a client amount)
    const { devices, dur, hours } = await req.json().catch(() => ({}));
    const p = priceFor(Number(devices), String(dur), Number(hours));
    if (!p) return json({ error: "Invalid Mesh selection." }, 400);

    // 3) create the Razorpay order bound to that authoritative amount
    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) return json({ error: "Payment not configured." }, 500);

    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${keyId}:${keySecret}`),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: p.paise,
        currency: "INR",
        receipt: `mesh_${String(user.id).slice(0, 8)}_${Date.now()}`,
        notes: { user_id: user.id, devices: String(devices), dur: String(dur), hours: String(hours), kind: "mesh_pass" },
      }),
    });
    const order = await orderRes.json();
    if (!orderRes.ok || !order.id) {
      return json({ error: order?.error?.description || "Could not create order." }, 502);
    }

    return json({
      order_id: order.id,
      amount: p.paise,
      rupees: p.rupees,
      currency: "INR",
      key_id: keyId,
      devices, dur, hours,
      pass_hours: p.passHours,
    }, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
