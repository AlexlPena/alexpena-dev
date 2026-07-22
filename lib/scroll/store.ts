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
