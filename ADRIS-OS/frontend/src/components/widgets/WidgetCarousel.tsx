import { useEffect, useState, type ReactNode } from 'react';

export interface CarouselPage {
  id: string;
  content: ReactNode;
}

/**
 * ONE widget box holding several pages.
 *
 * **It no longer moves.** Dragging was solving a problem nobody actually has — and it caused a real
 * one: a position saved against an older layout dropped the box on top of the calendar. A desktop
 * that puts things where they belong is worth more than one that lets you rearrange it badly, so
 * the box sits where the layout puts it and the grab handle is gone with it.
 *
 * **Every page is the same height.** The card used to grow and shrink between pages, which made the
 * whole thing jump and slid the dots out from under the cursor — that reads as a glitch, not a
 * transition.
 *
 * Changing page: **arrows** (on hover, and always keyboard-reachable), **swipe**, **← →** keys, or
 * the **dots**. Four routes to the same thing, because an interface has to show what it can do.
 */
export default function WidgetCarousel({
  pages, width = 480, scale = 1,
}: {
  pages: CarouselPage[];
  width?: number;
  scale?: number;
}) {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [hover, setHover] = useState(false);
  const [swipeFrom, setSwipeFrom] = useState<{ x: number; y: number } | null>(null);

  const go = (next: number) => {
    const n = (next + pages.length) % pages.length;
    setDir(n > active || (active === pages.length - 1 && n === 0) ? 1 : -1);
    setActive(n);
  };

  // ← → while hovered. Scoped rather than global so it can never steal arrow keys from a text
  // field elsewhere on the desktop.
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
    // Not on a control — otherwise clicking the Council "Ask" button would also count as a swipe.
    if (el.closest('button, input, textarea, a')) return;
    setSwipeFrom({ x: e.clientX, y: e.clientY });
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!swipeFrom) return;
    const dx = e.clientX - swipeFrom.x;
    const dy = e.clientY - swipeFrom.y;
    setSwipeFrom(null);
    // Horizontal intent, past a threshold — so an ordinary click never flicks the page over.
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) go(active + (dx < 0 ? 1 : -1));
  }

  const page = pages[Math.min(active, pages.length - 1)];

  return (
    <div
      style={{ width, position: 'relative' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        onPointerDown={onPointerDown}
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
        {/* One height for every page — see the note above. Content is top-aligned so a shorter page
            leaves space at the bottom rather than floating in the middle. */}
        <div
          key={page?.id}
          style={{
            padding: Math.round(26 * scale),
            minHeight: Math.round(206 * scale),
            boxSizing: 'border-box',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
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

          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 16 }}>
            {pages.map((p, i) => (
              <button
                key={p.id}
                onClick={() => go(i)}
                title={p.id}
                aria-label={`Show ${p.id}`}
                aria-current={i === active}
                style={{
                  // A generous invisible hit area around a small dot: the dot is the signal, the
                  // padding is the target — how you meet a 24pt minimum without drawing 24pt circles.
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
        </>
      )}
    </div>
  );
}

/**
 * The page arrows.
 *
 * The first version was a grey circle bolted to the side of the card and read as a leftover browser
 * control. This one belongs to the plate: it half-overlaps the edge, uses the same glass as
 * everything else, and grows slightly under the cursor so it feels like a physical control rather
 * than a hit target. It fades in on hover but stays in the tab order and appears on focus, because
 * a control that only exists on hover is invisible to the keyboard.
 */
function Arrow({ side, show, onClick }: { side: 'left' | 'right'; show: boolean; onClick: () => void }) {
  const [over, setOver] = useState(false);
  const [focused, setFocused] = useState(false);
  const visible = show || focused;

  return (
    <button
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous' : 'Next'}
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => setOver(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        position: 'absolute',
        top: 'calc(50% - 40px)',
        [side]: -17,
        width: 44, height: 44, borderRadius: 999, padding: 0,
        cursor: 'pointer',
        background: over ? 'rgba(255,255,255,.2)' : 'var(--glass-bg)',
        border: '1px solid ' + (over ? 'rgba(255,255,255,.34)' : 'var(--border-soft)'),
        backdropFilter: 'blur(22px) saturate(160%)',
        WebkitBackdropFilter: 'blur(22px) saturate(160%)',
        color: 'var(--text)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: over
          ? '0 10px 26px -8px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.22) inset'
          : '0 6px 18px -8px rgba(0,0,0,.5), 0 1px 0 rgba(255,255,255,.14) inset',
        opacity: visible ? 1 : 0,
        transform: visible ? `scale(${over ? 1.08 : 1})` : 'scale(.9)',
        transition: 'opacity .18s ease, transform .18s cubic-bezier(.22,.61,.36,1), background .18s',
        // Not clickable while invisible, so a click on the wallpaper never turns a page.
        pointerEvents: visible ? 'auto' : 'none',
      } as React.CSSProperties}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d={side === 'left' ? 'M14.5 6.5l-5.5 5.5 5.5 5.5' : 'M9.5 6.5l5.5 5.5-5.5 5.5'} />
      </svg>
    </button>
  );
}
