import type { KvStore } from "./kv-store.js";

export class RoomConflict extends Error {}

// Retry the complete read/validate/write operation against the newly read version.
// The callback must defer external effects until its conditional write succeeds.
export function versionedStore(store: KvStore): KvStore {
  if (!store.readVersion || !store.compareAndSet)
    throw new Error("A sala exige armazenamento transacional.");
  const versions = new Map<string, string>();
  return {
    async get(key) {
      const entry = await store.readVersion!(key);
      versions.set(key, entry.version);
      return entry.value;
    },
    async set(key, value, ttl) {
      const version = versions.get(key) ?? (await store.readVersion!(key)).version;
      if (!(await store.compareAndSet!(key, value, ttl, version))) throw new RoomConflict();
    },
    del: (key) => store.del(key),
  };
}

export function createMemoryRoomStore(now: () => number = Date.now): KvStore {
  const values = new Map<string, { value: string; expiresAt: number; version: number }>();
  let sequence = 0;
  return {
    async get(key) {
      const item = values.get(key);
      return item && item.expiresAt > now() ? item.value : undefined;
    },
    async set(key, value, ttl) {
      values.set(key, { value, expiresAt: now() + ttl * 1000, version: ++sequence });
    },
    async del(key) {
      values.delete(key);
    },
    async readVersion(key) {
      const item = values.get(key);
      return {
        value: item && item.expiresAt > now() ? item.value : undefined,
        version: String(item?.version ?? 0),
      };
    },
    async compareAndSet(key, value, ttl, version) {
      if (String(values.get(key)?.version ?? 0) !== version) return false;
      values.set(key, { value, expiresAt: now() + ttl * 1000, version: ++sequence });
      return true;
    },
  };
}
