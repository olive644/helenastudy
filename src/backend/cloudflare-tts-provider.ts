import type { SpeechAudio, SpeechProvider, SpeechRequest } from "./speech-handler.js";

const MELOTTS_MODEL = "@cf/myshell-ai/melotts";
const AUDIO_MIME_TYPE = "audio/mpeg";

type CloudflareAiJsonResponse = {
  result?: { audio?: string };
  success?: boolean;
  errors?: Array<{ message?: string }>;
};

export function createCloudflareTtsProvider(
  accountId: string,
  apiToken: string,
  timeoutMs: number,
): SpeechProvider {
  return {
    async synthesize(request: SpeechRequest): Promise<SpeechAudio> {
      if (!accountId || !apiToken) {
        throw Object.assign(new Error("Cloudflare Workers AI not configured"), {
          providerStatus: 503,
        });
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MELOTTS_MODEL}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiToken}`,
            },
            body: JSON.stringify({ prompt: request.text, lang: "en" }),
            signal: controller.signal,
          },
        );
        const contentType = response.headers.get("Content-Type") ?? "";

        // O modelo pode responder de duas formas (documentado pela própria
        // Cloudflare): áudio binário direto (audio/mpeg), ou um JSON com o
        // áudio em base64 dentro de result.audio. Tratamos as duas.
        if (contentType.startsWith("audio/")) {
          if (!response.ok) {
            throw Object.assign(new Error("Cloudflare Workers AI request failed"), {
              providerStatus: response.status,
            });
          }
          return { audio: new Uint8Array(await response.arrayBuffer()), contentType };
        }

        const payload = (await response.json().catch(() => undefined)) as
          CloudflareAiJsonResponse | undefined;
        const base64Audio = payload?.success ? payload.result?.audio : undefined;
        if (!response.ok || !base64Audio) {
          console.error(
            `Cloudflare Workers AI respondeu com HTTP ${response.status} (${contentType}).`,
          );
          throw Object.assign(new Error("Cloudflare Workers AI request failed"), {
            providerStatus: response.ok ? 502 : response.status,
          });
        }
        return {
          audio: new Uint8Array(Buffer.from(base64Audio, "base64")),
          contentType: AUDIO_MIME_TYPE,
        };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
