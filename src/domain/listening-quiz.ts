import type { Flashcard } from "./workspace.js";
import { LISTENING_VOCABULARY, type PedagogicalDifficulty } from "../data/listening-vocabulary.js";

export type ListeningCard = Pick<Flashcard, "id" | "front" | "back"> & {
  acceptedAnswers?: readonly string[];
  difficulty?: PedagogicalDifficulty;
  category?: string;
};

export const STARTER_DECK: readonly ListeningCard[] = LISTENING_VOCABULARY.map((item) => ({
  id: `starter-${item.id}`,
  front: item.english,
  back: item.translation,
  difficulty: item.difficulty,
  category: item.category,
  ...(item.acceptedAnswers ? { acceptedAnswers: item.acceptedAnswers } : {}),
}));

export function parseManualListeningCards(value: string): ListeningCard[] {
  const lines = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0 || lines.length > 30) return [];

  const cards = lines.map((line, index) => {
    const [front = "", ...answer] = line.split("=");
    const back = answer.join("=").trim();
    return { id: `manual-${index + 1}`, front: front.trim(), back, difficulty: "medium" as const };
  });
  return cards.every(
    ({ front, back }) => front && back && front.length <= 200 && back.length <= 200,
  )
    ? cards
    : [];
}

export function normalizeListeningAnswer(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ");
}

export function buildListeningDeck(flashcards: readonly Flashcard[]): ListeningCard[] {
  const personal = flashcards
    .filter((card) => card.front.trim() && card.back.trim())
    .slice(0, 10)
    .map(({ id, front, back }) => ({ id, front, back }));
  const seen = new Set(personal.map((card) => normalizeListeningAnswer(card.front)));
  const starter = STARTER_DECK.filter((card) => !seen.has(normalizeListeningAnswer(card.front)));
  return [...personal, ...starter];
}

export function shuffleListeningDeck(
  cards: readonly ListeningCard[],
  random: () => number = Math.random,
): ListeningCard[] {
  const shuffled = cards.slice();
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    const current = shuffled[index];
    const destination = shuffled[target];
    if (!current || !destination) continue;
    shuffled[index] = destination;
    shuffled[target] = current;
  }
  return shuffled;
}

export function createListeningRound(
  cards: readonly ListeningCard[],
  limit: number | "all",
  random: () => number = Math.random,
): ListeningCard[] {
  const shuffled = shuffleListeningDeck(cards, random);
  return limit === "all" ? shuffled : shuffled.slice(0, Math.max(0, limit));
}

export function isListeningAnswerCorrect(card: ListeningCard, answer: string): boolean {
  const normalized = normalizeListeningAnswer(answer);
  return normalized.length > 0 && acceptedListeningAnswers(card).includes(normalized);
}

export function acceptedListeningAnswers(card: ListeningCard): string[] {
  return [card.front, card.back, ...(card.acceptedAnswers ?? [])].map(normalizeListeningAnswer);
}
