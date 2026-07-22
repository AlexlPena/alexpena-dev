// Scroll progress -> world-space positions for the camera rail and signal.
// Same philosophy as duskCurve: pure, tested, single source of truth.
// The descent (p 0.2-0.7) maps linearly to -DESCENT_DEPTH; the ascent
// (0.82-0.92) rises 5x faster — the spec's "slow dive, quick surfacing".
import { REST_POINTS } from "../scroll/journeyLayout";

export const DESCENT_DEPTH = 40;

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function railY(progress: number): number {
  const p = clamp01(progress);
  if (p <= 0.2) return 0;
  if (p <= 0.7) return (-(p - 0.2) / 0.5) * DESCENT_DEPTH;
  if (p <= 0.82) return -DESCENT_DEPTH;
  if (p <= 0.92) return -DESCENT_DEPTH * (1 - (p - 0.82) / 0.1);
  return 0;
}

// Camera-rest depth of each stratum: where the camera sits when the visitor
// rests on that stratum's caption. Geometry is placed at these depths so
// the world and the DOM captions stay aligned by construction.
export const STRATUM_DEPTHS: readonly number[] = [
  railY(REST_POINTS.stratum1),
  railY(REST_POINTS.stratum2),
  railY(REST_POINTS.stratum3),
  railY(REST_POINTS.stratum4),
];

// The signal runs ahead of the camera; entering the loop stratum it pulls
// further ahead — the first hint the system is self-driving.
export function signalLead(progress: number): number {
  return 2 + 3 * smoothstep(0.575, 0.65, clamp01(progress));
}

export function signalY(progress: number): number {
  return railY(progress) - signalLead(progress);
}

export function signalVisible(progress: number): boolean {
  const p = clamp01(progress);
  return p >= 0.1 && p <= 0.86;
}
