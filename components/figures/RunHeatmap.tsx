import { RUN_DAYS, RUN_HOURS, RUN_VOLUME } from "@/lib/content/caseStudies";
import { rampStep } from "@/lib/figures/scale";

const GX = 54;
const GY = 44;
const CELL_W = 82;
const CELL_H = 26;
const GAP = 2;
const STEPS = 5;

const MAX = Math.max(...RUN_VOLUME.flat());

// Magnitude across a grid: a heatmap on the validated single-hue ramp. The 2px
// separation between cells is surface showing through, not a stroke. A scale
// legend is mandatory for a sequential encoding, so it ships with one.
export function RunHeatmap() {
  return (
    <svg
      viewBox="0 0 760 300"
      className="w-full"
      role="img"
      aria-label="Automation runs by weekday and hour. A nightly batch fires at 03:00 every day; interactive traffic concentrates on weekdays between 09:00 and 15:00, and falls away at weekends."
    >
      <title>Run volume by weekday and hour</title>

      {RUN_HOURS.map((h, c) => (
        <text
          key={h}
          x={GX + c * (CELL_W + GAP) + CELL_W / 2}
          y={32}
          textAnchor="middle"
          className="fill-[var(--ink-secondary)] font-mono [font-variant-numeric:tabular-nums]"
          fontSize="10"
        >
          {h}
        </text>
      ))}

      {RUN_DAYS.map((day, r) => (
        <g key={day}>
          <text
            x={GX - 12}
            y={GY + r * (CELL_H + GAP) + CELL_H / 2 + 4}
            textAnchor="end"
            className="fill-[var(--ink-secondary)] font-mono"
            fontSize="10"
          >
            {day}
          </text>

          {RUN_VOLUME[r].map((v, c) => (
            <rect
              key={`${day}-${RUN_HOURS[c]}`}
              x={GX + c * (CELL_W + GAP)}
              y={GY + r * (CELL_H + GAP)}
              width={CELL_W}
              height={CELL_H}
              rx="1"
              fill={`var(--fig-${rampStep(v, MAX, STEPS) + 1})`}
            >
              <title>{`${day} ${RUN_HOURS[c]}:00 — ${v} runs`}</title>
            </rect>
          ))}
        </g>
      ))}

      {/* Scale legend */}
      <text
        x={GX}
        y={266}
        className="fill-[var(--ink-secondary)] font-mono"
        fontSize="9"
        letterSpacing="1"
      >
        RUNS
      </text>
      <text x={GX} y={288} className="fill-[var(--ink-secondary)] font-mono" fontSize="10">
        0
      </text>
      {Array.from({ length: STEPS }, (_, i) => (
        <rect
          key={i}
          x={GX + 20 + i * 34}
          y={278}
          width="32"
          height="10"
          rx="1"
          fill={`var(--fig-${i + 1})`}
        />
      ))}
      <text
        x={GX + 20 + STEPS * 34 + 6}
        y={288}
        className="fill-[var(--ink-secondary)] font-mono [font-variant-numeric:tabular-nums]"
        fontSize="10"
      >
        {MAX}
      </text>
    </svg>
  );
}
