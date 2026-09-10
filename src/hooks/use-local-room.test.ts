import { describe, expect, it } from "vitest";
import { normalizeRoomState } from "./use-local-room";
import type { PublicLocalRoomState } from "../domain/local-room";

describe("normalizeRoomState", () => {
  it("preenche arrays que o Firebase omite quando estão vazios", () => {
    const raw = {
      code: "ABCDE",
      phase: "lobby",
      settings: { difficulty: "mixed", questionCount: 10 },
      questionIndex: 0,
      totalQuestions: 0,
      // participants e answeredParticipantIds ausentes de propósito, como o
      // Realtime Database realmente envia quando o array está vazio.
    } as const;
    expect(normalizeRoomState(raw)).toEqual({
      code: "ABCDE",
      phase: "lobby",
      settings: { difficulty: "mixed", questionCount: 10 },
      participants: [],
      questionIndex: 0,
      totalQuestions: 0,
      answeredParticipantIds: [],
    });
  });

  it("preserva os valores quando já vêm preenchidos", () => {
    const raw: PublicLocalRoomState = {
      code: "ABCDE",
      phase: "playing",
      settings: { difficulty: "hard", questionCount: 5 },
      participants: [{ id: "p1", displayName: "Ana", score: 2 }],
      questionIndex: 1,
      totalQuestions: 5,
      answeredParticipantIds: ["p1"],
      currentQuestion: { id: "c1", front: "hello" },
    };
    expect(normalizeRoomState(raw)).toEqual(raw);
  });
});
