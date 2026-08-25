import type { CSSProperties } from "react";
import { staggerDelay } from "@/lib/figures/reveal";

// Depth 03 — Harness Engineering. A schematic, not a chart: the model is a
// spine, the tools bolt onto it, guardrails clamp it, and an eval loop returns
// its output to its input. Copper is reserved for that return path, because
// the loop is the part that turns a capable model into dependable software.
// Shifted left of centre so the return path has a clear lane down the right
// side. At the old centre the loop cut straight through the SCHEMA and RETRY
// modules and buried its own label behind one of them.
const SPINE_X = 186;
const TOP = 58;
const BOT = 286;
const MODULE_GAP = 46;

const MODULES = [
  { y: 84, side: -1, label: "TOOLS" },
  { y: 132, side: 1, label: "SCHEMA" },
  { y: 180, side: -1, label: "MCP" },
  { y: 228, side: 1, label: "RETRY" },
] as const;

const BOX_W = 84;
const BOX_H = 26;

export function MachineryFigure() {
  return (
    <svg
      viewBox="0 0 460 340"
      className="w-full"
      role="img"
      aria-label="A vertical model spine with tools, schema, MCP and retry modules bolted to alternating sides, clamped by guardrail brackets, and a copper evaluation loop returning output to input."
    >
      <title>The harness around the model</title>

      <text x="20" y="20" className="fill-[var(--ink-secondary)] font-mono" fontSize="11" letterSpacing="1.4">
        HARNESS
      </text>

      {/* Spine */}
      <line
        className="fig-el fig-draw"
        pathLength={1}
        x1={SPINE_X}
        y1={TOP}
        x2={SPINE_X}
        y2={BOT}
        stroke="var(--ink-secondary)"
        strokeWidth="2"
      />

      {/* Guardrails — brackets, not boxes: they constrain, they don't contain. */}
      {[-1, 1].map((s) => (
        <path
          key={s}
          className="fig-el fig-draw"
          pathLength={1}
          style={{ "--d": 0.1 } as CSSProperties}
          d={`M${SPINE_X + s * 30},${TOP - 8} h${s * 12} V${BOT + 8} h${-s * 12}`}
          fill="none"
          stroke="var(--fig-mute)"
          strokeWidth="1.5"
          opacity="0.7"
        />
      ))}

      {MODULES.map((m, i) => {
        const x =
          m.side === -1 ? SPINE_X - MODULE_GAP - BOX_W : SPINE_X + MODULE_GAP;
        const connX = m.side === -1 ? x + BOX_W : x;
        return (
          <g
            key={m.label}
            className="fig-el"
            style={{ "--d": staggerDelay(i, MODULES.length) } as CSSProperties}
          >
            <line
              className="fig-draw"
              pathLength={1}
              x1={SPINE_X}
              y1={m.y}
              x2={connX}
              y2={m.y}
              stroke="var(--fig-mute)"
              strokeWidth="1"
              opacity="0.8"
            />
            <rect
              className="fig-fade"
              x={x}
              y={m.y - BOX_H / 2}
              width={BOX_W}
              height={BOX_H}
              rx="2"
              fill="var(--bg)"
              stroke="var(--ink-secondary)"
              strokeWidth="1"
            />
            <text
              className="fig-fade"
              x={x + BOX_W / 2}
              y={m.y + 3.5}
              textAnchor="middle"
              fill="var(--ink-secondary)"
              fontSize="11"
              letterSpacing="1"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {m.label}
            </text>
            <circle className="fig-fade" cx={SPINE_X} cy={m.y} r="3" fill="var(--ink-secondary)" />
          </g>
        );
      })}

      {/* The eval loop: output returns to input. The only copper in the figure. */}
      <path
        className="fig-el fig-draw"
        pathLength={1}
        style={{ "--d": 0.5, "--run": 0.5 } as CSSProperties}
        d={`M${SPINE_X},${BOT} C${SPINE_X + 230},${BOT + 30} ${SPINE_X + 240},${TOP - 36} ${SPINE_X + 6},${TOP - 4}`}
        fill="none"
        stroke="var(--copper)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        className="fig-el fig-fade"
        style={{ "--d": 0.86 } as CSSProperties}
        d={`M${SPINE_X + 6},${TOP - 4} l7,-6 l1,9 z`}
        fill="var(--copper)"
      />
      <text
        className="fig-el fig-fade"
        style={
          { "--d": 0.86, fontFamily: "var(--font-mono)" } as CSSProperties
        }
        x={SPINE_X + MODULE_GAP + BOX_W + 24}
        y={176}
        textAnchor="middle"
        fill="var(--copper)"
        fontSize="11"
        letterSpacing="1.2"
      >
        EVAL
      </text>

    </svg>
  );
}
