import asyncio

import pytest

from app.cache import SynthesisCache, normalize_cache_key


def test_normalize_cache_key_ignores_case_and_extra_spaces():
    a = normalize_cache_key("  Hello   World  ", "af_heart", 0.86)
    b = normalize_cache_key("hello world", "af_heart", 0.86)
    assert a == b


def test_normalize_cache_key_differs_by_voice_and_rate():
    base = normalize_cache_key("hello", "af_heart", 0.86)
    assert base != normalize_cache_key("hello", "af_bella", 0.86)
    assert base != normalize_cache_key("hello", "af_heart", 1.0)


@pytest.mark.asyncio
async def test_get_or_create_reuses_cached_result():
    cache = SynthesisCache(max_entries=10, ttl_seconds=60)
    calls = 0

    async def factory() -> bytes:
        nonlocal calls
        calls += 1
        return b"audio"

    first = await cache.get_or_create("key", factory)
    second = await cache.get_or_create("key", factory)
    assert first == b"audio"
    assert second == b"audio"
    assert calls == 1


@pytest.mark.asyncio
async def test_concurrent_requests_for_same_key_share_one_synthesis():
    cache = SynthesisCache(max_entries=10, ttl_seconds=60)
    calls = 0
    started = asyncio.Event()

    async def factory() -> bytes:
        nonlocal calls
        calls += 1
        started.set()
        await asyncio.sleep(0.05)
        return b"audio"

    results = await asyncio.gather(
        cache.get_or_create("same-word", factory),
        cache.get_or_create("same-word", factory),
        cache.get_or_create("same-word", factory),
    )
    assert results == [b"audio", b"audio", b"audio"]
    assert calls == 1


@pytest.mark.asyncio
async def test_expired_entries_are_evicted():
    cache = SynthesisCache(max_entries=10, ttl_seconds=0)
    calls = 0

    async def factory() -> bytes:
        nonlocal calls
        calls += 1
        return b"audio"

    await cache.get_or_create("key", factory)
    await asyncio.sleep(0.01)
    await cache.get_or_create("key", factory)
    assert calls == 2


@pytest.mark.asyncio
async def test_max_entries_evicts_oldest_first():
    cache = SynthesisCache(max_entries=2, ttl_seconds=60)

    async def factory_for(value: bytes):
        async def factory() -> bytes:
            return value

        return factory

    await cache.get_or_create("a", await factory_for(b"a"))
    await cache.get_or_create("b", await factory_for(b"b"))
    await cache.get_or_create("c", await factory_for(b"c"))
    assert cache.size() == 2
