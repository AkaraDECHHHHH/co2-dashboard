/**
 * Converts owid-co2-data.csv (+ optional codebook) into a compact, columnar JSON
 * that the dashboard can index by [iso][column][year - startYear] in O(1).
 *
 *   npm run prep                      -> looks for the CSVs in ./data, ./, or ./public
 *   npm run prep -- path/to/file.csv  -> explicit path to the data CSV
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import countries from 'i18n-iso-countries';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'public', 'data', 'emissions.json');
const args = process.argv.slice(2);

if (args.includes('--if-missing') && fs.existsSync(OUT)) {
  console.log('[prep] emissions.json already exists, skipping (run `npm run prep` to rebuild).');
  process.exit(0);
}

const explicit = args.find((a) => !a.startsWith('--'));
const find = (name) =>
  [explicit && name.includes('data') ? path.resolve(explicit) : null, ...['data', '.', 'public'].map((d) => path.join(root, d, name))]
    .filter(Boolean)
    .find((p) => fs.existsSync(p));

const dataPath = find('owid-co2-data.csv');
if (!dataPath) {
  console.error(
    '\n[prep] Could not find owid-co2-data.csv.\n' +
      '       Put it in ./data/ (or pass a path: npm run prep -- /path/to/owid-co2-data.csv)\n'
  );
  process.exit(1);
}
const codebookPath = find('owid-co2-codebook.csv');

// Columns the UI uses. Columns missing from your CSV are skipped automatically.
const COLS = [
  'co2', 'co2_per_capita', 'co2_growth_prct', 'cumulative_co2', 'share_global_co2',
  'coal_co2', 'oil_co2', 'gas_co2', 'cement_co2', 'flaring_co2', 'other_industry_co2',
  'population', 'gdp', 'co2_per_gdp', 'total_ghg', 'methane', 'nitrous_oxide',
  'land_use_change_co2', 'temperature_change_from_co2',
];
const INT_COLS = new Set(['population', 'gdp']);

const parse = (file) =>
  Papa.parse(fs.readFileSync(file, 'utf8'), { header: true, dynamicTyping: true, skipEmptyLines: true });

console.log(`[prep] reading ${path.relative(root, dataPath)}`);
const rows = parse(dataPath).data;

let yearMin = Infinity;
let yearMax = -Infinity;
const entities = new Map();

for (const r of rows) {
  if (typeof r.year !== 'number') continue;
  yearMin = Math.min(yearMin, r.year);
  yearMax = Math.max(yearMax, r.year);

  let key = null;
  if (r.country === 'World') key = 'WORLD';
  else if (r.country === 'Kosovo') key = 'OWID_KOS';
  else if (typeof r.iso_code === 'string' && /^[A-Z]{3}$/.test(r.iso_code)) key = r.iso_code;
  if (!key) continue; // continents, income groups, GCP regions, shipping, aviation...

  if (!entities.has(key)) entities.set(key, { name: r.country, byYear: new Map() });
  entities.get(key).byYear.set(r.year, r);
}

const pack = (ent) => {
  const withCo2 = [...ent.byYear.entries()]
    .filter(([, r]) => typeof r.co2 === 'number')
    .map(([y]) => y)
    .sort((a, b) => a - b);
  if (!withCo2.length) return null;
  const s = withCo2[0]; // leading nulls are trimmed: arrays start at the first year with CO2 data
  const d = {};
  for (const col of COLS) {
    const arr = [];
    let any = false;
    for (let y = s; y <= yearMax; y++) {
      const v = ent.byYear.get(y)?.[col];
      if (typeof v === 'number' && Number.isFinite(v)) {
        any = true;
        arr.push(INT_COLS.has(col) ? Math.round(v) : Math.round(v * 1000) / 1000);
      } else arr.push(null);
    }
    if (any) d[col] = arr;
  }
  return { s, d };
};

const out = { meta: {}, countries: {}, isoNumeric: {}, codebook: {} };

for (const [key, ent] of entities) {
  const packed = pack(ent);
  if (!packed) continue;
  if (key === 'WORLD') out.world = { n: 'World', ...packed };
  else {
    const a2 = key === 'OWID_KOS' ? 'XK' : countries.alpha3ToAlpha2(key) || null;
    out.countries[key] = { n: ent.name, a2, ...packed };
  }
}

if (!out.world) {
  console.error('[prep] No "World" row with CO2 data found - the global charts need it.');
  process.exit(1);
}

// numeric ids used by world-atlas -> ISO3 codes used by OWID
for (const [num, a2] of Object.entries(countries.getNumericCodes())) {
  const a3 = countries.alpha2ToAlpha3(a2);
  if (a3) out.isoNumeric[num] = a3;
}

if (codebookPath) {
  for (const row of parse(codebookPath).data) {
    if (COLS.includes(row.column))
      out.codebook[row.column] = { title: row.title, description: row.description, unit: row.unit };
  }
}

out.meta = {
  yearMin,
  yearMax,
  generatedAt: new Date().toISOString(),
  countryCount: Object.keys(out.countries).length,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out));
const kb = Math.round(fs.statSync(OUT).size / 1024);
console.log(`[prep] ${out.meta.countryCount} countries + World, ${yearMin}-${yearMax} -> public/data/emissions.json (${kb} KB)`);
