import asyncio
import logging

from .audio import pcm_float_to_wave

logger = logging.getLogger("tts.kokoro")

KOKORO_SAMPLE_RATE = 24_000
KOKORO_MODEL_PATH = "models/kokoro-v1.0.onnx"
KOKORO_VOICES_PATH = "models/voices-v1.0.bin"


class KokoroEngine:
    """Encapsula o Kokoro (kokoro-onnx), carregado uma unica vez e reaproveitado
    entre requisicoes. A sintese roda em uma thread separada porque o runtime
    ONNX e sincrono e bloquearia o loop de eventos do FastAPI."""

    def __init__(self, model_path: str = KOKORO_MODEL_PATH, voices_path: str = KOKORO_VOICES_PATH) -> None:
        self._model_path = model_path
        self._voices_path = voices_path
        self._kokoro = None
        self._semaphore: asyncio.Semaphore | None = None

    def configure_concurrency(self, max_concurrent: int) -> None:
        self._semaphore = asyncio.Semaphore(max_concurrent)

    def load(self) -> bool:
        try:
            from kokoro_onnx import Kokoro

            self._kokoro = Kokoro(self._model_path, self._voices_path)
            logger.info("Kokoro carregado com sucesso.")
            return True
        except Exception:
            logger.exception("Falha ao carregar o Kokoro.")
            self._kokoro = None
            return False

    def is_loaded(self) -> bool:
        return self._kokoro is not None

    async def synthesize(self, text: str, voice: str, rate: float) -> bytes:
        if self._kokoro is None:
            raise RuntimeError("Kokoro nao esta carregado.")
        semaphore = self._semaphore or asyncio.Semaphore(1)
        async with semaphore:
            loop = asyncio.get_running_loop()
            samples, sample_rate = await loop.run_in_executor(
                None, self._synthesize_sync, text, voice, rate
            )
        return pcm_float_to_wave(samples, sample_rate)

    def _synthesize_sync(self, text: str, voice: str, rate: float):
        assert self._kokoro is not None
        return self._kokoro.create(text, voice=voice, speed=rate, lang="en-us")
