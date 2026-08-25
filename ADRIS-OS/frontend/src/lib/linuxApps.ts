// ─── The real Linux applications adris OS ships with ─────────────────────────
//
// This is the concrete form of plan.md's "we don't reimplement a word processor." Every entry is
// an ordinary Ubuntu application that comes from the distribution — the same binary any Ubuntu
// user has. adris OS launches them; it does not replace them. The agent story is the same:
// "agents use the software" means agents run THESE, not that we rebuild each one.

export interface LinuxApp {
  id: string;
  name: string;
  /** The actual command run inside the VM. Shown in the dock tooltip, so nothing is hidden. */
  exec: string;
  icon: string;
  /** apt package that provides it — used by vm/setup-desktop.sh to install the set. */
  pkg: string;
}

export const LINUX_APPS: LinuxApp[] = [
  { id: 'writer',   name: 'LibreOffice Writer',  exec: 'libreoffice --writer',  icon: '📝', pkg: 'libreoffice-writer' },
  { id: 'calc',     name: 'LibreOffice Calc',    exec: 'libreoffice --calc',    icon: '📊', pkg: 'libreoffice-calc' },
  { id: 'impress',  name: 'LibreOffice Impress', exec: 'libreoffice --impress', icon: '📽️', pkg: 'libreoffice-impress' },
  { id: 'files',    name: 'Files',               exec: 'nautilus --new-window', icon: '📁', pkg: 'nautilus' },
  { id: 'text',     name: 'Text Editor',         exec: 'gedit',                 icon: '📄', pkg: 'gedit' },
  { id: 'terminal', name: 'Terminal',            exec: 'xterm',                 icon: '⌨️', pkg: 'xterm' },
];

export const APP_BY_ID = Object.fromEntries(LINUX_APPS.map((a) => [a.id, a])) as Record<string, LinuxApp>;

/** Where the agent bridge listens. Same host the UI is served from, fixed port. */
const BRIDGE = `http://${location.hostname}:7717`;

/**
 * Ask the bridge to launch a real application inside the VM.
 *
 * Deliberately honest about the failure case: if the bridge isn't reachable (someone opened this
 * page in a plain browser with no VM behind it), say exactly that rather than letting a click look
 * like it worked. A dock that silently does nothing is the worst possible version of this.
 */
export async function launchApp(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const app = APP_BY_ID[id];
  if (!app) return { ok: false, error: `No such app: ${id}` };
  try {
    const r = await fetch(`${BRIDGE}/launch`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = (await r.json()) as { ok?: boolean; error?: string };
    if (!r.ok || !data.ok) return { ok: false, error: data.error || `${app.name} failed to start` };
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: `Can't reach the VM's app bridge — ${app.name} not started. Run vm/agent-bridge.mjs inside the VM.`,
    };
  }
}

/** What the bridge reports as installed — so the UI can grey out what genuinely isn't there. */
export async function installedApps(): Promise<Record<string, boolean> | null> {
  try {
    const r = await fetch(`${BRIDGE}/apps`);
    if (!r.ok) return null;
    return (await r.json()) as Record<string, boolean>;
  } catch {
    return null;
  }
}
