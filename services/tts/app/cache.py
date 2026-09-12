import asyncio
import time
from collections import OrderedDict
from typing import Awaitable, Callable


class SynthesisCache:
    """Cache em memoria por chave normalizada, com expiracao por tempo,
    limite de entradas (LRU) e uma unica sintese em voo por chave (singleflight),
    para que pedidos simultaneos da mesma palavra compartilhem o mesmo resultado."""

    def __init__(self, max_entries: int, ttl_seconds: int) -> None:
        self._max_entries = max_entries
        self._ttl_seconds = ttl_seconds
        self._entries: "OrderedDict[str, tuple[float, bytes]]" = OrderedDict()
        self._inflight: dict[str, asyncio.Task[bytes]] = {}
        self._lock = asyncio.Lock()

    def _evict_expired(self) -> None:
        now = time.monotonic()
        expired = [key for key, (expires_at, _) in self._entries.items() if expires_at <= now]
        for key in expired:
            del self._entries[key]

    async def get_or_create(self, key: str, factory: Callable[[], Awaitable[bytes]]) -> bytes:
        async with self._lock:
            self._evict_expired()
            cached = self._entries.get(key)
            if cached is not None:
                self._entries.move_to_end(key)
                return cached[1]
            task = self._inflight.get(key)
            if task is None:
                task = asyncio.ensure_future(self._produce(key, factory))
                self._inflight[key] = task
        return await task

    async def _produce(self, key: str, factory: Callable[[], Awaitable[bytes]]) -> bytes:
        try:
            data = await factory()
            async with self._lock:
                self._entries[key] = (time.monotonic() + self._ttl_seconds, data)
                self._entries.move_to_end(key)
                while len(self._entries) > self._max_entries:
                    self._entries.popitem(last=False)
            return data
        finally:
            async with self._lock:
                self._inflight.pop(key, None)

    def size(self) -> int:
        return len(self._entries)


def normalize_cache_key(text: str, voice: str, rate: float) -> str:
    normalized_text = " ".join(text.strip().lower().split())
    return f"{voice}:{round(rate, 2)}:{normalized_text}"
