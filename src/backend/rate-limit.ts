import { createHash } from "node:crypto";
import type { KvStore } from "./kv-store.js";

/**
 * Fixed-window rate limit backed by a shared KV store, so the limit holds
 * across serverless instances (unlike an in-memory Map per instance).
 */
export async function checkRateLimit(
  store: KvStore,
  namespace: string,
  identity: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = `${namespace}/${createHash("sha256").update(identity).digest("hex")}`;
  for (let attempt = 0; attempt < 40; attempt++) {
    const entry = await store.readVersion!(key);
    const saved = entry.value
      ? (JSON.parse(entry.value) as { bucket: number; count: number })
      : undefined;
    const count = saved?.bucket === bucket ? saved.count : 0;
    if (count >= limit) return false;
    if (
      await store.compareAndSet!(
        key,
        JSON.stringify({ bucket, count: count + 1 }),
        windowSeconds * 2,
        entry.version,
      )
    )
      return true;
  }
  return false;
}
