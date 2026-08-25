import { useRef, useState, type ReactNode } from 'react';

export interface CarouselPage {
  id: string;
  content: ReactNode;
}

/**
 * ONE widget slot instead of several scattered ones — the fix for "widgets are making the page
 * crowded." Only one page shows at a time; the rest are a click (or a drag) away, with a row of
 * dots below stating exactly where you are: a solid dot for the page on screen, faint hollow ones
 * for the rest — the same pattern as a phone's home-screen page indicator, deliberately, since
 * it's already a gesture nobody has to be taught.
 *
 * This box also carries its own position (drag it anywhere; the spot is remembered per browser —
 * see the "yours to change" line in plan.md §9, applied to layout itself, not just theme). And the
 * page LIST is just an array — this is deliberately the shape an agent adding a new screen to the
 * stack would extend, per plan.md's "It notices your day and writes you a tool for it" target:
 * appending a page here is the whole of what that looks like from this component's side.
 */
export default function WidgetCarousel({
  pages, storageKey = 'adris-os.carousel.pos', width = 340,
}: {
  pages: CarouselPage[];
  storageKey?: string;
  width?: number;
}) {
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch { /* fall through to default */ }
    return { x: 0, y: 0 };
  });
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  function onPointerDown(e: React.PointerEvent) {
    // Only the header should start a drag — a click inside the body (a button, the outreach
    // "Ask" button) must not also drag the box out from under the click.
    if (!(e.target as HTMLElement).closest('[data-drag-handle]')) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: pos.x, baseY: pos.y };
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos({ x: dragRef.current.baseX + dx, y: dragRef.current.baseY + dy });
  }
  function onPointerUp() {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    try { localStorage.setItem(storageKey, JSON.stringify(pos)); } catch { /* not fatal */ }
  }

  const page = pages[Math.min(active, pages.length - 1)];

  return (
    <div style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, width, cursor: dragging ? 'grabbing' : undefined }}>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          width, borderRadius: 20, position: 'relative', overflow: 'hidden',
          background: 'var(--plate-bg)',
          backdropFilter: 'blur(var(--plate-blur)) saturate(150%)',
          WebkitBackdropFilter: 'blur(var(--plate-blur)) saturate(150%)',
          border: '1px solid var(--border-soft)',
          boxShadow: '0 1px 0 rgba(255,255,255,.14) inset, 0 18px 34px -18px rgba(0,0,0,.5)',
          color: 'var(--text)',
        }}
      >
        {/* A slim drag handle strip — the grab affordance lives here, not on the whole card, so
            nothing inside the widget (a click, a button) is ever mistaken for a drag start. */}
        <div
          data-drag-handle
          style={{
            height: 16, cursor: 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,.03)',
          }}
        >
          <div style={{ width: 28, height: 3, borderRadius: 999, background: 'rgba(255,255,255,.18)' }} />
        </div>
        <div style={{ padding: 16 }}>{page?.content}</div>
      </div>

      {/* The pager — solid = here, hollow/faint = elsewhere. Click any dot to jump straight to it. */}
      {pages.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginTop: 10 }}>
          {pages.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActive(i)}
              aria-label={`Show ${p.id}`}
              style={{
                width: 7, height: 7, borderRadius: '999px', padding: 0, cursor: 'pointer',
                border: i === active ? 'none' : '1px solid rgba(255,255,255,.4)',
                background: i === active ? '#fff' : 'transparent',
                boxShadow: i === active ? '0 0 6px rgba(255,255,255,.6)' : undefined,
                transition: 'background .15s, box-shadow .15s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
