// ─── Serving the installer from a host that is actually reachable ────────────
//
// GitHub hands every release asset off to release-assets.githubusercontent.com, and on a real
// Indian ISP that host resolves and accepts a TCP connection on 443 and then never completes the
// TLS handshake — SNI-based filtering. Measured, not assumed: github.com answers the download URL
// with a 302 in 0.8s, and following that 302 downloads 0 bytes and hangs. So the updater showed
// "Update available — v1.29.0" (it had read latest.json from this domain, which IS reachable) and
// then died with "error sending request for url …/adris.tech_1.29.0_x64-setup.exe".
//
// latest.json was already mirrored here for exactly that reason. The installer was not, because a
// 24 MB binary per release does not belong in a website repo. This is the third option: Vercel
// fetches the asset from GitHub — its servers are nowhere near the filtering — and streams the
// bytes back from adris.tech, which the user's machine can reach. Nothing is stored, so the repo
// stays small and every future release works without another step.
//
// SAFETY: the updater verifies the Tauri signature in latest.json against the bytes it downloads.
// A proxy cannot make a tampered installer pass that check, and the allow-list below means this
// endpoint can only ever fetch a release asset from this one repository.
export const config = { runtime: 'edge' };

const REPO = 'astraluxe/nivara-desktop';

/**
 * The asset names we will fetch. Deliberately a shape, not a list: every release adds new
 * filenames and nobody will remember to come back here. But it is still narrow enough that this
 * endpoint cannot be turned into an open proxy — no slashes, no traversal, known extensions only.
 */
const ASSET = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}\.(exe|sig|json|dmg|deb|AppImage|zip|msi|tar\.gz)$/;
/** "latest", or a plain semver tag with or without the leading v. */
const TAG = /^(latest|v?\d{1,3}\.\d{1,3}\.\d{1,4})$/;

export default async function handler(req) {
  const url = new URL(req.url);
  // /dl/<file>  →  rewritten to /api/dl?file=<file>. ?v= picks the release; default is latest.
  const file = (url.searchParams.get('file') || '').trim();
  const rawTag = (url.searchParams.get('v') || 'latest').trim();

  if (!ASSET.test(file)) {
    return new Response('Unknown file.', { status: 400, headers: { 'cache-control': 'no-store' } });
  }
  if (!TAG.test(rawTag)) {
    return new Response('Unknown version.', { status: 400, headers: { 'cache-control': 'no-store' } });
  }
  const tag = rawTag === 'latest' ? 'latest' : (rawTag.startsWith('v') ? rawTag : `v${rawTag}`);
  const target = tag === 'latest'
    ? `https://github.com/${REPO}/releases/latest/download/${file}`
    : `https://github.com/${REPO}/releases/download/${tag}/${file}`;

  // Pass Range through so a resumed or partial download still works, and so the updater can probe
  // the size without pulling the whole 24 MB.
  const range = req.headers.get('range');
  let upstream;
  try {
    upstream = await fetch(target, {
      redirect: 'follow',           // the hop to the blocked asset host happens HERE, not on the user's machine
      headers: {
        ...(range ? { range } : {}),
        'user-agent': 'adris.tech-updater-proxy',
        accept: '*/*',
      },
    });
  } catch (e) {
    return new Response(`Could not reach the release host: ${e instanceof Error ? e.message : String(e)}`,
      { status: 502, headers: { 'cache-control': 'no-store' } });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(`Release asset not found (${upstream.status}).`,
      { status: upstream.status === 404 ? 404 : 502, headers: { 'cache-control': 'no-store' } });
  }

  const headers = new Headers();
  headers.set('content-type', upstream.headers.get('content-type') || 'application/octet-stream');
  const len = upstream.headers.get('content-length');
  if (len) headers.set('content-length', len);
  const cr = upstream.headers.get('content-range');
  if (cr) headers.set('content-range', cr);
  headers.set('accept-ranges', 'bytes');
  headers.set('content-disposition', `attachment; filename="${file}"`);
  // A released asset never changes, so it is safe to cache hard at the edge — the second person on
  // the same release does not pay for the round trip to GitHub. "latest" is deliberately shorter:
  // it points at a different file the moment a release ships.
  //
  // BUT A PARTIAL RESPONSE MUST NEVER BE CACHED. The edge keys its cache on the URL, and a 206
  // stored under that key is then handed to everyone who asks for the WHOLE file. Reproduced
  // against production: one `curl -r 0-1048575` on the installer URL, and the very next full
  // download of the same URL came back 206 with 1 MB instead of 200 with 25 MB. A truncated
  // installer fails the updater's signature check, and anyone who saved it by hand would be
  // running a corrupt file — so this is a correctness bug, not a performance one.
  //
  // A browser resuming a download, a download manager, or an updater retrying is enough to poison
  // it. `vary` is set for caches that honour it; the no-store on 206 is what actually protects us.
  const partial = upstream.status === 206 || !!range;
  headers.set('cache-control', partial
    ? 'private, no-store'
    : tag === 'latest'
      ? 'public, max-age=300, s-maxage=300'
      : 'public, max-age=31536000, s-maxage=31536000, immutable');
  headers.set('vary', 'range');
  headers.set('access-control-allow-origin', '*');

  return new Response(upstream.body, { status: upstream.status, headers });
}
