import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';
import { useEmissionsData } from './hooks/useEmissionsData';
import { DEFAULT_YEAR, describeMetric, PLAY_SPEEDS } from './lib/metrics';
import { axisMt, fmtMt, fmtPerCapita } from './lib/format';
import Header from './components/Header';
import ControlBar from './components/ControlBar';
import KpiStrip from './components/KpiStrip';
import WorldMap from './components/WorldMap';
import Leaderboard from './components/Leaderboard';
import BreakdownChart from './components/BreakdownChart';
import TrendChart from './components/TrendChart';
import CountryDrawer from './components/CountryDrawer';
import { Panel, Segmented } from './components/ui';

export default function App() {
  const { status, store, error } = useEmissionsData();

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-400" role="status">
        <Loader2 className="animate-spin text-crisis-500" size={32} />
        <p className="font-display text-xl tracking-wide">Loading emissions record…</p>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-start justify-center gap-3 px-6">
        <TriangleAlert className="text-crisis-500" size={32} />
        <h1 className="font-display text-3xl font-bold text-slate-100">Emissions data not found</h1>
        <p className="text-slate-400">
          The dashboard reads <code className="rounded bg-ink-800 px-1.5 py-0.5 text-ember-400">public/data/emissions.json</code>, which is generated from your CSV.
          Place <code className="rounded bg-ink-800 px-1.5 py-0.5">owid-co2-data.csv</code> in <code className="rounded bg-ink-800 px-1.5 py-0.5">./data</code>, run{' '}
          <code className="rounded bg-ink-800 px-1.5 py-0.5 text-ember-400">npm run prep</code>, then reload.
        </p>
        <p className="text-xs text-slate-600">{String(error?.message ?? error)}</p>
      </div>
    );
  }
  return <Dashboard store={store} />;
}

const GLOBAL_TRENDS = [
  { id: 'co2', label: 'CO₂', col: 'co2', y: axisMt, v: fmtMt },
  { id: 'ghg', label: 'All greenhouse gases', col: 'total_ghg', y: axisMt, v: (v) => `${fmtMt(v)} CO₂e` },
  { id: 'pc', label: 'Per capita', col: 'co2_per_capita', y: (v) => `${v.toFixed(1)} t`, v: fmtPerCapita },
];

function Dashboard({ store }) {
  const { yearMin, yearMax } = store.meta;
  const [year, setYear] = useState(() => Math.min(Math.max(DEFAULT_YEAR, yearMin), yearMax));
  const [metric, setMetric] = useState('co2');
  const [fuel, setFuel] = useState('coal');
  const [selectedIso, setSelectedIso] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState('normal');
  const [globalTrend, setGlobalTrend] = useState('co2');

  // Heavy panels follow the year a beat behind so scrubbing/playback stays smooth.
  const lazyYear = useDeferredValue(year);
  const { col, label, unit } = describeMetric(metric, fuel);

  const worldSeries = useMemo(() => store.series(store.world, 'co2'), [store]);
  const availableTrends = useMemo(() => GLOBAL_TRENDS.filter((t) => store.world.d[t.col]), [store]);
  const gt = availableTrends.find((t) => t.id === globalTrend) ?? availableTrends[0];
  const gtSeries = useMemo(() => store.series(store.world, gt.col), [store, gt]);

  // Timeline playback
  const yps = PLAY_SPEEDS.find((s) => s.id === speed).yps;
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setYear((y) => Math.min(y + 1, yearMax)), 1000 / yps);
    return () => clearInterval(id);
  }, [playing, yps, yearMax]);
  useEffect(() => {
    if (playing && year >= yearMax) setPlaying(false);
  }, [playing, year, yearMax]);
  const togglePlay = () => {
    if (!playing && year >= yearMax) setYear(yearMin);
    setPlaying((p) => !p);
  };

  const closeDrawer = useCallback(() => setSelectedIso(null), []);
  const pickYear = useCallback((y) => setYear(Math.min(yearMax, Math.max(yearMin, y))), [yearMin, yearMax]);

  return (
    <div className="min-h-screen">
      <Header meta={store.meta} />
      <ControlBar
        store={store} year={year} setYear={setYear} playing={playing} onTogglePlay={togglePlay}
        speed={speed} setSpeed={setSpeed} metric={metric} setMetric={setMetric} fuel={fuel} setFuel={setFuel}
        worldSeries={worldSeries}
      />

      <main className="mx-auto max-w-[1800px] space-y-4 px-4 py-4 lg:px-6">
        <KpiStrip store={store} year={lazyYear} />

        <section className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <WorldMap store={store} year={year} col={col} metricLabel={label} unit={unit} selectedIso={selectedIso} onSelect={setSelectedIso} />
          </div>
          <div className="relative h-[560px] lg:col-span-4 lg:h-auto">
            <Leaderboard store={store} col={col} year={lazyYear} metricLabel={label} selectedIso={selectedIso} onSelect={setSelectedIso} />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-12">
          <Panel className="lg:col-span-5" title="Where the carbon comes from" subtitle={`World CO₂ by source, ${lazyYear}`}>
            <BreakdownChart store={store} entity={store.world} year={lazyYear} onPick={pickYear} height={250} />
          </Panel>
          <Panel
            className="lg:col-span-7"
            title="Global emissions through time"
            subtitle={`${yearMin}–${yearMax} · click the chart to move the timeline`}
            actions={<Segmented options={availableTrends} value={gt.id} onChange={setGlobalTrend} label="Global indicator" />}
          >
            <TrendChart data={gtSeries} year={lazyYear} onPick={pickYear} yFormat={gt.y} valueFormat={gt.v} name={gt.label} gradientId={`global-${gt.id}`} height={290} />
          </Panel>
        </section>

        <footer className="pb-6 pt-2 text-xs text-slate-600">
          Source: Our World in Data CO₂ and greenhouse gas emissions dataset (Global Carbon Project, Jones et al., PRIMAP-hist). Territorial emissions; countries without a figure for the chosen year appear dark grey.
        </footer>
      </main>

      {selectedIso && <CountryDrawer store={store} iso={selectedIso} year={year} onYearChange={pickYear} onClose={closeDrawer} />}
    </div>
  );
}
