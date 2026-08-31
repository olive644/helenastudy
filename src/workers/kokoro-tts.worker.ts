/// <reference lib="webworker" />

import { KokoroTTS } from "kokoro-js";

type VoiceRequest = { voice: string; speed: number };
type WorkerRequest =
  | { type: "preload"; requestId: number }
  | ({ type: "generate"; requestId: number; text: string } & VoiceRequest)
  | ({ type: "prepare"; texts: string[] } & VoiceRequest);

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
let modelPromise: Promise<KokoroTTS> | undefined;
let generationQueue = Promise.resolve();
const audioCache = new Map<string, Blob>();

function loadModel(requestId: number): Promise<KokoroTTS> {
  if (modelPromise) return modelPromise;

  modelPromise = KokoroTTS.from_pretrained(MODEL_ID, {
    device: "wasm",
    dtype: "q8",
    progress_callback: (event) => {
      const progress =
        "progress" in event && typeof event.progress === "number"
          ? Math.round(event.progress)
          : undefined;
      self.postMessage({ type: "progress", requestId, progress });
    },
  }).catch((error: unknown) => {
    modelPromise = undefined;
    throw error;
  });
  return modelPromise;
}

function cacheKey(text: string, voice: string, speed: number): string {
  return `${voice}:${speed}:${text.toLocaleLowerCase("en-US")}`;
}

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const result = generationQueue.then(task, task);
  generationQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function synthesize(text: string, voice: string, speed: number): Promise<Blob> {
  const key = cacheKey(text, voice, speed);
  const cached = audioCache.get(key);
  if (cached) return cached;
  const model = await loadModel(0);
  const audio = await model.generate(text, {
    voice: voice as "af_heart" | "af_bella" | "bf_emma",
    speed,
  });
  const blob = audio.toBlob();
  audioCache.set(key, blob);
  return blob;
}

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;

  try {
    if (request.type === "preload") {
      await loadModel(request.requestId);
      self.postMessage({ type: "model-ready", requestId: request.requestId });
      return;
    }
    if (request.type === "prepare") {
      await loadModel(0);
      for (const text of request.texts.slice(0, 3)) {
        await enqueue(() => synthesize(text, request.voice, request.speed));
      }
      return;
    }

    const key = cacheKey(request.text, request.voice, request.speed);
    const cached = audioCache.get(key);
    self.postMessage({ type: cached ? "cache-hit" : "generating", requestId: request.requestId });
    const audio = cached
      ? cached
      : await enqueue(() => synthesize(request.text, request.voice, request.speed));
    self.postMessage({
      type: "audio",
      requestId: request.requestId,
      audio,
    });
  } catch {
    if (request.type === "prepare") return;
    self.postMessage({
      type: "error",
      requestId: request.requestId,
      message: "O Kokoro não carregou. Usando automaticamente a melhor voz do dispositivo.",
    });
  }
});
