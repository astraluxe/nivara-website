// ─── Install a GitHub project with one click ─────────────────────────────────
//
// THE IDEA THIS EXISTS FOR. Thousands of genuinely good, genuinely free tools live on GitHub
// behind a README that opens with "clone the repo and run make". For a developer that is nothing.
// For the person adris OS is built for it is a wall, and it is the reason they end up paying for
// worse software. If clicking a GitHub project installs it the way clicking an App Store entry
// does, that whole catalogue becomes available to people it was never reachable by.
//
// HOW IT WORKS: look at what the repo actually ships, in order of how reliable each route is.
//
//   1. A prebuilt .deb on the Releases page   → the best case. Install it, done.
//   2. An AppImage on Releases                → download, mark executable, register it. No build.
//   3. The same name already in apt           → let the distribution do it; it is packaged and
//                                               maintained, which beats anything we assemble.
//   4. A Flatpak                              → also packaged and sandboxed.
//   5. Nothing installable                    → SAY SO. Do not clone a source tree, run an
//                                               unattended build, and leave a half-finished
//                                               directory behind. A clear "this one needs a
//                                               developer" is a better outcome than a silent mess.
//
// WHAT THIS DELIBERATELY DOES NOT DO: run arbitrary build scripts, or `curl | sh` an install
// script. Both are how a one-click installer becomes a way to own the machine. Routes 1–4 all
// install artefacts the project itself published, which is the same trust model as any app store —
// and even that is only acceptable because plan.md §12c's sandbox is coming. Until it lands, this
// is gated behind an explicit catalogue entry rather than accepting any URL.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

const UA = { 'user-agent': 'adris-os', accept: 'application/vnd.github+json' };

/** owner/repo out of a GitHub URL. */
export function parseRepo(url) {
  const m = String(url || '').match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!m) return null;
  return { owner: m[1], repo: m[2].replace(/\.git$/, '') };
}

async function latestRelease(owner, repo) {
  const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, { headers: UA });
  if (!r.ok) return null;
  return await r.json();
}

// ARCHITECTURE, and why the hyphens matter.
//
// First live test picked "LocalSend-1.18.2-linux-arm-64.deb" on an x86-64 machine — because the
// naive pattern /arm64/ does not match "arm-64". Installing that produces a package that cannot
// run, which is precisely the silent-wrong-result this project keeps trying to avoid. Separators
// are optional everywhere now, and the rule is inverted: an asset must POSITIVELY look like this
// machine's architecture, rather than merely failing to look like another one. Unlabelled assets
// are still accepted, since plenty of projects ship one build with no arch in the name at all.
const ARCH_OK  = /(amd[-_]?64|x86[-_]?64|x64)/i;
const ARCH_BAD = /(arm[-_]?64|aarch[-_]?64|armv?7|armhf|i[36]86|riscv|ppc64|s390x|darwin|macos|windows|\.exe$|\.dmg$)/i;

/** Pick the asset that suits THIS machine: right arch, or no arch stated at all. */
function forThisMachine(assets, ext) {
  const matching = assets.filter((a) => ext.test(a.name));
  return matching.find((a) => ARCH_OK.test(a.name))
      ?? matching.find((a) => !ARCH_BAD.test(a.name))
      ?? null;
}

/**
 * Work out how this project can be installed, without installing anything.
 *
 * Separate from doing it so the UI can tell someone what is about to happen — an installer that
 * explains itself first is the difference between trust and a progress bar you have to believe.
 */
export async function plan(repoUrl) {
  const p = parseRepo(repoUrl);
  if (!p) return { ok: false, error: 'That is not a GitHub URL.' };
  const { owner, repo } = p;

  // 3 & 4 first when the name matches something already packaged — a maintained package beats a
  // release artefact every time, because it gets security updates with everything else.
  const aptName = repo.toLowerCase();
  try {
    const { stdout } = await run('bash', ['-lc', `apt-cache policy ${aptName} 2>/dev/null | head -2`]);
    if (/Candidate:\s*\S+/.test(stdout) && !/Candidate:\s*\(none\)/.test(stdout)) {
      return { ok: true, method: 'apt', pkg: aptName, why: `${repo} is in Ubuntu's own package list, which is the most reliable way to install it.` };
    }
  } catch { /* apt-cache missing or offline — fall through */ }

  const rel = await latestRelease(owner, repo).catch(() => null);
  if (rel && Array.isArray(rel.assets)) {
    const assets = rel.assets;

    const deb = forThisMachine(assets, /\.deb$/i);
    if (deb) {
      return { ok: true, method: 'deb', url: deb.browser_download_url, file: deb.name,
               why: `${repo} publishes a ready-made Ubuntu package (${deb.name}).` };
    }

    const appimage = forThisMachine(assets, /\.appimage$/i);
    if (appimage) {
      return { ok: true, method: 'appimage', url: appimage.browser_download_url, file: appimage.name,
               why: `${repo} publishes an AppImage — a single file that runs without installing.` };
    }
  }

  return {
    ok: false,
    error: `${repo} does not publish a ready-to-install build for Linux. It would need to be compiled from source, which adris OS deliberately will not do unattended.`,
  };
}

/** Carry out a plan from plan(). Returns what actually happened. */
export async function install(repoUrl, onLog = () => {}) {
  const p = await plan(repoUrl);
  if (!p.ok) return p;

  const asRoot = process.getuid && process.getuid() === 0;
  const sudo = asRoot ? '' : 'sudo -n ';

  try {
    if (p.method === 'apt') {
      onLog(`Installing ${p.pkg} from Ubuntu's package list…`);
      await run('bash', ['-lc', `${sudo}DEBIAN_FRONTEND=noninteractive apt-get install -y ${p.pkg}`],
                { timeout: 20 * 60000, maxBuffer: 8 << 20 });
      return { ok: true, method: 'apt', name: p.pkg };
    }

    if (p.method === 'deb') {
      const tmp = `/tmp/adris-${Date.now()}.deb`;
      onLog(`Downloading ${p.file}…`);
      await run('bash', ['-lc', `curl -fsSL -o ${tmp} '${p.url}'`], { timeout: 15 * 60000 });
      onLog('Installing…');
      // `apt-get install ./file.deb` (not dpkg -i) so dependencies are resolved rather than left
      // broken — the classic way a .deb install half-succeeds.
      await run('bash', ['-lc', `${sudo}DEBIAN_FRONTEND=noninteractive apt-get install -y ${tmp}`],
                { timeout: 20 * 60000, maxBuffer: 8 << 20 });
      await run('bash', ['-lc', `rm -f ${tmp}`]).catch(() => {});
      return { ok: true, method: 'deb', name: p.file };
    }

    if (p.method === 'appimage') {
      const dir = `${process.env.HOME}/Applications`;
      const dest = `${dir}/${p.file}`;
      onLog(`Downloading ${p.file}…`);
      await run('bash', ['-lc', `mkdir -p ${dir} && curl -fsSL -o '${dest}' '${p.url}' && chmod +x '${dest}'`],
                { timeout: 15 * 60000 });
      return { ok: true, method: 'appimage', name: p.file, path: dest };
    }
  } catch (e) {
    const msg = String(e.stderr || e.message || e);
    if (/sudo:.*password|NEEDS_ROOT|a password is required/i.test(msg)) {
      return { ok: false, error: 'That needs administrator rights. Start the bridge as root, or install it from a terminal.' };
    }
    return { ok: false, error: `Install failed: ${msg.slice(-400)}` };
  }

  return { ok: false, error: 'Nothing to do.' };
}
