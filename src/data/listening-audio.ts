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
  | { type: "model-ready"; requestId?: number }
  | { type: "generating" | "cache-hit"; requestId: number }
  | { type: "audio"; audio: Blob; requestId: number }
  | { type: "error"; message?: string; requestId?: number };

export class NaturalVoicePlayer {
  private worker: Worker | undefined;
  private audio: HTMLAudioElement | undefined;
  private audioUrl: string | undefined;
  private requestId = 0;
  private fallback: (() => void) | undefined;

  constructor(private readonly onState: (state: NaturalVoiceState) => void) {}

  preload(): void {
    const worker = this.ensureWorker();
    if (!worker) return;
    this.onState({ status: "loading", progress: 0 });
    worker.postMessage({ type: "preload", requestId: this.requestId });
  }

  prepare(texts: readonly string[], voice: string, speed: number): void {
    const worker = this.ensureWorker();
    if (!worker || texts.length === 0) return;
    worker.postMessage({ type: "prepare", texts: [...texts], voice, speed });
  }

  generate(text: string, voice: string, speed: number, fallback?: () => void): void {
    this.fallback = fallback;
    const worker = this.ensureWorker();
    if (!worker) return;

    this.stop();
    this.requestId += 1;
    this.onState({ status: "generating" });
    worker.postMessage({ type: "generate", requestId: this.requestId, text, voice, speed });
  }

  private ensureWorker(): Worker | undefined {
    if (this.worker) return this.worker;
    if (!("Worker" in window) || !("Audio" in window)) {
      this.onState({
        status: "error",
        message: "A voz neural não é compatível com este navegador.",
      });
      this.playFallback();
      return undefined;
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
      } else if (event.data.type === "model-ready") {
        this.onState({ status: "ready" });
      } else if (event.data.type === "generating") {
        this.onState({ status: "generating" });
      } else if (event.data.type === "cache-hit") {
        this.onState({ status: "ready" });
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
    return this.worker;
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
