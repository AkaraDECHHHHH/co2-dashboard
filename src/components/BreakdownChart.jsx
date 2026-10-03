import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTip from './ChartTip';
import { EmptyState, Segmented } from './ui';
import { COMPONENTS } from '../lib/metrics';
import { axisMt, fmtMt, fmtPercentOf, yearTicks } from '../lib/format';

const MODES = [
  { id: 'donut', label: 'Selected year' },
  { id: 'history', label: 'Over time' },
];

/** Coal / oil / gas / cement / flaring split for one entity: donut for a year, or stacked history. */
export default function BreakdownChart({ store, entity, year, onPick, height = 250 }) {
  const [mode, setMode] = useState('donut');

  const parts = useMemo(
    () => COMPONENTS.map((c) => ({ ...c, value: store.get(entity, c.col, year) })).filter((p) => p.value != null && p.value > 0),
    [store, entity, year]
  );
  const sum = parts.reduce((a, p) => a + p.value, 0);
  const total = store.get(entity, 'co2', year);

  const present = useMemo(() => COMPONENTS.filter((c) => entity.d[c.col]), [entity]);
  const history = useMemo(() => {
    const n = entity.d.co2?.length ?? 0;
    return Array.from({ length: n }, (_, i) => {
      const row = { year: entity.s + i };
      for (const c of present) row[c.col] = entity.d[c.col][i];
      return row;
    });
  }, [entity, present]);

  return (
    <div>
      <div className="mb-3">
        <Segmented options={MODES} value={mode} onChange={setMode} label="Breakdown view" />
      </div>

      {mode === 'donut' ? (
        parts.length === 0 ? (
          <div style={{ height }}>
            <EmptyState>No fuel breakdown reported for {entity.name} in {year}.</EmptyState>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative shrink-0" style={{ width: height * 0.9, height: height * 0.9 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={parts} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="94%" paddingAngle={1} stroke="#0f172a" strokeWidth={2} isAnimationActive={false}>
                    {parts.map((p) => (
                      <Cell key={p.id} fill={p.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTip valueFormat={fmtMt} labelFormat={() => `${entity.name}, ${year}`} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="num text-3xl font-semibold text-slate-100">{fmtMt(total ?? sum)}</span>
                <span className="text-xs text-slate-500">CO₂ in {year}</span>
              </div>
            </div>
            <ul className="w-full flex-1 space-y-2">
              {parts.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
                  <span className="text-slate-300">{p.label}</span>
                  <span className="num ml-auto text-base text-slate-100">{fmtMt(p.value)}</span>
                  <span className="num w-14 text-right text-slate-500">{fmtPercentOf(p.value / sum)}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : (
        <div style={{ height }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} onClick={(e) => e?.activeLabel != null && onPick?.(Number(e.activeLabel))}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" type="number" domain={['dataMin', 'dataMax']} ticks={history.length ? yearTicks(history[0].year, history[history.length - 1].year) : []} tickLine={false} axisLine={{ stroke: '#334155' }} />
              <YAxis tickFormatter={axisMt} width={56} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTip valueFormat={fmtMt} />} cursor={{ stroke: '#64748b' }} />
              {present.map((c) => (
                <Area key={c.id} type="monotone" stackId="1" dataKey={c.col} name={c.label} stroke={c.color} fill={c.color} fillOpacity={0.85} isAnimationActive={false} />
              ))}
              {history.length > 0 && year >= history[0].year && <ReferenceLine x={year} stroke="#f8fafc" strokeDasharray="4 3" />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
