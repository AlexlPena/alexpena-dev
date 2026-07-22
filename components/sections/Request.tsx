import { IDENTITY } from "@/lib/content/identity";
import { Readout } from "@/components/ui/Readout";
import { topVhForRest, REST_POINTS } from "@/lib/scroll/journeyLayout";

// Act II (rest p=0.16): the editorial beat before the descent.
export function Request() {
  return (
    <section
      aria-label="The request"
      className="absolute inset-x-0 flex h-screen items-center pointer-events-none"
      style={{ top: `${topVhForRest(REST_POINTS.actII)}vh` }}
    >
      <div className="mx-auto w-full max-w-2xl px-6">
        <h2 className="sr-only">The request</h2>
        <Readout>Act II · {IDENTITY.request.heading}</Readout>
        <div className="mt-6 space-y-5">
          {IDENTITY.request.paragraphs.map((text, i) => (
            <p key={i} className="text-body leading-relaxed text-dusk-ink">
              {text}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
