import { FLOW_BEFORE, FLOW_AFTER } from "@/lib/content/caseStudies";

const NODE_W = 82;
const NODE_H = 28;

const byId = new Map<string, { x: number; y: number }>(
  FLOW_BEFORE.nodes.map((n) => [n.id, { x: n.x, y: n.y }])
);
const centre = (id: string) => {
  const n = byId.get(id);
  if (!n) throw new Error(`FlowDiagram: edge references unknown node "${id}"`);
  return { x: n.x + NODE_W / 2, y: n.y + NODE_H / 2 };
};

// The signature figure. Left is the mess as found — six entry points, edges
// crossing, nothing in order. Right is the same work as one rail. The contrast
// is carried by geometry (tangle vs line), with copper marking only the path
// that ends up existing; everything prior is de-emphasis gray.
export function FlowDiagram() {
  return (
    <svg
      viewBox="0 0 760 300"
      className="w-full"
      role="img"
      aria-label="Before: six disconnected intake points with fourteen crossing handoffs. After: a single logged pipeline of intake, route, enrich, dispatch."
    >
      <title>Intake topology, before and after</title>

      {/* ---------- BEFORE ---------- */}
      <text
        x="20"
        y="18"
        className="fill-[var(--fig-mute)] font-mono"
        fontSize="11"
        letterSpacing="1.6"
      >
        BEFORE
      </text>

      <g stroke="var(--fig-mute)" strokeWidth="1" fill="none" opacity="0.75">
        {FLOW_BEFORE.edges.map(([from, to]) => {
          const a = centre(from);
          const b = centre(to);
          return <line key={`${from}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
        })}
      </g>

      {FLOW_BEFORE.nodes.map((n) => (
        <g key={n.id}>
          <rect
            x={n.x}
            y={n.y}
            width={NODE_W}
            height={NODE_H}
            rx="2"
            fill="var(--surface)"
            stroke="var(--fig-mute)"
            strokeWidth="1"
          />
          <text
            x={n.x + NODE_W / 2}
            y={n.y + NODE_H / 2 + 4}
            textAnchor="middle"
            className="fill-[var(--ink-secondary)] font-mono"
            fontSize="10"
          >
            {n.label}
          </text>
        </g>
      ))}

      <text
        x="20"
        y="272"
        className="fill-[var(--ink-secondary)] font-mono"
        fontSize="10"
        letterSpacing="0.6"
      >
        {FLOW_BEFORE.summary}
      </text>

      {/* ---------- divider ---------- */}
      <line x1="380" y1="8" x2="380" y2="292" stroke="var(--line)" strokeWidth="1" />

      {/* ---------- AFTER ---------- */}
      <text
        x="430"
        y="18"
        className="fill-[var(--copper)] font-mono"
        fontSize="11"
        letterSpacing="1.6"
      >
        AFTER
      </text>

      {/* The rail. One line, one direction. */}
      <line
        x1="430"
        y1="153"
        x2="738"
        y2="153"
        stroke="var(--copper)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {FLOW_AFTER.nodes.map((n, i) => {
        const x = 430 + i * 82;
        return (
          <g key={n.id}>
            <rect
              x={x}
              y={136}
              width={62}
              height={34}
              rx="2"
              fill="var(--surface)"
              stroke="var(--copper)"
              strokeWidth="1.5"
            />
            <text
              x={x + 31}
              y={157}
              textAnchor="middle"
              className="fill-[var(--ink)] font-mono"
              fontSize="9"
              letterSpacing="0.4"
            >
              {n.label}
            </text>
          </g>
        );
      })}

      {/* Terminal marker: >=8px with a 2px surface ring, per mark spec. */}
      <circle cx="738" cy="153" r="5" fill="var(--copper)" stroke="var(--surface)" strokeWidth="2" />

      <text
        x="430"
        y="272"
        className="fill-[var(--ink-secondary)] font-mono"
        fontSize="10"
        letterSpacing="0.6"
      >
        {FLOW_AFTER.summary}
      </text>
    </svg>
  );
}
