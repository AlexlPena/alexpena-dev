"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { scrollStore } from "@/lib/scroll/store";
import { signalY, signalVisible } from "@/lib/world/rail";

const COPPER = "#d67f3c";

// The falling request. Position derives purely from scroll progress;
// pulse/trail/choreography arrive in M4-M5.
export function Signal() {
  const group = useRef<Group>(null);

  useFrame(() => {
    if (!group.current) return;
    const { progress } = scrollStore.getState();
    group.current.position.y = signalY(progress);
    group.current.visible = signalVisible(progress);
  });

  return (
    <group ref={group} position={[0, 0, -2]}>
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={COPPER}
          emissive={COPPER}
          emissiveIntensity={1.2}
        />
      </mesh>
      <pointLight color={COPPER} intensity={2.5} distance={8} decay={2} />
    </group>
  );
}
