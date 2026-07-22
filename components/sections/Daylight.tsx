import { CONTACT } from "@/lib/content/contact";
import { TOOLS } from "@/lib/content/tools";
import { Readout } from "@/components/ui/Readout";
import { SignalDot } from "@/components/ui/SignalDot";
import { topVhForRest, REST_POINTS } from "@/lib/scroll/journeyLayout";

// Act VI (rest p=1): calm close, mirror of Act I.
export function Daylight() {
  return (
    <section
      aria-label="About and contact"
      className="absolute inset-x-0 flex h-screen items-center pointer-events-none"
      style={{ top: `${topVhForRest(REST_POINTS.actVI)}vh` }}
    >
      <div className="mx-auto w-full max-w-2xl px-6">
        <h2 className="sr-only">About and contact</h2>
        <div className="flex items-center gap-3">
          <Readout>Act VI · {CONTACT.heading}</Readout>
          <SignalDot />
        </div>
        <p className="mt-6 text-body leading-relaxed text-dusk-ink">
          {CONTACT.note}
        </p>
        <ul className="mt-10 flex flex-wrap gap-x-4 gap-y-2" aria-label="Tools">
          {TOOLS.map((tool) => (
            <li
              key={tool}
              className="font-mono text-mono-size uppercase tracking-[0.08em] text-dusk-ink-secondary"
            >
              {tool}
            </li>
          ))}
        </ul>
        <div className="mt-12 flex flex-wrap gap-6">
          {CONTACT.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="pointer-events-auto text-body text-dusk-ink underline decoration-dusk-copper underline-offset-4 hover:text-dusk-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dusk-copper"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
