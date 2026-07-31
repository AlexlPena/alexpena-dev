/**
 * Landmarks measured from the reference render's locked final frame
 * (docs/superpowers/reference/monogram/), normalised so cap height = 100 units
 * with the origin at the glyph band's top-left.
 *
 * These are the art-direction surface: retuning the monogram's proportions means
 * editing this table, and every chunk polygon recomputes from it.
 */
export const METRICS = {
  viewBox: { width: 143.5, height: 100 },

  a: {
    apexCenterU: 48.0,
    apexTopV: 5.0,
    apexHalfWidth: 5.55,
    // Measured 0.448, nudged to 0.4468 so the left leg's outer edge lands
    // exactly on u=0 at the baseline instead of 0.11 units outside the viewBox.
    legSlope: 0.4468, // du/dv on the outer edges, symmetric
    legWidth: 18.0, // horizontal width of each leg
    baselineV: 100.0,
    crossbarTopV: 67.6,
    crossbarBottomV: 83.1,
    // Cuts across the legs, as v values. Tilt is du/dv applied to the cut line
    // so seams are angled rather than dead horizontal, matching the reference.
    skeletonCutV: 45.0,
    skeletonCutTilt: 0.10,
    leftCuts: [
      { v: 68.0, tilt: -0.08 },
      { v: 86.0, tilt: 0.06 },
    ],
  },

  p: {
    stemLeftU: 79.8,
    stemRightU: 96.3,
    topV: 0.0,
    bottomV: 97.7,
    bowlOuterU: 143.5,
    bowlBottomV: 68.5,
    counterLeftU: 97.1,
    counterRightU: 124.9,
    counterTopV: 20.0,
    counterBottomV: 53.0,
    // Cuts across the stem only — never across the bowl.
    stemCuts: [
      { v: 25.0, tilt: 0.09 },
      { v: 48.0, tilt: -0.07 },
      { v: 70.0, tilt: 0.05 },
      { v: 86.0, tilt: -0.06 },
    ],
  },
} as const;
