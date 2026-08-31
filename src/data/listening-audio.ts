export type NaturalVoiceStatus = "idle" | "loading" | "ready" | "generating" | "playing" | "error";

export type NaturalVoiceState = {
  status: NaturalVoiceStatus;
  progress?: number;
  message?: string;
};

export const PIPER_VOICES = [
  { id: "en_US-hfc_female-medium", label: "HFC feminina, inglês americano" },
  { id: "en_US-lessac-medium", label: "Lessac, inglês americano" },
  { id: "en_GB-alba-medium", label: "Alba, inglês britânico" },
] as const;

type NaturalVoiceWorkerMessage =
  | { type: "progress"; progress?: number }
  | { type: "ready" }
  | { type: "audio"; audio: Blob; speed: number; requestId: number }
  | { type: "error"; message?: string };

export class NaturalVoicePlayer {
  private worker: Worker | undefined;
  private audio: HTMLAudioElement | undefined;
  private audioUrl: string | undefined;
  private requestId = 0;

  constructor(private readonly onState: (state: NaturalVoiceState) => void) {}

  load(): void {
    if (this.worker) return;
    if (!("Worker" in window) || !("Audio" in window)) {
      this.onState({
        status: "error",
        message: "A voz natural não é compatível com este navegador.",
      });
      return;
    }
    this.onState({ status: "loading", progress: 0 });
    this.worker = new Worker(new URL("../workers/piper-tts.worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.addEventListener("message", (event: MessageEvent<NaturalVoiceWorkerMessage>) => {
      const type = event.data.type;
      if (type === "progress") {
        this.onState(
          event.data.progress === undefined
            ? { status: "loading" }
            : { status: "loading", progress: event.data.progress },
        );
      } else if (type === "ready") {
        this.onState({ status: "ready" });
      } else if (type === "audio") {
        void this.playBlob(event.data.audio, event.data.speed, event.data.requestId);
      } else if (type === "error") {
        this.onState({
          status: "error",
          message: event.data.message ?? "Falha na voz natural.",
        });
      }
    });
    this.worker.addEventListener("error", () => {
      this.onState({
        status: "error",
        message: "A voz natural ficou sem memória ou não pôde iniciar.",
      });
    });
    this.worker.postMessage({ type: "load" });
  }

  generate(text: string, voice: string, speed: number): void {
    if (!this.worker) {
      this.load();
      if (!this.worker) return;
    }
    this.stop();
    this.requestId += 1;
    this.onState({ status: "generating" });
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

  private async playBlob(blob: Blob, speed: number, requestId: number) {
    if (requestId !== this.requestId) return;
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.playbackRate = speed;
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
    await audio.play();
  }
}
