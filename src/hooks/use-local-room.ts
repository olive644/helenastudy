import { useEffect, useRef, useState } from "react";
import {
  isValidLocalRoomCode,
  normalizeLocalRoomCode,
  sanitizeDisplayName,
} from "../domain/local-room";
import type { LocalRoomSettings, PublicLocalRoomState } from "../domain/local-room";

type Role = "choose" | "host" | "participant";
export type StoredLocalRoomSession = {
  role: Exclude<Role, "choose">;
  code: string;
  credential: string;
};
export type RoomConnectionStatus =
  "disconnected" | "connecting" | "online" | "reconnecting" | "offline";

export const LOCAL_ROOM_SESSION_KEY = "helena:local-room-session:v1";

export function readStoredLocalRoomSession(
  storage?: Pick<Storage, "getItem">,
): StoredLocalRoomSession | undefined {
  try {
    const target = storage ?? (typeof window === "undefined" ? undefined : window.sessionStorage);
    const raw = target?.getItem(LOCAL_ROOM_SESSION_KEY);
    if (!raw) return undefined;
    const value = JSON.parse(raw) as Partial<StoredLocalRoomSession>;
    if (
      (value.role !== "host" && value.role !== "participant") ||
      typeof value.code !== "string" ||
      !isValidLocalRoomCode(value.code) ||
      typeof value.credential !== "string" ||
      !value.credential
    ) {
      return undefined;
    }
    return {
      role: value.role,
      code: normalizeLocalRoomCode(value.code),
      credential: value.credential,
    };
  } catch {
    return undefined;
  }
}

function writeStoredLocalRoomSession(session: StoredLocalRoomSession) {
  try {
    window.sessionStorage.setItem(LOCAL_ROOM_SESSION_KEY, JSON.stringify(session));
  } catch {
    // A sala continua funcionando mesmo quando o navegador bloqueia storage.
  }
}

function clearStoredLocalRoomSession() {
  try {
    window.sessionStorage.removeItem(LOCAL_ROOM_SESSION_KEY);
  } catch {
    // Nada a limpar quando o navegador bloqueia storage.
  }
}

// O Realtime Database do Firebase omite chaves cujo valor é um array vazio
// (ou objeto vazio) em vez de mandá-las como "[]" — ao contrário do
// JSON.stringify comum, que preserva arrays vazios. Isso só afeta o estado
// que chega pelo EventSource (lido direto do Firebase); as respostas da
// nossa própria API usam JSON.stringify normal e não têm esse problema.
export function normalizeRoomState(data: Partial<PublicLocalRoomState>): PublicLocalRoomState {
  return {
    code: data.code ?? "",
    phase: data.phase ?? "lobby",
    settings: data.settings ?? { difficulty: "mixed", questionCount: 10, roundSeconds: 30 },
    participants: data.participants ?? [],
    questionIndex: data.questionIndex ?? 0,
    questionStartedAt: data.questionStartedAt ?? 0,
    totalQuestions: data.totalQuestions ?? 0,
    answeredParticipantIds: data.answeredParticipantIds ?? [],
    ...(data.currentQuestion ? { currentQuestion: data.currentQuestion } : {}),
  };
}

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

