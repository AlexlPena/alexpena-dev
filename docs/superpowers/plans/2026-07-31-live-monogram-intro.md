# Live-Rendered Monogram Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the intro gate's baked `hero-loop.mp4` with a 3D "AP" monogram that fractures into 12 chunks and reassembles, rendered live in the browser.

**Architecture:** The monogram is defined parametrically from measured landmarks — not traced by hand — so 11 chunks are computed as polygons and only the intact P bowl carries curves. Pure geometry, path parsing, and animation timing live in `lib/` (node-testable, no DOM); three.js touches only a dynamically-imported geometry module and one client component, so returning visitors download none of it.

**Tech Stack:** Next.js 16 (App Router), React 19, three.js (new dependency), GSAP (existing), Vitest (node environment), Tailwind v4.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-31-live-monogram-intro-design.md`. Reference frames: `docs/superpowers/reference/monogram/`.
- **Governing fracture rule: straight strokes are sliced into slabs; curves are NEVER fractured.** The P's bowl stays one intact piece. Violating this makes the animation read as physics shatter, which is wrong.
- Palette comes from site tokens, never the reference clip: bg `#f7f5f1`, ink `#1a1815`, copper `#c0682b`. Side walls are pewter — **lighter** than both face colors (start `#c9c2b6`).
- Timing: ~2.0s assembly, ~0.4s hold, ~0.35s dissolve.
- Easing must be deceleration only — `power3.out` or similar. **No `back`, no `elastic`, no overshoot or bounce.** The reference has none.
- No WebGPU. Plain `WebGLRenderer`.
- Vitest only picks up `lib/**/*.test.ts` in a **node** environment. No DOM/component test environment exists and none is to be added. Anything needing `document` or `DOMParser` cannot be unit-tested here.
- Local dev must run `npm run dev -- --webpack --port 3000` on this machine (Turbopack's PostCSS worker fails to spawn; local-only issue, never change the build script).
- Work directly on `main`. Commit with trailer `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
- Never touch or commit `threejs-practice/` (own git repo, ignored).

## Measured Reference Landmarks

Derived from the locked final frame at 1920×1080 by background-mask pixel analysis. Glyph band was x 554–1293, y 312–827; cap height 515px. All values below are normalized so **cap height = 100 units**, origin at the glyph band's top-left. ViewBox is `0 0 143.5 100`.

| Landmark | Value (units) |
|---|---|
| A apex center (u) | 48.0 |
| A apex top (v) | 5.0 |
| A apex half-width at top | 5.55 |
| A leg slope (du/dv, outer edges, symmetric) | 0.448 |
| A leg horizontal width | 18.0 |
| A left foot outer (u at v=100) | 0.0 |
| A crossbar top (v) | 67.6 |
| A crossbar bottom (v) | 83.1 |
| A baseline (v) | 100.0 |
| P stem left / right (u) | 79.8 / 96.3 |
| P top / bottom (v) | 0.0 / 97.7 |
| P bowl outer (u) | 143.5 |
| P bowl bottom (v) | 68.5 |
| P counter left / right (u) | 97.1 / 124.9 |
| P counter top / bottom (v) | 20.0 / 53.0 |

---

### Task 1: SVG path parser

Pure parser for the path subset we generate: absolute `M`, `L`, `C`, `Z` only. Written by hand rather than using three's `SVGLoader`, because `SVGLoader` requires `DOMParser`, which does not exist in the node test environment — and this keeps the parser testable and the bundle smaller.

**Files:**
- Create: `lib/intro/monogram/path.ts`
- Test: `lib/intro/monogram/path.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type PathCommand = { type: "M"; x: number; y: number } | { type: "L"; x: number; y: number } | { type: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number } | { type: "Z" }`
  - `parsePath(d: string): PathCommand[]`

- [ ] **Step 1: Write the failing test**

Create `lib/intro/monogram/path.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { parsePath } from "./path";

describe("parsePath", () => {
  test("parses a closed triangle of move and line commands", () => {
    expect(parsePath("M 0 0 L 10 0 L 5 8 Z")).toEqual([
      { type: "M", x: 0, y: 0 },
      { type: "L", x: 10, y: 0 },
      { type: "L", x: 5, y: 8 },
      { type: "Z" },
    ]);
  });

  test("parses a cubic curve command", () => {
    expect(parsePath("M 0 0 C 1 2 3 4 5 6 Z")).toEqual([
      { type: "M", x: 0, y: 0 },
      { type: "C", x1: 1, y1: 2, x2: 3, y2: 4, x: 5, y: 6 },
      { type: "Z" },
    ]);
  });

  test("accepts commas, negative numbers, and decimals as separators", () => {
    expect(parsePath("M-1.5,0 L2.25,-3 Z")).toEqual([
      { type: "M", x: -1.5, y: 0 },
      { type: "L", x: 2.25, y: -3 },
      { type: "Z" },
    ]);
  });

  test("supports implicit repeated L commands", () => {
    expect(parsePath("M 0 0 L 1 1 2 2 Z")).toEqual([
      { type: "M", x: 0, y: 0 },
      { type: "L", x: 1, y: 1 },
      { type: "L", x: 2, y: 2 },
      { type: "Z" },
    ]);
  });

  test("throws on relative commands, which we never author", () => {
    expect(() => parsePath("m 0 0 l 5 5 z")).toThrow(/unsupported/i);
  });

  test("throws when a command has too few numbers", () => {
    expect(() => parsePath("M 0")).toThrow(/expected/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/intro/monogram/path.test.ts`
Expected: FAIL — cannot resolve `./path`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/intro/monogram/path.ts`:

```ts
export type PathCommand =
  | { type: "M"; x: number; y: number }
  | { type: "L"; x: number; y: number }
  | { type: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: "Z" };

const ARITY = { M: 2, L: 2, C: 6, Z: 0 } as const;

/**
 * Parses the deliberately small path subset the monogram authors: absolute
 * M/L/C/Z only. Relative commands and arcs are rejected loudly rather than
 * silently mis-drawn, since every path in this project is generated code.
 */
export function parsePath(d: string): PathCommand[] {
  const tokens = d.match(/[MLCZmlczaAhHvVsSqQtT]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
  const out: PathCommand[] = [];
  let i = 0;
  let current: keyof typeof ARITY | null = null;

  while (i < tokens.length) {
    const token = tokens[i];
    if (/^[A-Za-z]$/.test(token)) {
      if (!(token in ARITY)) {
        throw new Error(`parsePath: unsupported command "${token}" (absolute M/L/C/Z only)`);
      }
      current = token as keyof typeof ARITY;
      i++;
    } else if (current === null) {
      throw new Error("parsePath: path must start with a command");
    }

    if (current === "Z") {
      out.push({ type: "Z" });
      current = null;
      continue;
    }

    const need = ARITY[current!];
    const nums: number[] = [];
    while (nums.length < need) {
      const t = tokens[i];
      if (t === undefined || /^[A-Za-z]$/.test(t)) {
        throw new Error(`parsePath: expected ${need} numbers for "${current}"`);
      }
      nums.push(Number(t));
      i++;
    }

    if (current === "M") out.push({ type: "M", x: nums[0], y: nums[1] });
    else if (current === "L") out.push({ type: "L", x: nums[0], y: nums[1] });
    else out.push({ type: "C", x1: nums[0], y1: nums[1], x2: nums[2], y2: nums[3], x: nums[4], y: nums[5] });

    // An M followed by more numbers means implicit L commands.
    if (current === "M") current = "L";
  }

  return out;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- lib/intro/monogram/path.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Typecheck and commit**

```bash
npm run typecheck
git add lib/intro/monogram/path.ts lib/intro/monogram/path.test.ts
git commit -m "feat: add SVG path subset parser for the monogram"
```

---

### Task 2: Monogram metrics and chunk geometry

Builds the 12 chunk paths parametrically from the measured landmarks. Because curves are never cut, the 11 non-bowl chunks are plain polygons computed from line intersections; only the bowl carries `C` commands.

**Files:**
- Create: `lib/intro/monogram/metrics.ts`
- Create: `lib/intro/monogram/chunks.ts`
- Test: `lib/intro/monogram/chunks.test.ts`

**Interfaces:**
- Consumes: `parsePath` from Task 1
- Produces:
  - `METRICS` (from `metrics.ts`) — the landmark constants table
  - `type ChunkMaterial = "ink" | "copper"`
  - `type Chunk = { id: string; d: string; material: ChunkMaterial; centroid: { u: number; v: number } }`
  - `CHUNKS: Chunk[]` — exactly 12, 6 ink then 6 copper
  - `VIEWBOX: { width: 143.5; height: 100 }`

- [ ] **Step 1: Write the failing test**

Create `lib/intro/monogram/chunks.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { parsePath } from "./path";
import { CHUNKS, VIEWBOX } from "./chunks";

describe("monogram chunks", () => {
  test("has twelve chunks, six per letter", () => {
    expect(CHUNKS).toHaveLength(12);
    expect(CHUNKS.filter((c) => c.material === "ink")).toHaveLength(6);
    expect(CHUNKS.filter((c) => c.material === "copper")).toHaveLength(6);
  });

  test("chunk ids are unique", () => {
    expect(new Set(CHUNKS.map((c) => c.id)).size).toBe(12);
  });

  test("every chunk path parses and is explicitly closed", () => {
    for (const chunk of CHUNKS) {
      const cmds = parsePath(chunk.d);
      expect(cmds.length, chunk.id).toBeGreaterThan(3);
      expect(cmds[0].type, chunk.id).toBe("M");
      expect(cmds[cmds.length - 1].type, chunk.id).toBe("Z");
    }
  });

  test("every vertex lies inside the viewBox", () => {
    for (const chunk of CHUNKS) {
      for (const cmd of parsePath(chunk.d)) {
        if (cmd.type === "Z") continue;
        expect(cmd.x, `${chunk.id} x`).toBeGreaterThanOrEqual(-0.01);
        expect(cmd.x, `${chunk.id} x`).toBeLessThanOrEqual(VIEWBOX.width + 0.01);
        expect(cmd.y, `${chunk.id} y`).toBeGreaterThanOrEqual(-0.01);
        expect(cmd.y, `${chunk.id} y`).toBeLessThanOrEqual(VIEWBOX.height + 0.01);
      }
    }
  });

  test("the bowl is the only curved chunk — curves are never fractured", () => {
    const curved = CHUNKS.filter((c) =>
      parsePath(c.d).some((cmd) => cmd.type === "C"),
    );
    expect(curved.map((c) => c.id)).toEqual(["p-bowl"]);
  });

  test("every chunk has a centroid inside the viewBox", () => {
    for (const chunk of CHUNKS) {
      expect(chunk.centroid.u, chunk.id).toBeGreaterThan(0);
      expect(chunk.centroid.u, chunk.id).toBeLessThan(VIEWBOX.width);
      expect(chunk.centroid.v, chunk.id).toBeGreaterThan(0);
      expect(chunk.centroid.v, chunk.id).toBeLessThan(VIEWBOX.height);
    }
  });

  test("ink chunks sit left of the P stem, copper chunks right of the A apex", () => {
    const ink = CHUNKS.filter((c) => c.material === "ink");
    const copper = CHUNKS.filter((c) => c.material === "copper");
    expect(Math.min(...copper.map((c) => c.centroid.u))).toBeGreaterThan(70);
    expect(Math.min(...ink.map((c) => c.centroid.u))).toBeLessThan(50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/intro/monogram/chunks.test.ts`
Expected: FAIL — cannot resolve `./chunks`.

- [ ] **Step 3: Write the metrics table**

Create `lib/intro/monogram/metrics.ts`:

```ts
/**
 * Landmarks measured from the reference render's locked final frame
 * (docs/superpowers/reference/monogram/), normalised so cap height = 100 units
 * with the origin at the glyph band's top-left.
 *
 * These are the art-direction surface: retuning the monogram's proportions means
 * editing this table, and every chunk polygon recomputes from it.
 */
export const METRICS = {
  viewBox: { width: 143.5, height: 100 },

  a: {
    apexCenterU: 48.0,
    apexTopV: 5.0,
    apexHalfWidth: 5.55,
    // Measured 0.448, nudged to 0.4468 so the left leg's outer edge lands
    // exactly on u=0 at the baseline instead of 0.11 units outside the viewBox.
    legSlope: 0.4468, // du/dv on the outer edges, symmetric
    legWidth: 18.0, // horizontal width of each leg
    baselineV: 100.0,
    crossbarTopV: 67.6,
    crossbarBottomV: 83.1,
    // Cuts across the legs, as v values. Tilt is du/dv applied to the cut line
    // so seams are angled rather than dead horizontal, matching the reference.
    skeletonCutV: 45.0,
    skeletonCutTilt: 0.10,
    leftCuts: [
      { v: 68.0, tilt: -0.08 },
      { v: 86.0, tilt: 0.06 },
    ],
  },

  p: {
    stemLeftU: 79.8,
    stemRightU: 96.3,
    topV: 0.0,
    bottomV: 97.7,
    bowlOuterU: 143.5,
    bowlBottomV: 68.5,
    counterLeftU: 97.1,
    counterRightU: 124.9,
    counterTopV: 20.0,
    counterBottomV: 53.0,
    // Cuts across the stem only — never across the bowl.
    stemCuts: [
      { v: 25.0, tilt: 0.09 },
      { v: 48.0, tilt: -0.07 },
      { v: 70.0, tilt: 0.05 },
      { v: 86.0, tilt: -0.06 },
    ],
  },
} as const;
```

- [ ] **Step 4: Write the chunk builder**

Create `lib/intro/monogram/chunks.ts`:

```ts
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

// Chunks 2-4: three slabs peeling down the left leg.
const leftBands: Array<[number, number]> = [
  [skeletonV, a.leftCuts[0].v],
  [a.leftCuts[0].v, a.leftCuts[1].v],
  [a.leftCuts[1].v, a.baselineV],
];
const aLeftSlabs = leftBands.map(([topV, bottomV]) => [
  [leftOuterU(topV), topV],
  [leftInnerU(topV), topV],
  [leftInnerU(bottomV), bottomV],
  [leftOuterU(bottomV), bottomV],
] as Point[]);

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
const innerRx = p.counterRightU - p.counterLeftU;
const innerRy = (p.counterBottomV - p.counterTopV) / 2;

/**
 * Outer bowl sweeps stem-top -> right -> stem-bottom, then the counter sweeps
 * back the other way so the enclosed hole becomes a real hole once extruded.
 */
const pBowlPath = [
  `M ${round(p.stemRightU)} ${round(p.topV)}`,
  `C ${round(p.stemRightU + outerRx * k)} ${round(p.topV)} ${round(p.bowlOuterU)} ${round(bowlMidV - outerRy * k)} ${round(p.bowlOuterU)} ${round(bowlMidV)}`,
  `C ${round(p.bowlOuterU)} ${round(bowlMidV + outerRy * k)} ${round(p.stemRightU + outerRx * k)} ${round(p.bowlBottomV)} ${round(p.stemRightU)} ${round(p.bowlBottomV)}`,
  `L ${round(p.counterLeftU)} ${round(p.counterBottomV)}`,
  `C ${round(p.counterLeftU + innerRx * k)} ${round(p.counterBottomV)} ${round(p.counterRightU)} ${round((p.counterTopV + p.counterBottomV) / 2 + innerRy * k)} ${round(p.counterRightU)} ${round((p.counterTopV + p.counterBottomV) / 2)}`,
  `C ${round(p.counterRightU)} ${round((p.counterTopV + p.counterBottomV) / 2 - innerRy * k)} ${round(p.counterLeftU + innerRx * k)} ${round(p.counterTopV)} ${round(p.counterLeftU)} ${round(p.counterTopV)}`,
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
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- lib/intro/monogram/chunks.test.ts`
Expected: PASS, 7 tests. If a vertex escapes the viewBox, clamp the offending metric rather than widening the viewBox.

- [ ] **Step 6: Lint, typecheck, commit**

```bash
npm run lint
npm run typecheck
git add lib/intro/monogram/metrics.ts lib/intro/monogram/chunks.ts lib/intro/monogram/chunks.test.ts
git commit -m "feat: build monogram chunk geometry from measured landmarks"
```

---

### Task 3: Animation timing

Pure, deterministic per-chunk animation parameters. Start offsets are derived from each chunk's centroid pushed away from the logo centre, with a seeded PRNG for rotation so runs are reproducible and testable.

**Files:**
- Create: `lib/intro/monogram/timeline.ts`
- Test: `lib/intro/monogram/timeline.test.ts`

**Interfaces:**
- Consumes: `CHUNKS`, `VIEWBOX` from Task 2
- Produces:
  - `TIMING = { assembly: 2.0; hold: 0.4; dissolve: 0.35 }`
  - `type ChunkAnimation = { id: string; delay: number; duration: number; from: { x: number; y: number; z: number; rx: number; ry: number; rz: number } }`
  - `buildAnimations(chunks?: Chunk[]): ChunkAnimation[]`
  - `totalDuration(): number`

- [ ] **Step 1: Write the failing test**

Create `lib/intro/monogram/timeline.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { CHUNKS } from "./chunks";
import { buildAnimations, TIMING, totalDuration } from "./timeline";

describe("monogram timeline", () => {
  const anims = buildAnimations();

  test("produces one animation per chunk", () => {
    expect(anims).toHaveLength(CHUNKS.length);
    expect(anims.map((a) => a.id).sort()).toEqual(CHUNKS.map((c) => c.id).sort());
  });

  test("is deterministic across calls", () => {
    expect(buildAnimations()).toEqual(anims);
  });

  test("every chunk lands within the assembly window", () => {
    for (const a of anims) {
      expect(a.delay, a.id).toBeGreaterThanOrEqual(0);
      expect(a.delay + a.duration, a.id).toBeLessThanOrEqual(TIMING.assembly + 1e-9);
    }
  });

  test("the large skeleton and bowl land before the small stem slabs", () => {
    const landing = (id: string) => {
      const a = anims.find((x) => x.id === id)!;
      return a.delay + a.duration;
    };
    expect(landing("a-skeleton")).toBeLessThan(landing("p-stem-foot"));
    expect(landing("p-bowl")).toBeLessThan(landing("p-stem-foot"));
  });

  test("start offsets are non-zero and stay within ~1.5x the logo box", () => {
    for (const a of anims) {
      const dist = Math.hypot(a.from.x, a.from.y);
      expect(dist, a.id).toBeGreaterThan(5);
      expect(dist, a.id).toBeLessThan(160);
    }
  });

  test("total duration covers assembly, hold and dissolve", () => {
    expect(totalDuration()).toBeCloseTo(2.75, 5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- lib/intro/monogram/timeline.test.ts`
Expected: FAIL — cannot resolve `./timeline`.

- [ ] **Step 3: Write the implementation**

Create `lib/intro/monogram/timeline.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- lib/intro/monogram/timeline.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Lint, typecheck, commit**

```bash
npm run lint
npm run typecheck
git add lib/intro/monogram/timeline.ts lib/intro/monogram/timeline.test.ts
git commit -m "feat: add deterministic monogram assembly timing"
```

---

### Task 4: three.js dependency and geometry builder

Turns chunk paths into extruded geometry. three.js core is pure JS and works in the node test environment — only `WebGLRenderer` needs a DOM — so this module is unit-testable.

**Files:**
- Modify: `package.json` (add `three`, `@types/three`)
- Create: `lib/intro/monogram/geometry.ts`
- Test: `lib/intro/monogram/geometry.test.ts`

**Interfaces:**
- Consumes: `parsePath` (Task 1), `CHUNKS`, `VIEWBOX` (Task 2)
- Produces:
  - `shapeFromPath(d: string): THREE.Shape`
  - `buildChunkGeometry(chunk: Chunk): THREE.ExtrudeGeometry`
  - `EXTRUDE_DEPTH: number`

- [ ] **Step 1: Install the dependency**

```bash
npm install three
npm install --save-dev @types/three
```

- [ ] **Step 2: Write the failing test**

Create `lib/intro/monogram/geometry.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { CHUNKS } from "./chunks";
import { buildChunkGeometry, shapeFromPath } from "./geometry";

describe("monogram geometry", () => {
  test("builds a shape with points from a simple polygon path", () => {
    const shape = shapeFromPath("M 0 0 L 10 0 L 5 8 Z");
    expect(shape.getPoints().length).toBeGreaterThan(2);
  });

  test("every chunk extrudes to non-empty geometry", () => {
    for (const chunk of CHUNKS) {
      const geo = buildChunkGeometry(chunk);
      expect(geo.getAttribute("position").count, chunk.id).toBeGreaterThan(0);
      geo.dispose();
    }
  });

  test("extruded geometry exposes two material groups: caps and sides", () => {
    const geo = buildChunkGeometry(CHUNKS[0]);
    const indices = [...new Set(geo.groups.map((g) => g.materialIndex))].sort();
    expect(indices).toEqual([0, 1]);
    geo.dispose();
  });

  test("geometry is centred on the origin so rotations pivot about the chunk", () => {
    const geo = buildChunkGeometry(CHUNKS[0]);
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    const cx = (box.min.x + box.max.x) / 2;
    const cy = (box.min.y + box.max.y) / 2;
    expect(Math.abs(cx)).toBeLessThan(0.01);
    expect(Math.abs(cy)).toBeLessThan(0.01);
    geo.dispose();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- lib/intro/monogram/geometry.test.ts`
Expected: FAIL — cannot resolve `./geometry`.

- [ ] **Step 4: Write the implementation**

Create `lib/intro/monogram/geometry.ts`:

```ts
import { ExtrudeGeometry, Shape } from "three";
import { parsePath } from "./path";
import { VIEWBOX, type Chunk } from "./chunks";

/** Shallow, matching the reference: ~10% of cap height. */
export const EXTRUDE_DEPTH = 10;

/**
 * Builds a THREE.Shape from our path subset. SVG's y axis points down and
 * three's points up, so v is flipped here — do it once, at the boundary.
 */
export function shapeFromPath(d: string): Shape {
  const shape = new Shape();
  const flip = (y: number) => VIEWBOX.height - y;

  for (const cmd of parsePath(d)) {
    if (cmd.type === "M") shape.moveTo(cmd.x, flip(cmd.y));
    else if (cmd.type === "L") shape.lineTo(cmd.x, flip(cmd.y));
    else if (cmd.type === "C")
      shape.bezierCurveTo(cmd.x1, flip(cmd.y1), cmd.x2, flip(cmd.y2), cmd.x, flip(cmd.y));
    else shape.closePath();
  }

  return shape;
}

export function buildChunkGeometry(chunk: Chunk): ExtrudeGeometry {
  const geometry = new ExtrudeGeometry(shapeFromPath(chunk.d), {
    depth: EXTRUDE_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.9,
    bevelSize: 0.7,
    bevelSegments: 2,
    curveSegments: 24,
  });
  // Centre so each chunk rotates about itself rather than the world origin.
  geometry.center();
  return geometry;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- lib/intro/monogram/geometry.test.ts`
Expected: PASS, 4 tests.

If importing `three` fails in the node environment, import from the explicit entry (`three/src/Three.js`) rather than adding a DOM test environment — the constraint against adding one is firm.

- [ ] **Step 6: Run the whole suite, then commit**

```bash
npm test
npm run lint && npm run typecheck
git add package.json package-lock.json lib/intro/monogram/geometry.ts lib/intro/monogram/geometry.test.ts
git commit -m "feat: extrude monogram chunks into beveled geometry"
```

---

### Task 5: MonogramScene component

The only module that touches WebGL. Dynamically imports the geometry module so three.js lands in an async chunk that returning visitors never fetch.

**Files:**
- Create: `components/intro/MonogramScene.tsx`

**Interfaces:**
- Consumes: `buildChunkGeometry`, `EXTRUDE_DEPTH` (Task 4); `CHUNKS`, `VIEWBOX` (Task 2); `buildAnimations`, `TIMING` (Task 3)
- Produces: `<MonogramScene onComplete={() => void} fadeTargetRef={RefObject<HTMLElement | null>} />`

**Two things this component must get right, both easy to get wrong:**

1. **The dissolve fades the overlay, not the canvas.** IntroGate's overlay div carries
   `bg-dusk-bg`. Fading only the inner canvas container would leave an opaque overlay and
   never reveal the site. Hence `fadeTargetRef`, which IntroGate points at its own overlay.
2. **Ink sits behind copper in z.** The A's right leg and the P's stem occupy overlapping
   u ranges at the baseline (78.0–96.0 vs 79.8–96.3). Coplanar at z=0 they z-fight; the
   reference clearly shows the leg passing *behind* the stem.

- [ ] **Step 1: Write the component**

Create `components/intro/MonogramScene.tsx`:

```tsx
"use client";

import { useEffect, useRef, type RefObject } from "react";

type Props = {
  onComplete: () => void;
  /** The element to dissolve at the end — IntroGate's overlay, not this canvas. */
  fadeTargetRef: RefObject<HTMLElement | null>;
};

/** Ink sits fractionally behind copper so the A's right leg is occluded by the P's stem. */
const REST_Z = { ink: -1, copper: 1 } as const;

/**
 * Renders the AP monogram assembling from 12 extruded chunks.
 *
 * three.js is imported dynamically: this component only mounts after IntroGate
 * has decided the visitor is a first-time, motion-tolerant visitor, so everyone
 * else downloads none of it. Any WebGL failure calls onComplete immediately —
 * the gate must always fail open rather than trap the visitor.
 */
export function MonogramScene({ onComplete, fadeTargetRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep the latest callback without making the effect re-run and rebuild the scene.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [THREE, { gsap }, { buildChunkGeometry, EXTRUDE_DEPTH }, { CHUNKS, VIEWBOX }, { buildAnimations, TIMING }] =
        await Promise.all([
          import("three"),
          import("gsap"),
          import("@/lib/intro/monogram/geometry"),
          import("@/lib/intro/monogram/chunks"),
          import("@/lib/intro/monogram/timeline"),
        ]);

      if (disposed) return;

      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      } catch {
        onCompleteRef.current();
        return;
      }

      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setClearColor(0xf7f5f1, 1);
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();

      // Long focal length keeps the reference's near-flat-on look with slight depth.
      const camera = new THREE.PerspectiveCamera(
        28,
        container.clientWidth / container.clientHeight,
        1,
        2000,
      );

      const key = new THREE.DirectionalLight(0xffffff, 2.1);
      key.position.set(-120, 160, 220);
      scene.add(key);
      scene.add(new THREE.HemisphereLight(0xffffff, 0xd8cfc2, 1.15));

      const faceInk = new THREE.MeshStandardMaterial({ color: 0x1a1815, roughness: 0.82, metalness: 0.05 });
      const faceCopper = new THREE.MeshStandardMaterial({ color: 0xc0682b, roughness: 0.78, metalness: 0.12 });
      // Side walls are LIGHTER than the faces — this inverted relationship is
      // what makes the letters read as metal instead of plastic.
      const side = new THREE.MeshStandardMaterial({ color: 0xc9c2b6, roughness: 0.55, metalness: 0.35 });

      const group = new THREE.Group();
      // Chunk geometry is centred, so re-offset each back to its layout position.
      const meshes = new Map<string, InstanceType<typeof THREE.Mesh>>();
      const geometries: InstanceType<typeof THREE.ExtrudeGeometry>[] = [];

      for (const chunk of CHUNKS) {
        const geometry = buildChunkGeometry(chunk);
        geometries.push(geometry);
        const mesh = new THREE.Mesh(geometry, [
          chunk.material === "ink" ? faceInk : faceCopper,
          side,
        ]);
        mesh.position.set(
          chunk.centroid.u - VIEWBOX.width / 2,
          VIEWBOX.height / 2 - chunk.centroid.v,
          REST_Z[chunk.material],
        );
        mesh.userData.restPosition = mesh.position.clone();
        group.add(mesh);
        meshes.set(chunk.id, mesh);
      }
      scene.add(group);

      const fitCamera = () => {
        const aspect = container.clientWidth / container.clientHeight;
        const fovRad = (camera.fov * Math.PI) / 180;
        // Fit the logo box with margin, accounting for narrow viewports.
        const needed = Math.max(VIEWBOX.height, VIEWBOX.width / aspect) * 1.45;
        camera.position.set(0, 0, needed / (2 * Math.tan(fovRad / 2)) + EXTRUDE_DEPTH);
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };
      fitCamera();

      const timeline = gsap.timeline({
        onUpdate: () => renderer.render(scene, camera),
        onComplete: () => onCompleteRef.current(),
      });

      for (const anim of buildAnimations()) {
        const mesh = meshes.get(anim.id);
        if (!mesh) continue;
        const rest = mesh.userData.restPosition as InstanceType<typeof THREE.Vector3>;

        mesh.position.set(rest.x + anim.from.x, rest.y - anim.from.y, rest.z + anim.from.z);
        mesh.rotation.set(anim.from.rx, anim.from.ry, anim.from.rz);

        timeline.to(
          mesh.position,
          { x: rest.x, y: rest.y, z: rest.z, duration: anim.duration, ease: "power3.out" },
          anim.delay,
        );
        timeline.to(
          mesh.rotation,
          { x: 0, y: 0, z: 0, duration: anim.duration, ease: "power3.out" },
          anim.delay,
        );
      }

      // Hold on the locked monogram, then dissolve the whole overlay — not just
      // the canvas, which would leave the opaque bg-dusk-bg backdrop behind.
      timeline.to(
        fadeTargetRef.current ?? container,
        { opacity: 0, duration: TIMING.dissolve, ease: "power2.inOut" },
        TIMING.assembly + TIMING.hold,
      );

      const onResize = () => {
        fitCamera();
        renderer.render(scene, camera);
      };
      window.addEventListener("resize", onResize);

      cleanup = () => {
        window.removeEventListener("resize", onResize);
        timeline.kill();
        geometries.forEach((g) => g.dispose());
        [faceInk, faceCopper, side].forEach((m) => m.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    })().catch(() => {
      // Never trap the visitor behind a broken intro.
      if (!disposed) onCompleteRef.current();
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" aria-hidden="true" />;
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
npm run typecheck
npm run lint
```

Expected: clean. Fix any `@types/three` mismatches before proceeding.

- [ ] **Step 3: Commit**

```bash
git add components/intro/MonogramScene.tsx
git commit -m "feat: add live-rendered monogram scene"
```

---

### Task 6: Wire into the intro gate

**Files:**
- Modify: `components/intro/IntroGate.tsx`
- Delete: `public/intro/hero-loop.mp4`, `public/intro/hero-loop-poster.jpg`

**Interfaces:**
- Consumes: `<MonogramScene onComplete />` (Task 5)
- Produces: nothing new; `lib/intro/introGate.ts` is untouched and its tests still pass.

- [ ] **Step 1: Replace the video with the scene**

In `components/intro/IntroGate.tsx`:

Add the import alongside the existing ones, and add `useRef` to the existing React import:

```tsx
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { MonogramScene } from "./MonogramScene";
```

Inside the component, above the `dismiss` callback, add the overlay ref:

```tsx
  // MonogramScene dissolves this element at the end of its timeline. It must be
  // the overlay itself — fading only the canvas would leave this opaque backdrop.
  const overlayRef = useRef<HTMLDivElement>(null);
```

Attach it to the overlay div, which already has the `bg-dusk-bg` class:

```tsx
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-dusk-bg"
```

Replace the entire `<video>` element with:

```tsx
<MonogramScene onComplete={dismiss} fadeTargetRef={overlayRef} />
```

- [ ] **Step 2: Lower the failsafe timeout**

The existing failsafe was sized for an 8s video. Change the comment and timeout in the `phase === "playing"` effect from `10_000` to:

```tsx
    // The sequence is ~2.75s; 6s gives it headroom before we assume it's stuck.
    const failsafe = window.setTimeout(dismiss, 6_000);
```

- [ ] **Step 3: Delete the retired video assets**

```bash
git rm public/intro/hero-loop.mp4 public/intro/hero-loop-poster.jpg
```

- [ ] **Step 4: Verify no references remain**

Run: `grep -rn "hero-loop" --include=*.ts --include=*.tsx --include=*.css .`
Expected: no matches. (The favicon and OG image are separate static PNGs and stay.)

- [ ] **Step 5: Run the full suite and build**

```bash
npm test
npm run lint && npm run typecheck
npm run build
```

Expected: all tests pass, build succeeds.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: swap the intro video for the live monogram scene"
```

---

### Task 7: Visual verification and tuning

The geometry is derived from measurements, not eyeballed — but it has never been *seen*. This task is the gate that catches proportions that are numerically right and visually wrong. Do not skip it.

**Files:**
- Modify (as needed): `lib/intro/monogram/metrics.ts`, `components/intro/MonogramScene.tsx`

- [ ] **Step 1: Run the dev server**

```bash
npm run dev -- --webpack --port 3000
```

Turbopack is broken on this machine; `--webpack` is required.

- [ ] **Step 2: View the intro as a first-time visitor**

Open `http://localhost:3000` in a fresh private window (or run `localStorage.removeItem("apd:intro-seen")` in the console and reload).

- [ ] **Step 3: Compare against the reference**

Open `docs/superpowers/reference/monogram/higgsfield-ap-logo-6.png` (the locked frame) side by side with the locked state of the live render. Check each:

- [ ] Letterforms read as a clean "AP" — A symmetric with a low crossbar, P with a large bowl
- [ ] The P's bowl is visibly one solid piece throughout the animation, never fractured
- [ ] Side walls read lighter than the faces (the metal cue); if not, lighten `side` material
- [ ] Seams between locked chunks are visible as bright bevel edges
- [ ] No overshoot, bounce, or wobble on any chunk as it lands
- [ ] The A's right leg passes cleanly *behind* the P's stem — no z-fighting flicker where they overlap
- [ ] The overlay dissolves completely to reveal the scroll journey; if the canvas fades but a flat backdrop remains, `fadeTargetRef` is not reaching the overlay
- [ ] Background matches the page underneath, so the dissolve reveals no colour step
- [ ] Nothing clips the viewport at 375px wide, 768px, and 1440px

- [ ] **Step 4: Tune metrics, not geometry code**

Adjust values in `lib/intro/monogram/metrics.ts` and re-check. The chunk polygons recompute automatically. Re-run `npm test` after each change — the chunk tests guard against vertices escaping the viewBox.

- [ ] **Step 5: Verify the gate contract still holds**

- [ ] Reload — the intro does NOT replay (localStorage flag)
- [ ] Fresh private window with OS "reduce motion" enabled — intro is skipped entirely
- [ ] Fresh private window, press Escape mid-animation — dismisses immediately
- [ ] Fresh private window, click Skip — dismisses immediately
- [ ] While the intro plays, scrolling does not move the page underneath

- [ ] **Step 6: Confirm three.js is not in the main bundle**

```bash
npm run build
```

Check the build output: the route's First Load JS should not have grown by ~150KB. three.js must appear only in a separate async chunk.

- [ ] **Step 7: Commit any tuning**

```bash
git add -A
git commit -m "fix: tune monogram proportions against the reference render"
```

---

## Rollback

Tag before starting:

```bash
git tag pre-live-monogram
```

To abandon: `git reset --hard pre-live-monogram`.
