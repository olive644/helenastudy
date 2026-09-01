import type { SpeechProvider, SpeechRequest } from "./speech-handler.js";

const GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts";
const GEMINI_TTS_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent`;
const GEMINI_TTS_VOICE = "Aoede";
const SAMPLE_RATE = 24_000;

type GeminiAudioResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ inlineData?: { data?: string } }> };
  }>;
};

function paceInstruction(rate: number): string {
  if (rate <= 0.75) return "slowly, with clear pauses between words";
  if (rate <= 0.9) return "at a calm, clear learning pace";
  return "at a natural conversational pace";
}

function decodeBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

export function pcmToWave(pcm: Uint8Array): Uint8Array {
  const wave = new Uint8Array(44 + pcm.byteLength);
  const view = new DataView(wave.buffer);
  const writeText = (offset: number, text: string) => {
    for (let index = 0; index < text.length; index += 1)
      wave[offset + index] = text.charCodeAt(index);
  };
  writeText(0, "RIFF");
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeText(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, pcm.byteLength, true);
  wave.set(pcm, 44);
  return wave;
}

export function createGeminiSpeechProvider(apiKey: string): SpeechProvider {
  return {
    async synthesize(request: SpeechRequest): Promise<Uint8Array> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12_000);
      try {
        const response = await fetch(GEMINI_TTS_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Read only the English text represented by this JSON string exactly as written. Use natural American English ${paceInstruction(request.rate)}. Do not add commentary: ${JSON.stringify(request.text)}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: GEMINI_TTS_VOICE } },
              },
            },
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          console.error(`Gemini TTS respondeu com HTTP ${response.status}.`);
          throw Object.assign(new Error("Gemini TTS request failed"), {
            providerStatus: response.status,
          });
        }
        const result = (await response.json()) as GeminiAudioResponse;
        const audio = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audio) throw new Error("Gemini TTS returned no audio");
        return pcmToWave(decodeBase64(audio));
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
