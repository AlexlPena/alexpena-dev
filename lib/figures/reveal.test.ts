import { describe, expect, it } from "vitest";
import { revealAt, staggerAt } from "./reveal";

describe("revealAt", () => {
  it("is fully drawn exactly at the rest point", () => {
    expect(revealAt(0.4, 0.4)).toBe(1);
  });

  it("is unstarted a full lead before the rest point", () => {
    expect(revealAt(0.32, 0.4, 0.08)).toBe(0);
    expect(revealAt(0.2, 0.4, 0.08)).toBe(0);
  });

  it("is halfway at half a lead out", () => {
    expect(revealAt(0.36, 0.4, 0.08)).toBeCloseTo(0.5, 6);
  });

  it("stays drawn after the section has passed", () => {
    expect(revealAt(0.9, 0.4)).toBe(1);
  });

  it("degrades to a hard switch when there is no lead", () => {
    expect(revealAt(0.39, 0.4, 0)).toBe(0);
    expect(revealAt(0.4, 0.4, 0)).toBe(1);
  });

  it("returns 0 for non-finite progress rather than NaN", () => {
    expect(revealAt(Number.NaN, 0.4)).toBe(0);
  });
});

describe("staggerAt", () => {
  it("spans 0 to 1 across the group reveal", () => {
    expect(staggerAt(0, 0, 5)).toBe(0);
    expect(staggerAt(1, 0, 5)).toBe(1);
    expect(staggerAt(1, 4, 5)).toBe(1);
  });

  it("starts earlier elements before later ones", () => {
    const mid = 0.5;
    const first = staggerAt(mid, 0, 5);
    const last = staggerAt(mid, 4, 5);
    expect(first).toBeGreaterThan(last);
  });

  it("leaves the last element still running when the first has finished", () => {
    const r = 0.75;
    expect(staggerAt(r, 0, 5)).toBe(1);
    expect(staggerAt(r, 4, 5)).toBeLessThan(1);
  });

  it("treats a single element as ungated", () => {
    expect(staggerAt(0.3, 0, 1)).toBe(0.3);
  });

  it("never returns a value outside 0..1", () => {
    for (const r of [-1, 0, 0.5, 1, 2]) {
      for (let i = 0; i < 4; i++) {
        const v = staggerAt(r, i, 4);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });
});
