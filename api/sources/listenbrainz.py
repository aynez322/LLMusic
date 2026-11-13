"""ListenBrainz Labs: similar artists from open listening sessions. No key needed.

(The similar-*recordings* endpoint currently returns empty results, so only artists are used.)
"""
from api.http import RateLimiter, get_json

BASE = "https://labs.api.listenbrainz.org"
ALGORITHM = "session_based_days_7500_session_300_contribution_5_threshold_10_limit_100_filter_True_skip_30"
limiter = RateLimiter(calls=5, period=1.0)


async def similar_artists(artist_mbid: str, limit: int = 10) -> list[dict]:
    if not artist_mbid:
        return []
    data = await get_json(
        f"{BASE}/similar-artists/json",
        {"artist_mbids": artist_mbid, "algorithm": ALGORITHM},
        limiter=limiter,
    )
    if not isinstance(data, list):
        return []
    rows = [r for r in data if r.get("name") and r.get("artist_mbid") != artist_mbid]
    top = max((r.get("score", 0) for r in rows), default=0) or 1
    return [{"name": r["name"], "match": r.get("score", 0) / top} for r in rows[:limit]]
