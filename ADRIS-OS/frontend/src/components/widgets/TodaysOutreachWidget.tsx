import WidgetCard, { StateCaption, type WidgetState } from './WidgetCard';

const OutreachIcon = (color: string) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="7" width="14" height="11" rx="3" /><path d="M12 4v3M9 12h.01M15 12h.01" />
  </svg>
);

// A quiet random-height waveform for the "working" state — deterministic per mount, not truly
// random, so it doesn't jump every re-render, but not a fixed pattern either.
const BARS = [11, 19, 26, 15, 22, 9, 28, 17, 24, 13, 20, 27, 14, 21];

function Resting({ ready, sent, nextSend }: { ready: number; sent: number; nextSend: string }) {
  const pct = ready + sent > 0 ? Math.round((sent / (ready + sent)) * 100) : 0;
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22 }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-.035em', lineHeight: 1 }}>{ready}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 4 }}>ready</div>
        </div>
        <div>
          <div style={{ fontSize: 32, fontWeight: 600, letterSpacing: '-.035em', lineHeight: 1, color: 'var(--accent-light)' }}>{sent}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 4 }}>sent</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>next send</div>
          <div style={{ fontSize: 12.5, marginTop: 3 }}>{nextSend}</div>
        </div>
      </div>
      <div style={{ height: 6, borderRadius: '999px', marginTop: 14, background: 'rgba(0,0,0,.36)', boxShadow: '0 1px 2px rgba(0,0,0,.5) inset', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg,#8E6DFF,#B49EFF)', boxShadow: '0 0 10px rgba(142,109,255,.8)' }} />
      </div>
    </>
  );
}

function Working({ writingTo, doneOf, total }: { writingTo: string; doneOf: number; total: number }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 7, height: 7, borderRadius: '999px', background: 'var(--accent-light)', boxShadow: '0 0 10px var(--accent-light)', animation: 'adrisPulse 1.2s ease-in-out infinite' }} />
        <div style={{ fontSize: 12.5 }}>Writing to {writingTo}</div>
      </div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 34, marginTop: 14 }}>
        {BARS.map((h, i) => (
          <div key={i} style={{ flex: 1, height: h, borderRadius: 2, background: 'linear-gradient(180deg,#B49EFF,rgba(124,92,255,.15))', boxShadow: '0 0 6px rgba(142,109,255,.35)' }} />
        ))}
      </div>
      <div className="mono" style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 13, fontSize: 10, color: 'var(--text-muted)' }}>
        <div style={{ color: 'var(--ok)' }}>✓ pulled last thread</div>
        <div style={{ color: 'var(--ok)' }}>✓ checked pricing sheet</div>
        <div>› drafting reply… {doneOf} of {total}</div>
      </div>
    </>
  );
}

function Finished({ sent, seconds, onRead, onUndo }: { sent: number; seconds: number; onRead?: () => void; onUndo?: () => void }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <div style={{
          width: 42, height: 42, borderRadius: '999px', flex: 'none',
          background: 'linear-gradient(165deg,#63D89E,#2E9A6B)',
          boxShadow: '0 6px 14px -5px rgba(63,178,127,.85),0 1px 0 rgba(255,255,255,.35) inset',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B2C1E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>All done ✦</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{sent} sent in {Math.floor(seconds / 60)}m {seconds % 60}s</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <button onClick={onRead} style={{ flex: 1, textAlign: 'center', padding: 9, borderRadius: 11, background: 'var(--well-bg)', border: '1px solid var(--well-border)', fontSize: 11.5, color: 'var(--text)', font: 'inherit', cursor: 'pointer' }}>Read them</button>
        <button onClick={onUndo} style={{ flex: 1, textAlign: 'center', padding: 9, borderRadius: 11, fontSize: 11.5, color: 'var(--text-muted)', background: 'transparent', border: 'none', font: 'inherit', cursor: 'pointer' }}>Undo</button>
      </div>
    </>
  );
}

/**
 * The one widget the design specifically demonstrates in all three states (screen 04) — so it is
 * the reference for how EVERY stateful widget should feel, not just this one. Resting shows the
 * numbers that matter; Working reads as visibly alive (a pulsing dot, a moving waveform, a running
 * checklist) rather than a static spinner; Finished settles back to Resting on its own after the
 * caption's stated delay, which is driven from here so a caller doesn't have to reimplement it.
 */
export default function TodaysOutreachWidget({
  state = 'resting',
  userAdded,
  ready = 12, sent = 3, nextSend = '11:30 AM',
  writingTo = 'Priya Menon', doneOf = 4, total = 12,
  finishedIn = 220,
}: {
  state?: WidgetState;
  userAdded?: boolean;
  ready?: number; sent?: number; nextSend?: string;
  writingTo?: string; doneOf?: number; total?: number;
  finishedIn?: number;
}) {
  const iconColor = state === 'finished' ? 'var(--ok)' : 'var(--accent-light)';
  return (
    <WidgetCard icon={OutreachIcon(iconColor)} title="Today's outreach" state={state} userAdded={userAdded}>
      {state === 'resting' && <Resting ready={ready} sent={sent} nextSend={nextSend} />}
      {state === 'working' && <Working writingTo={writingTo} doneOf={doneOf} total={total} />}
      {state === 'finished' && <Finished sent={ready + sent} seconds={finishedIn} />}
      <StateCaption state={state} extra={state === 'finished' ? 'settles back after 8s' : undefined} />
    </WidgetCard>
  );
}
