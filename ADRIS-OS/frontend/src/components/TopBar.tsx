/** The 38px top edge — brand mark, a status pill centered, and quick toggles at the right. */
export default function TopBar() {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 38, zIndex: 2,
      display: 'flex', alignItems: 'center', gap: 11, padding: '0 14px',
      background: 'var(--glass-bg)', backdropFilter: `blur(24px)`,
      borderBottom: '1px solid var(--border)', boxSizing: 'border-box', color: 'var(--text)',
    }}>
      <div style={{ width: 20, height: 20, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <svg width="11" height="9" viewBox="0 0 28 24" fill="#F1EFEA"><path d="M2 3h6.6l8 9-8 9H2l8-9z" /><path d="M12 3h6.6l8 9-8 9H12l8-9z" /></svg>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 500 }}>adris OS</div>
      <div style={{ position: 'absolute', left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 13px', borderRadius: 999, background: 'var(--well-bg)', border: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)' }}>
          <div style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--accent-mid)' }} />
          Calm · Focused · In control
        </div>
      </div>
    </div>
  );
}
