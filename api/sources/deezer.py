"""Deezer public API: search, track metadata, 30s previews, related artists. No key needed."""
from rapidfuzz import fuzz

from api.http import RateLimiter, get_json
from api.models import Track
from api.text import normalize_artist, normalize_title

BASE = "https://api.deezer.com"
# Deezer allows 50 requests / 5 s per IP; stay a little under it.
limiter = RateLimiter(calls=45, period=5.0)


def _to_track(d: dict) -> Track | None:
    if not d or d.get("type", "track") != "track" or not d.get("id"):
        return None
    artist = d.get("artist") or {}
    album = d.get("album") or {}
    return Track(
        deezer_id=d["id"],
        title=d.get("title_short") or d.get("title", ""),
        artist=artist.get("name", ""),
        artist_id=artist.get("id", 0),
        album=album.get("title", ""),
        cover=album.get("cover_medium") or album.get("cover", ""),
        preview=d.get("preview", ""),
        link=d.get("link", ""),
        rank=int(d.get("rank", 0) or 0),
        isrc=d.get("isrc", ""),
    )


async def search(query: str, limit: int = 8) -> list[Track]:
    data = await get_json(f"{BASE}/search", {"q": query, "limit": limit}, limiter=limiter, ttl=24 * 3600)
    tracks = [_to_track(d) for d in (data or {}).get("data", [])]
    return [t for t in tracks if t]


async def chart(limit: int = 20) -> list[Track]:
    data = await get_json(f"{BASE}/chart/0/tracks", {"limit": limit}, limiter=limiter, ttl=6 * 3600)
    tracks = [_to_track(d) for d in (data or {}).get("data", [])]
    return [t for t in tracks if t]


async def get_track(deezer_id: int) -> Track | None:
    data = await get_json(f"{BASE}/track/{deezer_id}", limiter=limiter)
    if not data or "error" in data:
        return None
    return _to_track(data)


# Signed preview URLs live ~15 minutes, so this lookup is cached for less than that.
PREVIEW_TTL = 10 * 60
# Own cache entry: get_track() caches the same URL for days, and sharing its
# entry would hand back a long-expired preview link (the TTL only applies on write).
PREVIEW_CACHE_KEY = {"purpose": "fresh-preview"}


async def fresh_preview(deezer_id: int) -> str:
    """Preview URLs are signed and expire, so fetch a fresh one right before downloading."""
    data = await get_json(f"{BASE}/track/{deezer_id}", limiter=limiter, ttl=PREVIEW_TTL,
                          cache_params=PREVIEW_CACHE_KEY)
    return (data or {}).get("preview", "") if data and "error" not in data else ""


def _match_score(t: Track, title: str, artist: str) -> float:
    title_s = fuzz.token_set_ratio(normalize_title(t.title), normalize_title(title))
    artist_s = fuzz.token_set_ratio(normalize_artist(t.artist), normalize_artist(artist)) if artist else 100
    return min(title_s, artist_s)


async def find(title: str, artist: str = "", min_score: float = 85) -> Track | None:
    """Resolve a (title, artist) pair from another service to a Deezer track."""
    results = await search(f"{artist} {normalize_title(title)}".strip(), limit=5)
    scored = [(t, _match_score(t, title, artist)) for t in results if t.preview]
    scored = [(t, s) for t, s in scored if s >= min_score]
    if not scored:
        return None
    # prefer the best text match, then the most popular release of it
    return max(scored, key=lambda ts: (ts[1], ts[0].rank))[0]


async def find_artist_id(name: str) -> int | None:
    data = await get_json(f"{BASE}/search/artist", {"q": name, "limit": 3}, limiter=limiter)
    for a in (data or {}).get("data", []):
        if fuzz.ratio(normalize_artist(a.get("name", "")), normalize_artist(name)) >= 90:
            return a["id"]
    return None


async def related_artists(artist_id: int, limit: int = 10) -> list[dict]:
    data = await get_json(f"{BASE}/artist/{artist_id}/related", {"limit": limit}, limiter=limiter)
    return [{"id": a["id"], "name": a["name"]} for a in (data or {}).get("data", [])[:limit]]


async def artist_top(artist_id: int, limit: int = 3) -> list[Track]:
    data = await get_json(f"{BASE}/artist/{artist_id}/top", {"limit": limit}, limiter=limiter)
    tracks = [_to_track(d) for d in (data or {}).get("data", [])]
    return [t for t in tracks if t and t.preview]
