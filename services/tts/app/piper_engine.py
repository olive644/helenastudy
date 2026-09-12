import asyncio
import io
import logging
import wave

logger = logging.getLogger("tts.piper")

PIPER_MODEL_DIR = "models/piper"


class PiperEngine:
    """Encapsula o Piper (piper-tts), usado como voz de reserva quando o
    Kokoro falha, excede o tempo limite ou esta indisponivel."""

    def __init__(self, voice_name: str, model_dir: str = PIPER_MODEL_DIR) -> None:
        self._voice_name = voice_name
        self._model_dir = model_dir
        self._voice = None
        self._semaphore: asyncio.Semaphore | None = None

    def configure_concurrency(self, max_concurrent: int) -> None:
        self._semaphore = asyncio.Semaphore(max_concurrent)

    def load(self) -> bool:
        try:
            from piper import PiperVoice

            model_path = f"{self._model_dir}/{self._voice_name}.onnx"
            config_path = f"{model_path}.json"
            self._voice = PiperVoice.load(model_path, config_path=config_path)
            logger.info("Piper carregado com sucesso (voz %s).", self._voice_name)
            return True
        except Exception:
            logger.exception("Falha ao carregar o Piper.")
            self._voice = None
            return False

    def is_loaded(self) -> bool:
        return self._voice is not None

    async def synthesize(self, text: str, rate: float) -> bytes:
        if self._voice is None:
            raise RuntimeError("Piper nao esta carregado.")
        semaphore = self._semaphore or asyncio.Semaphore(1)
        async with semaphore:
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(None, self._synthesize_sync, text, rate)

    def _synthesize_sync(self, text: str, rate: float) -> bytes:
        from piper import SynthesisConfig

        assert self._voice is not None
        length_scale = 1.0 / max(rate, 0.1)
        syn_config = SynthesisConfig(length_scale=length_scale)
        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wav_file:
            self._voice.synthesize_wav(text, wav_file, syn_config=syn_config)
        return buffer.getvalue()
