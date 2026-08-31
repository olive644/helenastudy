import { describe, expect, it } from "vitest";
import type { Flashcard } from "../domain/workspace";
import {
  acceptedListeningAnswers,
  buildListeningDeck,
  createListeningRound,
  isListeningAnswerCorrect,
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

  it("embaralha a rodada sem repetir palavras", () => {
    const deck = buildListeningDeck([]);
    const round = createListeningRound(deck, 10, () => 0.42);
    expect(round).toHaveLength(10);
    expect(new Set(round.map((item) => item.id)).size).toBe(10);
  });

  it("respeita os limites de cinco, quinze e todas", () => {
    const deck = buildListeningDeck([]);
    expect(createListeningRound(deck, 5)).toHaveLength(5);
    expect(createListeningRound(deck, 15)).toHaveLength(15);
    expect(createListeningRound(deck, "all")).toHaveLength(30);
  });

  it("aceita equivalências, acentos e pontuação sem aproximação semântica", () => {
    const journey = {
      id: "journey",
      front: "Journey",
      back: "Jornada",
      acceptedAnswers: ["Viagem"],
    };
    expect(isListeningAnswerCorrect(journey, "  VIÁGEM! ")).toBe(true);
    expect(isListeningAnswerCorrect(journey, "viajante")).toBe(false);
  });
});
