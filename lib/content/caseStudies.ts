// ============================================================================
// PLACEHOLDER DATA — NOT REAL WORK. DO NOT SHIP TO PRODUCTION.
//
// Every number, client descriptor, and date in this file is invented to
// exercise the figure components at realistic shapes and magnitudes. No real
// employer, colleague, or engagement is described here, and nothing in this
// file has been verified against anything.
//
// Before any of this reaches the public site it must be replaced with work
// Alex can actually stand behind and is permitted to share. The `draft` flag
// below is what the UI keys off to render the DRAFT marker — clearing it is a
// deliberate act, not a cleanup task.
// ============================================================================

export const CASE_STUDIES_ARE_DRAFT = true;

export type FigureNote = {
  readonly id: string;
  readonly caption: string;
  readonly note: string;
};

/** FIG 01 — before/after workflow topology. Node labels only; no metrics. */
export const FLOW_BEFORE = {
  nodes: [
    { id: "b1", label: "Email", x: 28, y: 54 },
    { id: "b2", label: "Form", x: 150, y: 30 },
    { id: "b3", label: "Slack", x: 250, y: 74 },
    { id: "b4", label: "Spreadsheet", x: 44, y: 140 },
    { id: "b5", label: "Ticket", x: 176, y: 176 },
    { id: "b6", label: "Hallway", x: 262, y: 130 },
  ],
  edges: [
    ["b1", "b5"],
    ["b2", "b4"],
    ["b3", "b1"],
    ["b4", "b6"],
    ["b5", "b3"],
    ["b6", "b2"],
  ],
  summary: "6 entry points · 14 handoffs · no record",
} as const;

export const FLOW_AFTER = {
  nodes: [
    { id: "a1", label: "INTAKE" },
    { id: "a2", label: "ROUTE" },
    { id: "a3", label: "ENRICH" },
    { id: "a4", label: "DISPATCH" },
  ],
  summary: "1 path · every run logged · retryable",
} as const;

/** FIG 02 — cycle time per workflow, before and after automation. Hours. */
export type CycleRow = {
  readonly label: string;
  readonly before: number;
  readonly after: number;
};

export const CYCLE_TIME: readonly CycleRow[] = [
  { label: "Request intake", before: 26, after: 2 },
  { label: "Vendor onboarding", before: 40, after: 6 },
  { label: "Report assembly", before: 12, after: 0.5 },
  { label: "Access provisioning", before: 18, after: 1 },
  { label: "QA regression sweep", before: 9, after: 2 },
];

/** FIG 03 — legacy-to-typed migration, percent of modules converted. */
export type MigrationRow = {
  readonly label: string;
  readonly migrated: number;
};

export const MIGRATION: readonly MigrationRow[] = [
  { label: "Billing service", migrated: 82 },
  { label: "Partner API", migrated: 64 },
  { label: "Admin console", migrated: 45 },
  { label: "Reporting jobs", migrated: 31 },
  { label: "Scheduled tasks", migrated: 12 },
];

/** FIG 04 — weekly active users of the internal tooling, one year. */
export type AdoptionPoint = { readonly month: string; readonly users: number };

export const ADOPTION: readonly AdoptionPoint[] = [
  { month: "Jan", users: 40 },
  { month: "Feb", users: 62 },
  { month: "Mar", users: 95 },
  { month: "Apr", users: 130 },
  { month: "May", users: 190 },
  { month: "Jun", users: 245 },
  { month: "Jul", users: 300 },
  { month: "Aug", users: 355 },
  { month: "Sep", users: 420 },
  { month: "Oct", users: 480 },
  { month: "Nov", users: 545 },
  { month: "Dec", users: 610 },
];

/** FIG 05 — automation runs by weekday and hour bucket. */
export const RUN_HOURS = ["00", "03", "06", "09", "12", "15", "18", "21"] as const;
export const RUN_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

// Rows follow RUN_DAYS, columns follow RUN_HOURS. The 03:00 column is the
// nightly batch; the weekday 09–15 block is interactive traffic.
export const RUN_VOLUME: readonly (readonly number[])[] = [
  [4, 62, 18, 140, 156, 132, 44, 12],
  [5, 58, 20, 148, 162, 138, 40, 10],
  [4, 61, 19, 152, 158, 141, 47, 14],
  [6, 59, 22, 145, 165, 136, 42, 11],
  [5, 64, 21, 138, 149, 118, 35, 9],
  [3, 55, 8, 22, 26, 19, 10, 5],
  [2, 57, 7, 18, 21, 16, 8, 4],
];

/** KPI row. `spark` is a 12-point trend; the last point is the current period. */
export type Stat = {
  readonly label: string;
  readonly value: string;
  readonly delta?: string;
  readonly spark?: readonly number[];
};

export const HERO_STAT = {
  label: "Hours reclaimed each week",
  value: "310",
  delta: "+48 vs last quarter",
  spark: [96, 118, 132, 150, 171, 188, 204, 226, 251, 268, 289, 310],
} as const;

export const STATS: readonly Stat[] = [
  {
    label: "Workflows in production",
    value: "24",
    delta: "+7 this year",
    spark: [8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 24],
  },
  {
    label: "Manual steps removed",
    value: "1,180",
    delta: "+310 this year",
  },
  {
    label: "First-pass run success",
    value: "92%",
    delta: "+6 pts since June",
    spark: [78, 79, 81, 80, 83, 85, 84, 87, 88, 90, 91, 92],
  },
];
