import { Pause, Play, RotateCcw } from 'lucide-react';
import { FUELS, METRICS, PLAY_SPEEDS } from '../lib/metrics';
import { Segmented } from './ui';
import YearScrubber, { YearInput } from './YearScrubber';

export default function ControlBar({ store, year, setYear, playing, onTogglePlay, speed, setSpeed, metric, setMetric, fuel, setFuel, worldSeries }) {
  const { yearMin, yearMax } = store.meta;
  const atEnd = year >= yearMax;

  return (
    <div className="sticky top-0 z-30 border-b border-red-900/40 bg-ink-950/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 lg:px-6">
        {/* Time */}
        <div className="flex flex-1 flex-wrap items-center gap-3 sm:flex-nowrap" style={{ minWidth: 'min(100%, 460px)' }}>
          <div className="num text-6xl font-semibold leading-none text-crisis-500 [text-shadow:0_0_26px_rgba(239,68,68,.55)]" aria-live="off">
            {year}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost !h-10 !w-10 !p-0" onClick={onTogglePlay} aria-label={playing ? 'Pause timeline' : atEnd ? 'Replay timeline' : 'Play timeline'}>
              {playing ? <Pause size={18} /> : atEnd ? <RotateCcw size={18} /> : <Play size={18} />}
            </button>
            <YearInput min={yearMin} max={yearMax} year={year} onChange={setYear} />
          </div>
          <YearScrubber min={yearMin} max={yearMax} year={year} onChange={setYear} worldSeries={worldSeries} />
          <Segmented options={PLAY_SPEEDS} value={speed} onChange={setSpeed} label="Playback speed" />
        </div>

        {/* Metric */}
        <div className="flex flex-wrap items-center gap-2">
          <Segmented options={METRICS} value={metric} onChange={setMetric} label="Map metric" />
          {metric === 'fuel' && <Segmented options={FUELS} value={fuel} onChange={setFuel} label="Fuel source" />}
        </div>
      </div>
    </div>
  );
}
