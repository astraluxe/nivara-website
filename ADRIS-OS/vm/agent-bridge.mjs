// ─── The bridge between the adris OS shell and the real Linux underneath ─────
//
// The shell is a web UI. Real applications — LibreOffice, Files, a terminal — are ordinary Linux
// processes. This is the small local server that connects the two: the dock POSTs an app id, this
// spawns the actual command inside the VM, and the window appears (via WSLg, or on the VM's own
// display when running on a real Ubuntu desktop).
//
// This is also, deliberately, the exact surface an AGENT would use. plan.md's "agents use the
// software rather than us coding everything" means an agent calls /launch and /run the same way
// the dock does — one bridge, two callers. That's why /run exists at all: the dock only needs
// /launch, but an agent driving LibreOffice to build a .docx needs to run a real command.
//
// SECURITY, stated plainly: this binds to 0.0.0.0 so the Windows host can reach it through WSL's
// port forwarding, and /run executes commands. That is only acceptable because it lives inside a
// throwaway development VM. It must NEVER ship as-is on a real adris OS install — the real thing
// is the Rust system layer from plan.md §11, with the permission model that section describes.
// Allow-listing on /launch is enforced regardless (see ALLOWED); /run is the unrestricted one and
// is guarded by a token.

import { createServer } from 'node:http';
import { spawn, execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const PORT = 7717;

// Mirrors frontend/src/lib/catalogue.ts (kind:'app' entries). An explicit allow-list, so /launch
// and /install can never be talked into running something arbitrary — that is what the token-gated
// /run is for, and it is named as dev-only.
const ALLOWED = {
  files:       { name: 'Files',              cmd: 'nautilus',         args: ['--new-window'], probe: 'nautilus',         pkg: 'nautilus' },
  writer:      { name: 'LibreOffice Writer', cmd: 'libreoffice',      args: ['--writer'],     probe: 'libreoffice',      pkg: 'libreoffice-writer' },
  calc:        { name: 'LibreOffice Calc',   cmd: 'libreoffice',      args: ['--calc'],       probe: 'libreoffice',      pkg: 'libreoffice-calc' },
  impress:     { name: 'LibreOffice Impress',cmd: 'libreoffice',      args: ['--impress'],    probe: 'libreoffice',      pkg: 'libreoffice-impress' },
  draw:        { name: 'LibreOffice Draw',   cmd: 'libreoffice',      args: ['--draw'],       probe: 'libreoffice',      pkg: 'libreoffice-draw' },
  text:        { name: 'Text Editor',        cmd: 'gedit',            args: [],               probe: 'gedit',            pkg: 'gedit' },
  evince:      { name: 'PDF Viewer',         cmd: 'evince',           args: [],               probe: 'evince',           pkg: 'evince' },
  calendar:    { name: 'Calendar',           cmd: 'gnome-calendar',   args: [],               probe: 'gnome-calendar',   pkg: 'gnome-calendar' },
  browser:     { name: 'Web Browser',        cmd: 'epiphany-browser', args: [],               probe: 'epiphany-browser', pkg: 'epiphany-browser' },
  thunderbird: { name: 'Email',              cmd: 'thunderbird',      args: [],               probe: 'thunderbird',      pkg: 'thunderbird' },
  transmission:{ name: 'Downloads',          cmd: 'transmission-gtk', args: [],               probe: 'transmission-gtk', pkg: 'transmission-gtk' },
  vlc:         { name: 'Video Player',       cmd: 'vlc',              args: [],               probe: 'vlc',              pkg: 'vlc' },
  rhythmbox:   { name: 'Music',              cmd: 'rhythmbox',        args: [],               probe: 'rhythmbox',        pkg: 'rhythmbox' },
  cheese:      { name: 'Camera',             cmd: 'cheese',           args: [],               probe: 'cheese',           pkg: 'cheese' },
  shotwell:    { name: 'Photos',             cmd: 'shotwell',         args: [],               probe: 'shotwell',         pkg: 'shotwell' },
  gimp:        { name: 'Image Editor',       cmd: 'gimp',             args: [],               probe: 'gimp',             pkg: 'gimp' },
  inkscape:    { name: 'Vector Design',      cmd: 'inkscape',         args: [],               probe: 'inkscape',         pkg: 'inkscape' },
  terminal:    { name: 'Terminal',           cmd: 'xterm',            args: [],               probe: 'xterm',            pkg: 'xterm' },
  monitor:     { name: 'System Monitor',     cmd: 'gnome-system-monitor', args: [],           probe: 'gnome-system-monitor', pkg: 'gnome-system-monitor' },
  disks:       { name: 'Disks',              cmd: 'gnome-disks',      args: [],               probe: 'gnome-disks',      pkg: 'gnome-disk-utility' },
  archive:     { name: 'Archive Manager',    cmd: 'file-roller',      args: [],               probe: 'file-roller',      pkg: 'file-roller' },
  calculator:  { name: 'Calculator',         cmd: 'gnome-calculator', args: [],               probe: 'gnome-calculator', pkg: 'gnome-calculator' },
  gparted:     { name: 'Partitions',         cmd: 'gparted',          args: [],               probe: 'gparted',          pkg: 'gparted' },
  python:      { name: 'Python',             cmd: 'xterm',            args: ['-e', 'python3'], probe: 'python3',         pkg: 'python3' },
};

// Printed on startup; /run requires it. Keeps a stray page on the network from executing commands.
const TOKEN = process.env.ADRIS_BRIDGE_TOKEN || randomUUID();

function json(res, code, body) {
  const payload = JSON.stringify(body);
  res.writeHead(code, {
    'content-type': 'application/json',
    // The UI is served from :5173 and this is :7717 — different origins, so CORS is required for
    // the dock to talk to it at all.
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type, x-adris-token',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
  });
  res.end(payload);
}

function which(bin) {
  return new Promise((resolve) => {
    execFile('which', [bin], (err, stdout) => resolve(!err && !!stdout.trim()));
  });
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString() || '{}'); } catch { return {}; }
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});

  // GET /apps — which of the allow-listed apps are actually installed. Lets the UI tell the truth
  // about what's available instead of offering a button that can only fail.
  if (req.method === 'GET' && req.url === '/apps') {
    const out = {};
    for (const [id, a] of Object.entries(ALLOWED)) out[id] = await which(a.probe);
    return json(res, 200, out);
  }

  // GET /health — is the bridge alive, and does it have a display to open windows on?
  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, {
      ok: true,
      display: process.env.DISPLAY || null,
      wayland: process.env.WAYLAND_DISPLAY || null,
      hasGui: !!(process.env.DISPLAY || process.env.WAYLAND_DISPLAY),
    });
  }

  // POST /launch {id} — start one allow-listed application.
  if (req.method === 'POST' && req.url === '/launch') {
    const { id } = await readBody(req);
    const app = ALLOWED[id];
    if (!app) return json(res, 400, { ok: false, error: `Unknown app: ${id}` });
    if (!(await which(app.probe))) {
      return json(res, 404, { ok: false, error: `${app.name} isn't installed in the VM yet — run vm/setup-desktop.sh` });
    }
    if (!(process.env.DISPLAY || process.env.WAYLAND_DISPLAY)) {
      return json(res, 500, { ok: false, error: `No display available, so ${app.name} has nowhere to open. Start the bridge from inside a WSLg/desktop session.` });
    }
    try {
      // Detached so the app outlives this request — closing the bridge shouldn't kill the user's
      // open documents.
      const child = spawn(app.cmd, app.args, { detached: true, stdio: 'ignore' });
      child.unref();
      console.log(`[launch] ${app.name} (${app.cmd} ${app.args.join(' ')}) pid=${child.pid}`);
      return json(res, 200, { ok: true, pid: child.pid });
    } catch (e) {
      return json(res, 500, { ok: false, error: `Failed to start ${app.name}: ${e.message}` });
    }
  }

  // POST /run {cmd, args[]} — the agent-facing escape hatch. Token-gated; see the header comment.
  if (req.method === 'POST' && req.url === '/run') {
    if (req.headers['x-adris-token'] !== TOKEN) {
      return json(res, 401, { ok: false, error: 'Bad or missing x-adris-token' });
    }
    const { cmd, args = [] } = await readBody(req);
    if (typeof cmd !== 'string' || !cmd) return json(res, 400, { ok: false, error: 'cmd required' });
    execFile(cmd, Array.isArray(args) ? args : [], { timeout: 60_000, maxBuffer: 4 << 20 }, (err, stdout, stderr) => {
      json(res, 200, { ok: !err, stdout: String(stdout), stderr: String(stderr), error: err ? err.message : null });
    });
    return;
  }

  // POST /install {id} — install one allow-listed application.
  //
  // "Let people install software" is a real requirement, and this is the honest version: only
  // packages this OS already knows about, installed with the distribution's own package manager,
  // reporting what actually happened. Arbitrary-URL installation is the app-store thread in
  // plan.md and needs the sandbox first — deliberately NOT here.
  if (req.method === 'POST' && req.url === '/install') {
    const { id } = await readBody(req);
    const app = ALLOWED[id];
    if (!app) return json(res, 400, { ok: false, error: `Unknown app: ${id}` });
    if (await which(app.probe)) return json(res, 200, { ok: true, already: true });

    // Installing needs root. The bridge runs as the user, so this tries the privilege paths that
    // exist and says plainly when there is none — rather than hanging forever on a sudo prompt
    // nobody can answer, which is a trap this project already fell into once.
    const script = [
      'if [ "$(id -u)" = "0" ]; then',
      `  DEBIAN_FRONTEND=noninteractive apt-get install -y ${app.pkg};`,
      'elif sudo -n true 2>/dev/null; then',
      `  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${app.pkg};`,
      'else',
      '  echo NEEDS_ROOT >&2; exit 90;',
      'fi',
    ].join(' ');

    execFile('bash', ['-lc', script], { timeout: 20 * 60000, maxBuffer: 8 << 20 }, (err, _out, stderr) => {
      if (err && /NEEDS_ROOT/.test(String(stderr))) {
        return json(res, 200, {
          ok: false,
          needsRoot: true,
          error: `${app.name} needs administrator rights. Run: wsl -d Ubuntu -u root -e apt-get install -y ${app.pkg}`,
        });
      }
      json(res, 200, {
        ok: !err,
        error: err ? `Could not install ${app.name}: ${String(stderr).slice(-400)}` : null,
      });
    });
    return;
  }

  // GET /system — REAL battery, memory and disk, for widgets that currently show fixed numbers.
  if (req.method === 'GET' && req.url === '/system') {
    const probe = [
      'BATP=""; BATS="";',
      'for b in /sys/class/power_supply/BAT*; do',
      '  if [ -r "$b/capacity" ]; then BATP=$(cat "$b/capacity"); BATS=$(cat "$b/status" 2>/dev/null); break; fi',
      'done;',
      'echo "battery=$BATP";',
      'echo "batteryState=$BATS";',
      'echo "memTotal=$(awk \'/MemTotal/{print $2}\' /proc/meminfo)";',
      'echo "memAvail=$(awk \'/MemAvailable/{print $2}\' /proc/meminfo)";',
      'echo "disk=$(df -P / | awk \'NR==2{print $5}\' | tr -d %)";',
      'echo "uptime=$(cut -d. -f1 /proc/uptime)";',
      'echo "cpus=$(nproc)";',
    ].join(' ');

    execFile('bash', ['-lc', probe], { timeout: 8000 }, (err, stdout) => {
      if (err) return json(res, 200, { ok: false });
      const kv = {};
      for (const line of String(stdout).split('\n')) {
        const i = line.indexOf('=');
        if (i > 0) kv[line.slice(0, i)] = line.slice(i + 1).trim();
      }
      const memTotal = Number(kv.memTotal || 0);
      const memAvail = Number(kv.memAvail || 0);
      json(res, 200, {
        ok: true,
        // null rather than a made-up number: a VM usually has no battery, and inventing 62% is the
        // same category of lie as claiming an app launched when it crashed.
        battery: kv.battery ? Number(kv.battery) : null,
        batteryState: kv.batteryState || null,
        memoryUsedPct: memTotal ? Math.round(((memTotal - memAvail) / memTotal) * 100) : null,
        diskUsedPct: kv.disk ? Number(kv.disk) : null,
        uptimeSec: kv.uptime ? Number(kv.uptime) : null,
        cpus: kv.cpus ? Number(kv.cpus) : null,
      });
    });
    return;
  }

  json(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  const gui = process.env.DISPLAY || process.env.WAYLAND_DISPLAY;
  console.log(`adris OS agent bridge — http://localhost:${PORT}`);
  console.log(`  display: ${gui || 'NONE (GUI apps cannot open)'}`);
  console.log(`  token for /run: ${TOKEN}`);
});
