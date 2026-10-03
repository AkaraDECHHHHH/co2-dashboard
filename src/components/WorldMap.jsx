import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { select } from 'd3-selection';
import { zoom, zoomIdentity } from 'd3-zoom';
import 'd3-transition';
import { feature } from 'topojson-client';
import topology from 'world-atlas/countries-110m.json'; // swap for countries-50m.json for finer borders
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { makeScale, NO_DATA } from '../lib/colors';
import { fmtCompact, fmtShare, fmtValue, NA } from '../lib/format';
import { Flag } from './ui';

const W = 960;
const H = 500;

// Projected once at module load: geometry never changes, only fills do.
const GEO = (() => {
  const features = feature(topology, topology.objects.countries).features.filter((f) => f.id !== '010'); // drop Antarctica
  const projection = geoNaturalEarth1().fitExtent(
    [[6, 6], [W - 6, H - 6]],
    { type: 'FeatureCollection', features }
  );
  const path = geoPath(projection);
  return features
    .map((f, i) => ({ key: `${f.id ?? 'x'}-${i}`, numeric: f.id, name: f.properties.name, d: path(f) }))
    .filter((f) => f.d);
})();

/** The expensive part (≈175 <path> elements). Memoised so hover/tooltip never re-renders it. */
const Countries = memo(function Countries({ items, selectedIso }) {
  return (
    <>
      {items.map((it) => (
        <path
          key={it.key}
          d={it.d}
          fill={it.fill}
          className="country"
          data-key={it.key}
          data-has={it.has ? '1' : '0'}
          data-selected={it.iso && it.iso === selectedIso ? '1' : '0'}
        />
      ))}
    </>
  );
});

