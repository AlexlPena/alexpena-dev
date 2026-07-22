import { ActMarker } from "@/components/dev/ActMarker";

// Placeholder journey page — Milestone 1 only. Replaced by real sections in
// Milestone 2. Heights map act scroll ranges onto an 800vh document.
export default function Home() {
  return (
    <main>
      {/* Act I — 0-10% */}
      <section style={{ height: "80vh" }} className="flex items-center">
        <ActMarker
          act="Act I · Surface"
          title="Alex Pena"
          note="Placeholder — light world. Dusk 0."
        />
      </section>

      {/* Act II — 10-20% */}
      <section style={{ height: "80vh" }} className="flex items-center">
        <ActMarker
          act="Act II · The Request"
          title="The first dim"
          note="Placeholder — dusk 0.12."
        />
      </section>

      {/* Act III — 20-70%: four 100vh stratum zones (= 400vh) */}
      <section>
        <div style={{ height: "100vh" }} className="flex items-center">
          <ActMarker
            act="Depth 01 · Prompt Engineering · 2023"
            title="Shaping the request"
            note="Placeholder — dusk 0.55."
          />
        </div>
        <div style={{ height: "100vh" }} className="flex items-center">
          <ActMarker
            act="Depth 02 · Context Engineering · 2024"
            title="Gathering mass"
            note="Placeholder — dusk 0.70."
          />
        </div>
        <div style={{ height: "100vh" }} className="flex items-center">
          <ActMarker
            act="Depth 03 · Harness Engineering · 2025"
            title="Entering the machinery"
            note="Placeholder — dusk 0.85."
          />
        </div>
        <div style={{ height: "100vh" }} className="flex items-center">
          <ActMarker
            act="Depth 04 · Loop Engineering · 2026"
            title="Self-driving"
            note="Placeholder — dusk 1."
          />
        </div>
      </section>

      {/* Act IV — 70-82% */}
      <section style={{ height: "96vh" }} className="flex items-center">
        <ActMarker
          act="Act IV · Resolution"
          title="Completed runs"
          note="Placeholder — full dark holds."
        />
      </section>

      {/* Act V — 82-92%: ascent, deliberately empty (fast crossing) */}
      <section style={{ height: "80vh" }} aria-hidden />

      {/* Act VI — 92-100% */}
      <section style={{ height: "64vh" }} className="flex items-center">
        <ActMarker
          act="Act VI · Daylight"
          title="Back at the surface"
          note="Placeholder — light world again."
        />
      </section>
    </main>
  );
}
