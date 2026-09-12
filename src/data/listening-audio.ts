export type NaturalVoiceStatus = "idle" | "generating" | "playing" | "ready" | "error";

export type NaturalVoiceState = {
  status: NaturalVoiceStatus;
  message?: string;
};

export class NaturalVoicePlayer {
  private audio: HTMLAudioElement | undefined;
  private audioUrl: string | undefined;
  private controller: AbortController | undefined;
  private requestId = 0;
  private readonly cache = new Map<string, Promise<Blob>>();

  constructor(private readonly onState: (state: NaturalVoiceState) => void) {}

  preload(text: string, rate: number): void {
    void this.load(text, rate).catch(() => undefined);
  }

  async generate(text: string, rate: number, fallback?: () => void): Promise<void> {
    this.stopPlayback();
    const requestId = this.requestId;
    this.onState({ status: "generating" });

    try {
      const blob = await this.load(text, rate);
      if (requestId !== this.requestId) return;
      await this.playBlob(blob, requestId);
    } catch (error) {
      if (requestId !== this.requestId) return;
      if (error instanceof DOMException && error.name === "AbortError") {
        this.onState({
          status: "error",
          message: "O Gemini demorou demais. Tente reproduzir novamente.",
        });
        fallback?.();
        return;
      }
      this.onState({
        status: "error",
        message: "Gemini indisponível. Usando a voz inglesa do dispositivo.",
      });
      fallback?.();
    }
  }

  stop(): void {
    this.controller?.abort();
    this.controller = undefined;
    this.cache.clear();
    this.stopPlayback();
  }

  private stopPlayback(): void {
    this.audio?.pause();
    this.audio = undefined;
    if (this.audioUrl) URL.revokeObjectURL(this.audioUrl);
    this.audioUrl = undefined;
    this.requestId += 1;
  }

  dispose(): void {
    this.stop();
  }

  private load(text: string, rate: number): Promise<Blob> {
    const cacheKey = `${rate}:${text}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const request = (async () => {
      this.controller = new AbortController();
      const timeout = window.setTimeout(() => this.controller?.abort(), 6_000);
      try {
        const response = await fetch("/api/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, rate, consent: true }),
          signal: this.controller.signal,
        });
        if (!response.ok) throw new Error("Gemini speech unavailable");
        return await response.blob();
      } finally {
        window.clearTimeout(timeout);
      }
    })();
    this.cache.set(cacheKey, request);
    return request;
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
      throw new Error("Browser blocked audio playback");
    }
  }
}
