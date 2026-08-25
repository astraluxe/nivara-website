import { useEffect, useState } from 'react';

/**
 * adris OS sizes itself to the screen it is on.
 *
 * Every dimension in the shell used to be a fixed pixel number chosen against one 1920×1080 test
 * window. On a laptop panel that is oversized; on a 1440p or 4K display the whole interface shrinks
 * into the middle and looks like a phone app someone stretched. Neither reads as premium — premium
 * is when the proportions look deliberate at whatever size the window happens to be.
 *
 * So the shell asks the screen how big it is and derives from that:
 *   - `scale` multiplies type and spacing, clamped so it never becomes unreadable or cartoonish
 *   - `rail` and `dockIcon` get their own sizes, because a panel and an icon do not scale the same
 *     way a font does — a rail at a fixed 340px swallows a small screen and floats on a large one
 *
 * HIG's rule is "design for full-screen first, and only switch to a compact view when the full
 * layout no longer fits". The breakpoint below is exactly that: not an arbitrary phone-style
 * breakpoint, but the point where this specific layout genuinely stops working.
 */
export interface ScreenScale {
  /** Multiplier for type and spacing. 1 at ~1440px wide. */
  scale: number;
  /** Width of the right rail in px. */
  rail: number;
  /** Dock icon size in px. */
  dockIcon: number;
  /** Widget box width in px. */
  widget: number;
  /** Calendar panel width in px. */
  calendar: number;
  /** True when the screen is too small for the calendar panel to earn its space. */
  compact: boolean;
  w: number;
  h: number;
}

function compute(w: number, h: number): ScreenScale {
  // Reference size. Everything is expressed as "how much bigger or smaller than this".
  const REF = 1440;

  // Scale on the smaller of the two axes, so a short wide window doesn't get huge type that then
  // has nowhere to go vertically.
  const raw = Math.min(w / REF, h / 900);
  // Clamped hard: below .82 text stops being comfortably readable, above 1.35 the interface starts
  // looking like a kiosk rather than a desktop.
  const scale = Math.max(0.82, Math.min(1.35, raw));

  // The rail is ~21% of width but never silly in either direction. A fixed 340px rail was eating a
  // third of a smaller screen — exactly the complaint that prompted this.
  const rail = Math.round(Math.max(264, Math.min(392, w * 0.21)));

  const dockIcon = Math.round(Math.max(44, Math.min(62, 54 * scale)));
  const widget = Math.round(Math.max(380, Math.min(560, (w - rail) * 0.46)));
  const calendar = Math.round(Math.max(250, Math.min(330, 300 * scale)));

  // Under ~1100px wide the calendar and the widget box start fighting for the same space; the
  // calendar is the one that yields, since it is reference material and the rail still carries the
  // day's agenda.
  const compact = w < 1100 || h < 700;

  return { scale, rail, dockIcon, widget, calendar, compact, w, h };
}

export function useScreenScale(): ScreenScale {
  const [s, setS] = useState<ScreenScale>(() =>
    compute(typeof window === 'undefined' ? 1440 : window.innerWidth,
            typeof window === 'undefined' ? 900 : window.innerHeight));

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      // Coalesce to one update per frame — a resize drag fires this continuously otherwise.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setS(compute(window.innerWidth, window.innerHeight)));
    };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', onResize); };
  }, []);

  return s;
}

/** Round a scaled px value so it renders crisply. */
export function px(base: number, scale: number): number {
  return Math.round(base * scale);
}
