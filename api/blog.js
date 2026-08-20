/* ─────────────────────────────────────────────────────────────────────────────
   /api/blog — renders /blog and /blog/<slug> as real HTML, on the server.

   WHY SERVER-RENDERED AND NOT A CLIENT FETCH
   The blog exists to be found and to be shared. Both of those are done by
   machines that do not run JavaScript: Google renders JS eventually and
   grudgingly, and the crawlers behind WhatsApp, Slack, LinkedIn and X do not run
   it at all — they read the <meta> tags out of the first response and stop. A
   post rendered in the browser would share as a blank card with the site's
   generic description on every single link, which defeats the point of giving
   each post its own URL.

   So this returns a complete document with the post's own title, description,
   og:image and Article JSON-LD already in the head.

   WHY NO DATABASE, AND NO BUILD STEP
   Same reasoning as /api/reviews: the posts live in /posts.json, committed to the
   repo by the head dashboard. This function reads that file off the CDN and the
   chrome out of /blog-template.html, so the DESIGN stays in an HTML file that can
   be edited like any other page, and this stays a substitution.

   THE TRADE, STATED PLAINLY: a post goes live about a minute after it is saved,
   because the save is a commit and Vercel has to redeploy. That is the cost of
   having no database, and the dashboard says so.
   ───────────────────────────────────────────────────────────────────────────── */

export const config = { runtime: 'edge' };

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* Markdown-lite → HTML.
   Deliberately small. The head writes posts in a textarea, not an editor, so the
   set of things that work is the set of things someone types without thinking:
   blank lines between paragraphs, ## for a heading, - for a bullet, **bold**,
   a link, a > quote, --- for a rule. Everything is escaped first, so a post can
   talk about <div> without breaking the page. */
