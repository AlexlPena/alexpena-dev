# Milestone 4 — The Descent, Refined Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the blockout world into designed machinery: dusk-synced fog and lighting, four purpose-built strata with subtle ambient life, pointer parallax — plus the M3 review carries (probe context hygiene, camera snap, text selection). After this milestone the world should read as *instrumented infrastructure*, not floating geometry.

**Architecture:** A new pure module (`lib/world/atmosphere.ts`) holds fog/parallax constants and functions, tested like the rail. A `FogRig` syncs three.js fog color/depth to the dusk engine every frame (with a change short-circuit), which makes the world nearly imperceptible in the light acts and fully present in the dark — the spec's Act I requirement, achieved through atmosphere instead of hacks. Each stratum becomes its own component under `components/world/strata/` with tiny clock-driven ambient motion (browser rAF auto-pauses in hidden tabs, satisfying the spec's tab-hidden rule with zero code).

**Tech Stack:** unchanged. `@react-three/drei` (already installed) is now permitted for `<Edges>` only.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-21-cinematic-portfolio-design.md` — canonical. The world must read as instrumented infrastructure; banned: orbs-as-decor, neon, circuit-board patterns, chaotic particles.
- Copper `#d67f3c` remains the only chromatic color in-world; graphite tones `#221f1b`/`#2e2a25` for surfaces; fog color comes from the dusk engine's `bg` token — never hardcode a background color in the world.
- Store API frozen; canvas reads via `getState()` in `useFrame` only.
- Ambient motion: subtle (amplitudes ≤0.08 world units, rotations ≤0.12 rad/s), clock-driven via `useFrame`'s clock; no springs/bounce; rAF pausing in hidden tabs is the tab-hidden strategy (do not add visibility listeners).
- Pointer parallax: presence not control — max offsets 0.5 (x) / 0.3 (y) world units, lerped; never rotate the camera from pointer input.
- No custom GLSL, no postprocessing, no Blender assets (M5/Phase 2). drei usage limited to `<Edges>`.
- Mobile/reduced-motion path must remain byte-identical (all changes are canvas-side or pointer-events refinements that keep DOM behavior).
- `frameloop="always"` stays — M5 owns tuning.
- Windows; Git Bash; kill any running dev server before starting your own.
- Every commit: `git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit ...` ending with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: M3 review carries — probe hygiene, camera snap, text selection

**Files:**
- Modify: `components/world/useCanvasEligible.ts`
- Modify: `components/world/CameraRig.tsx`
- Modify: `components/sections/Surface.tsx`, `components/sections/Request.tsx`, `components/sections/Descent.tsx`, `components/sections/Outcomes.tsx`, `components/sections/Daylight.tsx`

**Interfaces:**
- Produces: WebGL probed once per session with the probe context explicitly released; camera snaps (no swoop) when the canvas mounts mid-journey; body text selectable again via `pointer-events-auto` on each section's inner content column.

- [ ] **Step 1: Memoize + release the WebGL probe in `components/world/useCanvasEligible.ts`**

Replace the `webglAvailable` function with:

```ts
// Probe once per session — GPU capability doesn't change mid-visit — and
// explicitly release the probe context so it can't count against the
// browser's live-context cap.
let webglProbe: boolean | null = null;

function webglAvailable(): boolean {
  if (webglProbe !== null) return webglProbe;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    webglProbe = !!gl;
    if (gl) gl.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglProbe = false;
  }
  return webglProbe;
}
```

- [ ] **Step 2: First-frame snap in `components/world/CameraRig.tsx`**

Replace the file's contents with:

```tsx
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { scrollStore } from "@/lib/scroll/store";
import { railY } from "@/lib/world/rail";

// Reads the store imperatively every frame — zero React re-renders on
// scroll. Lerp gives the camera physical weight on top of Lenis smoothing.
// The first frame snaps directly to target so a canvas that mounts
// mid-journey (reload with scroll restoration, eligibility flip) doesn't
// swoop down through every stratum.
export function CameraRig() {
  const snapped = useRef(false);

  useFrame(({ camera }, delta) => {
    const target = railY(scrollStore.getState().progress);
    if (!snapped.current) {
      snapped.current = true;
      camera.position.y = target;
      return;
    }
    const k = 1 - Math.exp(-6 * delta); // framerate-independent lerp
    camera.position.y += (target - camera.position.y) * k;
  });
  return null;
}
```

- [ ] **Step 3: Move `pointer-events-auto` to content columns**

In each of the five section components, add `pointer-events-auto` to the inner content `div`'s className (the `mx-auto w-full max-w-* px-6` element — in Descent it's the one inside the mapped section). Example (Surface):

```tsx
      <div className="pointer-events-auto mx-auto w-full max-w-3xl px-6">
```

