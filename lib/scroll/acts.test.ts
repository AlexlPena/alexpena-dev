import { describe, expect, test } from "vitest";
import { ACT_BOUNDARIES, actAt, actMidpoint } from "./acts";

describe("acts", () => {
  test("boundaries match the spec", () => {
    expect(ACT_BOUNDARIES).toEqual([0.1, 0.2, 0.7, 0.82, 0.92]);
  });

  test("actAt maps progress to acts", () => {
    expect(actAt(0)).toBe(1);
    expect(actAt(0.15)).toBe(2);
    expect(actAt(0.45)).toBe(3);
    expect(actAt(0.75)).toBe(4);
    expect(actAt(0.87)).toBe(5);
    expect(actAt(0.99)).toBe(6);
    expect(actAt(1)).toBe(6);
  });

  test("actMidpoint returns the center of each act's range", () => {
    expect(actMidpoint(1)).toBeCloseTo(0.05, 5);
    expect(actMidpoint(3)).toBeCloseTo(0.45, 5);
    expect(actMidpoint(6)).toBeCloseTo(0.96, 5);
  });
});
