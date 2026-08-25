import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface CarouselPage {
  id: string;
  content: ReactNode;
}

/**
 * ONE widget box holding several pages — the answer to "the widgets make the page crowded."
 *
 * The first version had a real problem: there was no obvious way to change page. Dots existed but
 * read as decoration, and nothing else responded. HIG is explicit that an interface must show what
 * it can do, so navigation is now four ways, all doing the same thing:
 *
 *   - **arrows** on either side (visible on hover, always keyboard-reachable)
 *   - **swipe/drag** horizontally across the body
 *   - **← →** arrow keys
 *   - **dots**, which were always clickable and now look it — bigger, with a hit area to match
 *
 * The page also *slides* rather than swapping instantly. That is not decoration: the movement is
 * what tells you a sideways thing happened and which direction it went, which is exactly the
 * information a hard cut throws away.
 *
 * The box is draggable by its top handle and remembers where it was put.
 */
export default function WidgetCarousel({
  pages, storageKey = 'adris-os.carousel.pos', width = 480,
}: {
  pages: CarouselPage[];
  storageKey?: string;
  width?: number;
}) {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [hover, setHover] = useState(false);

  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch { /* default below */ }
    return { x: 0, y: 0 };
  });

  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const go = (next: number) => {
    const n = (next + pages.length) % pages.length;
    setDir(n > active || (active === pages.length - 1 && n === 0) ? 1 : -1);
    setActive(n);
  };

  // ← → change page whenever the box is hovered or focused. Scoped rather than global so it can
  // never steal arrow keys from a text field elsewhere on the desktop.
  useEffect(() => {
    if (!hover) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(active + 1); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); go(active - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hover, active, pages.length]);

  function onPointerDown(e: React.PointerEvent) {
    const el = e.target as HTMLElement;
    if (el.closest('[data-drag-handle]')) {
      el.setPointerCapture(e.pointerId);
      dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: pos.x, baseY: pos.y };
      setDragging(true);
      return;
    }
    // Anywhere else in the body starts a potential swipe — but not on a control, or a click on the
    // Council "Ask" button would also count as a page change.
    if (!el.closest('button, input, textarea, a')) {
      swipeRef.current = { x: e.clientX, y: e.clientY };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    setPos({
      x: dragRef.current.baseX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.baseY + (e.clientY - dragRef.current.startY),
    });
  }

  function onPointerUp(e: React.PointerEvent) {
    if (dragRef.current) {
      dragRef.current = null;
      setDragging(false);
      try { localStorage.setItem(storageKey, JSON.stringify(pos)); } catch { /* not fatal */ }
      return;
    }
    if (swipeRef.current) {
      const dx = e.clientX - swipeRef.current.x;
      const dy = e.clientY - swipeRef.current.y;
      swipeRef.current = null;
      // Horizontal intent only, and past a threshold — otherwise an ordinary click would flick the
      // page over.
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) go(active + (dx < 0 ? 1 : -1));
    }
  }

  const page = pages[Math.min(active, pages.length - 1)];

  return (
    <div
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, width, cursor: dragging ? 'grabbing' : undefined }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ position: 'relative' }}>
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            width, borderRadius: 24, position: 'relative', overflow: 'hidden',
            background: 'var(--plate-bg)',
            backdropFilter: 'blur(var(--plate-blur)) saturate(150%)',
            WebkitBackdropFilter: 'blur(var(--plate-blur)) saturate(150%)',
            border: '1px solid var(--border-soft)',
            boxShadow: '0 1px 0 rgba(255,255,255,.14) inset, 0 22px 44px -20px rgba(0,0,0,.55)',
            color: 'var(--text)',
          }}
        >
          <div
            data-drag-handle
            title="Drag to move"
            style={{
              height: 20, cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,.04)',
            }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(255,255,255,.22)' }} />
          </div>

          {/* key on the page id re-runs the slide animation on every change, which is what makes
              the direction legible. */}
          <div
            key={page?.id}
            style={{
              padding: 26,
              animation: `adrisSlide${dir > 0 ? 'Left' : 'Right'} .26s cubic-bezier(.22,.61,.36,1)`,
            }}
          >
            {page?.content}
          </div>
        </div>

        {pages.length > 1 && (
          <>
            <Arrow side="left"  show={hover} onClick={() => go(active - 1)} />
            <Arrow side="right" show={hover} onClick={() => go(active + 1)} />
          </>
        )}
      </div>

      {pages.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 16 }}>
          {pages.map((p, i) => (
            <button
              key={p.id}
              onClick={() => go(i)}
              title={p.id}
              aria-label={`Show ${p.id}`}
              aria-current={i === active}
              style={{
                // A generous invisible hit area around a small dot — the dot is the signal, the
                // padding is the target, which is how you satisfy a 24pt minimum without drawing
                // 24pt circles.
                background: 'transparent', border: 'none', padding: '8px 6px',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
              }}
            >
              <span style={{
                display: 'block',
                width: i === active ? 26 : 9, height: 9, borderRadius: 999,
                background: i === active ? '#fff' : 'rgba(255,255,255,.38)',
                boxShadow: i === active ? '0 0 10px rgba(255,255,255,.5)' : undefined,
                transition: 'width .24s cubic-bezier(.22,.61,.36,1), background .18s',
              }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Arrow({ side, show, onClick }: { side: 'left' | 'right'; show: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous' : 'Next'}
      style={{
        position: 'absolute', top: '50%', [side]: -20, transform: 'translateY(-50%)',
        width: 40, height: 40, borderRadius: 999, cursor: 'pointer',
        background: 'var(--glass-bg)', border: '1px solid var(--border)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        // Fades in on hover but never leaves the tab order — a control that only exists on hover
        // is invisible to the keyboard, which HIG treats as an accessibility failure.
        opacity: show ? 1 : 0, transition: 'opacity .18s',
        boxShadow: '0 6px 18px -6px rgba(0,0,0,.5)',
      } as React.CSSProperties}
      onFocus={(e) => { e.currentTarget.style.opacity = '1'; }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={side === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
      </svg>
    </button>
  );
}
