"""Testes de integracao com os modelos reais do Kokoro e do Piper.

Pulados automaticamente quando os arquivos de modelo nao estao presentes em
services/tts/models (eles sao grandes demais para ir no repositorio e nao sao
baixados durante o CI padrao). Rode scripts/download-voice-models.sh antes de
executar estes testes localmente para validar a sintese de audio de verdade."""

import os
import wave
from io import BytesIO
from pathlib import Path

import pytest

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
KOKORO_MODEL = MODELS_DIR / "kokoro-v1.0.onnx"
KOKORO_VOICES = MODELS_DIR / "voices-v1.0.bin"
PIPER_MODEL = MODELS_DIR / "piper" / "en_US-hfc_female-medium.onnx"

requires_real_models = pytest.mark.skipif(
    not (KOKORO_MODEL.exists() and KOKORO_VOICES.exists() and PIPER_MODEL.exists()),
    reason="Modelos reais do Kokoro/Piper nao encontrados em services/tts/models.",
)


def _is_valid_wav(data: bytes) -> bool:
    try:
        with wave.open(BytesIO(data), "rb") as wav_file:
            return wav_file.getnframes() > 0
    except Exception:
        return False


@requires_real_models
def test_kokoro_produces_valid_audio():
    from app.kokoro_engine import KokoroEngine

    engine = KokoroEngine(str(KOKORO_MODEL), str(KOKORO_VOICES))
    engine.configure_concurrency(1)
    assert engine.load() is True

    import asyncio

    audio = asyncio.run(engine.synthesize("Hello, how are you today?", "af_heart", 0.86))
    assert _is_valid_wav(audio)


@requires_real_models
def test_piper_produces_valid_audio():
    from app.piper_engine import PiperEngine

    engine = PiperEngine("en_US-hfc_female-medium", str(MODELS_DIR / "piper"))
    engine.configure_concurrency(1)
    assert engine.load() is True

    import asyncio

    audio = asyncio.run(engine.synthesize("Hello, how are you today?", 0.86))
    assert _is_valid_wav(audio)


@requires_real_models
def test_router_uses_kokoro_first_with_real_engines():
    import asyncio

    from app.cache import SynthesisCache
    from app.kokoro_engine import KokoroEngine
    from app.piper_engine import PiperEngine
    from app.tts_router import TtsRouter

    kokoro = KokoroEngine(str(KOKORO_MODEL), str(KOKORO_VOICES))
    kokoro.configure_concurrency(1)
    kokoro.load()
    piper = PiperEngine("en_US-hfc_female-medium", str(MODELS_DIR / "piper"))
    piper.configure_concurrency(1)
    piper.load()
    router = TtsRouter(
        kokoro=kokoro,
        piper=piper,
        cache=SynthesisCache(max_entries=10, ttl_seconds=60),
        kokoro_timeout_ms=15_000,
        piper_timeout_ms=15_000,
        kokoro_voice="af_heart",
    )

    audio, provider = asyncio.run(router.synthesize("Water", 0.86))
    assert provider == "kokoro"
    assert _is_valid_wav(audio)


@requires_real_models
def test_router_falls_back_to_piper_when_kokoro_engine_unavailable():
    import asyncio

    from app.cache import SynthesisCache
    from app.kokoro_engine import KokoroEngine
    from app.piper_engine import PiperEngine
    from app.tts_router import TtsRouter

    kokoro = KokoroEngine("models/does-not-exist.onnx", "models/does-not-exist.bin")
    kokoro.configure_concurrency(1)
    kokoro.load()
    assert kokoro.is_loaded() is False

    piper = PiperEngine("en_US-hfc_female-medium", str(MODELS_DIR / "piper"))
    piper.configure_concurrency(1)
    piper.load()
    router = TtsRouter(
        kokoro=kokoro,
        piper=piper,
        cache=SynthesisCache(max_entries=10, ttl_seconds=60),
        kokoro_timeout_ms=15_000,
        piper_timeout_ms=15_000,
        kokoro_voice="af_heart",
    )

    audio, provider = asyncio.run(router.synthesize("Family", 0.86))
    assert provider == "piper"
    assert _is_valid_wav(audio)
