import { METRICS } from "./metrics";

export type ChunkMaterial = "ink" | "copper";

export type Chunk = {
  id: string;
  d: string;
  material: ChunkMaterial;
  centroid: { u: number; v: number };
};

export const VIEWBOX = METRICS.viewBox;

type Point = [number, number];

const round = (n: number) => Math.round(n * 1000) / 1000;

function polygon(points: Point[]): string {
  const [first, ...rest] = points;
  return [
    `M ${round(first[0])} ${round(first[1])}`,
    ...rest.map(([u, v]) => `L ${round(u)} ${round(v)}`),
    "Z",
  ].join(" ");
}

function centroidOf(points: Point[]): { u: number; v: number } {
  const u = points.reduce((s, p) => s + p[0], 0) / points.length;
  const v = points.reduce((s, p) => s + p[1], 0) / points.length;
  return { u: round(u), v: round(v) };
}

// --- A construction -------------------------------------------------------
// The A is two symmetric legs plus a crossbar. Each leg is bounded by an outer
// edge and an inner edge; both run at ±legSlope. Solving for u at a given v is
// all the geometry the polygons need.

const { a, p } = METRICS;

const apexLeftU = a.apexCenterU - a.apexHalfWidth;
const apexRightU = a.apexCenterU + a.apexHalfWidth;

/** Outer edge of the left leg at a given v. */
const leftOuterU = (v: number) => apexLeftU - a.legSlope * (v - a.apexTopV);
/** Inner edge of the left leg at a given v. */
const leftInnerU = (v: number) => leftOuterU(v) + a.legWidth;
/** Outer edge of the right leg at a given v. */
const rightOuterU = (v: number) => apexRightU + a.legSlope * (v - a.apexTopV);
/** Inner edge of the right leg at a given v. */
const rightInnerU = (v: number) => rightOuterU(v) - a.legWidth;

// Chunk 1: the skeleton — apex plus the upper portion of both legs, intact.
const skeletonV = a.skeletonCutV;
const aSkeleton: Point[] = [
  [apexLeftU, a.apexTopV],
  [apexRightU, a.apexTopV],
  [rightOuterU(skeletonV), skeletonV],
  [rightInnerU(skeletonV), skeletonV],
  [a.apexCenterU, a.apexTopV + (skeletonV - a.apexTopV) * 0.55],
  [leftInnerU(skeletonV), skeletonV],
  [leftOuterU(skeletonV), skeletonV],
];

// Chunks 2-4: three slabs peeling down the left leg. Mirrors the stem-slab
// construction below: each cut's tilt offsets the shared edge symmetrically
// (outer side -tilt*halfWidth, inner side +tilt*halfWidth) around the cut's v,
// so a slab's bottom edge and the next slab's top edge are computed from the
// exact same v/tilt pair and land bit-for-bit identical — angled, but never
// cracked.
const leftEdgesV = [skeletonV, a.leftCuts[0].v, a.leftCuts[1].v, a.baselineV];
const leftHalfWidth = a.legWidth * 0.5;
const aLeftSlabs: Point[][] = [];
for (let i = 0; i < leftEdgesV.length - 1; i++) {
  const topV = leftEdgesV[i];
  const bottomV = leftEdgesV[i + 1];
  const topTilt = i === 0 ? 0 : a.leftCuts[i - 1].tilt;
  const bottomTilt = i === leftEdgesV.length - 2 ? 0 : a.leftCuts[i].tilt;
  const topOuterV = topV - topTilt * leftHalfWidth;
  const topInnerV = topV + topTilt * leftHalfWidth;
  const bottomOuterV = bottomV - bottomTilt * leftHalfWidth;
  const bottomInnerV = bottomV + bottomTilt * leftHalfWidth;
  aLeftSlabs.push([
    [leftOuterU(topOuterV), topOuterV],
    [leftInnerU(topInnerV), topInnerV],
    [leftInnerU(bottomInnerV), bottomInnerV],
    [leftOuterU(bottomOuterV), bottomOuterV],
  ]);
}

// Chunk 5: the crossbar, spanning inner edge to inner edge.
const aCrossbar: Point[] = [
  [leftInnerU(a.crossbarTopV), a.crossbarTopV],
  [rightInnerU(a.crossbarTopV), a.crossbarTopV],
  [rightInnerU(a.crossbarBottomV), a.crossbarBottomV],
  [leftInnerU(a.crossbarBottomV), a.crossbarBottomV],
];

// Chunk 6: the right leg below the skeleton cut, one piece.
const aRightLower: Point[] = [
  [rightInnerU(skeletonV), skeletonV],
  [rightOuterU(skeletonV), skeletonV],
  [rightOuterU(a.baselineV), a.baselineV],
  [rightInnerU(a.baselineV), a.baselineV],
];

// --- P construction -------------------------------------------------------
// The bowl is one intact chunk carrying all the curves. The stem is sliced.

