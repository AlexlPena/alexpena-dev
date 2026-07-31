# alexpena.dev — Live-Rendered Monogram Intro

Date: 2026-07-31
Owner: Alex Pena
Status: Approved
Scope: Replace the intro gate's baked MP4 with a live-rendered 3D monogram assembly

## 1. Purpose

The first-visit intro gate currently plays `public/intro/hero-loop.mp4`, an 8s clip
generated in Higgsfield. It autoplays correctly, but a pre-baked video reads as
lower-status than a scene rendered live in the browser — which matters for a site
whose job is to be a credibility anchor for an AI/engineering practitioner. This
replaces the video with real geometry animated at runtime.

The visual target is an existing Higgsfield render (`hf_20260731_205324_*.mp4`), a
4.06s clip of a fractured "AP" monogram reassembling. Reference frames are committed
at `docs/superpowers/reference/monogram/`.

This is a delivery-mechanism change. The gate's behavior — first-visit only,
reduced-motion skip, skippable, scroll-locked — is unchanged.

## 2. Reference analysis

Findings from a frame-by-frame read of the reference clip (1920×1080, 24fps, 4.06s).
These drive the spec, so they are recorded here rather than left implicit.

**Timing.** Assembly runs 0.0s → ~1.9s. Everything after is a static hold; frames at
2.1s and 3.9s are near-identical.

**The fracture is art-directed, not physics.** Pieces are slices of the letterforms'
own strokes, cut roughly perpendicular to each stroke's run — not Voronoi shatter.
The governing rule:

> **Straight strokes are sliced into slabs. Curves are never fractured.**

The P's bowl stays one intact "C" for the entire clip and only translates and rotates.
The A keeps its apex and upper diagonals as a single intact skeleton. This rule is the
single most important thing to preserve; random or physics-driven fracture reads
completely wrong.

**Material.** Top faces are matte with a subtle vertical gradient (A `#3A3130` →
`#2C2322`; P copper around `#834A28` in shade). The extruded side walls are
distinctly **lighter** than the faces — a pewter/silver, clearest in the P's counter,
which reads as a bright silver inner wall. This inverted value relationship (sides
lighter than faces, not darker) is what makes the letters read as metal rather than
plastic. Extrusion is shallow, ~8–12% of cap height, with a soft chamfer highlight
along the top edge.

**Camera.** Static. Flat-on with slight perspective, no orbit or push. The chunks
rotate in 3D; the camera does not move.

**Motion.** Chunks start within ~1–1.5× the logo's bounding box — close, not distant.
Rotations are moderate (10–60°, mostly in-plane with some 3D tilt), travel is on a
slight arc with light motion blur, and they **decelerate hard into place with no
overshoot or bounce**. Large chunks land first, small slabs last, over roughly a 0.6s
stagger. There is no impact flash, spark, or glow anywhere in the clip.

**Environment.** Flat warm cream background (`#DED3C6`, subtly darker toward the
bottom) with a wide soft contact shadow (`#D8C6BA`). Seamless cyclorama, soft diffuse
key from upper-left, no specular hits.

## 3. Deliberate departures from the reference

- **Palette comes from the site's tokens, not the clip.** Background `--bg #f7f5f1`,
  ink `--ink #1a1815`, copper `--copper #c0682b`. The intro's background must match
  the site's first-paint background *exactly* so the cross-dissolve reads as one
  continuous surface instead of a color pop.
- **Shorter.** ~2.0s assembly + ~0.4s hold + ~0.35s dissolve ≈ 2.75s total. The
  clip's ~2s of dead hold suits a standalone render, not a gate.
- **Custom-traced letterforms.** The clip's letters (sharp-apex A with a low crossbar,
  large-bowl P) are not Cabinet Grotesk. The monogram is traced as custom paths — only
  two glyphs — giving exact control over shapes and where cuts fall. It becomes its own
  logo asset, independent of the body font.
- **No WebGPU.** A dozen extruded meshes under soft lighting sits comfortably inside
  plain WebGL. WebGPU's support gaps would force a WebGL fallback anyway, doubling the
  work for no visual difference.

## 4. Key simplification: trace chunks, not letters

Because the letterforms are hand-traced regardless, the **chunks are traced directly**
as ~12 individual closed paths, rather than tracing two whole letters and computing
boolean cuts between them.

This removes the 2D polygon-boolean library and the entire cut-geometry problem. Each
chunk path is already its own shape, ready to extrude.

## 5. Chunk inventory

Twelve chunks total. Exact boundaries are finalized during tracing against the
reference frames; the invariant from §2 governs.

