import {
  createListeningRound,
  isListeningAnswerCorrect,
  STARTER_DECK,
  type ListeningCard,
} from "./listening-quiz";

export type LocalRoomPhase = "lobby" | "playing" | "finished";

export type LocalRoomDifficulty = "mixed" | "easy" | "medium" | "hard";

export type LocalRoomSettings = {
  difficulty: LocalRoomDifficulty;
  questionCount: 5 | 10 | 15 | "all";
};

export type LocalRoomParticipant = { id: string; displayName: string; score: number };

export type LocalRoomQuestion = { id: string; front: string };

export type LocalRoomState = {
  code: string;
  hostToken: string;
  phase: LocalRoomPhase;
  settings: LocalRoomSettings;
  participants: LocalRoomParticipant[];
  deck: ListeningCard[];
  questionIndex: number;
  answeredParticipantIds: string[];
  createdAt: number;
  updatedAt: number;
};

export type PublicLocalRoomState = {
  code: string;
  phase: LocalRoomPhase;
  settings: LocalRoomSettings;
  participants: LocalRoomParticipant[];
  questionIndex: number;
  totalQuestions: number;
  currentQuestion?: LocalRoomQuestion;
  answeredParticipantIds: string[];
};

const ROOM_CODE = /^[A-HJ-NP-Z2-9]{5}$/;
const MAX_PARTICIPANTS = 30;
export const ROOM_TTL_SECONDS = 60 * 60 * 4;

export function isValidLocalRoomCode(code: string): boolean {
  return ROOM_CODE.test(code.trim().toUpperCase());
}

export function createLocalRoomCode(random: () => number = Math.random): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => alphabet[Math.floor(random() * alphabet.length)]).join("");
}

export function sanitizeDisplayName(value: string): string {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
}

export function localRoomStorageKey(code: string): string {
  return `helena-local-room:${code.toUpperCase()}`;
}

export function createRoom(
  settings: LocalRoomSettings,
  dependencies: { code: string; hostToken: string; now: number },
): LocalRoomState {
  return {
    code: dependencies.code,
    hostToken: dependencies.hostToken,
    phase: "lobby",
    settings,
    participants: [],
    deck: [],
    questionIndex: 0,
    answeredParticipantIds: [],
    createdAt: dependencies.now,
    updatedAt: dependencies.now,
  };
}

export function addLocalParticipant(
  state: LocalRoomState,
  participant: LocalRoomParticipant,
  now: number,
): LocalRoomState {
  if (state.phase !== "lobby" || state.participants.length >= MAX_PARTICIPANTS) return state;
  if (state.participants.some((item) => item.id === participant.id)) return state;
  return { ...state, participants: [...state.participants, participant], updatedAt: now };
}

export function updateRoomSettings(
  state: LocalRoomState,
  settings: Partial<LocalRoomSettings>,
  now: number,
): LocalRoomState {
  if (state.phase !== "lobby") return state;
  return { ...state, settings: { ...state.settings, ...settings }, updatedAt: now };
}

function poolForDifficulty(difficulty: LocalRoomDifficulty): readonly ListeningCard[] {
  return difficulty === "mixed"
    ? STARTER_DECK
    : STARTER_DECK.filter((card) => card.difficulty === difficulty);
}

export function startRoom(
  state: LocalRoomState,
  dependencies: { random?: () => number; now: number },
): LocalRoomState {
  if (state.phase !== "lobby" || state.participants.length === 0) return state;
  const pool = poolForDifficulty(state.settings.difficulty);
  const deck = createListeningRound(pool, state.settings.questionCount, dependencies.random);
  return {
    ...state,
    phase: "playing",
    deck,
    questionIndex: 0,
    answeredParticipantIds: [],
    participants: state.participants.map((participant) => ({ ...participant, score: 0 })),
    updatedAt: dependencies.now,
  };
}

export function submitRoomAnswer(
  state: LocalRoomState,
  dependencies: { participantId: string; questionIndex: number; answer: string; now: number },
): { state: LocalRoomState; correct: boolean } {
  const card = state.deck[dependencies.questionIndex];
  if (
    state.phase !== "playing" ||
    dependencies.questionIndex !== state.questionIndex ||
    !card ||
    state.answeredParticipantIds.includes(dependencies.participantId) ||
    !state.participants.some((item) => item.id === dependencies.participantId)
  ) {
    return { state, correct: false };
  }
  const correct = isListeningAnswerCorrect(card, dependencies.answer);
  const participants = state.participants.map((participant) =>
    participant.id === dependencies.participantId && correct
      ? { ...participant, score: participant.score + 1 }
      : participant,
  );
  return {
    state: {
      ...state,
      participants,
      answeredParticipantIds: [...state.answeredParticipantIds, dependencies.participantId],
      updatedAt: dependencies.now,
    },
    correct,
  };
}

export function advanceRoomQuestion(state: LocalRoomState, now: number): LocalRoomState {
  if (state.phase !== "playing") return state;
  const nextIndex = state.questionIndex + 1;
  if (nextIndex >= state.deck.length) {
    return { ...state, phase: "finished", updatedAt: now };
  }
  return { ...state, questionIndex: nextIndex, answeredParticipantIds: [], updatedAt: now };
}

export function endRoom(state: LocalRoomState, now: number): LocalRoomState {
  if (state.phase === "finished") return state;
  return { ...state, phase: "finished", updatedAt: now };
}

export function toPublicRoomState(state: LocalRoomState): PublicLocalRoomState {
  const card = state.deck[state.questionIndex];
  return {
    code: state.code,
    phase: state.phase,
    settings: state.settings,
    participants: state.participants,
    questionIndex: state.questionIndex,
    totalQuestions: state.deck.length,
    answeredParticipantIds: state.answeredParticipantIds,
    ...(state.phase === "playing" && card
      ? { currentQuestion: { id: card.id, front: card.front } }
      : {}),
  };
}
