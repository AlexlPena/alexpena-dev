import { describe, expect, test } from "vitest";
import { parsePath, type PathCommand } from "./path";
import { CHUNKS, VIEWBOX } from "./chunks";
import { METRICS } from "./metrics";

/** Extracts every M/L endpoint plus C control and end points from a path. */
function allXY(cmds: PathCommand[]): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  for (const cmd of cmds) {
    if (cmd.type === "M" || cmd.type === "L") out.push({ x: cmd.x, y: cmd.y });
    else if (cmd.type === "C") {
      out.push({ x: cmd.x1, y: cmd.y1 }, { x: cmd.x2, y: cmd.y2 }, { x: cmd.x, y: cmd.y });
    }
  }
  return out;
}

describe("monogram chunks", () => {
  test("has twelve chunks, six per letter", () => {
    expect(CHUNKS).toHaveLength(12);
    expect(CHUNKS.filter((c) => c.material === "ink")).toHaveLength(6);
    expect(CHUNKS.filter((c) => c.material === "copper")).toHaveLength(6);
  });

  test("chunk ids are unique", () => {
    expect(new Set(CHUNKS.map((c) => c.id)).size).toBe(12);
  });

  test("every chunk path parses and is explicitly closed", () => {
    for (const chunk of CHUNKS) {
      const cmds = parsePath(chunk.d);
      expect(cmds.length, chunk.id).toBeGreaterThan(3);
      expect(cmds[0].type, chunk.id).toBe("M");
      expect(cmds[cmds.length - 1].type, chunk.id).toBe("Z");
    }
  });

  test("every vertex lies inside the viewBox", () => {
    for (const chunk of CHUNKS) {
      for (const cmd of parsePath(chunk.d)) {
        if (cmd.type === "Z") continue;
        expect(cmd.x, `${chunk.id} x`).toBeGreaterThanOrEqual(-0.01);
        expect(cmd.x, `${chunk.id} x`).toBeLessThanOrEqual(VIEWBOX.width + 0.01);
        expect(cmd.y, `${chunk.id} y`).toBeGreaterThanOrEqual(-0.01);
        expect(cmd.y, `${chunk.id} y`).toBeLessThanOrEqual(VIEWBOX.height + 0.01);
      }
    }
  });

  test("the bowl is the only curved chunk — curves are never fractured", () => {
    const curved = CHUNKS.filter((c) =>
      parsePath(c.d).some((cmd) => cmd.type === "C"),
    );
    expect(curved.map((c) => c.id)).toEqual(["p-bowl"]);
  });

  test("every chunk has a centroid inside the viewBox", () => {
    for (const chunk of CHUNKS) {
      expect(chunk.centroid.u, chunk.id).toBeGreaterThan(0);
      expect(chunk.centroid.u, chunk.id).toBeLessThan(VIEWBOX.width);
      expect(chunk.centroid.v, chunk.id).toBeGreaterThan(0);
      expect(chunk.centroid.v, chunk.id).toBeLessThan(VIEWBOX.height);
    }
  });

  test("ink chunks sit left of the P stem, copper chunks right of the A apex", () => {
    const ink = CHUNKS.filter((c) => c.material === "ink");
    const copper = CHUNKS.filter((c) => c.material === "copper");
    expect(Math.min(...copper.map((c) => c.centroid.u))).toBeGreaterThan(70);
    expect(Math.min(...ink.map((c) => c.centroid.u))).toBeLessThan(50);
  });

  test("the bowl's counter (hole) never drifts right of the stem's edge", () => {
    const bowl = CHUNKS.find((c) => c.id === "p-bowl")!;
    const points = allXY(parsePath(bowl.d));
    // The bowl's stem-facing points (the M anchor, and the counter's near
    // corners) sit far to the left of the counter's far side and the outer
    // bowl sweep's control points (a gap of ~25+ units); the midpoint below
    // cleanly separates "stem-facing" points from the rest of the curve.
    const stemFacing = points.filter(
      (pt) => pt.x < (METRICS.p.counterRightU + METRICS.p.stemRightU) / 2,
    );
    expect(stemFacing.length).toBeGreaterThan(0);
    for (const pt of stemFacing) {
      expect(pt.x).toBeLessThanOrEqual(METRICS.p.stemRightU);
    }
  });

  test("consecutive A left-leg slabs share their edge exactly", () => {
    const ids = ["a-left-mid", "a-left-lower", "a-left-foot"];
    const slabs = ids.map((id) => {
      const chunk = CHUNKS.find((c) => c.id === id)!;
      const cmds = parsePath(chunk.d).filter(
        (cmd): cmd is Extract<PathCommand, { type: "M" | "L" }> =>
          cmd.type === "M" || cmd.type === "L",
      );
      // polygon() emits M(topOuter) L(topInner) L(bottomInner) L(bottomOuter) Z.
      return { topOuter: cmds[0], topInner: cmds[1], bottomInner: cmds[2], bottomOuter: cmds[3] };
    });

    for (let i = 0; i < slabs.length - 1; i++) {
      const upper = slabs[i];
      const lower = slabs[i + 1];
      expect([lower.topOuter.x, lower.topOuter.y], `slab ${i} outer edge`).toEqual([
        upper.bottomOuter.x,
        upper.bottomOuter.y,
      ]);
      expect([lower.topInner.x, lower.topInner.y], `slab ${i} inner edge`).toEqual([
        upper.bottomInner.x,
        upper.bottomInner.y,
      ]);
    }
  });
});
