export type LocalRoomActivity = "listening" | "bingo";
export type LocalRoomPhase = "lobby" | "playing" | "finished";

export type LocalRoomSettings = {
  activity: LocalRoomActivity;
  difficulty: "mixed" | "easy" | "medium" | "hard";
  questionCount: 5 | 10 | 15 | "all";
  timed: boolean;
};

export type LocalRoomParticipant = { id: string; displayName: string; score: number };

export type LocalRoomState = {
  code: string;
  phase: LocalRoomPhase;
  settings: LocalRoomSettings;
  participants: LocalRoomParticipant[];
  questionIndex: number;
  createdAt: number;
};

export type LocalRoomMessage =
  | { type: "state"; state: LocalRoomState }
  | { type: "join"; participant: LocalRoomParticipant }
  | { type: "leave"; participantId: string };

const ROOM_CODE = /^[A-HJ-NP-Z2-9]{5}$/;

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

export function addLocalParticipant(
  state: LocalRoomState,
  participant: LocalRoomParticipant,
): LocalRoomState {
  if (state.phase !== "lobby" || state.participants.some((item) => item.id === participant.id))
    return state;
  return { ...state, participants: [...state.participants, participant].slice(0, 30) };
}

export function localRoomChannelName(code: string): string {
  return `helena-local-room-${code.toUpperCase()}`;
}
