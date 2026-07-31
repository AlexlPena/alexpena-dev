# First-Visit Intro Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a first-visit video intro (the AI Content Pipeline POC output) that gates the site for new visitors, plus a favicon/OG image derived from the same clip's opening AP-monogram frame.

**Architecture:** Two source assets get processed with `ffmpeg` into web-ready files under `public/` and the App Router's icon/OG conventions. A pure `lib/intro/introGate.ts` module owns the "has this visitor seen it" decision (localStorage-backed, dependency-injected for testing). A client component `components/intro/IntroGate.tsx` reads that decision before paint (`useLayoutEffect`, matching how `ScrollProvider` already checks `prefers-reduced-motion`), renders a full-viewport video overlay when needed, and locks/`inert`s the page underneath while it plays.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind v4 (existing `dusk-*` design tokens), Vitest, ffmpeg (installed this session via winget at `C:\Users\Alexp\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe` — add to PATH after a shell restart, or call the full path).

## Global Constraints

- Source video: `C:\Users\Alexp\Documents\alexpena-dev\alexpena-portfolio-video.mp4` (8s, 1920x1080, 14.4MB, has an unused AAC audio track).
- Source frame: `C:\Users\Alexp\Documents\alexpena-dev\ap-monogram-frame.png` (1920x1080 PNG, frame 0 of the video).
- Compression is required before this ships live — per the spec's own gap note ("must be compressed... before this is a real production launch, not a POC"). We are launching live now, so this plan does it.
- localStorage key: `apd:intro-seen` (from `docs/superpowers/specs/2026-07-30-intro-gate-design.md`).
- New files: `lib/intro/introGate.ts` (+ test), `components/intro/IntroGate.tsx`. Mounted in `app/layout.tsx` inside `<ScrollProvider>`, before `{children}`.
- Overlay z-index must exceed the journey's `<main className="relative z-10">` — use `z-50`.
- Only `lib/**/*.test.ts` is covered by the existing Vitest config (`environment: "node"`, no DOM). Do not add a DOM test environment for this feature — component behavior is verified manually.
- Styling must use the project's existing Tailwind tokens (`bg-dusk-bg`, `text-dusk-ink`, `text-dusk-ink-secondary`, `border-dusk-line`, `font-mono`, `text-mono-size`) — see `components/sections/Surface.tsx` for the established pattern.
- Safety net already in place: git tag `pre-intro-gate` on commit `824d504`, and the current Vercel production deployment stays live/rollback-able regardless of this work.

---

### Task 1: Compress the video and extract a poster image

**Files:**
- Create: `public/intro/hero-loop.mp4`
- Create: `public/intro/hero-loop-poster.jpg`

**Interfaces:**
- Produces: `/intro/hero-loop.mp4` and `/intro/hero-loop-poster.jpg` as public static URLs, consumed by `components/intro/IntroGate.tsx` in Task 4.

- [ ] **Step 1: Create the output directory**

```bash
mkdir -p public/intro
```

- [ ] **Step 2: Compress the video — strip the unused audio track, re-encode for web delivery**

```bash
ffmpeg -y -i alexpena-portfolio-video.mp4 -an -c:v libx264 -crf 27 -preset slow -movflags +faststart public/intro/hero-loop.mp4
```

(If `ffmpeg` is not found on PATH, use the full path: `"/c/Users/Alexp/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.2-full_build/bin/ffmpeg.exe"`.)

- [ ] **Step 3: Verify the compressed size**

```bash
ls -la public/intro/hero-loop.mp4
```

Expected: well under 5MB. If it's still large, re-run Step 2 with `-crf 30` instead of `-crf 27` (higher CRF = smaller file, more quality loss) until it lands well under 5MB.

- [ ] **Step 4: Generate the poster from the already-extracted first frame**

```bash
ffmpeg -y -i ap-monogram-frame.png -q:v 4 public/intro/hero-loop-poster.jpg
```

- [ ] **Step 5: Verify both files exist and look right**

```bash
ls -la public/intro/
```

Expected: `hero-loop.mp4` and `hero-loop-poster.jpg` both present, non-zero size.

- [ ] **Step 6: Commit**

```bash
git add public/intro/hero-loop.mp4 public/intro/hero-loop-poster.jpg
git commit -m "feat: add compressed intro video and poster asset"
```

---

### Task 2: Derive the favicon and OG image from the AP monogram frame

**Files:**
- Modify: `app/favicon.ico` (overwrite)
- Create: `app/opengraph-image.png`

**Interfaces:**
- Produces: Next.js App Router auto-wires both files into page metadata via file convention — no code changes required in this task.

- [ ] **Step 1: Crop a tight square around the monogram**

