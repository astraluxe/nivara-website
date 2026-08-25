// ─── Talking to the real Linux underneath ────────────────────────────────────
//
// The catalogue (what exists) lives in catalogue.ts. This file is only the wire: launching,
// installing, and asking what is actually there. Keeping them apart matters because the catalogue
// is edited constantly as apps are added, and this half almost never changes.

export { CATALOGUE, BY_ID, PINNED, BASE_APPS, CATEGORIES, iconFor } from './catalogue';
export type { CatalogueApp, AppCategory, AppKind } from './catalogue';

/** Where the agent bridge listens. Same host the UI is served from, fixed port. */
const BRIDGE = `http://${location.hostname}:7717`;

export interface SystemStats {
  ok: boolean;
  /** null when the machine genuinely has no battery — never a made-up number. */
  battery: number | null;
  batteryState: string | null;
  memoryUsedPct: number | null;
  diskUsedPct: number | null;
  uptimeSec: number | null;
  cpus: number | null;
}

/**
 * Launch a real application inside the VM.
 *
 * Deliberately honest about failure: if the bridge isn't reachable (someone opened this page in a
 * plain browser with no VM behind it), say exactly that rather than letting a click look like it
 * worked. A dock that silently does nothing is the worst possible version of this.
 */
export async function launchApp(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const r = await fetch(`${BRIDGE}/launch`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = (await r.json()) as { ok?: boolean; error?: string };
    if (!r.ok || !data.ok) return { ok: false, error: data.error || 'It did not start.' };
    return { ok: true };
  } catch {
    return { ok: false, error: `Can't reach the VM's app bridge — nothing was started. Run vm/agent-bridge.mjs inside the VM.` };
  }
}

/**
 * Install an application the OS already knows about.
 *
 * Only catalogue entries, only through the distribution's own package manager. Installing anything
 * from any URL is the app-store thread in plan.md and needs the sandbox first — this is the part
 * that can be done safely today.
 */
export async function installApp(id: string): Promise<{ ok: true; already?: boolean } | { ok: false; error: string }> {
  try {
    const r = await fetch(`${BRIDGE}/install`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    const data = (await r.json()) as { ok?: boolean; already?: boolean; error?: string };
    if (!data.ok) return { ok: false, error: data.error || 'Install failed.' };
    return { ok: true, already: data.already };
  } catch {
    return { ok: false, error: `Can't reach the VM's app bridge — nothing was installed.` };
  }
}

/** What the bridge reports as installed — so the UI can tell the truth about what's available. */
export async function installedApps(): Promise<Record<string, boolean> | null> {
  try {
    const r = await fetch(`${BRIDGE}/apps`);
    if (!r.ok) return null;
    return (await r.json()) as Record<string, boolean>;
  } catch {
    return null;
  }
}

/** Real battery / memory / disk. Returns null when the bridge is unreachable. */
export async function systemStats(): Promise<SystemStats | null> {
  try {
    const r = await fetch(`${BRIDGE}/system`);
    if (!r.ok) return null;
    return (await r.json()) as SystemStats;
  } catch {
    return null;
  }
}
