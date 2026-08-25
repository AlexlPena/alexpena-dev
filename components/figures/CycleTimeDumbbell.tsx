import { CYCLE_TIME } from "@/lib/content/caseStudies";
import { linear } from "@/lib/figures/scale";

const X0 = 190;
const X1 = 700;
const MAX_H = 42;
const ROW_Y = [56, 96, 136, 176, 216];
const TICKS = [0, 10, 20, 30, 40];

const x = (hours: number) => linear(hours, 0, MAX_H, X0, X1);

// Before -> after per item is a dumbbell: one hue, two shades. The connector
// carries the magnitude of the change, so only the "after" value is direct-
// labelled — the axis and the table twin carry the rest.
export function CycleTimeDumbbell() {
  return (
    <svg
      viewBox="0 0 760 280"
      className="w-full"
      role="img"
      aria-label="Cycle time in hours before and after automation, for five workflows. Every workflow drops; vendor onboarding falls from 40 hours to 6."
    >
      <title>Cycle time per workflow, before and after</title>

      {/* Legend — two series, so identity is never color-alone. */}
      <g>
        <circle cx="192" cy="13" r="4" fill="var(--fig-mute)" />
        <text x="204" y="17" className="fill-[var(--ink-secondary)] font-mono" fontSize="10">
          Before
        </text>
        <circle cx="266" cy="13" r="4" fill="var(--copper)" />
        <text x="278" y="17" className="fill-[var(--ink-secondary)] font-mono" fontSize="10">
          After
        </text>
      </g>

      {/* Gridlines: hairline, solid, recessive. */}
      {TICKS.map((t) => (
        <line
          key={t}
          x1={x(t)}
          y1={38}
          x2={x(t)}
          y2={240}
          stroke="var(--line)"
          strokeWidth="1"
        />
      ))}

      {CYCLE_TIME.map((row, i) => {
        const y = ROW_Y[i];
        const bx = x(row.before);
        const ax = x(row.after);
        return (
          <g key={row.label}>
            <title>{`${row.label}: ${row.before}h before, ${row.after}h after`}</title>

            <text
              x="175"
              y={y + 4}
              textAnchor="end"
              className="fill-[var(--ink)]"
              fontSize="13"
            >
              {row.label}
            </text>

            {/* Connector reads as the distance travelled. */}
            <line
              x1={ax}
              y1={y}
              x2={bx}
              y2={y}
              stroke="var(--fig-mute)"
              strokeWidth="2"
              strokeLinecap="round"
            />

            <circle cx={bx} cy={y} r="5" fill="var(--fig-mute)" stroke="var(--surface)" strokeWidth="2" />
            <circle cx={ax} cy={y} r="5" fill="var(--copper)" stroke="var(--surface)" strokeWidth="2" />

            {/* Direct label sits above the mark, clear of the row label. */}
            <text
              x={ax}
              y={y - 12}
              textAnchor="middle"
              className="fill-[var(--ink)] font-mono"
              fontSize="10"
            >
              {row.after}h
            </text>
          </g>
        );
      })}

      {/* X axis */}
      <line x1={X0} y1={240} x2={X1} y2={240} stroke="var(--line)" strokeWidth="1" />
      {TICKS.map((t) => (
        <text
          key={t}
          x={x(t)}
          y={258}
          textAnchor="middle"
          className="fill-[var(--ink-secondary)] font-mono [font-variant-numeric:tabular-nums]"
          fontSize="10"
        >
          {t}
        </text>
      ))}
      <text
        x={X1}
        y={274}
        textAnchor="end"
        className="fill-[var(--ink-secondary)] font-mono"
        fontSize="9"
        letterSpacing="1"
      >
        HOURS
      </text>
    </svg>
  );
}
