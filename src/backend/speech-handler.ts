const MAX_BODY_BYTES = 1_000;
const MAX_TEXT_LENGTH = 160;

export const GEMINI_SPEECH_VOICES = ["Kore", "Aoede", "Charon"] as const;
export type GeminiSpeechVoice = (typeof GEMINI_SPEECH_VOICES)[number];

export type SpeechRequest = {
  text: string;
  voice: GeminiSpeechVoice;
  rate: number;
  consent: true;
};

export type SpeechProvider = {
  synthesize(request: SpeechRequest): Promise<Uint8Array>;
};

export type SpeechRateLimiter = {
  consume(clientId: string): Promise<boolean> | boolean;
};

export type SpeechHandlerDependencies = {
  identifyClient(request: Request): Promise<string> | string;
  provider: SpeechProvider;
  rateLimiter: SpeechRateLimiter;
};

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function isSpeechRequest(value: unknown): value is SpeechRequest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    Object.keys(candidate).every((key) => ["text", "voice", "rate", "consent"].includes(key)) &&
    typeof candidate["text"] === "string" &&
    candidate["text"].trim().length > 0 &&
    candidate["text"].length <= MAX_TEXT_LENGTH &&
    typeof candidate["voice"] === "string" &&
    GEMINI_SPEECH_VOICES.includes(candidate["voice"] as GeminiSpeechVoice) &&
    typeof candidate["rate"] === "number" &&
    Number.isFinite(candidate["rate"]) &&
    candidate["rate"] >= 0.7 &&
    candidate["rate"] <= 1.05 &&
    candidate["consent"] === true
  );
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function createSpeechHandler(dependencies: SpeechHandlerDependencies) {
  return async function handleSpeech(request: Request): Promise<Response> {
    if (request.method !== "POST") return jsonError(405, "Método não permitido.");

    const requestOrigin = new URL(request.url).origin;
    if (request.headers.get("Origin") !== requestOrigin) {
      return jsonError(403, "Origem não autorizada.");
    }
    if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
      return jsonError(415, "Envie conteúdo JSON.");
    }

    const rawBody = await request.text();
    if (byteLength(rawBody) > MAX_BODY_BYTES) return jsonError(413, "Requisição muito longa.");

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody) as unknown;
    } catch {
      return jsonError(400, "JSON inválido.");
    }
    if (!isSpeechRequest(payload)) {
      return jsonError(400, "Dados de voz inválidos ou consentimento ausente.");
    }

    const clientId = await dependencies.identifyClient(request);
    if (!clientId || !(await dependencies.rateLimiter.consume(clientId))) {
      return jsonError(429, "Limite de voz atingido. Tente novamente em instantes.");
    }

    try {
      const wave = await dependencies.provider.synthesize({
        ...payload,
        text: payload.text.trim(),
      });
      return new Response(wave.buffer as ArrayBuffer, {
        headers: {
          "Cache-Control": "private, max-age=3600",
          "Content-Type": "audio/wav",
          "Referrer-Policy": "no-referrer",
          "X-Content-Type-Options": "nosniff",
        },
      });
    } catch (error) {
      const response = jsonError(
        503,
        "A voz Gemini está indisponível. Usando a voz do dispositivo.",
      );
      if (
        error instanceof Error &&
        "providerStatus" in error &&
        typeof error.providerStatus === "number"
      ) {
        response.headers.set("X-Provider-Status", String(error.providerStatus));
      }
      return response;
    }
  };
}
