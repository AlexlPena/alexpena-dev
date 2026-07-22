import { describe, expect, test } from "vitest";
import {
  JOURNEY_VH,
  VIEWPORT_VH,
  topVhForRest,
  REST_POINTS,
} from "./journeyLayout";
import { duskCurve } from "./duskCurve";
import { duskToTokens, CONTENT_PLATEAUS } from "../theme/palette";
import { contrastRatio } from "../theme/contrast";

describe("journeyLayout", () => {
  test("journey dimensions", () => {
    expect(JOURNEY_VH).toBe(800);
    expect(VIEWPORT_VH).toBe(100);
  });

  test("topVhForRest centers a 100vh block at the given progress", () => {
    // scrollY at progress p = p * (800 - 100)vh; block top must equal that
    // scrollY so the block fills the viewport exactly at rest.
    expect(topVhForRest(0)).toBe(0);
    expect(topVhForRest(0.5)).toBe(350);
    expect(topVhForRest(1)).toBe(700);
  });

  test("every rest point lands on a dusk plateau", () => {
    for (const p of Object.values(REST_POINTS)) {
      expect(
        CONTENT_PLATEAUS,
        `duskCurve(${p}) must be a content plateau`
      ).toContain(duskCurve(p));
    }
  });

  test("ink meets AA on background at every rest point", () => {
    for (const [name, p] of Object.entries(REST_POINTS)) {
      const t = duskToTokens(duskCurve(p));
      expect(
        contrastRatio(t.ink, t.bg),
        `ink on bg at rest ${name}`
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(t.inkSecondary, t.bg),
        `inkSecondary on bg at rest ${name}`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
