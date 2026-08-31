/// <reference lib="webworker" />

import { KokoroTTS } from "kokoro-js";

type WorkerRequest =
  | { type: "load" }
  | { type: "generate"; requestId: number; text: string; voice: string; speed: number };

type ProgressInfo = { progress?: number; loaded?: number; total?: number; status?: string };

let modelPromise: Promise<KokoroTTS> | undefined;
let cancelledBefore = 0;

function progressPercent(info: ProgressInfo): number | undefined {
  if (typeof info.progress === "number") return Math.round(info.progress);
  if (info.loaded && info.total) return Math.round((info.loaded / info.total) * 100);
  return undefined;
}

function loadModel(): Promise<KokoroTTS> {
  modelPromise ??= KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
    dtype: "q4",
    device: "wasm",
    progress_callback: (info: ProgressInfo) => {
      self.postMessage({ type: "progress", percent: progressPercent(info), status: info.status });
    },
  }).then((model) => {
    self.postMessage({ type: "ready" });
    return model;
  });
  return modelPromise;
}

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  if (request.type === "load") {
    try {
      await loadModel();
    } catch (error) {
      modelPromise = undefined;
      self.postMessage({
        type: "error",
        message: error instanceof Error ? error.message : "Falha ao carregar a voz.",
      });
    }
    return;
  }

  cancelledBefore = request.requestId - 1;
  try {
    const model = await loadModel();
    const audio = await model.generate(request.text, {
      voice: request.voice,
      speed: request.speed,
    });
    if (request.requestId <= cancelledBefore) return;
    const samples = audio.audio.slice();
    self.postMessage(
      { type: "audio", requestId: request.requestId, samples, sampleRate: audio.sampling_rate },
      [samples.buffer],
    );
  } catch (error) {
    self.postMessage({
      type: "error",
      requestId: request.requestId,
      message: error instanceof Error ? error.message : "Não foi possível gerar o áudio.",
    });
  }
});
