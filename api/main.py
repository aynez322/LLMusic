import json
import logging
import os
import re
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.responses import RedirectResponse  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from sse_starlette.sse import EventSourceResponse  # noqa: E402

from api import audio, http  # noqa: E402
from api.models import RecommendRequest  # noqa: E402
from api.recommender import recommend as run_recommender  # noqa: E402
from api.sources import deezer, lastfm  # noqa: E402

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_: FastAPI):
    audio.warm_up()
    yield
    await http.close()


app = FastAPI(title="LLMusic API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in ["http://localhost:5173", "http://localhost:3000", os.getenv("FRONTEND_ORIGIN")] if o],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "audio_model": audio.available(), "lastfm": lastfm.enabled()}


@app.get("/api/search")
async def search(q: str, limit: int = 8):
    """Autocomplete: exact Deezer tracks the user can pick from."""
    if len(q.strip()) < 2:
        return []
    return [t.model_dump() for t in await deezer.search(q, limit=min(limit, 15))]


@app.get("/api/chart")
async def chart(limit: int = 20):
    """Current Deezer chart, shown on the home page as starting points."""
    return [t.model_dump() for t in await deezer.chart(limit=min(limit, 50))]


@app.get("/api/preview/{deezer_id}")
async def preview(deezer_id: int):
    """Redirect to a freshly signed 30s preview. Preview URLs inside cached search/chart/
    recommendation data expire after ~15 minutes, so the player always comes through here."""
    url = await deezer.fresh_preview(deezer_id)
    if not url:
        raise HTTPException(status_code=404, detail={"error": "No preview for this track"})
    return RedirectResponse(url, status_code=307, headers={"Cache-Control": "no-store"})


@app.post("/api/recommend")
async def recommend(req: RecommendRequest):
    async def stream():
        async for event in run_recommender(req):
            yield {"data": json.dumps(event)}

    return EventSourceResponse(stream())


@app.get("/api/track-info")
async def track_info(title: str, artist: str):
    """Last.fm details for the track modal: tags, wiki summary, listener counts."""
    data = await lastfm.call("track.getInfo", track=title, artist=artist)
    if not data:
        raise HTTPException(status_code=404, detail={"error": "Not found"})
    track = data.get("track", {})

    tags = [t["name"] for t in lastfm.as_list((track.get("toptags") or {}).get("tag"))[:5] if t.get("name")]

    summary = (track.get("wiki") or {}).get("summary", "") or ""
    summary = re.sub(r"<[^>]+>", "", summary)
    summary = re.sub(r"Read more on Last\.fm\.?\s*$", "", summary.strip(), flags=re.IGNORECASE)
    summary = re.sub(r"\s+", " ", summary).strip()
    if len(summary) > 500:
        summary = summary[:500].rsplit(" ", 1)[0] + "…"

    return {
        "title": track.get("name", title),
        "artist": (track.get("artist") or {}).get("name", artist),
        "listeners": int(track.get("listeners", 0) or 0),
        "playcount": int(track.get("playcount", 0) or 0),
        "tags": tags,
        "summary": summary,
        "lastfm_url": track.get("url", ""),
    }


# ── Serve the built frontend (single-origin production deploy) ────────
# In production (Docker / Hugging Face Spaces) the React app is built into
# frontend/dist and served by this same server. The dir doesn't exist in local
# dev, so the block is skipped; run the frontend with `npm run dev` instead.
from fastapi.staticfiles import StaticFiles  # noqa: E402

_FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(_FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=_FRONTEND_DIST, html=True), name="frontend")
