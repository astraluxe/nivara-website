// Run:  node supabase/functions/razorpay-webhook/test/webhook.test.mjs
//       (no dependencies -- Node strips the TypeScript types itself)
//
// WHY THIS EXISTS. A customer paid and got nothing, and the only way to find out why was guesswork
// -- there were no tests and, at the time, no audit trail either. These drive the REAL webhook
// source through the payload shapes Razorpay actually sends, so the answer to "would this grant the
// plan?" is something you run, not something you reason about.
//
// It never touches the network or the database: the Supabase client is a fake that records writes.
// Drive the REAL razorpay-webhook source against realistic Razorpay payloads.
//
// Nothing is mocked except the two things that cannot exist off-platform: Deno.env and the
// Supabase client. The signature check, attribution, plan validation, idempotency and the
// activate/end branches are the actual shipped code.
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { stripTypeScriptTypes } from 'node:module';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

const ENV = {
  RAZORPAY_WEBHOOK_SECRET: 'live_secret_abc',
  SUPABASE_URL: 'http://local',
  SUPABASE_SERVICE_ROLE_KEY: 'service_role_key',
  RAZORPAY_KEY_ID: 'rzp_test_key',
  RAZORPAY_KEY_SECRET: 'rzp_test_secret',
};

// ── The fake database: records every write so tests can assert on real effects ────────────────
function makeDb(state) {
  const calls = { updates: [], events: [] };
  const api = (table) => {
    const q = { _table: table, _filters: {} };
    q.select = () => q;
    q.eq = (k, v) => { q._filters[k] = v; return q; };
    q.ilike = (k, v) => { q._filters[k] = v; return q; };
    q.maybeSingle = async () => {
      if (table === 'payment_events') {
        const hit = calls.events.find((e) => e.event_id === q._filters.event_id);
        return { data: hit ? { id: 1, outcome: hit.outcome } : null };
      }
      if (table === 'users') {
        const u = state.users.find((u) =>
          Object.entries(q._filters).every(([k, v]) =>
            String(u[k] ?? '').toLowerCase() === String(v).toLowerCase()));
        return { data: u ?? null };
      }
      if (table === 'teams') return { data: state.teams?.[0] ?? null };
      return { data: null };
    };
    q.single = async () => q.maybeSingle();
    q.insert = async (row) => {
      if (table === 'payment_events') calls.events.push(row);
      if (table === 'teams') { const t = { id: 'team_1', ...row }; (state.teams ??= []).push(t); return { data: t, error: null, select: () => ({ single: async () => ({ data: t, error: null }) }) }; }
      return { data: null, error: null };
    };
    q.update = (patch) => ({
      eq: async (k, v) => {
        const u = state.users.find((x) => String(x[k]) === String(v));
        if (!u) return { error: { message: 'no row' } };
        calls.updates.push({ id: v, patch });
        Object.assign(u, patch);
        return { error: null };
      },
    });
    // teams insert().select().single() chain
    if (table === 'teams') {
      q.insert = (row) => ({ select: () => ({ single: async () => { const t = { id: 'team_1', ...row }; (state.teams ??= []).push(t); return { data: t, error: null }; } }) });
    }
    return q;
  };
  return {
    client: { from: api, auth: { admin: { getUserById: async () => ({ data: { user: { email: 'a@b.com' } } }) } } },
    calls,
  };
}