Then in `components/sections/Daylight.tsx`, REMOVE the now-redundant `pointer-events-auto` from the contact `<a>` className (the content column covers it). Section wrappers keep `pointer-events-none` — the empty flex gutters (where sections overlap) stay click-through; only the text columns catch the pointer, restoring text selection.

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint && npm test && npm run build` — all pass.
Dev server + curl: each section's content `div` contains `pointer-events-auto`; Daylight `<a>` no longer does. Kill the server.

- [ ] **Step 5: Commit**

```bash
git add components/world components/sections
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "fix: M3 carries — probe context hygiene, camera snap, selectable text

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Atmosphere module (TDD)

**Files:**
- Create: `lib/world/atmosphere.ts`, `lib/world/atmosphere.test.ts`

**Interfaces:**
- Produces (Tasks 3–5 import verbatim):
  - `FOG_NEAR = 6`
  - `fogFar(dusk: number): number` — `12 + 18 * dusk`, clamped input; 12 in the light world (world shrouded, near-imperceptible) to 30 at full dark (world present)
  - `PARALLAX_MAX_X = 0.5`, `PARALLAX_MAX_Y = 0.3`
  - `parallaxOffset(pointer: number, max: number): number` — pointer in [-1, 1] (clamped) × max

- [ ] **Step 1: Write failing tests — `lib/world/atmosphere.test.ts`**

```ts
import { describe, expect, test } from "vitest";
import {
  FOG_NEAR,
  fogFar,
  PARALLAX_MAX_X,
  PARALLAX_MAX_Y,
  parallaxOffset,
} from "./atmosphere";

describe("fog", () => {
  test("constants", () => {
    expect(FOG_NEAR).toBe(6);
  });

  test("light world is shrouded, dark world is clear", () => {
    expect(fogFar(0)).toBe(12);
    expect(fogFar(1)).toBe(30);
    expect(fogFar(0.5)).toBeCloseTo(21, 5);
  });

  test("monotonically increasing with dusk", () => {
    let prev = fogFar(0);
    for (let d = 0.1; d <= 1; d += 0.1) {
      const v = fogFar(d);
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
  });

  test("clamps out-of-range dusk", () => {
    expect(fogFar(-1)).toBe(12);
    expect(fogFar(2)).toBe(30);
  });
});

describe("parallaxOffset", () => {
  test("scales pointer by max", () => {
    expect(parallaxOffset(0, PARALLAX_MAX_X)).toBe(0);
    expect(parallaxOffset(1, PARALLAX_MAX_X)).toBe(PARALLAX_MAX_X);
    expect(parallaxOffset(-1, PARALLAX_MAX_Y)).toBe(-PARALLAX_MAX_Y);
    expect(parallaxOffset(0.5, 0.4)).toBeCloseTo(0.2, 5);
  });

  test("clamps runaway pointer values", () => {
    expect(parallaxOffset(5, PARALLAX_MAX_X)).toBe(PARALLAX_MAX_X);
    expect(parallaxOffset(-5, PARALLAX_MAX_X)).toBe(-PARALLAX_MAX_X);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — `./atmosphere` not found.

- [ ] **Step 3: Implement `lib/world/atmosphere.ts`**

```ts
// Atmosphere constants and mappings for the world: fog depth follows the
// dusk engine (light world = shrouded and near-imperceptible, dark world =
// present), and pointer parallax is presence-not-control (spec motion
// tier 3: ~1 degree equivalent, translation only).

export const FOG_NEAR = 6;

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

export function fogFar(dusk: number): number {
  return 12 + 18 * clamp(dusk, 0, 1);
}

export const PARALLAX_MAX_X = 0.5;
export const PARALLAX_MAX_Y = 0.3;

