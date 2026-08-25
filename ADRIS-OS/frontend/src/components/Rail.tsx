import { useEffect, useState, type ReactNode } from 'react';
import MonthGrid from './MonthGrid';
import { LINUX_APPS, launchApp, installedApps } from '../lib/linuxApps';

/**
 * The right-edge home panel, redesigned — see plan.md §5.
 *
 * The previous version was five stacked bordered boxes, each with its own frame, which made the
 * rail as busy as the canvas it was supposed to be calmer than. This one drops the boxes: sections
 * are separated by space and a small label instead of a border each, and the sections themselves
 * are cut to what genuinely earns permanent screen space — ask, month, today, what's running, and
 * the real apps. Notifications moved into "what's running" rather than being a sixth box.
 *
 * "Apps" now launches REAL Linux applications through the bridge (plan.md §6) — and greys out
 * anything genuinely not installed rather than offering a button that can only fail.
 *
 * In the real shell this docks as a layer-shell panel with an exclusive zone, so windows never sit
 * under it. In this web build it's pinned with CSS — the exclusive-zone behaviour is a
 * compositor-level concern that only exists once §11's Wayland layer belongs to this project.
 */
export default function Rail({ userName = 'Aman Verma' }: { userName?: string }) {
  const [installed, setInstalled] = useState<Record<string, boolean> | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => { void installedApps().then(setInstalled); }, []);

  async function open(id: string, name: string) {
    setNote(`Opening ${name}…`);
    const r = await launchApp(id);
    setNote(r.ok ? `${name} opened` : r.error);
    window.setTimeout(() => setNote(''), 4000);
  }

  return (
    <div style={{
      position: 'absolute', top: 38, right: 0, bottom: 0, width: 312,
      background: 'var(--rail-bg)', backdropFilter: 'blur(var(--glass-blur))', WebkitBackdropFilter: 'blur(var(--glass-blur))',
      borderLeft: '1px solid var(--border)', padding: '14px 14px 12px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 18, color: 'var(--text)', overflow: 'auto',
    }}>
      <AskField />

      <Section label="August 2026">
        <MonthGrid />
      </Section>

      <Section label="Today">
        <Agenda />
      </Section>

      <Section label="Running">
        <Running />
      </Section>

      <Section label="Apps">
        <AppGrid installed={installed} onOpen={open} />
        {note && <p style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.45 }}>{note}</p>}
      </Section>

      <Account name={userName} />
    </div>
  );
}

/** A titled block with no border — space and a small caps label do the separating. */
function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.1em', color: 'var(--text-faint)', marginBottom: 9 }}>
        {label.toUpperCase()}
      </div>
      {children}
    </div>
  );
}

function AskField() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 9px 9px 14px', borderRadius: 13,
      background: 'rgba(124,92,255,.14)', border: '1px solid rgba(124,92,255,.4)',
    }}>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Ask adris…</div>
      <div style={{ marginLeft: 'auto', width: 26, height: 26, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13M13 7l5 5-5 5" /></svg>
      </div>
    </div>
  );
}

function Agenda() {
  const items = [
    { time: '10:00', label: 'Demo with Acme', soon: true },
    { time: '14:30', label: 'Vendor call' },
    { time: '16:00', label: 'Team sync' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'baseline' }}>
          <div className="mono" style={{ fontSize: 11, color: it.soon ? 'var(--accent-light)' : 'var(--text-faint)', width: 40, flex: 'none' }}>{it.time}</div>
          <div style={{ fontSize: 12.5, color: it.soon ? 'var(--text)' : 'var(--text-muted)' }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}

/** Agents + what they last did — the old "Agents" and "Notifications" boxes, merged. */
function Running() {
  const rows = [
    { name: 'Outreach Agent', last: 'Replied to 3 new leads', at: '2m' },
    { name: 'Research Agent', last: 'Report generated', at: '15m' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{
            width: 6, height: 6, borderRadius: 999, background: 'var(--ok)', flex: 'none', marginTop: 5,
            boxShadow: '0 0 8px var(--ok)',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12 }}>{r.name}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 2 }}>{r.last}</div>
          </div>
          <div className="mono" style={{ fontSize: 9.5, color: 'var(--text-faint)', flex: 'none' }}>{r.at}</div>
        </div>
      ))}
    </div>
  );
}

function AppGrid({
  installed, onOpen,
}: {
  installed: Record<string, boolean> | null;
  onOpen: (id: string, name: string) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {LINUX_APPS.map((app) => {
        // null = the bridge hasn't answered (or isn't running); don't pretend to know. Only grey
        // out when it has told us the app is genuinely missing.
        const known = installed !== null;
        const missing = known && !installed[app.id];
        return (
          <button
            key={app.id}
            title={missing ? `${app.name} — not installed in the VM` : `${app.name} — ${app.exec}`}
            disabled={missing}
            onClick={() => onOpen(app.id, app.name)}
            style={{
              height: 52, borderRadius: 12, cursor: missing ? 'default' : 'pointer',
              background: 'var(--well-bg)', border: '1px solid var(--well-border)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
              opacity: missing ? 0.35 : 1, padding: 0, color: 'var(--text)',
            }}
          >
            <span style={{ fontSize: 17, lineHeight: 1 }}>{app.icon}</span>
            <span style={{ fontSize: 8.5, color: 'var(--text-faint)' }}>{app.name.replace('LibreOffice ', '')}</span>
          </button>
        );
      })}
    </div>
  );
}

function Account({ name }: { name: string }) {
  return (
    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
      <div style={{ width: 28, height: 28, borderRadius: '999px', background: 'linear-gradient(150deg,#B49EFF,#6544D8)' }} />
      <div style={{ fontSize: 12 }}>{name}</div>
      <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-faint)' }}>⌄</div>
    </div>
  );
}
