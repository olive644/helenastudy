import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  createFirebasePublicRoomPublisher,
  createFirebaseRealtimeStore,
  firebasePublicStreamUrl,
  type FirebaseRealtimeConfig,
} from "./firebase-realtime-store";

const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

const config: FirebaseRealtimeConfig = {
  databaseUrl: "https://helenastudy-default-rtdb.firebaseio.com",
  serviceAccount: { clientEmail: "sala@helenastudy.iam.gserviceaccount.com", privateKey },
};

function tokenResponse(): Response {
  return new Response(JSON.stringify({ access_token: "access-1" }), { status: 200 });
}

describe("armazenamento no Firebase Realtime Database", () => {
  it("lê um valor não vencido e devolve só o conteúdo", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ value: "conteudo-1", expiresAt: 5_000 }), { status: 200 }),
      );
    const store = createFirebaseRealtimeStore(config, fetchImpl, () => 1_000);
    await expect(store.get("private-rooms/ABCDE")).resolves.toBe("conteudo-1");
    const [url] = fetchImpl.mock.calls[1] as [string];
    expect(url).toBe(`${config.databaseUrl}/private-rooms/ABCDE.json`);
  });

  it("apaga e devolve undefined quando o valor já venceu", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ value: "velho", expiresAt: 1_000 }), { status: 200 }),
      )
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const store = createFirebaseRealtimeStore(config, fetchImpl, () => 5_000);
    await expect(store.get("private-rooms/ABCDE")).resolves.toBeUndefined();
    const [, deleteInit] = fetchImpl.mock.calls[3] as [string, RequestInit];
    expect(deleteInit.method).toBe("DELETE");
  });

  it("devolve undefined quando a chave não existe", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response("null", { status: 200 }));
    const store = createFirebaseRealtimeStore(config, fetchImpl, () => 1_000);
    await expect(store.get("private-rooms/ausente")).resolves.toBeUndefined();
  });

  it("grava com o envelope de expiração calculado a partir do TTL", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const store = createFirebaseRealtimeStore(config, fetchImpl, () => 1_000);
    await store.set("private-rooms/ABCDE", "conteudo-1", 3600);
    const [url, init] = fetchImpl.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(`${config.databaseUrl}/private-rooms/ABCDE.json`);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({ value: "conteudo-1", expiresAt: 3_601_000 });
  });

  it("publica a projeção pública da sala em /rooms/<code>", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const publish = createFirebasePublicRoomPublisher(config, fetchImpl, () => 1_000);
    await publish("ABCDE", { phase: "lobby" });
    const [url, init] = fetchImpl.mock.calls[1] as [string, RequestInit];
    expect(url).toBe(`${config.databaseUrl}/rooms/ABCDE.json`);
    expect(init.method).toBe("PUT");
    expect(JSON.parse(init.body as string)).toEqual({ phase: "lobby" });
  });

  it("monta a URL de streaming público sem autenticação embutida", () => {
    expect(firebasePublicStreamUrl(config, "ABCDE")).toBe(`${config.databaseUrl}/rooms/ABCDE.json`);
  });
});
