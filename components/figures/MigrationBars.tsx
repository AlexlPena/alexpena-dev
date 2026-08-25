import { MIGRATION } from "@/lib/content/caseStudies";
import { barPath } from "@/lib/figures/scale";

const X0 = 190;
const TRACK = 510;
const BAR_H = 20;
const GAP = 2;
const ROW_Y = [44, 82, 120, 158, 196];

// Part-to-whole per module: a stacked horizontal bar (horizontal because the
// module names are long). Two segments only, separated by a surface gap rather
// than a stroke. Values are labelled outside the track so nothing can clip.
export function MigrationBars() {
  return (
    <svg
      viewBox="0 0 760 240"
      className="w-full"
      role="img"
      aria-label="Share of each module migrated from legacy PHP to typed TypeScript, ranging from billing service at 82 percent to scheduled tasks at 12 percent."
    >
      <title>Legacy to typed migration, by module</title>

      <g>
        <rect x="192" y="9" width="10" height="10" rx="2" fill="var(--copper)" />
        <text x="208" y="18" className="fill-[var(--ink-secondary)] font-mono" fontSize="10">
          Migrated
        </text>
        <rect x="284" y="9" width="10" height="10" rx="2" fill="var(--fig-mute)" />
        <text x="300" y="18" className="fill-[var(--ink-secondary)] font-mono" fontSize="10">
          Remaining
        </text>
      </g>

      {MIGRATION.map((row, i) => {
        const y = ROW_Y[i];
        const done = (row.migrated / 100) * TRACK;
        const restX = X0 + done + GAP;
        const restW = Math.max(0, TRACK - done - GAP);
        return (
          <g key={row.label}>
            <title>{`${row.label}: ${row.migrated}% migrated`}</title>

            <text
              x="175"
              y={y + BAR_H / 2 + 4}
              textAnchor="end"
              className="fill-[var(--ink)]"
              fontSize="13"
            >
              {row.label}
            </text>

            <path d={barPath(X0, y, done, BAR_H, 4)} fill="var(--copper)" />
            {restW > 0 ? (
              <path d={barPath(restX, y, restW, BAR_H, 4)} fill="var(--fig-mute)" opacity="0.35" />
            ) : null}

            <text
              x={X0 + TRACK + 12}
              y={y + BAR_H / 2 + 4}
              className="fill-[var(--ink)] font-mono [font-variant-numeric:tabular-nums]"
              fontSize="11"
            >
              {row.migrated}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
