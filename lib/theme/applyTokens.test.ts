// @vitest-environment jsdom
import { describe, expect, it, beforeEach } from "vitest";
import { applyTokens, resetAppliedTokens, tokensToStyle } from "./applyTokens";
import { duskToTokens, LIGHT, DARK } from "./palette";

function el() {
  return document.createElement("div");
}

describe("applyTokens", () => {
  let node: HTMLElement;
  beforeEach(() => {
    node = el();
    resetAppliedTokens(node);
  });

  it("writes every token on the first apply", () => {
    expect(applyTokens(node, LIGHT)).toBe(12);
    expect(node.style.getPropertyValue("--bg")).toBe(LIGHT.bg);
    expect(node.style.getPropertyValue("--fig-mute")).toBe(LIGHT.figMute);
  });

  it("writes nothing when the tokens are unchanged", () => {
    applyTokens(node, LIGHT);
    expect(applyTokens(node, LIGHT)).toBe(0);
  });

  it("writes only the tokens that differ", () => {
    applyTokens(node, LIGHT);
    const nudged = { ...LIGHT, bg: "#ffffff" };
    expect(applyTokens(node, nudged)).toBe(1);
    expect(node.style.getPropertyValue("--bg")).toBe("#ffffff");
    expect(node.style.getPropertyValue("--ink")).toBe(LIGHT.ink);
  });

  it("skips the whole ramp across the stretch where it is constant", () => {
    // The figure ramp snaps over 0.3–0.4 and is flat either side, so a step
    // between two dark-side dusk values must not rewrite any fig token.
    applyTokens(node, duskToTokens(0.55));
    const writes = applyTokens(node, duskToTokens(0.85));
    const rampTouched = ["--fig-1", "--fig-3", "--fig-5", "--fig-mute"].filter(
      (v) => node.style.getPropertyValue(v) !== DARK[
        v === "--fig-mute" ? "figMute" : (`fig${v.slice(-1)}` as "fig1")
      ]
    );
    expect(rampTouched).toEqual([]);
    // bg/surface/line are still easing between those two points; ink is not.
    expect(writes).toBeLessThan(12);
  });

  it("re-writes everything after a reset", () => {
    applyTokens(node, LIGHT);
    resetAppliedTokens(node);
    expect(applyTokens(node, LIGHT)).toBe(12);
  });

  it("tracks elements independently", () => {
    const other = el();
    applyTokens(node, LIGHT);
    expect(applyTokens(other, LIGHT)).toBe(12);
  });
});

describe("tokensToStyle", () => {
  it("maps every token onto its custom property", () => {
    const style = tokensToStyle(DARK) as Record<string, string>;
    expect(style["--bg"]).toBe(DARK.bg);
    expect(style["--ink-secondary"]).toBe(DARK.inkSecondary);
    expect(style["--fig-5"]).toBe(DARK.fig5);
    expect(Object.keys(style)).toHaveLength(12);
  });
});
