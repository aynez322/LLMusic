import asyncio
import contextlib
import io
import json

from ai_based_music_recommendation.crew import MusicRecommendationCrew
from ai_based_music_recommendation.tools.dataset_tools import (
    SimilarSongSearchTool,
    SongLookupTool,
)


async def lookup_song(song_title: str, artist: str) -> dict:
    raw = await asyncio.to_thread(
        SongLookupTool()._run, song_title=song_title, artist=artist
    )
    return json.loads(raw)


async def find_similar(song_title: str, artist: str, top_n: int = 5) -> list | dict:
    raw = await asyncio.to_thread(
        SimilarSongSearchTool()._run,
        song_title=song_title,
        artist=artist,
        top_n=top_n,
    )
    return json.loads(raw)


async def run_crew(song_title: str, artist: str) -> str:
    def _blocking():
        crew = MusicRecommendationCrew().crew()
        # suppress verbose CrewAI console output — it goes to server logs otherwise
        with contextlib.redirect_stdout(io.StringIO()):
            result = crew.kickoff(inputs={"song_title": song_title, "artist": artist})
        return result.raw if hasattr(result, "raw") else str(result)

    return await asyncio.to_thread(_blocking)
