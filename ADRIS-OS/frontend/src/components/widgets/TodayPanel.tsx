import type { ReactNode } from 'react';
import WidgetCard from './WidgetCard';

/**
 * The ONE main-info card, replacing what used to be five separate widgets (Clock, Calendar,
 * Focus, Inbox, System, Battery) scattered across the canvas.
 *
 * Two of those were pure duplicates — the rail already shows the live clock and a month
 * calendar with today's agenda, so a second Clock and a second Calendar on the canvas said the
 * same thing twice for no reason. The rest (Focus, Inbox, System, Battery) were each individually
 * legitimate but added up to a wall of small cards with no single thing worth looking at first —
 * "crowded" was the accurate word for it. This is what's left once the duplicates are cut and the
 * remaining few are read as one glance instead of five: what's next, how the current focus block
 * is going, and the two or three numbers (battery, inbox, agents) that are actually worth knowing
 * at a glance rather than deserving their own card each.
 */
export default function TodayPanel({
  date = 'Tuesday, August 24',
  next = { time: '10:00', label: 'Demo with Acme' },
  focusMinutesLeft = 48,
  focusFraction = 0.62,
  battery = 62,
  needReply = 4,
  agentsRunning = 2,
}: {
  date?: string;
  next?: { time: string; label: string };
  focusMinutesLeft?: number;
  focusFraction?: number;
  battery?: number;
  needReply?: number;
  agentsRunning?: number;
}) {
  return (
    <WidgetCard icon={<TodayIcon />} title="Today" width={420}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '999px', position: 'relative', flex: 'none',
          background: `conic-gradient(var(--accent-mid) 0turn ${focusFraction}turn, rgba(255,255,255,.1) ${focusFraction}turn 1turn)`,
        }}>
          <div style={{
            position: 'absolute', inset: 5, borderRadius: '999px',
            background: 'rgba(0,0,0,.28)', backdropFilter: 'blur(6px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-.02em', lineHeight: 1 }}>{focusMinutesLeft}</div>
            <div style={{ fontSize: 8, color: 'var(--text-faint)' }}>min</div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{date}</div>
          <div style={{ fontSize: 15, marginTop: 4 }}>
            <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{next.time}</span> · {next.label}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Deep work — focus session running</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Stat icon={<BatteryIcon />} value={`${battery}%`} label="Battery" />
        <Stat icon={<InboxIcon />} value={String(needReply)} label="Need a reply" />
        <Stat icon={<AgentIcon />} value={String(agentsRunning)} label="Agents running" />
      </div>
    </WidgetCard>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 11,
      background: 'var(--well-bg)', border: '1px solid var(--well-border)',
    }}>
      <div style={{ flex: 'none', opacity: 0.8 }}>{icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 9, color: 'var(--text-faint)', marginTop: 2, whiteSpace: 'nowrap' }}>{label}</div>
      </div>
    </div>
  );
}

const s = { fill: 'none', stroke: 'var(--accent-light)', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
function TodayIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" {...s}><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>; }
function BatteryIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" {...s}><rect x="6" y="4" width="12" height="17" rx="3" /><path d="M10 2h4" /></svg>; }
function InboxIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" {...s}><rect x="3" y="6" width="18" height="12" rx="2.4" /><path d="M3.6 7.2L12 13l8.4-5.8" /></svg>; }
function AgentIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" {...s}><rect x="5" y="7" width="14" height="11" rx="3" /><path d="M12 4v3M9 12h.01M15 12h.01" /></svg>; }
