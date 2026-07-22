"use client";

import { Edges } from "@react-three/drei";

const GRAPHITE = "#221f1b";
const GRAPHITE_SOFT = "#2e2a25";
const COPPER = "#d67f3c";

// Prompt Engineering: a converging channel of shaping vanes — raw intent
// enters wide at the top and leaves precise at the bottom. Static by
// design: precision doesn't fidget. The final vane pair carries copper
// edges, marking where the shaped request exits toward the next depth.
export function PromptStratum({ depth }: { depth: number }) {
  const vanes: Array<{
    y: number;
    x: number;
    tilt: number;
    w: number;
    copper?: boolean;
  }> = [
    { y: 1.5, x: -1.9, tilt: 0.55, w: 2.6 },
    { y: 1.5, x: 1.9, tilt: -0.55, w: 2.6 },
    { y: 0.5, x: -1.35, tilt: 0.38, w: 2.2 },
    { y: 0.5, x: 1.35, tilt: -0.38, w: 2.2 },
    { y: -0.5, x: -0.95, tilt: 0.22, w: 1.8 },
    { y: -0.5, x: 0.95, tilt: -0.22, w: 1.8 },
    { y: -1.5, x: -0.65, tilt: 0.08, w: 1.4, copper: true },
    { y: -1.5, x: 0.65, tilt: -0.08, w: 1.4, copper: true },
  ];

  return (
    <group position={[3.8, depth, -4]}>
      {vanes.map((v, i) => (
        <mesh key={i} position={[v.x, v.y, 0]} rotation={[0, 0, v.tilt]}>
          <boxGeometry args={[v.w, 0.07, 1.1]} />
          <meshStandardMaterial
            color={i % 4 < 2 ? GRAPHITE : GRAPHITE_SOFT}
            roughness={0.85}
            metalness={0.15}
          />
          {v.copper && <Edges color={COPPER} fog />}
        </mesh>
      ))}
    </group>
  );
}
