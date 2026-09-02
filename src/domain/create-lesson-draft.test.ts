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
      }),
    ).toThrow("O tema da aula é obrigatório.");
  });
});