The monogram in `ap-monogram-frame.png` (1920x1080) is centered around (960, 540), spanning roughly 440x330px. Crop a 500x500 square centered on it:

```bash
ffmpeg -y -i ap-monogram-frame.png -vf "crop=500:500:710:290" -frames:v 1 ap-monogram-icon-source.png
```

- [ ] **Step 2: View the crop and adjust if needed**

Read `ap-monogram-icon-source.png`. If the "A" or "P" touches an edge, or the mark isn't centered, adjust the crop offsets (`710:290` are the x:y top-left corner) and re-run Step 1. Otherwise continue.

- [ ] **Step 3: Generate the favicon**

```bash
ffmpeg -y -i ap-monogram-icon-source.png -vf scale=256:256 app/favicon.ico
```

- [ ] **Step 4: Generate the OG image (1200x630, from the full frame so the background isn't over-cropped)**

```bash
ffmpeg -y -i ap-monogram-frame.png -vf "scale=1200:675,crop=1200:630" app/opengraph-image.png
```

- [ ] **Step 5: Verify both outputs**

```bash
ls -la app/favicon.ico app/opengraph-image.png
```

Read `app/opengraph-image.png` and `ap-monogram-icon-source.png` to confirm the monogram reads cleanly in both.

- [ ] **Step 6: Remove the now-unneeded working files from the repo root**

```bash
rm ap-monogram-icon-source.png ap-monogram-frame.png alexpena-portfolio-video.mp4
```

- [ ] **Step 7: Commit**

```bash
git add -A app/favicon.ico app/opengraph-image.png
git commit -m "feat: derive favicon and OG image from the AP monogram"
```

Note: `git add -A` here is scoped to two explicit paths, not the whole tree — it's needed because `git add` on a pre-existing binary file (`app/favicon.ico`) being overwritten behaves the same as a normal modify; this is just to also catch the deletions from Step 6 if they're still tracked. Run `git status --short` first — if `ap-monogram-frame.png` and `alexpena-portfolio-video.mp4` show as untracked (`??`) rather than tracked, they were never committed and the deletion needs no `git rm`, just confirm they're gone from `git status`.

---

### Task 3: `lib/intro/introGate.ts` — the seen/not-seen decision (TDD)

**Files:**
- Create: `lib/intro/introGate.ts`
- Test: `lib/intro/introGate.test.ts`

**Interfaces:**
- Produces: `hasSeenIntro(storage: Pick<Storage, "getItem">): boolean`, `markIntroSeen(storage: Pick<Storage, "setItem">): void`. Consumed by `components/intro/IntroGate.tsx` in Task 4.

- [ ] **Step 1: Write the failing test**

```typescript
// lib/intro/introGate.test.ts
import { describe, expect, test } from "vitest";
import { hasSeenIntro, markIntroSeen } from "./introGate";

function createFakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

describe("introGate", () => {
  test("hasSeenIntro is false when nothing has been stored", () => {
    expect(hasSeenIntro(createFakeStorage())).toBe(false);
  });

  test("markIntroSeen then hasSeenIntro returns true", () => {
    const storage = createFakeStorage();
    markIntroSeen(storage);
    expect(hasSeenIntro(storage)).toBe(true);
  });

  test("hasSeenIntro ignores unrelated keys", () => {
    const storage = createFakeStorage();
    storage.setItem("some-other-key", "1");
    expect(hasSeenIntro(storage)).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run lib/intro/introGate.test.ts
```

Expected: FAIL — `./introGate` has no exported member `hasSeenIntro`/`markIntroSeen` (module doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```typescript
// lib/intro/introGate.ts
const INTRO_SEEN_KEY = "apd:intro-seen";

export function hasSeenIntro(storage: Pick<Storage, "getItem">): boolean {
  return storage.getItem(INTRO_SEEN_KEY) === "1";
}

export function markIntroSeen(storage: Pick<Storage, "setItem">): void {
  storage.setItem(INTRO_SEEN_KEY, "1");
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run lib/intro/introGate.test.ts
```

Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/intro/introGate.ts lib/intro/introGate.test.ts
git commit -m "feat: add pure intro-seen storage logic"
```

---

### Task 4: `components/intro/IntroGate.tsx` — the overlay component

**Files:**
- Create: `components/intro/IntroGate.tsx`

**Interfaces:**
- Consumes: `hasSeenIntro`, `markIntroSeen` from `@/lib/intro/introGate` (Task 3). Video/poster URLs `/intro/hero-loop.mp4`, `/intro/hero-loop-poster.jpg` (Task 1).
- Produces: `IntroGate` component (default export not used — named export), consumed by `app/layout.tsx` in Task 5.

- [ ] **Step 1: Write the component**

```tsx
// components/intro/IntroGate.tsx
"use client";

import { useCallback, useLayoutEffect, useState } from "react";
import { hasSeenIntro, markIntroSeen } from "@/lib/intro/introGate";

type Phase = "checking" | "playing" | "dismissed";

export function IntroGate() {
  const [phase, setPhase] = useState<Phase>("checking");

  // Resolve before paint so returning visitors never see a flash of the intro.
  useLayoutEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setPhase(
      reducedMotion || hasSeenIntro(window.localStorage)
        ? "dismissed"
        : "playing",
    );
  }, []);

  // Lock the page underneath while the overlay is up; restore on dismiss/unmount.
  useLayoutEffect(() => {
    if (phase !== "playing") return;

    const main = document.querySelector("main");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    main?.setAttribute("inert", "");

    return () => {
      document.body.style.overflow = previousOverflow;
      main?.removeAttribute("inert");
    };
  }, [phase]);

  const dismiss = useCallback(() => {
    markIntroSeen(window.localStorage);
    setPhase("dismissed");
  }, []);

  if (phase !== "playing") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dusk-bg">
      <video
        className="h-full w-full object-cover"
        src="/intro/hero-loop.mp4"
        poster="/intro/hero-loop-poster.jpg"
        autoPlay
        muted
        playsInline
        onEnded={dismiss}
      />
      <button
        type="button"
        onClick={dismiss}
        autoFocus
        className="absolute bottom-8 right-8 rounded-full border border-dusk-line px-5 py-2 font-mono text-mono-size uppercase tracking-[0.08em] text-dusk-ink-secondary transition-colors hover:text-dusk-ink"
      >
        Skip
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 3: Lint**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/intro/IntroGate.tsx
git commit -m "feat: add IntroGate overlay component"
```

---

### Task 5: Mount `IntroGate` in the root layout

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `IntroGate` from `@/components/intro/IntroGate` (Task 4).

- [ ] **Step 1: Edit the layout**

```tsx
// app/layout.tsx
import type { Metadata } from "next";
import { cabinet, mono } from "./fonts";
import { ScrollProvider } from "@/components/providers/ScrollProvider";
import { IntroGate } from "@/components/intro/IntroGate";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alex Pena — AI Solutions Specialist",
  description:
    "I build AI systems, automations, and the context that makes them work.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${cabinet.variable} ${mono.variable}`}>
      <body>
        <ScrollProvider>
          <IntroGate />
          {children}
        </ScrollProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Typecheck and lint**

```bash
npm run typecheck
npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: mount IntroGate in the root layout"
```

---

### Task 6: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

```bash
npm test
```

Expected: all tests pass, including the 3 new `introGate` tests (36 total, up from 33).

- [ ] **Step 2: Production build**

```bash
npm run build
```

Expected: builds clean, no errors. (Turbopack's dev server panics on this machine per `docs/PROJECT_STATE.md` — `build` uses the production compiler path and is unaffected.)

- [ ] **Step 3: Serve the production build locally**

```bash
npm start
```

- [ ] **Step 4: Manual browser check (Alex — this step needs a real browser, no automated tool covers it)**

1. Open the local URL in a private/incognito window (clean localStorage).
2. Confirm the video overlay plays automatically, muted, full-viewport.
3. Confirm the "Skip" button is visible and focused; click it — overlay dismisses, journey underneath is scrollable.
4. Reload the page — overlay should NOT replay (localStorage flag set).
5. Open a fresh private window, this time with the OS/browser "reduce motion" setting turned on — overlay should be skipped entirely, journey loads directly.
6. Check the browser tab — new favicon (AP monogram) should show.

- [ ] **Step 5: Stop the local server**

Stop the `npm start` process (Ctrl+C).

---

### Task 7: Update project state doc and finalize

**Files:**
- Modify: `docs/PROJECT_STATE.md`

- [ ] **Step 1: Add a section documenting this feature**

Insert after the "What's left to ship (Milestone 6)" section:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/PROJECT_STATE.md
git commit -m "docs: record the intro gate feature in project state"
```

---

### Task 8: Deploy to Vercel production

**Files:** none

- [ ] **Step 1: Push commits to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Deploy to production**

```bash
vercel --prod
```

- [ ] **Step 3: Verify the live deployment**

```bash
vercel ls
```

Confirm the newest deployment shows `Ready` / `Production`. Then check:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://alexpena-dev.vercel.app/
```

Expected: `200`.

- [ ] **Step 4: Manual confirmation (Alex)**

Open `https://alexpena-dev.vercel.app/` in a private window and confirm the intro plays, matching the Task 6 manual check, on the real live URL.
