import WidgetCard from './WidgetCard';
import MonthGrid from '../MonthGrid';

const CalIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M4 10h16" />
  </svg>
);

export interface AgendaItem { time: string; label: string; soon?: boolean }

export default function CalendarWidget({ items }: { items: AgendaItem[] }) {
  return (
    <WidgetCard icon={CalIcon} title="Calendar">
      <div style={{
        borderRadius: 14, padding: 12,
        background: 'linear-gradient(180deg,rgba(0,0,0,.32),rgba(0,0,0,.14))',
        boxShadow: '0 1px 0 rgba(255,255,255,.06),0 2px 6px rgba(0,0,0,.34) inset',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontSize: 11.5 }}>August 2026</div>
          <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--text-faint)' }}><div>‹</div><div>›</div></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, fontSize: 9, color: 'var(--text-faint)', textAlign: 'center', marginBottom: 3 }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <MonthGrid />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 11,
            background: it.soon ? 'linear-gradient(160deg,rgba(124,92,255,.34),rgba(124,92,255,.14))' : 'var(--well-bg)',
            border: it.soon ? '1px solid rgba(180,158,255,.34)' : '1px solid var(--well-border)',
            boxShadow: it.soon ? '0 1px 0 rgba(255,255,255,.12) inset' : undefined,
          }}>
            <div style={{ fontSize: 10.5, color: it.soon ? 'var(--accent-light)' : 'var(--text-faint)', width: 44 }}>{it.time}</div>
            <div style={{ fontSize: 11.5 }}>{it.label}</div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
