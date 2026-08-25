# Project state — alexpena.dev

Last updated: 2026-08-25

This file is the durable handoff: where the project stands, what's decided, what's
open, and what a future session needs to know. (The blow-by-blow build ledger lives
in `.superpowers/sdd/progress.md`, which is git-ignored scratch — anything that
matters long-term belongs here instead.)

## Where things stand

**The site is live at https://alexpena-dev.vercel.app.** It is the six-act dusk
journey in pure DOM: scroll drives a light → dark → light theme arc while the
narrative descends through four eras of Alex's craft and resurfaces for contact.
Act III's four strata now each carry a figure (see below).

- `main` is clean, all work merged, 49 tests passing (`typecheck`/`lint`/`test`/`build` all green).
- Deploys are automatic: pushing `main` promotes to production on Vercel.
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

1. **The apex domain.** `alexpena.dev` does not point at Vercel — it resolves to
   Render (`216.24.57.x`, behind Cloudflare) and returns `402 Payment Required`
   from a suspended service. Until that DNS moves, `metadataBase` in
   `app/layout.tsx` advertises a dead host in every OG/canonical URL. The live
   site is `alexpena-dev.vercel.app`.
2. **Page metadata** — `app/layout.tsx` currently hardcodes title/description; source
   them from `lib/content/identity.ts` instead.
3. **Contact URLs** — `lib/content/contact.ts` has only the mailto entry; it carries a
   deliberate TODO because GitHub and LinkedIn URLs were never supplied. They must
   come from Alex; do not invent them.
4. **Font license** — Alex should read `app/fonts/cabinet-grotesk/LICENSE.txt` once to
   confirm the Fontshare EULA covers self-hosted webfont use. (It's the standard
   Fontshare FFL; this is a formality, not a known problem.)

## The intro gate is gone (2026-08-25)

The first-visit "AP" monogram intro was built (2026-07-30, monogram rebuilt
2026-07-31), shipped to production on 2026-08-25, and **removed the same day**
— Alex reviewed it live and judged it too much. The whole feature is deleted:
`components/intro/`, `lib/intro/`, the `<IntroGate />` mount in
`app/layout.tsx`, and 34 tests. `three` and `@types/three` went with it —
`lib/intro/monogram/geometry.ts` was the only importer, and the bundle now
contains no three.js at all.

The site loads straight into Act I. There is no overlay, no scroll lock, no
localStorage gate, no canvas.

Rollback point: git tag **`pre-intro-removal`** (commit `3f3e830`), which is
the last state with it live. Earlier tags `pre-intro-gate` and
`pre-live-monogram` still mark the states before it existed.

Do not rebuild this without asking. It has now been through video → live 3D →
removed; the decision is that the site opens on the work, not on a title card.

## Figures in the descent (2026-08-25)

Act III's four strata each carry a diagram of their discipline
(`components/figures/strata/`), drawn as the section comes to rest. They are
arguments, not dashboards — **no measured quantities anywhere**, so the public
site hosts no invented metrics.

- Reveal is driven from journey progress by `<Reveal>` writing one custom
  property; it never calls setState, because this runs every scroll frame
  beside the theme interpolation. Timing lives in `lib/figures/reveal.ts`.
- The layout is deliberately asymmetric (text 5 of 12 columns, figure 6, one
  empty between). The rest of the journey is a centred single column and these
  have to read differently.
- `lib/theme/palette.ts` carries a figure ramp (`fig1..fig5`, `figMute`) that
  interpolates with dusk like every other token. Its dark pole is stepped
  against `#2e2b29` — the background at dusk 0.55, the lightest field a figure
  rests on in the dark half — not against `#12100e`.

A short-lived `/lab` review route and six placeholder-data charts existed on
2026-08-25 and were removed the same day; see git history if real numbers ever
justify rebuilding them.

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
