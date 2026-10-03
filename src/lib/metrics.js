// Emission components, in stacking order. `col` matches the OWID column names.
export const COMPONENTS = [
  { id: 'coal', col: 'coal_co2', label: 'Coal', color: '#e11d48' },
  { id: 'oil', col: 'oil_co2', label: 'Oil', color: '#f97316' },
  { id: 'gas', col: 'gas_co2', label: 'Gas', color: '#f59e0b' },
  { id: 'cement', col: 'cement_co2', label: 'Cement', color: '#94a3b8' },
  { id: 'flaring', col: 'flaring_co2', label: 'Flaring', color: '#fde047' },
  { id: 'other', col: 'other_industry_co2', label: 'Other industry', color: '#64748b' },
];

export const FUELS = COMPONENTS.slice(0, 3);

export const METRICS = [
  { id: 'co2', label: 'Total CO₂', col: 'co2', unit: 'million tonnes (Mt)' },
  { id: 'per_capita', label: 'Per capita', col: 'co2_per_capita', unit: 'tonnes per person' },
  { id: 'fuel', label: 'By fuel source', col: null, unit: 'million tonnes (Mt)' },
];

export function describeMetric(metricId, fuelId) {
  if (metricId === 'fuel') {
    const f = FUELS.find((x) => x.id === fuelId) ?? FUELS[0];
    return { col: f.col, label: `${f.label} CO₂`, unit: 'million tonnes (Mt)' };
  }
  const m = METRICS.find((x) => x.id === metricId) ?? METRICS[0];
  return { col: m.col, label: m.label, unit: m.unit };
}

export const DEFAULT_YEAR = 2022;
export const PLAY_SPEEDS = [
  { id: 'slow', label: 'Slow', yps: 5 },
  { id: 'normal', label: 'Normal', yps: 12 },
  { id: 'fast', label: 'Fast', yps: 30 },
];
