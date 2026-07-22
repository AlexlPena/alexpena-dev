import { interpolate, formatHex, type Color } from "culori";

export type ThemeTokens = {
  bg: string;
  surface: string;
  ink: string;
  inkSecondary: string;
  line: string;
  copper: string;
};

export const LIGHT: ThemeTokens = {
  bg: "#f7f5f1",
  surface: "#ffffff",
  ink: "#1a1815",
  inkSecondary: "#6b655c",
  line: "#dfd9d0",
  copper: "#c0682b",
};

export const DARK: ThemeTokens = {
  bg: "#12100e",
  surface: "#1b1815",
  ink: "#f2efe9",
  inkSecondary: "#a8a199",
  line: "#2a2620",
  copper: "#d67f3c",
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
const GROUP_EASE: Record<keyof ThemeTokens, (d: number) => number> = {
  bg: (d) => smoothstep(0.08, 0.7, d),
  surface: (d) => smoothstep(0.08, 0.7, d),
  line: (d) => smoothstep(0.08, 0.7, d),
  ink: (d) => smoothstep(0.3, 0.4, d),
  inkSecondary: (d) => smoothstep(0.3, 0.4, d),
  copper: (d) => smoothstep(0.2, 0.8, d),
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

// Single-token accessor for hot paths (per-frame canvas work) that need only
// the background: avoids interpolating and hex-formatting all six tokens.
export function duskToBg(dusk: number): string {
  return duskToTokens(dusk).bg;
}
