"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { scrollStore } from "@/lib/scroll/store";
import { revealAt } from "@/lib/figures/reveal";

/**
 * Drives a figure's draw from journey progress by writing one custom property
 * on a wrapper. Deliberately never calls setState: this runs on every scroll
 * frame alongside the theme interpolation, and a React render per frame would
 * cost far more than the single style write it replaces. Children read
 * `--reveal` through the .fig-* classes in globals.css.
 */
export function Reveal({
  rest,
  lead,
  className,
  children,
}: {
  rest: number;
  lead?: number;
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
    const render = (s: ReturnType<typeof scrollStore.getState>) => {
      // Quantise so sub-pixel scroll jitter doesn't churn the style attribute.
      const v = Math.round(revealAt(s.progress, rest, lead) * 200) / 200;
      if (v === last) return;
      last = v;
      el.style.setProperty("--reveal", String(v));
    };

    render(scrollStore.getState());
    return scrollStore.subscribe(render);
  }, [rest, lead]);

  return (
    <div ref={ref} data-reveal className={className}>
      {children}
    </div>
  );
}
