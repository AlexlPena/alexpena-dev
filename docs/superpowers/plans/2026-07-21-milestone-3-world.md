# Milestone 3 — The World Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the React Three Fiber world behind the DOM: a fixed canvas (desktop-only, capability-gated), a scroll-driven camera rail descending through four blocked-out strata, and the falling copper signal — ugly but structurally true. The DOM story remains the complete experience everywhere the canvas doesn't mount.

**Architecture:** Pure modules (`lib/world/rail.ts`) map scroll progress → camera/signal positions, tested like the dusk curve. The canvas subscribes to the existing `scrollStore` via `getState()` inside `useFrame` (no React re-renders per scroll frame; the store API gains nothing). A strict layer scheme (`z-0` fixed canvas, `z-10` DOM, `pointer-events-none` section wrappers) keeps the DOM interactive above the world. Three.js is code-split and never loads on mobile/reduced-motion/weak devices.

**Tech Stack:** adds `three`, `@react-three/fiber` (v9, React 19-compatible), `@react-three/drei`, `@types/three`. Everything else unchanged.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-21-cinematic-portfolio-design.md` — canonical (including the recorded "dissolve" decision; do not re-flag it).
- Canvas mounts ONLY when ALL hold: viewport `(min-width: 1024px)`, `(hover: hover)`, NOT `prefers-reduced-motion: reduce`, and a WebGL context can be created. Everywhere else the M2 DOM story ships untouched.
- Three.js/R3F code must be code-split (`next/dynamic`, `ssr: false`) — zero bytes of it in the initial/SSR bundle; SSR HTML must be byte-identical with and without the canvas feature present.
- The canvas is decorative: `aria-hidden`, behind all DOM, never intercepts pointer events. DOM links (Daylight) must remain clickable — every section wrapper becomes `pointer-events-none` with `pointer-events-auto` restored on interactive children.
- The store API is frozen — the canvas consumes `scrollStore.getState()` / `subscribe()` only. No new store methods.
- No custom GLSL, no postprocessing, no Blender assets, no physics — blockout geometry from three.js primitives only (that's Phase 2+/M5 territory).
- Copper accents in-world use `#d67f3c` (dark-world pole); world surfaces are dark graphite tones — never pure black, no new chromatic colors.
- DPR capped at 2. `frameloop="always"` is acceptable for this milestone; per-device tuning is M5's budget pass (note it, don't build it).
- Ambient/clock-driven animation is NOT in this milestone (signal pulse etc. come with M4/M5) — all world motion derives from scroll progress, so nothing needs tab-hidden pausing yet.
- Windows dev machine; commands are Git Bash. Port 3000 may be occupied by Alex's preview server — kill any running dev server before starting your own (`npx kill-port 3000` or check first).
- Every commit: `git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit ...` ending with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Layer scheme — canvas slot, z-index, pointer-events

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/sections/Surface.tsx`, `components/sections/Request.tsx`, `components/sections/Descent.tsx`, `components/sections/Outcomes.tsx`, `components/sections/Daylight.tsx`

**Interfaces:**
- Produces: `<main>` gains `z-10` stacking context; every `<section>` gains `pointer-events-none`; Daylight's `<a>` links gain `pointer-events-auto`. A reserved sibling slot in `app/page.tsx` (a comment marker) where Task 5 inserts the canvas at `z-0`. No visual change.

- [ ] **Step 1: Update `app/page.tsx` main element**

Change the `<main>` line to:

```tsx
    <main className="relative z-10" style={{ height: `${JOURNEY_VH}vh` }}>
```

and add, directly ABOVE `<main>` (inside the returned fragment — wrap the return in `<>...</>`):

```tsx
      {/* world-canvas-slot: Task 5 mounts <WorldCanvas /> here (fixed, z-0, behind the DOM) */}
```

- [ ] **Step 2: Add `pointer-events-none` to every section wrapper**

In each of the five section components, append `pointer-events-none` to the `<section>` element's `className` (all five currently start `absolute inset-x-0 flex h-screen items-center`). Example (Surface):

```tsx
      className="absolute inset-x-0 flex h-screen items-center pointer-events-none"
