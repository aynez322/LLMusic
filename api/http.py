"""Shared async HTTP client with an on-disk response cache and per-host rate limiting."""
import asyncio
import json
import os
import time
from collections import deque

import diskcache
import httpx

CACHE_DIR = os.getenv("CACHE_DIR", os.path.join(os.path.dirname(__file__), "..", ".cache"))
cache = diskcache.Cache(os.path.join(CACHE_DIR, "http"), size_limit=512 * 1024**2)

_client: httpx.AsyncClient | None = None


def client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(10.0, connect=5.0),
            headers={"User-Agent": "LLMusic/2.0 (https://github.com/aynez322/LLMusic)"},
            follow_redirects=True,
        )
    return _client


async def close() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


class RateLimiter:
    """Allows at most `calls` requests per `period` seconds (sliding window)."""

    def __init__(self, calls: int, period: float):
        self.calls, self.period = calls, period
        self._stamps: deque[float] = deque()
        self._lock = asyncio.Lock()

    async def wait(self) -> None:
        async with self._lock:
            while True:
                now = time.monotonic()
                while self._stamps and now - self._stamps[0] > self.period:
                    self._stamps.popleft()
                if len(self._stamps) < self.calls:
                    self._stamps.append(now)
                    return
                await asyncio.sleep(self.period - (now - self._stamps[0]) + 0.01)


async def get_json(
    url: str,
    params: dict | None = None,
    *,
    limiter: RateLimiter | None = None,
    ttl: int = 7 * 24 * 3600,
    cache_params: dict | None = None,
) -> dict | list | None:
    """GET a JSON resource, served from cache when fresh. Returns None on any failure.

    `cache_params` replaces `params` in the cache key, so secrets like API keys
    never end up in the cache file.
    """
    key = "GET " + url + "?" + json.dumps(cache_params if cache_params is not None else params, sort_keys=True)
    hit = cache.get(key)
    if hit is not None:
        return hit

    if limiter:
        await limiter.wait()
    try:
        resp = await client().get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
    except (httpx.HTTPError, ValueError):
        return None

    cache.set(key, data, expire=ttl)
    return data


async def get_bytes(url: str, *, limiter: RateLimiter | None = None) -> bytes | None:
    if limiter:
        await limiter.wait()
    try:
        resp = await client().get(url)
        resp.raise_for_status()
        return resp.content
    except httpx.HTTPError:
        return None
