import type { ReactNode } from 'react';

export type WidgetState = 'resting' | 'working' | 'finished';

/**
 * The one shape every widget is. Straight from the design's own words (screen 04): "a 20px-radius
 * plate with a lit top edge, a soft floor shadow inside the bottom, and a drop shadow beneath — so
 * it reads as something resting on the wallpaper rather than a flat rectangle." A user-added widget
 * keeps this exact body and only swaps the border to a dashed accent — never a different shape —
 * so a widget someone added never reads as a lesser product than one that shipped.
 *
 * This is the ONE place that geometry lives. Every widget below (Clock, Calendar, Focus, ...)
 * renders its own content into `children` and never redeclares the plate itself — the alternative
 * is eleven slightly-different widgets that all drift out of sync the first time this needs to
 * change.
 */
export default function WidgetCard({
  icon,
  title,
  state,
  userAdded,
  width = 248,
  children,
}: {
  icon: ReactNode;
  title: string;
  /** Absent = a widget with no live/finished distinction (Council, Battery, ...). */
  state?: WidgetState;
  /** True = dashed accent border, "added to this machine" rather than shipped with it. */
  userAdded?: boolean;
  width?: number;
  children: ReactNode;
}) {
  const glow =
    state === 'working'
      ? '0 0 0 4px rgba(124,92,255,.12),'
      : state === 'finished'
        ? '0 0 0 4px rgba(63,178,127,.11),'
        : '';

  return (
    <div
      style={{
        width,
        borderRadius: 20,
        position: 'relative',
        background: 'var(--plate-bg)',
        border: userAdded ? '1.5px dashed var(--accent-light)' : '1px solid var(--border-soft)',
        boxShadow:
          `${glow}0 1px 0 rgba(255,255,255,.09) inset,` +
          '0 -14px 24px -18px rgba(0,0,0,.9) inset,' +
          '0 18px 34px -14px rgba(0,0,0,.62),' +
          '0 3px 8px rgba(0,0,0,.4)',
        overflow: 'hidden',
        color: 'var(--text)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* the lit top edge */}
      <div style={{ position: 'absolute', top: 0, left: 14, right: 14, height: 1, background: 'var(--plate-edge)' }} />
      {/* the tint wash */}
      <div style={{ position: 'absolute', inset: 0, background: 'var(--plate-tint)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 9, padding: '13px 14px 11px' }}>
        <div
          style={{
            width: 26, height: 26, borderRadius: 9, flex: 'none',
            background: 'linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,.03))',
            border: '1px solid rgba(255,255,255,.12)',
            boxShadow: '0 1px 0 rgba(255,255,255,.16) inset',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {icon}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-.01em' }}>{title}</div>
        <div style={{ marginLeft: 'auto', opacity: 0.5 }}>
          {/* grab handle — six dots, matches the design exactly */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="7" r="1.1" /><circle cx="15" cy="7" r="1.1" />
            <circle cx="9" cy="12" r="1.1" /><circle cx="15" cy="12" r="1.1" />
            <circle cx="9" cy="17" r="1.1" /><circle cx="15" cy="17" r="1.1" />
          </svg>
        </div>
      </div>
      <div style={{ position: 'relative', height: 1, background: 'rgba(255,255,255,.06)' }} />
      <div style={{ position: 'relative', padding: 14, flex: 1 }}>{children}</div>
    </div>
  );
}

/** The small uppercase state caption every stateful widget ends on ("RESTING", "WORKING", ...). */
export function StateCaption({ state, extra }: { state: WidgetState; extra?: string }) {
  const color = state === 'working' ? 'var(--accent-light)' : state === 'finished' ? 'var(--text-faint)' : 'var(--text-faint)';
  const label = state.toUpperCase() + (extra ? ` · ${extra}` : '');
  return (
    <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.08em', color, marginTop: 12 }}>
      {label}
    </div>
  );
}
