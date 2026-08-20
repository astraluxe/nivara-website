/* ─────────────────────────────────────────────────────────────────────────────
   /api/posts — the head dashboard's write path for blog posts.

   Deliberately the same shape as /api/reviews, for the same reasons: a post is
   public marketing copy read straight off the CDN, so it lives in /posts.json
   committed to the repo rather than in a database. No table to secure, no
   runtime dependency that can be down while the rest of the site is fine.

   THE TRADE, STATED PLAINLY: a save is not instant. It commits, Vercel rebuilds,
   and the post is live in roughly a minute. The dashboard says so rather than
   pretending the save failed.

   WHO MAY WRITE
   Head admins only, and this endpoint does not decide that for itself — it
   forwards the caller's Supabase token to the existing admin-data function and
   trusts its verdict. One definition of "head admin", and it stays in Supabase.

   SLUGS ARE PERMANENT ONCE SHARED. The slug is the URL. Editing a post keeps its
   slug unless the caller explicitly changes it, because a slug that drifts turns
   every link anyone has shared into a 404.
   ───────────────────────────────────────────────────────────────────────────── */

export const config = { runtime: 'edge' };

const REPO   = process.env.GITHUB_REPO   || 'astraluxe/nivara-website';
const BRANCH = process.env.GITHUB_BRANCH || 'master';
const PATH   = 'posts.json';
const SUPA   = 'https://xkkqcqsacgdrfwbwdqsp.supabase.co';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

// btoa/atob are byte-oriented; a post containing a curly apostrophe, an em dash
// or a rupee sign would be mangled by them directly, so go through UTF-8.
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
      'User-Agent': 'adris-posts',
      ...(init.headers || {}),
    },
  });
}

// Newlines are the whole formatting language of a post, so unlike a review this
// keeps \n and strips only the other control characters.
const cleanText = (s, max) => String(s ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, ' ').trim().slice(0, max);
const cleanLine = (s, max) => String(s ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, max);

