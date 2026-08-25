import { useState, type CSSProperties } from 'react';
import Desktop from './components/Desktop';
import WallpaperPicker from './components/WallpaperPicker';
import { useDesktopState } from './lib/useDesktopState';

export default function App() {
  const { theme, setTheme, wallpaperId, setWallpaperId } = useDesktopState();
  const [wallpaperOpen, setWallpaperOpen] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Desktop wallpaperId={wallpaperId} />

      {/* Dev-only strip — not part of the shell, just a way to reach Settings' two controls
          without Settings itself being built yet (screen 10). Remove once it is. */}
      <div style={{
        position: 'absolute', top: 44, left: 12, zIndex: 10,
        display: 'flex', gap: 8, padding: '6px 8px', borderRadius: 10,
        background: 'var(--glass-bg)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)',
      }}>
        <button onClick={() => setTheme(theme === 'ink' ? 'paper' : 'ink')} style={devBtn}>
          {theme === 'ink' ? '☾ Ink' : '☀ Paper'}
        </button>
        <button onClick={() => setWallpaperOpen(true)} style={devBtn}>🖼 Wallpaper</button>
      </div>

      {wallpaperOpen && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,.5)',
        }}>
          <WallpaperPicker selectedId={wallpaperId} onSelect={setWallpaperId} onClose={() => setWallpaperOpen(false)} />
        </div>
      )}
    </div>
  );
}

const devBtn: CSSProperties = {
  padding: '6px 10px', borderRadius: 8, fontSize: 11, border: 'none', cursor: 'pointer', font: 'inherit',
  background: 'var(--well-bg)', color: 'var(--text)',
};
