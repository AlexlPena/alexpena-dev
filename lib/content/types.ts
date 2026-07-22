export type Stratum = {
  readonly id: string;
  readonly depth: string; // "01".."04"
  readonly era: string; // discipline name
  readonly year: string;
  readonly title: string;
  readonly body: string;
};

export type Outcome = {
  readonly id: string;
  readonly title: string;
  readonly problem: string;
  readonly result: string;
  // Optional enrichment for future case studies — absent for now.
  readonly stack?: readonly string[];
  readonly metric?: string;
  readonly link?: string;
};

export type ContactLink = {
  readonly label: string;
  readonly href: string;
};
