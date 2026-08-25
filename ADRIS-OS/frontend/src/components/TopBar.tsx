import type { ReactNode } from 'react';

/**
 * The top edge — no bar.
 *
 * There used to be a 38px glass strip across the whole width holding a logo and two toggles. It
 * cost a full band of the screen, blurred whatever was behind it, and drew a hard line across the
 * wallpaper for the sake of two buttons.
 *
 * Now the controls float directly on the wallpaper: no background, no blur, no border, nothing but
 * the buttons themselves. Each button gets its own small backdrop only on hover, which is HIG's
 * actual rule — a material exists to make a control legible, not to decorate a region. Contrast is
 * kept by a soft text-shadow rather than a panel, so a bright wallpaper still can't wash them out.
 */
export default function TopBar({
  theme, onToggleTheme, onOpenWallpaper,
}: {
  theme: 'ink' | 'paper';
  onToggleTheme: () => void;
  onOpenWallpaper: () => void;
}) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3,
      display: 'flex', alignItems: 'center',
      padding: '14px 18px',
      pointerEvents: 'none',        // the empty space is wallpaper, not a bar — clicks pass through
      background: 'transparent',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9,
        pointerEvents: 'auto',
        filter: 'drop-shadow(0 1px 6px rgba(0,0,0,.5))',
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 7, background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none',
        }}>
          <svg width="12" height="10" viewBox="0 0 28 24" fill="#F1EFEA"><path d="M2 3h6.6l8 9-8 9H2l8-9z" /><path d="M12 3h6.6l8 9-8 9H12l8-9z" /></svg>
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-.01em' }}>adris OS</div>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'auto' }}>
        <IconBtn title={theme === 'ink' ? 'Switch to Paper' : 'Switch to Ink'} onClick={onToggleTheme}>
          {theme === 'ink' ? <MoonIcon /> : <SunIcon />}
        </IconBtn>
        <IconBtn title="Wallpaper" onClick={onOpenWallpaper}><ImageIcon /></IconBtn>
      </div>
    </div>
  );
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        // 34px — comfortably past the 24pt desktop minimum, while the visible glyph stays small.
        width: 34, height: 34, borderRadius: 10,
        border: 'none', background: 'transparent',
        color: 'var(--text)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'background .14s',
        filter: 'drop-shadow(0 1px 5px rgba(0,0,0,.55))',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.16)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >{children}</button>
  );
}

const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
function MoonIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" {...s}><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" /></svg>; }
function SunIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="4.2" /><path d="M12 3v2.2M12 18.8V21M4.2 12H2M22 12h-2.2M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5" /></svg>; }
function ImageIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" {...s}><rect x="3.5" y="4.5" width="17" height="15" rx="2.4" /><circle cx="8.5" cy="9.5" r="1.4" /><path d="M4 16.5l5-5 3.5 3.5L17 10l3.5 3.5" /></svg>; }
