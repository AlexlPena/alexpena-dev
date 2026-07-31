import { describe, expect, test } from "vitest";
import { parsePath } from "./path";
import { CHUNKS, VIEWBOX } from "./chunks";

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
});
