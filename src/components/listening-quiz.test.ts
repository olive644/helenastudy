import { describe, expect, it } from "vitest";
import type { Flashcard } from "../domain/workspace";
import {
  acceptedListeningAnswers,
  buildListeningDeck,
  normalizeListeningAnswer,
} from "../domain/listening-quiz";

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
    expect(deck.slice(0, 2).map((item) => item.front)).toEqual(["School", "Library"]);
    expect(deck.filter((item) => item.front === "School")).toHaveLength(1);
  });

  it("oferece vocabulário amplo quando faltam flashcards", () => {
    expect(buildListeningDeck([])).toHaveLength(30);
  });

  it("aceita traduções equivalentes cadastradas", () => {
    expect(
      acceptedListeningAnswers({
        id: "journey",
        front: "Journey",
        back: "Jornada",
        acceptedAnswers: ["Viagem"],
      }),
    ).toEqual(["journey", "jornada", "viagem"]);
  });
});
