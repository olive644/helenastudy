/// <reference lib="webworker" />

import { download, predict } from "@mintplex-labs/piper-tts-web";

const DEFAULT_VOICE = "en_US-hfc_female-medium";

type WorkerRequest =
  | { type: "load" }
  | { type: "generate"; requestId: number; text: string; voice: string; speed: number };

type ProgressInfo = { loaded: number; total: number };

let modelPromise: Promise<void> | undefined;
let cancelledBefore = 0;

function progressPercent(info: ProgressInfo): number {
  return info.total > 0 ? Math.round((info.loaded / info.total) * 100) : 0;
}

function loadModel(): Promise<void> {
  if (modelPromise) return modelPromise;
  modelPromise = download(DEFAULT_VOICE, (info) => {
    self.postMessage({ type: "progress", progress: progressPercent(info) });
  }).then(() => {
    self.postMessage({ type: "ready" });
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
    await loadModel();
    const audio = await predict({ text: request.text, voiceId: request.voice });
    if (request.requestId <= cancelledBefore) return;
    self.postMessage({
      type: "audio",
      requestId: request.requestId,
      audio,
      speed: request.speed,
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      requestId: request.requestId,
      message: error instanceof Error ? error.message : "Não foi possível gerar o áudio.",
    });
  }
});
