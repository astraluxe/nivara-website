import { getWallpaper } from '../lib/wallpapers';

/**
 * The background, full-bleed, behind the whole desktop. Every window and widget sits on top of
 * this — nothing else in the shell paints the window's own background, so this is the ONE place a
 * wallpaper swap actually takes effect. If no wallpaper is selected (a fresh install, or the id
 * points at something that no longer exists), it falls back to the same radial-gradient wash the
 * design uses everywhere else — never a blank window.
 */
export default function WallpaperLayer({ wallpaperId }: { wallpaperId: string }) {
  const wp = getWallpaper(wallpaperId);
  const hasImage = wp?.kind === 'image' && wp.src;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        backgroundImage: hasImage ? `url(${wp!.src})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* The same wash the design uses when there's no image (or as a scrim under one, so the
          top bar and dock read clearly regardless of what's underneath — a bright photo should
          not make the UI unreadable). */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: hasImage
            ? 'linear-gradient(180deg, rgba(7,6,11,.28), rgba(7,6,11,.5))'
            : 'var(--wash-1), var(--wash-2), var(--wash-3), var(--wash-4)',
        }}
      />
    </div>
  );
}
