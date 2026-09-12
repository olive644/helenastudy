import os
from dataclasses import dataclass


def _int_env(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    service_token: str
    kokoro_voice: str
    piper_voice: str
    kokoro_timeout_ms: int
    piper_timeout_ms: int
    cache_ttl_seconds: int
    cache_max_entries: int
    max_concurrent_kokoro: int
    max_concurrent_piper: int
    max_text_length: int


def load_settings() -> Settings:
    return Settings(
        service_token=os.environ.get("TTS_SERVICE_TOKEN", ""),
        kokoro_voice=os.environ.get("KOKORO_VOICE", "af_heart"),
        piper_voice=os.environ.get("PIPER_VOICE", "en_US-hfc_female-medium"),
        kokoro_timeout_ms=_int_env("KOKORO_TIMEOUT_MS", 6_000),
        piper_timeout_ms=_int_env("PIPER_TIMEOUT_MS", 6_000),
        cache_ttl_seconds=_int_env("TTS_CACHE_TTL_SECONDS", 3600),
        cache_max_entries=_int_env("TTS_CACHE_MAX_ENTRIES", 512),
        max_concurrent_kokoro=_int_env("TTS_MAX_CONCURRENT_KOKORO", 2),
        max_concurrent_piper=_int_env("TTS_MAX_CONCURRENT_PIPER", 2),
        max_text_length=_int_env("TTS_MAX_TEXT_LENGTH", 160),
    )