function mdToHtml(md) {
  const inline = (s) => esc(s)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  const out = [];
  for (const raw of String(md || '').split(/\n{2,}/)) {
    const block = raw.trim();
    if (!block) continue;
    if (/^---+$/.test(block)) { out.push('<hr />'); continue; }
    if (/^###\s+/.test(block)) { out.push(`<h3>${inline(block.replace(/^###\s+/, ''))}</h3>`); continue; }
    if (/^##\s+/.test(block))  { out.push(`<h2>${inline(block.replace(/^##\s+/, ''))}</h2>`); continue; }
    if (/^#\s+/.test(block))   { out.push(`<h2>${inline(block.replace(/^#\s+/, ''))}</h2>`); continue; }
    if (/^>\s+/.test(block)) {
      out.push(`<blockquote>${inline(block.split('\n').map((l) => l.replace(/^>\s?/, '')).join(' '))}</blockquote>`);
      continue;
    }
    if (/^[-*]\s+/.test(block)) {
      const items = block.split('\n').filter((l) => /^\s*[-*]\s+/.test(l))
        .map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ''))}</li>`).join('');
      out.push(`<ul>${items}</ul>`);
      continue;
    }
    out.push(`<p>${block.split('\n').map(inline).join('<br />')}</p>`);
  }
  return out.join('\n');
}

const readTime = (body) => Math.max(1, Math.round(String(body || '').split(/\s+/).length / 200));
const niceDate = (iso) => {
  const d = new Date(iso || Date.now());
  return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default async function handler(req) {
  const url = new URL(req.url);
  const origin = url.origin;
  const slug = (url.searchParams.get('slug') || '').replace(/[^a-z0-9-]/gi, '').toLowerCase();

  let posts = [];
  let template = '';
  try {
    const [pRes, tRes] = await Promise.all([
      fetch(`${origin}/posts.json`, { headers: { 'Cache-Control': 'no-cache' } }),
      fetch(`${origin}/blog-template.html`),
    ]);
    if (pRes.ok) {
      const doc = await pRes.json();
      posts = Array.isArray(doc.posts) ? doc.posts.filter((p) => p && p.slug && !p.draft) : [];
    }
    template = tRes.ok ? await tRes.text() : '';
  } catch {
    /* falls through to the empty states below */
  }
  if (!template) return new Response('Blog template missing', { status: 500 });

  // Newest first, except a pinned post, which the head has deliberately put at the top and which
  // therefore outranks its own date. Only the INDEX order changes: the post itself is untouched,
  // and next/previous still read in date order so navigation does not jump about.
  posts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const pinned = posts.filter((p) => p.pinned);
  const rest = posts.filter((p) => !p.pinned);
  const indexOrder = pinned.concat(rest);

  const SITE = 'https://www.adris.tech';
  let head, main, canonical, status = 200;

  if (slug) {
    const i = posts.findIndex((p) => p.slug === slug);
    const post = posts[i];
    if (!post) {
      status = 404;
      canonical = `${SITE}/blog`;
      head = `<title>Post not found · adris.tech</title>
<meta name="description" content="That post does not exist. See everything we have written on the adris.tech blog." />
<meta name="robots" content="noindex, follow" />`;
      main = `<div class="hiw-hero"><a href="/blog" class="hiw-back">All posts</a>
  <h1>That post isn’t here.</h1>
  <p class="hiw-hero-sub">The link may be old, or the address slightly off. Everything we have written is on the <a href="/blog">blog index</a>.</p></div>`;
    } else {
      canonical = `${SITE}/blog/${post.slug}`;
      const img = post.poster ? SITE + post.poster : `${SITE}/og-cover.png`;
      const ld = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt || '',
        datePublished: post.date,
        dateModified: post.date,
        image: [img],
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        author: { '@type': 'Organization', name: 'adris.tech', url: SITE },
        publisher: { '@type': 'Organization', name: 'adris.tech', url: SITE },
      };
      const crumbs = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'adris.tech', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE}/blog` },
          { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
        ],
      };
      const vid = post.video ? {
        '@context': 'https://schema.org', '@type': 'VideoObject',
        name: post.title, description: post.excerpt || '',
        thumbnailUrl: [img], uploadDate: post.date, contentUrl: SITE + post.video, embedUrl: canonical,
      } : null;

      head = `<title>${esc(post.title)} · adris.tech blog</title>
<meta name="description" content="${esc(post.excerpt || '')}" />
<meta name="robots" content="index, follow" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${esc(post.title)}" />
<meta property="og:description" content="${esc(post.excerpt || '')}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${esc(img)}" />
<meta property="article:published_time" content="${esc(post.date || '')}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(post.title)}" />
<meta name="twitter:description" content="${esc(post.excerpt || '')}" />
<meta name="twitter:image" content="${esc(img)}" />
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script type="application/ld+json">${JSON.stringify(crumbs)}</script>
${vid ? `<script type="application/ld+json">${JSON.stringify(vid)}</script>` : ''}`;

      const player = post.video ? `
  <figure class="post-video">
    <video controls autoplay muted playsinline preload="auto" ${post.poster ? `poster="${esc(post.poster)}"` : ''} src="${esc(post.video)}"></video>
  </figure>` : '';

      const older = posts[i + 1], newer = posts[i - 1];
      const nav = (older || newer) ? `
    <nav class="post-more">
      ${newer ? `<a href="/blog/${esc(newer.slug)}"><span>Newer</span>${esc(newer.title)}</a>` : '<span></span>'}
      ${older ? `<a href="/blog/${esc(older.slug)}" class="r"><span>Older</span>${esc(older.title)}</a>` : '<span></span>'}
    </nav>` : '';

      main = `<article class="post">
  <div class="post-head">
    <a href="/blog" class="hiw-back"><svg width="12" height="12" viewBox="0 0 10 10" fill="none"><path d="M9 1L1 9M1 9H8M1 9V2" stroke="currentColor" stroke-width="1.5" fill="none"/></svg> All posts</a>
    <div class="post-meta"><span class="post-tag">${esc(post.tag || 'Notes')}</span><span>${niceDate(post.date)}</span><span>${readTime(post.body)} min read</span></div>
    <h1>${esc(post.title)}</h1>
    ${post.excerpt ? `<p class="post-excerpt">${esc(post.excerpt)}</p>` : ''}
  </div>${player}
  <div class="post-body">
${mdToHtml(post.body)}
  </div>
  <div class="post-share">
    <span>Share this</span>
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonical)}" target="_blank" rel="noreferrer">LinkedIn</a>
    <a href="https://x.com/intent/tweet?url=${encodeURIComponent(canonical)}&text=${encodeURIComponent(post.title)}" target="_blank" rel="noreferrer">X</a>
    <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + ' ' + canonical)}" target="_blank" rel="noreferrer">WhatsApp</a>
    <button type="button" class="post-copy" data-url="${canonical}">Copy link</button>
  </div>
  <div class="hiw-cta">
    <h2>Built on your own machine, <span class="it">not someone else’s cloud.</span></h2>
    <p>adris is eight AI products in one desktop app. Free to install, and your data never leaves your computer.</p>
    <div class="hiw-cta-btns">
      <a href="/download" class="cta-btn-main">Download — free</a>
      <a href="/how-it-works" class="cta-btn-ghost">How it works</a>
    </div>
  </div>${nav}
</article>`;
    }
  } else {
    canonical = `${SITE}/blog`;
    const ld = {
      '@context': 'https://schema.org', '@type': 'Blog',
      name: 'The adris.tech blog', url: canonical,
      description: 'Notes on building adris.tech — local-first AI, research, product and founder life.',
      blogPost: indexOrder.slice(0, 20).map((p) => ({
        '@type': 'BlogPosting', headline: p.title, url: `${SITE}/blog/${p.slug}`,
        datePublished: p.date, description: p.excerpt || '',
      })),
    };
    head = `<title>Blog — local-first AI, product and founder life | adris.tech</title>
<meta name="description" content="Notes from the team building adris.tech — local-first AI, research worth keeping, product decisions, and the honest ups and downs of founding." />
<meta name="robots" content="index, follow" />
<meta property="og:type" content="website" />
<meta property="og:title" content="The adris.tech blog" />
<meta property="og:description" content="Notes on local-first AI, research, product and founder life." />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${SITE}/og-cover.png" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${JSON.stringify(ld)}</script>`;

    const cards = indexOrder.length ? indexOrder.map((p, i) => `
      <a class="post-card${i === 0 ? ' feature' : ''}" href="/blog/${esc(p.slug)}">
        ${i === 0 && p.poster ? `<div class="post-card-img"><img src="${esc(p.poster)}" alt="" loading="lazy" decoding="async" /></div>` : ''}
        <div class="post-card-body">
          <div class="post-meta"><span class="post-tag">${esc(p.tag || 'Notes')}</span><span>${niceDate(p.date)}</span><span>${readTime(p.body)} min read</span></div>
          <h2>${esc(p.title)}</h2>
          <p>${esc(p.excerpt || '')}</p>
          <span class="post-card-go">Read${p.video ? ' &amp; watch' : ''} &rarr;</span>
        </div>
      </a>`).join('\n')
      : '<p class="post-empty">Nothing published yet. The first post is being written.</p>';

    main = `<div class="hiw-hero">
  <a href="/" class="hiw-back"><svg width="12" height="12" viewBox="0 0 10 10" fill="none"><path d="M9 1L1 9M1 9H8M1 9V2" stroke="currentColor" stroke-width="1.5" fill="none"/></svg> adris.tech</a>
  <h1>The <em>blog.</em></h1>
  <p class="hiw-hero-sub">What we are building, what we found out, and what it is actually like — local-first AI, research worth writing down, and the parts of founding a company nobody puts on a landing page.</p>
</div>
<div class="post-list">
${cards}
</div>`;
  }

  const html = template
    .replace('<!--HEAD-->', head)
    .replace('<!--CANONICAL-->', `<link rel="canonical" href="${canonical}" />`)
    .replace('<!--MAIN-->', main);

  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Short enough that a new post appears promptly, long enough that the CDN
      // absorbs a burst from a shared link.
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
