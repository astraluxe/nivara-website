import type { CSSProperties } from 'react';
import WidgetCard from './WidgetCard';

const ClockIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="7.5" /><path d="M12 8.5V12l2.5 1.5" />
  </svg>
);

const wellStyle: CSSProperties = {
  flex: 1, borderRadius: 11, padding: '9px 10px',
  background: 'var(--well-bg)', border: '1px solid var(--well-border)',
  boxShadow: '0 1px 0 rgba(255,255,255,.08) inset',
};

export default function ClockWidget({ time = '9:41', ampm = 'AM', date = 'Tuesday, August 24' }: {
  time?: string; ampm?: string; date?: string;
}) {
  return (
    <WidgetCard icon={ClockIcon} title="Clock">
      <div style={{
        borderRadius: 14, padding: 12,
        background: 'linear-gradient(180deg,rgba(0,0,0,.32),rgba(0,0,0,.14))',
        boxShadow: '0 1px 0 rgba(255,255,255,.06),0 2px 6px rgba(0,0,0,.34) inset',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
          <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-.04em', lineHeight: 0.94, textShadow: '0 2px 10px rgba(0,0,0,.55)' }}>{time}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', paddingBottom: 6 }}>{ampm}</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{date}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <div style={wellStyle}><div style={{ fontSize: 9.5, color: 'var(--text-faint)' }}>London</div><div style={{ fontSize: 12, marginTop: 3 }}>5:41</div></div>
        <div style={wellStyle}><div style={{ fontSize: 9.5, color: 'var(--text-faint)' }}>New York</div><div style={{ fontSize: 12, marginTop: 3 }}>12:41</div></div>
        <div style={wellStyle}><div style={{ fontSize: 9.5, color: 'var(--text-faint)' }}>Tokyo</div><div style={{ fontSize: 12, marginTop: 3 }}>1:41</div></div>
      </div>
    </WidgetCard>
  );
}
