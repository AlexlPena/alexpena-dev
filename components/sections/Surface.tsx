import { IDENTITY } from "@/lib/content/identity";
import { Readout } from "@/components/ui/Readout";
import { SignalDot } from "@/components/ui/SignalDot";
import { topVhForRest, REST_POINTS } from "@/lib/scroll/journeyLayout";

// Act I (rest p=0): name, role, tagline, the signal at rest.
export function Surface() {
  return (
    <section
      aria-label="Introduction"
      className="absolute inset-x-0 flex h-screen items-center pointer-events-none"
      style={{ top: `${topVhForRest(REST_POINTS.actI)}vh` }}
    >
      <div className="mx-auto w-full max-w-3xl px-6">
        <div className="flex items-center gap-3">
          <Readout>{IDENTITY.role}</Readout>
          <SignalDot />
        </div>
        <h1 className="mt-4 text-hero leading-none tracking-tight text-dusk-ink">
          {IDENTITY.name}
        </h1>
        <p className="mt-6 max-w-xl text-body leading-relaxed text-dusk-ink-secondary">
          {IDENTITY.tagline}
        </p>
        <p className="mt-16 font-mono text-mono-size uppercase tracking-[0.08em] text-dusk-ink-secondary">
          {IDENTITY.scrollHint} <span aria-hidden>↓</span>
        </p>
      </div>
    </section>
  );
}
