import { fmtMt, fmtPct, fmtPerCapita, fmtShare } from '../lib/format';
import { Stat } from './ui';

export default function KpiStrip({ store, year }) {
  const w = store.world;
  const total = store.get(w, 'co2', year);
  const prev = store.get(w, 'co2', year - 1);
  const yoy = total != null && prev ? ((total - prev) / prev) * 100 : null;
  const top = store.ranking('co2', year)[0];
  const topEntity = top && store.byIso.get(top.iso);
  const cumulative = store.get(w, 'cumulative_co2', year);
  const cb = store.codebook;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label={`World CO₂, ${year}`} value={fmtMt(total)} sub={yoy == null ? 'Year-on-year change unavailable' : `${fmtPct(yoy)} vs ${year - 1}`} tone={yoy > 0 ? 'bad' : 'default'} hint={cb.co2?.description} />
      <Stat label="Per person worldwide" value={fmtPerCapita(store.get(w, 'co2_per_capita', year))} sub="tonnes of CO₂ per year" hint={cb.co2_per_capita?.description} />
      <Stat label="Largest emitter" value={topEntity?.name ?? '—'} sub={top ? `${fmtMt(top.value)} · ${fmtShare(store.get(topEntity, 'share_global_co2', year))} of world` : 'No data'} />
      <Stat label="Emitted since the start of the record" value={fmtMt(cumulative)} sub={`cumulative CO₂ through ${year}`} hint={cb.cumulative_co2?.description} />
    </div>
  );
}