```

Same one-word addition in Request, Descent (the mapped `<section>`), Outcomes, Daylight.

- [ ] **Step 3: Restore interactivity on Daylight's links**

In `components/sections/Daylight.tsx`, the contact `<a>` className begins `text-body text-dusk-ink underline ...`. Prepend `pointer-events-auto`:

```tsx
              className="pointer-events-auto text-body text-dusk-ink underline decoration-dusk-copper underline-offset-4 hover:text-dusk-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dusk-copper"
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint && npm test && npm run build` — all pass.
Then `npm run dev` + curl: page renders identically (this is a no-visual-change refactor); manually confirm in the served HTML that each `<section` tag contains `pointer-events-none` and the Daylight `<a>` contains `pointer-events-auto`. Kill the server.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/sections
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: layer scheme — DOM above future canvas, pointer-events discipline

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Rail + signal path pure modules (TDD)

**Files:**
- Create: `lib/world/rail.ts`, `lib/world/rail.test.ts`
- Modify: `vitest.config.ts` — no change needed (include pattern `lib/**/*.test.ts` already covers `lib/world/`); verify only.

**Interfaces:**
- Consumes: `REST_POINTS` from `lib/scroll/journeyLayout.ts` (test sync).
- Produces (Tasks 4–5 import verbatim):
  - `DESCENT_DEPTH = 40` (world units the camera descends)
  - `railY(progress: number): number` — camera Y; 0 through Act I–II, linear descent −0→−40 over p 0.2–0.7, hold −40 through 0.82, fast rise back to 0 over 0.82–0.92, 0 after
  - `STRATUM_DEPTHS: readonly number[]` — the four camera-rest depths, computed as `railY(REST_POINTS.stratumN)`
  - `signalY(progress: number): number` — `railY(p) - signalLead(p)`
  - `signalLead(progress: number): number` — 2 world units, growing to 5 across p 0.575–0.65 (the signal pulls ahead entering the loop stratum)
  - `signalVisible(progress: number): boolean` — true for p in [0.10, 0.86]

- [ ] **Step 1: Write failing tests — `lib/world/rail.test.ts`**

```ts
import { describe, expect, test } from "vitest";
import {
  DESCENT_DEPTH,
  railY,
  STRATUM_DEPTHS,
  signalY,
  signalLead,
  signalVisible,
} from "./rail";
import { REST_POINTS } from "../scroll/journeyLayout";

describe("railY", () => {
  test("camera holds at surface through Acts I-II", () => {
    expect(railY(0)).toBe(0);
    expect(railY(0.16)).toBe(0);
    expect(railY(0.2)).toBe(0);
  });

  test("descends linearly to -DESCENT_DEPTH across the descent", () => {
    expect(railY(0.45)).toBeCloseTo(-DESCENT_DEPTH / 2, 5);
    expect(railY(0.7)).toBeCloseTo(-DESCENT_DEPTH, 5);
  });

  test("holds full depth through resolution", () => {
    expect(railY(0.75)).toBeCloseTo(-DESCENT_DEPTH, 5);
    expect(railY(0.82)).toBeCloseTo(-DESCENT_DEPTH, 5);
  });

  test("fast ascent returns to surface", () => {
    expect(railY(0.87)).toBeCloseTo(-DESCENT_DEPTH / 2, 5);
    expect(railY(0.92)).toBeCloseTo(0, 5);
    expect(railY(1)).toBe(0);
  });

  test("clamps out-of-range input", () => {
    expect(railY(-1)).toBe(0);
    expect(railY(2)).toBe(0);
  });
});

describe("STRATUM_DEPTHS", () => {
  test("equals the camera rest depth at each stratum rest point", () => {
    expect(STRATUM_DEPTHS).toHaveLength(4);
    expect(STRATUM_DEPTHS[0]).toBeCloseTo(railY(REST_POINTS.stratum1), 5);
    expect(STRATUM_DEPTHS[1]).toBeCloseTo(railY(REST_POINTS.stratum2), 5);
    expect(STRATUM_DEPTHS[2]).toBeCloseTo(railY(REST_POINTS.stratum3), 5);
    expect(STRATUM_DEPTHS[3]).toBeCloseTo(railY(REST_POINTS.stratum4), 5);
  });

  test("depths are strictly descending", () => {
    for (let i = 1; i < STRATUM_DEPTHS.length; i++) {
      expect(STRATUM_DEPTHS[i]).toBeLessThan(STRATUM_DEPTHS[i - 1]);
    }
  });
});

