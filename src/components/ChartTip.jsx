export default function ChartTip({ active, payload, label, valueFormat, labelFormat }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-red-900/60 bg-ink-950/95 px-3 py-2 text-xs shadow-xl">
      <div className="num mb-1 text-sm text-slate-100">{labelFormat ? labelFormat(label) : label}</div>
      {payload
        .filter((p) => p.value != null)
        .map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2 text-slate-300">
            <span className="h-2 w-2 rounded-sm" style={{ background: p.color || p.stroke }} />
            <span className="text-slate-400">{p.name}</span>
            <span className="num ml-auto pl-3 text-sm text-slate-100">{valueFormat ? valueFormat(p.value, p) : p.value}</span>
          </div>
        ))}
    </div>
  );
}
