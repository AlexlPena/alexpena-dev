import { describe, expect, test } from "vitest";
import { duskToTokens, CONTENT_PLATEAUS, LIGHT, DARK } from "./palette";
import { contrastRatio } from "./contrast";

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
});

describe("contrastRatio", () => {
  test("black on white is 21", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
  test("same color is 1", () => {
    expect(contrastRatio("#808080", "#808080")).toBeCloseTo(1, 5);
  });
});
