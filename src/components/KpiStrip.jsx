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
      <Stat label={`CO₂ ทั่วโลก, ${year}`} value={fmtMt(total)} sub={yoy == null ? 'ไม่มีข้อมูลการเปลี่ยนแปลงรายปี' : `${fmtPct(yoy)} เทียบกับ ${year - 1}`} tone={yoy > 0 ? 'bad' : 'default'} hint={cb.co2?.description} />
      <Stat label="ต่อคนทั่วโลก" value={fmtPerCapita(store.get(w, 'co2_per_capita', year))} sub="ตัน CO₂ ต่อปี" hint={cb.co2_per_capita?.description} />
      <Stat label="ผู้ปล่อยก๊าซรายใหญ่ที่สุด" value={topEntity?.name ?? '—'} sub={top ? `${fmtMt(top.value)} · ${fmtShare(store.get(topEntity, 'share_global_co2', year))} ของโลก` : 'ไม่มีข้อมูล'} />
      <Stat label="ปล่อยมาตั้งแต่เริ่มบันทึก" value={fmtMt(cumulative)} sub={`CO₂สะสมถึง ${year}`} hint={cb.cumulative_co2?.description} />
    </div>
  );
}