export function useLocalRoom(initialJoinCode?: string) {
  const [storedSession] = useState(() => {
    const session = readStoredLocalRoomSession();
    if (initialJoinCode && session?.code !== normalizeLocalRoomCode(initialJoinCode)) {
      clearStoredLocalRoomSession();
      return undefined;
    }
    return session;
  });
  const [role, setRole] = useState<Role>(storedSession?.role ?? "choose");
  const [state, setState] = useState<PublicLocalRoomState>();
  const [error, setError] = useState("");
  const [participantId, setParticipantId] = useState(
    storedSession?.role === "participant" ? storedSession.credential : "",
  );
  const [isRestoring, setIsRestoring] = useState(Boolean(storedSession));
  const [connectionStatus, setConnectionStatus] = useState<RoomConnectionStatus>("disconnected");
  const hostTokenRef = useRef(storedSession?.role === "host" ? storedSession.credential : "");
  const codeRef = useRef(storedSession?.code ?? "");
  const eventSourceRef = useRef<EventSource | undefined>(undefined);

  function stopStreaming() {
    eventSourceRef.current?.close();
    eventSourceRef.current = undefined;
    setConnectionStatus("disconnected");
  }

  // Conecta direto no Realtime Database do Firebase (fora do domínio do
  // app) por Server-Sent Events nativos do navegador — sem SDK, sem
  // polling: cada mudança que o servidor grava em /rooms/<code> chega aqui
  // instantaneamente.
  function startStreaming(streamUrl: string) {
    stopStreaming();
    setConnectionStatus(navigator.onLine ? "connecting" : "offline");
    const source = new EventSource(streamUrl);
    source.onopen = () => setConnectionStatus("online");
    source.onerror = () => setConnectionStatus(navigator.onLine ? "reconnecting" : "offline");
    source.addEventListener("put", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent<string>).data) as {
          path: string;
          data: PublicLocalRoomState | null;
        };
        if (payload.path === "/" && payload.data) setState(normalizeRoomState(payload.data));
      } catch {
        // Evento malformado: ignora e espera o próximo.
      }
    });
    eventSourceRef.current = source;
  }

  useEffect(() => {
    if (!storedSession) return;
    let active = true;
    void requestRoom<{ state: PublicLocalRoomState; streamUrl: string }>("resume", {
      code: storedSession.code,
      role: storedSession.role,
      credential: storedSession.credential,
    })
      .then((payload) => {
        if (!active) return;
        setState(payload.state);
        startStreaming(payload.streamUrl);
      })
      .catch((caught) => {
        if (!active) return;
        clearStoredLocalRoomSession();
        hostTokenRef.current = "";
        codeRef.current = "";
        setParticipantId("");
        setRole("choose");
        setError(caught instanceof Error ? caught.message : "Não foi possível retomar a sala.");
      })
      .finally(() => {
        if (active) setIsRestoring(false);
      });
    return () => {
      active = false;
    };
    // A sessão é capturada uma vez na montagem; o streaming tem ciclo próprio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleOffline = () => eventSourceRef.current && setConnectionStatus("offline");
    const handleOnline = () => eventSourceRef.current && setConnectionStatus("reconnecting");
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      stopStreaming();
    };
  }, []);

  async function createRoom(settings: LocalRoomSettings) {
    setError("");
    try {
      const payload = await requestRoom<{
        code: string;
        hostToken: string;
        state: PublicLocalRoomState;
        streamUrl: string;
      }>("create", { settings });
      hostTokenRef.current = payload.hostToken;
      codeRef.current = payload.code;
      writeStoredLocalRoomSession({
        role: "host",
        code: payload.code,
        credential: payload.hostToken,
      });
      setState(payload.state);
      setRole("host");
      startStreaming(payload.streamUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível criar a sala.");
    }
  }

  async function joinRoom(code: string, name: string) {
    setError("");
    const roomCode = normalizeLocalRoomCode(code);
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
      const payload = await requestRoom<{
        participantId: string;
        state: PublicLocalRoomState;
        streamUrl: string;
      }>("join", { code: roomCode, displayName });
      setParticipantId(payload.participantId);
      codeRef.current = roomCode;
      writeStoredLocalRoomSession({
        role: "participant",
        code: roomCode,
        credential: payload.participantId,
      });
      setState(payload.state);
      setRole("participant");
      startStreaming(payload.streamUrl);
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
      stopStreaming();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível encerrar a sala.");
    }
  }

  async function submitAnswer(
    questionIndex: number,
    answer: string,
  ): Promise<{ correct: boolean; xpChange: number }> {
    try {
      const payload = await requestRoom<{
        correct: boolean;
        xpChange: number;
        state: PublicLocalRoomState;
      }>("answer", { code: codeRef.current, participantId, questionIndex, answer });
      setState(payload.state);
      return { correct: payload.correct, xpChange: payload.xpChange };
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível enviar a resposta.");
      return { correct: false, xpChange: 0 };
    }
  }

  function reset() {
    stopStreaming();
    clearStoredLocalRoomSession();
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
    isRestoring,
    connectionStatus,
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
