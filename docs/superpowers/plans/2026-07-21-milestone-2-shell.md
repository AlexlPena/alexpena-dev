# Milestone 2 — The Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the placeholder journey into a publishable site: real content for all six acts (finished DOM sections for Acts I, II, VI; caption-level DOM for the descent), the three Milestone-1 review corrections, and a complete mobile + reduced-motion story.

**Architecture:** Content lives in typed modules under `lib/content/`. Layout positions each content block absolutely inside one 800vh journey so every block's rest position lands exactly on a dusk plateau, computed by a tested pure helper (`journeyLayout`) — the M1 review's corrected progress formula. The store now owns reduced-motion ("effective dusk"), so the provider (and M3's canvas) consume one authoritative value.

**Tech Stack:** unchanged from M1 (Next.js 16, TypeScript, Tailwind v4, GSAP/Lenis already wired, Vitest).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-21-cinematic-portfolio-design.md` — canonical; flag conflicts, don't resolve silently.
- Copper is the ONLY chromatic color; rare. Dark pole `#12100e`, light pole `#f7f5f1` — unchanged, do not touch `LIGHT`/`DARK`.
- Body text ≥16px. WCAG AA ≥4.5:1 wherever content rests (enforced by tests at rest points AND act midpoints after this milestone).
- All copy in typed modules under `lib/content/` — no prose hardcoded in components.
- First-person voice ("I"), confident, concrete, zero buzzwords. Never "revolutionize/unlock/cutting-edge".
- `prefers-reduced-motion`: full content parity, theme snaps per-act, no ambient animation (the signal dot's pulse must be disabled under reduced motion).
- The corrected progress formula is canonical: `progress = scrollY / (docHeight − viewportHeight)`; a block of height 100vh whose top sits at `p × (JOURNEY_VH − 100)`vh is exactly centered when progress = p.
- Semantic document order: one `h1` (the name), `h2` per act/stratum; canvas-free — nothing in this milestone renders WebGL.
- Windows dev machine; commands are Git Bash.
- Every commit: `git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit ...` ending with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Store owns effective dusk + hardening (TDD)

**Files:**
- Modify: `lib/scroll/store.ts`
- Modify: `lib/scroll/store.test.ts`

**Interfaces:**
- Consumes: `duskCurve` (`lib/scroll/duskCurve.ts`), `actAt`, `actMidpoint`, `Act` (`lib/scroll/acts.ts`).
- Produces: `ScrollState` gains `readonly effectiveDusk: number`; `ScrollStore` gains `setReducedMotion(v: boolean): void`. `effectiveDusk === dusk` normally; under reduced motion it is `duskCurve(actMidpoint(act))`. `setProgress` ignores non-finite input. A throwing subscriber cannot starve other subscribers. Tasks 3+ consume `effectiveDusk` verbatim.

- [ ] **Step 1: Add failing tests to `lib/scroll/store.test.ts`**

Append these tests (keep all existing tests unchanged):

```ts
describe("effective dusk / reduced motion", () => {
  test("effectiveDusk equals dusk when motion is allowed", () => {
    const store = createScrollStore();
    store.setProgress(0.5);
    const s = store.getState();
    expect(s.effectiveDusk).toBe(s.dusk);
  });

  test("reduced motion snaps effectiveDusk to the act-midpoint value", () => {
    const store = createScrollStore();
    store.setReducedMotion(true);
    store.setProgress(0.5); // act 3, midpoint 0.45
    const s = store.getState();
    expect(s.act).toBe(3);
    expect(s.effectiveDusk).toBe(duskCurve(actMidpoint(3)));
    expect(s.effectiveDusk).not.toBe(s.dusk);
  });

  test("toggling reduced motion re-derives and notifies", () => {
    const store = createScrollStore();
    store.setProgress(0.5);
    const fn = vi.fn();
    store.subscribe(fn);
    store.setReducedMotion(true);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0][0].effectiveDusk).toBe(duskCurve(actMidpoint(3)));
  });

  test("setting the same reduced-motion value does not notify", () => {
    const store = createScrollStore();
    const fn = vi.fn();
    store.subscribe(fn);
    store.setReducedMotion(false);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("hardening", () => {
  test("non-finite progress is ignored", () => {
    const store = createScrollStore();
    store.setProgress(0.5);
    store.setProgress(NaN);
    store.setProgress(Infinity);
    expect(store.getState().progress).toBe(0.5);
  });

  test("a throwing subscriber does not starve later subscribers", () => {
    const store = createScrollStore();
    const bad = vi.fn(() => {
      throw new Error("boom");
    });
    const good = vi.fn();
    store.subscribe(bad);
    store.subscribe(good);
    store.setProgress(0.5);
    expect(good).toHaveBeenCalledTimes(1);
  });
});
```

Add to the file's imports: `import { duskCurve } from "./duskCurve";` and `import { actMidpoint } from "./acts";`.

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — `setReducedMotion` not a function / `effectiveDusk` undefined.

- [ ] **Step 3: Implement in `lib/scroll/store.ts`**

Replace the file's contents with:

```ts
import { duskCurve } from "./duskCurve";
import { actAt, actMidpoint, type Act } from "./acts";

export type ScrollState = {
  readonly progress: number;
  readonly dusk: number;
  // The value consumers should render: equals dusk normally; snaps to the
  // act-midpoint plateau under reduced motion. Owned here so every
  // subscriber (DOM provider, future canvas) agrees without duplicating
  // the substitution.
  readonly effectiveDusk: number;
  readonly act: Act;
};

export type ScrollStore = {
  getState: () => ScrollState;
  setProgress: (p: number) => void;
  setReducedMotion: (v: boolean) => void;
  subscribe: (fn: (s: ScrollState) => void) => () => void;
};

function derive(progress: number, reduced: boolean): ScrollState {
  const dusk = duskCurve(progress);
  const act = actAt(progress);
  return {
    progress,
    dusk,
    act,
    effectiveDusk: reduced ? duskCurve(actMidpoint(act)) : dusk,
  };
}

export function createScrollStore(): ScrollStore {
  let reduced = false;
  let state: ScrollState = derive(0, reduced);
  const subs = new Set<(s: ScrollState) => void>();

  const notify = () => {
    subs.forEach((fn) => {
      try {
        fn(state);
      } catch (err) {
        // One broken subscriber must not starve the rest of the frame.
        console.error("scroll store subscriber threw", err);
      }
    });
  };

  return {
    getState: () => state,
    setProgress: (p: number) => {
      if (!Number.isFinite(p) || p === state.progress) return;
      state = derive(p, reduced);
      notify();
    },
    setReducedMotion: (v: boolean) => {
      if (v === reduced) return;
      reduced = v;
      state = derive(state.progress, reduced);
      notify();
    },
    subscribe: (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

// Singleton used by the app; tests build their own instances.
export const scrollStore = createScrollStore();
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS (all suites; the pre-existing "initial state" test still passes because `derive(0, false)` yields `{ progress: 0, dusk: 0, effectiveDusk: 0, act: 1 }` — update that test's expected object to include `effectiveDusk: 0`).

- [ ] **Step 5: Commit**

```bash
git add lib/scroll/store.ts lib/scroll/store.test.ts
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: store-owned effective dusk, finite guard, subscriber isolation

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Journey layout helper + invariant tests (TDD)

**Files:**
- Create: `lib/scroll/journeyLayout.ts`, `lib/scroll/journeyLayout.test.ts`
- Modify: `lib/theme/palette.test.ts` (act-midpoint contrast test)
- Modify: `lib/scroll/duskCurve.test.ts` (danger-band regression test)

**Interfaces:**
- Consumes: `duskCurve`, `DUSK_ANCHORS`, `actMidpoint`, `duskToTokens`, `contrastRatio`.
- Produces:
  - `JOURNEY_VH = 800`, `VIEWPORT_VH = 100`
  - `topVhForRest(p: number): number` — top offset (vh) of a 100vh block centered in the viewport when scroll progress = p; formula `p * (JOURNEY_VH - VIEWPORT_VH)`
  - `REST_POINTS` — named rest progress per content block: `{ actI: 0, actII: 0.16, stratum1: 0.26, stratum2: 0.4, stratum3: 0.54, stratum4: 0.7, outcomes: 0.78, actVI: 1 }`
  - Tasks 6–9 import these verbatim.

- [ ] **Step 1: Write failing tests — `lib/scroll/journeyLayout.test.ts`**

```ts
import { describe, expect, test } from "vitest";
import {
  JOURNEY_VH,
  VIEWPORT_VH,
  topVhForRest,
  REST_POINTS,
} from "./journeyLayout";
import { duskCurve } from "./duskCurve";
import { duskToTokens, CONTENT_PLATEAUS } from "../theme/palette";
import { contrastRatio } from "../theme/contrast";

describe("journeyLayout", () => {
  test("journey dimensions", () => {
    expect(JOURNEY_VH).toBe(800);
    expect(VIEWPORT_VH).toBe(100);
  });

  test("topVhForRest centers a 100vh block at the given progress", () => {
    // scrollY at progress p = p * (800 - 100)vh; block top must equal that
    // scrollY so the block fills the viewport exactly at rest.
    expect(topVhForRest(0)).toBe(0);
    expect(topVhForRest(0.5)).toBe(350);
    expect(topVhForRest(1)).toBe(700);
  });

  test("every rest point lands on a dusk plateau", () => {
    for (const p of Object.values(REST_POINTS)) {
      expect(
        CONTENT_PLATEAUS,
        `duskCurve(${p}) must be a content plateau`
      ).toContain(duskCurve(p));
    }
  });

  test("ink meets AA on background at every rest point", () => {
    for (const [name, p] of Object.entries(REST_POINTS)) {
      const t = duskToTokens(duskCurve(p));
      expect(
        contrastRatio(t.ink, t.bg),
        `ink on bg at rest ${name}`
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(t.inkSecondary, t.bg),
        `inkSecondary on bg at rest ${name}`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});
```

- [ ] **Step 2: Add the act-midpoint contrast test to `lib/theme/palette.test.ts`**

Append inside the `duskToTokens` describe block (add imports: `duskCurve` from `../scroll/duskCurve`, `actMidpoint` from `../scroll/acts` — nothing else; unused imports fail lint):

```ts
  test("reduced-motion act-midpoint values keep AA contrast for every act", () => {
    for (const act of [1, 2, 3, 4, 5, 6] as const) {
      const d = duskCurve(actMidpoint(act));
      const t = duskToTokens(d);
      expect(
        contrastRatio(t.ink, t.bg),
        `ink on bg at act ${act} midpoint (dusk=${d})`
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(t.inkSecondary, t.bg),
        `inkSecondary on bg at act ${act} midpoint (dusk=${d})`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
```

- [ ] **Step 3: Add the danger-band regression test to `lib/scroll/duskCurve.test.ts`**

Append inside the `duskCurve` describe block:

```ts
  test("no flat (content-bearing) segment sits in the ink-crossover band [0.3, 0.4]", () => {
    for (let i = 1; i < DUSK_ANCHORS.length; i++) {
      const [, y0] = DUSK_ANCHORS[i - 1];
      const [, y1] = DUSK_ANCHORS[i];
      if (y0 === y1) {
        expect(
          y0 < 0.3 || y0 > 0.4,
          `flat segment at dusk=${y0} is inside the ink crossover band`
        ).toBe(true);
      }
    }
  });
```

- [ ] **Step 4: Run to verify failure**

Run: `npm test`
Expected: FAIL — `./journeyLayout` not found. (The two appended tests in existing files should PASS immediately — they encode invariants that already hold; if either fails, STOP and report, do not tune values.)

- [ ] **Step 5: Implement `lib/scroll/journeyLayout.ts`**

```ts
// Maps content rest positions onto the journey document.
//
// ScrollTrigger progress p = scrollY / (docHeight - viewportHeight).
// A block of height VIEWPORT_VH whose top is at p * (JOURNEY_VH - VIEWPORT_VH)
// exactly fills the viewport when the visitor rests at progress p.
// (M1's placeholder used center/JOURNEY_VH, which rested ~half a viewport
// early on every plateau — this helper is the corrected, tested formula.)
export const JOURNEY_VH = 800;
export const VIEWPORT_VH = 100;

export function topVhForRest(p: number): number {
  return p * (JOURNEY_VH - VIEWPORT_VH);
}

// Rest progress for each content block. Each value must land on a flat
// plateau of duskCurve — enforced by journeyLayout.test.ts.
export const REST_POINTS = {
  actI: 0,
  actII: 0.16,
  stratum1: 0.26,
  stratum2: 0.4,
  stratum3: 0.54,
  stratum4: 0.7,
  outcomes: 0.78,
  actVI: 1,
} as const;
```

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: PASS, all files.

- [ ] **Step 7: Commit**

```bash
git add lib/scroll/journeyLayout.ts lib/scroll/journeyLayout.test.ts lib/theme/palette.test.ts lib/scroll/duskCurve.test.ts
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: journey layout helper with plateau/contrast invariant tests

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Provider consumes effectiveDusk + typography utilities

**Files:**
- Modify: `components/providers/ScrollProvider.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `scrollStore` with `effectiveDusk`/`setReducedMotion` (Task 1).
- Produces: Tailwind text utilities `text-hero`, `text-display`, `text-title`, `text-body`, `text-small`, `text-mono-size` (type scale moves into `@theme`); provider no longer duplicates reduced-motion logic. Tasks 5–8 use these text utilities verbatim.

- [ ] **Step 1: Move the type scale into `@theme` in `app/globals.css`**

Delete the `--text-*` lines from the `:root` block and add a static `@theme` block after the existing `@theme inline` block (Tailwind emits `@theme` values as CSS variables too, so `body { font-size: var(--text-body) }` keeps working):

```css
@theme {
  --text-hero: clamp(3.25rem, 7vw, 6.5rem);
  --text-display: clamp(2.25rem, 4.5vw, 4rem);
  --text-title: clamp(1.5rem, 2.5vw, 2rem);
  --text-body: 1.0625rem;
  --text-small: 0.875rem;
  --text-mono-size: 0.8125rem;
}
```

Everything else in the file stays.

- [ ] **Step 2: Refactor `components/providers/ScrollProvider.tsx`**

Replace the file's contents with:

```tsx
"use client";

import { useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { scrollStore } from "@/lib/scroll/store";
import { duskToTokens } from "@/lib/theme/palette";
import { applyTokens } from "@/lib/theme/applyTokens";

export function ScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    scrollStore.setReducedMotion(media.matches);
    const onMediaChange = (e: MediaQueryListEvent) =>
      scrollStore.setReducedMotion(e.matches);
    media.addEventListener("change", onMediaChange);

    gsap.registerPlugin(ScrollTrigger);

    // Smooth scroll only when motion is welcome; native scroll otherwise.
    const lenis = media.matches ? null : new Lenis({ lerp: 0.08 });
    const tick = (time: number) => lenis?.raf(time * 1000);
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const trigger = ScrollTrigger.create({
      start: 0,
      end: () => document.documentElement.scrollHeight - window.innerHeight,
      onUpdate: (self) => scrollStore.setProgress(self.progress),
    });

    const root = document.documentElement;
    let lastDusk = Number.NaN;
    let lastAct = 0;
    const render = (s: ReturnType<typeof scrollStore.getState>) => {
      if (s.effectiveDusk !== lastDusk) {
        lastDusk = s.effectiveDusk;
        applyTokens(root, duskToTokens(s.effectiveDusk));
      }
      if (s.act !== lastAct) {
        lastAct = s.act;
        root.dataset.act = String(s.act);
      }
    };
    const unsubscribe = scrollStore.subscribe(render);

    // Apply initial state unconditionally — setProgress dedupes identical
    // values, so a fresh top-of-page load would otherwise never sync the DOM.
    render(scrollStore.getState());
    scrollStore.setProgress(window.scrollY === 0 ? 0 : trigger.progress);

    return () => {
      media.removeEventListener("change", onMediaChange);
      unsubscribe();
      trigger.kill();
      if (lenis) {
        gsap.ticker.remove(tick);
        lenis.destroy();
      }
    };
  }, []);

  return <>{children}</>;
}
```

Note: `duskCurve`/`actMidpoint` imports disappear — the store owns that now.

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm test && npm run build`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add components/providers/ScrollProvider.tsx app/globals.css
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "refactor: provider renders store-owned effective dusk; type scale as Tailwind utilities

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Content modules

**Files:**
- Create: `lib/content/types.ts`, `lib/content/identity.ts`, `lib/content/strata.ts`, `lib/content/outcomes.ts`, `lib/content/tools.ts`, `lib/content/contact.ts`

**Interfaces:**
- Produces: typed, readonly content consumed by Tasks 5–8. Exact export names: `IDENTITY`, `STRATA`, `OUTCOMES`, `TOOLS`, `CONTACT`. No component may hardcode prose.

- [ ] **Step 1: Create `lib/content/types.ts`**

```ts
export type Stratum = {
  readonly id: string;
  readonly depth: string; // "01".."04"
  readonly era: string; // discipline name
  readonly year: string;
  readonly title: string;
  readonly body: string;
};

export type Outcome = {
  readonly id: string;
  readonly title: string;
  readonly problem: string;
  readonly result: string;
  // Optional enrichment for future case studies — absent for now.
  readonly stack?: readonly string[];
  readonly metric?: string;
  readonly link?: string;
};

export type ContactLink = {
  readonly label: string;
  readonly href: string;
};
```

- [ ] **Step 2: Create `lib/content/identity.ts`**

```ts
export const IDENTITY = {
  name: "Alex Pena",
  role: "AI Solutions Specialist",
  tagline:
    "I build AI systems and the automation around them — real workflows, real tools, running in production.",
  scrollHint: "Follow the signal",
  request: {
    heading: "The request",
    paragraphs: [
      "Every team I meet has the same shape of problem: scattered tools, manual handoffs, knowledge that lives in one person's head, and a dozen disconnected AI experiments.",
      "The fix is rarely another tool. It's architecture — context, rules, automation, and adoption designed around how the team actually works.",
      "This is what that looks like. A request enters the system.",
    ],
  },
} as const;
```

- [ ] **Step 3: Create `lib/content/strata.ts`**

```ts
import type { Stratum } from "./types";

export const STRATA: readonly Stratum[] = [
  {
    id: "prompt-engineering",
    depth: "01",
    era: "Prompt Engineering",
    year: "2023",
    title: "Shaping the request",
    body: "Where it started: turning raw intent into instructions a model can execute. Precision in, precision out — the craft of saying exactly what you mean.",
  },
  {
    id: "context-engineering",
    depth: "02",
    era: "Context Engineering",
    year: "2024",
    title: "Gathering mass",
    body: "A prompt is only as good as what surrounds it. Knowledge bases, retrieval, structure — the signal gathers the context it needs to act on real business truth.",
  },
  {
    id: "harness-engineering",
    depth: "03",
    era: "Harness Engineering",
    year: "2025",
    title: "Entering the machinery",
    body: "Models don't ship value; systems do. Tools, guardrails, MCP servers, evaluation loops — the machinery that turns a capable model into dependable software.",
  },
  {
    id: "loop-engineering",
    depth: "04",
    era: "Loop Engineering",
    year: "2026",
    title: "Self-driving",
    body: "The system no longer waits for instructions. Agents plan, execute, verify, and correct — running while nobody watches. The work now is designing the loops, and knowing when a human belongs inside one.",
  },
] as const;
```

- [ ] **Step 4: Create `lib/content/outcomes.ts`**

```ts
import type { Outcome } from "./types";

// Loosely described real work — enriched into full case studies later
// (spec Section 8). Optional fields stay absent until then.
export const OUTCOMES: readonly Outcome[] = [
  {
    id: "intake-automation",
    title: "Intake automation",
    problem: "Requests arrived from every direction with no routing and no context.",
    result:
      "Unified intake with automatic routing and context capture — hours returned to the team every week.",
  },
  {
    id: "mcp-bridges",
    title: "Custom MCP servers",
    problem: "Internal tools and data were unreachable from AI workflows.",
    result:
      "Model Context Protocol bridges that let assistants act on real systems, safely.",
  },
  {
    id: "adoption",
    title: "AI adoption that sticks",
    problem: "Teams had licenses, not leverage.",
    result:
      "Standards, working sessions, and starter workflows that made AI part of daily execution.",
  },
] as const;
```

- [ ] **Step 5: Create `lib/content/tools.ts` and `lib/content/contact.ts`**

```ts
export const TOOLS: readonly string[] = [
  "Claude Code",
  "Codex",
  "MCP",
  "n8n",
  "Supabase",
  "Pinecone",
  "Next.js",
  "TypeScript",
  "React",
  "Tailwind",
  "Slack",
  "Notion",
] as const;
```

```ts
import type { ContactLink } from "./types";

export const CONTACT = {
  heading: "Back at the surface",
  note: "I've been building with AI since 2023 — from first prompts to autonomous loops. I work where engineering meets adoption: building the system, then making sure the team actually uses it.",
  links: [
    { label: "alex@alexpena.dev", href: "mailto:alex@alexpena.dev" },
    // TODO(alex): add GitHub + LinkedIn URLs before ship (M6 gate) — do not
    // invent them. Rendering code must handle this list growing.
  ] as readonly ContactLink[],
} as const;
```

- [ ] **Step 6: Verify + commit**

Run: `npm run typecheck`
Expected: pass.

```bash
git add lib/content
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: typed content modules for all six acts

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: UI primitives — Readout + SignalDot

**Files:**
- Create: `components/ui/Readout.tsx`, `components/ui/SignalDot.tsx`
- Modify: `app/globals.css` (pulse keyframes)

**Interfaces:**
- Consumes: Tailwind dusk + text utilities.
- Produces: `<Readout>` — uppercase JetBrains Mono instrument-label line; `<SignalDot>` — the pulsing copper dot (pulse disabled under reduced motion). Tasks 6–8 import these verbatim.

- [ ] **Step 1: Create `components/ui/Readout.tsx`**

```tsx
type ReadoutProps = {
  children: React.ReactNode;
  className?: string;
};

// Instrument-style mono label: "DEPTH 02 · CONTEXT ENGINEERING · 2024"
export function Readout({ children, className = "" }: ReadoutProps) {
  return (
    <p
      className={`font-mono text-mono-size uppercase tracking-[0.08em] text-dusk-copper ${className}`}
    >
      {children}
    </p>
  );
}
```

- [ ] **Step 2: Create `components/ui/SignalDot.tsx`**

```tsx
type SignalDotProps = {
  className?: string;
};

// The signal: a small copper dot with a soft pulse. Decorative — hidden
// from assistive tech. Pulse is suppressed under prefers-reduced-motion
// via the motion-safe variant.
export function SignalDot({ className = "" }: SignalDotProps) {
  return (
    <span aria-hidden className={`relative inline-flex h-3 w-3 ${className}`}>
      <span className="absolute inline-flex h-full w-full rounded-full bg-dusk-copper opacity-60 motion-safe:animate-signal-pulse" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-dusk-copper" />
    </span>
  );
}
```

- [ ] **Step 3: Add the pulse keyframes to `app/globals.css`**

Append to the static `@theme` block from Task 3 (Tailwind v4 registers `animate-signal-pulse` from a theme animation token):

```css
  --animate-signal-pulse: signal-pulse 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite;
```

And append at file end:

```css
@keyframes signal-pulse {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  70% {
    transform: scale(2.4);
    opacity: 0;
  }
  100% {
    transform: scale(2.4);
    opacity: 0;
  }
}
```

- [ ] **Step 4: Verify + commit**

Run: `npm run typecheck && npm run build`
Expected: pass.

```bash
git add components/ui app/globals.css
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: Readout and SignalDot primitives

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Acts I & II — Surface and The Request

**Files:**
- Create: `components/sections/Surface.tsx`, `components/sections/Request.tsx`

**Interfaces:**
- Consumes: `IDENTITY` (Task 4), `Readout`, `SignalDot` (Task 5), `topVhForRest`, `REST_POINTS` (Task 2).
- Produces: two absolutely-positioned 100vh sections used by Task 9's page. Each section positions itself: `style={{ top: `${topVhForRest(REST_POINTS.x)}vh` }}`.

- [ ] **Step 1: Create `components/sections/Surface.tsx`**

```tsx
import { IDENTITY } from "@/lib/content/identity";
import { Readout } from "@/components/ui/Readout";
import { SignalDot } from "@/components/ui/SignalDot";
import { topVhForRest, REST_POINTS } from "@/lib/scroll/journeyLayout";

// Act I (rest p=0): name, role, tagline, the signal at rest.
export function Surface() {
  return (
    <section
      aria-label="Introduction"
      className="absolute inset-x-0 flex h-screen items-center"
      style={{ top: `${topVhForRest(REST_POINTS.actI)}vh` }}
    >
      <div className="mx-auto w-full max-w-3xl px-6">
        <div className="flex items-center gap-3">
          <Readout>{IDENTITY.role}</Readout>
          <SignalDot />
        </div>
        <h1 className="mt-4 text-hero leading-none tracking-tight text-dusk-ink">
          {IDENTITY.name}
        </h1>
        <p className="mt-6 max-w-xl text-body leading-relaxed text-dusk-ink-secondary">
          {IDENTITY.tagline}
        </p>
        <p className="mt-16 font-mono text-mono-size uppercase tracking-[0.08em] text-dusk-ink-secondary">
          {IDENTITY.scrollHint} ↓
        </p>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `components/sections/Request.tsx`**

```tsx
import { IDENTITY } from "@/lib/content/identity";
import { Readout } from "@/components/ui/Readout";
import { topVhForRest, REST_POINTS } from "@/lib/scroll/journeyLayout";

// Act II (rest p=0.16): the editorial beat before the descent.
export function Request() {
  return (
    <section
      aria-label="The request"
      className="absolute inset-x-0 flex h-screen items-center"
      style={{ top: `${topVhForRest(REST_POINTS.actII)}vh` }}
    >
      <div className="mx-auto w-full max-w-2xl px-6">
        <Readout>Act II · {IDENTITY.request.heading}</Readout>
        <div className="mt-6 space-y-5">
          {IDENTITY.request.paragraphs.map((text) => (
            <p
              key={text.slice(0, 24)}
              className="text-body leading-relaxed text-dusk-ink"
            >
              {text}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify + commit**

Run: `npm run typecheck && npm run build`
Expected: pass (components are not yet rendered — that's Task 9).

```bash
git add components/sections
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: Surface and Request sections (Acts I-II)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: The Descent — strata captions + outcome cards

**Files:**
- Create: `components/sections/Descent.tsx`, `components/sections/Outcomes.tsx`

**Interfaces:**
- Consumes: `STRATA`, `OUTCOMES` (Task 4), `Readout` (Task 5), `topVhForRest`, `REST_POINTS` (Task 2).
- Produces: `<Descent>` renders four stratum caption blocks at `REST_POINTS.stratum1..4`; `<Outcomes>` renders the completed-runs cards at `REST_POINTS.outcomes`. Used by Task 9.

- [ ] **Step 1: Create `components/sections/Descent.tsx`**

```tsx
import { STRATA } from "@/lib/content/strata";
import { Readout } from "@/components/ui/Readout";
import { topVhForRest, REST_POINTS } from "@/lib/scroll/journeyLayout";

const STRATUM_REST = [
  REST_POINTS.stratum1,
  REST_POINTS.stratum2,
  REST_POINTS.stratum3,
  REST_POINTS.stratum4,
] as const;

// Act III (rest p=0.26/0.40/0.54/0.70): four caption blocks. The 3D world
// arrives behind these in Milestone 3 — the DOM captions ARE the mobile
// and reduced-motion story, so they carry the full narrative on their own.
export function Descent() {
  return (
    <>
      {STRATA.map((stratum, i) => (
        <section
          key={stratum.id}
          id={stratum.id}
          aria-label={`${stratum.era}, ${stratum.year}`}
          className="absolute inset-x-0 flex h-screen items-center"
          style={{ top: `${topVhForRest(STRATUM_REST[i])}vh` }}
        >
          <div className="mx-auto w-full max-w-2xl px-6">
            <Readout>
              Depth {stratum.depth} · {stratum.era} · {stratum.year}
            </Readout>
            <h2 className="mt-4 text-display leading-tight text-dusk-ink">
              {stratum.title}
            </h2>
            <p className="mt-5 max-w-xl text-body leading-relaxed text-dusk-ink-secondary">
              {stratum.body}
            </p>
          </div>
        </section>
      ))}
    </>
  );
}
```

- [ ] **Step 2: Create `components/sections/Outcomes.tsx`**

```tsx
import { OUTCOMES } from "@/lib/content/outcomes";
import { Readout } from "@/components/ui/Readout";
import { topVhForRest, REST_POINTS } from "@/lib/scroll/journeyLayout";

// Act IV (rest p=0.78): the signal resolves into completed runs.
export function Outcomes() {
  return (
    <section
      aria-label="Completed runs"
      className="absolute inset-x-0 flex h-screen items-center"
      style={{ top: `${topVhForRest(REST_POINTS.outcomes)}vh` }}
    >
      <div className="mx-auto w-full max-w-3xl px-6">
        <Readout>Act IV · Completed runs</Readout>
        <div className="mt-8 space-y-6">
          {OUTCOMES.map((o) => (
            <article
              key={o.id}
              className="border-l border-dusk-line pl-5"
            >
              <h2 className="text-title leading-snug text-dusk-ink">
                {o.title}
              </h2>
              <p className="mt-2 text-small leading-relaxed text-dusk-ink-secondary">
                {o.problem}
              </p>
              <p className="mt-1 text-small leading-relaxed text-dusk-ink">
                {o.result}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Verify + commit**

Run: `npm run typecheck && npm run build`
Expected: pass.

```bash
git add components/sections
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: Descent strata captions and Outcomes cards (Acts III-IV)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Act VI — Daylight

**Files:**
- Create: `components/sections/Daylight.tsx`

**Interfaces:**
- Consumes: `CONTACT`, `TOOLS` (Task 4), `Readout` (Task 5), `topVhForRest`, `REST_POINTS` (Task 2).
- Produces: `<Daylight>` — about note, tools strip, contact links. Used by Task 9.

- [ ] **Step 1: Create `components/sections/Daylight.tsx`**

```tsx
import { CONTACT } from "@/lib/content/contact";
import { TOOLS } from "@/lib/content/tools";
import { Readout } from "@/components/ui/Readout";
import { SignalDot } from "@/components/ui/SignalDot";
import { topVhForRest, REST_POINTS } from "@/lib/scroll/journeyLayout";

// Act VI (rest p=1): calm close, mirror of Act I.
export function Daylight() {
  return (
    <section
      aria-label="About and contact"
      className="absolute inset-x-0 flex h-screen items-center"
      style={{ top: `${topVhForRest(REST_POINTS.actVI)}vh` }}
    >
      <div className="mx-auto w-full max-w-2xl px-6">
        <div className="flex items-center gap-3">
          <Readout>Act VI · {CONTACT.heading}</Readout>
          <SignalDot />
        </div>
        <p className="mt-6 text-body leading-relaxed text-dusk-ink">
          {CONTACT.note}
        </p>
        <ul className="mt-10 flex flex-wrap gap-x-4 gap-y-2" aria-label="Tools">
          {TOOLS.map((tool) => (
            <li
              key={tool}
              className="font-mono text-mono-size uppercase tracking-[0.08em] text-dusk-ink-secondary"
            >
              {tool}
            </li>
          ))}
        </ul>
        <div className="mt-12 flex flex-wrap gap-6">
          {CONTACT.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-body text-dusk-ink underline decoration-dusk-copper underline-offset-4 hover:text-dusk-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dusk-copper"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify + commit**

Run: `npm run typecheck && npm run build`
Expected: pass.

```bash
git add components/sections
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: Daylight section (Act VI)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Page assembly, scaffold sweep, verification

**Files:**
- Modify: `app/page.tsx`
- Delete: `components/dev/ActMarker.tsx` (and the now-empty `components/dev/`)
- Modify: `README.md`
- Delete: `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`

**Interfaces:**
- Consumes: all sections (Tasks 6–8), `JOURNEY_VH` (Task 2).

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
import { Surface } from "@/components/sections/Surface";
import { Request } from "@/components/sections/Request";
import { Descent } from "@/components/sections/Descent";
import { Outcomes } from "@/components/sections/Outcomes";
import { Daylight } from "@/components/sections/Daylight";
import { JOURNEY_VH } from "@/lib/scroll/journeyLayout";

// One journey, six acts. Sections are absolutely positioned inside the
// journey so every content block rests exactly on a dusk plateau
// (see lib/scroll/journeyLayout.ts). Acts V (the ascent) is deliberately
// empty — it is a fast crossing, not a place.
export default function Home() {
  return (
    <main className="relative" style={{ height: `${JOURNEY_VH}vh` }}>
      <Surface />
      <Request />
      <Descent />
      <Outcomes />
      <Daylight />
    </main>
  );
}
```

- [ ] **Step 2: Delete dev component + scaffold assets, rewrite README**

```bash
rm -r components/dev
rm public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

Replace `README.md` with:

```markdown
# alexpena.dev

Personal portfolio of Alex Pena — a scroll-driven cinematic site where the
page descends from daylight into a dark system-world and resurfaces.

- Spec: `docs/superpowers/specs/2026-07-21-cinematic-portfolio-design.md`
- Stack: Next.js 16, TypeScript, Tailwind v4, GSAP ScrollTrigger + Lenis, Vitest
- Fonts: Cabinet Grotesk (self-hosted), JetBrains Mono

## Commands

- `npm run dev` — local dev server
- `npm test` — unit tests (dusk curve, palette contrast, layout invariants)
- `npm run typecheck` / `npm run lint` / `npm run build`
```

- [ ] **Step 3: Full check suite**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: all pass.

- [ ] **Step 4: Scriptable page verification**

Start `npm run dev`; `curl -s http://localhost:3000` and confirm:
- exactly one `<h1>` (Alex Pena); all stratum/act headings present in document order
- contact `mailto:` link present; no `TODO` text rendered to HTML
- no references to removed scaffold assets
Kill the server.

- [ ] **Step 5: Commit**

```bash
git add -A
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: assemble six-act journey page; remove placeholder and scaffold assets

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Milestone exit criteria

- All checks green: `typecheck`, `lint`, `test`, `build`.
- Human browser walkthrough (Alex): full scroll at 1440px and 375px — every caption readable at rest, arc pacing still good, keyboard jumps land correctly, reduced-motion mode gives full content with per-act theme snaps, signal-dot pulse absent under reduced motion.
- Alex approves or edits all copy (it ships on the public site after this milestone).
- Alex reads `app/fonts/cabinet-grotesk/LICENSE.txt` once (M1 review follow-up) — confirm self-hosted webfont use is covered.
- Site is publishable (deploy itself is Milestone 6).
