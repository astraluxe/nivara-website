/* Regenerates sitemap.xml from vercel.json's rewrites + posts.json.
   Run after adding a page or a post:  node build-sitemap.mjs
   Kept as a script rather than a hand-maintained file, because a sitemap that
   lies about what exists is worse than not having one. */
import fs from 'fs';

const SITE = 'https://www.adris.tech';
// Priority says which pages matter most to us, not to Google — it is a hint.
const PRIORITY = {
  '/': '1.0',
  '/download': '0.9', '/pricing': '0.9',
  '/contract-review-software': '0.9', '/local-ai-desktop': '0.9', '/zapier-alternative': '0.9',
  '/private-llm-runner': '0.9', '/offline-automation-tool': '0.9', '/ai-agents-for-business': '0.9',
  '/blog': '0.8', '/how-it-works': '0.8', '/why-adris': '0.8', '/models': '0.8',
};
// Never in a sitemap: private surfaces, and anything behind a sign-in.
const SKIP = /^\/(admin|team-dashboard|affiliate-dashboard|signin|join|dl|api|classic|modules\/krew-chat)/;

const v = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const urls = new Set(['/']);
for (const r of v.rewrites) {
  if (r.source.includes(':') || SKIP.test(r.source)) continue;
  urls.add(r.source);
}

let posts = [];
try { posts = (JSON.parse(fs.readFileSync('posts.json', 'utf8')).posts || []).filter((p) => p && p.slug && !p.draft); }
catch { /* no posts yet */ }

const today = new Date().toISOString().slice(0, 10);
const entry = (loc, lastmod, priority, freq) =>
  `  <url>\n    <loc>${SITE}${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n` +
  `    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

const body = [
  ...[...urls].sort().map((u) => entry(u, today, PRIORITY[u] || '0.7', u === '/' ? 'weekly' : 'monthly')),
  ...posts.map((p) => entry(`/blog/${p.slug}`, (p.date || today).slice(0, 10), '0.7', 'yearly')),
].join('\n');

fs.writeFileSync('sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
    .replace('www.sitemap.org', 'www.sitemaps.org'));
console.log(`sitemap.xml: ${urls.size} pages + ${posts.length} posts`);
