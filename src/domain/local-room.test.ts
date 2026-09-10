import { describe, expect, it } from "vitest";
import {
  addLocalParticipant,
  advanceRoomQuestion,
  buildLocalRoomJoinUrl,
  createLocalRoomCode,
  createRoom,
  endRoom,
  isValidLocalRoomCode,
  readLocalRoomCodeFromUrl,
  sanitizeDisplayName,
  startRoom,
  submitRoomAnswer,
  toPublicRoomState,
  updateRoomSettings,
  type LocalRoomSettings,
} from "./local-room";

const settings: LocalRoomSettings = { difficulty: "mixed", questionCount: 5 };

function room() {
  return createRoom(settings, { code: "ABCDE", hostToken: "secret", now: 1 });
}

function participant(id = "p1", displayName = "Ana") {
  return { id, displayName, score: 0 };
}

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
    const joined = addLocalParticipant(room(), participant(), 2);
    expect(addLocalParticipant(joined, participant(), 3).participants).toHaveLength(1);
    const started = startRoom(joined, { now: 4, random: () => 0 });
    expect(addLocalParticipant(started, participant("p2", "Bia"), 5).participants).toHaveLength(1);
  });

  it("só deixa alterar configurações no lobby", () => {
    const updated = updateRoomSettings(room(), { difficulty: "easy" }, 2);
    expect(updated.settings.difficulty).toBe("easy");
    const started = startRoom(addLocalParticipant(updated, participant(), 3), {
      now: 4,
      random: () => 0,
    });
    expect(updateRoomSettings(started, { difficulty: "hard" }, 5).settings.difficulty).toBe("easy");
  });

  it("não inicia sem participantes e monta o baralho com o tamanho pedido", () => {
    expect(startRoom(room(), { now: 2, random: () => 0 }).phase).toBe("lobby");
    const withParticipant = addLocalParticipant(room(), participant(), 2);
    const started = startRoom(withParticipant, { now: 3, random: () => 0 });
    expect(started.phase).toBe("playing");
    expect(started.deck).toHaveLength(5);
    expect(started.participants[0]?.score).toBe(0);
  });

  it("aceita uma resposta certa uma vez só por participante e pontua", () => {
    const started = startRoom(addLocalParticipant(room(), participant(), 2), {
      now: 3,
      random: () => 0,
    });
    const card = started.deck[0]!;
    const first = submitRoomAnswer(started, {
      participantId: "p1",
      questionIndex: 0,
      answer: card.back,
      now: 4,
    });
    expect(first.correct).toBe(true);
    expect(first.state.participants[0]?.score).toBe(1);
    expect(first.state.answeredParticipantIds).toEqual(["p1"]);

    const second = submitRoomAnswer(first.state, {
      participantId: "p1",
      questionIndex: 0,
      answer: card.back,
      now: 5,
    });
    expect(second.correct).toBe(false);
    expect(second.state.participants[0]?.score).toBe(1);
  });

  it("recusa resposta de participante desconhecido ou de pergunta errada", () => {
    const started = startRoom(addLocalParticipant(room(), participant(), 2), {
      now: 3,
      random: () => 0,
    });
    const card = started.deck[0]!;
    const stranger = submitRoomAnswer(started, {
      participantId: "ghost",
      questionIndex: 0,
      answer: card.back,
      now: 4,
    });
    expect(stranger.state).toBe(started);
    const wrongIndex = submitRoomAnswer(started, {
      participantId: "p1",
      questionIndex: 1,
      answer: card.back,
      now: 4,
    });
    expect(wrongIndex.state).toBe(started);
  });

  it("avança perguntas e termina no fim do baralho", () => {
    let state = startRoom(addLocalParticipant(room(), participant(), 2), {
      now: 3,
      random: () => 0,
    });
    for (let index = 0; index < 5; index += 1) {
      expect(state.phase).toBe("playing");
      state = advanceRoomQuestion(state, 4 + index);
    }
    expect(state.phase).toBe("finished");
  });

  it("permite encerrar a sala a qualquer momento", () => {
    expect(endRoom(room(), 2).phase).toBe("finished");
  });

  it("monta o link de convite com o código em maiúsculas", () => {
    expect(buildLocalRoomJoinUrl("https://helenastudy.vercel.app/", "abcde")).toBe(
      "https://helenastudy.vercel.app/?sala=ABCDE",
    );
  });

  it("lê o código de convite da URL só quando é válido", () => {
    expect(readLocalRoomCodeFromUrl("https://helenastudy.vercel.app/?sala=abcde")).toBe("ABCDE");
    expect(readLocalRoomCodeFromUrl("https://helenastudy.vercel.app/")).toBeUndefined();
    expect(readLocalRoomCodeFromUrl("https://helenastudy.vercel.app/?sala=xx")).toBeUndefined();
  });

  it("nunca expõe o baralho completo nem o token do host no estado público", () => {
    const started = startRoom(addLocalParticipant(room(), participant(), 2), {
      now: 3,
      random: () => 0,
    });
    const publicState = toPublicRoomState(started);
    expect(publicState).not.toHaveProperty("deck");
    expect(publicState).not.toHaveProperty("hostToken");
    expect(publicState.currentQuestion).toEqual({
      id: started.deck[0]!.id,
      front: started.deck[0]!.front,
    });
    expect(publicState.totalQuestions).toBe(5);
  });
});
