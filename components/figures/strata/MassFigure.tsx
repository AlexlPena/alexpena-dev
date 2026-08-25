import type { CSSProperties } from "react";
import { staggerDelay } from "@/lib/figures/reveal";

// Depth 02 — Context Engineering. The prompt is the copper core; everything
// that makes it work accretes around it. Rings carry the sequential ramp by
// depth, so density reads as colour as well as count — the one place on the
// site where the figure ramp earns a magnitude encoding.
const CX = 230;
const CY = 168;

const RINGS = [
  { r: 44, n: 6, step: "var(--fig-5)" },
  { r: 76, n: 9, step: "var(--fig-4)" },
  { r: 108, n: 13, step: "var(--fig-3)" },
  { r: 140, n: 18, step: "var(--fig-2)" },
] as const;

// A few nodes are wired straight to the core; the rest are ambient mass.
const TETHERED = new Set(["0-0", "0-3", "1-2", "1-6", "2-4", "2-9", "3-1", "3-12"]);

export function MassFigure() {
  return (
    <svg
      viewBox="0 0 460 340"
      className="w-full"
      role="img"
      aria-label="A copper core surrounded by four rings of accumulating context nodes, growing denser outward, with several nodes tethered directly to the core."
    >
      <title>Context accreting around the request</title>

      <text x="20" y="20" className="fill-[var(--ink-secondary)] font-mono" fontSize="11" letterSpacing="1.4">
        RETRIEVAL DEPTH
      </text>

      {RINGS.map((ring, ri) => (
        <g
          key={ring.r}
          className="fig-el"
          style={{ "--d": staggerDelay(RINGS.length - 1 - ri, RINGS.length) } as CSSProperties}
        >
          {/* Orbit hairline — structure, not data. */}
          <circle
            className="fig-draw"
            pathLength={1}
            cx={CX}
            cy={CY}
            r={ring.r}
            fill="none"
            stroke="var(--line)"
            strokeWidth="1"
          />

          {Array.from({ length: ring.n }, (_, i) => {
            // Offset each ring so nodes never line up into false spokes.
            const a = (i / ring.n) * Math.PI * 2 + ri * 0.41;
            const x = CX + Math.cos(a) * ring.r;
            const y = CY + Math.sin(a) * ring.r;
            const tethered = TETHERED.has(`${ri}-${i}`);
            return (
              <g key={i}>
                {tethered ? (
                  <line
                    className="fig-fade"
                    x1={CX}
                    y1={CY}
                    x2={x}
                    y2={y}
                    stroke="var(--copper)"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                ) : null}
                <circle
                  className="fig-fade"
                  cx={x}
                  cy={y}
                  r={tethered ? 3.6 : 2.4}
                  fill={tethered ? "var(--copper)" : ring.step}
                />
              </g>
            );
          })}
        </g>
      ))}

      {/* The core is drawn last so it sits above every tether. */}
      <circle cx={CX} cy={CY} r="9" fill="var(--copper)" stroke="var(--bg)" strokeWidth="3" />
      <circle
        className="fig-draw"
        pathLength={1}
        cx={CX}
        cy={CY}
        r="17"
        fill="none"
        stroke="var(--copper)"
        strokeWidth="1.5"
        opacity="0.5"
      />

    </svg>
  );
}
