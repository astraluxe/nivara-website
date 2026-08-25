import { useEffect, useState } from 'react';
import AppIcon, { AppLogo, type AppIconId } from './AppIcon';
import { PINNED, launchApp, installedApps, iconFor, type CatalogueApp } from '../lib/linuxApps';

/**
 * The dock — real applications, real icons.
 *
 * Two changes from the emoji version, both HIG-driven:
 * - **Icons are drawn, not typed.** See AppIcon: one tile family, so the row reads as a system.
 * - **The dock only holds pinned apps, plus a 9-dot button for the rest.** A dock stops being
 *   useful the moment it becomes a list — the pattern every desktop converged on is "a few you
 *   use, and a door to everything." The row widens on its own as more apps get pinned; it never
 *   has to hold all of them.
 *
 * Tiles are 56px against a 24pt (~32px) desktop minimum, and each has a tooltip naming the real
 * command, so nothing about what will run is hidden.
 */
export default function Dock({ onOpenAllApps, iconSize = 54 }: {
  onOpenAllApps: () => void;
  iconSize?: number;
}) {
  const [note, setNote] = useState('');
  const [installed, setInstalled] = useState<Record<string, boolean> | null>(null);

  useEffect(() => { void installedApps().then(setInstalled); }, []);

  async function open(app: CatalogueApp) {
    setNote(`Opening ${app.name}…`);
    const res = await launchApp(app.id);
    setNote(res.ok ? `${app.name} opened` : res.error);
    window.setTimeout(() => setNote(''), 5000);
  }

  return (
    <div style={{
      // Centred on the WHOLE screen. The rail is a floating card now, so centring against the
      // space left of it pushed the dock visibly off-centre.
      position: 'absolute', bottom: 22, left: 0, right: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, zIndex: 2,
      pointerEvents: 'none',
    }}>
      {note && (
        <div style={{
          fontSize: 13.5, padding: '9px 18px', borderRadius: 999, color: 'var(--text)',
          background: 'var(--glass-bg)', backdropFilter: 'blur(var(--glass-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-blur))', border: '1px solid var(--border)',
          maxWidth: 620, textAlign: 'center', pointerEvents: 'auto',
        }}>{note}</div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 26,
        background: 'var(--glass-bg)', border: '1px solid var(--border)',
        backdropFilter: 'blur(var(--glass-blur)) saturate(160%)',
        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(160%)',
        boxShadow: '0 16px 40px -14px rgba(0,0,0,.55)',
        pointerEvents: 'auto',
      }}>
        {PINNED.map((app) => {
          const missing = installed !== null && !installed[app.id];
          return (
            <DockButton
              key={app.id}
              title={missing ? `${app.name} — not installed` : `${app.name} — ${app.exec}`}
              disabled={missing}
              onClick={() => void open(app)}
            >
              <AppLogo src={app.iconUrl} id={iconFor(app) as AppIconId} size={iconSize} />
            </DockButton>
          );
        })}

        {/* The divider makes "your apps" and "all apps" read as two different things rather than
            one long row where the last item happens to behave differently. */}
        <div style={{ width: 1, height: Math.round(iconSize * 0.72), background: 'var(--border)', margin: '0 4px' }} />

        <DockButton title="All applications" onClick={onOpenAllApps}>
          <AppIcon id="apps" size={iconSize} />
        </DockButton>
      </div>
    </div>
  );
}

function DockButton({
  title, onClick, disabled, children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        background: 'transparent', border: 'none', padding: 0, borderRadius: 14,
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.32 : 1,
        transition: 'transform .14s ease',
        display: 'flex',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = 'translateY(-6px) scale(1.06)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
    >{children}</button>
  );
}
