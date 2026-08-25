import { describe, expect, test } from "vitest";
import { duskToTokens, CONTENT_PLATEAUS, LIGHT, DARK } from "./palette";
import { contrastRatio } from "./contrast";
import { duskCurve } from "../scroll/duskCurve";
import { actMidpoint } from "../scroll/acts";

describe("duskToTokens", () => {
  test("dusk 0 returns exact light pole", () => {
    expect(duskToTokens(0)).toEqual(LIGHT);
  });

  test("dusk 1 returns exact dark pole", () => {
    expect(duskToTokens(1)).toEqual(DARK);
  });

  test("clamps out-of-range input", () => {
    expect(duskToTokens(-0.5)).toEqual(LIGHT);
    expect(duskToTokens(1.5)).toEqual(DARK);
  });

  test("every content plateau keeps ink-on-bg at WCAG AA (>=4.5:1)", () => {
    for (const d of CONTENT_PLATEAUS) {
      const t = duskToTokens(d);
      expect(
        contrastRatio(t.ink, t.bg),
        `ink on bg at dusk=${d}`
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(t.inkSecondary, t.bg),
        `inkSecondary on bg at dusk=${d}`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("reduced-motion act-midpoint values keep AA contrast for every act", () => {
    for (const act of [1, 2, 3, 4, 5, 6] as const) {
      const d = duskCurve(actMidpoint(act));
      const t = duskToTokens(d);
      expect(
        contrastRatio(t.ink, t.bg),
        `ink on bg at act ${act} midpoint (dusk=${d})`
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(t.inkSecondary, t.bg),
        `inkSecondary on bg at act ${act} midpoint (dusk=${d})`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

// Ordering proxy: contrast against black is monotone in relative luminance,
// so it ranks colors by lightness without widening contrast.ts's surface.
const lightnessOf = (hex: string) => contrastRatio(hex, "#000000");
const RAMP = ["fig1", "fig2", "fig3", "fig4", "fig5"] as const;

describe("figure ramp", () => {
  test("resolves to a validated pole at every content plateau", () => {
    // The ramp inverts between poles, so mid-transition it is briefly flat.
    // Content must never rest there — it may only rest on a pole.
    for (const d of CONTENT_PLATEAUS) {
      const t = duskToTokens(d);
      const pole = RAMP.map((k) => t[k]).join(",");
      const light = RAMP.map((k) => LIGHT[k]).join(",");
      const dark = RAMP.map((k) => DARK[k]).join(",");
      expect([light, dark], `ramp at dusk=${d} is a pole, not a blend`).toContain(
        pole
      );
      expect([LIGHT.figMute, DARK.figMute]).toContain(t.figMute);
    }
  });

  test("stays monotone in lightness at every content plateau", () => {
    for (const d of CONTENT_PLATEAUS) {
      const t = duskToTokens(d);
      const ls = RAMP.map((k) => lightnessOf(t[k]));
      const descending = ls.every((v, i) => i === 0 || v < ls[i - 1]);
      const ascending = ls.every((v, i) => i === 0 || v > ls[i - 1]);
      expect(
        descending || ascending,
        `ramp at dusk=${d} must order by lightness, got ${ls.map((n) => n.toFixed(2)).join(" ")}`
      ).toBe(true);
    }
  });

  test("keeps every ramp step readable against the interpolated background", () => {
    // Ordinal floor: the step nearest the surface still has to separate from
    // it, measured against the background as actually rendered at that dusk —
    // not against the pole the ramp was originally validated on.
    for (const d of CONTENT_PLATEAUS) {
      const t = duskToTokens(d);
      for (const k of RAMP) {
        expect(
          contrastRatio(t[k], t.bg),
          `${k} on bg at dusk=${d}`
        ).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test("keeps the de-emphasis series at mark contrast (>=3:1) on every plateau", () => {
    for (const d of CONTENT_PLATEAUS) {
      const t = duskToTokens(d);
      expect(
        contrastRatio(t.figMute, t.bg),
        `figMute on bg at dusk=${d}`
      ).toBeGreaterThanOrEqual(3);
    }
  });

  test("the degenerate crossing is narrower than the gap to any plateau", () => {
    // Guards the design decision above: if someone widens the ramp's easing
    // band, this fails before a chart can flatten out at a resting point.
    const flat = CONTENT_PLATEAUS.filter((d) => {
      const t = duskToTokens(d);
      const ls = RAMP.map((k) => lightnessOf(t[k]));
      const spread = Math.max(...ls) - Math.min(...ls);
      return spread < 1;
    });
    expect(flat, "no plateau may sit inside the ramp crossover").toEqual([]);
  });
});

describe("contrastRatio", () => {
  test("black on white is 21", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
  test("same color is 1", () => {
    expect(contrastRatio("#808080", "#808080")).toBeCloseTo(1, 5);
  });
});
