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

// Mirrors frontend/src/lib/linuxApps.ts — same ids, same commands. Kept as an explicit allow-list
// so /launch can never be talked into running something arbitrary.
const ALLOWED = {
  writer:   { name: 'LibreOffice Writer',  cmd: 'libreoffice', args: ['--writer'],  probe: 'libreoffice' },
  calc:     { name: 'LibreOffice Calc',    cmd: 'libreoffice', args: ['--calc'],    probe: 'libreoffice' },
  impress:  { name: 'LibreOffice Impress', cmd: 'libreoffice', args: ['--impress'], probe: 'libreoffice' },
  files:    { name: 'Files',               cmd: 'nautilus',    args: ['--new-window'], probe: 'nautilus' },
  text:     { name: 'Text Editor',         cmd: 'gedit',       args: [],            probe: 'gedit' },
  terminal: { name: 'Terminal',            cmd: 'xterm',       args: [],            probe: 'xterm' },
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

  json(res, 404, { ok: false, error: 'Not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  const gui = process.env.DISPLAY || process.env.WAYLAND_DISPLAY;
  console.log(`adris OS agent bridge — http://localhost:${PORT}`);
  console.log(`  display: ${gui || 'NONE (GUI apps cannot open)'}`);
  console.log(`  token for /run: ${TOKEN}`);
});
