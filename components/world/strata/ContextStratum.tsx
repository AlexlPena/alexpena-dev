"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

const GRAPHITE_SOFT = "#2e2a25";
const COPPER = "#d67f3c";

// Context Engineering: an orbit of translucent knowledge planes slowly
// circling the signal's path, each bobbing gently — a living library the
// request gathers mass from. Ambient amplitudes are deliberately tiny
// (spec: the world is alive, not busy).
const PLANES = [
  { angle: 0, y: 0.9, phase: 0 },
  { angle: 1.25, y: 0.3, phase: 1.4 },
  { angle: 2.5, y: -0.3, phase: 2.8 },
  { angle: 3.75, y: -0.9, phase: 4.2 },
  { angle: 5.0, y: 0.0, phase: 5.6 },
];

const ORBIT_RADIUS = 1.6;
const ORBIT_SPEED = 0.04; // rad/s — one revolution ~2.6 min
const BOB_AMPLITUDE = 0.05;
const BOB_SPEED = 0.5;

export function ContextStratum({ depth }: { depth: number }) {
  const orbit = useRef<Group>(null);
  const planeRefs = useRef<(Group | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (orbit.current) orbit.current.rotation.y = t * ORBIT_SPEED;
    planeRefs.current.forEach((g, i) => {
      if (g) {
        g.position.y =
          PLANES[i].y +
          Math.sin(t * BOB_SPEED + PLANES[i].phase) * BOB_AMPLITUDE;
      }
    });
  });

  return (
    <group position={[2.5, depth, -4]}>
      <group ref={orbit}>
        {PLANES.map((p, i) => (
          <group
            key={i}
            ref={(el) => {
              planeRefs.current[i] = el;
            }}
            position={[
              Math.cos(p.angle) * ORBIT_RADIUS,
              p.y,
              Math.sin(p.angle) * ORBIT_RADIUS,
            ]}
            rotation={[0, -p.angle + Math.PI / 2, 0]}
          >
            <mesh>
              <planeGeometry args={[1.5, 0.95]} />
              <meshStandardMaterial
                color={GRAPHITE_SOFT}
                transparent
                opacity={0.4}
                roughness={0.4}
                side={2}
              />
            </mesh>
          </group>
        ))}
      </group>
      {/* the gathering point: one small copper marker where threads converge */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshStandardMaterial
          color={COPPER}
          emissive={COPPER}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  );
}
