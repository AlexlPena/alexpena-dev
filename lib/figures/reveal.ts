// Timing for figures that draw themselves as they scroll into view. Pure, so
// the mapping is testable without a DOM, matching how lib/scroll is organised.

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

/**
 * Reveal from the figure's own box, not from journey progress.
 *
 * Progress-based timing has to assume where the figure sits inside its
 * section, and that assumption is wrong on at least one layout: the strata put
 * the figure beside the text on wide screens and below it on narrow ones, so
 * the same rest point puts the figure in completely different places. Tying
 * the draw to the element means it starts when the figure actually appears and
 * finishes when it is actually settled, on every viewport.
 *
 * @param top      the figure's top edge, relative to the viewport
 * @param height   the figure's height
 * @param viewport the viewport height
 * @param settle   how far above the fold the figure's bottom must reach for
 *                 the draw to complete, as a fraction of the viewport. Larger
 *                 finishes later.
 */
export function revealFromRect(
  top: number,
  height: number,
  viewport: number,
  settle = 0.18
): number {
  if (!Number.isFinite(top) || viewport <= 0) return 0;
  // Zero at the moment the top edge touches the bottom of the viewport, one
  // once the bottom edge has climbed `settle` of a viewport above the fold.
  const span = viewport * settle + Math.max(0, height);
  if (span <= 0) return top <= 0 ? 1 : 0;
  return clamp01((viewport - top) / span);
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