describe("signal", () => {
  test("leads the camera by 2 units before the loop stratum", () => {
    expect(signalLead(0.3)).toBeCloseTo(2, 5);
    expect(signalY(0.3)).toBeCloseTo(railY(0.3) - 2, 5);
  });

  test("pulls ahead to 5 units entering the loop stratum", () => {
    expect(signalLead(0.65)).toBeCloseTo(5, 5);
    expect(signalLead(0.7)).toBeCloseTo(5, 5);
  });

  test("visibility window", () => {
    expect(signalVisible(0.05)).toBe(false);
    expect(signalVisible(0.1)).toBe(true);
    expect(signalVisible(0.5)).toBe(true);
    expect(signalVisible(0.86)).toBe(true);
    expect(signalVisible(0.9)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — `./rail` not found.

- [ ] **Step 3: Implement `lib/world/rail.ts`**

```ts
// Scroll progress -> world-space positions for the camera rail and signal.
// Same philosophy as duskCurve: pure, tested, single source of truth.
// The descent (p 0.2-0.7) maps linearly to -DESCENT_DEPTH; the ascent
// (0.82-0.92) rises 5x faster — the spec's "slow dive, quick surfacing".
import { REST_POINTS } from "../scroll/journeyLayout";

export const DESCENT_DEPTH = 40;

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

export function railY(progress: number): number {
  const p = clamp01(progress);
  if (p <= 0.2) return 0;
  if (p <= 0.7) return (-(p - 0.2) / 0.5) * DESCENT_DEPTH;
  if (p <= 0.82) return -DESCENT_DEPTH;
  if (p <= 0.92) return -DESCENT_DEPTH * (1 - (p - 0.82) / 0.1);
  return 0;
}

// Camera-rest depth of each stratum: where the camera sits when the visitor
// rests on that stratum's caption. Geometry is placed at these depths so
// the world and the DOM captions stay aligned by construction.
export const STRATUM_DEPTHS: readonly number[] = [
  railY(REST_POINTS.stratum1),
  railY(REST_POINTS.stratum2),
  railY(REST_POINTS.stratum3),
  railY(REST_POINTS.stratum4),
];

// The signal runs ahead of the camera; entering the loop stratum it pulls
// further ahead — the first hint the system is self-driving.
export function signalLead(progress: number): number {
  return 2 + 3 * smoothstep(0.575, 0.65, clamp01(progress));
}

export function signalY(progress: number): number {
  return railY(progress) - signalLead(progress);
}

export function signalVisible(progress: number): boolean {
  const p = clamp01(progress);
  return p >= 0.1 && p <= 0.86;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS (railY(0.26) = −4.8, railY(0.4) = −16, railY(0.54) = −27.2, railY(0.7) = −40 feed the STRATUM_DEPTHS assertions).

- [ ] **Step 5: Commit**

```bash
git add lib/world
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: camera rail and signal path modules

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Dependencies + capability gate

**Files:**
- Modify: `package.json` (via npm install)
- Create: `components/world/useCanvasEligible.ts`

**Interfaces:**
- Produces: `useCanvasEligible(): boolean` — client hook; `true` only when desktop media queries pass, reduced motion is off, and WebGL is available. Starts `false` (SSR-safe) and flips after mount. Task 5 consumes it verbatim.

- [ ] **Step 1: Install**

```bash
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

Expected: `@react-three/fiber` resolves to v9.x (React 19 peer). If npm reports an unresolvable peer conflict, STOP and report BLOCKED with the output — do not use `--force`.

- [ ] **Step 2: Create `components/world/useCanvasEligible.ts`**

```ts
"use client";

import { useEffect, useState } from "react";

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") || canvas.getContext("webgl")
    );
  } catch {
    return false;
  }
}

// The world mounts only where it can be excellent: desktop pointer devices,
// motion welcome, WebGL present. Everywhere else the DOM story IS the site
// (spec Section 7, device tiers 3-4). Starts false so SSR and first paint
// are canvas-free by construction.
export function useCanvasEligible(): boolean {
  const [eligible, setEligible] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia(
      "(min-width: 1024px) and (hover: hover)"
    );
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const evaluate = () =>
      setEligible(desktop.matches && !reduced.matches && webglAvailable());

    evaluate();
    desktop.addEventListener("change", evaluate);
    reduced.addEventListener("change", evaluate);
    return () => {
      desktop.removeEventListener("change", evaluate);
      reduced.removeEventListener("change", evaluate);
    };
  }, []);

  return eligible;
}
```

- [ ] **Step 3: Verify + commit**

Run: `npm run typecheck && npm run lint && npm run build` — all pass.

```bash
git add package.json package-lock.json components/world
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: three/R3F dependencies and canvas capability gate

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: The world — camera rig, strata blockout, signal

