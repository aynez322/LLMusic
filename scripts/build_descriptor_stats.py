#!/usr/bin/env python
"""Build the reference statistics used to explain *what* two songs share.

Embeds the top tracks of Deezer's genre charts (a deliberately diverse mix),
scores each against the CLAP sound descriptors, and stores the mean and
standard deviation per descriptor in api/descriptor_stats.json.

At request time a descriptor is only mentioned when both songs score well
above this reference (e.g. "more piano than typical music"), instead of being
compared against the candidates, which all sound alike.

Run once, or again after changing audio.DESCRIPTORS or the CLAP model:
    uv run python scripts/build_descriptor_stats.py
"""
import asyncio
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from api import audio, http  # noqa: E402
from api.sources import deezer  # noqa: E402

# Pop, Rap, Rock, Dance, R&B, Alternative, Electro, Folk, Reggae, Jazz,
# Classical, Metal, Soul & Funk, Blues, Latin, African, Asian, Brazilian, Indian
GENRES = [132, 116, 152, 113, 165, 85, 106, 466, 144, 129, 98, 464, 169, 153, 197, 2, 16, 75, 81]
PER_GENRE = 15


async def main() -> None:
    tracks, seen = [], set()
    for genre in GENRES:
        data = await http.get_json(f"{deezer.BASE}/chart/{genre}/tracks", {"limit": PER_GENRE}, limiter=deezer.limiter)
        for d in (data or {}).get("data", []):
            t = deezer._to_track(d)
            if t and t.preview and t.deezer_id not in seen:
                seen.add(t.deezer_id)
                tracks.append(t)
    print(f"{len(tracks)} reference tracks")

    embs = await audio.embed(tracks)
    raw = audio.raw_descriptor_scores(np.stack(list(embs.values())))
    stats = {
        "model": audio.MODEL_NAME,
        "n_tracks": len(embs),
        "descriptors": audio.DESCRIPTORS,
        "mean": raw.mean(axis=0).round(5).tolist(),
        "std": raw.std(axis=0).round(5).tolist(),
    }
    out = os.path.join(os.path.dirname(__file__), "..", "api", "descriptor_stats.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(stats, fh, indent=1)
    print(f"saved {out} from {len(embs)} embedded tracks")
    await http.close()


if __name__ == "__main__":
    audio._load_model()
    asyncio.run(main())
