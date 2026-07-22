"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

const GRAPHITE = "#221f1b";
const COPPER = "#d67f3c";

// Loop Engineering: a gyroscope of nested rings, each turning on its own
// axis at its own patient speed — cycles running without anyone pushing.
// The outer ring is copper: the loop that carries the visitor's signal.
const RINGS = [
  { radius: 1.15, tube: 0.05, axis: "x" as const, speed: 0.12, copper: true },
  { radius: 0.8, tube: 0.045, axis: "y" as const, speed: -0.08, copper: false },
  { radius: 0.45, tube: 0.04, axis: "z" as const, speed: 0.05, copper: false },
];

export function LoopStratum({ depth }: { depth: number }) {
  const ringRefs = useRef<(Group | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ringRefs.current.forEach((g, i) => {
      if (g) g.rotation[RINGS[i].axis] = t * RINGS[i].speed;
    });
  });

  return (
    <group position={[3.8, depth, -4]}>
      {RINGS.map((ring, i) => (
        <group
          key={ring.radius}
          ref={(el) => {
            ringRefs.current[i] = el;
          }}
          rotation={[i * 0.45, i * 0.3, 0]}
        >
          <mesh>
            <torusGeometry args={[ring.radius, ring.tube, 12, 48]} />
            <meshStandardMaterial
              color={ring.copper ? COPPER : GRAPHITE}
              emissive={ring.copper ? COPPER : "#000000"}
              emissiveIntensity={ring.copper ? 0.45 : 0}
              roughness={0.6}
              metalness={0.35}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
