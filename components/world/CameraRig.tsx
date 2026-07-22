"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { scrollStore } from "@/lib/scroll/store";
import { railY } from "@/lib/world/rail";

// Reads the store imperatively every frame — zero React re-renders on
// scroll. Lerp gives the camera physical weight on top of Lenis smoothing.
// The first frame snaps directly to target so a canvas that mounts
// mid-journey (reload with scroll restoration, eligibility flip) doesn't
// swoop down through every stratum.
export function CameraRig() {
  const snapped = useRef(false);

  useFrame(({ camera }, delta) => {
    const target = railY(scrollStore.getState().progress);
    if (!snapped.current) {
      snapped.current = true;
      camera.position.y = target;
      return;
    }
    const k = 1 - Math.exp(-6 * delta); // framerate-independent lerp
    camera.position.y += (target - camera.position.y) * k;
  });
  return null;
}
