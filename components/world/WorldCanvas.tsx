"use client";

import { Canvas } from "@react-three/fiber";
import { World } from "./World";

// Fixed, full-viewport, behind the DOM (z-0 vs main's z-10), transparent so
// the dusk background shows through, and inert to both pointer and AT.
export function WorldCanvas() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    >
      <Canvas
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 10], fov: 50 }}
        frameloop="always"
      >
        <World />
      </Canvas>
    </div>
  );
}

export default WorldCanvas;
