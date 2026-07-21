// Act boundaries from the spec (Section 3): I 0-10%, II 10-20%, III 20-70%,
// IV 70-82%, V 82-92%, VI 92-100%.
export const ACT_BOUNDARIES = [0.1, 0.2, 0.7, 0.82, 0.92];

export type Act = 1 | 2 | 3 | 4 | 5 | 6;

export function actAt(progress: number): Act {
  const p = Math.min(1, Math.max(0, progress));
  for (let i = 0; i < ACT_BOUNDARIES.length; i++) {
    if (p < ACT_BOUNDARIES[i]) return (i + 1) as Act;
  }
  return 6;
}

export function actMidpoint(act: Act): number {
  const edges = [0, ...ACT_BOUNDARIES, 1];
  return (edges[act - 1] + edges[act]) / 2;
}
