/* ─────────────────────────────────────────────────────────────────────────────
   /api/whatsapp — the WhatsApp Cloud API webhook's front door (23 Oct 2026).

   WHY IT IS HERE AND NOT ON THE OFFICE MACHINE
   Meta delivered straight to the office server through a Tailscale Funnel. When
   that machine rested at night, rebooted, or Tailscale stopped publishing its
   public name (23 Oct), messages could not be delivered at all. This page is
   always online, so Meta always has somewhere to deliver.

   WHAT IT DOES
     GET   Meta's subscription check - passed through to the office, which holds
           the verify token (no secret lives here).
     POST  1. the exact body + Meta's signature header are saved to Supabase
              (wa_inbox: the public key may only ADD rows - nobody can read them
              from the web; the office collects them with its own key)
           2. passed straight on to the office, so a reply still goes in seconds
           The office checks Meta's signature on every message before trusting it
           (the app secret never leaves the office). When the office is off, the
           saved copy waits and the office collects it when it is back.
   ───────────────────────────────────────────────────────────────────────────── */

export const config = { runtime: 'edge' };

const OFFICE = 'https://adris-server.tail48a67c.ts.net/whatsapp/webhook';
const SUPA_URL = 'https://xkkqcqsacgdrfwbwdqsp.supabase.co';
// the site's public (anon) key - the same one the contact form uses; it can only add rows to wa_inbox
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhra3FjcXNhY2dkcmZ3YndkcXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTU0NzQsImV4cCI6MjA4OTQ3MTQ3NH0.gD57n_392PovM1QBVRsstzL4EQM-jvVeTbu_O1f-3l0';
const MAX_BODY = 1_000_000;

async function withTimeout(promise, ms) {
  let t;
  const timeout = new Promise((_, reject) => { t = setTimeout(() => reject(new Error('timeout')), ms); });
  try { return await Promise.race([promise, timeout]); } finally { clearTimeout(t); }
}

export default async function handler(req) {
  const url = new URL(req.url);

  if (req.method === 'GET') {
    // Meta's verification: the office answers it (it holds the token)
    try {
      const r = await withTimeout(fetch(OFFICE + url.search, { method: 'GET' }), 8000);
      return new Response(await r.text(), { status: r.status, headers: { 'content-type': 'text/plain' } });
    } catch (e) {
      return new Response('office unreachable', { status: 503 });
    }
  }
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const body = await req.text();
  if (!body || body.length > MAX_BODY) return new Response('bad size', { status: 413 });
  const signature = req.headers.get('x-hub-signature-256') || '';

  // 1. keep it (so nothing is lost while the office is off)
  let saved = false;
  try {
    const r = await withTimeout(fetch(SUPA_URL + '/rest/v1/wa_inbox', {
      method: 'POST',
      headers: { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON, 'Content-Type': 'application/json',
                 Prefer: 'return=minimal' },
      body: JSON.stringify({ body, signature }),
    }), 6000);
    saved = r.ok;
  } catch (e) { saved = false; }

  // 2. pass it on at once (a reply in seconds when the office is up)
  let forwarded = false;
  try {
    const r = await withTimeout(fetch(OFFICE, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': signature }, body,
    }), 6000);
    forwarded = r.ok;
  } catch (e) { forwarded = false; }

  // Meta retries anything that is not 200 - only when it was neither kept nor delivered
  return new Response(saved || forwarded ? 'ok' : 'not kept', { status: saved || forwarded ? 200 : 503 });
}
