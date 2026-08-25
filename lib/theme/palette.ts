import { interpolate, formatHex, type Color } from "culori";

export type ThemeTokens = {
  bg: string;
  surface: string;
  ink: string;
  inkSecondary: string;
  line: string;
  copper: string;
  // Sequential ramp for figure marks, low magnitude -> high, plus the
  // de-emphasis series used by emphasis charts.
  fig1: string;
  fig2: string;
  fig3: string;
  fig4: string;
  fig5: string;
  figMute: string;
};

export const LIGHT: ThemeTokens = {
  bg: "#f7f5f1",
  surface: "#ffffff",
  ink: "#1a1815",
  inkSecondary: "#6b655c",
  line: "#dfd9d0",
  copper: "#c0682b",
  fig1: "#d99e6e",
  fig2: "#cd8449",
  fig3: "#c0682b",
  fig4: "#9a521f",
  fig5: "#6b3a17",
  figMute: "#8a8378",
};

export const DARK: ThemeTokens = {
  bg: "#12100e",
  surface: "#1b1815",
  ink: "#f2efe9",
  inkSecondary: "#a8a199",
  line: "#2a2620",
  copper: "#d67f3c",
  // Dark flips the sequential anchor: against a dark field, more is lighter.
  // Stepped against #2e2b29 — the background at dusk 0.55, the lightest field
  // a figure ever rests on in the dark half — not against this pole's own bg.
  // Validating on #12100e alone put the low steps under the readability floor
  // for the entire first plateau of the descent.
  fig1: "#8e5023",
  fig2: "#b06931",
  fig3: "#d67f3c",
  fig4: "#e5a672",
  fig5: "#f0c8a4",
  figMute: "#7e776b",
};

// Dusk values at which captions/content are visible. Must stay in sync with
// the plateaus produced by duskCurve() in lib/scroll/duskCurve.ts.
export const CONTENT_PLATEAUS = [0, 0.12, 0.55, 0.7, 0.85, 1];

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

// Per-group easing of the raw dusk value.
// Backgrounds ease over a wide band; text snaps through a narrow crossover
// centered where backgrounds are near mid-tone, so no content plateau ever
// pairs mid-tone bg with mid-tone text.
//
// The figure ramp shares the text crossover, and it has to. The dark ramp
// inverts the light one — step 1 travels light->dark while step 5 travels
// dark->light — so easing it slowly would drag every step through a common
// lightness partway across and momentarily flatten the ramp into a single
// tone. A chart with a collapsed ramp isn't dim, it's meaningless. Snapping it
// through 0.3–0.4 keeps that degenerate zone narrower than any plateau, so the
// ramp reads as a validated pole everywhere content actually rests
// (asserted over CONTENT_PLATEAUS in palette.test.ts).
const GROUP_EASE: Record<keyof ThemeTokens, (d: number) => number> = {
  bg: (d) => smoothstep(0.08, 0.7, d),
  surface: (d) => smoothstep(0.08, 0.7, d),
  line: (d) => smoothstep(0.08, 0.7, d),
  ink: (d) => smoothstep(0.3, 0.4, d),
  inkSecondary: (d) => smoothstep(0.3, 0.4, d),
  copper: (d) => smoothstep(0.2, 0.8, d),
  fig1: (d) => smoothstep(0.3, 0.4, d),
  fig2: (d) => smoothstep(0.3, 0.4, d),
  fig3: (d) => smoothstep(0.3, 0.4, d),
  fig4: (d) => smoothstep(0.3, 0.4, d),
  fig5: (d) => smoothstep(0.3, 0.4, d),
  figMute: (d) => smoothstep(0.3, 0.4, d),
};

const mixers = (Object.keys(LIGHT) as (keyof ThemeTokens)[]).reduce(
  (acc, key) => {
    acc[key] = interpolate([LIGHT[key], DARK[key]], "oklab");
    return acc;
  },
  {} as Record<keyof ThemeTokens, (t: number) => Color>
);

export function duskToTokens(dusk: number): ThemeTokens {
  const d = clamp01(dusk);
  const out = {} as ThemeTokens;
  for (const key of Object.keys(LIGHT) as (keyof ThemeTokens)[]) {
    const t = GROUP_EASE[key](d);
    out[key] =
      t === 0 ? LIGHT[key] : t === 1 ? DARK[key] : formatHex(mixers[key](t))!;
  }
  return out;
}
