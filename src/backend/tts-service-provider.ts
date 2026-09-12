import type { SpeechAudio, SpeechProvider, SpeechRequest } from "./speech-handler.js";

/**
 * Provider para o servico Kokoro+Piper auto-hospedado em services/tts.
 * Nao usado em producao no momento (nenhuma hospedagem gratis viavel foi
 * encontrada para os dois modelos juntos); mantido caso um host proprio ou
 * pago volte a fazer sentido no futuro. A Vercel usa createCloudflareTtsProvider
 * (Cloudflare Workers AI) por padrao — ver api/speech.ts.
 */
export function createTtsServiceProvider(
  serviceUrl: string,
  serviceToken: string,
  timeoutMs: number,
): SpeechProvider {
  return {
    async synthesize(request: SpeechRequest): Promise<SpeechAudio> {
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
        return { audio: new Uint8Array(await response.arrayBuffer()), contentType: "audio/wav" };
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
