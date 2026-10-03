import { useEffect, useMemo, useState } from 'react';
import { yearTicks } from '../lib/format';

const VB_W = 1000;
const VB_H = 100;

/** A range input laid over the world's CO₂ curve: drag through time and watch the curve fill in. */
export default function YearScrubber({ min, max, year, onChange, worldSeries }) {
  const { area, line } = useMemo(() => {
    const pts = worldSeries.filter((p) => p.value != null);
    if (pts.length < 2) return { area: '', line: '' };
    const top = Math.max(...pts.map((p) => p.value));
    const xy = pts.map((p) => [((p.year - min) / (max - min)) * VB_W, VB_H - (p.value / top) * (VB_H - 8)]);
    const l = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    return { line: l, area: `${l} L${xy[xy.length - 1][0]},${VB_H} L${xy[0][0]},${VB_H} Z` };
  }, [worldSeries, min, max]);

  const pct = ((year - min) / (max - min)) * 100;
  const ticks = useMemo(() => yearTicks(min, max), [min, max]);

  return (
    <div className="min-w-[220px] flex-1">
      <div className="relative h-14 overflow-hidden rounded border border-slate-700 bg-ink-950/70">
        <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" aria-hidden>
          <defs>
            <clipPath id="scrub-past"><rect x="0" y="0" width={(pct / 100) * VB_W} height={VB_H} /></clipPath>
            <linearGradient id="scrub-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="1" stopColor="#7f1d1d" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <path d={area} fill="#1e293b" />
          <path d={area} fill="url(#scrub-fill)" clipPath="url(#scrub-past)" />
          <path d={line} fill="none" stroke="#f97316" strokeWidth="1.5" vectorEffect="non-scaling-stroke" clipPath="url(#scrub-past)" />
        </svg>
        <input
          type="range"
          className="scrubber relative"
          min={min}
          max={max}
          step={1}
          value={year}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Year"
          aria-valuetext={String(year)}
        />
      </div>
      <div className="relative mt-1 h-4 text-[11px] text-slate-500" aria-hidden>
        {ticks.map((t) => (
          <span key={t} className="num absolute -translate-x-1/2" style={{ left: `${((t - min) / (max - min)) * 100}%` }}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export function YearInput({ min, max, year, onChange }) {
  const [txt, setTxt] = useState(String(year));
  useEffect(() => setTxt(String(year)), [year]);

  const commit = () => {
    const n = Math.round(Number(txt));
    if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
    else setTxt(String(year));
  };

  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      value={txt}
      onChange={(e) => {
        setTxt(e.target.value);
        const n = Number(e.target.value);
        if (e.target.value.length === 4 && n >= min && n <= max) onChange(n);
      }}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
      aria-label="Enter a year"
      className="num w-20 rounded border border-slate-700 bg-ink-950/70 px-2 py-1.5 text-center text-xl text-slate-100 focus:border-ember-500 focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
}
