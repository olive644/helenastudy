import asyncio

import pytest

from app.cache import SynthesisCache
from app.tts_router import AllProvidersFailedError, TtsRouter


class FakeEngine:
    def __init__(self, loaded=True, result=b"audio", error=None, delay=0.0):
        self._loaded = loaded
        self._result = result
        self._error = error
        self._delay = delay
        self.calls = 0

    def is_loaded(self):
        return self._loaded


class FakeKokoro(FakeEngine):
    async def synthesize(self, text, voice, rate):
        self.calls += 1
        if self._delay:
            await asyncio.sleep(self._delay)
        if self._error:
            raise self._error
        return self._result


class FakePiper(FakeEngine):
    async def synthesize(self, text, rate):
        self.calls += 1
        if self._delay:
            await asyncio.sleep(self._delay)
        if self._error:
            raise self._error
        return self._result


def make_router(kokoro, piper, kokoro_timeout_ms=1000, piper_timeout_ms=1000):
    cache = SynthesisCache(max_entries=10, ttl_seconds=60)
    return TtsRouter(
        kokoro=kokoro,
        piper=piper,
        cache=cache,
        kokoro_timeout_ms=kokoro_timeout_ms,
        piper_timeout_ms=piper_timeout_ms,
        kokoro_voice="af_heart",
    )


@pytest.mark.asyncio
async def test_uses_kokoro_when_it_succeeds():
    kokoro = FakeKokoro(result=b"kokoro-audio")
    piper = FakePiper()
    router = make_router(kokoro, piper)
    audio, provider = await router.synthesize("hello", 0.86)
    assert audio == b"kokoro-audio"
    assert provider == "kokoro"
    assert piper.calls == 0


@pytest.mark.asyncio
async def test_falls_back_to_piper_when_kokoro_raises():
    kokoro = FakeKokoro(error=RuntimeError("boom"))
    piper = FakePiper(result=b"piper-audio")
    router = make_router(kokoro, piper)
    audio, provider = await router.synthesize("hello", 0.86)
    assert audio == b"piper-audio"
    assert provider == "piper"


@pytest.mark.asyncio
async def test_falls_back_to_piper_when_kokoro_times_out():
    kokoro = FakeKokoro(delay=0.2)
    piper = FakePiper(result=b"piper-audio")
    router = make_router(kokoro, piper, kokoro_timeout_ms=10)
    audio, provider = await router.synthesize("hello", 0.86)
    assert audio == b"piper-audio"
    assert provider == "piper"


@pytest.mark.asyncio
async def test_falls_back_to_piper_when_kokoro_not_loaded():
    kokoro = FakeKokoro(loaded=False)
    piper = FakePiper(result=b"piper-audio")
    router = make_router(kokoro, piper)
    audio, provider = await router.synthesize("hello", 0.86)
    assert audio == b"piper-audio"
    assert provider == "piper"


@pytest.mark.asyncio
async def test_raises_when_both_providers_fail():
    kokoro = FakeKokoro(error=RuntimeError("boom"))
    piper = FakePiper(error=RuntimeError("boom too"))
    router = make_router(kokoro, piper)
    with pytest.raises(AllProvidersFailedError):
        await router.synthesize("hello", 0.86)


@pytest.mark.asyncio
async def test_raises_when_both_providers_unavailable():
    kokoro = FakeKokoro(loaded=False)
    piper = FakePiper(loaded=False)
    router = make_router(kokoro, piper)
    with pytest.raises(AllProvidersFailedError):
        await router.synthesize("hello", 0.86)
