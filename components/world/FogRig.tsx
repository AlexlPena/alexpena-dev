"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollStore } from "@/lib/scroll/store";
import { duskToBg } from "@/lib/theme/palette";
import { FOG_NEAR, fogFar } from "@/lib/world/atmosphere";

// Keeps three.js fog in lockstep with the dusk engine: fog color = the
// page's bg token (same function the DOM uses, so canvas and page cannot
// drift), fog depth opens as the world darkens. Short-circuits when dusk
// hasn't changed — zero allocation on idle frames.
export function FogRig() {
  const fogRef = useRef<THREE.Fog | null>(null);
  const lastDusk = useRef(Number.NaN);

  useFrame(({ scene }) => {
    const { effectiveDusk } = scrollStore.getState();
    if (effectiveDusk === lastDusk.current) return;
    lastDusk.current = effectiveDusk;

    if (!fogRef.current) {
      fogRef.current = new THREE.Fog("#f7f5f1", FOG_NEAR, fogFar(0));
      scene.fog = fogRef.current;
    }
    fogRef.current.color.set(duskToBg(effectiveDusk));
    fogRef.current.far = fogFar(effectiveDusk);
  });

  return null;
}
