export type KvStore = {
  get(key: string): Promise<string | undefined>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
};

type UpstashResponse = { result?: unknown; error?: string };

// Usa o endpoint de comando genérico do Upstash (POST com o comando como
// array JSON no corpo) em vez do estilo REST por path — assim o valor (JSON
// do estado da sala) não precisa ser URL-encoded nem tem limite de tamanho
// de query string.
export function createUpstashKvStore(
  config: { url: string; token: string },
  fetchImpl: typeof fetch = fetch,
): KvStore {
  async function command(args: readonly (string | number)[]): Promise<unknown> {
    const response = await fetchImpl(config.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
    });
    if (!response.ok) throw new Error(`Upstash respondeu HTTP ${response.status}`);
    const payload = (await response.json()) as UpstashResponse;
    if (payload.error) throw new Error(payload.error);
    return payload.result;
  }

  return {
    async get(key) {
      const result = await command(["GET", key]);
      return typeof result === "string" ? result : undefined;
    },
    async set(key, value, ttlSeconds) {
      await command(["SET", key, value, "EX", ttlSeconds]);
    },
    async del(key) {
      await command(["DEL", key]);
    },
  };
}
