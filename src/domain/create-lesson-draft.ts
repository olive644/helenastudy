import { findActivity } from "./activity-bank";
import type { LessonDraft, LessonInput, LessonSection, ProductionVariant } from "./lesson";

const WEIGHTS = [0.15, 0.25, 0.3, 0.25, 0.05] as const;

const PRODUCTION_GUIDANCE: Record<ProductionVariant, (topic: string) => string> = {
  "product-pitch": (topic) =>
    `Peça que os alunos apresentem um pitch curto usando ${topic} para vender uma ideia ou produto.`,
  "creative-task": (topic) =>
    `Proponha uma tarefa criativa (história, cena ou anúncio) em que os alunos usem ${topic} livremente.`,
  "problem-solving": (topic) =>
    `Apresente um problema real para os alunos resolverem em grupo usando ${topic}.`,
};

function allocateMinutes(duration: number): number[] {
  const safeDuration = Math.max(30, Math.min(180, Math.round(duration)));
  const minutes = WEIGHTS.map((weight) => Math.max(1, Math.floor(safeDuration * weight)));
  const assigned = minutes.reduce((total, value) => total + value, 0);
  minutes[3] = (minutes[3] ?? 1) + safeDuration - assigned;
  return minutes;
}

export function createLessonDraft(input: LessonInput): LessonDraft {
  const topic = input.topic.trim();
  if (!topic) {
    throw new Error("O tema da aula é obrigatório.");
  }

  const duration = Math.max(30, Math.min(180, Math.round(input.duration)));
  const [warmUp = 1, presentation = 1, practice = 1, production = 1, homework = 1] =
    allocateMinutes(duration);
  const aim = input.aim.trim() || `Ensinar ${topic} de forma contextualizada para a turma.`;
  const objective =
    input.objective.trim() || `Usar ${topic} em uma situação comunicativa adequada ao nível.`;

  const practiceActivities = [
    findActivity(input.practiceTotalControlledId),
    findActivity(input.practiceSemiControlledId),
  ].filter((activity): activity is NonNullable<typeof activity> => activity !== undefined);
  const practiceGuidance =
    practiceActivities.length > 0
      ? `Aplique ${practiceActivities.map((activity) => activity.name).join(" e depois ")} para praticar ${topic}.`
      : "Comece com uma atividade controlada e avance para uma prática em duplas.";
  const practiceActivityIds = practiceActivities.map((activity) => activity.id);

  const extraActivity = findActivity(input.extraActivityId);

  const productionGuidance = PRODUCTION_GUIDANCE[input.productionVariant](topic);

  const sections: LessonSection[] = [
    {
      kind: "warm-up",
      title: "Warm-up",
      minutes: warmUp,
      guidance: `Ative o conhecimento prévio da turma com uma pergunta curta relacionada a ${topic}.`,
    },
    {
      kind: "presentation",
      title: "Apresentação",
      minutes: presentation,
      guidance: `Apresente ${topic} usando a abordagem escolhida e exemplos contextualizados.`,
    },
    {
      kind: "practice",
      title: "Prática",
      minutes: practice,
      guidance: practiceGuidance,
      ...(practiceActivityIds.length > 0 ? { activityIds: practiceActivityIds } : {}),
    },
    ...(extraActivity
      ? [
          {
            kind: "extra-activity" as const,
            title: "Extra Activity",
            minutes: extraActivity.time,
            guidance: `Use ${extraActivity.name} se sobrar tempo antes da produção.`,
            activityIds: [extraActivity.id],
          },
        ]
      : []),
    {
      kind: "production",
      title: "Produção",
      minutes: production,
      guidance: productionGuidance,
    },
    {
      kind: "homework",
      title: "Homework",
      minutes: homework,
      guidance: "Finalize com uma tarefa breve que retome o objetivo principal da aula.",
    },
  ];

  return {
    id: `draft-${Date.now()}`,
    title: topic,
    level: input.level,
    duration,
    audience: input.audience.trim() || "Turma de inglês",
    aim,
    objective,
    methodology: input.methodology,
    sections,
  };
}
