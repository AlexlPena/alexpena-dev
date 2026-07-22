"use client";

import { CameraRig } from "./CameraRig";
import { FogRig } from "./FogRig";
import { Signal } from "./Signal";
import { PromptStratum } from "./strata/PromptStratum";
import { ContextStratum } from "./strata/ContextStratum";
import { HarnessStratum } from "./strata/HarnessStratum";
import { LoopStratum } from "./strata/LoopStratum";
import { STRATUM_DEPTHS } from "@/lib/world/rail";

// Scene contents. The Canvas element (and the decision to mount at all)
// lives in WorldCanvas.tsx.
export function World() {
  return (
    <>
      <CameraRig />
      <FogRig />
      <hemisphereLight args={["#f2efe9", "#12100e", 1.6]} />
      <directionalLight position={[6, 10, 8]} intensity={2.2} />
      <Signal />
      <PromptStratum depth={STRATUM_DEPTHS[0]} />
      <ContextStratum depth={STRATUM_DEPTHS[1]} />
      <HarnessStratum depth={STRATUM_DEPTHS[2]} />
      <LoopStratum depth={STRATUM_DEPTHS[3]} />
    </>
  );
}
