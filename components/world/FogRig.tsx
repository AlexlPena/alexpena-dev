"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollStore } from "@/lib/scroll/store";
import { duskToTokens } from "@/lib/theme/palette";
import { FOG_NEAR, fogFar } from "@/lib/world/atmosphere";

// Keeps three.js fog in lockstep with the dusk engine: fog color = the
// page's bg token (same function the DOM uses, so canvas and page cannot
// drift), fog depth opens as the world darkens. Short-circuits when dusk
// hasn't changed — zero allocation on idle frames.
export function FogRig() {
  const scene = useThree((s) => s.scene);
  const fogRef = useRef<THREE.Fog | null>(null);
  const lastDusk = useRef(Number.NaN);

  // Imperatively mutates the R3F `scene` object; see comment below at the
  // assignment.
  // eslint-disable-next-line react-hooks/immutability
  useFrame(() => {
    const { effectiveDusk } = scrollStore.getState();
    if (effectiveDusk === lastDusk.current) return;
    lastDusk.current = effectiveDusk;

    if (!fogRef.current) {
      fogRef.current = new THREE.Fog("#f7f5f1", FOG_NEAR, fogFar(0));
      // react-three-fiber's `scene` is a long-lived imperative three.js
      // object, not React state; mutating it outside render is the
      // documented R3F pattern.
      // eslint-disable-next-line react-hooks/immutability
      scene.fog = fogRef.current;
    }
    fogRef.current.color.set(duskToTokens(effectiveDusk).bg);
    fogRef.current.far = fogFar(effectiveDusk);
  });

  return null;
}