const slugify = (s) => cleanLine(s, 90).toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

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
    return json({
      error: 'not_configured',
      message: 'GITHUB_TOKEN is not set on the Vercel project, so posts cannot be saved yet. '
             + 'Create a fine-grained token with Contents: Read and write on '
             + REPO + ', add it as GITHUB_TOKEN, and redeploy.',
    }, 503);
  }

  let body;
  try { body = await req.json(); } catch { return json({ error: 'Bad request body' }, 400); }
  const action = String(body.action || '');

  // Read the file as GitHub has it — not off the CDN, which right after a save is
  // still the previous deploy, so two saves in a row would undo the first.
  let sha = null;
  let doc = { posts: [] };
  const cur = await gh(`contents/${PATH}?ref=${encodeURIComponent(BRANCH)}`, token);
  if (cur.ok) {
    const meta = await cur.json();
    sha = meta.sha;
    try {
      const parsed = JSON.parse(b64decode(meta.content));
      if (parsed && typeof parsed === 'object') doc = parsed;
      if (!Array.isArray(doc.posts)) doc.posts = [];
    } catch {
      return json({ error: 'posts.json on GitHub is not valid JSON — fix it before saving.' }, 500);
    }
  } else if (cur.status !== 404) {
    const t = await cur.text();
    return json({ error: `GitHub read failed (${cur.status})`, detail: t.slice(0, 300) }, 502);
  }

  if (action === 'list') return json({ posts: doc.posts });

  /* ── Drop a picture or a video straight into the dashboard ──────────────────
   *
   * Same storage idea as the posts themselves: the file is committed to the repo
   * under /blog-media and served off the CDN. No bucket, no signed URLs, no
   * second service to keep alive for what is usually one image per post.
   *
   * THE LIMIT IS REAL AND IT IS NOT MINE. A request body to a Vercel function is
   * capped at 4.5 MB, and base64 inflates a file by about a third on the way in,
   * so anything over ~3 MB cannot arrive here however it is sent. The dashboard
   * checks the size before uploading and says so, because "Save" appearing to
   * hang while a 40 MB video fails to arrive is the worst version of this.
   *
   * A big video therefore still goes in by hand and is referenced by path — the
   * 43 MB film is 14x over the ceiling and no amount of UI changes that.
   */
  if (action === 'upload') {
    const raw = String(body.name || 'file');
    const b64 = String(body.data || '');
    if (!b64) return json({ error: 'No file data arrived.' }, 400);

    const ext = (raw.match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase();
    const OK = { jpg: 1, jpeg: 1, png: 1, webp: 1, gif: 1, avif: 1, mp4: 1, webm: 1 };
    if (!OK[ext]) return json({ error: `Cannot use a .${ext || '?'} file. Pictures: jpg, png, webp, gif, avif. Video: mp4, webm.` }, 400);

    // 4 bytes of base64 carry 3 bytes of file.
    const bytes = Math.floor(b64.length * 3 / 4);
    if (bytes > 3_200_000) {
      return json({ error: `That file is ${(bytes / 1048576).toFixed(1)} MB. The upload ceiling is 3 MB — `
        + 'anything larger cannot fit in a single request. Compress it, or put the file in the repo and use its path.' }, 413);
    }

    // Keep the visitor's own filename where it is safe to, so /blog-media reads
    // like a folder rather than a list of hashes; prefix with the date so two
    // posts can both have a "cover.jpg".
    const stem = raw.replace(/\.[a-z0-9]+$/i, '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'file';
    const stamp = new Date().toISOString().slice(0, 10);
    const filePath = `blog-media/${stamp}-${stem}.${ext}`;

    // If that exact name exists, its sha is required to overwrite it.
    let fileSha = null;
    const head = await gh(`contents/${encodeURI(filePath)}?ref=${encodeURIComponent(BRANCH)}`, token);
    if (head.ok) { try { fileSha = (await head.json()).sha; } catch { /* treat as new */ } }

    const up = await gh(`contents/${encodeURI(filePath)}`, token, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `blog: upload ${filePath}`,
        content: b64,
        branch: BRANCH,
        ...(fileSha ? { sha: fileSha } : {}),
      }),
    });
    if (!up.ok) {
      const t = await up.text();
      return json({ error: `Upload failed (${up.status})`, detail: t.slice(0, 300) }, 502);
    }
    return json({
      ok: true,
      path: '/' + filePath,
      kind: /^(mp4|webm)$/.test(ext) ? 'video' : 'image',
      bytes,
      note: 'Uploaded. It is live once Vercel finishes rebuilding, about a minute.',
    });
  }

  let message;

  if (action === 'save') {
    const p = body.post || {};
    const title = cleanLine(p.title, 160);
    const text  = cleanText(p.body, 60000);
    if (!title) return json({ error: 'A title is required.' }, 400);
    if (!text)  return json({ error: 'The post body is required.' }, 400);

    // The slug is the shared URL. Keep the one that already exists unless the
    // caller deliberately supplies a different one.
    const slug = slugify(p.slug || title);
    if (!slug) return json({ error: 'Could not build a web address from that title — add a few letters or numbers.' }, 400);

    const video = cleanLine(p.video, 300);
    if (video && !/^\/[\w.\-/]+$/.test(video)) {
      return json({ error: 'The video must be a path on this site, e.g. /adris-film.mp4' }, 400);
    }
    const poster = cleanLine(p.poster, 300);
    if (poster && !/^\/[\w.\-/]+$/.test(poster)) {
      return json({ error: 'The image must be a path on this site, e.g. /adris-film-poster.jpg' }, 400);
    }

    const at = doc.posts.findIndex((x) => x && x.slug === (cleanLine(p.originalSlug, 90) || slug));
    const entry = {
      slug, title,
      excerpt: cleanLine(p.excerpt, 400),
      tag: cleanLine(p.tag, 40) || 'Notes',
      date: cleanLine(p.date, 40) || new Date().toISOString(),
      ...(video ? { video } : {}),
      ...(poster ? { poster } : {}),
      body: text,
      draft: !!p.draft,
      pinned: !!p.pinned,
      added: (at >= 0 && doc.posts[at].added) || new Date().toISOString(),
    };

    // A slug collision with a DIFFERENT post would overwrite that post's URL.
    const clash = doc.posts.findIndex((x, i) => x && x.slug === slug && i !== at);
    if (clash >= 0) return json({ error: `Another post already uses the address /blog/${slug}. Change the title or the address.` }, 409);

    if (at >= 0) doc.posts[at] = entry;
    else doc.posts.unshift(entry);
    message = `blog: ${at >= 0 ? 'update' : 'add'} ${title}`;

  } else if (action === 'pin') {
    // ONE pinned post, not a pile of them. "Pinned" that applies to six posts is just the
    // ordering you already had, so setting it here clears it everywhere else.
    const slug = cleanLine(body.slug, 90);
    const on = !!body.pinned;
    const found = doc.posts.some((x) => x && x.slug === slug);
    if (!found) return json({ error: 'No post with that address.' }, 404);
    doc.posts.forEach((x) => { if (x) x.pinned = on && x.slug === slug; });
    message = `blog: ${on ? 'pin' : 'unpin'} ${slug}`;

  } else if (action === 'delete') {
    const slug = cleanLine(body.slug, 90);
    const before = doc.posts.length;
    doc.posts = doc.posts.filter((x) => x && x.slug !== slug);
    if (doc.posts.length === before) return json({ error: 'No post with that address.' }, 404);
    message = `blog: remove ${slug}`;

  } else {
    return json({ error: `Unknown action: ${action}` }, 400);
  }

  const put = await gh(`contents/${PATH}`, token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: b64encode(JSON.stringify(doc, null, 2) + '\n'),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!put.ok) {
    const t = await put.text();
    if (put.status === 409) return json({ error: 'Someone else just changed posts.json. Reload and try again.' }, 409);
    return json({ error: `GitHub write failed (${put.status})`, detail: t.slice(0, 300) }, 502);
  }

  const out = await put.json();
  return json({
    ok: true,
    posts: doc.posts,
    commit: out?.commit?.sha ? String(out.commit.sha).slice(0, 7) : null,
    note: 'Committed. Vercel is rebuilding — the post is usually live within a minute.',
  });
}
