"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { scrollStore } from "@/lib/scroll/store";
import { railY } from "@/lib/world/rail";
import {
  parallaxOffset,
  PARALLAX_MAX_X,
  PARALLAX_MAX_Y,
} from "@/lib/world/atmosphere";

// Reads the store imperatively every frame — zero React re-renders on
// scroll. Lerp gives the camera physical weight on top of Lenis smoothing.
// The first frame snaps directly to target so a canvas that mounts
// mid-journey (reload with scroll restoration, eligibility flip) doesn't
// swoop down through every stratum.
export function CameraRig() {
  const snapped = useRef(false);

  useFrame(({ camera, pointer }, delta) => {
    const target = railY(scrollStore.getState().progress);
    const px = parallaxOffset(pointer.x, PARALLAX_MAX_X);
    const py = parallaxOffset(pointer.y, PARALLAX_MAX_Y);
    if (!snapped.current) {
      snapped.current = true;
      camera.position.y = target;
      camera.position.x = px;
      return;
    }
    const k = 1 - Math.exp(-6 * delta); // framerate-independent lerp
    camera.position.y += (target + py - camera.position.y) * k;
    camera.position.x += (px - camera.position.x) * k;
  });
  return null;
}
