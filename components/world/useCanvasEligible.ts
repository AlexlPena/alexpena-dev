"use client";

import { useEffect, useState } from "react";

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") || canvas.getContext("webgl")
    );
  } catch {
    return false;
  }
}

// The world mounts only where it can be excellent: desktop pointer devices,
// motion welcome, WebGL present. Everywhere else the DOM story IS the site
// (spec Section 7, device tiers 3-4). Starts false so SSR and first paint
// are canvas-free by construction.
export function useCanvasEligible(): boolean {
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia(
      "(min-width: 1024px) and (hover: hover)"
    );
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const evaluate = () =>
      setEligible(desktop.matches && !reduced.matches && webglAvailable());

    evaluate();
    desktop.addEventListener("change", evaluate);
    reduced.addEventListener("change", evaluate);
    return () => {
      desktop.removeEventListener("change", evaluate);
      reduced.removeEventListener("change", evaluate);
    };
  }, []);

  return eligible;
}
