"""Last.fm: co-listening similarity (similar tracks / artists) and community tags."""
import os

from api.http import RateLimiter, get_json

BASE = "https://ws.audioscrobbler.com/2.0/"
# Last.fm asks for no more than ~5 requests/second per key.
limiter = RateLimiter(calls=5, period=1.0)

# tags that describe the listener rather than the music
_JUNK_TAGS = {"seen live", "favorites", "favourite", "favorite", "love", "loved", "awesome",
              "my favorite", "favourite songs", "favorite songs", "beautiful", "amazing", "albums i own"}


def enabled() -> bool:
    return bool(os.getenv("LASTFM_API_KEY"))


async def call(method: str, **params) -> dict | None:
    if not enabled():
        return None
    query = {"method": method, "format": "json", "autocorrect": 1, **params}
    data = await get_json(
        BASE,
        {**query, "api_key": os.environ["LASTFM_API_KEY"]},
        cache_params=query,
        limiter=limiter,
    )
    if not data or "error" in data:
        return None
    return data


def as_list(x) -> list:
    if x is None:
        return []
    return x if isinstance(x, list) else [x]


async def similar_tracks(title: str, artist: str, limit: int = 40) -> list[dict]:
    """[{title, artist, match}] — match is Last.fm's 0..1 co-listening score."""
    data = await call("track.getSimilar", track=title, artist=artist, limit=limit)
    tracks = as_list((data or {}).get("similartracks", {}).get("track"))
    return [
        {"title": t["name"], "artist": t["artist"]["name"], "match": float(t.get("match", 0))}
        for t in tracks
        if t.get("name") and isinstance(t.get("artist"), dict)
    ]


async def similar_artists(artist: str, limit: int = 15) -> list[dict]:
    data = await call("artist.getSimilar", artist=artist, limit=limit)
    artists = as_list((data or {}).get("similarartists", {}).get("artist"))
    return [{"name": a["name"], "match": float(a.get("match", 0)), "mbid": a.get("mbid", "")}
            for a in artists if a.get("name")]


async def track_tags(title: str, artist: str, limit: int = 8) -> list[str]:
    data = await call("track.getTopTags", track=title, artist=artist)
    tags = as_list((data or {}).get("toptags", {}).get("tag"))
    if not tags:
        data = await call("artist.getTopTags", artist=artist)
        tags = as_list((data or {}).get("toptags", {}).get("tag"))
    out = []
    for t in tags:
        name = t.get("name", "").strip().lower()
        if name and name not in _JUNK_TAGS and int(t.get("count", 0) or 0) >= 5:
            out.append(name)
    return out[:limit]


async def artist_mbid(artist: str) -> str:
    data = await call("artist.getInfo", artist=artist)
    return (data or {}).get("artist", {}).get("mbid", "") or ""
