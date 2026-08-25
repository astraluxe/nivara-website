import type { ReactNode } from 'react';

/**
 * The 38px top edge. The "Calm · Focused · In control" pill from the original design canvas is
 * gone — it read as marketing copy sitting on the desktop, not information — and the previous
 * separate floating dev strip (theme + wallpaper buttons, parked awkwardly in a corner) is folded
 * in here properly instead, on the right where a real desktop's quick-toggles live.
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
      position: 'absolute', top: 0, left: 0, right: 0, height: 38, zIndex: 3,
      display: 'flex', alignItems: 'center', gap: 11, padding: '0 10px 0 14px',
      background: 'var(--glass-bg)', backdropFilter: `blur(${'var(--glass-blur)'})`,
      WebkitBackdropFilter: `blur(${'var(--glass-blur)'})`,
      borderBottom: '1px solid var(--border)', boxSizing: 'border-box', color: 'var(--text)',
    }}>
      <div style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <svg width="11" height="9" viewBox="0 0 28 24" fill="#F1EFEA"><path d="M2 3h6.6l8 9-8 9H2l8-9z" /><path d="M12 3h6.6l8 9-8 9H12l8-9z" /></svg>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 500 }}>adris OS</div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
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
        width: 26, height: 26, borderRadius: 7, border: 'none', background: 'transparent',
        color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--well-bg)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >{children}</button>
  );
}

const s = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
function MoonIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" /></svg>; }
function SunIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><circle cx="12" cy="12" r="4.2" /><path d="M12 3v2.2M12 18.8V21M4.2 12H2M22 12h-2.2M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5" /></svg>; }
function ImageIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><rect x="3.5" y="4.5" width="17" height="15" rx="2.4" /><circle cx="8.5" cy="9.5" r="1.4" /><path d="M4 16.5l5-5 3.5 3.5L17 10l3.5 3.5" /></svg>; }
