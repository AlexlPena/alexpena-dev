import { describe, expect, it } from "vitest";
import { barPath, linear, linePoints, rampStep } from "./scale";

describe("linear", () => {
  it("maps domain endpoints onto range endpoints", () => {
    expect(linear(0, 0, 10, 100, 200)).toBe(100);
    expect(linear(10, 0, 10, 100, 200)).toBe(200);
    expect(linear(5, 0, 10, 100, 200)).toBe(150);
  });

  it("collapses a zero-width domain to the range start instead of dividing by zero", () => {
    expect(linear(4, 3, 3, 20, 90)).toBe(20);
  });

  it("supports an inverted range, as y-axes need", () => {
    expect(linear(0, 0, 100, 210, 30)).toBe(210);
    expect(linear(100, 0, 100, 210, 30)).toBe(30);
  });
});

describe("barPath", () => {
  it("rounds the data-end and keeps the baseline square", () => {
    const d = barPath(10, 20, 100, 24, 4);
    // Starts at the square baseline corner, arcs only on the right.
    expect(d.startsWith("M10,20")).toBe(true);
    expect((d.match(/a4,4/g) ?? []).length).toBe(2);
  });

  it("degrades to a square path when the bar is narrower than the radius", () => {
    const d = barPath(0, 0, 3, 24, 4);
    expect(d).toContain("a3,3");
  });

  it("emits a plain rectangle when the radius is zero", () => {
    expect(barPath(0, 0, 50, 10, 0)).toBe("M0,0h50v10h-50Z");
  });

  it("never lets the radius exceed half the height", () => {
    const d = barPath(0, 0, 100, 6, 4);
    expect(d).toContain("a3,3");
  });
});

describe("rampStep", () => {
  it("puts the maximum in the top step and zero in the bottom step", () => {
    expect(rampStep(165, 165, 5)).toBe(4);
    expect(rampStep(0, 165, 5)).toBe(0);
  });

  it("spreads midrange values across the interior steps", () => {
    expect(rampStep(50, 100, 5)).toBe(2);
    expect(rampStep(70, 100, 5)).toBe(3);
  });

  it("clamps out-of-range values rather than indexing past the ramp", () => {
    expect(rampStep(400, 165, 5)).toBe(4);
    expect(rampStep(-10, 165, 5)).toBe(0);
  });

  it("returns the bottom step when there is no magnitude to scale against", () => {
    expect(rampStep(5, 0, 5)).toBe(0);
  });
});

describe("linePoints", () => {
  it("spans the full width and inverts y so larger values sit higher", () => {
    const pts = linePoints([0, 10], 100, 20, 1).split(" ");
    expect(pts[0].startsWith("0.00,")).toBe(true);
    expect(pts[1].startsWith("100.00,")).toBe(true);
    const y0 = Number(pts[0].split(",")[1]);
    const y1 = Number(pts[1].split(",")[1]);
    expect(y1).toBeLessThan(y0);
  });

  it("centres a flat series instead of collapsing it onto an edge", () => {
    const pts = linePoints([7, 7, 7], 100, 20).split(" ");
    for (const p of pts) expect(p.split(",")[1]).toBe("10.00");
  });

  it("returns an empty string for an empty series", () => {
    expect(linePoints([], 100, 20)).toBe("");
  });
});
