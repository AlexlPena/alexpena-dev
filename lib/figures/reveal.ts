// Maps journey progress onto a 0..1 reveal for a figure anchored at a rest
// point. Pure so the timing is testable without a DOM, matching lib/scroll.

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/**
 * A figure finishes drawing exactly as its section comes to rest, so the
 * visitor arrives at a completed image rather than watching it assemble.
 * `lead` is how much progress the draw occupies before that.
 */
export function revealAt(progress: number, rest: number, lead = 0.08): number {
  if (!Number.isFinite(progress)) return 0;
  if (lead <= 0) return progress >= rest ? 1 : 0;
  return clamp01((progress - (rest - lead)) / lead);
}

/**
 * Per-element stagger. Each element runs for `overlap` of the group's span,
 * with starts spread evenly across the remainder — so they chase each other
 * rather than snapping in together, and the last one lands exactly as the
 * group completes.
 */
export function staggerAt(
  reveal: number,
  i: number,
  count: number,
  overlap = 0.55
): number {
  if (count <= 1) return clamp01(reveal);
  const run = Math.min(1, Math.max(1e-6, overlap));
  return clamp01((reveal - staggerDelay(i, count, run)) / run);
}

/**
 * The start offset CSS needs as `--d`. Shared with staggerAt so the stylesheet
 * and the module can never drift into different timings.
 */
export function staggerDelay(i: number, count: number, overlap = 0.55): number {
  if (count <= 1) return 0;
  const run = Math.min(1, Math.max(1e-6, overlap));
  return (i / (count - 1)) * (1 - run);
}