async function hmacHex(raw, secret) {
  const key = await webcrypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await webcrypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ── Load the real handler ──────────────────────────────────────────────────────────────────────
function loadHandler({ env = ENV, db, fetchImpl }) {
  // THE REAL FILE, not a copy. The two import lines are Deno/JSR-only and are replaced by the
  // sandbox below; everything the tests exercise -- signatures, attribution, plan validation,
  // idempotency, the activate/end branches -- is the shipped code.
  const src = readFileSync(new URL('../index.ts', import.meta.url), 'utf8')
    .replace('import "jsr:@supabase/functions-js/edge-runtime.d.ts";', '')
    .replace('import { createClient } from "jsr:@supabase/supabase-js@2";', '');
  const js = stripTypeScriptTypes(src, { mode: 'strip' });
  let handler = null;
  const sandbox = {
    Deno: { serve: (fn) => { handler = fn; }, env: { get: (k) => env[k] } },
    createClient: () => db.client,
    fetch: fetchImpl ?? (async () => ({ ok: false, status: 404 })),
    console: { log: () => {}, error: () => {} },
    crypto: webcrypto, TextEncoder, Response, Request, JSON, Number, String, Object, Array, Date, Math, Set, btoa,
    module: { exports: {} }, exports: {},
  };
  const fn = new Function(...Object.keys(sandbox), js);
  fn(...Object.values(sandbox));
  return handler;
}

async function post(handler, body, { signature, secret = ENV.RAZORPAY_WEBHOOK_SECRET, eventId } = {}) {
  const raw = JSON.stringify(body);
  const sig = signature === undefined ? await hmacHex(raw, secret) : signature;
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (sig !== null) headers.set('X-Razorpay-Signature', sig);
  if (eventId) headers.set('x-razorpay-event-id', eventId);
  const res = await handler(new Request('http://x/webhook', { method: 'POST', body: raw, headers }));
  return { status: res.status, text: await res.text() };
}

// ── Payload builders that mirror what Razorpay really sends ───────────────────────────────────
const subCharged = (notes, subId = 'sub_123') => ({
  event: 'subscription.charged',
  payload: {
    subscription: { entity: { id: subId, notes, customer_id: 'cust_1', current_end: 0 } },
    payment: { entity: { id: 'pay_1', amount: 149900, email: 'buyer@example.com' } },
  },
});
const paymentCaptured = (subId = 'sub_123') => ({
  event: 'payment.captured',
  payload: { payment: { entity: { id: 'pay_2', amount: 149900, email: 'buyer@example.com', subscription_id: subId, notes: {} } } },
});

let pass = 0, fail = 0;
const check = (name, ok, detail = '') => {
  (ok ? pass++ : fail++);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

const freshState = () => ({ users: [{ id: 'user_1', email: 'buyer@example.com', plan: 'free', usage_period_start: null, subscription_status: 'free' }] });

console.log('=== SIGNATURE GATES ===');
{
  const db = makeDb(freshState());
  const h = loadHandler({ db });
  check('no secret configured -> 503 (fails closed)',
    (await post(loadHandler({ env: { ...ENV, RAZORPAY_WEBHOOK_SECRET: '' }, db: makeDb(freshState()) }), subCharged({ user_id: 'user_1', plan: 'solo' }))).status === 503);
  check('missing signature -> 401', (await post(h, subCharged({ user_id: 'user_1', plan: 'solo' }), { signature: null })).status === 401);
  check('wrong signature -> 401', (await post(h, subCharged({ user_id: 'user_1', plan: 'solo' }), { signature: 'deadbeef' })).status === 401);
  check('tampered body -> 401', await (async () => {
    const good = subCharged({ user_id: 'user_1', plan: 'solo' });
    const sig = await hmacHex(JSON.stringify(good), ENV.RAZORPAY_WEBHOOK_SECRET);
    const evil = subCharged({ user_id: 'user_1', plan: 'business' });
    return (await post(h, evil, { signature: sig })).status === 401;
  })());
}

console.log('\n=== GRANTING A PLAN ===');
{
  const state = freshState();
  const db = makeDb(state);
  const h = loadHandler({ db });
  const r = await post(h, subCharged({ user_id: 'user_1', plan: 'solo' }), { eventId: 'evt_1' });
  check('valid subscription.charged -> 200', r.status === 200, r.text);
  check('plan written to users', state.users[0].plan === 'solo', 'plan=' + state.users[0].plan);
  check('subscription_status active', state.users[0].subscription_status === 'active');
  check('subscription id stored', state.users[0].razorpay_subscription_id === 'sub_123');
  check('usage period started', !!state.users[0].usage_period_start);
  check('audit row written as upgraded', db.calls.events.at(-1)?.outcome === 'upgraded');
}

console.log('\n=== IDEMPOTENCY (the double-charge guard) ===');
{
  const state = freshState();
  const db = makeDb(state);
  const h = loadHandler({ db });
  await post(h, subCharged({ user_id: 'user_1', plan: 'solo' }), { eventId: 'evt_same' });
  const firstPeriod = state.users[0].usage_period_start;
  const r2 = await post(h, subCharged({ user_id: 'user_1', plan: 'solo' }), { eventId: 'evt_same' });
  check('replayed event id -> 200 duplicate', r2.status === 200 && /duplicate/.test(r2.text), r2.text);
  check('period NOT reset by the replay', state.users[0].usage_period_start === firstPeriod);
  check('only one upgrade logged', db.calls.events.filter((e) => e.outcome === 'upgraded').length === 1);
}

console.log('\n=== payment.captured WITH EMPTY NOTES (the reported failure shape) ===');
{
  const state = freshState();
  const db = makeDb(state);
  // Razorpay API returns the subscription, whose notes hold the real pair.
  const h = loadHandler({ db, fetchImpl: async (url) => ({
    ok: String(url).includes('/subscriptions/sub_123'),
    status: 200,
    json: async () => ({ id: 'sub_123', notes: { user_id: 'user_1', plan: 'builder' } }),
  }) });
  const r = await post(h, paymentCaptured(), { eventId: 'evt_cap' });
  check('recovers plan from the Razorpay API -> 200', r.status === 200, r.text);
  check('plan granted despite empty notes', state.users[0].plan === 'builder', 'plan=' + state.users[0].plan);
}
{
  // And when the lookup is impossible, it must NOT silently 200.
  const state = freshState();
  const db = makeDb(state);
  const h = loadHandler({ db, fetchImpl: async () => ({ ok: false, status: 500 }) });
  const r = await post(h, paymentCaptured(), { eventId: 'evt_cap2' });
  check('unattributable payment -> 500 so Razorpay retries', r.status === 500, r.text);
  check('left on free, not guessed', state.users[0].plan === 'free');
  check('logged as unattributed', db.calls.events.at(-1)?.outcome === 'unattributed');
}

console.log('\n=== THINGS THAT MUST NOT GRANT ===');
{
  const state = freshState();
  const db = makeDb(state);
  const h = loadHandler({ db });
  const r = await post(h, { event: 'subscription.authenticated', payload: { subscription: { entity: { id: 'sub_9', notes: { user_id: 'user_1', plan: 'business' } } } } }, { eventId: 'evt_auth' });
  check('subscription.authenticated (mandate, no money) does not grant', state.users[0].plan === 'free', 'status=' + r.status);

  const r2 = await post(h, subCharged({ user_id: 'user_1', plan: 'enterprise_gold' }), { eventId: 'evt_bad' });
  check('unknown plan name refused -> 500', r2.status === 500 && state.users[0].plan === 'free', r2.text);
  check('logged as bad_plan', db.calls.events.at(-1)?.outcome === 'bad_plan');

  const r3 = await post(h, subCharged({ user_id: 'ghost_user', plan: 'solo' }, 'sub_x'), { eventId: 'evt_ghost' });
  check('unknown user refused -> 500', r3.status === 500, r3.text);
}

console.log('\n=== CANCELLATION KEEPS PAID TIME ===');
{
  const state = { users: [{ id: 'user_1', email: 'buyer@example.com', plan: 'builder', subscription_status: 'active', usage_period_start: new Date().toISOString() }] };
  const db = makeDb(state);
  const h = loadHandler({ db });
  const future = Math.floor(Date.now() / 1000) + 20 * 86400;
  const r = await post(h, { event: 'subscription.cancelled', payload: { subscription: { entity: { id: 'sub_123', notes: { user_id: 'user_1', plan: 'builder' }, current_end: future } } } }, { eventId: 'evt_cancel' });
  check('cancellation -> 200', r.status === 200);
  check('plan KEPT (paid month not taken away)', state.users[0].plan === 'builder', 'plan=' + state.users[0].plan);
  check('marked cancelled', state.users[0].subscription_status === 'cancelled');
  check('grace runs to period end', new Date(state.users[0].grace_period_end).getTime() > Date.now() + 19 * 86400000);
}

console.log('\n=== MESH PASS MUST NOT LOOK LIKE A FAILED PLAN ===');
{
  const state = freshState();
  const db = makeDb(state);
  const h = loadHandler({ db });
  const r = await post(h, { event: 'order.paid', payload: { order: { entity: { id: 'ord_1', amount: 9900, notes: { kind: 'mesh_pass', user_id: 'user_1' } } } } }, { eventId: 'evt_mesh' });
  check('mesh pass -> 200, not an unattributed error', r.status === 200, r.text);
  check('plan untouched', state.users[0].plan === 'free');
  check('logged as mesh_pass', db.calls.events.at(-1)?.outcome === 'mesh_pass');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
