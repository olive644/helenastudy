import { createUpstashKvStore } from "../src/backend/kv-store.js";
import { createLocalRoomHandler } from "../src/backend/local-room-handler.js";
import { createVercelHandler } from "../src/backend/vercel-adapter.js";

const store = createUpstashKvStore({
  url: process.env["KV_REST_API_URL"] ?? process.env["UPSTASH_REDIS_REST_URL"] ?? "",
  token: process.env["KV_REST_API_TOKEN"] ?? process.env["UPSTASH_REDIS_REST_TOKEN"] ?? "",
});

const handler = createLocalRoomHandler({ store });

export default createVercelHandler("/api/local-room", handler);
