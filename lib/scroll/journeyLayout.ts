// Maps content rest positions onto the journey document.
//
// ScrollTrigger progress p = scrollY / (docHeight - viewportHeight).
// A block of height VIEWPORT_VH whose top is at p * (JOURNEY_VH - VIEWPORT_VH)
// exactly fills the viewport when the visitor rests at progress p.
// (M1's placeholder used center/JOURNEY_VH, which rested ~half a viewport
// early on every plateau — this helper is the corrected, tested formula.)
export const JOURNEY_VH = 800;
export const VIEWPORT_VH = 100;

export function topVhForRest(p: number): number {
  return p * (JOURNEY_VH - VIEWPORT_VH);
}

// Rest progress for each content block. Each value must land on a flat
// plateau of duskCurve — enforced by journeyLayout.test.ts.
export const REST_POINTS = {
  actI: 0,
  actII: 0.16,
  stratum1: 0.26,
  stratum2: 0.4,
  stratum3: 0.54,
  stratum4: 0.7,
  outcomes: 0.81,
  actVI: 1,
} as const;