const bowlMidV = (p.topV + p.bowlBottomV) / 2;
const k = 0.5523; // circular-arc bezier constant
const outerRx = p.bowlOuterU - p.stemRightU;
const outerRy = (p.bowlBottomV - p.topV) / 2;
// The counter's left anchor is derived from stemRightU rather than a
// separately-measured landmark: the outer bowl sweep already meets
// stemRightU exactly at v=0 and v=68.5, so anchoring the counter to the same
// value (minus a hair of overlap, to survive float drift) guarantees the
// straight segments between them stay flush against the stem instead of
// leaving a background wedge. See metrics.ts for the measured value this
// replaces.
const counterLeftU = p.stemRightU - 0.05;
const innerRx = p.counterRightU - counterLeftU;
const innerRy = (p.counterBottomV - p.counterTopV) / 2;

/**
 * Outer bowl sweeps stem-top -> right -> stem-bottom, then the counter sweeps
 * back the other way so the enclosed hole becomes a real hole once extruded.
 */
const pBowlPath = [
  `M ${round(p.stemRightU)} ${round(p.topV)}`,
  `C ${round(p.stemRightU + outerRx * k)} ${round(p.topV)} ${round(p.bowlOuterU)} ${round(bowlMidV - outerRy * k)} ${round(p.bowlOuterU)} ${round(bowlMidV)}`,
  `C ${round(p.bowlOuterU)} ${round(bowlMidV + outerRy * k)} ${round(p.stemRightU + outerRx * k)} ${round(p.bowlBottomV)} ${round(p.stemRightU)} ${round(p.bowlBottomV)}`,
  `L ${round(counterLeftU)} ${round(p.counterBottomV)}`,
  `C ${round(counterLeftU + innerRx * k)} ${round(p.counterBottomV)} ${round(p.counterRightU)} ${round((p.counterTopV + p.counterBottomV) / 2 + innerRy * k)} ${round(p.counterRightU)} ${round((p.counterTopV + p.counterBottomV) / 2)}`,
  `C ${round(p.counterRightU)} ${round((p.counterTopV + p.counterBottomV) / 2 - innerRy * k)} ${round(counterLeftU + innerRx * k)} ${round(p.counterTopV)} ${round(counterLeftU)} ${round(p.counterTopV)}`,
  `L ${round(p.stemRightU)} ${round(p.topV)}`,
  "Z",
].join(" ");

const pBowlCentroid = {
  u: round((p.stemRightU + p.bowlOuterU) / 2),
  v: round((p.topV + p.bowlBottomV) / 2),
};

// Stem slabs: top edge, four cuts, bottom edge.
const stemEdges = [p.topV, ...p.stemCuts.map((c) => c.v), p.bottomV];
const pStemSlabs: Point[][] = [];
for (let i = 0; i < stemEdges.length - 1; i++) {
  const topV = stemEdges[i];
  const bottomV = stemEdges[i + 1];
  const topTilt = i === 0 ? 0 : p.stemCuts[i - 1].tilt;
  const bottomTilt = i === stemEdges.length - 2 ? 0 : p.stemCuts[i].tilt;
  pStemSlabs.push([
    [p.stemLeftU, topV - topTilt * (p.stemRightU - p.stemLeftU) * 0.5],
    [p.stemRightU, topV + topTilt * (p.stemRightU - p.stemLeftU) * 0.5],
    [p.stemRightU, bottomV + bottomTilt * (p.stemRightU - p.stemLeftU) * 0.5],
    [p.stemLeftU, bottomV - bottomTilt * (p.stemRightU - p.stemLeftU) * 0.5],
  ]);
}

// --- Assembly -------------------------------------------------------------

function polyChunk(id: string, material: ChunkMaterial, points: Point[]): Chunk {
  return { id, material, d: polygon(points), centroid: centroidOf(points) };
}

export const CHUNKS: Chunk[] = [
  polyChunk("a-skeleton", "ink", aSkeleton),
  polyChunk("a-left-mid", "ink", aLeftSlabs[0]),
  polyChunk("a-left-lower", "ink", aLeftSlabs[1]),
  polyChunk("a-left-foot", "ink", aLeftSlabs[2]),
  polyChunk("a-crossbar", "ink", aCrossbar),
  polyChunk("a-right-lower", "ink", aRightLower),
  { id: "p-bowl", material: "copper", d: pBowlPath, centroid: pBowlCentroid },
  polyChunk("p-stem-top", "copper", pStemSlabs[0]),
  polyChunk("p-stem-upper", "copper", pStemSlabs[1]),
  polyChunk("p-stem-mid", "copper", pStemSlabs[2]),
  polyChunk("p-stem-lower", "copper", pStemSlabs[3]),
  polyChunk("p-stem-foot", "copper", pStemSlabs[4]),
];
