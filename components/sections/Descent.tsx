import { STRATA } from "@/lib/content/strata";
import { Readout } from "@/components/ui/Readout";
import { topVhForRest, REST_POINTS } from "@/lib/scroll/journeyLayout";

const STRATUM_REST = [
  REST_POINTS.stratum1,
  REST_POINTS.stratum2,
  REST_POINTS.stratum3,
  REST_POINTS.stratum4,
] as const;

// Act III (rest p=0.26/0.40/0.54/0.70): four caption blocks. The 3D world
// arrives behind these in Milestone 3 — the DOM captions ARE the mobile
// and reduced-motion story, so they carry the full narrative on their own.
export function Descent() {
  return (
    <>
      {STRATA.map((stratum, i) => (
        <section
          key={stratum.id}
          id={stratum.id}
          aria-label={`${stratum.era}, ${stratum.year}`}
          className="absolute inset-x-0 flex h-screen items-center"
          style={{ top: `${topVhForRest(STRATUM_REST[i])}vh` }}
        >
          <div className="mx-auto w-full max-w-2xl px-6">
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
        </section>
      ))}
    </>
  );
}
