import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { makeScale } from '../lib/colors';
import { fmtValue } from '../lib/format';
import { Flag, Segmented } from './ui';

const TOPS = [
  { id: 10, label: 'Top 10' },
  { id: 20, label: 'Top 20' },
  { id: 50, label: 'Top 50' },
];

export default function Leaderboard({ store, col, year, metricLabel, selectedIso, onSelect }) {
  const [q, setQ] = useState('');
  const [top, setTop] = useState(10);

  const ranking = useMemo(() => store.ranking(col, year), [store, col, year]);
  const scale = useMemo(() => makeScale(col, store.domainMax(col)), [store, col]);

  const term = q.trim().toLowerCase();
  const rows = useMemo(() => {
    if (!term) return ranking.slice(0, top);
    const rankOf = new Map(ranking.map((r) => [r.iso, r]));
    return store.list
      .filter((e) => e.name.toLowerCase().includes(term))
      .map((e) => ({ iso: e.iso, value: rankOf.get(e.iso)?.value ?? null, rank: rankOf.get(e.iso)?.rank ?? null }))
      .sort((a, b) => (a.rank ?? 1e9) - (b.rank ?? 1e9));
  }, [ranking, store, term, top]);

  const max = ranking[0]?.value || 1;
  // Per-capita leaders are often tiny refinery/tourism territories; sqrt keeps the rest of the list legible.
  const barPct = (v) => Math.max(1.5, (col === 'co2_per_capita' ? Math.sqrt(v / max) : v / max) * 100);

  return (
    <aside className="panel absolute inset-0 flex flex-col" aria-label="Emitter leaderboard">
      <header className="space-y-3 border-b border-red-900/30 px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="panel-title">Leading emitters</h2>
            <p className="text-xs text-slate-500">{metricLabel} in {year} · {ranking.length} countries reporting</p>
          </div>
        </div>
        <Segmented options={TOPS} value={top} onChange={setTop} label="List length" />
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a country"
            aria-label="Find a country"
            className="w-full rounded border border-slate-700 bg-ink-950/70 py-1.5 pl-8 pr-8 text-sm text-slate-200 placeholder:text-slate-600 focus:border-ember-500 focus:outline-none"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      <ol className="thin-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {rows.length === 0 && <li className="px-3 py-8 text-center text-sm text-slate-500">No country matches “{q}”.</li>}
        {rows.map((r) => {
          const e = store.byIso.get(r.iso);
          const has = r.value != null;
          return (
            <li key={r.iso}>
              <button
                type="button"
                onClick={() => has && onSelect(r.iso)}
                disabled={!has}
                aria-current={selectedIso === r.iso}
                className={`group w-full rounded px-2 py-1.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ember-500 ${
                  selectedIso === r.iso ? 'bg-red-950/50' : 'hover:bg-ink-800/80'
                } ${has ? '' : 'cursor-default opacity-50'}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="num w-7 text-right text-base text-slate-500">{r.rank ?? '–'}</span>
                  <Flag url={store.flagUrl(e)} name={e.name} />
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{e.name}</span>
                  <span className="num text-base text-slate-100">{has ? fmtValue(col, r.value) : 'No data'}</span>
                </div>
                <div className="ml-[2.375rem] mt-1 h-1 overflow-hidden rounded-full bg-ink-800">
                  {has && <div className="h-full rounded-full" style={{ width: `${barPct(r.value)}%`, background: scale.color(r.value) }} />}
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
