/// <reference lib="webworker" />

type WorkerRequest = {
  type: "generate";
  requestId: number;
  text: string;
  voice: string;
  speed: number;
};

type ProgressInfo = { loaded: number; total: number };

function progressPercent(info: ProgressInfo): number | undefined {
  return info.total > 0 ? Math.round((info.loaded / info.total) * 100) : undefined;
}

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  if (request.type !== "generate") return;

  try {
    // ONNX usa SharedArrayBuffer quando detecta várias CPUs. GitHub Pages não envia os
    // cabeçalhos de isolamento necessários, então uma única thread é a opção compatível.
    Object.defineProperty(self.navigator, "hardwareConcurrency", { value: 1, configurable: true });
    const { predict } = await import("@mintplex-labs/piper-tts-web");
    const audio = await predict(
      { text: request.text, voiceId: request.voice },
      (info: ProgressInfo) => {
        self.postMessage({
          type: "progress",
          requestId: request.requestId,
          progress: progressPercent(info),
        });
      },
    );
    self.postMessage({ type: "ready", requestId: request.requestId });
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
