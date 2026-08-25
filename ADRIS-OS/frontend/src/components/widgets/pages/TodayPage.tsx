import type { ReactNode } from 'react';

/**
 * Page 1 of the single widget box — the "main info" glance: what's next, the running focus
 * session, and the three numbers worth knowing without opening anything.
 */
export default function TodayPage({
  next = { time: '10:00', label: 'Demo with Acme' },
  focusMinutesLeft = 48,
  focusFraction = 0.62,
  battery = 62,
  needReply = 4,
  agentsRunning = 2,
}: {
  next?: { time: string; label: string };
  focusMinutesLeft?: number;
  focusFraction?: number;
  battery?: number;
  needReply?: number;
  agentsRunning?: number;
}) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{
          width: 76, height: 76, borderRadius: '999px', position: 'relative', flex: 'none',
          background: `conic-gradient(var(--accent-mid) 0turn ${focusFraction}turn, rgba(255,255,255,.12) ${focusFraction}turn 1turn)`,
        }}>
          <div style={{
            position: 'absolute', inset: 6, borderRadius: '999px',
            background: 'rgba(0,0,0,.3)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1 }}>{focusMinutesLeft}</div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>min</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.07em', color: 'var(--text-faint)' }}>UP NEXT</div>
          <div style={{ fontSize: 19, marginTop: 7 }}>
            <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{next.time}</span> · {next.label}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text-muted)', marginTop: 6 }}>Deep work — focus running</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <Stat icon={<BatteryIcon />} value={`${battery}%`} label="Battery" />
        <Stat icon={<InboxIcon />} value={String(needReply)} label="To reply" />
        <Stat icon={<AgentIcon />} value={String(agentsRunning)} label="Agents" />
      </div>
    </>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', borderRadius: 14,
      background: 'var(--well-bg)', border: '1px solid var(--well-border)',
    }}>
      <div style={{ flex: 'none', opacity: 0.85 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4, whiteSpace: 'nowrap' }}>{label}</div>
      </div>
    </div>
  );
}

const s = { fill: 'none', stroke: 'var(--accent-light)', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
function BatteryIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" {...s}><rect x="6" y="4" width="12" height="17" rx="3" /><path d="M10 2h4" /></svg>; }
function InboxIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" {...s}><rect x="3" y="6" width="18" height="12" rx="2.4" /><path d="M3.6 7.2L12 13l8.4-5.8" /></svg>; }
function AgentIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" {...s}><rect x="5" y="7" width="14" height="11" rx="3" /><path d="M12 4v3M9 12h.01M15 12h.01" /></svg>; }
