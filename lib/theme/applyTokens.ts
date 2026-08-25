import type { CSSProperties } from "react";
import type { ThemeTokens } from "./palette";

const VAR_NAMES: Record<keyof ThemeTokens, string> = {
  bg: "--bg",
  surface: "--surface",
  ink: "--ink",
  inkSecondary: "--ink-secondary",
  line: "--line",
  copper: "--copper",
  fig1: "--fig-1",
  fig2: "--fig-2",
  fig3: "--fig-3",
  fig4: "--fig-4",
  fig5: "--fig-5",
  figMute: "--fig-mute",
};

const KEYS = Object.keys(VAR_NAMES) as (keyof ThemeTokens)[];

// Last value written per element. Every setProperty on <html> invalidates
// style for the whole document, so writing a token that did not change is
// pure cost — and most of them don't on most frames: ink and the figure ramp
// snap across a 0.1-wide band and are constant everywhere else.
const applied = new WeakMap<HTMLElement, ThemeTokens>();

/**
 * Writes only the tokens whose value actually changed. Returns how many were
 * written, which is what the perf test asserts against.
 */
export function applyTokens(el: HTMLElement, tokens: ThemeTokens): number {
  const prev = applied.get(el);
  let written = 0;

  for (const key of KEYS) {
    const next = tokens[key];
    if (prev && prev[key] === next) continue;
    el.style.setProperty(VAR_NAMES[key], next);
    written++;
  }

  if (written > 0) applied.set(el, tokens);
  return written;
}

/** Drops the memo so the next apply writes every token. For teardown/tests. */
export function resetAppliedTokens(el: HTMLElement): void {
  applied.delete(el);
}

/**
 * The same token set as an inline style object, for pinning a subtree to a
 * fixed dusk value on the server. Scroll owns <html>; this is how a surface
 * opts out of that without duplicating hexes in CSS.
 */
export function tokensToStyle(tokens: ThemeTokens): CSSProperties {
  const style: Record<string, string> = {};
  for (const key of KEYS) style[VAR_NAMES[key]] = tokens[key];
  return style as CSSProperties;
}
