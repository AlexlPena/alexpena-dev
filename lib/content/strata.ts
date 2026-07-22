import type { Stratum } from "./types";

export const STRATA: readonly Stratum[] = [
  {
    id: "prompt-engineering",
    depth: "01",
    era: "Prompt Engineering",
    year: "2023",
    title: "Shaping the request",
    body: "Where it started: turning raw intent into instructions a model can execute. Precision in, precision out — the craft of saying exactly what you mean.",
  },
  {
    id: "context-engineering",
    depth: "02",
    era: "Context Engineering",
    year: "2024",
    title: "Gathering mass",
    body: "A prompt is only as good as what surrounds it. Knowledge bases, retrieval, structure — the signal gathers the context it needs to act on real business truth.",
  },
  {
    id: "harness-engineering",
    depth: "03",
    era: "Harness Engineering",
    year: "2025",
    title: "Entering the machinery",
    body: "Models don't ship value; systems do. Tools, guardrails, MCP servers, evaluation loops — the machinery that turns a capable model into dependable software.",
  },
  {
    id: "loop-engineering",
    depth: "04",
    era: "Loop Engineering",
    year: "2026",
    title: "Self-driving",
    body: "The system no longer waits for instructions. Agents plan, execute, verify, and correct — running while nobody watches. The work now is designing the loops, and knowing when a human belongs inside one.",
  },
] as const;
