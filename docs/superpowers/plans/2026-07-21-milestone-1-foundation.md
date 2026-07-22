# Milestone 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the `alexpena-dev` Next.js project with the two-pole dusk token system, fonts, and the Lenis + ScrollTrigger master-timeline skeleton, proving the light→dark→light arc on a placeholder page with no 3D.

**Architecture:** A `ScrollOrchestrator` (Lenis + one GSAP ScrollTrigger) publishes normalized scroll progress to a tiny subscriber store. Pure modules map progress → dusk value (piecewise curve) → concrete color tokens (OKLab interpolation with per-token-group easing so text/background contrast holds at every content plateau). A provider applies tokens as CSS variables on `:root`; the DOM styles itself entirely from those variables.

**Tech Stack:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind v4 (CSS-based theming), GSAP + ScrollTrigger, Lenis, culori (color interpolation), Vitest (pure-function tests), Cabinet Grotesk (Fontshare, self-hosted), JetBrains Mono (via `next/font/google`, self-hosted at build).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-21-cinematic-portfolio-design.md` — canonical; flag conflicts, don't resolve silently.
- No light/dark toggle — dusk (scroll) owns the theme.
- Copper `#C0682B` family is the ONLY chromatic color. No second accent.
- Dark pole is `#12100E` — never pure black. Light pole background `#F7F5F1`, ink `#1A1815`.
- Body text ≥16px. WCAG AA (≥4.5:1) for ink-on-background at every content plateau of the dusk curve.
- First paint is DOM-only, light-world (SSR defaults = light pole values).
- All copy/content in typed modules under `lib/content/` (none needed this milestone).
- `prefers-reduced-motion`: no smooth scroll, theme snaps per-act (no continuous interpolation).
- Fonts self-hosted — no runtime requests to Google/Fontshare CDNs.
- Windows dev machine; commands below are Git Bash (POSIX) unless noted.
- Every commit: `git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit ...` (no global git config on this machine) and end commit messages with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Scaffold Next.js 16 app

**Files:**
- Create: entire Next.js scaffold at repo root (`app/`, `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `app/globals.css`, `.gitignore`)

**Interfaces:**
- Produces: working `npm run dev` / `build` / `lint`; `npm run typecheck` script; repo layout with `app/` at root (no `src/`), matching the paths every later task uses.

- [ ] **Step 1: Scaffold via temp dir (repo root is non-empty — `docs/`, `.git`)**

```bash
cd /c/Users/Alexp/Documents/alexpena-dev
npx create-next-app@latest scaffold-tmp --ts --tailwind --eslint --app --no-src-dir --turbopack --no-import-alias
# Move everything up, including dotfiles, then remove temp dir
shopt -s dotglob
mv scaffold-tmp/* .
rmdir scaffold-tmp
shopt -u dotglob
```

Expected: `package.json`, `app/`, `next.config.ts` now at repo root. If `create-next-app` asks interactive questions, accept defaults consistent with the flags above.

- [ ] **Step 2: Pin Turbopack root (stray `package-lock.json` exists in `C:\Users\Alexp\`, which misdetects the workspace root — known gotcha from the Centauri repo)**

Replace `next.config.ts` content with:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
```

- [ ] **Step 3: Add typecheck script**

In `package.json` `"scripts"`, add:

```json
"typecheck": "tsc --noEmit"
```

- [ ] **Step 4: Verify the toolchain**

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all three exit 0. Then `npm run dev`, load `http://localhost:3000`, confirm the default Next.js page renders. Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add -A
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "chore: scaffold Next.js 16 app (TS, Tailwind v4, App Router)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Vitest setup

**Files:**
- Create: `vitest.config.ts`, `lib/sanity.test.ts` (deleted again in Task 4)
- Modify: `package.json`

**Interfaces:**
- Produces: `npm test` runs Vitest once over `**/*.test.ts`; later tasks rely on this exact command.

- [ ] **Step 1: Install**

```bash
npm install -D vitest
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
});
```

- [ ] **Step 3: Add script + sanity test**

In `package.json` scripts: `"test": "vitest run"`.

Create `lib/sanity.test.ts`:

```ts
import { expect, test } from "vitest";

