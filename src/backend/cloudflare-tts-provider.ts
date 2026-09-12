import type { SpeechAudio, SpeechProvider, SpeechRequest } from "./speech-handler.js";

const MELOTTS_MODEL = "@cf/myshell-ai/melotts";

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
        if (!response.ok || !contentType.startsWith("audio/")) {
          console.error(
            `Cloudflare Workers AI respondeu com HTTP ${response.status} (${contentType}).`,
          );
          throw Object.assign(new Error("Cloudflare Workers AI request failed"), {
            providerStatus: response.ok ? 502 : response.status,
          });
        }
        return { audio: new Uint8Array(await response.arrayBuffer()), contentType };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
