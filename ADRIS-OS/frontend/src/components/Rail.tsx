import type { ReactNode } from 'react';
import MonthGrid from './MonthGrid';

/**
 * The right-edge home panel — see plan.md §3/§5. Reads top to bottom in the order of a day: ask,
 * time, month, today, agents, notifications, apps, account. This is a literal build of the
 * design's own component list (screen 03):
 *
 *   <Rail>
 *     <AskField submit />
 *     <Clock />
 *     <MonthCalendar />
 *     <Agenda limit={3} />
 *     <AgentsRow />
 *     <Notifications max={2} />
 *     <AppButtons />      -- Calendar and Council pinned here from first boot (plan.md Targets)
 *     <Account />
 *   </Rail>
 *
 * In the real shell this docks as a layer-shell panel with an exclusive zone, so windows never sit
 * under it. In this web build it's simply pinned with CSS — the exclusive-zone behaviour is a
 * compositor-level concern that only exists once §11's Wayland layer belongs to this project.
 */
export default function Rail({ userName = 'Aman Verma' }: { userName?: string }) {
  return (
    <div style={{
      position: 'absolute', top: 38, right: 0, bottom: 0, width: 312,
      background: 'var(--rail-bg)', backdropFilter: 'blur(38px)',
      borderLeft: '1px solid var(--border)', padding: 12, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--text)', overflow: 'hidden',
    }}>
      <AskField />
      <Clock />
      <Panel>
        <PanelHead title="August 2026" nav />
        <MonthGrid />
      </Panel>
      <Agenda />
      <AgentsRow />
      <Notifications />
      <AppButtons />
      <Account name={userName} />
    </div>
  );
}

function AskField() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '7px 8px 7px 13px', borderRadius: 12,
      background: 'rgba(124,92,255,.13)', border: '1px solid rgba(124,92,255,.38)',
    }}>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ask adris…</div>
      <div style={{ marginLeft: 'auto', width: 26, height: 26, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13M13 7l5 5-5 5" /></svg>
      </div>
    </div>
  );
}

function Clock() {
  const now = new Date();
  const h = now.getHours() % 12 || 12;
  const m = String(now.getMinutes()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const date = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1 }}>{h}:{m}</div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', paddingTop: 5 }}>{ampm}</div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>{date}</div>
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div style={{ borderRadius: 15, background: 'var(--well-bg)', border: '1px solid var(--well-border)', padding: 13 }}>
      {children}
    </div>
  );
}

function PanelHead({ title, action, nav }: { title: string; action?: string; nav?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
      <div style={{ fontSize: 12, fontWeight: 500 }}>{title}</div>
      {nav && <div style={{ display: 'flex', gap: 9, fontSize: 10.5, color: 'var(--text-faint)' }}><div>‹</div><div>›</div></div>}
      {action && <div style={{ fontSize: 11, color: 'var(--accent-light)' }}>{action}</div>}
    </div>
  );
}

function Agenda() {
  const items = [
    { time: '10:00 AM', label: 'Demo with Acme' },
    { time: '2:30 PM', label: 'Vendor call' },
  ];
  return (
    <Panel>
      <PanelHead title="Today" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 11.5 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 9 }}>
            <div style={{ color: 'var(--text-muted)', width: 54 }}>{it.time}</div>
            <div>{it.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 11, paddingTop: 10, borderTop: '1px solid var(--well-border)' }}>
        <div style={{ fontSize: 11.5, color: 'var(--accent-light)' }}>View calendar</div>
        <ArrowIcon />
      </div>
    </Panel>
  );
}

function AgentsRow() {
  const agents = [
    { name: 'Outreach Agent', status: 'Running ✦' },
    { name: 'Research Agent', status: 'Running ✦' },
  ];
  return (
    <Panel>
      <PanelHead title="Agents · 2 running" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {agents.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <AgentIcon />
            <div>
              <div style={{ fontSize: 11.5 }}>{a.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>{a.status}</div>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Notifications() {
  const items = [
    { title: 'Outreach Agent', body: 'Replied to 3 new leads', at: '2m ago' },
    { title: 'System update', body: 'adris OS is up to date', at: '1h ago' },
  ];
  return (
    <Panel>
      <PanelHead title="Notifications" action="View all" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {items.map((n, i) => (
          <div key={i} style={{ display: 'flex', gap: 9 }}>
            <div style={{ fontSize: 11.5, flex: 1 }}>
              {n.title}
              <div style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 2 }}>{n.body}</div>
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-faint)' }}>{n.at}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/**
 * Calendar and Council pinned here from first boot, per plan.md Targets — "a new person's rail is
 * not empty on day one." The remaining slots are ordinary apps; a real build reads this list from
 * what's actually installed rather than a fixed four.
 */
function AppButtons() {
  return (
    <div style={{ display: 'flex', gap: 7, paddingTop: 2 }}>
      <AppSlot title="Calendar"><CalendarIcon /></AppSlot>
      <AppSlot title="Council"><CouncilIcon /></AppSlot>
      <AppSlot title="Files"><FilesIcon /></AppSlot>
      <AppSlot title="Launcher"><ChevronIcon /></AppSlot>
    </div>
  );
}

function AppSlot({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div title={title} style={{
      width: 44, height: 36, borderRadius: 11, background: 'var(--well-bg)', border: '1px solid var(--well-border)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    }}>{children}</div>
  );
}

function Account({ name }: { name: string }) {
  return (
    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, paddingTop: 11, borderTop: '1px solid var(--border)' }}>
      <div style={{ width: 28, height: 28, borderRadius: '999px', background: 'linear-gradient(150deg,#B49EFF,#6544D8)' }} />
      <div style={{ fontSize: 12 }}>{name}</div>
      <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-faint)' }}>⌄</div>
    </div>
  );
}

const iconStroke = { fill: 'none', stroke: 'var(--text-muted)', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
function ArrowIcon() { return <svg width="12" height="12" viewBox="0 0 24 24" {...iconStroke}><path d="M8 16L16 8M10 8h6v6" /></svg>; }
function AgentIcon() { return <svg width="13" height="13" viewBox="0 0 24 24" {...iconStroke}><rect x="5" y="7" width="14" height="11" rx="3" /><path d="M12 4v3M9 12h.01M15 12h.01" /></svg>; }
function CalendarIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" {...iconStroke}><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>; }
function CouncilIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" {...iconStroke}><circle cx="9" cy="10" r="3" /><path d="M3.5 20c0-3.2 2.4-5.4 5.5-5.4S14.5 16.8 14.5 20" /><circle cx="17" cy="11" r="2.4" /><path d="M15.5 15.2c2.8 0 4.5 2 4.5 4.8" /></svg>; }
function FilesIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" {...iconStroke}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>; }
function ChevronIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" {...iconStroke}><path d="M9 6l6 6-6 6" /></svg>; }
