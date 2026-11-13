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
