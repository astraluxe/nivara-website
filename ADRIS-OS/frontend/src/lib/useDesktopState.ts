import { useCallback, useEffect, useState } from 'react';
import { loadSelectedWallpaperId, saveSelectedWallpaperId, WALLPAPERS } from './wallpapers';

export type Theme = 'ink' | 'paper';
export type DesktopStyle = 'comfortable' | 'compact' | 'spacious';

const THEME_KEY = 'adris-os.theme';
const STYLE_KEY = 'adris-os.desktop-style';

function loadTheme(): Theme {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === 'ink' || t === 'paper') return t;
  } catch { /* ignore */ }
  return 'ink'; // ink is the shipping default, matching the desktop app
}

function loadStyle(): DesktopStyle {
  try {
    const s = localStorage.getItem(STYLE_KEY);
    if (s === 'comfortable' || s === 'compact' || s === 'spacious') return s;
  } catch { /* ignore */ }
  return 'comfortable';
}

/**
 * The three per-viewer preferences the shell needs everywhere: theme, desktop style, and the
 * active wallpaper. One hook rather than three, because a screen that shows all of Settings needs
 * all three at once — and because they share the exact same "read from localStorage, write back on
 * change" shape, worth writing once.
 */
export function useDesktopState() {
  const [theme, setThemeState] = useState<Theme>(loadTheme);
  const [style, setStyleState] = useState<DesktopStyle>(loadStyle);
  const [wallpaperId, setWallpaperIdState] = useState<string>(loadSelectedWallpaperId);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try { localStorage.setItem(THEME_KEY, t); } catch { /* ignore */ }
  }, []);

  const setStyle = useCallback((s: DesktopStyle) => {
    setStyleState(s);
    try { localStorage.setItem(STYLE_KEY, s); } catch { /* ignore */ }
  }, []);

  const setWallpaperId = useCallback((id: string) => {
    setWallpaperIdState(id);
    saveSelectedWallpaperId(id);
  }, []);

  return {
    theme, setTheme,
    style, setStyle,
    wallpaperId, setWallpaperId,
    wallpapers: WALLPAPERS,
  };
}
