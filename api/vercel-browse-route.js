/**
 * FILE: pages/api/models/browse.js  (place in your krew Next.js project)
 *
 * Proxies the open model catalogue server-side so no third-party URL
 * ever appears in the browser network tab. Returns clean adris.tech-branded JSON.
 *
 * GET /api/models/browse?page=0&q=mistral&sort=downloads
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).end();

  const page  = Math.max(0, parseInt(req.query.page) || 0);
  const limit = 30;
  const skip  = page * limit;
  const q     = (req.query.q || '').toLowerCase().trim();
  const sort  = req.query.sort === 'newest' ? 'lastModified' : 'downloads';

  // Tags that reveal the source — strip these entirely from every response
  const HIDDEN_TAGS = new Set([
    'gguf', 'transformers', 'pytorch', 'safetensors', 'text-generation',
    'fill-mask', 'feature-extraction', 'endpoints_compatible', 'has_space',
    'region:us', 'autotrain_compatible',
  ]);

  try {
    const searchParam = q ? `&search=${encodeURIComponent(q)}` : '';
    const upstream = await fetch(
      `https://huggingface.co/api/models?filter=gguf&sort=${sort}&limit=${limit}&skip=${skip}&full=true${searchParam}`,
      { headers: { 'User-Agent': 'adris.techModelsAPI/1.0' } }
    );

    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
    const raw = await upstream.json();

    const models = raw
      .map(m => {
        // ── Name: strip uploader prefix + GGUF suffix, humanise ────────────
        const rawName = (m.modelId || '').split('/').pop() || '';
        const name = rawName
          .replace(/[-_]?GGUF$/i, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b([a-z])/g, c => c.toUpperCase())
          .trim();

        // ── Size: pick the Q4_K_M file first, fall back to any .gguf ────────
        const siblings = m.siblings || [];
        const q4  = siblings.find(s => /Q4_K_M/i.test(s.rfilename || ''));
        const any = siblings.find(s => /\.gguf$/i.test(s.rfilename || ''));
        const file = q4 || any;
        const sizeGb = file?.size
          ? Math.round(file.size / 1_073_741_824 * 10) / 10
          : null;

        // ── Tags: keep only short, useful, source-neutral ones ──────────────
        const tags = (m.tags || [])
          .filter(t =>
            !HIDDEN_TAGS.has(t) &&
            !t.startsWith('doi:') &&
            !t.startsWith('arxiv:') &&
            !t.startsWith('base_model:') &&
            !t.includes('/') &&          // strips "TheBloke/..." type tags
            t.length <= 24
          )
          .slice(0, 6);

        // ── Stable ID: derived from model name only (no uploader) ───────────
        const stableId = rawName
          .replace(/[-_]?GGUF$/i, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        return {
          id:        stableId,
          name:      name || stableId,
          params:    extractParams(rawName),   // "7B", "13B", "70B" etc.
          size_gb:   sizeGb,
          downloads: m.downloads || 0,
          likes:     m.likes || 0,
          tags:      tags,
          updated:   m.lastModified ? m.lastModified.slice(0, 10) : null,
          gated:     !!m.gated,
          filename:  file?.rfilename || null,
        };
      })
      // Filter out models with no usable file or absurdly large files
      .filter(m => m.size_gb !== null && m.size_gb < 100);

    res.status(200).json({
      models,
      page,
      has_more: raw.length === limit,
      total_hint: models.length,
    });
  } catch (err) {
    console.error('[models/browse]', err.message);
    res.status(500).json({ error: 'Could not load model catalogue. Try again shortly.' });
  }
}

// ── Helper: pull "7B", "13B", "70B" from model name ──────────────────────────
function extractParams(name) {
  const match = name.match(/[-_](\d+(?:\.\d+)?)[Bb](?:[-_]|$)/);
  if (match) return match[1] + 'B';
  const moe = name.match(/(\d+)x(\d+)[Bb]/);
  if (moe) return `${moe[1]}×${moe[2]}B MoE`;
  return null;
}
