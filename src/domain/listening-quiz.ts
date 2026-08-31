import type { Flashcard } from "./workspace";

export type ListeningCard = Pick<Flashcard, "id" | "front" | "back">;

const STARTER_DECK: readonly ListeningCard[] = [
  { id: "place-school", front: "School", back: "Escola" },
  { id: "place-library", front: "Library", back: "Biblioteca" },
  { id: "place-cinema", front: "Cinema", back: "Cinema" },
  { id: "place-post-office", front: "Post office", back: "Correios" },
  { id: "place-shopping-mall", front: "Shopping mall", back: "Shopping" },
];

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
  const usable = flashcards
    .filter((card) => card.front.trim() && card.back.trim())
    .slice(0, 10)
    .map(({ id, front, back }) => ({ id, front, back }));
  return usable.length >= 2 ? usable : [...STARTER_DECK];
}
