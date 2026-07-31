# alexpena.dev — First-Visit Intro Gate

Date: 2026-07-30
Owner: Alex Pena
Status: Approved, POC
Scope: New site feature — a video intro gate for first-time visitors

## 1. Purpose

A new visitor's first load of alexpena.dev plays a short cinematic video (the "AI
Content Pipeline" POC output — an 8s motion-identity loop built around the AP
monogram, generated with Higgsfield Seedance 2.0) before revealing the site.
Returning visitors skip straight to the journey. This is the first real content
artifact from the AI Content Pipeline project (see the Notion "Portfolio Projects"
database) landing on the site itself.

## 2. Behavior

- **First visit:** full-viewport video overlay plays automatically (muted,
  `playsInline`), above the existing scroll journey.
- **Returning visit:** overlay never renders — no flash, no delay. Determined by a
  `localStorage` flag (`apd:intro-seen`), checked in `useLayoutEffect` so the check
  resolves before the browser paints.
- **`prefers-reduced-motion: reduce`:** overlay is skipped entirely, same as a
  returning visitor. Mirrors the check `ScrollProvider` already performs for the
  scroll journey's own motion.
- **Skip:** a visible, auto-focused, keyboard-reachable skip button dismisses
  immediately.
- **End of video:** dismisses automatically (`onEnded`).
- **Either dismissal path:** marks `apd:intro-seen`, unmounts the overlay.
- **While showing:** body scroll is locked and the journey underneath is marked
  `inert` (unreachable by keyboard/AT), so the "gate" is real, not just visual.

## 3. Architecture

Two new modules, following the project's existing `lib/` (pure, tested) vs.
`components/` (client, presentational) split:

- **`lib/intro/introGate.ts`** — pure functions, storage injected as a parameter
  (matches how the rest of `lib/` avoids hard-coding browser globals):
  - `hasSeenIntro(storage: Pick<Storage, "getItem">): boolean`
  - `markIntroSeen(storage: Pick<Storage, "setItem">): void`
- **`components/intro/IntroGate.tsx`** — `"use client"`. Owns the
  checking → playing → dismissed state machine, the `<video>` element, the skip
  button, the scroll-lock/`inert` side effects, and the reduced-motion check.
- **Mount point:** `app/layout.tsx`, alongside `ScrollProvider`:
  `<ScrollProvider><IntroGate />{children}</ScrollProvider>`. Overlay renders at
  `z-50`; the journey's `<main>` is `z-10`, so stacking is already correct.
- **Asset:** `public/intro/hero-loop.mp4` (+ a poster frame for instant first
  paint), replacing the working file currently at the repo root
  (`alexpena-portfolio-video.mp4`).

## 4. Testing

`lib/intro/introGate.test.ts` — pure logic, fits the existing Vitest config
(`lib/**/*.test.ts`, node environment) with no new test infrastructure:

- Returns `false` when the flag is absent, `true` once `markIntroSeen` has run.
- `markIntroSeen` writes the exact expected key/value.

Component behavior (scroll-lock, `inert`, focus, video playback) is not
unit-tested — no DOM/component test environment exists in this project yet, and
adding one is out of scope for this feature.

## 5. Known gaps / follow-ups

- **Compression.** The generated file is 14.4 MB / 8s — heavy for an autoplay
  intro, especially on mobile. Shipping as-is for the POC (explicit decision,
  2026-07-30). Must be compressed (re-encode, target well under 5 MB) before this
  is a real production launch, not a POC.
- **Format.** Single MP4 only for now. A WebM/AV1 fallback is a reasonable later
  optimization, not required for the POC.
- **Hosting.** Ships from `public/` (standard Next.js static asset, served by
  Vercel's CDN). Revisit only if the asset needs to change without a redeploy.
- **n8n workflow revival.** The AI Content Pipeline n8n workflow itself (security
  fix, Vertex→Higgsfield swap, Notion logging) is still open — this video was
  generated manually through the Higgsfield app directly, not through the
  automated pipeline. Tracked separately; the intro gate does not depend on it.
