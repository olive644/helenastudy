export type NaturalVoiceStatus = "idle" | "loading" | "ready" | "generating" | "playing" | "error";

export type NaturalVoiceState = {
  status: NaturalVoiceStatus;
  progress?: number;
  message?: string;
};

export const KOKORO_VOICES = [
  { id: "af_heart", label: "Heart, inglês americano" },
  { id: "af_sky", label: "Sky, inglês americano" },
  { id: "bf_emma", label: "Emma, inglês britânico" },
] as const;

type NaturalVoiceWorkerMessage =
  | { type: "progress"; progress?: number }
  | { type: "ready" }
  | { type: "audio"; samples: Float32Array; sampleRate: number; requestId: number }
  | { type: "error"; message?: string };

export class NaturalVoicePlayer {
  private worker: Worker | undefined;
  private context: AudioContext | undefined;
  private source: AudioBufferSourceNode | undefined;
  private requestId = 0;

  constructor(private readonly onState: (state: NaturalVoiceState) => void) {}

  load(): void {
    if (this.worker) return;
    if (!("Worker" in window) || !("AudioContext" in window)) {
      this.onState({
        status: "error",
        message: "A voz natural não é compatível com este navegador.",
      });
      return;
    }
    this.onState({ status: "loading", progress: 0 });
    this.worker = new Worker(new URL("../workers/kokoro-tts.worker.ts", import.meta.url), {
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
        void this.playSamples(event.data.samples, event.data.sampleRate, event.data.requestId);
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
    this.source?.stop();
    this.source = undefined;
    this.requestId += 1;
  }

  dispose(): void {
    this.stop();
    this.worker?.terminate();
    this.worker = undefined;
    void this.context?.close();
  }

  private async playSamples(samples: Float32Array, sampleRate: number, requestId: number) {
    if (requestId !== this.requestId) return;
    this.context ??= new AudioContext();
    await this.context.resume();
    const buffer = this.context.createBuffer(1, samples.length, sampleRate);
    buffer.copyToChannel(new Float32Array(samples), 0);
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.addEventListener("ended", () => this.onState({ status: "ready" }), { once: true });
    this.source = source;
    this.onState({ status: "playing" });
    source.start();
  }
}
