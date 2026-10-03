import { scaleSymlog } from 'd3-scale';
import { interpolateRgb, piecewise } from 'd3-interpolate';

export const NO_DATA = '#172033';

// Dark slate (low) -> amber -> orange -> red -> deep crimson (extreme)
const RAMP = ['#334155', '#f59e0b', '#f97316', '#ef4444', '#c1121f'];
const interp = piecewise(interpolateRgb, RAMP);

/**
 * Symlog scale so that both Luxembourg and China are legible on the same map.
 * The domain is fixed per column (not per year) so colors stay comparable while the timeline plays.
 */
export function makeScale(col, max) {
  const perCapita = col === 'co2_per_capita';
  const norm = scaleSymlog().constant(perCapita ? 0.1 : 1).domain([0, max]).range([0, 1]).clamp(true);
  const candidates = perCapita ? [0, 1, 2, 5, 10, 20, 50] : [0, 1, 10, 100, 1000, 10000];
  return {
    max,
    color: (v) => interp(norm(v)),
    ticks: candidates.filter((v) => v <= max).map((v) => ({ v, t: norm(v) })),
    gradient: `linear-gradient(90deg, ${Array.from({ length: 14 }, (_, i) => interp(i / 13)).join(',')})`,
  };
}
