import WidgetCard from './WidgetCard';

const SystemIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="5" width="17" height="6" rx="2" /><rect x="3.5" y="13" width="17" height="6" rx="2" />
    <circle cx="7" cy="8" r="1.1" /><circle cx="7" cy="16" r="1.1" />
  </svg>
);

const RINGS: { label: string; pct: number; color: string }[] = [
  { label: 'CPU', pct: 12, color: 'var(--accent-mid)' },
  { label: 'RAM', pct: 32, color: 'var(--teal)' },
  { label: 'Disk', pct: 41, color: 'var(--ok)' },
];

export default function SystemWidget({ model = 'qwen · idle' }: { model?: string }) {
  return (
    <WidgetCard icon={SystemIcon} title="System">
      <div style={{ display: 'flex', gap: 6 }}>
        {RINGS.map((r) => (
          <div key={r.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '999px', position: 'relative',
              background: `conic-gradient(${r.color} 0turn ${r.pct / 100}turn, rgba(255,255,255,.07) ${r.pct / 100}turn 1turn)`,
              boxShadow: '0 1px 0 rgba(255,255,255,.14) inset,0 4px 10px -4px rgba(0,0,0,.7)',
            }}>
              <div style={{
                position: 'absolute', inset: 6, borderRadius: '999px',
                background: 'linear-gradient(168deg,#221C33,#15111F)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600,
              }}>{r.pct}%</div>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{r.label}</div>
          </div>
        ))}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 9, marginTop: 14, padding: '9px 11px', borderRadius: 11,
        background: 'rgba(63,178,127,.1)', border: '1px solid rgba(63,178,127,.28)',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6.5" y="6.5" width="11" height="11" rx="2.4" /><path d="M10 3v3M14 3v3M10 18v3M14 18v3M3 10h3M3 14h3M18 10h3M18 14h3" />
        </svg>
        <div style={{ fontSize: 11 }}>{model}</div>
        <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-faint)' }}>on this machine</div>
      </div>
    </WidgetCard>
  );
}
