import { describe, expect, test } from "vitest";
import { CHUNKS } from "./chunks";
import { buildChunkGeometry, shapeFromPath } from "./geometry";

describe("monogram geometry", () => {
  test("builds a shape with points from a simple polygon path", () => {
    const shape = shapeFromPath("M 0 0 L 10 0 L 5 8 Z");
    expect(shape.getPoints().length).toBeGreaterThan(2);
  });

  test("every chunk extrudes to non-empty geometry", () => {
    for (const chunk of CHUNKS) {
      const geo = buildChunkGeometry(chunk);
      expect(geo.getAttribute("position").count, chunk.id).toBeGreaterThan(0);
      geo.dispose();
    }
  });

  test("extruded geometry exposes two material groups: caps and sides", () => {
    const geo = buildChunkGeometry(CHUNKS[0]);
    const indices = [...new Set(geo.groups.map((g) => g.materialIndex))].sort();
    expect(indices).toEqual([0, 1]);
    geo.dispose();
  });

  test("geometry is centred on the origin so rotations pivot about the chunk", () => {
    const geo = buildChunkGeometry(CHUNKS[0]);
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    const cx = (box.min.x + box.max.x) / 2;
    const cy = (box.min.y + box.max.y) / 2;
    expect(Math.abs(cx)).toBeLessThan(0.01);
    expect(Math.abs(cy)).toBeLessThan(0.01);
    geo.dispose();
  });
});
