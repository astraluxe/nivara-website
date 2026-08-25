import { monthGrid } from '../lib/calendarGrid';

/** The 7x5 day grid used by both the Rail's mini calendar and the Calendar widget. */
export default function MonthGrid({ dense }: { dense?: boolean }) {
  const days = monthGrid();
  const size = dense ? 9 : 9;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
      {days.map((d, i) => (
        <div
          key={i}
          style={{
            textAlign: 'center',
            fontSize: size,
            padding: '3px 0',
            borderRadius: 5,
            color: d.inMonth ? 'var(--text)' : 'var(--text-faint)',
            opacity: d.inMonth ? 1 : 0.4,
            background: d.isToday ? 'var(--accent)' : 'transparent',
            fontWeight: d.isToday ? 600 : 400,
          }}
        >
          {d.n}
        </div>
      ))}
    </div>
  );
}
