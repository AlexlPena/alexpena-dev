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
