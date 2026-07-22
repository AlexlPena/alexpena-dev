import type { ContactLink } from "./types";

export const CONTACT = {
  heading: "Back at the surface",
  note: "I've been building with AI since 2023 — from first prompts to autonomous loops. I work where engineering meets adoption: building the system, then making sure the team actually uses it.",
  links: [
    { label: "alex@alexpena.dev", href: "mailto:alex@alexpena.dev" },
    // TODO(alex): add GitHub + LinkedIn URLs before ship (M6 gate) — do not
    // invent them. Rendering code must handle this list growing.
  ] as readonly ContactLink[],
} as const;
