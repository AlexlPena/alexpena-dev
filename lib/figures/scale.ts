// Pure geometry for the figure components. Kept out of the React layer so the
// arithmetic that positions every mark is unit-testable on its own, matching
// how lib/scroll and lib/theme are organised.

/** Map a value on [d0,d1] onto [r0,r1]. Values outside the domain extrapolate. */
export function linear(
  value: number,
  d0: number,
  d1: number,
  r0: number,
  r1: number
): number {
  if (d1 === d0) return r0;
  return r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}

/**
 * A bar whose data-end (right) is rounded and whose baseline (left) is square,
 * per the mark spec. Radius is clamped so a short bar degrades to a square
 * rather than inverting its own path.
 */
export function barPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r = 4
): string {
  const radius = Math.max(0, Math.min(r, w, h / 2));
  if (radius === 0) return `M${x},${y}h${w}v${h}h${-w}Z`;
  return [
    `M${x},${y}`,
    `h${w - radius}`,
    `a${radius},${radius} 0 0 1 ${radius},${radius}`,
    `v${h - radius * 2}`,
    `a${radius},${radius} 0 0 1 ${-radius},${radius}`,
    `h${-(w - radius)}`,
    "Z",
  ].join("");
}

/**
 * Which step of an n-step sequential ramp a value falls in. Returns 0..n-1.
 * Zero-magnitude values land in step 0 rather than being dropped, so an empty
 * cell still reads as "measured, low" instead of "no data".
 */
export function rampStep(value: number, max: number, steps = 5): number {
  if (max <= 0) return 0;
  const t = Math.min(1, Math.max(0, value / max));
  return Math.min(steps - 1, Math.floor(t * steps));
}

/** Polyline points for a sparkline or line chart, as an SVG `points` string. */
export function linePoints(
  values: readonly number[],
  width: number,
  height: number,
  pad = 1
): string {
  if (values.length === 0) return "";
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  return values
    .map((v, i) => {
      const x = linear(i, 0, Math.max(1, values.length - 1), 0, width);
      const y =
        hi === lo
          ? height / 2
          : linear(v, lo, hi, height - pad, pad);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}
