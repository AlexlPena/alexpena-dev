"use client";

import { CameraRig } from "./CameraRig";
import { FogRig } from "./FogRig";
import { StratumBlock } from "./StratumBlock";
import { Signal } from "./Signal";
import { STRATUM_DEPTHS } from "@/lib/world/rail";

// Scene contents. The Canvas element (and the decision to mount at all)
// lives in WorldCanvas.tsx.
export function World() {
  return (
    <>
      <CameraRig />
      <FogRig />
      <hemisphereLight args={["#f2efe9", "#12100e", 0.5]} />
      <directionalLight position={[6, 10, 8]} intensity={0.7} />
      <Signal />
      {STRATUM_DEPTHS.map((depth, i) => (
        <StratumBlock key={depth} depth={depth} variant={i as 0 | 1 | 2 | 3} />
      ))}
    </>
  );
}
