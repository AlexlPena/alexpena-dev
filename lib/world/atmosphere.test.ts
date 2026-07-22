import { describe, expect, test } from "vitest";
import {
  FOG_NEAR,
  fogFar,
  PARALLAX_MAX_X,
  PARALLAX_MAX_Y,
  parallaxOffset,
} from "./atmosphere";

describe("fog", () => {
  test("constants", () => {
    expect(FOG_NEAR).toBe(6);
  });

  test("light world is shrouded, dark world is clear", () => {
    expect(fogFar(0)).toBe(12);
    expect(fogFar(1)).toBe(30);
    expect(fogFar(0.5)).toBeCloseTo(21, 5);
  });

  test("monotonically increasing with dusk", () => {
    let prev = fogFar(0);
    for (let d = 0.1; d <= 1; d += 0.1) {
      const v = fogFar(d);
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
  });

  test("clamps out-of-range dusk", () => {
    expect(fogFar(-1)).toBe(12);
    expect(fogFar(2)).toBe(30);
  });
});

describe("parallaxOffset", () => {
  test("scales pointer by max", () => {
    expect(parallaxOffset(0, PARALLAX_MAX_X)).toBe(0);
    expect(parallaxOffset(1, PARALLAX_MAX_X)).toBe(PARALLAX_MAX_X);
    expect(parallaxOffset(-1, PARALLAX_MAX_Y)).toBe(-PARALLAX_MAX_Y);
    expect(parallaxOffset(0.5, 0.4)).toBeCloseTo(0.2, 5);
  });

  test("clamps runaway pointer values", () => {
    expect(parallaxOffset(5, PARALLAX_MAX_X)).toBe(PARALLAX_MAX_X);
    expect(parallaxOffset(-5, PARALLAX_MAX_X)).toBe(-PARALLAX_MAX_X);
  });
});
