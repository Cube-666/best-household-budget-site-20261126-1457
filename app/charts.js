// Hand-drawn SVG charts for HomeLedger. No chart library: the whole first
// load stays a few kilobytes, and every chart is built from the household's
// own figures.

import { money0, monthShort } from './format.js';

// Donut of spending by category. parts: [{label, color, spent}].
// Returns the SVG plus a legend list, so the chart reads without colour.
export function donutChart(parts, size = 220) {
  const total = parts.reduce((sum, p) => sum + p.spent, 0);
  if (total <= 0) return '<p class="empty">No spending recorded this month yet.</p>';
  const radius = 84;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  const segments = parts
    .map((p) => {
      const frac = p.spent / total;
      const len = frac * circ;
      const dash = `${Math.max(len - 2, 1).toFixed(1)} ${(circ - len + 2).toFixed(1)}`;
      const svg = `<circle r="${radius}" cx="110" cy="110" fill="none" stroke="${p.color}" stroke-width="26" stroke-dasharray="${dash}" stroke-dashoffset="${(-offset).toFixed(1)}" />`;
      offset += len;
      return svg;
    })
    .join('');
  const legend = parts
    .map(
      (p) => `<li><span class="dot" style="background:${p.color}"></span>${p.label}<b>${money0(p.spent)}</b><span class="share">${Math.round((p.spent / total) * 100)}%</span></li>`,
    )
    .join('');
  return `<div class="donut-wrap">
    <svg viewBox="0 0 220 220" width="${size}" height="${size}" role="img" aria-label="Spending by category, total ${money0(total)}">
      <circle r="${radius}" cx="110" cy="110" fill="none" stroke="#efe9dc" stroke-width="26" />
      ${segments}
      <text x="110" y="104" text-anchor="middle" class="donut-total">${money0(total)}</text>
      <text x="110" y="126" text-anchor="middle" class="donut-label">spent</text>
    </svg>
    <ul class="legend">${legend}</ul>
  </div>`;
}

// Grouped bars: income vs spending for each month. months: [{month, income, spending}].
export function cashFlowChart(months) {
  if (!months.length) return '<p class="empty">No months recorded yet.</p>';
  const max = Math.max(...months.flatMap((m) => [m.income, m.spending]), 1);
  const W = 560;
  const H = 220;
  const base = H - 28;
  const groupW = W / months.length;
  const barW = Math.min(22, (groupW - 24) / 2);
  const bars = months
    .map((m, i) => {
      const cx = i * groupW + groupW / 2;
      const ih = (m.income / max) * (H - 60);
      const sh = (m.spending / max) * (H - 60);
      return `<g>
        <rect x="${(cx - barW - 3).toFixed(1)}" y="${(base - ih).toFixed(1)}" width="${barW}" height="${ih.toFixed(1)}" rx="3" fill="#14532d" />
        <rect x="${(cx + 3).toFixed(1)}" y="${(base - sh).toFixed(1)}" width="${barW}" height="${sh.toFixed(1)}" rx="3" fill="#d97706" />
        <text x="${cx.toFixed(1)}" y="${(base + 18).toFixed(1)}" text-anchor="middle" class="axis">${monthShort(m.month)}</text>
        <text x="${cx.toFixed(1)}" y="${(base - Math.max(ih, sh) - 8).toFixed(1)}" text-anchor="middle" class="bar-value">${money0(m.income)}</text>
      </g>`;
    })
    .join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="cashflow" role="img" aria-label="Monthly income and spending for the last six months">
    <line x1="0" y1="${base}" x2="${W}" y2="${base}" stroke="#d8d2c2" stroke-width="1" />
    ${bars}
  </svg>
  <p class="chart-key"><span class="key"><i style="background:#14532d"></i>Income</span><span class="key"><i style="background:#d97706"></i>Spending</span></p>`;
}

// A horizontal progress bar for a budget row or a savings goal.
export function progressBar(frac, over = false) {
  const clamped = Math.max(0, Math.min(1, frac));
  const cls = over ? 'bar over' : 'bar';
  return `<div class="${cls}"><span style="width:${(clamped * 100).toFixed(1)}%"></span></div>`;
}
