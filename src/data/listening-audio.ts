import type { GeminiSpeechVoice } from "../backend/speech-handler";

export type NaturalVoiceStatus = "idle" | "generating" | "playing" | "ready" | "error";

export type NaturalVoiceState = {
  status: NaturalVoiceStatus;
  message?: string;
};

export const GEMINI_VOICES: readonly { id: GeminiSpeechVoice; label: string }[] = [
  { id: "Kore", label: "Kore, clara e firme" },
  { id: "Aoede", label: "Aoede, leve e natural" },
  { id: "Charon", label: "Charon, calmo e grave" },
];

export class NaturalVoicePlayer {
  private audio: HTMLAudioElement | undefined;
  private audioUrl: string | undefined;
  private controller: AbortController | undefined;
  private requestId = 0;
  private readonly cache = new Map<string, Blob>();

  constructor(private readonly onState: (state: NaturalVoiceState) => void) {}

  async generate(
    text: string,
    voice: GeminiSpeechVoice,
    rate: number,
    fallback?: () => void,
  ): Promise<void> {
    this.stop();
    const requestId = this.requestId;
    const cacheKey = `${voice}:${rate}:${text}`;
    this.onState({ status: "generating" });

    try {
      let blob = this.cache.get(cacheKey);
      if (!blob) {
        this.controller = new AbortController();
        const timeout = window.setTimeout(() => this.controller?.abort(), 6_000);
        try {
          const response = await fetch("/api/speech", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, voice, rate, consent: true }),
            signal: this.controller.signal,
          });
          if (!response.ok) throw new Error("Gemini speech unavailable");
          blob = await response.blob();
          this.cache.set(cacheKey, blob);
        } finally {
          window.clearTimeout(timeout);
        }
      }
      if (requestId !== this.requestId) return;
      await this.playBlob(blob, requestId);
    } catch (error) {
      if (requestId !== this.requestId) return;
      if (error instanceof DOMException && error.name === "AbortError") {
        this.onState({
          status: "error",
          message: "O Gemini demorou demais. A voz do dispositivo foi usada.",
        });
        fallback?.();
        return;
      }
      this.onState({
        status: "error",
        message: "Gemini indisponível agora. A voz do dispositivo foi usada.",
      });
      fallback?.();
    }
  }

  stop(): void {
    this.controller?.abort();
    this.controller = undefined;
    this.audio?.pause();
    this.audio = undefined;
    if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
    this.audioUrl = undefined;
    this.requestId += 1;
  }

  dispose(): void {
    this.stop();
    this.cache.clear();
  }

  private async playBlob(blob: Blob, requestId: number): Promise<void> {
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.addEventListener(
      "ended",
      () => {
        URL.revokeObjectURL(audioUrl);
        if (requestId === this.requestId) this.onState({ status: "ready" });
      },
      { once: true },
    );
    this.audioUrl = audioUrl;
    this.audio = audio;
    this.onState({ status: "playing" });
    try {
      await audio.play();
    } catch {
      URL.revokeObjectURL(audioUrl);
      this.onState({ status: "error", message: "O navegador bloqueou a reprodução do áudio." });
    }
  }
}
