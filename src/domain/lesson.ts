export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const METHODOLOGIES = ["inductive", "deductive", "discovery", "rule-first"] as const;
export type Methodology = (typeof METHODOLOGIES)[number];

export type LessonInput = {
  topic: string;
  level: CefrLevel;
  duration: number;
  audience: string;
  aim: string;
  objective: string;
  methodology: Methodology;
  practiceTotalControlledId: string;
  practiceSemiControlledId: string;
  extraActivityId: string;
};

export type LessonSectionKind =
  "warm-up" | "presentation" | "practice" | "extra-activity" | "production" | "homework";

export type LessonSection = {
  kind: LessonSectionKind;
  title: string;
  minutes: number;
  guidance: string;
  activityIds?: string[];
};

export type LessonDraft = {
  id: string;
  title: string;
  level: CefrLevel;
  duration: number;
  audience: string;
  aim: string;
  objective: string;
  methodology: Methodology;
  sections: LessonSection[];
};

export const METHODOLOGY_LABELS: Record<Methodology, string> = {
  inductive: "Indutiva",
  deductive: "Dedutiva",
  discovery: "Descoberta guiada",
  "rule-first": "Regra primeiro",
};
