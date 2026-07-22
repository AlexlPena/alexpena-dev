import { duskCurve } from "./duskCurve";
import { actAt, type Act } from "./acts";

export type ScrollState = {
  readonly progress: number;
  readonly dusk: number;
  readonly act: Act;
};

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
