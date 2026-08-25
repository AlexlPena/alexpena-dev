import { describe, expect, it } from "vitest";
import { revealFromRect, staggerAt, staggerDelay } from "./reveal";

const VH = 900;
const H = 400;

describe("revealFromRect", () => {
  it("is unstarted the instant the figure's top touches the fold", () => {
    expect(revealFromRect(VH, H, VH)).toBe(0);
  });

  it("is still unstarted while the figure is entirely below the fold", () => {
    expect(revealFromRect(VH + 300, H, VH)).toBe(0);
  });

  it("completes only once the figure has settled above the fold", () => {
    const settle = 0.18;
    // Bottom edge exactly `settle` of a viewport above the fold.
    const top = VH * (1 - settle) - H;
    expect(revealFromRect(top, H, VH, settle)).toBeCloseTo(1, 6);
  });

  it("is only part-drawn when just the top sliver is showing", () => {
    // This is the case that looked wrong: a figure barely peeking in must not
    // already be most of the way through its draw.
    const justPeeking = VH - 40;
    expect(revealFromRect(justPeeking, H, VH)).toBeLessThan(0.1);
  });

  it("is past halfway only once a good part of the figure is on screen", () => {
    const halfShowing = VH - H / 2;
    const v = revealFromRect(halfShowing, H, VH);
    expect(v).toBeGreaterThan(0.2);
    expect(v).toBeLessThan(0.6);
  });

  it("stays drawn once the figure has scrolled above the viewport", () => {
    expect(revealFromRect(-500, H, VH)).toBe(1);
  });

  it("finishes later with a larger settle", () => {
    const top = VH - H;
    expect(revealFromRect(top, H, VH, 0.3)).toBeLessThan(
      revealFromRect(top, H, VH, 0.05)
    );
  });

  it("handles a figure taller than the viewport without stalling at zero", () => {
    const tall = VH * 2;
    expect(revealFromRect(VH - 100, tall, VH)).toBeGreaterThan(0);
    expect(revealFromRect(-tall, tall, VH)).toBe(1);
  });

  it("returns 0 rather than NaN for a non-finite rect or dead viewport", () => {
    expect(revealFromRect(Number.NaN, H, VH)).toBe(0);
    expect(revealFromRect(100, H, 0)).toBe(0);
  });
});

describe("staggerAt", () => {
  it("spans 0 to 1 across the group reveal", () => {
    expect(staggerAt(0, 0, 5)).toBe(0);
    expect(staggerAt(1, 0, 5)).toBe(1);
    expect(staggerAt(1, 4, 5)).toBe(1);
  });

  it("starts earlier elements before later ones", () => {
    expect(staggerAt(0.5, 0, 5)).toBeGreaterThan(staggerAt(0.5, 4, 5));
  });

  it("leaves the last element still running when the first has finished", () => {
    expect(staggerAt(0.75, 0, 5)).toBe(1);
    expect(staggerAt(0.75, 4, 5)).toBeLessThan(1);
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

describe("staggerDelay", () => {
  it("puts the first element at zero and the last at 1 - run", () => {
    expect(staggerDelay(0, 5, 0.55)).toBe(0);
    expect(staggerDelay(4, 5, 0.55)).toBeCloseTo(0.45, 10);
  });

  it("agrees with staggerAt's own gating", () => {
    for (let i = 0; i < 5; i++) {
      const d = staggerDelay(i, 5);
      expect(staggerAt(d, i, 5)).toBeCloseTo(0, 10);
    }
  });

  it("is zero for a lone element", () => {
    expect(staggerDelay(0, 1)).toBe(0);
  });
});
