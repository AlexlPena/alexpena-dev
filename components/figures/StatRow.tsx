import { HERO_STAT, STATS } from "@/lib/content/caseStudies";
import { linePoints } from "@/lib/figures/scale";

// 12-point trend in the de-emphasis hue with the current period in the accent.
function Sparkline({
  values,
  width = 168,
  height = 36,
}: {
  values: readonly number[];
  width?: number;
  height?: number;
}) {
  const pts = linePoints(values, width - 6, height - 6, 3);
  const lastPt = pts.split(" ").at(-1)!.split(",").map(Number);
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden
      className="mt-3 block overflow-visible"
    >
      <g transform="translate(3,3)">
        <polyline
          points={pts}
          fill="none"
          stroke="var(--fig-mute)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={lastPt[0]}
          cy={lastPt[1]}
          r="4"
          fill="var(--copper)"
          stroke="var(--surface)"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}

// The delta stays in ink rather than a status color: this palette has exactly
// one accent and it is already spoken for, so the sign carries the direction.
function Delta({ children }: { children: string }) {
  return (
    <p className="mt-2 font-mono text-mono-size text-dusk-ink-secondary">{children}</p>
  );
}

export function StatRow() {
  return (
    <div>
      {/* Hero figure — exactly one per view, same sans as everything else,
          proportional figures so the digits don't read loose at display size. */}
      <div className="border-l-2 border-dusk-copper pl-5">
        <p className="font-mono text-mono-size uppercase tracking-[0.14em] text-dusk-ink-secondary">
          {HERO_STAT.label}
        </p>
        <p className="mt-3 text-[clamp(3rem,6vw,4.5rem)] font-medium leading-none tracking-tight text-dusk-ink">
          {HERO_STAT.value}
        </p>
        <Delta>{HERO_STAT.delta}</Delta>
        <Sparkline values={HERO_STAT.spark} width={220} height={44} />
      </div>

      <dl className="mt-10 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label} className="border-t border-dusk-line pt-4">
            <dt className="font-mono text-mono-size uppercase tracking-[0.08em] text-dusk-ink-secondary">
              {s.label}
            </dt>
            <dd className="mt-3">
              <span className="text-[2rem] font-medium leading-none tracking-tight text-dusk-ink">
                {s.value}
              </span>
              {s.delta ? <Delta>{s.delta}</Delta> : null}
              {s.spark ? <Sparkline values={s.spark} /> : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
