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

export function applyTokens(el: HTMLElement, tokens: ThemeTokens): void {
  for (const key of Object.keys(tokens) as (keyof ThemeTokens)[]) {
    el.style.setProperty(VAR_NAMES[key], tokens[key]);
  }
}

/**
 * The same token set as an inline style object, for pinning a subtree to a
 * fixed dusk value on the server. Scroll owns <html>; this is how a surface
 * opts out of that without duplicating hexes in CSS.
 */
export function tokensToStyle(tokens: ThemeTokens): CSSProperties {
  const style: Record<string, string> = {};
  for (const key of Object.keys(tokens) as (keyof ThemeTokens)[]) {
    style[VAR_NAMES[key]] = tokens[key];
  }
  return style as CSSProperties;
}
