// Piecewise-linear dusk curve over normalized scroll progress.
// Plateaus are where content sits; the palette's contrast tests prove AA at
// exactly these values. Crossings between plateaus are transitional voids —
// no content is placed there (enforced by page layout, Task 8).
export const DUSK_ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.1, 0], // Act I: full light
  [0.13, 0.12],
  [0.19, 0.12], // Act II: first dim
  [0.23, 0.55],
  [0.3, 0.55], // Stratum 1: Prompt Engineering
  [0.34, 0.7],
  [0.42, 0.7], // Stratum 2: Context Engineering
  [0.46, 0.85],
  [0.54, 0.85], // Stratum 3: Harness Engineering
  [0.6, 1],
  [0.82, 1], // Stratum 4 + Act IV: full dark
  [0.92, 0], // Act V: fast ascent
  [1, 0], // Act VI: full light
];

export function duskCurve(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  for (let i = 1; i < DUSK_ANCHORS.length; i++) {
    const [x1, y1] = DUSK_ANCHORS[i];
    if (p <= x1) {
      const [x0, y0] = DUSK_ANCHORS[i - 1];
      if (x1 === x0) return y1;
      return y0 + ((p - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return DUSK_ANCHORS[DUSK_ANCHORS.length - 1][1];
}
