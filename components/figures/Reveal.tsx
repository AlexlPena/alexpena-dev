"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { scrollStore } from "@/lib/scroll/store";
import { revealFromRect } from "@/lib/figures/reveal";

/**
 * Drives a figure's draw from its own position on screen, writing one custom
 * property on a wrapper. Children read `--reveal` through the .fig-* classes.
 *
 * Two deliberate choices here:
 *
 * It never calls setState. This runs on every scroll frame alongside the theme
 * interpolation, and a React render per frame would cost far more than the
 * single style write it replaces.
 *
 * It reads geometry only while an IntersectionObserver says the figure is on
 * screen. getBoundingClientRect on a subtree that `content-visibility: auto`
 * has skipped forces that subtree to render, which would quietly undo the
 * optimisation it lives inside — so offscreen figures are parked at an end
 * state and never measured.
 */
export function Reveal({
  settle,
  className,
  children,
}: {
  /** How far above the fold the figure must climb before the draw completes. */
  settle?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion gets the finished image, not a drawing of it.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--reveal", "1");
      return;
    }

    let last = -1;
    const write = (v: number) => {
      // Quantise so sub-pixel scroll jitter doesn't churn the style attribute.
      const q = Math.round(v * 200) / 200;
      if (q === last) return;
      last = q;
      el.style.setProperty("--reveal", String(q));
    };

    let onScreen = false;
    const measure = () => {
      if (!onScreen) return;
      const r = el.getBoundingClientRect();
      write(revealFromRect(r.top, r.height, window.innerHeight, settle));
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) {
          measure();
        } else {
          // Park at whichever end it left by, so a figure scrolled past stays
          // drawn and one not yet reached stays blank — without measuring.
          write(entry.boundingClientRect.top < 0 ? 1 : 0);
        }
      },
      { threshold: 0 }
    );
    io.observe(el);

    const unsubscribe = scrollStore.subscribe(measure);
    window.addEventListener("resize", measure, { passive: true });

    return () => {
      io.disconnect();
      unsubscribe();
      window.removeEventListener("resize", measure);
    };
  }, [settle]);

  return (
    <div ref={ref} data-reveal className={className}>
      {children}
    </div>
  );
}
