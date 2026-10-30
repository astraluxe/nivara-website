/* /api/licence - the licence server's public door (30 Oct 2026).

   A client's installed program asks for its latest lease. The lease is signed by the office; this page only passes it
   on, so nothing on the web can extend or withdraw a licence. */
export const config = { runtime: 'edge' };

const SUPA_URL = 'https://xkkqcqsacgdrfwbwdqsp.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhra3FjcXNhY2dkcmZ3YndkcXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTU0NzQsImV4cCI6MjA4OTQ3MTQ3NH0.gD57n_392PovM1QBVRsstzL4EQM-jvVeTbu_O1f-3l0';

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('POST only', { status: 405 });
  let q;
  try { q = await req.json(); } catch { return new Response('bad request', { status: 400 }); }
  const b = String(q.build || '').slice(0, 80), m = String(q.machine || '');
  if (!b || !/^[0-9a-f]{32}$/.test(m)) return new Response('bad request', { status: 400 });
  const r = await fetch(`${SUPA_URL}/rest/v1/rpc/licence_lease`, {
    method: 'POST',
    headers: { apikey: SUPA_ANON, Authorization: `Bearer ${SUPA_ANON}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ b, m }),
  });
  if (!r.ok) return new Response('unavailable', { status: 503 });
  const lease = await r.json();
  if (!lease) return new Response('unknown licence', { status: 404 });
  return new Response(JSON.stringify(lease), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
