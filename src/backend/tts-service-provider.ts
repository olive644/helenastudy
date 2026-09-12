import type { SpeechProvider, SpeechRequest } from "./speech-handler.js";

export function createTtsServiceProvider(
  serviceUrl: string,
  serviceToken: string,
  timeoutMs: number,
): SpeechProvider {
  return {
    async synthesize(request: SpeechRequest): Promise<Uint8Array> {
      if (!serviceUrl || !serviceToken) {
        throw Object.assign(new Error("TTS service not configured"), { providerStatus: 503 });
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(`${serviceUrl}/synthesize`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-TTS-Secret": serviceToken },
          body: JSON.stringify({ text: request.text, rate: request.rate }),
          signal: controller.signal,
        });
        if (!response.ok) {
          console.error(`Servico de TTS respondeu com HTTP ${response.status}.`);
          throw Object.assign(new Error("TTS service request failed"), {
            providerStatus: response.status,
          });
        }
        return new Uint8Array(await response.arrayBuffer());
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