**A — ink (6 chunks)**
1. Skeleton: apex plus the upper portion of both diagonals, intact
2. Upper-left diagonal slab
3. Mid-left diagonal slab
4. Lower-left foot
5. Crossbar
6. Lower-right leg base slab

**P — copper (6 chunks)**
1. Bowl: the full curve, intact, never fractured
2. Upper arm slab
3. Stem top slab
4. Stem upper-mid slab
5. Stem lower slab
6. Small mid parallelogram

## 6. Architecture

**`lib/intro/monogram/chunks.ts`** — pure data, no three.js import. Per chunk: the
traced SVG path string, its material (`"ink" | "copper"`), and its start offset
(position, rotation, delay). This is the art-direction surface — retuning the
animation means editing numbers here and nothing else. Being import-free keeps it
testable in the existing node-environment Vitest setup.

**`components/intro/MonogramScene.tsx`** — `"use client"`. Owns the canvas, renderer,
scene, and GSAP timeline. Takes `onComplete`. Responsibilities:
- Dynamically `import()` three.js on mount (see §8)
- Parse each chunk path via `SVGLoader` → `ExtrudeGeometry` with a shallow bevel
- Assign materials via `ExtrudeGeometry`'s two material groups: caps take the letter's
  face material (ink or copper), sides take the shared pewter material. This mapping is
  exactly why the geometry type was chosen.
- Build and run the GSAP timeline
- Dispose geometries, materials, and the renderer on unmount

**Materials.** Three `MeshStandardMaterial`s, high roughness / low metalness:
- Ink face `#1a1815`
- Copper face `#c0682b`
- Pewter sides — notably lighter than both faces; start near `#c9c2b6` and tune
  against the reference frames

**Lighting.** Soft directional key from upper-left plus a hemisphere fill. No specular
hits. Camera is static with a long focal length (FOV ~25–30°) to approximate the
reference's flat-on look while retaining slight depth.

**Animation.** A GSAP timeline (GSAP is already a dependency) animates each chunk's
position and rotation from its authored offset to identity. Large chunks land first,
small slabs last, ~0.6s stagger, hard ease-out with **no overshoot easing** — no
`back`, no `elastic`. Then hold, then the overlay's opacity animates to 0 and
`onComplete` fires.

## 7. Integration with the existing gate

`components/intro/IntroGate.tsx` keeps its state machine, scroll lock, `inert`,
`data-lenis-prevent`, Escape handler, and skip button. The only change is swapping
the `<video>` element for `<MonogramScene onComplete={dismiss} />`.

`lib/intro/introGate.ts` is untouched, so its existing tests continue to hold.

**Failsafe timeout comes down.** The current 10s failsafe was sized for an 8s video.
The new sequence is ~2.75s, so the failsafe drops to ~6s.

**`public/intro/hero-loop.mp4` is deleted** (−1.1 MB). The favicon and OG image are
static PNGs already derived from the clip's opening frame and remain valid; regenerating
them from the live render is an optional follow-up, not part of this work.

## 8. Performance and fallbacks

- **Three.js is dynamically imported inside `MonogramScene`**, which only mounts after
  the localStorage and reduced-motion checks resolve. Returning visitors and
  reduced-motion visitors download none of it. Tree-shaken three.js core plus
  `SVGLoader` is ~150 KB gzipped — still lighter than the 1.1 MB video it replaces.
- **WebGL context creation failure → `onComplete` fires immediately.** Fails open,
  matching the current `onError` behavior. A visitor never gets trapped behind the gate.
- Device pixel ratio capped at 2.
- Twelve meshes is a trivial scene; no instancing or LOD needed.
- The monogram scales to fit the viewport so the composition holds on mobile.

## 9. Testing

`lib/intro/monogram/chunks.test.ts`, in the existing Vitest node environment:
- Every chunk path parses to a valid closed shape
- Chunk count and per-chunk material assignments are correct
- No chunk is missing a start offset

Rendering, animation, and disposal are not unit-tested — this project has no DOM or
component test environment, and adding one remains out of scope, consistent with the
decision recorded in the intro-gate spec.

## 10. Out of scope

- Regenerating the favicon and OG image from the live render
- Any reuse of the parked `world-v1` WebGL layer; this is a fresh, intro-only build
- Reviving the AI Content Pipeline n8n workflow, still tracked separately

## 11. Safety net

Tag `pre-live-monogram` on `main` before implementation begins, per this repo's
convention of working directly on `main` with tags as rollback points.
