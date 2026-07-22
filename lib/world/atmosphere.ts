// Atmosphere constants and mappings for the world: fog depth follows the
// dusk engine (light world = shrouded and near-imperceptible, dark world =
// present), and pointer parallax is presence-not-control (spec motion
// tier 3: ~1 degree equivalent, translation only).

export const FOG_NEAR = 6;

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

export function fogFar(dusk: number): number {
  return 12 + 18 * clamp(dusk, 0, 1);
}

export const PARALLAX_MAX_X = 0.5;
export const PARALLAX_MAX_Y = 0.3;

export function parallaxOffset(pointer: number, max: number): number {
  return clamp(pointer, -1, 1) * max;
}
