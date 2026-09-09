import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalRoomHandler } from "./local-room-handler";
import type { KvStore } from "./kv-store";
import type { PublicLocalRoomState } from "../domain/local-room";

const origin = "https://helena.example";

function createMemoryStore(): KvStore {
  const data = new Map<string, string>();
  return {
    async get(key) {
      return data.get(key);
    },
    async set(key, value) {
      data.set(key, value);
    },
    async del(key) {
      data.delete(key);
    },
  };
}

function post(action: string, body: unknown): Request {
  return new Request(`${origin}/api/local-room?action=${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

let handler: (request: Request) => Promise<Response>;
let publish: ReturnType<typeof vi.fn>;
let codeCounter = 0;
let idCounter = 0;

beforeEach(() => {
  codeCounter = 0;
  idCounter = 0;
  publish = vi.fn().mockResolvedValue(undefined);
  handler = createLocalRoomHandler({
    store: createMemoryStore(),
    publish: publish as (code: string, publicState: PublicLocalRoomState) => Promise<void>,
    streamUrl: (code) => `https://helenastudy-rtdb.firebaseio.com/rooms/${code}.json`,
    now: () => 1_000,
    randomCode: () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[codeCounter++]!.repeat(5),
    randomId: () => `id-${idCounter++}`,
  });
});

async function createRoomViaApi() {
  const response = await handler(
    post("create", { settings: { difficulty: "mixed", questionCount: 5 } }),
  );
  return (await response.json()) as { code: string; hostToken: string; streamUrl: string };
}

describe("handler da sala local", () => {
  it("cria uma sala, devolve o token do host e a URL de streaming público", async () => {
    const response = await handler(
      post("create", { settings: { difficulty: "easy", questionCount: 10 } }),
    );
    expect(response.status).toBe(201);
    const payload = (await response.json()) as {
      code: string;
      hostToken: string;
      state: object;
      streamUrl: string;
    };
    expect(payload.code).toBeTruthy();
    expect(payload.hostToken).toBeTruthy();
    expect(payload.state).not.toHaveProperty("hostToken");
    expect(payload.streamUrl).toContain(payload.code);
    expect(publish).toHaveBeenCalledWith(payload.code, expect.objectContaining({ phase: "lobby" }));
  });

  it("recusa configurações inválidas na criação", async () => {
    const response = await handler(
      post("create", { settings: { difficulty: "muito-dificil", questionCount: 10 } }),
    );
    expect(response.status).toBe(400);
  });

  it("permite participante entrar e recebe a URL de streaming", async () => {
    const { code } = await createRoomViaApi();
    const joinResponse = await handler(post("join", { code, displayName: "Ana" }));
    expect(joinResponse.status).toBe(200);
    const joinPayload = (await joinResponse.json()) as {
      participantId: string;
      state: { participants: unknown[] };
      streamUrl: string;
    };
    expect(joinPayload.participantId).toBeTruthy();
    expect(joinPayload.state.participants).toHaveLength(1);
    expect(joinPayload.streamUrl).toContain(code);
  });

  it("recusa entrada em sala inexistente ou já iniciada", async () => {
    const missing = await handler(post("join", { code: "ZZZZZ", displayName: "Ana" }));
    expect(missing.status).toBe(404);

    const { code, hostToken } = await createRoomViaApi();
    await handler(post("join", { code, displayName: "Ana" }));
    await handler(post("start", { code, hostToken }));
    const late = await handler(post("join", { code, displayName: "Bia" }));
    expect(late.status).toBe(409);
  });

  it("só o host pode mudar configurações, iniciar, avançar e encerrar", async () => {
    const { code, hostToken } = await createRoomViaApi();
    await handler(post("join", { code, displayName: "Ana" }));

    expect(
      (await handler(post("settings", { code, hostToken: "errado", settings: {} }))).status,
    ).toBe(403);
    expect((await handler(post("start", { code, hostToken: "errado" }))).status).toBe(403);

    const settingsResponse = await handler(
      post("settings", { code, hostToken, settings: { difficulty: "hard" } }),
    );
    expect(settingsResponse.status).toBe(200);

    const startResponse = await handler(post("start", { code, hostToken }));
    expect(startResponse.status).toBe(200);
    const startPayload = (await startResponse.json()) as {
      state: { phase: string; totalQuestions: number; currentQuestion?: { front: string } };
    };
    expect(startPayload.state.phase).toBe("playing");
    expect(startPayload.state.currentQuestion?.front).toBeTruthy();
  });

  it("não inicia sem nenhum participante", async () => {
    const { code, hostToken } = await createRoomViaApi();
    const response = await handler(post("start", { code, hostToken }));
    expect(response.status).toBe(409);
  });

  it("aceita resposta do participante e avança perguntas até finished", async () => {
    const { code, hostToken } = await createRoomViaApi();
    const joinResponse = await handler(post("join", { code, displayName: "Ana" }));
    const { participantId } = (await joinResponse.json()) as { participantId: string };
    await handler(post("start", { code, hostToken }));

    const answerResponse = await handler(
      post("answer", { code, participantId, questionIndex: 0, answer: "qualquer coisa" }),
    );
    expect(answerResponse.status).toBe(200);
    const answerPayload = (await answerResponse.json()) as { correct: boolean };
    expect(typeof answerPayload.correct).toBe("boolean");

    let phase = "playing";
    for (let index = 0; index < 6 && phase === "playing"; index += 1) {
      const nextResponse = await handler(post("next", { code, hostToken }));
      const nextPayload = (await nextResponse.json()) as { state: { phase: string } };
      phase = nextPayload.state.phase;
    }
    expect(phase).toBe("finished");
  });

  it("encerra a sala a pedido do host", async () => {
    const { code, hostToken } = await createRoomViaApi();
    await handler(post("join", { code, displayName: "Ana" }));
    const response = await handler(post("end", { code, hostToken }));
    const payload = (await response.json()) as { state: { phase: string } };
    expect(payload.state.phase).toBe("finished");
  });
});
