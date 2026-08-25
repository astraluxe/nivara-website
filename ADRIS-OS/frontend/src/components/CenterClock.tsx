import { useEffect, useState } from 'react';

/**
 * The big, centered time — the thing your eye actually goes to first on a real desktop lock
 * screen, which is the reference this borrows from rather than a generic dashboard clock. Lives
 * once, here, top-centre; the rail no longer carries its own separate clock underneath it (removed
 * — showing the time twice on one screen is the same complaint as the old duplicate Calendar).
 */
export default function CenterClock({ scale = 1 }: { scale?: number }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000 * 15);
    return () => window.clearInterval(id);
  }, []);

  const h = now.getHours() % 12 || 12;
  const m = String(now.getMinutes()).padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const day = now.toLocaleDateString(undefined, { weekday: 'long' });
  const date = now.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });

  return (
    <div style={{
      // Centred on the WHOLE screen, not on the space left of the rail. The rail is a floating
      // inset card now, so the wallpaper runs edge to edge behind it — centring against anything
      // narrower left the clock visibly off to the left, which is exactly how it looked.
      position: 'absolute', top: Math.round(62 * scale), left: 0, right: 0, zIndex: 1,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      pointerEvents: 'none', textShadow: '0 2px 24px rgba(0,0,0,.35)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        <div style={{ fontSize: Math.round(92 * scale), fontWeight: 600, letterSpacing: '-.045em', lineHeight: 0.9 }}>{h}:{m}</div>
        <div className="mono" style={{ fontSize: Math.round(21 * scale), color: 'var(--text-muted)', paddingBottom: Math.round(14 * scale) }}>{ampm}</div>
      </div>
      <div style={{ fontSize: Math.round(17 * scale), color: 'var(--text-muted)', marginTop: Math.round(9 * scale), letterSpacing: '.01em' }}>
        {day} · {date}
      </div>
    </div>
  );
}
