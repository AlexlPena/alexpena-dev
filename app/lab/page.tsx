import type { Metadata } from "next";
import { FigureFrame, FigureTable } from "@/components/figures/FigureFrame";
import { FlowDiagram } from "@/components/figures/FlowDiagram";
import { CycleTimeDumbbell } from "@/components/figures/CycleTimeDumbbell";
import { MigrationBars } from "@/components/figures/MigrationBars";
import { AdoptionArea } from "@/components/figures/AdoptionArea";
import { RunHeatmap } from "@/components/figures/RunHeatmap";
import { StatRow } from "@/components/figures/StatRow";
import {
  ADOPTION,
  CASE_STUDIES_ARE_DRAFT,
  CYCLE_TIME,
  HERO_STAT,
  MIGRATION,
  RUN_DAYS,
  RUN_HOURS,
  RUN_VOLUME,
  STATS,
} from "@/lib/content/caseStudies";

export const metadata: Metadata = {
  title: "Figure lab — alexpena.dev",
  description: "Internal review surface for case-study figures.",
  robots: { index: false, follow: false },
};

const pct = (before: number, after: number) =>
  `−${Math.round(((before - after) / before) * 100)}%`;

function FigureSet() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-20 px-6">
      <FigureFrame
        index="01"
        title="Intake topology"
        note="The signature plate: the same work drawn as it arrives and as it runs. Geometry carries the argument — a tangle against a rail — and copper marks only the path that ends up existing."
      >
        <FlowDiagram />
      </FigureFrame>

      <FigureFrame
        index="02"
        title="Cycle time, before / after"
        note="A dumbbell is the correct form for before-and-after per item: one hue, two shades, the connector showing the distance travelled."
        table={
          <FigureTable
            head={["Workflow", "Before (h)", "After (h)", "Change"]}
            rows={CYCLE_TIME.map((r) => [
              r.label,
              String(r.before),
              String(r.after),
              pct(r.before, r.after),
            ])}
          />
        }
      >
        <CycleTimeDumbbell />
      </FigureFrame>

      <FigureFrame
        index="03"
        title="Legacy to typed, by module"
        note="Part-to-whole, laid out horizontally because the module names are long. Segments are separated by a 2px surface gap rather than a stroke."
        table={
          <FigureTable
            head={["Module", "Migrated", "Remaining"]}
            rows={MIGRATION.map((r) => [
              r.label,
              `${r.migrated}%`,
              `${100 - r.migrated}%`,
            ])}
          />
        }
      >
        <MigrationBars />
      </FigureFrame>

      <FigureFrame
        index="04"
        title="Adoption over twelve months"
        note="A single series, so no legend box — the caption names what is plotted. The fill is a 10% wash and only the endpoint is labelled."
        table={
          <FigureTable
            head={["Month", "Weekly active users"]}
            rows={ADOPTION.map((d) => [d.month, String(d.users)])}
          />
        }
      >
        <AdoptionArea />
      </FigureFrame>

      <FigureFrame
        index="05"
        title="Run volume by weekday and hour"
        note="Magnitude across a grid, on the validated single-hue ramp. The 03:00 column is the nightly batch; weekday middays are interactive traffic."
        table={
          <FigureTable
            head={["Day", ...RUN_HOURS.map((h) => `${h}:00`)]}
            rows={RUN_DAYS.map((d, r) => [d, ...RUN_VOLUME[r].map(String)])}
          />
        }
      >
        <RunHeatmap />
      </FigureFrame>

      <FigureFrame
        index="06"
        title="Headline figures"
        note="Numbers that are their own chart. One hero figure per view, in the same sans as the rest of the page, with the trend as a sparkline rather than a second plot."
        wide={false}
        table={
          <FigureTable
            head={["Measure", "Value", "Change"]}
            rows={[
              [HERO_STAT.label, HERO_STAT.value, HERO_STAT.delta],
              ...STATS.map((s) => [s.label, s.value, s.delta ?? "—"]),
            ]}
          />
        }
      >
        <StatRow />
      </FigureFrame>
    </div>
  );
}

function Panel({ surface }: { surface: "light" | "dark" }) {
  return (
    <section
      data-surface={surface}
      className="bg-dusk-bg py-20"
      aria-label={`Figures on the ${surface} pole`}
    >
      <div className="mx-auto mb-16 w-full max-w-4xl px-6">
        <p className="font-mono text-mono-size uppercase tracking-[0.14em] text-dusk-copper">
          {surface === "light" ? "Light pole · dusk 0" : "Dark pole · dusk 1"}
        </p>
      </div>
      <FigureSet />
    </section>
  );
}

export default function FigureLab() {
  return (
    <main>
      {CASE_STUDIES_ARE_DRAFT ? (
        <div
          data-surface="light"
          className="border-b-2 border-dusk-copper bg-dusk-bg px-6 py-4"
        >
          <div className="mx-auto w-full max-w-4xl">
            <p className="font-mono text-mono-size uppercase tracking-[0.14em] text-dusk-copper">
              Draft · placeholder data
            </p>
            <p className="mt-2 max-w-2xl text-small leading-relaxed text-dusk-ink-secondary">
              Every value on this page is invented to exercise the figures. No
              real engagement is described. This route is noindexed and is not
              linked from the site.
            </p>
          </div>
        </div>
      ) : null}

      <Panel surface="light" />
      <Panel surface="dark" />
    </main>
  );
}
