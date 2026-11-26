// Money and date formatting for HomeLedger. Every figure the site shows goes
// through these helpers so amounts and dates read the same on every page.

export const TODAY = '2026-11-26';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// $1,234.56 — full precision for transaction rows and totals.
export function money(n) {
  const v = Number(n) || 0;
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// $1,235 — rounded, for big summary cards and chart labels.
export function money0(n) {
  const v = Number(n) || 0;
  return '$' + Math.round(v).toLocaleString('en-US');
}

// 34 — a whole-number percent for savings rate and budget bars.
export function pct(n) {
  return Math.round((Number(n) || 0) * 100);
}

// '2026-11' -> 'November 2026'
export function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

// '2026-11' -> 'Nov'
export function monthShort(ym) {
  return MONTHS_SHORT[Number(ym.split('-')[1]) - 1];
}

// '2026-11-03' -> 'Nov 3'
export function dateLabel(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${MONTHS_SHORT[m - 1]} ${d}`;
}

// '2026-11' -> '2026-10' (one month back; clamps at the earliest seeded month).
export function prevMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function nextMonth(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Escape user-entered text before it goes into the page.
export function escape(s) {
  return String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
