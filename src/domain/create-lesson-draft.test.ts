import { describe, expect, it, vi } from "vitest";
import { createLessonDraft } from "./create-lesson-draft";

describe("createLessonDraft", () => {
  it("cria todas as etapas e preserva a duração total", () => {
    vi.spyOn(Date, "now").mockReturnValue(123);
    const draft = createLessonDraft({
      topic: "Simple Past",
      level: "A2",
      duration: 60,
      audience: "Adultos",
      aim: "Ensinar o Simple Past para narrativas curtas.",
      objective: "Relatar atividades do fim de semana.",
      methodology: "inductive",
      practiceTotalControlledId: "",
      practiceSemiControlledId: "",
      extraActivityId: "",
      productionVariant: "product-pitch",
      homeworkLinksText: "",
    });

    expect(draft.id).toBe("draft-123");
    expect(draft.sections.map((section) => section.kind)).toEqual([
      "warm-up",
      "presentation",
      "practice",
      "production",
      "homework",
    ]);
    expect(draft.sections.reduce((total, section) => total + section.minutes, 0)).toBe(60);
  });

  it("limita a duração e cria um objetivo honesto quando o campo está vazio", () => {
    const draft = createLessonDraft({
      topic: "  Present Continuous  ",
      level: "A1",
      duration: 10,
      audience: "",
      aim: "",
      objective: "",
      methodology: "discovery",
      practiceTotalControlledId: "",
      practiceSemiControlledId: "",
      extraActivityId: "",
      productionVariant: "product-pitch",
      homeworkLinksText: "",
    });

    expect(draft.duration).toBe(30);
    expect(draft.title).toBe("Present Continuous");
    expect(draft.aim).toContain("Present Continuous");
    expect(draft.objective).toContain("Present Continuous");
    expect(draft.audience).toBe("Turma de inglês");
  });

  it("recusa um tema vazio", () => {
    expect(() =>
      createLessonDraft({
        topic: "   ",
        level: "B1",
        duration: 60,
        audience: "Adolescentes",
        aim: "",
        objective: "",
        methodology: "deductive",
        practiceTotalControlledId: "",
        practiceSemiControlledId: "",
        extraActivityId: "",
        productionVariant: "product-pitch",
        homeworkLinksText: "",
      }),
    ).toThrow("O tema da aula é obrigatório.");
  });

  it("liga as atividades escolhidas do banco à seção de prática", () => {
    const draft = createLessonDraft({
      topic: "Simple Past",
      level: "A2",
      duration: 60,
      audience: "Adultos",
      aim: "",
      objective: "",
      methodology: "inductive",
      practiceTotalControlledId: "bingo",
      practiceSemiControlledId: "this-or-that",
      extraActivityId: "",
      productionVariant: "product-pitch",
      homeworkLinksText: "",
    });

    const practice = draft.sections.find((section) => section.kind === "practice");
    expect(practice?.activityIds).toEqual(["bingo", "this-or-that"]);
    expect(practice?.guidance).toContain("Bingo");
    expect(practice?.guidance).toContain("This or That");
  });

  it("mantém a orientação padrão de prática quando nenhuma atividade é escolhida", () => {
    const draft = createLessonDraft({
      topic: "Simple Past",
      level: "A2",
      duration: 60,
      audience: "Adultos",
      aim: "",
      objective: "",
      methodology: "inductive",
      practiceTotalControlledId: "",
      practiceSemiControlledId: "",
      extraActivityId: "",
      productionVariant: "product-pitch",
      homeworkLinksText: "",
    });

    const practice = draft.sections.find((section) => section.kind === "practice");
    expect(practice?.activityIds).toBeUndefined();
    expect(practice?.guidance).toBe(
      "Comece com uma atividade controlada e avance para uma prática em duplas.",
    );
  });

  it("adiciona a Extra Activity entre Practice e Production quando escolhida", () => {
    const draft = createLessonDraft({
      topic: "Simple Past",
      level: "A2",
      duration: 60,
      audience: "Adultos",
      aim: "",
      objective: "",
      methodology: "inductive",
      practiceTotalControlledId: "",
      practiceSemiControlledId: "",
      extraActivityId: "singing",
      productionVariant: "product-pitch",
      homeworkLinksText: "",
    });

    expect(draft.sections.map((section) => section.kind)).toEqual([
      "warm-up",
      "presentation",
      "practice",
      "extra-activity",
      "production",
      "homework",
    ]);
    const extraActivity = draft.sections.find((section) => section.kind === "extra-activity");
    expect(extraActivity?.activityIds).toEqual(["singing"]);
    expect(extraActivity?.minutes).toBe(10);
    expect(extraActivity?.guidance).toContain("Singing");
  });

  it("não adiciona a Extra Activity nem altera o total de minutos quando nenhuma é escolhida", () => {
    const draft = createLessonDraft({
      topic: "Simple Past",
      level: "A2",
      duration: 60,
      audience: "Adultos",
      aim: "",
      objective: "",
      methodology: "inductive",
      practiceTotalControlledId: "",
      practiceSemiControlledId: "",
      extraActivityId: "",
      productionVariant: "product-pitch",
      homeworkLinksText: "",
    });

    expect(draft.sections.some((section) => section.kind === "extra-activity")).toBe(false);
    expect(draft.sections.reduce((total, section) => total + section.minutes, 0)).toBe(60);
  });

  it.each([
    ["product-pitch", "pitch"],
    ["creative-task", "criativa"],
    ["problem-solving", "problema"],
  ] as const)("gera a orientação de produção certa para %s", (productionVariant, expectedWord) => {
    const draft = createLessonDraft({
      topic: "Simple Past",
      level: "A2",
      duration: 60,
      audience: "Adultos",
      aim: "",
      objective: "",
      methodology: "inductive",
      practiceTotalControlledId: "",
      practiceSemiControlledId: "",
      extraActivityId: "",
      productionVariant,
      homeworkLinksText: "",
    });

    const production = draft.sections.find((section) => section.kind === "production");
    expect(production?.guidance).toContain(expectedWord);
    expect(production?.guidance).toContain("Simple Past");
  });

  it("anexa apenas links http/https válidos ao Homework", () => {
    const draft = createLessonDraft({
      topic: "Simple Past",
      level: "A2",
      duration: 60,
      audience: "Adultos",
      aim: "",
      objective: "",
      methodology: "inductive",
      practiceTotalControlledId: "",
      practiceSemiControlledId: "",
      extraActivityId: "",
      productionVariant: "product-pitch",
      homeworkLinksText:
        "https://exemplo.com/exercicio-1\njavascript:alert(1)\n  \nhttps://exemplo.com/exercicio-2\nftp://exemplo.com/arquivo",
    });

    const homework = draft.sections.find((section) => section.kind === "homework");
    expect(homework?.links).toEqual([
      "https://exemplo.com/exercicio-1",
      "https://exemplo.com/exercicio-2",
    ]);
  });

  it("não anexa lista de links ao Homework quando nenhum link válido é informado", () => {
    const draft = createLessonDraft({
      topic: "Simple Past",
      level: "A2",
      duration: 60,
      audience: "Adultos",
      aim: "",
      objective: "",
      methodology: "inductive",
      practiceTotalControlledId: "",
      practiceSemiControlledId: "",
      extraActivityId: "",
      productionVariant: "product-pitch",
      homeworkLinksText: "",
    });

    const homework = draft.sections.find((section) => section.kind === "homework");
    expect(homework?.links).toBeUndefined();
  });
});
