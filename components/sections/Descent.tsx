import { STRATA } from "@/lib/content/strata";
import { Readout } from "@/components/ui/Readout";
import { Reveal } from "@/components/figures/Reveal";
import { ShapingFigure } from "@/components/figures/strata/ShapingFigure";
import { MassFigure } from "@/components/figures/strata/MassFigure";
import { MachineryFigure } from "@/components/figures/strata/MachineryFigure";
import { LoopFigure } from "@/components/figures/strata/LoopFigure";
import { topVhForRest, REST_POINTS } from "@/lib/scroll/journeyLayout";

const STRATUM_REST = [
  REST_POINTS.stratum1,
  REST_POINTS.stratum2,
  REST_POINTS.stratum3,
  REST_POINTS.stratum4,
] as const;

// One diagram per discipline, in stratum order. These are arguments, not
// dashboards: no measured quantities, so nothing here can misrepresent work.
const FIGURES = [ShapingFigure, MassFigure, MachineryFigure, LoopFigure] as const;

// Act III (rest p=0.26/0.40/0.54/0.70): four caption blocks, each paired with
// the figure for its discipline. The column split is deliberately uneven —
// text in 5 of 12, figure in 6, one empty column between — because the rest of
// the journey is a centred single column and these need to read differently.
export function Descent() {
  return (
    <>
      {STRATA.map((stratum, i) => {
        const Figure = FIGURES[i];
        return (
          <section
            key={stratum.id}
            id={stratum.id}
            aria-label={`${stratum.era}, ${stratum.year}`}
            className="fig-section absolute inset-x-0 flex h-screen items-center"
            style={{ top: `${topVhForRest(STRATUM_REST[i])}vh` }}
          >
            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-x-10 gap-y-10 px-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <Readout>
                  Depth {stratum.depth} · {stratum.era} · {stratum.year}
                </Readout>
                <h2 className="mt-4 text-display leading-tight text-dusk-ink">
                  {stratum.title}
                </h2>
                <p className="mt-5 max-w-xl text-body leading-relaxed text-dusk-ink-secondary">
                  {stratum.body}
                </p>
              </div>

              <Reveal
                rest={STRATUM_REST[i]}
                className="lg:col-span-6 lg:col-start-7"
              >
                <Figure />
              </Reveal>
            </div>
          </section>
        );
      })}
    </>
  );
}
