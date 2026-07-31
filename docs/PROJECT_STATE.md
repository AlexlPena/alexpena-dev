# Project state — alexpena.dev

Last updated: 2026-07-22

This file is the durable handoff: where the project stands, what's decided, what's
open, and what a future session needs to know. (The blow-by-blow build ledger lives
in `.superpowers/sdd/progress.md`, which is git-ignored scratch — anything that
matters long-term belongs here instead.)

## Where things stand

**The site is finished and publishable, minus deployment.** It is the six-act dusk
journey in pure DOM: scroll drives a light → dark → light theme arc while the
narrative descends through four eras of Alex's craft and resurfaces for contact.

- `master` is clean, all work merged, 33 tests passing (`typecheck`/`lint`/`test`/`build` all green).
- Built across four milestones (foundation → shell → world → refinement), each one
  planned, implemented task-by-task with per-task review, and closed with a
  whole-branch review before merge.

## The one big decision: the 3D world is parked

Milestones 3 and 4 built a full WebGL layer — persistent canvas, scroll-driven
camera rail, dusk-synced fog, a falling copper signal, and four designed strata
(converging vanes / orbiting knowledge planes / machined ring-gates / nested
rotating rings). **On 2026-07-22 Alex reviewed it and decided to remove the entire
layer from the site.**

- Removal commit: `3a65fcb` (reviewed clean; JS bundle dropped ~51%).
- The world's complete, fully-reviewed code is preserved at git tag **`world-v1`**.
- Whether it returns — in this form, another form, or never — is an open decision.
  Do not assume it is coming back.

### How to revive the world

```bash
git checkout world-v1 -- components/world lib/world
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

Then re-mount `<WorldCanvasGate />` in `app/page.tsx`, and restore the
pointer-events discipline (`pointer-events-none` on the five `<section>` wrappers,
`pointer-events-auto` on their inner content columns) so the DOM stays interactive
above the canvas. Spec section 1a says the same thing.

## What's left to ship (Milestone 6)

1. **Deploy** to alexpena.dev (Vercel).
2. **Page metadata** — `app/layout.tsx` currently hardcodes title/description; source
   them from `lib/content/identity.ts` instead.
3. **Contact URLs** — `lib/content/contact.ts` has only the mailto entry; it carries a
   deliberate TODO because GitHub and LinkedIn URLs were never supplied. They must
   come from Alex; do not invent them.
4. **Font license** — Alex should read `app/fonts/cabinet-grotesk/LICENSE.txt` once to
   confirm the Fontshare EULA covers self-hosted webfont use. (It's the standard
   Fontshare FFL; this is a formality, not a known problem.)

## First-visit intro gate (2026-07-30)

Shipped: a video intro (`public/intro/hero-loop.mp4`, an 8s Higgsfield
Seedance 2.0 generation — the first real output of the AI Content Pipeline
project, see the "Portfolio Projects" Notion database) plays once for
first-time visitors, gated via `localStorage` (`lib/intro/introGate.ts`),
skipped for `prefers-reduced-motion` visitors and repeat visitors alike.
Favicon and OG image (`app/favicon.ico`, `app/opengraph-image.png`) are
cropped from the same clip's opening AP-monogram frame.

Rollback point: git tag `pre-intro-gate` (commit `824d504`), plus the prior
Vercel production deployment, which remains promotable if this needs to be
reverted.

## Design decisions worth not relitigating

- **Dusk is the mode.** No light/dark toggle — scroll owns the theme. Deliberate.
- **The dissolve.** Text passing *through* a theme crossing briefly drops below WCAG
  AA (around dusk 0.33–0.42). Alex accepted this as an intentional cinematic device
  on 2026-07-21; it's recorded in the spec's accessibility section. Content never
  *rests* inside a crossing — `lib/scroll/journeyLayout.test.ts` enforces that, and
  contrast at every rest point and act midpoint is test-verified.
- **Copy is approved.** Everything in `lib/content/` has been read and accepted by
  Alex. Changing it is a content decision, not a cleanup task.
- **Corrected progress formula.** `p = (elementCenter − viewportHeight/2) / (docHeight
  − viewportHeight)`, implemented in `lib/scroll/journeyLayout.ts`. An earlier plan
  used `center/docHeight`, which rested content half a viewport early on every
  plateau. Don't reintroduce it.

## Known environment issue (not a code bug)

`npm run dev` currently fails on this machine with a Turbopack panic —
`0xc0000142`, a Windows process-spawn/DLL-init failure — when it forks the PostCSS
worker. **Verified to reproduce on pre-removal commits that were working earlier the
same day**, so it is environmental, not caused by any change in this repo.

Workaround: `npm run build && npm start`. A reboot will most likely clear it.

## If the world is ever revived, start here

These were found by the Milestone 4 whole-branch review and never addressed, because
the layer was parked days later. They are real and worth fixing before any further
world work:

- **Verify strata exposure against real pixels.** three.js r155+ made lights physical
  (no π factor); intensities were raised to 1.6/2.2 by calculation, never confirmed
  visually. The whole "can you actually see the strata" question rests on this.
- **Ring-gates read as flat bars at rest** — the tori are edge-on; rotating ~0.3 rad
  would preserve an elliptical read.
- **LoopStratum's innermost ring rotates on its own symmetry axis**, so it appears
  static; and ring 2's per-frame write overwrites its designed initial tilt.
- **`FogRig` never clears `scene.fog` on unmount** — inert today, latent later.
- **Signal fog timing** — it only becomes readable around p ≈ 0.26, not at p = 0.10;
  the plan's "emerges with the first dim" claim was optimistic.
- **Harness mote travel (`MOTE_RANGE = 1.3`)** contradicted the plan's own "ambient
  amplitude ≤ 0.08" rule. Never adjudicated by Alex. It is the busiest motion in the
  world.
- **The spec and plans say DOM captions sit "screen-left" — they don't**, they're
  horizontally centered (`mx-auto`). Any future world layout planned on that premise
  will collide with the text.