test("vitest runs", () => {
  expect(1 + 1).toBe(2);
});
```

- [ ] **Step 4: Run**

Run: `npm test`
Expected: 1 passed.

- [ ] **Step 5: Commit**

```bash
git add -A
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "chore: add Vitest for pure-module tests

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Fonts — Cabinet Grotesk + JetBrains Mono

**Files:**
- Create: `app/fonts/cabinet-grotesk/CabinetGrotesk-Variable.woff2`, `app/fonts/cabinet-grotesk/LICENSE.txt`, `app/fonts/index.ts`
- Modify: `app/layout.tsx`

**Interfaces:**
- Produces: `cabinet` and `mono` exports from `app/fonts/index.ts` exposing CSS variables `--font-cabinet` and `--font-mono`; Task 4's `globals.css` references these variable names verbatim.

- [ ] **Step 1: Download Cabinet Grotesk from Fontshare's official download API**

```bash
cd /c/Users/Alexp/Documents/alexpena-dev
curl -L "https://api.fontshare.com/v2/fonts/download/cabinet-grotesk" -o /tmp/cabinet.zip
mkdir -p app/fonts/cabinet-grotesk
cd /tmp && rm -rf cabinet && mkdir cabinet && cd cabinet && unzip -q ../cabinet.zip
find . -iname "*Variable*.woff2" -not -iname "*Italic*"
find . -iname "*license*"
```

Copy the found variable woff2 to `app/fonts/cabinet-grotesk/CabinetGrotesk-Variable.woff2` and the license file to `app/fonts/cabinet-grotesk/LICENSE.txt` (Fontshare fonts are free for commercial use; the license ships in the zip — commit it alongside, same as the Centauri repo did for Satoshi). If the zip layout differs, locate by eye — the requirement is: one variable-weight non-italic woff2 + its license, committed.

- [ ] **Step 2: Create `app/fonts/index.ts`**

```ts
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";

export const cabinet = localFont({
  src: "./cabinet-grotesk/CabinetGrotesk-Variable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-cabinet",
});

export const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});
```

Note: `next/font/google` downloads at build time and self-hosts the files — no runtime CDN request, satisfying the self-hosted constraint.

- [ ] **Step 3: Wire into `app/layout.tsx`**

Replace the scaffold's font usage so the `<html>` element carries both variables:

```tsx
import type { Metadata } from "next";
import { cabinet, mono } from "./fonts";
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
      <body>{children}</body>
    </html>
  );
}
```

Delete the scaffold's Geist font imports and any `app/fonts.ts`/font files create-next-app generated.

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: exit 0, no font resolution errors. `npm run dev`, view source: `<html>` class contains both font variable classes; Network tab shows fonts served from `/_next/`, zero requests to `fonts.googleapis.com`/`fontshare.com`.

- [ ] **Step 5: Commit**

```bash
git add -A
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: self-hosted Cabinet Grotesk + JetBrains Mono

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Palette module — two poles, eased interpolation, contrast-proven (TDD)

**Files:**
- Create: `lib/theme/palette.ts`, `lib/theme/contrast.ts`, `lib/theme/palette.test.ts`
- Delete: `lib/sanity.test.ts`

**Interfaces:**
- Produces:
  - `duskToTokens(dusk: number): ThemeTokens` where `ThemeTokens = { bg: string; surface: string; ink: string; inkSecondary: string; line: string; copper: string }` (all hex strings)
  - `CONTENT_PLATEAUS: number[]` — the dusk values at which content is displayed
  - `contrastRatio(hexA: string, hexB: string): number` (WCAG 2.x)
  - Tasks 5–8 import these names verbatim.

- [ ] **Step 1: Install culori**

```bash
npm install culori && npm install -D @types/culori
```

- [ ] **Step 2: Write the failing tests — `lib/theme/palette.test.ts`**

```ts
import { describe, expect, test } from "vitest";
import { duskToTokens, CONTENT_PLATEAUS, LIGHT, DARK } from "./palette";
import { contrastRatio } from "./contrast";

