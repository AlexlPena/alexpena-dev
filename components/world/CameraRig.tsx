"use client";

import { useFrame } from "@react-three/fiber";
import { scrollStore } from "@/lib/scroll/store";
import { railY } from "@/lib/world/rail";

// Reads the store imperatively every frame — zero React re-renders on
// scroll. Lerp gives the camera physical weight on top of Lenis smoothing.
export function CameraRig() {
  useFrame(({ camera }, delta) => {
    const target = railY(scrollStore.getState().progress);
    const k = 1 - Math.exp(-6 * delta); // framerate-independent lerp
    camera.position.y += (target - camera.position.y) * k;
  });
  return null;
}
