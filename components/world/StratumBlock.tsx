"use client";

const GRAPHITE = "#221f1b";
const GRAPHITE_SOFT = "#2e2a25";
const COPPER = "#d67f3c";

type StratumBlockProps = {
  depth: number; // camera-rest Y for this stratum
  variant: 0 | 1 | 2 | 3; // prompt / context / harness / loop
};

// Blockout for one stratum, centered at its camera-rest depth, pushed back
// so DOM captions (screen left) and world (screen right/center) share the
// frame without collision.
export function StratumBlock({ depth, variant }: StratumBlockProps) {
  return (
    <group position={[2.5, depth, -4]}>
      {variant === 0 && (
        // Prompt: three shaping planes converging on the signal's path
        <>
          <mesh position={[-1.2, 0.8, 0]} rotation={[0, 0, 0.35]}>
            <boxGeometry args={[2.4, 0.08, 1.2]} />
            <meshStandardMaterial color={GRAPHITE} />
          </mesh>
          <mesh position={[1.2, 0.2, 0]} rotation={[0, 0, -0.35]}>
            <boxGeometry args={[2.4, 0.08, 1.2]} />
            <meshStandardMaterial color={GRAPHITE} />
          </mesh>
          <mesh position={[0, -0.9, 0]}>
            <boxGeometry args={[1.4, 0.08, 1.2]} />
            <meshStandardMaterial color={GRAPHITE_SOFT} />
          </mesh>
        </>
      )}
      {variant === 1 && (
        // Context: stacked translucent knowledge planes
        <>
          {[0.9, 0.3, -0.3, -0.9].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[-0.25, 0, 0]}>
              <planeGeometry args={[3.2, 1.6]} />
              <meshStandardMaterial
                color={GRAPHITE_SOFT}
                transparent
                opacity={0.55}
              />
            </mesh>
          ))}
        </>
      )}
      {variant === 2 && (
        // Harness: two socket frames the signal threads through
        <>
          {[0.7, -0.7].map((y) => (
            <group key={y} position={[0, y, 0]}>
              <mesh>
                <torusGeometry args={[0.9, 0.07, 8, 4]} />
                <meshStandardMaterial color={GRAPHITE} />
              </mesh>
              <mesh position={[1.4, 0, 0]}>
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial color={GRAPHITE_SOFT} />
              </mesh>
            </group>
          ))}
        </>
      )}
      {variant === 3 && (
        // Loop: nested rings — the self-driving cycles
        <>
          {[1.1, 0.75, 0.4].map((r, i) => (
            <mesh key={r} rotation={[i * 0.5, i * 0.3, 0]}>
              <torusGeometry args={[r, 0.05, 8, 48]} />
              <meshStandardMaterial
                color={i === 0 ? COPPER : GRAPHITE}
                emissive={i === 0 ? COPPER : "#000000"}
                emissiveIntensity={i === 0 ? 0.4 : 0}
              />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}
