from fastapi.testclient import TestClient

from api import main


def client(monkeypatch, url: str) -> TestClient:
    async def fake_fresh_preview(deezer_id: int) -> str:
        return url
    monkeypatch.setattr(main.deezer, "fresh_preview", fake_fresh_preview)
    return TestClient(main.app)


def test_preview_redirects_to_fresh_signed_url(monkeypatch):
    res = client(monkeypatch, "https://cdn.example/p.mp3?hdnea=exp=1").get("/api/preview/42", follow_redirects=False)
    assert res.status_code == 307
    assert res.headers["location"] == "https://cdn.example/p.mp3?hdnea=exp=1"
    assert res.headers["cache-control"] == "no-store"


def test_preview_404_when_track_has_none(monkeypatch):
    res = client(monkeypatch, "").get("/api/preview/42", follow_redirects=False)
    assert res.status_code == 404


def test_fresh_preview_cache_is_shorter_than_token_life():
    assert main.deezer.PREVIEW_TTL < 15 * 60


def test_fresh_preview_ignores_the_long_cached_track_lookup(monkeypatch, tmp_path):
    """Regression: get_track() caches /track/{id} for days; fresh_preview() used the same
    cache entry and returned a link that had expired long ago (the seed song's preview)."""
    import asyncio

    import diskcache

    from api import http
    from api.sources import deezer

    links = iter(["https://cdn.example/old.mp3", "https://cdn.example/new.mp3"])

    class FakeResponse:
        def __init__(self):
            self.preview = next(links)

        def raise_for_status(self):
            pass

        def json(self):
            return {"id": 7, "title": "Reckoner", "preview": self.preview,
                    "artist": {"id": 1, "name": "Radiohead"}, "album": {"title": "In Rainbows"}}

    class FakeClient:
        async def get(self, url, params=None):
            return FakeResponse()

    monkeypatch.setattr(http, "cache", diskcache.Cache(str(tmp_path)))
    monkeypatch.setattr(http, "client", lambda: FakeClient())

    async def scenario():
        await deezer.get_track(7)            # caches the old link for days
        return await deezer.fresh_preview(7)

    assert asyncio.run(scenario()) == "https://cdn.example/new.mp3"
