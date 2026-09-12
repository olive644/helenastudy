import asyncio
import logging

from .cache import SynthesisCache, normalize_cache_key
from .kokoro_engine import KokoroEngine
from .piper_engine import PiperEngine

logger = logging.getLogger("tts.router")


class AllProvidersFailedError(Exception):
    """Levantado quando Kokoro e Piper falham ou excedem o tempo limite.
    O chamador (proxy da Vercel) deve tratar isso como sinal para o
    navegador usar a Web Speech API."""


class TtsRouter:
    def __init__(
        self,
        kokoro: KokoroEngine,
        piper: PiperEngine,
        cache: SynthesisCache,
        kokoro_timeout_ms: int,
        piper_timeout_ms: int,
        kokoro_voice: str,
    ) -> None:
        self._kokoro = kokoro
        self._piper = piper
        self._cache = cache
        self._kokoro_timeout = kokoro_timeout_ms / 1000
        self._piper_timeout = piper_timeout_ms / 1000
        self._kokoro_voice = kokoro_voice

    async def synthesize(self, text: str, rate: float) -> tuple[bytes, str]:
        """Retorna (audio_wav, provedor_usado). Levanta AllProvidersFailedError
        quando nenhum provedor conseguiu gerar o audio."""
        cache_key = normalize_cache_key(text, self._kokoro_voice, rate)
        provider_used = {"value": ""}

        async def produce() -> bytes:
            audio = await self._try_kokoro(text, rate)
            if audio is not None:
                provider_used["value"] = "kokoro"
                return audio
            audio = await self._try_piper(text, rate)
            if audio is not None:
                provider_used["value"] = "piper"
                return audio
            raise AllProvidersFailedError("Kokoro e Piper falharam ou excederam o tempo limite.")

        audio = await self._cache.get_or_create(cache_key, produce)
        return audio, provider_used["value"] or "cache"

    async def _try_kokoro(self, text: str, rate: float) -> bytes | None:
        if not self._kokoro.is_loaded():
            logger.warning("Kokoro indisponivel, tentando Piper.")
            return None
        try:
            return await asyncio.wait_for(
                self._kokoro.synthesize(text, self._kokoro_voice, rate), timeout=self._kokoro_timeout
            )
        except asyncio.TimeoutError:
            logger.warning("Kokoro excedeu o tempo limite, tentando Piper.")
            return None
        except Exception:
            logger.exception("Kokoro falhou, tentando Piper.")
            return None

    async def _try_piper(self, text: str, rate: float) -> bytes | None:
        if not self._piper.is_loaded():
            logger.warning("Piper indisponivel.")
            return None
        try:
            return await asyncio.wait_for(
                self._piper.synthesize(text, rate), timeout=self._piper_timeout
            )
        except asyncio.TimeoutError:
            logger.warning("Piper excedeu o tempo limite.")
            return None
        except Exception:
            logger.exception("Piper falhou.")
            return None
