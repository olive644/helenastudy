import { describe, expect, it } from "vitest";
import type { Flashcard } from "../domain/workspace";
import { buildListeningDeck, normalizeListeningAnswer } from "../domain/listening-quiz";

const card = (id: string, front: string, back: string): Flashcard => ({
  id,
  subjectId: "english",
  front,
  back,
  intervalDays: 0,
  nextReview: "2026-08-31",
});

describe("quiz de escuta", () => {
  it("normaliza acentos, caixa e espaços nas respostas", () => {
    expect(normalizeListeningAnswer("  CORREIOS! ")).toBe("correios");
  });

  it("usa flashcards da matéria quando há conteúdo suficiente", () => {
    const deck = buildListeningDeck([
      card("1", "School", "Escola"),
      card("2", "Library", "Biblioteca"),
    ]);
    expect(deck.map((item) => item.front)).toEqual(["School", "Library"]);
  });

  it("oferece vocabulário inicial quando faltam flashcards", () => {
    expect(buildListeningDeck([])).toHaveLength(5);
  });
});
