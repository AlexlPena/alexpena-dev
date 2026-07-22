"use client";

import { useEffect, useRef } from "react";
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
//
// Pointer comes from a window listener, not R3F's state.pointer: the canvas
// wrapper is pointer-events-none (the DOM must stay interactive above it),
// so R3F's own canvas-scoped listeners never fire.
export function CameraRig() {
  const snapped = useRef(false);
  const pointer = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(({ camera }, delta) => {
    const target = railY(scrollStore.getState().progress);
    const px = parallaxOffset(pointer.current.x, PARALLAX_MAX_X);
    const py = parallaxOffset(pointer.current.y, PARALLAX_MAX_Y);
    if (!snapped.current) {
      snapped.current = true;
      camera.position.y = target + py;
      camera.position.x = px;
      return;
    }
    const k = 1 - Math.exp(-6 * delta); // framerate-independent lerp
    camera.position.y += (target + py - camera.position.y) * k;
    camera.position.x += (px - camera.position.x) * k;
  });
  return null;
}
