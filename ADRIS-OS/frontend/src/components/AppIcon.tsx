/**
 * Real app icons, drawn as SVG — not emoji.
 *
 * Emoji were a placeholder and looked it: they render differently on every machine, carry another
 * product's art direction, and sat in the dock as flat little pictures with no relationship to
 * each other. These are one family: a rounded-square tile with a soft vertical gradient, a
 * highlight along the top edge, and a simple white glyph. That is the shape macOS, iOS and Windows
 * all converged on, and it is what makes a row of icons read as *one system* rather than a pile of
 * clipart.
 *
 * Each icon carries its own colour, because colour is how people actually find an app in a dock —
 * you reach for "the blue one" long before you read the label. Apple HIG's rule that information
 * must never be colour-ONLY still holds: every icon also has a distinct glyph and a tooltip.
 */

export type AppIconId =
  | 'writer' | 'calc' | 'impress' | 'files' | 'text' | 'terminal'
  | 'council' | 'calendar' | 'settings' | 'browser' | 'mail' | 'apps';

const TILES: Record<AppIconId, { from: string; to: string; glyph: JSX.Element }> = {
  writer: {
    from: '#4C8DFF', to: '#2563D9',
    glyph: <><path d="M8 7h8M8 11h8M8 15h5" /><path d="M6.5 3.5h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z" /></>,
  },
  calc: {
    from: '#3FC97F', to: '#1F9256',
    glyph: <><rect x="5" y="3.5" width="14" height="17" rx="1.4" /><path d="M5 8.5h14M9.7 8.5v12M14.3 8.5v12M5 14.5h14" /></>,
  },
  impress: {
    from: '#FF9F45', to: '#E06A1B',
    glyph: <><rect x="3.5" y="4.5" width="17" height="11.5" rx="1.4" /><path d="M12 16v3.5M8.5 20h7" /></>,
  },
  files: {
    from: '#FFCB47', to: '#E0A017',
    glyph: <path d="M3.5 6.6a1.4 1.4 0 0 1 1.4-1.4h4.3l2 2.3h7.4a1.4 1.4 0 0 1 1.4 1.4v9.1a1.4 1.4 0 0 1-1.4 1.4H4.9a1.4 1.4 0 0 1-1.4-1.4z" />,
  },
  text: {
    from: '#9AA6B8', to: '#5F6B7D',
    glyph: <><path d="M7 3.5h7l4.5 4.5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z" /><path d="M14 3.5V8h4.5M9 12.5h6M9 16h4" /></>,
  },
  terminal: {
    from: '#4A5568', to: '#232A36',
    glyph: <><rect x="3" y="4.5" width="18" height="15" rx="1.6" /><path d="M7 9.5l3 2.5-3 2.5M12.5 15h4.5" /></>,
  },
  council: {
    from: '#B49EFF', to: '#6544D8',
    glyph: <><circle cx="9" cy="9.5" r="2.8" /><path d="M3.8 19c0-3 2.3-5.1 5.2-5.1s5.2 2.1 5.2 5.1" /><circle cx="16.6" cy="10.6" r="2.2" /><path d="M15.2 14.6c2.7 0 4.3 1.9 4.3 4.4" /></>,
  },
  calendar: {
    from: '#FF6B7A', to: '#D22F45',
    glyph: <><rect x="3.8" y="5" width="16.4" height="15" rx="1.6" /><path d="M8 3v4M16 3v4M3.8 10h16.4" /></>,
  },
  settings: {
    from: '#8E98A8', to: '#4B5563',
    glyph: <><circle cx="12" cy="12" r="3.1" /><path d="M12 4v2.2M12 17.8V20M4 12h2.2M17.8 12H20M6.4 6.4l1.6 1.6M16 16l1.6 1.6M17.6 6.4L16 8M8 16l-1.6 1.6" /></>,
  },
  browser: {
    from: '#48B7E8', to: '#1C7FB8',
    glyph: <><circle cx="12" cy="12" r="8.3" /><ellipse cx="12" cy="12" rx="3.5" ry="8.3" /><path d="M3.9 9.5h16.2M3.9 14.5h16.2" /></>,
  },
  mail: {
    from: '#6FA8FF', to: '#3560CC',
    glyph: <><rect x="3" y="5.6" width="18" height="12.8" rx="1.7" /><path d="M3.7 7L12 13l8.3-6" /></>,
  },
  apps: {
    from: '#7C5CFF', to: '#4B2FBF',
    glyph: <><circle cx="7" cy="7" r="1.6" /><circle cx="12" cy="7" r="1.6" /><circle cx="17" cy="7" r="1.6" /><circle cx="7" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="17" cy="12" r="1.6" /><circle cx="7" cy="17" r="1.6" /><circle cx="12" cy="17" r="1.6" /><circle cx="17" cy="17" r="1.6" /></>,
  },
};

export default function AppIcon({ id, size = 52 }: { id: AppIconId; size?: number }) {
  const tile = TILES[id] ?? TILES.apps;
  // Radius tracks size at roughly 23%, which is the "squircle-ish" proportion Apple and Google both
  // land near — a fixed radius makes small icons look round and big ones look square.
  const r = Math.round(size * 0.23);
  const gid = `ag-${id}`;
  const filled = id === 'apps' || id === 'files';

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ display: 'block', flex: 'none' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tile.from} />
          <stop offset="1" stopColor={tile.to} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="48" height="48" rx={r} fill={`url(#${gid})`} />
      {/* The top highlight — one hairline of light along the upper edge. It is what stops a tile
          reading as a flat coloured rectangle. */}
      <rect x="1" y="1" width="46" height="46" rx={r - 1} fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="1" />
      <g
        transform="translate(12 12) scale(1)"
        fill={filled ? 'rgba(255,255,255,.95)' : 'none'}
        stroke="rgba(255,255,255,.95)"
        strokeWidth={filled ? 0 : 1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {tile.glyph}
      </g>
    </svg>
  );
}