export function parallaxOffset(pointer: number, max: number): number {
  return clamp(pointer, -1, 1) * max;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/world
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: atmosphere module — dusk-driven fog range, parallax mapping

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: FogRig, lighting, camera parallax

**Files:**
- Create: `components/world/FogRig.tsx`
- Modify: `components/world/World.tsx` (fog + lighting)
- Modify: `components/world/CameraRig.tsx` (parallax)

**Interfaces:**
- Consumes: `FOG_NEAR`, `fogFar`, `PARALLAX_MAX_X/Y`, `parallaxOffset` (Task 2), `duskToTokens` (`lib/theme/palette`), `scrollStore`.
- Produces: scene fog whose color always equals the page's current `--bg` (via `duskToTokens(effectiveDusk).bg` — same source as the CSS, so they can never drift) and whose far plane opens with dusk; hemisphere+key lighting; camera x/y parallax.

- [ ] **Step 1: Create `components/world/FogRig.tsx`**

```tsx
"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { scrollStore } from "@/lib/scroll/store";
import { duskToTokens } from "@/lib/theme/palette";
import { FOG_NEAR, fogFar } from "@/lib/world/atmosphere";

// Keeps three.js fog in lockstep with the dusk engine: fog color = the
// page's bg token (same function the DOM uses, so canvas and page cannot
// drift), fog depth opens as the world darkens. Short-circuits when dusk
// hasn't changed — zero allocation on idle frames.
export function FogRig() {
  const scene = useThree((s) => s.scene);
  const fogRef = useRef<THREE.Fog | null>(null);
  const lastDusk = useRef(Number.NaN);

  useFrame(() => {
    const { effectiveDusk } = scrollStore.getState();
    if (effectiveDusk === lastDusk.current) return;
    lastDusk.current = effectiveDusk;

    if (!fogRef.current) {
      fogRef.current = new THREE.Fog("#f7f5f1", FOG_NEAR, fogFar(0));
      scene.fog = fogRef.current;
    }
    fogRef.current.color.set(duskToTokens(effectiveDusk).bg);
    fogRef.current.far = fogFar(effectiveDusk);
  });

  return null;
}
```

- [ ] **Step 2: Update `components/world/World.tsx`**

Replace the file's contents with:

```tsx
"use client";

import { CameraRig } from "./CameraRig";
import { FogRig } from "./FogRig";
import { StratumBlock } from "./StratumBlock";
import { Signal } from "./Signal";
import { STRATUM_DEPTHS } from "@/lib/world/rail";

// Scene contents. The Canvas element (and the decision to mount at all)
// lives in WorldCanvas.tsx.
export function World() {
  return (
    <>
      <CameraRig />
      <FogRig />
      <hemisphereLight args={["#f2efe9", "#12100e", 0.5]} />
      <directionalLight position={[6, 10, 8]} intensity={0.7} />
      <Signal />
      {STRATUM_DEPTHS.map((depth, i) => (
        <StratumBlock key={depth} depth={depth} variant={i as 0 | 1 | 2 | 3} />
      ))}
    </>
  );
}
```

(The hemisphere light's two hex args are the theme poles used as light temperatures, not new colors. `StratumBlock` is still the blockout here — Tasks 4–5 replace it.)

- [ ] **Step 3: Add parallax to `components/world/CameraRig.tsx`**

Replace the `useFrame` body so position.x/y include pointer parallax (state.pointer is R3F's normalized pointer):

```tsx
  useFrame(({ camera, pointer }, delta) => {
    const target = railY(scrollStore.getState().progress);
    const px = parallaxOffset(pointer.x, PARALLAX_MAX_X);
    const py = parallaxOffset(pointer.y, PARALLAX_MAX_Y);
    if (!snapped.current) {
      snapped.current = true;
      camera.position.y = target;
      camera.position.x = px;
      return;
    }
    const k = 1 - Math.exp(-6 * delta); // framerate-independent lerp
    camera.position.y += (target + py - camera.position.y) * k;
    camera.position.x += (px - camera.position.x) * k;
  });
```

with the added import:

```tsx
import {
  parallaxOffset,
  PARALLAX_MAX_X,
  PARALLAX_MAX_Y,
} from "@/lib/world/atmosphere";
```

- [ ] **Step 4: Verify + commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build` — all pass.

```bash
git add components/world
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: dusk-synced fog, hemisphere lighting, pointer parallax

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Strata redesign I — Prompt + Context

**Files:**
- Create: `components/world/strata/PromptStratum.tsx`, `components/world/strata/ContextStratum.tsx`

**Interfaces:**
- Consumes: drei `Edges`, standard R3F primitives; each takes `{ depth: number }`.
- Produces: two designed strata components (not yet mounted — Task 5 swaps them in). Shared material language: graphite `#221f1b` roughness 0.85 metalness 0.15; soft graphite `#2e2a25`; copper `#d67f3c` as `<Edges>` accents or emissive at ≤0.5 intensity.

- [ ] **Step 1: Create `components/world/strata/PromptStratum.tsx`**

```tsx
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
    <group position={[2.5, depth, -4]}>
      {vanes.map((v, i) => (
        <mesh key={i} position={[v.x, v.y, 0]} rotation={[0, 0, v.tilt]}>
          <boxGeometry args={[v.w, 0.07, 1.1]} />
          <meshStandardMaterial
            color={i % 4 < 2 ? GRAPHITE : GRAPHITE_SOFT}
            roughness={0.85}
            metalness={0.15}
          />
          {v.copper && <Edges color={COPPER} />}
        </mesh>
      ))}
    </group>
  );
}
```

- [ ] **Step 2: Create `components/world/strata/ContextStratum.tsx`**

```tsx
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
```

(`side={2}` is `THREE.DoubleSide` — orbiting planes show both faces. If typecheck rejects the numeric literal, import `* as THREE from "three"` and use `side={THREE.DoubleSide}` instead — note the substitution in your report.)

- [ ] **Step 3: Verify + commit**

Run: `npm run typecheck && npm run lint && npm run build` — all pass (components unmounted until Task 5).

```bash
git add components/world/strata
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: designed Prompt and Context strata

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Strata redesign II — Harness + Loop; mount all four

**Files:**
- Create: `components/world/strata/HarnessStratum.tsx`, `components/world/strata/LoopStratum.tsx`
- Modify: `components/world/World.tsx`
- Delete: `components/world/StratumBlock.tsx`

**Interfaces:**
- Consumes: same material language as Task 4; `STRATUM_DEPTHS`.
- Produces: `World` renders `PromptStratum`, `ContextStratum`, `HarnessStratum`, `LoopStratum` at their depths; blockout `StratumBlock` deleted.

- [ ] **Step 1: Create `components/world/strata/HarnessStratum.tsx`**

```tsx
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
    <group position={[2.5, depth, -4]}>
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
```

- [ ] **Step 2: Create `components/world/strata/LoopStratum.tsx`**

```tsx
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
    <group position={[2.5, depth, -4]}>
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
```

- [ ] **Step 3: Swap into `components/world/World.tsx`**

Replace the file's contents with:

```tsx
"use client";

import { CameraRig } from "./CameraRig";
import { FogRig } from "./FogRig";
import { Signal } from "./Signal";
import { PromptStratum } from "./strata/PromptStratum";
import { ContextStratum } from "./strata/ContextStratum";
import { HarnessStratum } from "./strata/HarnessStratum";
import { LoopStratum } from "./strata/LoopStratum";
import { STRATUM_DEPTHS } from "@/lib/world/rail";

// Scene contents. The Canvas element (and the decision to mount at all)
// lives in WorldCanvas.tsx.
export function World() {
  return (
    <>
      <CameraRig />
      <FogRig />
      <hemisphereLight args={["#f2efe9", "#12100e", 0.5]} />
      <directionalLight position={[6, 10, 8]} intensity={0.7} />
      <Signal />
      <PromptStratum depth={STRATUM_DEPTHS[0]} />
      <ContextStratum depth={STRATUM_DEPTHS[1]} />
      <HarnessStratum depth={STRATUM_DEPTHS[2]} />
      <LoopStratum depth={STRATUM_DEPTHS[3]} />
    </>
  );
}
```

- [ ] **Step 4: Delete the blockout**

```bash
rm components/world/StratumBlock.tsx
```

- [ ] **Step 5: Verify + commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build` — all pass; grep confirms no remaining `StratumBlock` references.

```bash
git add -A
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: designed Harness and Loop strata; retire blockout

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Verification sweep

**Files:**
- None new — verification + evidence only (fixes allowed if checks fail).

- [ ] **Step 1: Full suite**

Run: `npm run typecheck && npm run lint && npm test && npm run build` — all pass; paste output.

- [ ] **Step 2: Scriptable page verification**

Dev server + curl:
- SSR HTML unchanged (no `<canvas>`, no three.js chunk in initial scripts — same checks as M3 Task 5)
- All M2 DOM content intact (one `h1`, sr-only h2s, mailto link)
Kill the server.

- [ ] **Step 3: Ambient-motion audit (code-level)**

Grep `components/world/strata/` for the ambient constants and confirm every amplitude ≤0.08 units and every rotation speed ≤0.12 rad/s (the Global Constraint). List them in the report.

- [ ] **Step 4: Commit (only if fixes were needed)**

Any fix found here gets its own conventional commit with the standard overrides.

---

## Milestone exit criteria

- All checks green; SSR/bundle-split unchanged; mobile/reduced-motion byte-identical.
- Human walkthrough (Alex, desktop):
  - Act I: the world is *barely there* — a suggestion in the fog, not floating geometry (the fogFar(0)=12 shroud).
  - Descent: four strata now read as designed machinery — converging vanes, an orbiting library, machined gates with parallel motes, a patient gyroscope — each emerging from fog as you approach.
  - Ambient life is felt, not noticed: nothing fidgets, the world breathes.
  - Pointer parallax: slight presence shift, never control.
  - Text is selectable again; Daylight links clickable; scroll feel unchanged.
- Expected fog interaction (by design, not a bug): the signal first appears at p ≈ 0.10 sitting right at the light-world fog boundary, so it *emerges from the fog with the first dim* rather than popping in — watch for it reading as intentional.
- Known limits for the walkthrough: no postprocessing glow/bloom (M5); signal has no pulse/trail yet (M5); detach still the structural approximation (M5); the spec's per-stratum *interactive* details (e.g. knowledge threads bending toward the cursor) are deliberately deferred to M5 alongside choreography — M4's pointer response is camera parallax only.
