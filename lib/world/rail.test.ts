import { describe, expect, test } from "vitest";
import {
  DESCENT_DEPTH,
  railY,
  STRATUM_DEPTHS,
  signalY,
  signalLead,
  signalVisible,
} from "./rail";
import { REST_POINTS } from "../scroll/journeyLayout";

describe("railY", () => {
  test("camera holds at surface through Acts I-II", () => {
    expect(railY(0)).toBe(0);
    expect(railY(0.16)).toBe(0);
    expect(railY(0.2)).toBe(0);
  });

  test("descends linearly to -DESCENT_DEPTH across the descent", () => {
    expect(railY(0.45)).toBeCloseTo(-DESCENT_DEPTH / 2, 5);
    expect(railY(0.7)).toBeCloseTo(-DESCENT_DEPTH, 5);
  });

  test("holds full depth through resolution", () => {
    expect(railY(0.75)).toBeCloseTo(-DESCENT_DEPTH, 5);
    expect(railY(0.82)).toBeCloseTo(-DESCENT_DEPTH, 5);
  });

  test("fast ascent returns to surface", () => {
    expect(railY(0.87)).toBeCloseTo(-DESCENT_DEPTH / 2, 5);
    expect(railY(0.92)).toBeCloseTo(0, 5);
    expect(railY(1)).toBe(0);
  });

  test("clamps out-of-range input", () => {
    expect(railY(-1)).toBe(0);
    expect(railY(2)).toBe(0);
  });
});

describe("STRATUM_DEPTHS", () => {
  test("equals the camera rest depth at each stratum rest point", () => {
    expect(STRATUM_DEPTHS).toHaveLength(4);
    expect(STRATUM_DEPTHS[0]).toBeCloseTo(railY(REST_POINTS.stratum1), 5);
    expect(STRATUM_DEPTHS[1]).toBeCloseTo(railY(REST_POINTS.stratum2), 5);
    expect(STRATUM_DEPTHS[2]).toBeCloseTo(railY(REST_POINTS.stratum3), 5);
    expect(STRATUM_DEPTHS[3]).toBeCloseTo(railY(REST_POINTS.stratum4), 5);
  });

  test("depths are strictly descending", () => {
    for (let i = 1; i < STRATUM_DEPTHS.length; i++) {
      expect(STRATUM_DEPTHS[i]).toBeLessThan(STRATUM_DEPTHS[i - 1]);
    }
  });

  test("matches the spec's literal depths", () => {
    expect(STRATUM_DEPTHS[0]).toBeCloseTo(-4.8, 5);
    expect(STRATUM_DEPTHS[1]).toBeCloseTo(-16, 5);
    expect(STRATUM_DEPTHS[2]).toBeCloseTo(-27.2, 5);
    expect(STRATUM_DEPTHS[3]).toBeCloseTo(-40, 5);
  });
});

describe("signal", () => {
  test("leads the camera by 2 units before the loop stratum", () => {
    expect(signalLead(0.3)).toBeCloseTo(2, 5);
    expect(signalY(0.3)).toBeCloseTo(railY(0.3) - 2, 5);
    expect(signalY(0.3)).toBeCloseTo(-10, 5);
  });

  test("pulls ahead to 5 units entering the loop stratum", () => {
    expect(signalLead(0.65)).toBeCloseTo(5, 5);
    expect(signalLead(0.7)).toBeCloseTo(5, 5);
  });

  test("visibility window", () => {
    expect(signalVisible(0.05)).toBe(false);
    expect(signalVisible(0.1)).toBe(true);
    expect(signalVisible(0.5)).toBe(true);
    expect(signalVisible(0.86)).toBe(true);
    expect(signalVisible(0.9)).toBe(false);
  });
});