function Legend({ scale, unit, metricLabel }) {
  return (
    <div className="pointer-events-none w-56 rounded border border-slate-800 bg-ink-950/80 p-2.5 backdrop-blur sm:absolute sm:bottom-3 sm:left-3">
      <div className="mb-1.5 text-xs text-slate-400">{metricLabel} · {unit}</div>
      <div className="relative h-2.5 rounded-sm" style={{ background: scale.gradient }}>
        {scale.ticks.map((t) => (
          <span key={t.v} className="absolute top-full mt-0.5 -translate-x-1/2 text-[10px] text-slate-500 num" style={{ left: `${t.t * 100}%` }}>
            {t.v}
          </span>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-1.5 text-[11px] text-slate-500">
        <span className="h-2.5 w-4 rounded-sm border border-slate-700" style={{ background: NO_DATA }} />
        No data reported
      </div>
    </div>
  );
}

export default function WorldMap({ store, year, col, metricLabel, unit, selectedIso, onSelect }) {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const wrapRef = useRef(null);
  const tipRef = useRef(null);
  const zoomRef = useRef(null);
  const hoverKey = useRef(null);
  const [hover, setHover] = useState(null);

  const shapes = useMemo(
    () =>
      GEO.map((g) => ({
        ...g,
        iso: g.name === 'Kosovo' ? 'OWID_KOS' : store.isoNumeric[g.numeric] ?? null,
      })),
    [store]
  );
  const shapeByKey = useMemo(() => new Map(shapes.map((s) => [s.key, s])), [shapes]);
  const scale = useMemo(() => makeScale(col, store.domainMax(col)), [store, col]);

  const items = useMemo(
    () =>
      shapes.map((s) => {
        const v = s.iso ? store.value(s.iso, col, year) : null;
        return { key: s.key, d: s.d, iso: s.iso, has: v != null, fill: v == null ? NO_DATA : scale.color(v) };
      }),
    [shapes, store, col, year, scale]
  );

  // Pan / zoom: transform applied straight to the <g>, no React state involved.
  useEffect(() => {
    const svg = select(svgRef.current);
    const z = zoom()
      .scaleExtent([1, 10])
      .extent([[0, 0], [W, H]])
      .translateExtent([[0, 0], [W, H]])
      .filter((e) => {
        if (e.type === 'wheel') return e.ctrlKey || e.metaKey;
        if (e.type.startsWith('touch')) return e.touches.length > 1; // one finger scrolls the page, two fingers pinch the map
        return !e.button;
      })
      .on('zoom', (e) => gRef.current?.setAttribute('transform', e.transform.toString()));
    svg.call(z);
    zoomRef.current = z;
    return () => svg.on('.zoom', null);
  }, []);

  const zoomBy = (k) => select(svgRef.current).transition().duration(220).call(zoomRef.current.scaleBy, k);
  const zoomReset = () => select(svgRef.current).transition().duration(300).call(zoomRef.current.transform, zoomIdentity);

  const onMove = useCallback(
    (e) => {
      const key = e.target.dataset?.key ?? null;
      const wrap = wrapRef.current;
      const tip = tipRef.current;
      if (tip && wrap) {
        const r = wrap.getBoundingClientRect();
        let x = e.clientX - r.left + 14;
        let y = e.clientY - r.top + 14;
        if (x + tip.offsetWidth > r.width - 6) x = e.clientX - r.left - tip.offsetWidth - 14;
        if (y + tip.offsetHeight > r.height - 6) y = e.clientY - r.top - tip.offsetHeight - 14;
        tip.style.transform = `translate(${Math.max(4, x)}px, ${Math.max(4, y)}px)`;
      }
      if (key !== hoverKey.current) {
        hoverKey.current = key;
        setHover(key ? shapeByKey.get(key) : null);
      }
    },
    [shapeByKey]
  );
  const onLeave = useCallback(() => {
    hoverKey.current = null;
    setHover(null);
  }, []);
  const onClick = useCallback(
    (e) => {
      const s = shapeByKey.get(e.target.dataset?.key);
      if (s?.iso && store.byIso.has(s.iso) && store.value(s.iso, col, year) != null) onSelect(s.iso);
    },
    [shapeByKey, store, col, year, onSelect]
  );

  const hoverEntity = hover?.iso ? store.byIso.get(hover.iso) : null;
  const hoverValue = hoverEntity ? store.get(hoverEntity, col, year) : null;

  return (
    <div ref={wrapRef} className="panel relative overflow-hidden bg-[#0b1322]">
      <div className="pointer-events-none px-4 pt-3 sm:absolute sm:left-4 sm:top-3 sm:z-10 sm:p-0">
        <div className="panel-title">{metricLabel}, {year}</div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full touch-pan-y select-none"
        role="img"
        aria-label={`World map of ${metricLabel} in ${year}. Use the leaderboard for keyboard access.`}
      >
        <g ref={gRef} onMouseMove={onMove} onMouseLeave={onLeave} onClick={onClick}>
          <Countries items={items} selectedIso={selectedIso} />
        </g>
      </svg>

      <div className="flex items-end justify-between gap-3 p-3 sm:contents">
      <Legend scale={scale} unit={unit} metricLabel={metricLabel} />

      <div className="flex flex-col items-end gap-2 sm:absolute sm:bottom-3 sm:right-3">
        <span className="hidden text-[11px] text-slate-600 sm:block">Drag to pan · Ctrl + scroll to zoom</span>
        <div className="flex gap-1">
          <button type="button" className="btn-ghost !p-1.5" onClick={() => zoomBy(1.6)} aria-label="Zoom in"><Plus size={16} /></button>
          <button type="button" className="btn-ghost !p-1.5" onClick={() => zoomBy(1 / 1.6)} aria-label="Zoom out"><Minus size={16} /></button>
          <button type="button" className="btn-ghost !p-1.5" onClick={zoomReset} aria-label="Reset view"><RotateCcw size={16} /></button>
        </div>
      </div>
      </div>

      {/* Tooltip: positioned imperatively by onMove, content driven by `hover` state */}
      <div
        ref={tipRef}
        className="pointer-events-none absolute left-0 top-0 z-20 w-60 rounded border border-red-800/70 bg-ink-950/95 p-3 shadow-2xl transition-opacity duration-100"
        style={{ opacity: hover ? 1 : 0 }}
        aria-hidden={!hover}
      >
        {hover && (
          <>
            <div className="mb-2 flex items-center gap-2">
              <Flag url={store.flagUrl(hoverEntity)} />
              <span className="font-display text-lg font-semibold leading-none text-slate-100">{hoverEntity?.name ?? hover.name}</span>
            </div>
            {hoverValue == null ? (
              <p className="text-xs text-slate-500">No {metricLabel.toLowerCase()} data reported for {year}.</p>
            ) : (
              <dl className="space-y-1 text-xs">
                <Row k={metricLabel} v={fmtValue(col, hoverValue)} strong />
                <Row k="Population" v={fmtCompact(store.get(hoverEntity, 'population', year))} />
                <Row k="Share of global CO₂" v={fmtShare(store.get(hoverEntity, 'share_global_co2', year))} />
              </dl>
            )}
            {hoverValue != null && <p className="mt-2 text-[11px] text-slate-600">Click for full history</p>}
          </>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500">{k}</dt>
      <dd className={`num ${strong ? 'text-xl text-crisis-500' : 'text-base text-slate-200'} ${v === NA ? '!text-slate-600' : ''}`}>{v}</dd>
    </div>
  );
}
