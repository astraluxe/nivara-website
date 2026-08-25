import WidgetCard from './WidgetCard';

const BatteryIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="12" height="17" rx="3" /><path d="M10 2h4" />
  </svg>
);

export default function BatteryWidget({ pct = 62, timeLeft = '4h 12m left' }: { pct?: number; timeLeft?: string }) {
  return (
    <WidgetCard icon={BatteryIcon} title="Battery">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 38, height: 66, borderRadius: 11, position: 'relative', flex: 'none', overflow: 'hidden',
          background: 'linear-gradient(168deg,rgba(255,255,255,.1),rgba(0,0,0,.3))',
          border: '1px solid rgba(255,255,255,.14)', boxShadow: '0 1px 0 rgba(255,255,255,.18) inset',
        }}>
          <div style={{
            position: 'absolute', left: 3, right: 3, bottom: 3, height: `${pct}%`, borderRadius: 8,
            background: 'linear-gradient(180deg,#63D89E,#2E9A6B)',
            boxShadow: '0 1px 0 rgba(255,255,255,.4) inset,0 -4px 10px rgba(0,0,0,.3) inset',
          }} />
          <div style={{ position: 'absolute', top: -4, left: 13, width: 12, height: 5, borderRadius: 2, background: 'rgba(255,255,255,.2)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-.035em', lineHeight: 1 }}>{pct}%</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 3L6 13.5h5L10 21l7-10.5h-5z" />
            </svg>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{timeLeft}</div>
          </div>
          <svg width="120" height="26" viewBox="0 0 120 26" fill="none" style={{ marginTop: 8 }}>
            <path d="M0 22C14 22 22 8 34 10s18 8 30 2 20-12 56-10" stroke="var(--ok)" strokeWidth="1.6" />
          </svg>
        </div>
      </div>
    </WidgetCard>
  );
}
