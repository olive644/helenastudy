import { describe, expect, it } from "vitest";
import {
  addLocalParticipant,
  createLocalRoomCode,
  isValidLocalRoomCode,
  sanitizeDisplayName,
  type LocalRoomState,
} from "./local-room";

const room: LocalRoomState = {
  code: "ABCDE",
  phase: "lobby",
  settings: { activity: "listening", difficulty: "mixed", questionCount: 10, timed: false },
  participants: [],
  questionIndex: 0,
  createdAt: 1,
};

describe("sala local", () => {
  it("gera e valida um código curto sem caracteres ambíguos", () => {
    const code = createLocalRoomCode(() => 0);
    expect(code).toBe("AAAAA");
    expect(isValidLocalRoomCode(code)).toBe(true);
    expect(isValidLocalRoomCode("O0I1")).toBe(false);
  });

  it("filtra e limita o nome temporário", () => {
    expect(sanitizeDisplayName(" <Ana>   estudante com um nome enorme ")).toBe(
      "Ana estudante com um nom",
    );
  });

  it("não duplica participante e bloqueia entrada após o início", () => {
    const participant = { id: "p1", displayName: "Ana", score: 0 };
    const joined = addLocalParticipant(room, participant);
    expect(addLocalParticipant(joined, participant).participants).toHaveLength(1);
    expect(
      addLocalParticipant({ ...room, phase: "finished" }, participant).participants,
    ).toHaveLength(0);
  });
});
