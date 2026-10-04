import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import BreakdownChart from './BreakdownChart';
import TrendChart from './TrendChart';
import { Flag, Segmented, Stat } from './ui';
import { axisMt, fmtCompact, fmtMt, fmtPct, fmtPerCapita, fmtShare, fmtUsd, NA } from '../lib/format';

const TRENDS = [
  { id: 'co2', label: 'ทั้งหมด', col: 'co2', y: axisMt, v: fmtMt },
  { id: 'pc', label: 'ต่อคน', col: 'co2_per_capita', y: (v) => `${+v.toPrecision(2)} t`, v: fmtPerCapita },
  { id: 'cum', label: 'สะสม', col: 'cumulative_co2', y: axisMt, v: fmtMt },
];

export default function CountryDrawer({ store, iso, year, onYearChange, onClose }) {
  const entity = store.byIso.get(iso);
  const closeRef = useRef(null);
  const [trend, setTrend] = useState('co2');

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const t = TRENDS.find((x) => x.id === trend);
  const trendSeries = useMemo(() => store.series(entity, t.col), [store, entity, t.col]);
  const peak = useMemo(() => {
    const s = store.series(entity, 'co2').filter((p) => p.value != null);
    return s.length ? s.reduce((a, b) => (b.value > a.value ? b : a)) : null;
  }, [store, entity]);

  if (!entity) return null;
  const g = (col) => store.get(entity, col, year);
  const rank = store.ranking('co2', year).find((r) => r.iso === iso)?.rank;
  const growth = g('co2_growth_prct');
  const cb = store.codebook;
  const reporting = store.ranking('co2', year).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`${entity.name} emissions details`}>
      <button type="button" className="absolute inset-0 animate-fade bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-label="ปิดรายละเอียด" tabIndex={-1} />
      <aside className="thin-scroll relative h-full w-full max-w-[560px] animate-drawer overflow-y-auto border-l border-red-800/60 bg-ink-900 shadow-[-24px_0_60px_-20px_rgba(220,38,38,.35)]">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-red-900/40 bg-ink-900/95 px-5 py-4 backdrop-blur">
          <Flag url={store.flagUrl(entity, 80)} name={entity.name} className="h-6 w-9" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-3xl font-bold leading-none text-slate-50">{entity.name}</h2>
            <p className="mt-1 text-xs text-slate-500">
              บันทึกตั้งแต่ {entity.s} · แสดง {year}
            </p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} className="btn-ghost !p-2" aria-label="ปิด">
            <X size={18} />
          </button>
        </header>

        <div className="space-y-6 p-5">
          <section aria-label={`Key figures for ${year}`}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label="การปล่อยก๊าซ CO₂" value={fmtMt(g('co2'))} sub={rank ? `อันดับ ${rank} จาก ${reporting} ที่รายงาน` : 'ไม่มีอันดับในปีนี้'} hint={cb.co2?.description} />
              <Stat label="ต่อคน" value={fmtPerCapita(g('co2_per_capita'))} sub="ต่อคนต่อปี" hint={cb.co2_per_capita?.description} />
              <Stat
                label="การเติบโตต่อปี"
                value={fmtPct(growth)}
                tone={growth == null ? 'default' : growth > 0 ? 'bad' : 'good'}
                sub={growth == null ? 'ไม่มีอัตราการเติบโต' : growth > 0 ? 'เพิ่มขึ้นจากปีก่อน' : 'ลดลงจากปีก่อน'}
                hint={cb.co2_growth_prct?.description}
              />
              <Stat label="CO₂ สะสม" value={fmtMt(g('cumulative_co2'))} sub="การปล่อยก๊าซทั้งหมดจนถึงปัจจุบัน" hint={cb.cumulative_co2?.description} />
              <Stat label="สัดส่วนของโลก" value={fmtShare(g('share_global_co2'))} sub="ของ CO₂ ทั่วโลก" hint={cb.share_global_co2?.description} />
              <Stat label="ประชากร" value={fmtCompact(g('population'))} sub={g('gdp') != null ? `GDP ${fmtUsd(g('gdp'))}` : 'ไม่มีข้อมูล GDP'} />
            </div>
            {g('co2') == null && (
              <p className="mt-3 rounded border border-slate-800 bg-ink-950/50 px-3 py-2 text-xs text-slate-500">
                {entity.name} ไม่มีข้อมูล CO₂ ในปี {year} เลือกปีอื่นบนไทม์ไลน์{peak ? ` — บันทึกตั้งแต่ ${entity.s}.` : '.'}
              </p>
            )}
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="panel-title">ประวัติการปล่อยก๊าซ</h3>
              <Segmented options={TRENDS} value={trend} onChange={setTrend} label="ตัวชี้วัดประวัติ" />
            </div>
            <TrendChart data={trendSeries} year={year} onPick={onYearChange} yFormat={t.y} valueFormat={t.v} name={t.label} gradientId={`drawer-${trend}`} height={230} />
            {peak && (
              <p className="mt-2 text-xs text-slate-500">
                การปล่อยก๊าซสูงสุดต่อปี: <span className="num text-sm text-slate-200">{fmtMt(peak.value)}</span> ในปี <span className="num text-sm text-slate-200">{peak.year}</span>. คลิกกราฟเพื่อเลื่อนไทม์ไลน์ไปยังปีที่ต้องการ
              </p>
            )}
          </section>

          <section>
            <h3 className="panel-title mb-3">การแบ่งตามเชื้อเพลิง</h3>
            <BreakdownChart store={store} entity={entity} year={year} onPick={onYearChange} height={210} />
          </section>

          <p className="text-[11px] text-slate-600">
            ค่าที่ขาดหาย ({NA}) หมายความว่าแหล่งข้อมูลไม่มีรายงานสำหรับปีนั้น การปล่อยก๊าซคือ CO₂ ตามอาณาเขตจากเชื้อเพลิงฟอสซิลและอุตสาหกรรม
          </p>
        </div>
      </aside>
    </div>
  );
}