**Files:**
- Create: `components/world/World.tsx`, `components/world/CameraRig.tsx`, `components/world/StratumBlock.tsx`, `components/world/Signal.tsx`

**Interfaces:**
- Consumes: `scrollStore` (`getState` inside `useFrame` — no store changes), `railY`, `STRATUM_DEPTHS`, `signalY`, `signalVisible` (Task 2), `STRATA` (`lib/content/strata.ts`, for count/ids only).
- Produces: `<World />` — the complete scene contents (no Canvas element; Task 5 provides it). Blockout only: primitives, flat dark materials, copper `#d67f3c` accents.

- [ ] **Step 1: Create `components/world/CameraRig.tsx`**

```tsx
"use client";

import { useFrame } from "@react-three/fiber";
import { scrollStore } from "@/lib/scroll/store";
import { railY } from "@/lib/world/rail";

// Reads the store imperatively every frame — zero React re-renders on
// scroll. Lerp gives the camera physical weight on top of Lenis smoothing.
export function CameraRig() {
  useFrame(({ camera }, delta) => {
    const target = railY(scrollStore.getState().progress);
    const k = 1 - Math.exp(-6 * delta); // framerate-independent lerp
    camera.position.y += (target - camera.position.y) * k;
  });
  return null;
}
```

- [ ] **Step 2: Create `components/world/StratumBlock.tsx`**

Blockout geometry per stratum identity. Variant shapes are deliberately crude — structure and placement are what this milestone proves.

```tsx
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
```

- [ ] **Step 3: Create `components/world/Signal.tsx`**

```tsx
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
```

- [ ] **Step 4: Create `components/world/World.tsx`**

```tsx
"use client";

import { CameraRig } from "./CameraRig";
import { StratumBlock } from "./StratumBlock";
import { Signal } from "./Signal";
import { STRATUM_DEPTHS } from "@/lib/world/rail";

// Scene contents. The Canvas element (and the decision to mount at all)
// lives in WorldCanvas.tsx.
export function World() {
  return (
    <>
      <CameraRig />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 8, 6]} intensity={0.6} />
      <Signal />
      {STRATUM_DEPTHS.map((depth, i) => (
        <StratumBlock key={depth} depth={depth} variant={i as 0 | 1 | 2 | 3} />
      ))}
    </>
  );
}
```

- [ ] **Step 5: Verify + commit**

Run: `npm run typecheck && npm run lint && npm run build` — all pass (components unmounted until Task 5).

```bash
git add components/world
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: world blockout — camera rig, four strata, the signal

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: WorldCanvas — mount, code-split, wire into the page

**Files:**
- Create: `components/world/WorldCanvas.tsx`, `components/world/WorldCanvasGate.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `useCanvasEligible` (Task 3), `World` (Task 4).
- Produces: `<WorldCanvasGate />` mounted in `app/page.tsx` at the Task 1 slot. Three.js loads only after eligibility resolves true.

- [ ] **Step 1: Create `components/world/WorldCanvas.tsx`** (the heavy file — dynamically imported)

```tsx
"use client";

import { Canvas } from "@react-three/fiber";
import { World } from "./World";

// Fixed, full-viewport, behind the DOM (z-0 vs main's z-10), transparent so
// the dusk background shows through, and inert to both pointer and AT.
export function WorldCanvas() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
    >
      <Canvas
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
        camera={{ position: [0, 0, 10], fov: 50 }}
        frameloop="always"
      >
        <World />
      </Canvas>
    </div>
  );
}

export default WorldCanvas;
```

- [ ] **Step 2: Create `components/world/WorldCanvasGate.tsx`**

```tsx
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
```

- [ ] **Step 3: Mount in `app/page.tsx`**

Replace the Task 1 slot comment with the component (add the import):

