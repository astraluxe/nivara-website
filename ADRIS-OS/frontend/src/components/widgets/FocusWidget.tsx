import WidgetCard from './WidgetCard';

const FocusIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="7.5" /><path d="M12 8.5V12l2.5 1.5" />
  </svg>
);

export default function FocusWidget({ minutesLeft = 48, fraction = 0.62, label = 'Deep work', until = 'Until 12:30 PM' }: {
  minutesLeft?: number; fraction?: number; label?: string; until?: string;
}) {
  return (
    <WidgetCard icon={FocusIcon} title="Focus">
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{
          width: 92, height: 92, borderRadius: '999px', position: 'relative', flex: 'none',
          background: `conic-gradient(var(--accent-mid) 0turn ${fraction}turn, rgba(255,255,255,.07) ${fraction}turn 1turn)`,
          boxShadow: '0 6px 16px -6px rgba(124,92,255,.7),0 1px 0 rgba(255,255,255,.16) inset',
        }}>
          <div style={{
            position: 'absolute', inset: 7, borderRadius: '999px',
            background: 'linear-gradient(168deg,#221C33,#14111F)',
            boxShadow: '0 4px 10px rgba(0,0,0,.5) inset',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1 }}>{minutesLeft}</div>
            <div style={{ fontSize: 9.5, color: 'var(--text-faint)' }}>min left</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5 }}>{label}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 3 }}>{until}</div>
          <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
            <div style={{ flex: 1, textAlign: 'center', padding: 8, borderRadius: 10, background: 'var(--well-bg)', border: '1px solid var(--well-border)', fontSize: 11 }}>Pause</div>
            <div style={{
              flex: 1, textAlign: 'center', padding: 8, borderRadius: 10, fontSize: 11, fontWeight: 500,
              background: 'linear-gradient(170deg,#8E6DFF,#6544D8)',
              boxShadow: '0 4px 12px -4px rgba(124,92,255,.8),0 1px 0 rgba(255,255,255,.24) inset',
            }}>End</div>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}
