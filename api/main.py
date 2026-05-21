import asyncio
import json
import math
import os
import re

import requests as _requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

load_dotenv()

from api.models import SimilarRequest, SongRequest
from api import services

app = FastAPI(title="Music Recommendation API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        os.getenv("FRONTEND_ORIGIN", ""),
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.get("/api/top-tracks")
async def top_tracks_dataset(limit: int = 20):
    """Returns the most popular songs that actually exist in the recommendation dataset."""
    from ai_based_music_recommendation.tools.dataset_tools import _load
    df, _ = await asyncio.to_thread(_load)

    cols = ["track_name", "artists", "track_genre", "popularity"]
    cols = [c for c in cols if c in df.columns]

    top = (
        df[cols]
        .drop_duplicates(subset=["track_name", "artists"])
        .nlargest(limit * 3, "popularity")   # over-fetch then sample for variety
        .sample(frac=1, random_state=42)      # shuffle so order varies
        .head(limit)
        .reset_index(drop=True)
    )

    return [
        {
            "rank":   int(i + 1),
            "title":  str(row["track_name"]),
            "artist": str(row["artists"]),
            "genre":  str(row.get("track_genre", "")),
            "popularity": int(row.get("popularity", 0)),
        }
        for i, row in top.iterrows()
    ]


@app.get("/api/top-tracks-lastfm")  # kept for reference, not used by UI
async def top_tracks(limit: int = 20):
    api_key = os.getenv("LASTFM_API_KEY", "")

    def _fetch():
        return _requests.get(
            "https://ws.audioscrobbler.com/2.0/",
            params={"method": "chart.getTopTracks", "api_key": api_key,
                    "limit": limit, "format": "json"},
            timeout=6,
        ).json()

    data = await asyncio.to_thread(_fetch)
    tracks = data.get("tracks", {}).get("track", [])
    return [
        {
            "rank":      int(t.get("@attr", {}).get("rank", i + 1)),
            "title":     t["name"],
            "artist":    t["artist"]["name"],
            "playcount": int(t.get("playcount", 0) or 0),
            "listeners": int(t.get("listeners", 0) or 0),
        }
        for i, t in enumerate(tracks)
    ]


@app.get("/api/suggest")
async def suggest(q: str, limit: int = 5):
    if len(q.strip()) < 2:
        return []
    api_key = os.getenv("LASTFM_API_KEY", "")

    def _fetch():
        return _requests.get(
            "https://ws.audioscrobbler.com/2.0/",
            params={"method": "track.search", "api_key": api_key,
                    "track": q, "limit": limit, "format": "json"},
            timeout=5,
        ).json()

    data = await asyncio.to_thread(_fetch)
    tracks = data.get("results", {}).get("trackmatches", {}).get("track", [])
    if isinstance(tracks, dict):
        tracks = [tracks]
    return [{"title": t["name"], "artist": t["artist"]} for t in tracks[:limit]]


@app.get("/api/popularity")
async def popularity(title: str, artist: str):
    api_key = os.getenv("LASTFM_API_KEY", "")

    def _fetch():
        return _requests.get(
            "https://ws.audioscrobbler.com/2.0/",
            params={
                "method": "track.getInfo",
                "api_key": api_key,
                "artist": artist,
                "track": title,
                "format": "json",
            },
            timeout=6,
        ).json()

    data = await asyncio.to_thread(_fetch)

    if "error" in data:
        raise HTTPException(status_code=404, detail={"error": data.get("message", "Not found")})

    track = data.get("track", {})
    listeners = int(track.get("listeners", 0) or 0)
    playcount = int(track.get("playcount", 0) or 0)

    # Logarithmic scale: 10M listeners → 100
    _MAX = 10_000_000
    score = (
        min(100, round(math.log10(listeners) / math.log10(_MAX) * 100))
        if listeners > 0 else 0
    )

    return {"score": score, "listeners": listeners, "playcount": playcount}


@app.get("/api/track-info")
async def track_info(title: str, artist: str):
    """Full Last.fm track metadata: album, art, tags, wiki summary, listeners, feats."""
    api_key = os.getenv("LASTFM_API_KEY", "")

    def _fetch():
        return _requests.get(
            "https://ws.audioscrobbler.com/2.0/",
            params={
                "method": "track.getInfo",
                "api_key": api_key,
                "artist": artist,
                "track": title,
                "autocorrect": "1",
                "format": "json",
            },
            timeout=6,
        ).json()

    data = await asyncio.to_thread(_fetch)

    if "error" in data:
        raise HTTPException(status_code=404, detail={"error": data.get("message", "Not found")})

    track = data.get("track", {})

    # Album
    album_info = track.get("album", {}) or {}
    album_name = album_info.get("title", "")
    album_art = ""
    for img in reversed(album_info.get("image", [])):
        if img.get("#text"):
            album_art = img["#text"]
            break

    # Duration mm:ss
    duration_ms = int(track.get("duration", 0) or 0)
    duration_str = f"{duration_ms // 60000}:{(duration_ms // 1000) % 60:02d}" if duration_ms > 0 else ""

    # Tags (top 5)
    tag_list = (track.get("toptags") or {}).get("tag", [])
    if isinstance(tag_list, dict):
        tag_list = [tag_list]
    tags = [t["name"] for t in tag_list[:5] if t.get("name")]

    # Wiki summary — strip HTML, remove Last.fm attribution, truncate
    summary = (track.get("wiki") or {}).get("summary", "") or ""
    if summary:
        summary = re.sub(r"<[^>]+>", "", summary).strip()
        summary = re.sub(r"Read more on Last\.fm\.?\s*$", "", summary, flags=re.IGNORECASE).strip()
        summary = re.sub(r"\s+", " ", summary).strip()
        if len(summary) > 500:
            summary = summary[:500].rsplit(" ", 1)[0] + "…"

    # Featured artists — parse from title
    feats = ""
    feat_match = re.search(r"\(feat\.?\s+([^)]+)\)", title, re.IGNORECASE)
    if not feat_match:
        feat_match = re.search(r"\[feat\.?\s+([^\]]+)\]", title, re.IGNORECASE)
    if feat_match:
        feats = feat_match.group(1).strip()

    # Listeners / playcount / popularity score
    listeners = int(track.get("listeners", 0) or 0)
    playcount = int(track.get("playcount", 0) or 0)
    _MAX = 10_000_000
    score = (
        min(100, round(math.log10(listeners) / math.log10(_MAX) * 100))
        if listeners > 0 else 0
    )

    artist_name = track.get("artist", {})
    if isinstance(artist_name, dict):
        artist_name = artist_name.get("name", artist)

    return {
        "title":     track.get("name", title),
        "artist":    artist_name or artist,
        "album":     album_name,
        "album_art": album_art,
        "duration":  duration_str,
        "listeners": listeners,
        "playcount": playcount,
        "score":     score,
        "tags":      tags,
        "summary":   summary,
        "feats":     feats,
        "lastfm_url": track.get("url", ""),
    }


@app.post("/api/lookup")
async def lookup(req: SongRequest):
    data = await services.lookup_song(req.song_title, req.artist)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data)
    return data


