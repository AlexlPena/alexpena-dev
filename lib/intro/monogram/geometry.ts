import { ExtrudeGeometry, Shape } from "three";
import { parsePath } from "./path";
import { VIEWBOX, type Chunk } from "./chunks";

/** Shallow, matching the reference: ~10% of cap height. */
export const EXTRUDE_DEPTH = 10;

/**
 * Builds a THREE.Shape from our path subset. SVG's y axis points down and
 * three's points up, so v is flipped here — do it once, at the boundary.
 */
export function shapeFromPath(d: string): Shape {
  const shape = new Shape();
  const flip = (y: number) => VIEWBOX.height - y;

  for (const cmd of parsePath(d)) {
    if (cmd.type === "M") shape.moveTo(cmd.x, flip(cmd.y));
    else if (cmd.type === "L") shape.lineTo(cmd.x, flip(cmd.y));
    else if (cmd.type === "C")
      shape.bezierCurveTo(cmd.x1, flip(cmd.y1), cmd.x2, flip(cmd.y2), cmd.x, flip(cmd.y));
    else shape.closePath();
  }

  return shape;
}

export function buildChunkGeometry(chunk: Chunk): ExtrudeGeometry {
  const geometry = new ExtrudeGeometry(shapeFromPath(chunk.d), {
    depth: EXTRUDE_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.9,
    bevelSize: 0.7,
    bevelSegments: 2,
    curveSegments: 24,
  });
  // Pivot on the chunk's own centroid — NOT geometry.center(), which uses the
  // bounding-box centre and diverges from chunk.centroid for asymmetric chunks
  // (a-skeleton by ~6 units), misplacing them when the consumer positions by centroid.
  geometry.translate(
    -chunk.centroid.u,
    -(VIEWBOX.height - chunk.centroid.v),
    -EXTRUDE_DEPTH / 2,
  );
  return geometry;
}
