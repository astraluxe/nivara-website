/* ─────────────────────────────────────────────────────────────────────────────
   /api/reviews — the head dashboard's write path for testimonials.

   WHY NOT A DATABASE
   A testimonial is a few hundred bytes of public marketing copy that changes
   maybe once a month and is read on every homepage load. Putting it in Postgres
   would mean a network round trip on the site's busiest page, a runtime
   dependency that can be down while the rest of the site is fine, and a table to
   secure — to store less data than this comment. So the reviews live in
   /reviews.json, committed to the repo. The pages read it straight off the CDN
   for nothing, and this endpoint is the only thing that ever writes it.

   THE TRADE, STATED PLAINLY: a save is not instant. It commits, Vercel rebuilds,
   and the change is live in roughly a minute. That is the cost of having no
   database, and the dashboard says so rather than pretending the save failed.

   WHO MAY WRITE
   Head admins only, and this endpoint does not decide that for itself — it
   forwards the caller's Supabase token to the existing admin-data function and
   trusts its verdict. There is exactly one definition of "head admin" in this
   system and it stays in Supabase; a second list here would drift, and the day
   it drifted this would be the hole.
   ───────────────────────────────────────────────────────────────────────────── */

export const config = { runtime: 'edge' };

const REPO   = process.env.GITHUB_REPO   || 'astraluxe/nivara-website';
const BRANCH = process.env.GITHUB_BRANCH || 'master';
const PATH   = 'reviews.json';
const SUPA   = 'https://xkkqcqsacgdrfwbwdqsp.supabase.co';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

// btoa/atob are byte-oriented; a quote containing a curly apostrophe or an em
// dash would be mangled by them directly, so go through UTF-8 explicitly.
function b64encode(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function b64decode(b64) {
  const bin = atob(String(b64).replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function gh(path, token, init = {}) {
  return fetch(`https://api.github.com/repos/${REPO}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'adris-reviews',
      ...(init.headers || {}),
    },
  });
}

const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  // ── Caller must be a head admin, as judged by Supabase, not by us ───────────
  const auth = req.headers.get('Authorization') || '';
  if (!auth.startsWith('Bearer ')) return json({ error: 'Not signed in' }, 401);
  try {
    const check = await fetch(`${SUPA}/functions/v1/admin-data`, { headers: { Authorization: auth } });
    if (check.status === 401) return json({ error: 'Session expired. Sign in again.' }, 401);
    if (check.status === 403) return json({ error: 'Head admin access only.' }, 403);
    if (!check.ok) return json({ error: `Could not verify admin access (${check.status}).` }, 502);
  } catch {
    return json({ error: 'Could not reach the admin check.' }, 502);
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    // Said in full so the dashboard can show the actual fix instead of "failed".
    return json({
      error: 'not_configured',
      message: 'GITHUB_TOKEN is not set on the Vercel project, so reviews cannot be saved yet. '
             + 'Create a fine-grained token with Contents: Read and write on '
             + REPO + ', add it as GITHUB_TOKEN, and redeploy.',
    }, 503);
  }

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Bad request body' }, 400); }
  const action = String(body.action || '');

  // ── Read the file as GitHub has it ─────────────────────────────────────────
  // Deliberately not /reviews.json off the CDN: right after a save that file is
  // still the previous deploy, so two saves in a row would silently undo the
  // first. The sha returned here is also what makes the write safe.
  let sha = null;
  let doc = { reviews: [] };
  const cur = await gh(`contents/${PATH}?ref=${encodeURIComponent(BRANCH)}`, token);
  if (cur.ok) {
    const meta = await cur.json();
    sha = meta.sha;
    try {
      const parsed = JSON.parse(b64decode(meta.content));
      if (parsed && typeof parsed === 'object') doc = parsed;
      if (!Array.isArray(doc.reviews)) doc.reviews = [];
    } catch {
      return json({ error: 'reviews.json on GitHub is not valid JSON — fix it before saving.' }, 500);
    }
  } else if (cur.status !== 404) {
    const t = await cur.text();
    return json({ error: `GitHub read failed (${cur.status})`, detail: t.slice(0, 300) }, 502);
  }

  if (action === 'list') return json({ reviews: doc.reviews });

  let message;

  if (action === 'save') {
    const r = body.review || {};
    const name  = clean(r.name, 80);
    const quote = clean(r.quote, 2000);
    if (!name)  return json({ error: 'Name is required.' }, 400);
    if (!quote) return json({ error: 'The review text is required.' }, 400);

    const linkedin = clean(r.linkedin, 300);
    if (linkedin && !/^https?:\/\//i.test(linkedin)) {
      return json({ error: 'The LinkedIn link must start with https://' }, 400);
    }
    // 'saw' and 'used' are not decoration: the site may not imply that someone
    // has used the product when they have only been shown it.
    const context = r.context === 'used' ? 'used' : 'saw';

    const id = clean(r.id, 60) || ('rv-' + Date.now().toString(36));
    const entry = {
      id, name,
      role: clean(r.role, 120),
      linkedin, quote, context,
      added: clean(r.added, 40) || new Date().toISOString(),
    };

    const at = doc.reviews.findIndex((x) => x && x.id === id);
    if (at >= 0) doc.reviews[at] = { ...doc.reviews[at], ...entry };
    else doc.reviews.unshift(entry);          // newest first, which is how they are shown
    message = `reviews: ${at >= 0 ? 'update' : 'add'} ${name}`;

  } else if (action === 'delete') {
    const id = clean(body.id, 60);
    const before = doc.reviews.length;
    doc.reviews = doc.reviews.filter((x) => x && x.id !== id);
    if (doc.reviews.length === before) return json({ error: 'No review with that id.' }, 404);
    message = `reviews: remove ${id}`;

  } else if (action === 'reorder') {
    const order = Array.isArray(body.order) ? body.order.map((x) => String(x)) : [];
    const byId = new Map(doc.reviews.map((x) => [x.id, x]));
    const next = order.map((id) => byId.get(id)).filter(Boolean);
    // Anything the client did not mention is kept, so a stale tab cannot drop rows.
    doc.reviews.forEach((x) => { if (!order.includes(x.id)) next.push(x); });
    doc.reviews = next;
    message = 'reviews: reorder';

  } else {
    return json({ error: `Unknown action: ${action}` }, 400);
  }

  // ── Commit ─────────────────────────────────────────────────────────────────
  const put = await gh(`contents/${PATH}`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: b64encode(JSON.stringify(doc, null, 2) + '\n'),
      branch: BRANCH,
      ...(sha ? { sha } : {}),          // omitted when creating the file for the first time
    }),
  });

  if (!put.ok) {
    const t = await put.text();
    // 409 means the file moved under us — another save, or a push from a laptop.
    if (put.status === 409) {
      return json({ error: 'Someone else just changed reviews.json. Reload and try again.' }, 409);
    }
    return json({ error: `GitHub write failed (${put.status})`, detail: t.slice(0, 300) }, 502);
  }

  const out = await put.json();
  return json({
    ok: true,
    reviews: doc.reviews,
    commit: out?.commit?.sha ? String(out.commit.sha).slice(0, 7) : null,
    note: 'Committed. Vercel is rebuilding — it is usually live within a minute.',
  });
}
