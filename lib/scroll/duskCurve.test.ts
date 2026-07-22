import { describe, expect, test } from "vitest";
import { duskCurve, DUSK_ANCHORS } from "./duskCurve";
import { CONTENT_PLATEAUS } from "../theme/palette";

describe("duskCurve", () => {
  test("Act I is fully light", () => {
    expect(duskCurve(0)).toBe(0);
    expect(duskCurve(0.05)).toBe(0);
    expect(duskCurve(0.1)).toBe(0);
  });

  test("Act II plateau is the first dim (0.12)", () => {
    expect(duskCurve(0.15)).toBeCloseTo(0.12, 5);
    expect(duskCurve(0.17)).toBeCloseTo(0.12, 5);
  });

  test("stratum plateaus hit 0.55 / 0.70 / 0.85 / 1.0", () => {
    expect(duskCurve(0.27)).toBeCloseTo(0.55, 5); // stratum 1
    expect(duskCurve(0.38)).toBeCloseTo(0.7, 5); // stratum 2
    expect(duskCurve(0.54)).toBeCloseTo(0.85, 5); // stratum 3
    expect(duskCurve(0.65)).toBeCloseTo(1, 5); // stratum 4
  });

  test("resolution (Act IV) holds full dark", () => {
    expect(duskCurve(0.75)).toBe(1);
    expect(duskCurve(0.82)).toBe(1);
  });

  test("ascent returns to light and Act VI stays light", () => {
    expect(duskCurve(0.94)).toBe(0);
    expect(duskCurve(1)).toBe(0);
  });

  test("curve is continuous (no jumps > 0.02 per 0.001 progress)", () => {
    for (let p = 0; p < 1; p += 0.001) {
      expect(Math.abs(duskCurve(p + 0.001) - duskCurve(p))).toBeLessThan(0.02);
    }
  });

  test("every plateau value exists in CONTENT_PLATEAUS (palette sync)", () => {
    const plateauValues = [0, 0.12, 0.55, 0.7, 0.85, 1];
    for (const v of plateauValues) {
      expect(CONTENT_PLATEAUS).toContain(v);
    }
    // anchors actually produce those plateaus
    const anchorValues = DUSK_ANCHORS.map(([, d]) => d);
    for (const v of plateauValues) {
      expect(anchorValues).toContain(v);
    }
  });
});
