// Supabase Edge Function — mesh-verify
// Verifies a completed Razorpay payment for a Mesh pass and grants the pass.
// SECURITY: re-computes the price server-side, verifies the Razorpay signature,
// AND re-fetches the payment to confirm the captured amount matches. Only then
// does it insert the mesh_passes row (using the service role). The user must be
// logged in, and the grant is tied to their verified user id.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BASE: Record<string, number>     = { hour: 15, day: 59, week: 179, month: 399 };
const EXTRA: Record<string, number>    = { hour: 2,  day: 6,  week: 18,  month: 40 };
const HRS: Record<string, number>      = { hour: 1,  day: 24, week: 168, month: 720 };
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

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
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
    const jwt = (req.headers.get("Authorization") || "").replace("Bearer ", "").trim();
    if (!jwt) return json({ error: "Please sign in." }, 401);
    const userRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${jwt}`, apikey: Deno.env.get("SUPABASE_ANON_KEY")! },
    });
    if (!userRes.ok) return json({ error: "Please sign in." }, 401);
    const user = await userRes.json();
    if (!user?.id) return json({ error: "Please sign in." }, 401);

    const {
      razorpay_order_id, razorpay_payment_id, razorpay_signature, devices, dur, hours,
    } = await req.json().catch(() => ({}));

    const p = priceFor(Number(devices), String(dur), Number(hours));
    if (!p) return json({ error: "Invalid Mesh selection." }, 400);

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) return json({ error: "Payment not configured." }, 500);

    // 1) verify the Razorpay signature
    const expected = await hmacHex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);
    if (expected !== razorpay_signature) return json({ error: "Payment signature mismatch." }, 400);

    // 2) defense-in-depth: confirm the captured amount + status with Razorpay
    const payRes = await fetch(`https://api.razorpay.com/v1/payments/${razorpay_payment_id}`, {
      headers: { Authorization: "Basic " + btoa(`${keyId}:${keySecret}`) },
    });
    const pay = await payRes.json();
    if (!payRes.ok) return json({ error: "Could not verify the payment." }, 502);
    if (pay.amount !== p.paise || (pay.status !== "captured" && pay.status !== "authorized")) {
      return json({ error: "Payment amount or status did not match." }, 400);
    }

    // 3) grant the pass (service role bypasses RLS for the insert)
    const expiresAt = new Date(Date.now() + p.passHours * 3600 * 1000).toISOString();
    const insRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/rest/v1/mesh_passes`, {
      method: "POST",
      headers: {
        apikey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        user_id: user.id,
        devices,
        expires_at: expiresAt,
        amount: p.rupees,
        razorpay_payment_id,
        razorpay_order_id,
      }),
    });
    if (!insRes.ok) {
      const t = await insRes.text();
      return json({ error: "Payment verified but granting the pass failed: " + t }, 500);
    }

    return json({ ok: true, devices, expires_at: expiresAt }, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
