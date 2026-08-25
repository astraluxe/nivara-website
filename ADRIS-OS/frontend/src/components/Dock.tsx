import { useState } from 'react';
import { LINUX_APPS, launchApp, type LinuxApp } from '../lib/linuxApps';

/**
 * The dock — REAL applications, not decorative icons.
 *
 * These are the ordinary Ubuntu apps that come with the distribution (see plan.md §11's "Why
 * Ubuntu"): LibreOffice Writer/Calc/Impress, Files, the text editor, the terminal. The whole point
 * of building on a real distribution is that we don't reimplement a word processor — the plan has
 * always been that agents drive these real applications. So the dock launches the real thing.
 *
 * `launchApp` posts to the small local agent bridge (see vm/agent-bridge.mjs) which runs the
 * command inside the VM. When that bridge isn't running — e.g. someone opened this in a plain
 * browser on Windows — the click says so plainly instead of appearing to work.
 */
export default function Dock({ railWidth }: { railWidth: number }) {
  const [note, setNote] = useState('');

  async function open(app: LinuxApp) {
    setNote(`Opening ${app.name}…`);
    const res = await launchApp(app.id);
    setNote(res.ok ? `${app.name} opened` : res.error);
    window.setTimeout(() => setNote(''), 4000);
  }

  return (
    <div style={{ position: 'absolute', bottom: 14, left: 0, right: railWidth, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 2 }}>
      {note && (
        <div style={{
          fontSize: 11, padding: '5px 12px', borderRadius: 999, color: 'var(--text)',
          background: 'var(--glass-bg)', backdropFilter: 'blur(var(--glass-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-blur))', border: '1px solid var(--border)',
          maxWidth: 560, textAlign: 'center',
        }}>{note}</div>
      )}
      <div style={{
        display: 'flex', gap: 8, padding: '8px 11px', borderRadius: 18,
        background: 'var(--glass-bg)', border: '1px solid var(--border)',
        backdropFilter: 'blur(var(--glass-blur))', WebkitBackdropFilter: 'blur(var(--glass-blur))',
        boxShadow: '0 12px 30px -12px rgba(0,0,0,.5)',
      }}>
        {LINUX_APPS.map((app) => (
          <button
            key={app.id}
            title={`${app.name} — ${app.exec}`}
            onClick={() => void open(app)}
            style={{
              width: 40, height: 40, borderRadius: 11, cursor: 'pointer',
              background: 'var(--well-bg)', border: '1px solid var(--well-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 19, lineHeight: 1, padding: 0, transition: 'transform .12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
          >{app.icon}</button>
        ))}
      </div>
    </div>
  );
}
