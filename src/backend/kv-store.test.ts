import { describe, expect, it, vi } from "vitest";
import { createUpstashKvStore } from "./kv-store";

const config = { url: "https://kv.example/redis", token: "token-1" };

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("cliente KV do Upstash", () => {
  it("envia GET como comando genérico e devolve o valor", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { result: "valor-1" }));
    const store = createUpstashKvStore(config, fetchImpl);
    await expect(store.get("chave-1")).resolves.toBe("valor-1");
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(config.url);
    expect(JSON.parse(init.body as string)).toEqual(["GET", "chave-1"]);
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer token-1");
  });

  it("devolve undefined quando a chave não existe", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { result: null }));
    const store = createUpstashKvStore(config, fetchImpl);
    await expect(store.get("ausente")).resolves.toBeUndefined();
  });

  it("envia SET com TTL em segundos", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(200, { result: "OK" }));
    const store = createUpstashKvStore(config, fetchImpl);
    await store.set("chave-1", "valor-1", 3600);
    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual(["SET", "chave-1", "valor-1", "EX", 3600]);
  });

  it("propaga erro HTTP e erro reportado pelo Upstash", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse(500, {}));
    const store = createUpstashKvStore(config, fetchImpl);
    await expect(store.del("chave-1")).rejects.toThrow("HTTP 500");

    const withError = vi.fn().mockResolvedValue(jsonResponse(200, { error: "WRONGTYPE" }));
    await expect(createUpstashKvStore(config, withError).get("chave-1")).rejects.toThrow(
      "WRONGTYPE",
    );
  });
});
