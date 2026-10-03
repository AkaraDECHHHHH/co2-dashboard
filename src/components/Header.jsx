import { AlertTriangle } from 'lucide-react';

export default function Header({ meta }) {
  return (
    <header className="border-b border-red-900/40 bg-ink-950/70">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 lg:px-6">
        <div className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded bg-crisis-600 text-white shadow-[0_0_24px_rgba(220,38,38,.6)]">
            <AlertTriangle size={22} strokeWidth={2.4} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold leading-none tracking-wide text-slate-50 sm:text-3xl">
              GLOBAL CO2 &amp; GREENHOUSE GAS EMISSIONS TRACKER
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Country-level emissions, {meta.yearMin}–{meta.yearMax} · Our World in Data / Global Carbon Project
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded border border-red-800/70 bg-red-950/50 px-3 py-1.5" role="status">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-crisis-500 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-crisis-500" />
          </span>
          <span className="font-display text-base font-semibold tracking-wider text-red-300">CLIMATE ALERT</span>
        </div>
      </div>
      <div className="hazard h-1.5" aria-hidden />
    </header>
  );
}
