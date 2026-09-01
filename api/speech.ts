import { createGeminiSpeechProvider } from "../src/backend/gemini-speech-provider";
import { createSpeechHandler } from "../src/backend/speech-handler";

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
  provider: createGeminiSpeechProvider(process.env["GEMINI_API_KEY"] ?? ""),
});

export default function speech(request: Request): Promise<Response> {
  return handler(request);
}
