import type { Flashcard } from "./workspace";

export type ListeningCard = Pick<Flashcard, "id" | "front" | "back"> & {
  acceptedAnswers?: readonly string[];
};

const STARTER_DECK: readonly ListeningCard[] = [
  { id: "starter-school", front: "School", back: "Escola" },
  { id: "starter-family", front: "Family", back: "Família" },
  { id: "starter-friend", front: "Friend", back: "Amigo", acceptedAnswers: ["Amiga"] },
  { id: "starter-water", front: "Water", back: "Água" },
  { id: "starter-house", front: "House", back: "Casa" },
  { id: "starter-library", front: "Library", back: "Biblioteca" },
  { id: "starter-kitchen", front: "Kitchen", back: "Cozinha" },
  { id: "starter-weather", front: "Weather", back: "Clima", acceptedAnswers: ["Tempo"] },
  { id: "starter-journey", front: "Journey", back: "Jornada", acceptedAnswers: ["Viagem"] },
  { id: "starter-answer", front: "Answer", back: "Resposta" },
  { id: "starter-knowledge", front: "Knowledge", back: "Conhecimento" },
  { id: "starter-language", front: "Language", back: "Idioma", acceptedAnswers: ["Língua"] },
  { id: "starter-thought", front: "Thought", back: "Pensamento" },
  { id: "starter-purpose", front: "Purpose", back: "Propósito", acceptedAnswers: ["Objetivo"] },
  { id: "starter-courage", front: "Courage", back: "Coragem" },
  { id: "starter-improve", front: "Improve", back: "Melhorar" },
  { id: "starter-achieve", front: "Achieve", back: "Alcançar", acceptedAnswers: ["Conquistar"] },
  { id: "starter-behavior", front: "Behavior", back: "Comportamento" },
  { id: "starter-awareness", front: "Awareness", back: "Consciência" },
  { id: "starter-although", front: "Although", back: "Embora" },
  { id: "starter-throughout", front: "Throughout", back: "Ao longo de" },
  { id: "starter-likelihood", front: "Likelihood", back: "Probabilidade" },
  { id: "starter-nevertheless", front: "Nevertheless", back: "No entanto" },
  {
    id: "starter-straightforward",
    front: "Straightforward",
    back: "Direto",
    acceptedAnswers: ["Simples", "Claro"],
  },
  {
    id: "starter-thoroughly",
    front: "Thoroughly",
    back: "Completamente",
    acceptedAnswers: ["Minuciosamente"],
  },
  {
    id: "starter-entrepreneur",
    front: "Entrepreneur",
    back: "Empreendedor",
    acceptedAnswers: ["Empreendedora"],
  },
  { id: "starter-acknowledge", front: "Acknowledge", back: "Reconhecer" },
  {
    id: "starter-misleading",
    front: "Misleading",
    back: "Enganoso",
    acceptedAnswers: ["Enganosa"],
  },
  { id: "starter-sustainability", front: "Sustainability", back: "Sustentabilidade" },
  { id: "starter-unprecedented", front: "Unprecedented", back: "Sem precedentes" },
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
  const personal = flashcards
    .filter((card) => card.front.trim() && card.back.trim())
    .slice(0, 10)
    .map(({ id, front, back }) => ({ id, front, back }));
  const seen = new Set(personal.map((card) => normalizeListeningAnswer(card.front)));
  const starter = STARTER_DECK.filter((card) => !seen.has(normalizeListeningAnswer(card.front)));
  return [...personal, ...starter];
}

export function acceptedListeningAnswers(card: ListeningCard): string[] {
  return [card.front, card.back, ...(card.acceptedAnswers ?? [])].map(normalizeListeningAnswer);
}
