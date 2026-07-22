import { describe, expect, test, vi } from "vitest";
import { createScrollStore } from "./store";
import { duskCurve } from "./duskCurve";
import { actMidpoint } from "./acts";

describe("scroll store", () => {
  test("initial state is the top of the page", () => {
    const store = createScrollStore();
    expect(store.getState()).toEqual({ progress: 0, dusk: 0, effectiveDusk: 0, act: 1 });
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
