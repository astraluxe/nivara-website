import { useState } from 'react';
import { WALLPAPERS } from '../lib/wallpapers';

/**
 * Screen 06 from the design — two tabs. Gallery is real and wired: it reads WALLPAPERS (currently
 * one image, extensible — see lib/wallpapers.ts) and applies a pick immediately. Generate is the
 * agent-coded path from plan.md §6 ("a wallpaper an agent codes for you") — the UI is built exactly
 * as designed, but NOT wired to a real agent yet. Pressing Generate here is honest about that
 * rather than faking a result: it shows what the flow will look like and stops.
 */
export default function WallpaperPicker({
  selectedId, onSelect, onClose,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'gallery' | 'generate'>('gallery');

  return (
    <div style={{
      width: 1000, borderRadius: 16, overflow: 'hidden', background: 'var(--well-bg)',
      border: '1px solid var(--border)', color: 'var(--text)', boxShadow: '0 30px 70px rgba(0,0,0,.5)',
    }}>
      <div style={{ height: 38, display: 'flex', alignItems: 'center', padding: '0 6px 0 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 12.5, fontWeight: 500 }}>Wallpaper</div>
        <button onClick={onClose} style={{
          marginLeft: 'auto', width: 28, height: 24, borderRadius: 6, border: 'none', background: 'transparent',
          color: 'var(--text-faint)', fontSize: 11, cursor: 'pointer', font: 'inherit',
        }}>✕</button>
      </div>
      <div style={{ display: 'flex', gap: 6, padding: '12px 16px 0' }}>
        <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 11, background: 'var(--well-bg)', width: 'max-content' }}>
          <Tab active={tab === 'gallery'} onClick={() => setTab('gallery')}>Gallery</Tab>
          <Tab active={tab === 'generate'} onClick={() => setTab('generate')}>Generate</Tab>
        </div>
      </div>
      {tab === 'gallery'
        ? <GalleryTab selectedId={selectedId} onSelect={onSelect} />
        : <GenerateTab />}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 18px', borderRadius: 8, fontSize: 12.5, border: 'none', cursor: 'pointer', font: 'inherit',
      background: active ? 'var(--accent)' : 'transparent',
      color: active ? '#fff' : 'var(--text-muted)',
      fontWeight: active ? 500 : 400,
    }}>{children}</button>
  );
}

function GalleryTab({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div style={{ padding: 22, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      {WALLPAPERS.map((w) => (
        <button
          key={w.id}
          onClick={() => onSelect(w.id)}
          title={w.name}
          style={{
            width: 160, height: 100, borderRadius: 12, cursor: 'pointer', padding: 0,
            border: w.id === selectedId ? '2px solid var(--accent)' : '1px solid var(--border)',
            backgroundImage: w.src ? `url(${w.src})` : w.swatch,
            backgroundSize: 'cover', backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute', bottom: 6, left: 6, right: 6, fontSize: 10.5, color: '#fff',
            textShadow: '0 1px 4px rgba(0,0,0,.7)', textAlign: 'left',
          }}>{w.name}</div>
        </button>
      ))}
      {/* Where the next images land — nothing to build here, just drop the file in
          public/wallpapers/ and add one line to lib/wallpapers.ts. */}
      <div style={{
        width: 160, height: 100, borderRadius: 12, border: '1px dashed var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', padding: 8,
      }}>More go here — drop a file in wallpapers/</div>
    </div>
  );
}

function GenerateTab() {
  const [prompt, setPrompt] = useState('Something calm, dark blue, moving slowly');
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  // NOT WIRED. This intentionally does nothing but show the shape of the request — see the
  // component doc comment. When a real agent bridge exists, this is the one function that changes.
  function generate() {
    setBusy(true);
    setLog(['› sent to the agent runtime…']);
    window.setTimeout(() => {
      setLog((l) => [...l, '⚠ no agent runtime connected yet — this is a UI preview, not a real generation']);
      setBusy(false);
    }, 900);
  }

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: 400, padding: 22, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 9 }}>Describe the wallpaper you want</div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{
              width: '100%', padding: '14px 15px', borderRadius: 12, border: '1px solid rgba(124,92,255,.45)',
              background: 'rgba(124,92,255,.07)', color: 'var(--text)', fontSize: 13.5, lineHeight: 1.5,
              minHeight: 64, font: 'inherit', resize: 'vertical',
            }}
          />
        </div>
        <button
          onClick={generate}
          disabled={busy}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 12,
            borderRadius: 12, background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 500,
            border: 'none', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1, font: 'inherit',
          }}
        >{busy ? 'Generating…' : 'Generate'}</button>
        <div className="mono" style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
          {log.map((l, i) => <div key={i} style={{ color: l.startsWith('⚠') ? 'var(--warn)' : undefined }}>{l}</div>)}
          <div>› claude code · codex and local qwen also available (not connected)</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 13, textAlign: 'center' }}>
        A generated preview will render here once an agent runtime is connected.<br />See plan.md §6.
      </div>
    </div>
  );
}
