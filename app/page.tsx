import { Surface } from "@/components/sections/Surface";
import { Request } from "@/components/sections/Request";
import { Descent } from "@/components/sections/Descent";
import { Outcomes } from "@/components/sections/Outcomes";
import { Daylight } from "@/components/sections/Daylight";
import { JOURNEY_VH } from "@/lib/scroll/journeyLayout";
import { WorldCanvasGate } from "@/components/world/WorldCanvasGate";

// One journey, six acts. Sections are absolutely positioned inside the
// journey so every content block rests exactly on a dusk plateau
// (see lib/scroll/journeyLayout.ts). Acts V (the ascent) is deliberately
// empty — it is a fast crossing, not a place.
export default function Home() {
  return (
    <>
      <WorldCanvasGate />
      <main className="relative z-10" style={{ height: `${JOURNEY_VH}vh` }}>
        <Surface />
        <Request />
        <Descent />
        <Outcomes />
        <Daylight />
      </main>
    </>
  );
}
