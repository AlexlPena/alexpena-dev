import { describe, expect, test } from "vitest";
import { CHUNKS } from "./chunks";
import { buildAnimations, TIMING, totalDuration } from "./timeline";

describe("monogram timeline", () => {
  const anims = buildAnimations();

  test("produces one animation per chunk", () => {
    expect(anims).toHaveLength(CHUNKS.length);
    expect(anims.map((a) => a.id).sort()).toEqual(CHUNKS.map((c) => c.id).sort());
  });

  test("is deterministic across calls", () => {
    expect(buildAnimations()).toEqual(anims);
  });

  test("every chunk lands within the assembly window", () => {
    for (const a of anims) {
      expect(a.delay, a.id).toBeGreaterThanOrEqual(0);
      expect(a.delay + a.duration, a.id).toBeLessThanOrEqual(TIMING.assembly + 1e-9);
    }
  });

  test("the large skeleton and bowl land before the small stem slabs", () => {
    const landing = (id: string) => {
      const a = anims.find((x) => x.id === id)!;
      return a.delay + a.duration;
    };
    expect(landing("a-skeleton")).toBeLessThan(landing("p-stem-foot"));
    expect(landing("p-bowl")).toBeLessThan(landing("p-stem-foot"));
  });

  test("start offsets are non-zero and stay within ~1.5x the logo box", () => {
    for (const a of anims) {
      const dist = Math.hypot(a.from.x, a.from.y);
      expect(dist, a.id).toBeGreaterThan(5);
      expect(dist, a.id).toBeLessThan(160);
    }
  });

  test("total duration covers assembly, hold and dissolve", () => {
    expect(totalDuration()).toBeCloseTo(2.75, 5);
  });
});