@app.post("/api/similar")
async def similar(req: SimilarRequest):
    data = await services.find_similar(req.song_title, req.artist, req.top_n)
    if isinstance(data, dict) and "error" in data:
        raise HTTPException(status_code=404, detail=data)
    return data


@app.post("/api/recommend")
async def recommend(req: SongRequest):
    async def event_stream():
        def _event(payload: dict) -> dict:
            return {"data": json.dumps(payload)}

        # --- Phase 1: Song Analyzer ---
        yield _event({"type": "agent_start", "agent": "song_analyzer"})
        song_data = await services.lookup_song(req.song_title, req.artist)
        if "error" in song_data:
            yield _event({"type": "error", "message": song_data["error"],
                          "suggestions": song_data.get("suggestions", [])})
            return
        yield _event({"type": "agent_done", "agent": "song_analyzer"})

        # --- Phase 2: Music Researcher ---
        yield _event({"type": "agent_start", "agent": "music_researcher"})
        similar_data = await services.find_similar(req.song_title, req.artist)
        if isinstance(similar_data, dict) and "error" in similar_data:
            yield _event({"type": "error", "message": similar_data["error"]})
            return
        yield _event({"type": "agent_done", "agent": "music_researcher",
                      "recommendations": similar_data})

        # --- Phase 3: Explainability Agent (full LLM pipeline) ---
        yield _event({"type": "agent_start", "agent": "explainability_agent"})
        try:
            markdown = await services.run_crew(req.song_title, req.artist)
            yield _event({"type": "agent_done", "agent": "explainability_agent"})
            yield _event({"type": "result", "data": markdown})
        except Exception as exc:
            yield _event({"type": "error", "message": str(exc)})
            return

        yield _event({"type": "done"})

    return EventSourceResponse(event_stream())
