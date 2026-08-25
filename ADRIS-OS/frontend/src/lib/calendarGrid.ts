// Shared by every month-grid (the Rail's mini calendar and the Calendar widget) so the "today"
// highlight and the "outside this month" dimming are computed once, not reimplemented per screen.

export interface CalDay {
  n: number;
  inMonth: boolean;
  isToday: boolean;
}

export function monthGrid(reference = new Date(), weekStartsMonday = true): CalDay[] {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const today = new Date();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = weekStartsMonday ? (firstOfMonth.getDay() + 6) % 7 : firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: CalDay[] = [];
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ n: daysInPrevMonth - startWeekday + 1 + i, inMonth: false, isToday: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      n: d,
      inMonth: true,
      isToday: d === today.getDate() && month === today.getMonth() && year === today.getFullYear(),
    });
  }
  while (cells.length < 35) {
    cells.push({ n: cells.length - startWeekday - daysInMonth + 1, inMonth: false, isToday: false });
  }
  return cells;
}
