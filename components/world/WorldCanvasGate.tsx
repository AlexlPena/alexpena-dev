"use client";

import dynamic from "next/dynamic";
import { useCanvasEligible } from "./useCanvasEligible";

// Code-split: three.js enters the page only if this device qualifies.
const WorldCanvas = dynamic(() => import("./WorldCanvas"), { ssr: false });

export function WorldCanvasGate() {
  const eligible = useCanvasEligible();
  if (!eligible) return null;
  return <WorldCanvas />;
}