```tsx
import { WorldCanvasGate } from "@/components/world/WorldCanvasGate";
```

```tsx
      <WorldCanvasGate />
```

- [ ] **Step 4: Verify**

1. `npm run typecheck && npm run lint && npm test && npm run build` — all pass.
2. Bundle split check: in the build output (or `.next` chunks), confirm three.js is NOT in the page's initial JS — it lives in the dynamically imported chunk. `curl` the page: SSR HTML contains no `<canvas>` and is unchanged from Task 1's version.
3. Dev-server smoke: with a desktop UA, load the page in the dev server and confirm no runtime errors in the server log; the `<canvas>` appears client-side only. Kill the server.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx components/world
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: mount code-split world canvas behind the journey

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Carried-over cleanups (M2 final-review minors)

**Files:**
- Modify: `lib/scroll/store.ts` (throttle subscriber-error logging)
- Modify: `components/sections/Request.tsx` (index keys)
- Modify: `components/sections/Outcomes.tsx`, `components/sections/Descent.tsx`, `components/sections/Request.tsx`, `components/sections/Daylight.tsx` (heading outline)
- Test: `lib/scroll/store.test.ts` (unchanged — verify still green)

**Interfaces:**
- Produces: screen-reader outline mirrors the six-act structure; no behavior changes elsewhere.

- [ ] **Step 1: Throttle subscriber-error logging in `lib/scroll/store.ts`**

Replace the `notify` function with (log once per subscriber, not per frame):

```ts
  const errored = new WeakSet<(s: ScrollState) => void>();
  const notify = () => {
    subs.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        // One broken subscriber must not starve the rest of the frame —
        // and must not flood the console at 60Hz either.
        if (!errored.has(fn)) {
          errored.add(fn);
          console.error("scroll store subscriber threw (logged once)", err);
        }
      }
    });
  };
```

- [ ] **Step 2: Index keys in `components/sections/Request.tsx`**

The paragraphs are a static readonly array — index keys are correct here. Change the map to:

```tsx
          {IDENTITY.request.paragraphs.map((text, i) => (
            <p key={i} className="text-body leading-relaxed text-dusk-ink">
              {text}
            </p>
          ))}
```

- [ ] **Step 3: Heading outline**

- `components/sections/Outcomes.tsx`: change the card `<h2` elements to `<h3` (closing tags too), and add a visually-hidden section heading directly above the `<Readout>`:

```tsx
        <h2 className="sr-only">Completed runs</h2>
```

- `components/sections/Request.tsx`: add above its `<Readout>`:

```tsx
        <h2 className="sr-only">The request</h2>
```

- `components/sections/Daylight.tsx`: add above its `<Readout>` row:

```tsx
        <h2 className="sr-only">About and contact</h2>
```

- `components/sections/Descent.tsx`: no change (era `h2`s are the real headings).

(`sr-only` is a Tailwind built-in utility.)

- [ ] **Step 4: Verify + commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build` — all pass. Curl the dev server page once: `<h1>` count still 1; `sr-only` h2s present; outcome cards are `<h3>`.

```bash
git add lib/scroll/store.ts components/sections
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "fix: M2 review minors — log throttle, index keys, heading outline

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Milestone exit criteria

- All checks green: `typecheck`, `lint`, `test`, `build`.
- Three.js confirmed absent from the initial JS bundle and SSR HTML.
- Human browser walkthrough (Alex, desktop): the world appears behind the text; scrolling descends the camera through four distinct blocked-out strata aligned with their captions; the copper signal falls ahead of the camera and pulls further ahead entering the loop stratum; the ascent rushes back to the surface; Daylight links still clickable; no jank at 1440px.
- Mobile (375px) and reduced-motion: byte-identical M2 experience, zero three.js loaded (verify via devtools network tab — no world chunk).
- The detach moment ships as a structural approximation: the canvas signal becomes visible at p ≥ 0.10 — exactly as Act I (and its DOM dot) leaves the viewport — so the hand-off reads correctly in sequence. The seamless same-frame, same-screen-position choreography the spec describes is M5 polish (it additionally depends on resolving the vh-vs-innerHeight drift noted in the M2 review).
- Known M3 limits (by design, for the walkthrough): geometry is crude blockout; no materials/fog polish (M4); no pulse or postprocessing (M5); `frameloop="always"` untuned (M5).
