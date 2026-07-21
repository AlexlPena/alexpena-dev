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
