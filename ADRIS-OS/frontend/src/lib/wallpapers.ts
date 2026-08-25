// ─── The wallpaper catalogue ────────────────────────────────────────────────
//
// One entry per image today — `purple-mountain.png`, the first one actually supplied. Adding
// another later is exactly this: drop the file in `public/wallpapers/`, add one line here. Nothing
// about the picker, the background layer, or the selection logic changes — they all read this
// list, never a hardcoded filename. That is the whole point of a manifest instead of scattering
// the one image's name through the codebase.
//
// `kind: 'image'` is a real picture. `kind: 'generated'` is what plan.md §6 calls the deepest
// version of the pitch — an agent (Codex, Claude Code, a local model) writes a small program that
// RENDERS the wallpaper rather than a file being uploaded. That path is not wired to a real agent
// yet (see GenerateTab in WallpaperPicker.tsx) — the UI for it is built and honest about that.

export interface Wallpaper {
  id: string;
  name: string;
  kind: 'image' | 'generated';
  /** For kind:'image' — the file under /public/wallpapers/. */
  src?: string;
  /** A tiny swatch gradient for the picker thumbnail before the real image loads. */
  swatch: string;
}

export const WALLPAPERS: Wallpaper[] = [
  {
    id: 'purple-mountain',
    name: 'Purple mountain',
    kind: 'image',
    src: '/wallpapers/purple-mountain.png',
    swatch: 'linear-gradient(150deg, #4b3a6e, #1a1327)',
  },
];

const KEY = 'adris-os.wallpaper.selected';
const DEFAULT_ID = WALLPAPERS[0]?.id ?? '';

export function loadSelectedWallpaperId(): string {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && WALLPAPERS.some((w) => w.id === saved)) return saved;
  } catch {
    /* localStorage unavailable (private mode, etc.) — fall through to the default */
  }
  return DEFAULT_ID;
}

export function saveSelectedWallpaperId(id: string): void {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* not fatal — the pick just won't survive a reload */
  }
}

export function getWallpaper(id: string): Wallpaper | undefined {
  return WALLPAPERS.find((w) => w.id === id);
}
