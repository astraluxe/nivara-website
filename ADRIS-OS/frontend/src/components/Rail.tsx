import { useEffect, useState, type ReactNode } from 'react';
import AppIcon, { type AppIconId } from './AppIcon';
import { LINUX_APPS, launchApp, installedApps } from '../lib/linuxApps';

/**
 * The right-edge rail — rebuilt against Apple HIG desktop conventions.
 *
 * What changed and why:
 * - **The calendar is gone from here.** It was taking about a third of the height for reference
 *   material glanced at a few times a day. It now lives in its own bottom-left panel, leaving the
 *   rail for what actually needs attention now.
 * - **Type sizes raised throughout.** HIG puts desktop body at 13pt (~17px) with a 10pt (~13px)
 *   floor. The previous rail ran 9–11.5px — below the readable minimum, which is most of why it
 *   read as "small and boring".
 * - **Touch targets ≥24pt.** App tiles are 64px tall, rows have real padding.
 * - **Hierarchy by weight and space, not borders.** Sections separate with space and a label
 *   rather than a box each, so the panel reads as one surface.
 */
export default function Rail({ userName = 'Aman Verma' }: { userName?: string }) {
  const [installed, setInstalled] = useState<Record<string, boolean> | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => { void installedApps().then(setInstalled); }, []);

  async function open(id: string, name: string) {
    setNote(`Opening ${name}…`);
    const r = await launchApp(id);
    setNote(r.ok ? `${name} opened` : r.error);
    window.setTimeout(() => setNote(''), 5000);
  }

  return (
    <div style={{
      position: 'absolute', top: 38, right: 0, bottom: 0, width: 340,
      background: 'var(--rail-bg)',
      backdropFilter: 'blur(var(--glass-blur)) saturate(160%)',
      WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(160%)',
      borderLeft: '1px solid var(--border)',
      padding: '20px 20px 18px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 26,
      color: 'var(--text)', overflowY: 'auto',
    }}>
      <AskField />

      <Section label="Today">
        <Agenda />
      </Section>

      <Section label="Running">
        <Running />
      </Section>

      <Section label="Applications">
        <AppGrid installed={installed} onOpen={open} />
        {note && (
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.5 }}>{note}</p>
        )}
      </Section>

      <Account name={userName} />
    </div>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 12, fontWeight: 600, letterSpacing: '.06em',
        color: 'var(--text-faint)', marginBottom: 12, textTransform: 'uppercase',
      }}>{label}</div>
      {children}
    </div>
  );
}

function AskField() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '13px 13px 13px 18px', borderRadius: 16,
      background: 'rgba(124,92,255,.16)', border: '1px solid rgba(124,92,255,.45)',
    }}>
      <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>Ask adris…</div>
      <div style={{
        marginLeft: 'auto', width: 32, height: 32, borderRadius: 10, flex: 'none',
        background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h13M13 7l5 5-5 5" /></svg>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {items.map((it, i) => (
        <div key={i} style={{
          display: 'flex', gap: 14, alignItems: 'baseline',
          padding: '9px 10px', borderRadius: 11,
          background: it.soon ? 'rgba(124,92,255,.14)' : 'transparent',
        }}>
          <div style={{
            fontSize: 13, width: 46, flex: 'none', fontWeight: 500,
            color: it.soon ? 'var(--accent-light)' : 'var(--text-faint)',
          }}>{it.time}</div>
          <div style={{ fontSize: 14, color: it.soon ? 'var(--text)' : 'var(--text-muted)' }}>{it.label}</div>
        </div>
      ))}
    </div>
  );
}

function Running() {
  const rows = [
    { name: 'Outreach Agent', last: 'Replied to 3 new leads', at: '2m' },
    { name: 'Research Agent', last: 'Report generated', at: '15m' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 8, height: 8, borderRadius: 999, background: 'var(--ok)',
            flex: 'none', marginTop: 6, boxShadow: '0 0 10px var(--ok)',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14 }}>{r.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 3 }}>{r.last}</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-faint)', flex: 'none' }}>{r.at}</div>
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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
      {LINUX_APPS.map((app) => {
        // null = the bridge hasn't answered; don't pretend to know. Only dim when it has told us
        // the app is genuinely missing.
        const known = installed !== null;
        const missing = known && !installed[app.id];
        const short = app.name.replace('LibreOffice ', '');
        return (
          <button
            key={app.id}
            title={missing ? `${app.name} — not installed` : `${app.name} — ${app.exec}`}
            disabled={missing}
            onClick={() => onOpen(app.id, app.name)}
            style={{
              height: 76, borderRadius: 15, cursor: missing ? 'default' : 'pointer',
              background: 'var(--well-bg)', border: '1px solid var(--well-border)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7,
              opacity: missing ? 0.3 : 1, padding: 0, color: 'var(--text)',
              transition: 'background .12s, transform .12s',
            }}
            onMouseEnter={(e) => { if (!missing) { e.currentTarget.style.background = 'rgba(255,255,255,.12)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--well-bg)'; }}
          >
            <AppIcon id={app.id as AppIconId} size={34} />
            <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{short}</span>
          </button>
        );
      })}
    </div>
  );
}

function Account({ name }: { name: string }) {
  return (
    <div style={{
      marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 13,
      paddingTop: 16, borderTop: '1px solid var(--border)',
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 999, flex: 'none', background: 'linear-gradient(150deg,#B49EFF,#6544D8)' }} />
      <div style={{ fontSize: 14 }}>{name}</div>
      <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-faint)' }}>⌄</div>
    </div>
  );
}
