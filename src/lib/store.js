/**
 * Thin query layer over the columnar JSON produced by scripts/preprocess.mjs.
 * Each entity looks like { iso, name, a2, s, d: { column: [values from year s .. yearMax] } }.
 * All lookups are O(1); rankings and color domains are memoised.
 */
export function createStore(raw) {
  const { meta, countries, world, codebook, isoNumeric } = raw;

  const list = Object.entries(countries).map(([iso, c]) => ({ iso, name: c.n, a2: c.a2, s: c.s, d: c.d }));
  const byIso = new Map(list.map((e) => [e.iso, e]));
  const worldEntity = { iso: 'WORLD', name: 'World', a2: null, s: world.s, d: world.d };

  const get = (entity, col, year) => {
    const arr = entity?.d[col];
    if (!arr) return null;
    const i = year - entity.s;
    if (i < 0 || i >= arr.length) return null;
    return arr[i] ?? null;
  };

  const value = (iso, col, year) => get(byIso.get(iso), col, year);

  const series = (entity, col) => {
    const arr = entity?.d[col];
    if (!arr) return [];
    return arr.map((v, i) => ({ year: entity.s + i, value: v }));
  };

  const domainCache = new Map();
  const domainMax = (col) => {
    if (domainCache.has(col)) return domainCache.get(col);
    const vals = [];
    for (const e of list) for (const v of e.d[col] ?? []) if (v != null && v > 0) vals.push(v);
    vals.sort((a, b) => a - b);
    const q = col === 'co2_per_capita' ? 0.99 : 0.995;
    const max = vals.length ? vals[Math.min(vals.length - 1, Math.floor(vals.length * q))] : 1;
    domainCache.set(col, max);
    return max;
  };

  const rankCache = new Map();
  const ranking = (col, year) => {
    const key = `${col}:${year}`;
    if (rankCache.has(key)) return rankCache.get(key);
    const rows = list
      .map((e) => ({ iso: e.iso, value: get(e, col, year) }))
      .filter((r) => r.value != null)
      .sort((a, b) => b.value - a.value)
      .map((r, i) => ({ ...r, rank: i + 1 }));
    rankCache.set(key, rows);
    return rows;
  };

  const flagUrl = (e, w = 40) => (e?.a2 ? `https://flagcdn.com/w${w}/${e.a2.toLowerCase()}.png` : null);

  return { meta, list, byIso, world: worldEntity, get, value, series, domainMax, ranking, codebook, isoNumeric, flagUrl };
}
