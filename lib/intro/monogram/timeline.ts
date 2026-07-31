import { CHUNKS, VIEWBOX, type Chunk } from "./chunks";

export const TIMING = { assembly: 2.0, hold: 0.4, dissolve: 0.35 } as const;

export type ChunkAnimation = {
  id: string;
  delay: number;
  duration: number;
  from: { x: number; y: number; z: number; rx: number; ry: number; rz: number };
};

export function totalDuration(): number {
  return TIMING.assembly + TIMING.hold + TIMING.dissolve;
}

/** Small deterministic string hash, so offsets are stable across runs and machines. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** Rough area proxy: bigger chunks land earlier, so the structure reads first. */
function weightOf(chunk: Chunk): number {
  if (chunk.id === "a-skeleton" || chunk.id === "p-bowl") return 1;
  if (chunk.id === "a-crossbar" || chunk.id === "a-right-lower") return 0.6;
  return 0.3;
}

export function buildAnimations(chunks: Chunk[] = CHUNKS): ChunkAnimation[] {
  const cx = VIEWBOX.width / 2;
  const cy = VIEWBOX.height / 2;
  const duration = 0.9;
  // Large chunks finish at ~1.4s, small ones at the full 2.0s.
  const latest = TIMING.assembly - duration;

  return chunks.map((chunk) => {
    const r1 = hash(chunk.id);
    const r2 = hash(chunk.id + "#r");
    const weight = weightOf(chunk);

    const dirX = chunk.centroid.u - cx;
    const dirY = chunk.centroid.v - cy;
    const len = Math.hypot(dirX, dirY) || 1;
    // Close in, not distant: ~0.55x-1.05x the half-diagonal of the logo box.
    const distance = 45 + r1 * 45;

    return {
      id: chunk.id,
      delay: Number((latest * (1 - weight) * (0.6 + 0.4 * r2)).toFixed(4)),
      duration,
      from: {
        x: Number(((dirX / len) * distance).toFixed(4)),
        y: Number(((dirY / len) * distance).toFixed(4)),
        z: Number(((r1 - 0.5) * 60).toFixed(4)),
        rx: Number(((r1 - 0.5) * 0.9).toFixed(4)),
        ry: Number(((r2 - 0.5) * 0.9).toFixed(4)),
        rz: Number(((r1 - r2) * 1.2).toFixed(4)),
      },
    };
  });
}
