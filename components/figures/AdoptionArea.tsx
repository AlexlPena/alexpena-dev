import { ADOPTION } from "@/lib/content/caseStudies";
import { linear } from "@/lib/figures/scale";

const X0 = 60;
const X1 = 680;
const Y0 = 205;
const Y1 = 30;
const MAX_U = 640;
const GRID = [0, 200, 400, 600];

const px = (i: number) => linear(i, 0, ADOPTION.length - 1, X0, X1);
const py = (u: number) => linear(u, 0, MAX_U, Y0, Y1);

const last = ADOPTION[ADOPTION.length - 1];
const linePts = ADOPTION.map((d, i) => `${px(i).toFixed(1)},${py(d.users).toFixed(1)}`).join(" ");
const areaPts = `${X0},${Y0} ${linePts} ${X1},${Y0}`;

// One series, so no legend box — the caption names what is plotted. The area is
// a 10% wash rather than a filled block, and only the endpoint is labelled.
export function AdoptionArea() {
  return (
    <svg
      viewBox="0 0 760 260"
      className="w-full"
      role="img"
      aria-label="Weekly active users of the internal tooling rising steadily across twelve months, from 40 in January to 610 in December."
    >
      <title>Weekly active users, twelve months</title>

      {GRID.map((g) => (
        <g key={g}>
          <line x1={X0} y1={py(g)} x2={X1} y2={py(g)} stroke="var(--line)" strokeWidth="1" />
          <text
            x={X0 - 12}
            y={py(g) + 4}
            textAnchor="end"
            className="fill-[var(--ink-secondary)] font-mono [font-variant-numeric:tabular-nums]"
            fontSize="10"
          >
            {g}
          </text>
        </g>
      ))}

      <polygon points={areaPts} fill="var(--copper)" opacity="0.1" />
      <polyline
        points={linePts}
        fill="none"
        stroke="var(--copper)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      <circle
        cx={px(ADOPTION.length - 1)}
        cy={py(last.users)}
        r="5"
        fill="var(--copper)"
        stroke="var(--surface)"
        strokeWidth="2"
      />
      <text
        x={px(ADOPTION.length - 1) + 14}
        y={py(last.users) + 4}
        className="fill-[var(--ink)] font-mono"
        fontSize="12"
      >
        {last.users}
      </text>

      {ADOPTION.map((d, i) =>
        i % 2 === 0 ? (
          <text
            key={d.month}
            x={px(i)}
            y={228}
            textAnchor="middle"
            className="fill-[var(--ink-secondary)] font-mono"
            fontSize="10"
          >
            {d.month}
          </text>
        ) : null
      )}

      <text
        x={X0}
        y={250}
        className="fill-[var(--ink-secondary)] font-mono"
        fontSize="9"
        letterSpacing="1"
      >
        WEEKLY ACTIVE USERS
      </text>
    </svg>
  );
}
