import type { ReactNode } from 'react';

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
export default function Rail({ userName = 'Aman Verma', width = 340, scale = 1 }: { userName?: string; width?: number; scale?: number }) {
  return (
    // A FLOATING PANEL, not a full-height bar.
    //
    // The rail used to run edge to edge, top to bottom, blurring everything behind it — on a
    // smaller screen that meant a third of the desktop was permanently frosted over. It is now a
    // card inset from the edges with the wallpaper visible all around it, so the blur only covers
    // what the panel actually occupies. Same information, a lot less of the screen taken.
    <div style={{
      // HEIGHT FITS THE CONTENT, rather than stretching to the bottom of the screen. Once the
      // duplicated Applications grid was removed the panel kept its full height and held a large
      // void above the account row — a panel with a void in it reads as broken, not as spacious.
      // maxHeight keeps it scrollable if the agenda ever grows long.
      position: 'absolute', top: 58, right: 18, width,
      maxHeight: 'calc(100vh - 130px)',
      borderRadius: 24,
      background: 'var(--rail-bg)',
      backdropFilter: 'blur(var(--glass-blur)) saturate(160%)',
      WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(160%)',
      border: '1px solid var(--border-soft)',
      boxShadow: '0 1px 0 rgba(255,255,255,.12) inset, 0 22px 48px -22px rgba(0,0,0,.6)',
      padding: `${Math.round(20 * scale)}px ${Math.round(18 * scale)}px ${Math.round(16 * scale)}px`,
      boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: Math.round(24 * scale),
      color: 'var(--text)', overflowY: 'auto',
    }}>
      <AskField />

      <Section label="Today">
        <Agenda />
      </Section>

      <Section label="Running">
        <Running />
      </Section>

      {/* NO APPLICATIONS GRID HERE.
          It used to repeat the dock's six apps exactly — the same duplication the clock and the
          calendar were guilty of, and the reason both were moved. The dock IS the app launcher, and
          everything else is behind its 9-dot button. The rail is for what needs attention NOW:
          what's next, what's running, and who you are. */}

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

function Account({ name }: { name: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 13,
      marginTop: 4, paddingTop: 16, borderTop: '1px solid var(--border)',
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 999, flex: 'none', background: 'linear-gradient(150deg,#B49EFF,#6544D8)' }} />
      <div style={{ fontSize: 14 }}>{name}</div>
      <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-faint)' }}>⌄</div>
    </div>
  );
}
