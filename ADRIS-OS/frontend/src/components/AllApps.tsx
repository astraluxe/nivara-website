import { useEffect, useMemo, useState } from 'react';
import AppIcon, { type AppIconId } from './AppIcon';
import { LINUX_APPS, installedApps } from '../lib/linuxApps';

/**
 * Every application, behind the 9-dot button — the Launchpad/app-drawer pattern.
 *
 * Why this exists rather than putting everything in the dock: a dock is only useful while it stays
 * short enough to hit without reading. The moment it holds twenty apps it is a list, and a list
 * belongs on its own surface. So the dock keeps the handful someone actually uses, and this holds
 * the lot.
 *
 * HIG applied: search is focused on open (typing is the fastest way to find anything past about a
 * dozen items), Escape closes, targets are well past the 24pt desktop minimum, and the whole sheet
 * is a material over the desktop rather than an opaque panel — you can still see where you are.
 */
export default function AllApps({
  onOpen, onClose,
}: {
  onOpen: (id: string, name: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [installed, setInstalled] = useState<Record<string, boolean> | null>(null);

  useEffect(() => { void installedApps().then(setInstalled); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return LINUX_APPS;
    return LINUX_APPS.filter((a) => a.name.toLowerCase().includes(t) || a.id.includes(t));
  }, [q]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 30,
        background: 'rgba(10,8,16,.55)',
        backdropFilter: 'blur(28px) saturate(140%)',
        WebkitBackdropFilter: 'blur(28px) saturate(140%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 90,
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(900px, 78vw)' }}>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search applications"
          style={{
            width: '100%', padding: '15px 20px', borderRadius: 16, fontSize: 17,
            background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
            color: 'var(--text)', outline: 'none', font: 'inherit',
            marginBottom: 40,
          }}
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 28,
        }}>
          {shown.map((app) => {
            const missing = installed !== null && !installed[app.id];
            return (
              <button
                key={app.id}
                disabled={missing}
                title={missing ? `${app.name} — not installed` : `${app.name} — ${app.exec}`}
                onClick={() => { onOpen(app.id, app.name); onClose(); }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                  background: 'transparent', border: 'none', padding: '14px 8px',
                  borderRadius: 18, cursor: missing ? 'default' : 'pointer',
                  color: 'var(--text)', opacity: missing ? 0.35 : 1, font: 'inherit',
                  transition: 'background .12s',
                }}
                onMouseEnter={(e) => { if (!missing) e.currentTarget.style.background = 'rgba(255,255,255,.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <AppIcon id={app.id as AppIconId} size={68} />
                <span style={{ fontSize: 14, textAlign: 'center', lineHeight: 1.3 }}>{app.name}</span>
              </button>
            );
          })}
        </div>

        {shown.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 15, marginTop: 40 }}>
            Nothing matches “{q}”.
          </p>
        )}

        <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 13, marginTop: 44 }}>
          Esc to close
        </p>
      </div>
    </div>
  );
}
