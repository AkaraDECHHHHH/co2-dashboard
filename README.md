# Global CO₂ & Greenhouse Gas Emissions Tracker

React + Tailwind + Recharts + d3-geo dashboard for the Our World in Data CO₂ dataset.

## Setup

```bash
npm install

# 1. Put your files in ./data
#    data/owid-co2-data.csv
#    data/owid-co2-codebook.csv   (optional; powers the (i) hints on stat cards)

npm run dev        # first run converts the CSV -> public/data/emissions.json, then starts Vite
```

| Command | What it does |
| --- | --- |
| `npm run prep` | Rebuild `public/data/emissions.json` from the CSV (run again whenever the CSV changes) |
| `npm run prep -- /path/to/owid-co2-data.csv` | Same, with an explicit path |
| `npm run dev` | Dev server (auto-runs prep if the JSON is missing) |
| `npm run build` / `npm run preview` | Production build / serve it locally |

Requires Node 18+.

## How the data pipeline works

`scripts/preprocess.mjs` parses the 60+ column CSV once (PapaParse) and writes a compact columnar JSON:

```
{ meta, codebook, isoNumeric, world, countries: { USA: { n, a2, s, d: { co2: [..], ... } } } }
```

- Only the ~19 columns the UI uses are kept; arrays start at each country's first reporting year (`s`).
- Aggregates (continents, income groups, EU, shipping...) are dropped; `World` feeds the global charts.
- Year range is read from the data (1750–2022 for your file). The default year is 2022, clamped to the range.
- ≈2.5 MB raw / ≈0.9 MB gzipped. At runtime every lookup is `entity.d[col][year - entity.s]`.

## Structure

```
scripts/preprocess.mjs        CSV -> JSON
src/
  App.jsx                     state (year, metric, playback, selected country), layout
  hooks/useEmissionsData.js   fetch + build store
  lib/
    store.js                  O(1) lookups, memoised rankings and color domains
    metrics.js                metric / fuel / component definitions
    colors.js                 symlog color scale (dark slate -> amber -> orange -> crimson)
    format.js                 number formatting, missing-value fallbacks
  components/
    Header.jsx                title, climate-alert badge
    ControlBar.jsx            sticky bar: year, play/pause, speed, metric switch
    YearScrubber.jsx          slider drawn over the world emissions curve + number input
    KpiStrip.jsx              world totals for the selected year
    WorldMap.jsx              choropleth, zoom/pan, hover tooltip, legend
    Leaderboard.jsx           top 10/20/50, search, mini bars
    BreakdownChart.jsx        donut (year) / stacked area (history) by source
    TrendChart.jsx            reusable history chart, click to jump to a year
    CountryDrawer.jsx         side sheet with stats, history, fuel breakdown
    ui.jsx, ChartTip.jsx      shared pieces
```

## Performance notes

- Country geometry is projected once at load; only `fill` changes per year. The 175 `<path>`s live in a
  memoised component, and the tooltip is positioned imperatively, so hovering never re-renders the map.
- Zoom/pan writes a transform straight onto the `<g>` (no React state).
- Charts and the leaderboard follow the year through `useDeferredValue`, so scrubbing and playback stay smooth.
- Color domain is fixed per metric (99th–99.5th percentile across all years), so colors are comparable while the timeline plays.

## Customising

- Palette: `tailwind.config.js` (ink / crisis / ember) and `src/lib/colors.js` (map ramp).
- Finer borders: in `WorldMap.jsx` import `world-atlas/countries-50m.json` instead of 110m.
- Add a metric: add the column to `COLS` in the prep script, then an entry in `src/lib/metrics.js`.
- Deploying under a sub-path: set `base` in `vite.config.js`; the data fetch honours `BASE_URL`.

## Known limits

- Very small states (Singapore, Malta, island nations) are too small to see at 110m resolution; find them via the leaderboard search.
- Flags load from flagcdn.com; offline they simply don't show.
- Per-capita rankings include small territories with unusual profiles (e.g. refinery islands); bars use a square-root scale so the rest of the list stays readable.
