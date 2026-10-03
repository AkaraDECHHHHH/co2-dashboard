import { Info } from 'lucide-react';
import { NA } from '../lib/format';

export function Panel({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`panel flex flex-col ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-2 border-b border-red-900/30 px-4 py-3">
          <div>
            <h2 className="panel-title">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className="min-h-0 flex-1 p-4">{children}</div>
    </section>
  );
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" aria-pressed={value === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Flag({ url, name, className = 'h-3.5 w-5' }) {
  if (!url) return <span className={`inline-block rounded-sm bg-ink-800 ${className}`} aria-hidden />;
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      className={`inline-block rounded-[2px] object-cover ring-1 ring-black/40 ${className}`}
      onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
      title={name}
    />
  );
}

export function EmptyState({ children }) {
  return (
    <div className="flex h-full min-h-[120px] items-center justify-center rounded border border-dashed border-slate-700 px-4 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export function Stat({ label, value, sub, tone = 'default', hint }) {
  const color = tone === 'bad' ? 'text-crisis-500' : tone === 'good' ? 'text-emerald-400' : 'text-slate-100';
  return (
    <div className="rounded border border-slate-800 bg-ink-950/50 p-3" title={hint}>
      <div className="flex items-center gap-1 text-xs text-slate-500">
        {label}
        {hint && <Info size={11} aria-label={hint} className="text-slate-600" />}
      </div>
      <div className={`num mt-1 text-2xl font-semibold leading-none ${value === NA ? 'text-slate-600' : color}`}>{value}</div>
      {sub && <div className="mt-1.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}
