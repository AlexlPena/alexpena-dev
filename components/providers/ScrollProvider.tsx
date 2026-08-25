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

    // Smooth scroll is a pointer-device affordance, not a universal one.
    //
    // On touch, the platform already composites momentum scrolling off the
    // main thread; replacing it with a rAF loop that writes transforms every
    // frame moves that work back onto a CPU which is several times slower
    // than a laptop's, and it competes with the dusk interpolation for the
    // same frame budget. Native scroll on touch is both smoother and cheaper,
    // so phones and tablets keep it. ScrollTrigger drives the journey either
    // way — it listens to native scroll when Lenis is absent.
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    const wantsSmooth = !media.matches && !coarsePointer.matches;
    const lenis = wantsSmooth ? new Lenis({ lerp: 0.08 }) : null;
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
