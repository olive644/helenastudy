import { act, render } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PublicLocalRoomState } from "../domain/local-room";
import { LocalRoom } from "./local-room";

const LOBBY_STATE: PublicLocalRoomState = {
  code: "ABCDE",
  phase: "lobby",
  settings: { difficulty: "mixed", questionCount: 10, roundSeconds: 30 },
  participants: [{ id: "p1", displayName: "Ana", score: 0 }],
  questionIndex: 0,
  questionStartedAt: 0,
  totalQuestions: 10,
  answeredParticipantIds: [],
};

let setRoomState:
  ((updater: (state: PublicLocalRoomState) => PublicLocalRoomState) => void) | null = null;

vi.mock("../hooks/use-local-room", () => ({
  useLocalRoom: () => {
    const [state, setState] = useState<PublicLocalRoomState>(LOBBY_STATE);
    setRoomState = setState;
    return {
      role: "host" as const,
      state,
      error: "",
      isHost: true,
      participantId: "",
      setRole: vi.fn(),
      createRoom: vi.fn(),
      joinRoom: vi.fn(),
      updateSettings: vi.fn(),
      startRound: vi.fn(),
      nextQuestion: vi.fn().mockResolvedValue(undefined),
      endRoom: vi.fn(),
      submitAnswer: vi.fn(),
      reset: vi.fn(),
    };
  },
}));

describe("contagem regressiva do início da rodada", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    setRoomState = null;
  });

  function countdownText(container: HTMLElement) {
    return container.querySelector(".local-room-countdown__value")?.textContent ?? null;
  }

  it("mostra 3, 2, 1 e Vai! só na transição do lobby pra a primeira pergunta", () => {
    vi.useFakeTimers();
    render(<LocalRoom />);

    act(() => {
      setRoomState!((state) => ({
        ...state,
        phase: "playing",
        questionIndex: 0,
        questionStartedAt: Date.now(),
        currentQuestion: { id: "c1", front: "hello" },
      }));
    });
    expect(countdownText(document.body)).toBe("3");

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(countdownText(document.body)).toBe("2");

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(countdownText(document.body)).toBe("1");

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(countdownText(document.body)).toBe("Vai!");

    act(() => {
      vi.advanceTimersByTime(700);
    });
    expect(countdownText(document.body)).toBeNull();

    // Passar pra próxima pergunta da mesma rodada não deve reabrir a
    // contagem — ela é só pro início do jogo, não pra cada pergunta.
    act(() => {
      setRoomState!((state) => ({
        ...state,
        questionIndex: 1,
        questionStartedAt: Date.now(),
      }));
    });
    expect(countdownText(document.body)).toBeNull();
  });
});
