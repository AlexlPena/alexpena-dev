import type { CSSProperties } from "react";
import { staggerDelay } from "@/lib/figures/reveal";

// Depth 01 — Prompt Engineering. Raw intent on the left: fragments at drifting
// offsets and lengths. The same intent on the right: quantised to an indent
// hierarchy, one line carrying the operative instruction. The gutter between
// them is where the shaping happens, so it is the only empty column.
const ROWS: readonly { lx: number; lw: number; tilt: number; indent: 0 | 1 | 2; rw: number }[] = [
  { lx: 34, lw: 96, tilt: -0.8, indent: 0, rw: 132 },
  { lx: 22, lw: 58, tilt: 0.6, indent: 1, rw: 92 },
  { lx: 57, lw: 74, tilt: -0.4, indent: 1, rw: 108 },
  { lx: 28, lw: 112, tilt: 1.1, indent: 1, rw: 76 },
  { lx: 44, lw: 41, tilt: -1.0, indent: 0, rw: 124 },
  { lx: 19, lw: 88, tilt: 0.3, indent: 1, rw: 100 },
  { lx: 63, lw: 63, tilt: -0.6, indent: 2, rw: 68 },
  { lx: 31, lw: 104, tilt: 0.9, indent: 2, rw: 84 },
  { lx: 48, lw: 52, tilt: -0.2, indent: 1, rw: 116 },
  { lx: 25, lw: 79, tilt: 0.7, indent: 0, rw: 140 },
  { lx: 55, lw: 95, tilt: -1.2, indent: 1, rw: 96 },
  { lx: 37, lw: 46, tilt: 0.4, indent: 2, rw: 72 },
  { lx: 21, lw: 108, tilt: -0.5, indent: 1, rw: 112 },
  { lx: 50, lw: 67, tilt: 0.8, indent: 0, rw: 128 },
];

const OPERATIVE = 9; // the one line that carries the instruction
const RIGHT_X = 262;
const INDENT = 15;

export function ShapingFigure() {
  return (
    <svg
      viewBox="0 0 460 340"
      className="w-full"
      role="img"
      aria-label="Fourteen fragments of raw intent at uneven offsets on the left, resolving on the right into an indented hierarchy of instructions with one operative line marked."
    >
      <title>Raw intent, shaped into instruction</title>

      <text x="20" y="20" className="fill-[var(--ink-secondary)] font-mono" fontSize="11" letterSpacing="1.4">
        INTENT
      </text>
      <text x="262" y="20" className="fill-[var(--copper)] font-mono" fontSize="11" letterSpacing="1.4">
        INSTRUCTION
      </text>

      {ROWS.map((r, i) => {
        const y = 44 + i * 20;
        const rx = RIGHT_X + r.indent * INDENT;
        const operative = i === OPERATIVE;
        return (
          <g
            key={i}
            className="fig-el"
            style={{ "--d": staggerDelay(i, ROWS.length) } as CSSProperties}
          >
            {/* raw: drifting, uneven, low-contrast */}
            <line
              className="fig-draw"
              pathLength={1}
              x1={r.lx}
              y1={y}
              x2={r.lx + r.lw}
              y2={y + r.tilt * 3}
              stroke="var(--fig-mute)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.55"
            />
            {/* shaped: aligned to an indent grid, uniform weight */}
            <line
              className="fig-draw"
              pathLength={1}
              x1={rx}
              y1={y}
              x2={rx + r.rw}
              y2={y}
              stroke={operative ? "var(--copper)" : "var(--ink-secondary)"}
              strokeWidth={operative ? 2.5 : 2}
              strokeLinecap="round"
              opacity={operative ? 1 : 0.62}
            />
          </g>
        );
      })}

      {/* Indent guides — hairlines that only exist on the shaped side. */}
      {[0, 1, 2].map((lvl) => (
        <line
          key={lvl}
          x1={RIGHT_X + lvl * INDENT - 6}
          y1={36}
          x2={RIGHT_X + lvl * INDENT - 6}
          y2={310}
          stroke="var(--line)"
          strokeWidth="1"
          opacity="0.6"
        />
      ))}

      {/* The operative line is the only thing labelled. */}
      <circle
        cx={RIGHT_X + ROWS[OPERATIVE].indent * INDENT - 6}
        cy={44 + OPERATIVE * 20}
        r="3.5"
        fill="var(--copper)"
      />
    </svg>
  );
}
