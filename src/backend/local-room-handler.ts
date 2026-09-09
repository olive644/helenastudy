import {
  addLocalParticipant,
  advanceRoomQuestion,
  createLocalRoomCode,
  createRoom,
  endRoom,
  isValidLocalRoomCode,
  localRoomStorageKey,
  ROOM_TTL_SECONDS,
  sanitizeDisplayName,
  startRoom,
  submitRoomAnswer,
  toPublicRoomState,
  updateRoomSettings,
  type LocalRoomSettings,
  type LocalRoomState,
} from "../domain/local-room";
import type { KvStore } from "./kv-store";

export type LocalRoomHandlerDependencies = {
  store: KvStore;
  now?(): number;
  randomCode?(): string;
  randomId?(): string;
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function isSettingsPayload(value: unknown): value is Partial<LocalRoomSettings> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  if (
    "difficulty" in candidate &&
    !["mixed", "easy", "medium", "hard"].includes(candidate["difficulty"] as string)
  ) {
    return false;
  }
  if (
    "questionCount" in candidate &&
    ![5, 10, 15, "all"].includes(candidate["questionCount"] as number | string)
  ) {
    return false;
  }
  return true;
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const payload = (await request.json()) as unknown;
    return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

async function loadRoom(store: KvStore, code: string): Promise<LocalRoomState | undefined> {
  const raw = await store.get(localRoomStorageKey(code));
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as LocalRoomState;
  } catch {
    return undefined;
  }
}

async function saveRoom(store: KvStore, state: LocalRoomState): Promise<void> {
  await store.set(localRoomStorageKey(state.code), JSON.stringify(state), ROOM_TTL_SECONDS);
}

export function createLocalRoomHandler(dependencies: LocalRoomHandlerDependencies) {
  const now = () => dependencies.now?.() ?? Date.now();
  const randomCode = () => dependencies.randomCode?.() ?? createLocalRoomCode();
  const randomId = () => dependencies.randomId?.() ?? crypto.randomUUID();

  return async function handleLocalRoom(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    if (action === "create" && request.method === "POST") {
      const body = await readJsonBody(request);
      if (!isSettingsPayload(body["settings"])) {
        return jsonResponse(400, { error: "Configurações inválidas." });
      }
      const settings: LocalRoomSettings = {
        difficulty: (body["settings"] as Partial<LocalRoomSettings>).difficulty ?? "mixed",
        questionCount: (body["settings"] as Partial<LocalRoomSettings>).questionCount ?? 10,
      };
      const code = randomCode();
      const hostToken = randomId();
      const state = createRoom(settings, { code, hostToken, now: now() });
      await saveRoom(dependencies.store, state);
      return jsonResponse(201, { code, hostToken, state: toPublicRoomState(state) });
    }

    if (action === "join" && request.method === "POST") {
      const body = await readJsonBody(request);
      const code = typeof body["code"] === "string" ? body["code"].trim().toUpperCase() : "";
      const displayName = sanitizeDisplayName(
        typeof body["displayName"] === "string" ? body["displayName"] : "",
      );
      if (!isValidLocalRoomCode(code) || !displayName) {
        return jsonResponse(400, { error: "Código ou nome de exibição inválidos." });
      }
      const state = await loadRoom(dependencies.store, code);
      if (!state) return jsonResponse(404, { error: "Sala não encontrada." });
      const participantId = randomId();
      const updated = addLocalParticipant(
        state,
        { id: participantId, displayName, score: 0 },
        now(),
      );
      if (updated === state && state.phase !== "lobby") {
        return jsonResponse(409, { error: "Esta sala já começou a atividade." });
      }
      await saveRoom(dependencies.store, updated);
      return jsonResponse(200, { participantId, state: toPublicRoomState(updated) });
    }

    if (action === "state" && request.method === "GET") {
      const code = (url.searchParams.get("code") ?? "").toUpperCase();
      if (!isValidLocalRoomCode(code)) return jsonResponse(400, { error: "Código inválido." });
      const state = await loadRoom(dependencies.store, code);
      if (!state) return jsonResponse(404, { error: "Sala não encontrada." });
      return jsonResponse(200, { state: toPublicRoomState(state) });
    }

    if (action === "settings" && request.method === "POST") {
      const body = await readJsonBody(request);
      const state = await requireHost(dependencies.store, body);
      if (state instanceof Response) return state;
      if (!isSettingsPayload(body["settings"])) {
        return jsonResponse(400, { error: "Configurações inválidas." });
      }
      const updated = updateRoomSettings(
        state,
        body["settings"] as Partial<LocalRoomSettings>,
        now(),
      );
      await saveRoom(dependencies.store, updated);
      return jsonResponse(200, { state: toPublicRoomState(updated) });
    }

    if (action === "start" && request.method === "POST") {
      const body = await readJsonBody(request);
      const state = await requireHost(dependencies.store, body);
      if (state instanceof Response) return state;
      const started = startRoom(state, { now: now() });
      if (started.phase !== "playing") {
        return jsonResponse(409, { error: "É preciso ao menos um participante para iniciar." });
      }
      await saveRoom(dependencies.store, started);
      return jsonResponse(200, { state: toPublicRoomState(started) });
    }

    if (action === "answer" && request.method === "POST") {
      const body = await readJsonBody(request);
      const code = typeof body["code"] === "string" ? body["code"].trim().toUpperCase() : "";
      const participantId = typeof body["participantId"] === "string" ? body["participantId"] : "";
      const answer = typeof body["answer"] === "string" ? body["answer"] : "";
      const questionIndex = Number(body["questionIndex"]);
      if (!isValidLocalRoomCode(code) || !participantId || !Number.isInteger(questionIndex)) {
        return jsonResponse(400, { error: "Dados de resposta inválidos." });
      }
      const state = await loadRoom(dependencies.store, code);
      if (!state) return jsonResponse(404, { error: "Sala não encontrada." });
      const result = submitRoomAnswer(state, { participantId, questionIndex, answer, now: now() });
      await saveRoom(dependencies.store, result.state);
      return jsonResponse(200, { correct: result.correct, state: toPublicRoomState(result.state) });
    }

    if (action === "next" && request.method === "POST") {
      const body = await readJsonBody(request);
      const state = await requireHost(dependencies.store, body);
      if (state instanceof Response) return state;
      const advanced = advanceRoomQuestion(state, now());
      await saveRoom(dependencies.store, advanced);
      return jsonResponse(200, { state: toPublicRoomState(advanced) });
    }

    if (action === "end" && request.method === "POST") {
      const body = await readJsonBody(request);
      const state = await requireHost(dependencies.store, body);
      if (state instanceof Response) return state;
      const ended = endRoom(state, now());
      await saveRoom(dependencies.store, ended);
      return jsonResponse(200, { state: toPublicRoomState(ended) });
    }

    return jsonResponse(404, { error: "Ação desconhecida." });
  };

  async function requireHost(
    store: KvStore,
    body: Record<string, unknown>,
  ): Promise<LocalRoomState | Response> {
    const code = typeof body["code"] === "string" ? body["code"].trim().toUpperCase() : "";
    const hostToken = typeof body["hostToken"] === "string" ? body["hostToken"] : "";
    if (!isValidLocalRoomCode(code) || !hostToken) {
      return jsonResponse(400, { error: "Código ou credencial de organizador inválidos." });
    }
    const state = await loadRoom(store, code);
    if (!state) return jsonResponse(404, { error: "Sala não encontrada." });
    if (state.hostToken !== hostToken) return jsonResponse(403, { error: "Não autorizado." });
    return state;
  }
}
