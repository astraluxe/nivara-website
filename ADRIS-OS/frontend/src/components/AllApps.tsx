import { useEffect, useMemo, useState } from 'react';
import AppIcon, { type AppIconId } from './AppIcon';
import {
  CATALOGUE, CATEGORIES, iconFor, installedApps, installApp, launchApp,
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
  const [detail, setDetail] = useState<CatalogueApp | null>(null);

  const refresh = () => { void installedApps().then(setInstalled); };
  useEffect(refresh, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (detail) setDetail(null); else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, detail]);

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
    if (app.kind === 'service') { setDetail(app); return; }

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
            const isService = app.kind === 'service';
            const known = installed !== null;
            const isInstalled = !known || !!installed[app.id];
            const installing = busy === app.id;

            return (
              <button
                key={app.id}
                title={isService ? `${app.name} — self-hosted service` : `${app.name}${app.exec ? ` — ${app.exec}` : ''}`}
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
                <div style={{ opacity: !isService && known && !isInstalled ? 0.5 : 1, flex: 'none' }}>
                  <AppIcon id={iconFor(app) as AppIconId} size={40} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.25 }}>{app.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 5, lineHeight: 1.35 }}>
                    {installing ? 'Installing…'
                      : isService ? 'Self-hosted · needs setup'
                      : known && !isInstalled ? 'Click to install'
                      : app.category}
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

      {detail && <ServiceDetail app={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

/**
 * What a self-hosted service actually involves.
 *
 * Shown instead of pretending to install it. Every one of these is genuinely worth running — an
 * open-source CRM or ERP on your own hardware is exactly the "your data stays yours" promise — but
 * each is a server stack, and a business owner deserves to know that before they start rather than
 * after.
 */
function ServiceDetail({ app, onClose }: { app: CatalogueApp; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 40,
        background: 'rgba(6,5,10,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 88vw)', borderRadius: 22, padding: 28,
          background: 'var(--plate-bg)',
          backdropFilter: 'blur(var(--plate-blur)) saturate(150%)',
          WebkitBackdropFilter: 'blur(var(--plate-blur)) saturate(150%)',
          border: '1px solid var(--border-soft)',
          boxShadow: '0 24px 60px -20px rgba(0,0,0,.7)',
          color: 'var(--text)',
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <AppIcon id={iconFor(app) as AppIconId} size={56} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>{app.name}</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>{app.blurb}</div>
          </div>
        </div>

        <div style={{
          marginTop: 22, padding: 16, borderRadius: 14,
          background: 'rgba(237,174,73,.1)', border: '1px solid rgba(237,174,73,.3)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warn)', marginBottom: 8 }}>
            Not a one-click install
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>
            {app.name} is a web application you run on your own machine — it needs{' '}
            <b style={{ color: 'var(--text)' }}>{app.needs}</b>, not just a program to open. Once it
            is running you reach it in the browser, and your data never leaves this computer.
          </div>
        </div>

        {app.repo && (
          <div style={{ marginTop: 18, fontSize: 13, color: 'var(--text-faint)', wordBreak: 'break-all' }}>
            Source: {app.repo}
          </div>
        )}

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '11px 22px', borderRadius: 12, fontSize: 14, cursor: 'pointer',
              background: 'var(--well-bg)', border: '1px solid var(--well-border)',
              color: 'var(--text)', font: 'inherit',
            }}
          >Close</button>
        </div>
      </div>
    </div>
  );
}
