import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTip from './ChartTip';
import { EmptyState } from './ui';
import { yearTicks } from '../lib/format';

/** Single-series area/line chart over years with a marker for the selected year. Click to pick a year. */
export default function TrendChart({ data, year, onPick, yFormat, valueFormat, name, height = 260, gradientId = 'trend', color = '#f97316' }) {
  const pts = data.filter((d) => d.value != null);
  if (pts.length < 2) return <EmptyState>No time series reported for this indicator.</EmptyState>;

  const min = pts[0].year;
  const max = pts[pts.length - 1].year;
  const rows = data.map((d) => ({ year: d.year, v: d.value }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={rows}
          margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
          onClick={(e) => e?.activeLabel != null && onPick?.(Number(e.activeLabel))}
          style={{ cursor: onPick ? 'pointer' : 'default' }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.55} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="year" type="number" domain={[min, max]} ticks={yearTicks(min, max)} tickLine={false} axisLine={{ stroke: '#334155' }} />
          <YAxis tickFormatter={yFormat} width={52} tickLine={false} axisLine={false} />
          <Tooltip content={<ChartTip valueFormat={valueFormat} />} cursor={{ stroke: '#64748b' }} />
          <Area type="monotone" dataKey="v" name={name} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={false} isAnimationActive={false} />
          {year >= min && year <= max && <ReferenceLine x={year} stroke="#f8fafc" strokeDasharray="4 3" />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