describe("duskToTokens", () => {
  test("dusk 0 returns exact light pole", () => {
    expect(duskToTokens(0)).toEqual(LIGHT);
  });

  test("dusk 1 returns exact dark pole", () => {
    expect(duskToTokens(1)).toEqual(DARK);
  });

  test("clamps out-of-range input", () => {
    expect(duskToTokens(-0.5)).toEqual(LIGHT);
    expect(duskToTokens(1.5)).toEqual(DARK);
  });

  test("every content plateau keeps ink-on-bg at WCAG AA (>=4.5:1)", () => {
    for (const d of CONTENT_PLATEAUS) {
      const t = duskToTokens(d);
      expect(
        contrastRatio(t.ink, t.bg),
        `ink on bg at dusk=${d}`
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(t.inkSecondary, t.bg),
        `inkSecondary on bg at dusk=${d}`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("contrastRatio", () => {
  test("black on white is 21", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });
  test("same color is 1", () => {
    expect(contrastRatio("#808080", "#808080")).toBeCloseTo(1, 5);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test`
Expected: FAIL — cannot resolve `./palette` / `./contrast`.

- [ ] **Step 4: Implement `lib/theme/contrast.ts`**

```ts
// WCAG 2.x relative luminance + contrast ratio, for build-time/test-time checks.
function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrastRatio(hexA: string, hexB: string): number {
  const la = luminance(hexA);
  const lb = luminance(hexB);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
```

- [ ] **Step 5: Implement `lib/theme/palette.ts`**

The core trick: background-group tokens and text-group tokens interpolate on *different eased curves* of the same dusk value. Text snaps quickly through its crossover (centered dusk ≈ 0.35, inside a transitional void where no content sits) while backgrounds ease over a wider band. Content only ever appears at `CONTENT_PLATEAUS`, where the tests prove AA contrast.

```ts
import { interpolate, formatHex } from "culori";

export type ThemeTokens = {
  bg: string;
  surface: string;
  ink: string;
  inkSecondary: string;
  line: string;
  copper: string;
};

export const LIGHT: ThemeTokens = {
  bg: "#f7f5f1",
  surface: "#ffffff",
  ink: "#1a1815",
  inkSecondary: "#6b655c",
  line: "#dfd9d0",
  copper: "#c0682b",
};

export const DARK: ThemeTokens = {
  bg: "#12100e",
  surface: "#1b1815",
  ink: "#f2efe9",
  inkSecondary: "#a8a199",
  line: "#2a2620",
  copper: "#d67f3c",
};

// Dusk values at which captions/content are visible. Must stay in sync with
// the plateaus produced by duskCurve() in lib/scroll/duskCurve.ts.
export const CONTENT_PLATEAUS = [0, 0.12, 0.55, 0.7, 0.85, 1];

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

// Per-group easing of the raw dusk value.
// Backgrounds ease over a wide band; text snaps through a narrow crossover
// centered where backgrounds are near mid-tone, so no content plateau ever
// pairs mid-tone bg with mid-tone text.
const GROUP_EASE: Record<keyof ThemeTokens, (d: number) => number> = {
  bg: (d) => smoothstep(0.1, 0.6, d),
  surface: (d) => smoothstep(0.1, 0.6, d),
  line: (d) => smoothstep(0.1, 0.6, d),
  ink: (d) => smoothstep(0.3, 0.4, d),
  inkSecondary: (d) => smoothstep(0.3, 0.4, d),
  copper: (d) => smoothstep(0.2, 0.8, d),
};

const mixers = (Object.keys(LIGHT) as (keyof ThemeTokens)[]).reduce(
  (acc, key) => {
    acc[key] = interpolate([LIGHT[key], DARK[key]], "oklab");
    return acc;
  },
  {} as Record<keyof ThemeTokens, (t: number) => unknown>
);

export function duskToTokens(dusk: number): ThemeTokens {
  const d = clamp01(dusk);
  const out = {} as ThemeTokens;
  for (const key of Object.keys(LIGHT) as (keyof ThemeTokens)[]) {
    const t = GROUP_EASE[key](d);
    out[key] =
      t === 0 ? LIGHT[key] : t === 1 ? DARK[key] : formatHex(mixers[key](t))!;
  }
  return out;
}
```

- [ ] **Step 6: Run tests**

Run: `npm test`
Expected: PASS. If a plateau contrast assertion fails, adjust that group's `smoothstep` edges (widen the text snap band away from the failing plateau, or steepen the bg band) until green — the poles themselves are fixed by the spec and must not change.

- [ ] **Step 7: Delete the sanity test, typecheck, commit**

```bash
rm lib/sanity.test.ts
npm run typecheck && npm test
git add -A
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: dusk palette with eased two-pole interpolation, AA-proven plateaus

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Dusk curve + act mapping (TDD)

**Files:**
- Create: `lib/scroll/duskCurve.ts`, `lib/scroll/acts.ts`, `lib/scroll/duskCurve.test.ts`, `lib/scroll/acts.test.ts`

**Interfaces:**
- Consumes: `CONTENT_PLATEAUS` from `lib/theme/palette.ts` (test sync check).
- Produces:
  - `duskCurve(progress: number): number` — scroll progress 0–1 → dusk 0–1
  - `ACT_BOUNDARIES: number[]` (`[0.1, 0.2, 0.7, 0.82, 0.92]`)
  - `type Act = 1 | 2 | 3 | 4 | 5 | 6`
  - `actAt(progress: number): Act`
  - `actMidpoint(act: Act): number`
  - Tasks 6–8 import these names verbatim.

- [ ] **Step 1: Write failing tests — `lib/scroll/duskCurve.test.ts`**

```ts
import { describe, expect, test } from "vitest";
import { duskCurve, DUSK_ANCHORS } from "./duskCurve";
import { CONTENT_PLATEAUS } from "../theme/palette";

describe("duskCurve", () => {
  test("Act I is fully light", () => {
    expect(duskCurve(0)).toBe(0);
    expect(duskCurve(0.05)).toBe(0);
    expect(duskCurve(0.1)).toBe(0);
  });

  test("Act II plateau is the first dim (0.12)", () => {
    expect(duskCurve(0.15)).toBeCloseTo(0.12, 5);
    expect(duskCurve(0.19)).toBeCloseTo(0.12, 5);
  });

  test("stratum plateaus hit 0.55 / 0.70 / 0.85 / 1.0", () => {
    expect(duskCurve(0.27)).toBeCloseTo(0.55, 5); // stratum 1
    expect(duskCurve(0.38)).toBeCloseTo(0.7, 5); // stratum 2
    expect(duskCurve(0.5)).toBeCloseTo(0.85, 5); // stratum 3
    expect(duskCurve(0.65)).toBeCloseTo(1, 5); // stratum 4
  });

  test("resolution (Act IV) holds full dark", () => {
    expect(duskCurve(0.75)).toBe(1);
    expect(duskCurve(0.82)).toBe(1);
  });

  test("ascent returns to light and Act VI stays light", () => {
    expect(duskCurve(0.92)).toBe(0);
    expect(duskCurve(1)).toBe(0);
  });

  test("curve is continuous (no jumps > 0.02 per 0.001 progress)", () => {
    for (let p = 0; p < 1; p += 0.001) {
      expect(Math.abs(duskCurve(p + 0.001) - duskCurve(p))).toBeLessThan(0.02);
    }
  });

  test("every plateau value exists in CONTENT_PLATEAUS (palette sync)", () => {
    const plateauValues = [0, 0.12, 0.55, 0.7, 0.85, 1];
    for (const v of plateauValues) {
      expect(CONTENT_PLATEAUS).toContain(v);
    }
    // anchors actually produce those plateaus
    const anchorValues = DUSK_ANCHORS.map(([, d]) => d);
    for (const v of plateauValues) {
      expect(anchorValues).toContain(v);
    }
  });
});
```

And `lib/scroll/acts.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { ACT_BOUNDARIES, actAt, actMidpoint } from "./acts";

describe("acts", () => {
  test("boundaries match the spec", () => {
    expect(ACT_BOUNDARIES).toEqual([0.1, 0.2, 0.7, 0.82, 0.92]);
  });

  test("actAt maps progress to acts", () => {
    expect(actAt(0)).toBe(1);
    expect(actAt(0.15)).toBe(2);
    expect(actAt(0.45)).toBe(3);
    expect(actAt(0.75)).toBe(4);
    expect(actAt(0.87)).toBe(5);
    expect(actAt(0.99)).toBe(6);
    expect(actAt(1)).toBe(6);
  });

  test("actMidpoint returns the center of each act's range", () => {
    expect(actMidpoint(1)).toBeCloseTo(0.05, 5);
    expect(actMidpoint(3)).toBeCloseTo(0.45, 5);
    expect(actMidpoint(6)).toBeCloseTo(0.96, 5);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `lib/scroll/duskCurve.ts`**

```ts
// Piecewise-linear dusk curve over normalized scroll progress.
// Plateaus are where content sits; the palette's contrast tests prove AA at
// exactly these values. Crossings between plateaus are transitional voids —
// no content is placed there (enforced by page layout, Task 8).
export const DUSK_ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.1, 0], // Act I: full light
  [0.13, 0.12],
  [0.19, 0.12], // Act II: first dim
  [0.23, 0.55],
  [0.3, 0.55], // Stratum 1: Prompt Engineering
  [0.34, 0.7],
  [0.42, 0.7], // Stratum 2: Context Engineering
  [0.46, 0.85],
  [0.54, 0.85], // Stratum 3: Harness Engineering
  [0.6, 1],
  [0.82, 1], // Stratum 4 + Act IV: full dark
  [0.92, 0], // Act V: fast ascent
  [1, 0], // Act VI: full light
];

export function duskCurve(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  for (let i = 1; i < DUSK_ANCHORS.length; i++) {
    const [x1, y1] = DUSK_ANCHORS[i];
    if (p <= x1) {
      const [x0, y0] = DUSK_ANCHORS[i - 1];
      if (x1 === x0) return y1;
      return y0 + ((p - x0) / (x1 - x0)) * (y1 - y0);
    }
  }
  return DUSK_ANCHORS[DUSK_ANCHORS.length - 1][1];
}
```

- [ ] **Step 4: Implement `lib/scroll/acts.ts`**

```ts
// Act boundaries from the spec (Section 3): I 0-10%, II 10-20%, III 20-70%,
// IV 70-82%, V 82-92%, VI 92-100%.
export const ACT_BOUNDARIES = [0.1, 0.2, 0.7, 0.82, 0.92];

export type Act = 1 | 2 | 3 | 4 | 5 | 6;

export function actAt(progress: number): Act {
  const p = Math.min(1, Math.max(0, progress));
  for (let i = 0; i < ACT_BOUNDARIES.length; i++) {
    if (p < ACT_BOUNDARIES[i]) return (i + 1) as Act;
  }
  return 6;
}

export function actMidpoint(act: Act): number {
  const edges = [0, ...ACT_BOUNDARIES, 1];
  return (edges[act - 1] + edges[act]) / 2;
}
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: PASS (all files). The continuity test also guards the ascent slope: 1→0 over 0.82–0.92 moves 0.001 × (1 / 0.1) = 0.01 per step — under the 0.02 limit.

- [ ] **Step 6: Commit**

```bash
git add -A
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: dusk curve and act mapping with plateau/contrast sync tests

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Scroll store (TDD)

**Files:**
- Create: `lib/scroll/store.ts`, `lib/scroll/store.test.ts`

**Interfaces:**
- Consumes: `duskCurve` from `lib/scroll/duskCurve.ts`, `actAt`/`Act` from `lib/scroll/acts.ts`.
- Produces:
  - `type ScrollState = { progress: number; dusk: number; act: Act }`
  - `createScrollStore(): ScrollStore` with `getState(): ScrollState`, `setProgress(p: number): void`, `subscribe(fn: (s: ScrollState) => void): () => void`
  - `scrollStore` — a module-level singleton instance
  - Task 7 imports `scrollStore` and `ScrollState` verbatim.

- [ ] **Step 1: Write failing tests — `lib/scroll/store.test.ts`**

```ts
import { describe, expect, test, vi } from "vitest";
import { createScrollStore } from "./store";

describe("scroll store", () => {
  test("initial state is the top of the page", () => {
    const store = createScrollStore();
    expect(store.getState()).toEqual({ progress: 0, dusk: 0, act: 1 });
  });

  test("setProgress derives dusk and act", () => {
    const store = createScrollStore();
    store.setProgress(0.75);
    const s = store.getState();
    expect(s.progress).toBe(0.75);
    expect(s.dusk).toBe(1);
    expect(s.act).toBe(4);
  });

  test("subscribers are notified with the new state", () => {
    const store = createScrollStore();
    const fn = vi.fn();
    store.subscribe(fn);
    store.setProgress(0.5);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn.mock.calls[0][0].act).toBe(3);
  });

  test("unsubscribe stops notifications", () => {
    const store = createScrollStore();
    const fn = vi.fn();
    const unsub = store.subscribe(fn);
    unsub();
    store.setProgress(0.5);
    expect(fn).not.toHaveBeenCalled();
  });

  test("identical progress does not re-notify", () => {
    const store = createScrollStore();
    const fn = vi.fn();
    store.setProgress(0.5);
    store.subscribe(fn);
    store.setProgress(0.5);
    expect(fn).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — `./store` not found.

- [ ] **Step 3: Implement `lib/scroll/store.ts`**

```ts
import { duskCurve } from "./duskCurve";
import { actAt, type Act } from "./acts";

export type ScrollState = { progress: number; dusk: number; act: Act };

export type ScrollStore = {
  getState: () => ScrollState;
  setProgress: (p: number) => void;
  subscribe: (fn: (s: ScrollState) => void) => () => void;
};

export function createScrollStore(): ScrollStore {
  let state: ScrollState = { progress: 0, dusk: 0, act: 1 };
  const subs = new Set<(s: ScrollState) => void>();

  return {
    getState: () => state,
    setProgress: (p: number) => {
      if (p === state.progress) return;
      state = { progress: p, dusk: duskCurve(p), act: actAt(p) };
      subs.forEach((fn) => fn(state));
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
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: scroll store deriving dusk and act from progress

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Token layer + ScrollProvider (Lenis + ScrollTrigger conductor)

**Files:**
- Modify: `app/globals.css`
- Create: `lib/theme/applyTokens.ts`, `components/providers/ScrollProvider.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `scrollStore` (Task 6), `duskToTokens`/`ThemeTokens` (Task 4), `duskCurve`, `actMidpoint` (Task 5), fonts CSS variables (Task 3).
- Produces: CSS variables `--bg`, `--surface`, `--ink`, `--ink-secondary`, `--line`, `--copper` live-updated on `:root`; Tailwind utilities `bg-dusk-bg`, `text-dusk-ink`, `text-dusk-ink-secondary`, `border-dusk-line`, `text-dusk-copper`, `bg-dusk-surface`; `<ScrollProvider>` wrapping the app. Task 8 uses these class names verbatim.

- [ ] **Step 1: Install runtime motion deps**

```bash
npm install gsap lenis
```

- [ ] **Step 2: Replace `app/globals.css`**

SSR defaults are the exact light-pole values, so first paint is light-world with zero JS. The `@theme inline` block maps the runtime variables into Tailwind v4 utilities.

```css
@import "tailwindcss";

:root {
  /* Dusk-interpolated tokens — light pole defaults (SSR/first paint). */
  --bg: #f7f5f1;
  --surface: #ffffff;
  --ink: #1a1815;
  --ink-secondary: #6b655c;
  --line: #dfd9d0;
  --copper: #c0682b;

  /* Type scale (fluid) */
  --text-hero: clamp(3.25rem, 7vw, 6.5rem);
  --text-display: clamp(2.25rem, 4.5vw, 4rem);
  --text-title: clamp(1.5rem, 2.5vw, 2rem);
  --text-body: 1.0625rem; /* 17px — body must stay >=16px */
  --text-small: 0.875rem;
  --text-mono: 0.8125rem;

  /* Motion */
  --ease-standard: cubic-bezier(0.22, 1, 0.36, 1);
}

@theme inline {
  --color-dusk-bg: var(--bg);
  --color-dusk-surface: var(--surface);
  --color-dusk-ink: var(--ink);
  --color-dusk-ink-secondary: var(--ink-secondary);
  --color-dusk-line: var(--line);
  --color-dusk-copper: var(--copper);
  --font-sans: var(--font-cabinet);
  --font-mono: var(--font-mono);
}

html {
  background: var(--bg);
  color: var(--ink);
}

body {
  font-family: var(--font-cabinet), system-ui, sans-serif;
  font-size: var(--text-body);
  line-height: 1.6;
}
```

- [ ] **Step 3: Create `lib/theme/applyTokens.ts`**

```ts
import type { ThemeTokens } from "./palette";

const VAR_NAMES: Record<keyof ThemeTokens, string> = {
  bg: "--bg",
  surface: "--surface",
  ink: "--ink",
  inkSecondary: "--ink-secondary",
  line: "--line",
  copper: "--copper",
};

export function applyTokens(el: HTMLElement, tokens: ThemeTokens): void {
  for (const key of Object.keys(tokens) as (keyof ThemeTokens)[]) {
    el.style.setProperty(VAR_NAMES[key], tokens[key]);
  }
}
```

- [ ] **Step 4: Create `components/providers/ScrollProvider.tsx`**

```tsx
"use client";

import { useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { scrollStore } from "@/lib/scroll/store";
import { duskToTokens } from "@/lib/theme/palette";
import { applyTokens } from "@/lib/theme/applyTokens";
import { duskCurve } from "@/lib/scroll/duskCurve";
import { actMidpoint } from "@/lib/scroll/acts";

export function ScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    gsap.registerPlugin(ScrollTrigger);

    // Smooth scroll only when motion is welcome; native scroll otherwise.
    const lenis = reduced ? null : new Lenis({ lerp: 0.08 });
    const tick = (time: number) => lenis?.raf(time * 1000);
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    const trigger = ScrollTrigger.create({
      start: 0,
      end: () =>
        document.documentElement.scrollHeight - window.innerHeight,
      onUpdate: (self) => scrollStore.setProgress(self.progress),
    });

    const root = document.documentElement;
    const unsubscribe = scrollStore.subscribe((s) => {
      // Reduced motion: theme snaps to the act's midpoint value instead of
      // interpolating continuously (spec Section 7, tier 4).
      const dusk = reduced ? duskCurve(actMidpoint(s.act)) : s.dusk;
      applyTokens(root, duskToTokens(dusk));
      root.dataset.act = String(s.act);
    });

    // Apply initial state unconditionally — setProgress dedupes identical
    // values, so a fresh top-of-page load (progress already 0) would
    // otherwise never sync the DOM (applyTokens/data-act) on mount.
    const initial = scrollStore.getState();
    const initialDusk = reduced
      ? duskCurve(actMidpoint(initial.act))
      : initial.dusk;
    applyTokens(root, duskToTokens(initialDusk));
    root.dataset.act = String(initial.act);
    scrollStore.setProgress(window.scrollY === 0 ? 0 : trigger.progress);

    return () => {
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

- [ ] **Step 5: Wrap the app in `app/layout.tsx`**

Change the `<body>` line to:

```tsx
      <body>
        <ScrollProvider>{children}</ScrollProvider>
      </body>
```

with import `import { ScrollProvider } from "@/components/providers/ScrollProvider";`

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npm test && npm run build`
Expected: all pass. (Browser verification happens with the placeholder page in Task 8 — the current default page is too short to scroll.)

- [ ] **Step 7: Commit**

```bash
git add -A
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: dusk token layer and ScrollProvider conductor (Lenis + ScrollTrigger)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Placeholder journey page — prove the arc

**Files:**
- Modify: `app/page.tsx`
- Create: `components/dev/ActMarker.tsx`

**Interfaces:**
- Consumes: Tailwind dusk utilities (Task 7), act ranges (Task 5 values, hardcoded as layout percentages here).
- Produces: a scrollable six-act placeholder page (replaced in Milestone 2 — everything here is throwaway by design, marked as such).

- [ ] **Step 1: Create `components/dev/ActMarker.tsx`**

A caption block placed at each act's content plateau. Dev-only component; lives under `components/dev/` to make its throwaway status obvious.

The marker is a plain content block — the *parent* zone centers it. This keeps zone heights exact so marker centers land on dusk plateaus.

```tsx
type ActMarkerProps = {
  act: string;
  title: string;
  note: string;
};

export function ActMarker({ act, title, note }: ActMarkerProps) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-4 px-6">
      <p className="font-mono text-sm uppercase tracking-widest text-dusk-copper">
        {act}
      </p>
      <h2 className="text-dusk-ink" style={{ fontSize: "var(--text-display)" }}>
        {title}
      </h2>
      <p className="text-dusk-ink-secondary">{note}</p>
    </div>
  );
}
```

- [ ] **Step 2: Replace `app/page.tsx`**

Section heights mirror the act scroll ranges over a total journey of 800vh (Act I 10% → 80vh, etc.). Every zone is a fixed-height flex container that centers its marker, so each marker's document position lands on a dusk plateau when the visitor rests on it. Act III is exactly four 100vh zones (4 × 100 = the act's 400vh — no overflow); their centers sit at progress ≈ 0.26 / 0.39 / 0.51 / 0.64, inside the plateau anchor ranges from Task 5.

```tsx
import { ActMarker } from "@/components/dev/ActMarker";

// Placeholder journey page — Milestone 1 only. Replaced by real sections in
// Milestone 2. Heights map act scroll ranges onto an 800vh document.
export default function Home() {
  return (
    <main>
      {/* Act I — 0-10% */}
      <section style={{ height: "80vh" }} className="flex items-center">
        <ActMarker
          act="Act I · Surface"
          title="Alex Pena"
          note="Placeholder — light world. Dusk 0."
        />
      </section>

      {/* Act II — 10-20% */}
      <section style={{ height: "80vh" }} className="flex items-center">
        <ActMarker
          act="Act II · The Request"
          title="The first dim"
          note="Placeholder — dusk 0.12."
        />
      </section>

      {/* Act III — 20-70%: four 100vh stratum zones (= 400vh) */}
      <section>
        <div style={{ height: "100vh" }} className="flex items-center">
          <ActMarker
            act="Depth 01 · Prompt Engineering · 2023"
            title="Shaping the request"
            note="Placeholder — dusk 0.55."
          />
        </div>
        <div style={{ height: "100vh" }} className="flex items-center">
          <ActMarker
            act="Depth 02 · Context Engineering · 2024"
            title="Gathering mass"
            note="Placeholder — dusk 0.70."
          />
        </div>
        <div style={{ height: "100vh" }} className="flex items-center">
          <ActMarker
            act="Depth 03 · Harness Engineering · 2025"
            title="Entering the machinery"
            note="Placeholder — dusk 0.85."
          />
        </div>
        <div style={{ height: "100vh" }} className="flex items-center">
          <ActMarker
            act="Depth 04 · Loop Engineering · 2026"
            title="Self-driving"
            note="Placeholder — dusk 1."
          />
        </div>
      </section>

      {/* Act IV — 70-82% */}
      <section style={{ height: "96vh" }} className="flex items-center">
        <ActMarker
          act="Act IV · Resolution"
          title="Completed runs"
          note="Placeholder — full dark holds."
        />
      </section>

      {/* Act V — 82-92%: ascent, deliberately empty (fast crossing) */}
      <section style={{ height: "80vh" }} aria-hidden />

      {/* Act VI — 92-100% */}
      <section style={{ height: "64vh" }} className="flex items-center">
        <ActMarker
          act="Act VI · Daylight"
          title="Back at the surface"
          note="Placeholder — light world again."
        />
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Verify in the browser (the milestone's acceptance test)**

Run `npm run dev`, open `http://localhost:3000`, and check:

1. First paint is light-world (off-white bg, dark ink) before any scrolling.
2. Scroll slowly to the bottom: background dims at Act II, steps through four progressively darker strata, holds near-black through Resolution, rushes back to light through the empty ascent, ends light. No flashes, no color banding. Whenever a caption is centered/at rest in the viewport, its text reads clearly (AA — this is what the plateau tests guarantee); brief contrast dips while text scrolls *through* a crossing are expected and acceptable on this placeholder.
3. Scroll back up: the journey reverses smoothly (fully scrubbed).
4. Keyboard: Home/End/PageDown jump correctly and the theme lands at the right state.
5. DevTools console: `getComputedStyle(document.documentElement).getPropertyValue('--bg')` changes with scroll; `document.documentElement.dataset.act` steps 1→6.
6. Emulate `prefers-reduced-motion: reduce` (DevTools rendering tab), reload: native scroll (no smoothing), theme snaps per act instead of interpolating.
7. Resize the window mid-journey: no breakage; progress recalculates.

- [ ] **Step 4: Full check suite**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git -c user.name="Alex Pena" -c user.email="alex@alexpena.dev" commit -m "feat: placeholder journey page proving light->dark->light dusk arc

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Milestone exit criteria

- All checks green: `typecheck`, `lint`, `test`, `build`.
- Browser-verified per Task 8 Step 3, including reduced-motion and scrub-reversal.
- The dusk arc (light → four-step descent → hold → fast ascent → light) is visible and smooth on the placeholder page with zero 3D.
- Milestone review with Alex before planning Milestone 2 (the shell).
