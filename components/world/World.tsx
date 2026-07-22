"use client";

import { CameraRig } from "./CameraRig";
import { StratumBlock } from "./StratumBlock";
import { Signal } from "./Signal";
import { STRATUM_DEPTHS } from "@/lib/world/rail";

// Scene contents. The Canvas element (and the decision to mount at all)
// lives in WorldCanvas.tsx.
export function World() {
  return (
    <>
      <CameraRig />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 8, 6]} intensity={0.6} />
      <Signal />
      {STRATUM_DEPTHS.map((depth, i) => (
        <StratumBlock key={depth} depth={depth} variant={i as 0 | 1 | 2 | 3} />
      ))}
    </>
  );
}
