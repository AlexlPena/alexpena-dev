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

    // Apply initial state (handles reload mid-page).
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
