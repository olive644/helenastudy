import { useCallback, useEffect, useRef, useState } from "react";
import { isValidLocalRoomCode, sanitizeDisplayName } from "../domain/local-room";
import type { LocalRoomSettings, PublicLocalRoomState } from "../domain/local-room";

const POLL_INTERVAL_MS = 1500;

type Role = "choose" | "host" | "participant";

async function requestRoom<T>(action: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`/api/local-room?action=${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Não foi possível falar com a sala agora.");
  return payload;
}

export function useLocalRoom() {
  const [role, setRole] = useState<Role>("choose");
  const [state, setState] = useState<PublicLocalRoomState>();
  const [error, setError] = useState("");
  const [participantId, setParticipantId] = useState("");
  const hostTokenRef = useRef("");
  const codeRef = useRef("");
  const pollTimer = useRef<number | undefined>(undefined);

  const stopPolling = useCallback(() => {
    if (pollTimer.current !== undefined) window.clearInterval(pollTimer.current);
    pollTimer.current = undefined;
  }, []);

  const startPolling = useCallback(
    (code: string) => {
      stopPolling();
      pollTimer.current = window.setInterval(async () => {
        try {
          const response = await fetch(
            `/api/local-room?action=state&code=${encodeURIComponent(code)}`,
          );
          if (!response.ok) return;
          const payload = (await response.json()) as { state: PublicLocalRoomState };
          setState(payload.state);
        } catch {
          // Falha passageira de rede: mantém o último estado e tenta de novo no próximo tick.
        }
      }, POLL_INTERVAL_MS);
    },
    [stopPolling],
  );

  useEffect(() => stopPolling, [stopPolling]);

  async function createRoom(settings: LocalRoomSettings) {
    setError("");
    try {
      const payload = await requestRoom<{
        code: string;
        hostToken: string;
        state: PublicLocalRoomState;
      }>("create", { settings });
      hostTokenRef.current = payload.hostToken;
      codeRef.current = payload.code;
      setState(payload.state);
      setRole("host");
      startPolling(payload.code);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível criar a sala.");
    }
  }

  async function joinRoom(code: string, name: string) {
    setError("");
    const roomCode = code.trim().toUpperCase();
    const displayName = sanitizeDisplayName(name);
    if (!isValidLocalRoomCode(roomCode)) {
      setError("Digite um código de sala válido com cinco caracteres.");
      return;
    }
    if (!displayName) {
      setError("Escolha um nome de exibição.");
      return;
    }
    try {
      const payload = await requestRoom<{ participantId: string; state: PublicLocalRoomState }>(
        "join",
        { code: roomCode, displayName },
      );
      setParticipantId(payload.participantId);
      codeRef.current = roomCode;
      setState(payload.state);
      setRole("participant");
      startPolling(roomCode);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível entrar na sala.");
    }
  }

  async function updateSettings(settings: Partial<LocalRoomSettings>) {
    try {
      const payload = await requestRoom<{ state: PublicLocalRoomState }>("settings", {
        code: codeRef.current,
        hostToken: hostTokenRef.current,
        settings,
      });
      setState(payload.state);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar.");
    }
  }

  async function startRound() {
    try {
      const payload = await requestRoom<{ state: PublicLocalRoomState }>("start", {
        code: codeRef.current,
        hostToken: hostTokenRef.current,
      });
      setState(payload.state);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível iniciar a rodada.");
    }
  }

  async function nextQuestion() {
    try {
      const payload = await requestRoom<{ state: PublicLocalRoomState }>("next", {
        code: codeRef.current,
        hostToken: hostTokenRef.current,
      });
      setState(payload.state);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível avançar.");
    }
  }

  async function endRoom() {
    try {
      const payload = await requestRoom<{ state: PublicLocalRoomState }>("end", {
        code: codeRef.current,
        hostToken: hostTokenRef.current,
      });
      setState(payload.state);
      stopPolling();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível encerrar a sala.");
    }
  }

  async function submitAnswer(questionIndex: number, answer: string): Promise<boolean> {
    try {
      const payload = await requestRoom<{ correct: boolean; state: PublicLocalRoomState }>(
        "answer",
        {
          code: codeRef.current,
          participantId,
          questionIndex,
          answer,
        },
      );
      setState(payload.state);
      return payload.correct;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível enviar a resposta.");
      return false;
    }
  }

  function reset() {
    stopPolling();
    setState(undefined);
    setError("");
    setRole("choose");
    hostTokenRef.current = "";
    setParticipantId("");
    codeRef.current = "";
  }

  return {
    role,
    state,
    error,
    isHost: role === "host",
    participantId,
    setRole,
    createRoom,
    joinRoom,
    updateSettings,
    startRound,
    nextQuestion,
    endRoom,
    submitAnswer,
    reset,
  };
}
