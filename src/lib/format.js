export const NA = '—';

const nf0 = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 });

/** Million tonnes -> "37.5 Gt" / "1,240 Mt" / "3.2 Mt" */
export function fmtMt(v) {
  if (v == null) return NA;
  const a = Math.abs(v);
  if (a >= 1000) return `${(v / 1000).toFixed(2)} Gt`;
  if (a >= 100) return `${nf0.format(v)} Mt`;
  if (a >= 1) return `${v.toFixed(1)} Mt`;
  return `${v.toFixed(2)} Mt`;
}

export const fmtPerCapita = (v) => (v == null ? NA : `${v.toFixed(2)} t`);

/** Format a value according to the column it came from. */
export const fmtValue = (col, v) => (col === 'co2_per_capita' ? fmtPerCapita(v) : fmtMt(v));

export const fmtCompact = (v) => (v == null ? NA : compact.format(v));
export const fmtUsd = (v) => (v == null ? NA : `$${compact.format(v)}`);
export const fmtShare = (v) => (v == null ? NA : `${v < 0.1 ? v.toFixed(3) : v.toFixed(2)}%`);
export const fmtPct = (v) => (v == null ? NA : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`);
export const fmtPercentOf = (v) => `${(v * 100).toFixed(1)}%`;

/** Compact axis labels for Mt series. */
export const axisMt = (v) => (Math.abs(v) >= 1000 ? `${+(v / 1000).toFixed(1)} Gt` : `${Math.round(v)} Mt`);

export function yearTicks(min, max) {
  const span = max - min;
  const step = span > 150 ? 50 : span > 60 ? 20 : span > 25 ? 10 : 5;
  const ticks = [];
  for (let y = Math.ceil(min / step) * step; y <= max; y += step) ticks.push(y);
  return ticks;
}
