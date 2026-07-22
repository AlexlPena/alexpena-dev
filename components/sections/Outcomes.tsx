import { OUTCOMES } from "@/lib/content/outcomes";
import { Readout } from "@/components/ui/Readout";
import { topVhForRest, REST_POINTS } from "@/lib/scroll/journeyLayout";

// Act IV (rest p=0.78): the signal resolves into completed runs.
export function Outcomes() {
  return (
    <section
      aria-label="Completed runs"
      className="absolute inset-x-0 flex h-screen items-center"
      style={{ top: `${topVhForRest(REST_POINTS.outcomes)}vh` }}
    >
      <div className="mx-auto w-full max-w-3xl px-6">
        <h2 className="sr-only">Completed runs</h2>
        <Readout>Act IV · Completed runs</Readout>
        <div className="mt-8 space-y-6">
          {OUTCOMES.map((o) => (
            <article
              key={o.id}
              className="border-l border-dusk-line pl-5"
            >
              <h3 className="text-title leading-snug text-dusk-ink">
                {o.title}
              </h3>
              <p className="mt-2 text-small leading-relaxed text-dusk-ink-secondary">
                {o.problem}
              </p>
              <p className="mt-1 text-small leading-relaxed text-dusk-ink">
                {o.result}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
