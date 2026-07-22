import type { Outcome } from "./types";

// Loosely described real work — enriched into full case studies later
// (spec Section 8). Optional fields stay absent until then.
export const OUTCOMES: readonly Outcome[] = [
  {
    id: "intake-automation",
    title: "Intake automation",
    problem: "Requests arrived from every direction with no routing and no context.",
    result:
      "Unified intake with automatic routing and context capture — hours returned to the team every week.",
  },
  {
    id: "mcp-bridges",
    title: "Custom MCP servers",
    problem: "Internal tools and data were unreachable from AI workflows.",
    result:
      "Model Context Protocol bridges that let assistants act on real systems, safely.",
  },
  {
    id: "adoption",
    title: "AI adoption that sticks",
    problem: "Teams had licenses, not leverage.",
    result:
      "Standards, working sessions, and starter workflows that made AI part of daily execution.",
  },
] as const;
