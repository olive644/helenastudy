/// <reference lib="webworker" />

import { KokoroTTS } from "kokoro-js";

type WorkerRequest = {
  type: "generate";
  requestId: number;
  text: string;
  voice: string;
  speed: number;
};

const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
let modelPromise: Promise<KokoroTTS> | undefined;

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

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  if (request.type !== "generate") return;

  try {
    const model = await loadModel(request.requestId);
    self.postMessage({ type: "ready", requestId: request.requestId });
    const audio = await model.generate(request.text, {
      voice: request.voice as "af_heart" | "af_bella" | "bf_emma",
      speed: request.speed,
    });
    self.postMessage({
      type: "audio",
      requestId: request.requestId,
      audio: audio.toBlob(),
    });
  } catch {
    self.postMessage({
      type: "error",
      requestId: request.requestId,
      message: "O Kokoro não carregou. Usando automaticamente a melhor voz do dispositivo.",
    });
  }
});
