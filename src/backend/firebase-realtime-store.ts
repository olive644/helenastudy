import { getGoogleAccessToken, type GoogleServiceAccount } from "./google-service-account.js";
import type { KvStore } from "./kv-store.js";

const SCOPES = [
  "https://www.googleapis.com/auth/firebase.database",
  "https://www.googleapis.com/auth/userinfo.email",
];

export type FirebaseRealtimeConfig = {
  databaseUrl: string;
  serviceAccount: GoogleServiceAccount;
};

type StoredEnvelope = { value: string; expiresAt: number };

// Guarda um envelope { value, expiresAt } porque o Realtime Database não tem
// expiração nativa de chave (ao contrário do Redis EX): a expiração é
// conferida na leitura, e a chave é apagada se já venceu.
export function createFirebaseRealtimeStore(
  config: FirebaseRealtimeConfig,
  fetchImpl: typeof fetch = fetch,
  now: () => number = () => Date.now(),
): KvStore {
  async function authorizedFetch(path: string, init: RequestInit): Promise<Response> {
    const token = await getGoogleAccessToken(config.serviceAccount, SCOPES, fetchImpl, now());
    return fetchImpl(`${config.databaseUrl}/${path}.json`, {
      ...init,
      headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
    });
  }

  return {
    async get(key) {
      const response = await authorizedFetch(key, { method: "GET" });
      if (!response.ok) throw new Error(`Firebase respondeu HTTP ${response.status}`);
      const payload = (await response.json()) as StoredEnvelope | null;
      if (!payload) return undefined;
      if (payload.expiresAt < now()) {
        await authorizedFetch(key, { method: "DELETE" });
        return undefined;
      }
      return payload.value;
    },
    async set(key, value, ttlSeconds) {
      const envelope: StoredEnvelope = { value, expiresAt: now() + ttlSeconds * 1000 };
      const response = await authorizedFetch(key, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(envelope),
      });
      if (!response.ok) throw new Error(`Firebase respondeu HTTP ${response.status}`);
    },
    async del(key) {
      const response = await authorizedFetch(key, { method: "DELETE" });
      if (!response.ok) throw new Error(`Firebase respondeu HTTP ${response.status}`);
    },
  };
}

// Publica a projeção pública da sala num caminho separado e legível sem
// autenticação (regras do Realtime Database liberam ".read" só em
// "/rooms/$code"), para que o navegador escute atualizações via
// EventSource nativo, sem SDK e sem polling.
export function createFirebasePublicRoomPublisher(
  config: FirebaseRealtimeConfig,
  fetchImpl: typeof fetch = fetch,
  now: () => number = () => Date.now(),
) {
  return async function publish(code: string, publicState: unknown): Promise<void> {
    const token = await getGoogleAccessToken(config.serviceAccount, SCOPES, fetchImpl, now());
    const response = await fetchImpl(`${config.databaseUrl}/rooms/${code}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(publicState),
    });
    if (!response.ok) throw new Error(`Firebase respondeu HTTP ${response.status}`);
  };
}

export function firebasePublicStreamUrl(config: FirebaseRealtimeConfig, code: string): string {
  return `${config.databaseUrl}/rooms/${code}.json`;
}
