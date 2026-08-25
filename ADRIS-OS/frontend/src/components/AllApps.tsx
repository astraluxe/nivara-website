import { useEffect, useMemo, useState } from 'react';
import { AppLogo, type AppIconId } from './AppIcon';
import {
  CATALOGUE, CATEGORIES, iconFor, installedApps, installApp, launchApp,
  githubInstall, githubPlan, servicesStatus, openBundled,
  type CatalogueApp, type AppCategory,
} from '../lib/linuxApps';

/**
 * Every application, behind the 9-dot button.
 *
 * Three states per app, and the distinction is the whole point:
 *   installed  → click launches it
 *   available  → click installs it, then it launches (ordinary Linux package)
 *   service    → a self-hosted web app (Odoo, ERPNext, Twenty…). These are SERVERS — a database, a
 *                runtime, usually Docker — not programs. Clicking one shows what it actually needs
 *                and where it comes from, rather than a spinner that resolves into nothing.
 *
 * That last row is the honest part. Those tools are the real prize for a small business, and
 * pretending they are one click away would be the same category of lie as claiming an app launched
 * when it crashed.
 */
export default function AllApps({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<AppCategory | 'All'>('All');
  const [installed, setInstalled] = useState<Record<string, boolean> | null>(null);
  const [busy, setBusy] = useState<string>('');
  const [note, setNote] = useState('');
  const [services, setServices] = useState<Record<string, boolean> | null>(null);

  const refresh = () => {
    void installedApps().then(setInstalled);
    void servicesStatus().then(setServices);
  };
  useEffect(refresh, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return CATALOGUE.filter((a) => {
      if (cat !== 'All' && a.category !== cat) return false;
      if (!t) return true;
      return a.name.toLowerCase().includes(t)
        || a.blurb.toLowerCase().includes(t)
        || a.category.toLowerCase().includes(t);
    });
  }, [q, cat]);

  async function activate(app: CatalogueApp) {
    // A bundled business app: it ships with the OS and is already running, so clicking it just
    // opens it. If provisioning hasn't finished, say THAT rather than opening a window at a port
    // nothing is listening on — which looks exactly like a broken product.
    if (app.kind === 'bundled') {
      const up = services === null ? true : !!services[app.id];
      if (!up) { setNote(`${app.name} is still starting up. Give it a moment and try again.`); return; }
      const r = await openBundled(app.port || 0);
      if (r.ok) onClose(); else setNote(r.error);
      return;
    }

    // A GitHub project: ask what WOULD happen, then do it. Explaining first is the difference
    // between trust and a progress bar you have to believe.
    if (app.kind === 'github') {
      setBusy(app.id);
      setNote(`Looking at ${app.name}…`);
      const p = await githubPlan(app.repo || '');
      if (!p.ok) { setBusy(''); setNote(p.error || `${app.name} can't be installed automatically.`); return; }
      setNote(`${p.why} Installing…`);
      const r = await githubInstall(app.repo || '');
      setBusy('');
      setNote(r.ok ? `${app.name} installed.` : (r.error || `Could not install ${app.name}.`));
      refresh();
      return;
    }

    const isInstalled = installed === null ? true : !!installed[app.id];
    if (isInstalled) {
      const r = await launchApp(app.id);
      if (r.ok) onClose(); else setNote(r.error);
      return;
    }

    setBusy(app.id);
    setNote(`Installing ${app.name}… this can take a few minutes.`);
    const r = await installApp(app.id);
    setBusy('');
    if (!r.ok) { setNote(r.error); return; }
    setNote(`${app.name} installed.`);
    refresh();
    const l = await launchApp(app.id);
    if (l.ok) onClose();
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 30,
        background: 'rgba(10,8,16,.58)',
        backdropFilter: 'blur(30px) saturate(140%)',
        WebkitBackdropFilter: 'blur(30px) saturate(140%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 64, overflowY: 'auto',
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(1080px, 84vw)', paddingBottom: 60 }}>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search applications"
          style={{
            width: '100%', padding: '15px 20px', borderRadius: 16,
            background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
            color: 'var(--text)', outline: 'none', font: 'inherit', fontSize: 17,
          }}
        />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '20px 0 30px' }}>
          {(['All', ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCat(c as AppCategory | 'All')}
              style={{
                padding: '8px 16px', borderRadius: 999, fontSize: 13.5, cursor: 'pointer',
                border: '1px solid ' + (cat === c ? 'transparent' : 'rgba(255,255,255,.18)'),
                background: cat === c ? 'var(--accent)' : 'rgba(255,255,255,.07)',
                color: cat === c ? '#fff' : 'var(--text-muted)',
                font: 'inherit', fontWeight: cat === c ? 500 : 400,
              }}
            >{c}</button>
          ))}
        </div>

        {note && (
          <p style={{
            fontSize: 14, color: 'var(--text)', background: 'rgba(255,255,255,.09)',
            border: '1px solid rgba(255,255,255,.16)', borderRadius: 12,
            padding: '12px 16px', marginBottom: 24, lineHeight: 1.5,
          }}>{note}</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))', gap: 12 }}>
          {shown.map((app) => {
            const known = installed !== null;
            const isInstalled = !known || !!installed[app.id];
            const installing = busy === app.id;

            return (
              <button
                key={app.id}
                title={app.blurb}
                onClick={() => void activate(app)}
                disabled={installing}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 13,
                  background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)',
                  padding: 14, borderRadius: 18, cursor: installing ? 'default' : 'pointer',
                  color: 'var(--text)', font: 'inherit', textAlign: 'left',
                  transition: 'background .12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; }}
              >
                <div style={{ opacity: app.kind === 'app' && known && !isInstalled ? 0.55 : 1, flex: 'none' }}>
                  <AppLogo src={app.iconUrl} id={iconFor(app) as AppIconId} size={40} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.25 }}>{app.name}</div>
                  {/* The real product name, small, underneath — someone who knows it as "GIMP" or
                      "LibreOffice Calc" still finds it, while the big word stays the plain one. */}
                  {app.realName && (
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 3 }}>{app.realName}</div>
                  )}
                  <div style={{
                    fontSize: 11.5, marginTop: 5, lineHeight: 1.35,
                    color: app.kind === 'github' ? 'var(--accent-light)' : 'var(--text-faint)',
                  }}>
                    {installing ? 'Installing…'
                      : app.kind === 'bundled'
                        ? (services === null || services[app.id] ? 'Included' : 'Starting up…')
                      : app.kind === 'github' ? 'From GitHub · one click'
                      : known && !isInstalled ? 'Click to install'
                      : 'Installed'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {shown.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 15, marginTop: 40 }}>
            Nothing matches “{q}”.
          </p>
        )}

        <p style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: 13, marginTop: 40 }}>
          Esc to close
        </p>
      </div>

    </div>
  );
}
