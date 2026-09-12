import { createSpeechHandler } from "../src/backend/speech-handler.js";
import { createTtsServiceProvider } from "../src/backend/tts-service-provider.js";
import { createVercelHandler } from "../src/backend/vercel-adapter.js";

const requests = new Map<string, number[]>();

const handler = createSpeechHandler({
  identifyClient(request) {
    return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  },
  rateLimiter: {
    consume(clientId) {
      const now = Date.now();
      const recent = (requests.get(clientId) ?? []).filter((time) => now - time < 60_000);
      if (recent.length >= 30) return false;
      recent.push(now);
      requests.set(clientId, recent);
      return true;
    },
  },
  provider: createTtsServiceProvider(
    process.env["TTS_SERVICE_URL"] ?? "",
    process.env["TTS_SERVICE_TOKEN"] ?? "",
    Number(process.env["TTS_TIMEOUT_MS"] ?? "8000"),
  ),
});

export default createVercelHandler("/api/speech", handler);
