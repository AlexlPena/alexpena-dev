import type { CSSProperties } from "react";
import { staggerDelay } from "@/lib/figures/reveal";

// Depth 04 — Loop Engineering. A closed circuit that runs unattended, with the
// human deliberately drawn OUTSIDE it on a dashed tether. That placement is
// the argument of the whole stratum: the work is designing the loop and
// knowing the one edge where a person still belongs.
const CX = 214;
const CY = 168;
const R = 104;

const STAGES = [
  { a: -90, label: "PLAN" },
  { a: 0, label: "RUN" },
  { a: 90, label: "VERIFY" },
  { a: 180, label: "CORRECT" },
] as const;

const pt = (deg: number, r = R) => ({
  x: CX + Math.cos((deg * Math.PI) / 180) * r,
  y: CY + Math.sin((deg * Math.PI) / 180) * r,
});

// Quarter arc between consecutive stages, swept clockwise.
const arc = (from: number, to: number) => {
  const a = pt(from);
  const b = pt(to);
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)} A${R},${R} 0 0 1 ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
};

// Off the circuit, but inside the frame. Sitting it directly below VERIFY put
// it past the viewBox floor and clipped the label, so it moves to the free
// quadrant right of the ring and keeps its tether to the verify stage.
const HUMAN = { x: 372, y: 236 };
const VERIFY = pt(90);

export function LoopFigure() {
  return (
    <svg
      viewBox="0 0 460 340"
      className="w-full"
      role="img"
      aria-label="A closed loop of plan, run, verify and correct running clockwise in copper, with a human node placed outside the circuit on a dashed tether to the verify stage."
    >
      <title>The loop, and where a human belongs in it</title>

      <text x="20" y="20" className="fill-[var(--ink-secondary)] font-mono" fontSize="11" letterSpacing="1.4">
        UNATTENDED
      </text>

      {STAGES.map((s, i) => {
        const next = STAGES[(i + 1) % STAGES.length];
        return (
          <path
            key={`arc-${s.label}`}
            className="fig-el fig-draw"
            style={{ "--d": staggerDelay(i, STAGES.length) } as CSSProperties}
            pathLength={1}
            d={arc(s.a, next.a)}
            fill="none"
            stroke="var(--copper)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        );
      })}

      {STAGES.map((s, i) => {
        const p = pt(s.a);
        // Labels ride outside the ring, away from the centre.
        const l = pt(s.a, R + 26);
        const anchor = Math.abs(s.a) === 90 ? "middle" : s.a === 0 ? "start" : "end";
        return (
          <g
            key={s.label}
            className="fig-el"
            style={{ "--d": staggerDelay(i, STAGES.length) } as CSSProperties}
          >
            <circle
              className="fig-fade"
              cx={p.x}
              cy={p.y}
              r="6"
              fill="var(--copper)"
              stroke="var(--bg)"
              strokeWidth="3"
            />
            <text
              className="fig-fade"
              x={l.x}
              y={l.y + (s.a === -90 ? -4 : s.a === 90 ? 12 : 3.5)}
              textAnchor={anchor}
              fill="var(--ink)"
              fontSize="12"
              letterSpacing="1.2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {s.label}
            </text>
          </g>
        );
      })}

      {/* The human sits off the circuit. Dashed, because the tether is optional
          — which is the point being made, not a decorative flourish. */}
      <g className="fig-el fig-fade" style={{ "--d": 0.82 } as CSSProperties}>
        <line
          x1={VERIFY.x + 10}
          y1={VERIFY.y - 4}
          x2={HUMAN.x - 9}
          y2={HUMAN.y + 2}
          stroke="var(--ink-secondary)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <circle
          cx={HUMAN.x}
          cy={HUMAN.y}
          r="6"
          fill="none"
          stroke="var(--ink-secondary)"
          strokeWidth="1.5"
        />
        {/* Two short lines rather than one long one — the label has to clear
            the frame at the same 9px the other instrument labels use. */}
        <text
          x={HUMAN.x}
          y={HUMAN.y + 24}
          textAnchor="middle"
          fill="var(--ink-secondary)"
          fontSize="11"
          letterSpacing="1"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          HUMAN
        </text>
        <text
          x={HUMAN.x}
          y={HUMAN.y + 41}
          textAnchor="middle"
          fill="var(--ink-secondary)"
          fontSize="11"
          letterSpacing="1"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          WHEN IT MATTERS
        </text>
      </g>

    </svg>
  );
}
