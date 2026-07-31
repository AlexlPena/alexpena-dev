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

  test("asymmetric chunks pivot on their centroid, not their bounding box", () => {
    // a-skeleton's vertex-average centroid sits well above its bbox centre, so a
    // correctly centroid-pivoted geometry has a bbox that is NOT centred on origin.
    const chunk = CHUNKS.find((c) => c.id === "a-skeleton")!;
    const geo = buildChunkGeometry(chunk);
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    const cy = (box.min.y + box.max.y) / 2;
    expect(Math.abs(cy)).toBeGreaterThan(1);
    geo.dispose();
  });

  test("extrusion is centred on its mid-plane in z", () => {
    const geo = buildChunkGeometry(CHUNKS[0]);
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    const cz = (box.min.z + box.max.z) / 2;
    expect(Math.abs(cz)).toBeLessThan(0.01);
    geo.dispose();
  });

  test("the curved bowl chunk also exposes both material groups", () => {
    const chunk = CHUNKS.find((c) => c.id === "p-bowl")!;
    const geo = buildChunkGeometry(chunk);
    const indices = [...new Set(geo.groups.map((g) => g.materialIndex))].sort();
    expect(indices).toEqual([0, 1]);
    geo.dispose();
  });
});
