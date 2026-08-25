import { useState } from 'react';
import Desktop from './components/Desktop';
import WallpaperPicker from './components/WallpaperPicker';
import { useDesktopState } from './lib/useDesktopState';

export default function App() {
  const { theme, setTheme, wallpaperId, setWallpaperId } = useDesktopState();
  const [wallpaperOpen, setWallpaperOpen] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Desktop
        wallpaperId={wallpaperId}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'ink' ? 'paper' : 'ink')}
        onOpenWallpaper={() => setWallpaperOpen(true)}
      />

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
