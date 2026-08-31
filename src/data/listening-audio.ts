export type NaturalVoiceStatus = "idle" | "loading" | "ready" | "generating" | "playing" | "error";

export type NaturalVoiceState = {
  status: NaturalVoiceStatus;
  progress?: number;
  message?: string;
};

export const KOKORO_VOICES = [
  { id: "af_heart", label: "Heart, inglês americano" },
  { id: "af_bella", label: "Bella, inglês americano" },
  { id: "bf_emma", label: "Emma, inglês britânico" },
] as const;

type NaturalVoiceWorkerMessage =
  | { type: "progress"; progress?: number; requestId?: number }
  | { type: "ready"; requestId?: number }
  | { type: "audio"; audio: Blob; requestId: number }
  | { type: "error"; message?: string; requestId?: number };

export class NaturalVoicePlayer {
  private worker: Worker | undefined;
  private audio: HTMLAudioElement | undefined;
  private audioUrl: string | undefined;
  private requestId = 0;
  private fallback: (() => void) | undefined;

  constructor(private readonly onState: (state: NaturalVoiceState) => void) {}

  generate(text: string, voice: string, speed: number, fallback?: () => void): void {
    this.fallback = fallback;
    if (!this.worker) {
      if (!("Worker" in window) || !("Audio" in window)) {
        this.onState({
          status: "error",
          message: "A voz neural não é compatível com este navegador.",
        });
        return;
      }
      this.worker = new Worker(new URL("../workers/kokoro-tts.worker.ts", import.meta.url), {
        type: "module",
      });
      this.worker.addEventListener("message", (event: MessageEvent<NaturalVoiceWorkerMessage>) => {
        if (event.data.requestId !== undefined && event.data.requestId !== this.requestId) return;
        if (event.data.type === "progress") {
          this.onState(
            event.data.progress === undefined
              ? { status: "loading" }
              : { status: "loading", progress: event.data.progress },
          );
        } else if (event.data.type === "ready") {
          this.onState({ status: "generating" });
        } else if (event.data.type === "audio") {
          void this.playBlob(event.data.audio, event.data.requestId);
        } else if (event.data.type === "error") {
          this.onState({
            status: "error",
            message: event.data.message ?? "Não foi possível iniciar a voz Kokoro.",
          });
          this.playFallback();
        }
      });
      this.worker.addEventListener("error", () => {
        this.onState({
          status: "error",
          message: "A voz Kokoro não pôde iniciar neste dispositivo.",
        });
        this.playFallback();
      });
    }

    this.stop();
    this.requestId += 1;
    this.onState({ status: "loading", progress: 0 });
    this.worker.postMessage({ type: "generate", requestId: this.requestId, text, voice, speed });
  }

  stop(): void {
    this.audio?.pause();
    this.audio = undefined;
    if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
    this.audioUrl = undefined;
    this.requestId += 1;
  }

  dispose(): void {
    this.stop();
    this.worker?.terminate();
    this.worker = undefined;
  }

  private playFallback(): void {
    const fallback = this.fallback;
    this.fallback = undefined;
    fallback?.();
  }

  private async playBlob(blob: Blob, requestId: number) {
    if (requestId !== this.requestId) return;
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.addEventListener(
      "ended",
      () => {
        URL.revokeObjectURL(audioUrl);
        this.onState({ status: "ready" });
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
