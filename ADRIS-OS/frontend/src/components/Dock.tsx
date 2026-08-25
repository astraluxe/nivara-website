import type { ReactNode } from 'react';

/** The bottom-centre floating dock — a launcher shortcut, today's date, and a few pinned apps. */
export default function Dock({ railWidth }: { railWidth: number }) {
  return (
    <div style={{ position: 'absolute', bottom: 14, left: 0, right: railWidth, display: 'flex', justifyContent: 'center', zIndex: 2 }}>
      <div style={{ display: 'flex', gap: 9, padding: '8px 11px', borderRadius: 16, background: 'var(--glass-bg)', border: '1px solid var(--border)', backdropFilter: 'blur(30px)' }}>
        <Slot bg="var(--accent)">
          <svg width="18" height="15" viewBox="0 0 28 24" fill="#F1EFEA"><path d="M2 3h6.6l8 9-8 9H2l8-9z" /><path d="M12 3h6.6l8 9-8 9H12l8-9z" /></svg>
        </Slot>
        <Slot>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
            <div style={{ background: 'var(--danger)', color: '#fff', fontSize: 6.5, textAlign: 'center', letterSpacing: '.06em', padding: '1px 0' }}>AUG</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 }}>24</div>
          </div>
        </Slot>
        <Slot><Icon d="M5 12.5l4.5 4.5L19 7.5" /></Slot>
        <Slot><Icon d="M3.6 7.2L12 13l8.4-5.8" rect /></Slot>
        <Slot><Icon d="M7 10l2.5 2L7 14M12 15h5" rect2 /></Slot>
      </div>
    </div>
  );
}

function Slot({ bg, children }: { bg?: string; children: ReactNode }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10, overflow: 'hidden',
      background: bg ?? 'var(--well-bg)', border: bg ? undefined : '1px solid var(--well-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</div>
  );
}

function Icon({ d, rect, rect2 }: { d: string; rect?: boolean; rect2?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {rect && <rect x="3" y="6" width="18" height="12" rx="2.4" />}
      {rect2 && <rect x="3" y="4.5" width="18" height="15" rx="2.4" />}
      <path d={d} />
    </svg>
  );
}
