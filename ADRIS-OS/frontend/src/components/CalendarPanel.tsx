import { monthGrid } from '../lib/calendarGrid';

/**
 * The calendar, as its own panel in the bottom-left — moved out of the rail, where it was eating
 * roughly a third of the vertical space for something glanced at a few times a day.
 *
 * Apple HIG, applied: the rail is the leading edge and carries what needs attention *now* (ask,
 * agenda, running agents). A month grid is reference material, so it goes to a corner where it is
 * available without competing. Type is 13px+ throughout — the desktop minimum is 10pt/13px and
 * body should sit at 13pt/17px, which the old 9px grid badly failed.
 */
export default function CalendarPanel() {
  const days = monthGrid();
  const now = new Date();
  const monthName = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div style={{
      width: 300,
      borderRadius: 20,
      padding: '18px 20px 20px',
      background: 'var(--plate-bg)',
      backdropFilter: 'blur(var(--plate-blur)) saturate(150%)',
      WebkitBackdropFilter: 'blur(var(--plate-blur)) saturate(150%)',
      border: '1px solid var(--border-soft)',
      boxShadow: '0 1px 0 rgba(255,255,255,.14) inset, 0 18px 34px -18px rgba(0,0,0,.5)',
      color: 'var(--text)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.01em' }}>{monthName}</div>
        <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Today {now.getDate()}</div>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2,
        fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', marginBottom: 6,
        fontWeight: 500,
      }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
        {days.map((d, i) => (
          <div
            key={i}
            style={{
              // 34px cells: comfortably above the 24pt desktop minimum for anything clickable,
              // and large enough that the numbers are actually readable rather than decorative.
              height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13,
              borderRadius: 9,
              color: d.isToday ? '#fff' : d.inMonth ? 'var(--text)' : 'var(--text-faint)',
              opacity: d.inMonth ? 1 : 0.35,
              background: d.isToday ? 'var(--accent)' : 'transparent',
              fontWeight: d.isToday ? 600 : 400,
            }}
          >
            {d.n}
          </div>
        ))}
      </div>
    </div>
  );
}
