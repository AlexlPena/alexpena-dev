"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

const GRAPHITE = "#221f1b";
const GRAPHITE_SOFT = "#2e2a25";
const COPPER = "#d67f3c";

// Harness Engineering: two machined ring-gates the signal threads through,
// joined by strut rails — and for the first time, OTHER signals run in
// parallel beside the visitor's own: two dimmer copper motes cycling their
// own vertical paths. The system is bigger than one request.
const MOTES = [
  { x: -1.6, phase: 0, speed: 0.45 },
  { x: 1.7, phase: 2.2, speed: 0.35 },
];
const MOTE_RANGE = 1.3;

export function HarnessStratum({ depth }: { depth: number }) {
  const moteRefs = useRef<(Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    moteRefs.current.forEach((m, i) => {
      if (m) {
        const { phase, speed } = MOTES[i];
        // ping-pong travel: descend, reset, descend — like queued work
        const cycle = (t * speed + phase) % 2;
        const k = cycle < 1 ? cycle : 2 - cycle;
        m.position.y = MOTE_RANGE - k * 2 * MOTE_RANGE;
      }
    });
  });

  return (
    <group position={[3.8, depth, -4]}>
      {[0.75, -0.75].map((y) => (
        <group key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.85, 0.06, 12, 32]} />
            <meshStandardMaterial
              color={GRAPHITE}
              roughness={0.7}
              metalness={0.3}
            />
          </mesh>
        </group>
      ))}
      {/* strut rails joining the gates */}
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[0.08, 1.7, 0.08]} />
          <meshStandardMaterial
            color={GRAPHITE_SOFT}
            roughness={0.85}
            metalness={0.15}
          />
        </mesh>
      ))}
      {/* parallel signals: dimmer than the visitor's own */}
      {MOTES.map((mote, i) => (
        <mesh
          key={mote.x}
          ref={(el) => {
            moteRefs.current[i] = el;
          }}
          position={[mote.x, 0, 0]}
        >
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial
            color={COPPER}
            emissive={COPPER}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}
