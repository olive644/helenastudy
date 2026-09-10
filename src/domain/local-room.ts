import {
  createListeningRound,
  isListeningAnswerCorrect,
  STARTER_DECK,
  type ListeningCard,
} from "./listening-quiz.js";

export type LocalRoomPhase = "lobby" | "playing" | "finished";

export type LocalRoomDifficulty = "mixed" | "easy" | "medium" | "hard";

export type LocalRoomRoundSeconds = 15 | 30 | 45 | 60;

export type LocalRoomSettings = {
  difficulty: LocalRoomDifficulty;
  questionCount: 5 | 10 | 15 | "all";
  roundSeconds: LocalRoomRoundSeconds;
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
  questionStartedAt: number;
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
  questionStartedAt: number;
  totalQuestions: number;
  currentQuestion?: LocalRoomQuestion;
  answeredParticipantIds: string[];
};

const ROOM_CODE = /^[A-HJ-NP-Z2-9]{5}$/;
const MAX_PARTICIPANTS = 30;
export const ROOM_TTL_SECONDS = 60 * 60 * 4;

// Quanto vale acertar, e quanto quem está na liderança perde ao errar — dá
// um motivo real pra quem está na frente continuar prestando atenção, em
// vez de só acumular pontos sem risco.
export const CORRECT_ANSWER_XP = 10;
export const LEADER_WRONG_ANSWER_PENALTY_XP = 5;

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
  return `private-rooms/${code.toUpperCase()}`;
}

export const LOCAL_ROOM_JOIN_PARAM = "sala";

export function buildLocalRoomJoinUrl(origin: string, code: string): string {
  const url = new URL(origin);
  url.searchParams.set(LOCAL_ROOM_JOIN_PARAM, code.toUpperCase());
  return url.toString();
}

export function readLocalRoomCodeFromUrl(href: string): string | undefined {
  const code = new URL(href).searchParams.get(LOCAL_ROOM_JOIN_PARAM);
  return code && isValidLocalRoomCode(code) ? code.toUpperCase() : undefined;
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
    questionStartedAt: dependencies.now,
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
    questionStartedAt: dependencies.now,
    answeredParticipantIds: [],
    participants: state.participants.map((participant) => ({ ...participant, score: 0 })),
    updatedAt: dependencies.now,
  };
}

function isLeading(participants: readonly LocalRoomParticipant[], participantId: string): boolean {
  const top = Math.max(...participants.map((item) => item.score));
  if (top <= 0) return false;
  const leader = participants.find((item) => item.id === participantId);
  return leader?.score === top;
}

export function submitRoomAnswer(
  state: LocalRoomState,
  dependencies: { participantId: string; questionIndex: number; answer: string; now: number },
): { state: LocalRoomState; correct: boolean; xpChange: number } {
  const card = state.deck[dependencies.questionIndex];
  if (
    state.phase !== "playing" ||
    dependencies.questionIndex !== state.questionIndex ||
    !card ||
    state.answeredParticipantIds.includes(dependencies.participantId) ||
    !state.participants.some((item) => item.id === dependencies.participantId)
  ) {
    return { state, correct: false, xpChange: 0 };
  }
  const correct = isListeningAnswerCorrect(card, dependencies.answer);
  const wasLeading = !correct && isLeading(state.participants, dependencies.participantId);
  const xpChange = correct ? CORRECT_ANSWER_XP : wasLeading ? -LEADER_WRONG_ANSWER_PENALTY_XP : 0;
  const participants = state.participants.map((participant) =>
    participant.id === dependencies.participantId
      ? { ...participant, score: Math.max(0, participant.score + xpChange) }
      : participant,
  );
  const answered: LocalRoomState = {
    ...state,
    participants,
    answeredParticipantIds: [...state.answeredParticipantIds, dependencies.participantId],
    updatedAt: dependencies.now,
  };
  const allAnswered = answered.answeredParticipantIds.length === answered.participants.length;
  return {
    state: allAnswered ? advanceRoomQuestion(answered, dependencies.now) : answered,
    correct,
    xpChange,
  };
}

// O organizador só consegue avançar manualmente quando o tempo da rodada
// esgotou — nunca antes disso, mesmo que só reste um participante sem
// responder. Quando todo mundo já respondeu, submitRoomAnswer já avança
// sozinho, então essa checagem existe principalmente para o botão manual
// (e como rede de segurança contra uma corrida entre duas respostas).
export function canAdvanceRoomQuestion(state: LocalRoomState, now: number): boolean {
  if (state.phase !== "playing") return false;
  if (state.answeredParticipantIds.length >= state.participants.length) return true;
  return now >= state.questionStartedAt + state.settings.roundSeconds * 1000;
}

export function advanceRoomQuestion(state: LocalRoomState, now: number): LocalRoomState {
  if (state.phase !== "playing") return state;
  const nextIndex = state.questionIndex + 1;
  if (nextIndex >= state.deck.length) {
    return { ...state, phase: "finished", updatedAt: now };
  }
  return {
    ...state,
    questionIndex: nextIndex,
    questionStartedAt: now,
    answeredParticipantIds: [],
    updatedAt: now,
  };
}

export function endRoom(state: LocalRoomState, now: number): LocalRoomState {
  if (state.phase === "finished") return state;
  return { ...state, phase: "finished", updatedAt: now };
}

export function rankLocalRoomParticipants(
  participants: readonly LocalRoomParticipant[],
): LocalRoomParticipant[] {
  return [...participants].sort((a, b) => b.score - a.score);
}

export function toPublicRoomState(state: LocalRoomState): PublicLocalRoomState {
  const card = state.deck[state.questionIndex];
  return {
    code: state.code,
    phase: state.phase,
    settings: state.settings,
    participants: state.participants,
    questionIndex: state.questionIndex,
    questionStartedAt: state.questionStartedAt,
    totalQuestions: state.deck.length,
    answeredParticipantIds: state.answeredParticipantIds,
    ...(state.phase === "playing" && card
      ? { currentQuestion: { id: card.id, front: card.front } }
      : {}),
  };
}
