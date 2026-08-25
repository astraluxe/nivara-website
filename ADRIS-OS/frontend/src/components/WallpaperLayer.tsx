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
      {/* The same wash the design uses when there's no image. With one, this used to be a heavy
          dark scrim over the whole picture — which is what glass is FOR: the widgets and rail do
          their own blur+tint to stay readable, so the wallpaper itself doesn't need darkening to
          make room for them. A hair of shadow at the very top keeps the top bar's icons legible
          against a bright sky without touching the rest of the image. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: hasImage
            ? 'linear-gradient(180deg, rgba(0,0,0,.14), transparent 18%)'
            : 'var(--wash-1), var(--wash-2), var(--wash-3), var(--wash-4)',
        }}
      />
    </div>
  );
}
