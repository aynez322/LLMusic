"""Hybrid recommender.

1. Resolve the seed song to an exact Deezer track.
2. Gather candidates from what people listen to together:
     - Last.fm similar tracks (strongest signal)
     - top tracks of similar artists (Last.fm, ListenBrainz, Deezer)
3. Embed seed + candidates with CLAP and measure how alike they sound.
4. Rank by a blend of listener evidence, sound similarity and a popularity
   "discovery" dial, keeping at most one song per artist.
5. Explain each pick with the evidence that actually produced it.

`recommend()` is an async generator of progress events for the SSE endpoint.
"""
import asyncio
import logging
import math
from collections.abc import AsyncIterator
from dataclasses import dataclass, field

import numpy as np

from api import audio
from api.models import Reason, Recommendation, RecommendRequest, Track
from api.sources import deezer, lastfm, listenbrainz
from api.text import normalize_artist, song_key

log = logging.getLogger(__name__)

MAX_CANDIDATES = 50
SIMILAR_TRACKS = 40
SIMILAR_ARTISTS = 12
TRACKS_PER_ARTIST = 3

W_LISTENERS, W_SOUND, W_POPULARITY = 0.45, 0.45, 0.10
SHARED_DESCRIPTOR_Z = 1.2   # how far above typical music both songs must be


@dataclass
class Candidate:
    track: Track
    listener: float = 0.0                       # 0..1 co-listening evidence
    via: list[str] = field(default_factory=list)  # human-readable evidence for the reasons
    from_similar_track: bool = False


def _event(type_: str, **payload) -> dict:
    return {"type": type_, **payload}


def _stage(name: str, status: str, detail: str = "") -> dict:
    return _event("stage", stage=name, status=status, detail=detail)


# ── 1. seed ───────────────────────────────────────────────────────────

async def _resolve_seed(req: RecommendRequest) -> Track | None:
    if req.deezer_id:
        return await deezer.get_track(req.deezer_id)
    if not req.title.strip():
        return None
    return await deezer.find(req.title, req.artist, min_score=70)


# ── 2. candidates ─────────────────────────────────────────────────────

async def _from_similar_tracks(seed: Track) -> list[Candidate]:
    similar = await lastfm.similar_tracks(seed.title, seed.artist, limit=SIMILAR_TRACKS)
    resolved = await asyncio.gather(*(deezer.find(s["title"], s["artist"]) for s in similar))
    # Last.fm's `match` falls off steeply after the first few results, so use the
    # rank instead: a track-level co-listening hit is always worth 0.5..1.0.
    n = max(len(similar) - 1, 1)
    return [
        Candidate(track=t, listener=1.0 - 0.5 * i / n, from_similar_track=True,
                  via=[f"Last.fm listeners of “{seed.title}” also play this"])
        for i, (s, t) in enumerate(zip(similar, resolved)) if t
    ]


async def _similar_artist_scores(seed: Track) -> dict[str, dict]:
    """{normalized name: {name, match, deezer_id, sources}} merged across services."""
    lfm, related = await asyncio.gather(
        lastfm.similar_artists(seed.artist, limit=SIMILAR_ARTISTS),
        deezer.related_artists(seed.artist_id, limit=SIMILAR_ARTISTS),
    )
    mbid = await lastfm.artist_mbid(seed.artist) if lastfm.enabled() else ""
    lb = await listenbrainz.similar_artists(mbid, limit=SIMILAR_ARTISTS)

    merged: dict[str, dict] = {}

    def add(name: str, match: float, source: str, deezer_id: int | None = None):
        key = normalize_artist(name)
        if not key or key == normalize_artist(seed.artist):
            return
        entry = merged.setdefault(key, {"name": name, "match": 0.0, "deezer_id": None, "sources": []})
        entry["match"] = max(entry["match"], match)
        entry["sources"].append(source)
        entry["deezer_id"] = entry["deezer_id"] or deezer_id

    for a in lfm:
        add(a["name"], a["match"], "Last.fm")
    for a in lb:   # ListenBrainz leans towards very popular artists, so trust it a bit less
        add(a["name"], a["match"] * 0.8, "ListenBrainz")
    for i, a in enumerate(related):   # Deezer gives an order but no score
        add(a["name"], 1.0 - i / max(len(related), 1) * 0.6, "Deezer", a["id"])

    # agreement between services is strong evidence
    for e in merged.values():
        e["match"] = min(1.0, e["match"] * (1 + 0.25 * (len(set(e["sources"])) - 1)))
    return merged


async def _from_similar_artists(seed: Track) -> list[Candidate]:
    artists = sorted((await _similar_artist_scores(seed)).values(), key=lambda e: -e["match"])[:SIMILAR_ARTISTS]

    async def tracks_of(entry: dict) -> list[Candidate]:
        artist_id = entry["deezer_id"] or await deezer.find_artist_id(entry["name"])
        if not artist_id:
            return []
        top = await deezer.artist_top(artist_id, limit=TRACKS_PER_ARTIST)
        sources = " and ".join(sorted(set(entry["sources"])))
        return [
            # artist-level evidence is weaker than a track-level hit, so cap it below 0.7
            Candidate(track=t, listener=entry["match"] * 0.7 * (0.85 ** i),
                      via=[f"{entry['name']} is played alongside {seed.artist} ({sources})"])
            for i, t in enumerate(top)
        ]

    groups = await asyncio.gather(*(tracks_of(e) for e in artists))
    return [c for g in groups for c in g]


async def _from_seed_artist(seed: Track) -> list[Candidate]:
    top = await deezer.artist_top(seed.artist_id, limit=TRACKS_PER_ARTIST + 1)
    return [Candidate(track=t, listener=0.3, via=[f"Another song by {seed.artist}"]) for t in top]


def _merge(seed: Track, groups: list[list[Candidate]]) -> list[Candidate]:
    seed_key = song_key(seed.title, seed.artist)
    by_key: dict[str, Candidate] = {}
    for c in (c for g in groups for c in g):
        key = song_key(c.track.title, c.track.artist)
        if key == seed_key or c.track.deezer_id == seed.deezer_id or (seed.isrc and c.track.isrc == seed.isrc):
            continue
        if key in by_key:
            existing = by_key[key]
            existing.listener = max(existing.listener, c.listener)
            existing.from_similar_track |= c.from_similar_track
            existing.via += [v for v in c.via if v not in existing.via]
        else:
            by_key[key] = c
    ranked = sorted(by_key.values(), key=lambda c: -c.listener)
    return ranked[:MAX_CANDIDATES]


# ── 4. ranking ────────────────────────────────────────────────────────

def _percentile(values: np.ndarray) -> np.ndarray:
    if len(values) < 2:
        return np.ones_like(values, dtype=float)
    return values.argsort().argsort() / (len(values) - 1)


def _rank(cands: list[Candidate], seed_emb, embs: dict, discovery: float) -> list[tuple[Candidate, float, float | None]]:
    listener = np.array([c.listener for c in cands])
    listener = listener / (listener.max() or 1.0)

    popularity = _percentile(np.array([math.log1p(c.track.rank) for c in cands]))
    pop_term = (1 - discovery) * popularity + discovery * (1 - popularity)

    sims = np.array([float(embs[c.track.deezer_id] @ seed_emb) if seed_emb is not None and c.track.deezer_id in embs
                     else np.nan for c in cands])
    has_sound = ~np.isnan(sims)
    if has_sound.any():
        sound = np.zeros(len(cands))
        sound[has_sound] = _percentile(sims[has_sound])
        # songs whose preview failed get a neutral sound score rather than zero
        sound[~has_sound] = 0.5
        score = W_LISTENERS * listener + W_SOUND * sound + W_POPULARITY * pop_term
    else:
        score = (W_LISTENERS + W_SOUND) * listener + W_POPULARITY * pop_term

    return [(c, float(s), None if np.isnan(sim) else float(sim)) for c, s, sim in zip(cands, score, sims)]


def _diversify(scored: list, seed: Track, limit: int) -> list:
    """Greedy pick by score with at most one song per artist."""
    picked, seen_artists = [], set()
    for c, s, sim in sorted(scored, key=lambda x: -x[1]):
        artist = normalize_artist(c.track.artist)
        if artist in seen_artists:
            continue
        seen_artists.add(artist)
        picked.append((c, s, sim))
        if len(picked) == limit:
            break
    return picked


# ── 5. explanations ───────────────────────────────────────────────────

def _sound_reasons(picked: list, seed_emb, embs: dict, all_sims: list[float]) -> dict[int, list[Reason]]:
    reasons: dict[int, list[Reason]] = {}
    with_emb = [c for c, _, _ in picked if c.track.deezer_id in embs]
    if seed_emb is None or not with_emb or not audio.available():
        return reasons

    # z-scores against typical music: a descriptor is "shared" when both songs
    # have clearly more of it than usual
    batch = np.stack([seed_emb] + [embs[c.track.deezer_id] for c in with_emb])
    desc = audio.descriptor_scores(batch)
    sims_sorted = sorted(all_sims)

    for row, c in enumerate(with_emb, start=1):
        rs = []
        sim = float(embs[c.track.deezer_id] @ seed_emb)
        pct = sum(s <= sim for s in sims_sorted) / max(len(sims_sorted), 1)
        if pct >= 0.75:
            top = max(1, round((1 - pct) * 100))
            rs.append(Reason(kind="sound", text=f"Among the closest-sounding candidates (top {top}%)"))
        both = np.minimum(desc[0], desc[row])
        shared = [audio.DESCRIPTORS[i] for i in np.argsort(-both) if both[i] > SHARED_DESCRIPTOR_Z]
        if shared:
            rs.append(Reason(kind="sound", text="Both have: " + ", ".join(shared[:3])))
        reasons[c.track.deezer_id] = rs
    return reasons


async def _tag_reasons(seed: Track, picked: list) -> dict[int, list[Reason]]:
    if not lastfm.enabled():
        return {}
    seed_tags = await lastfm.track_tags(seed.title, seed.artist)
    if not seed_tags:
        return {}
    tag_lists = await asyncio.gather(*(lastfm.track_tags(c.track.title, c.track.artist) for c, _, _ in picked))
    out = {}
    for (c, _, _), tags in zip(picked, tag_lists):
        shared = [t for t in tags if t in seed_tags][:3]
        if shared:
            out[c.track.deezer_id] = [Reason(kind="tags", text="Shared tags: " + ", ".join(shared))]
    return out


# ── pipeline ──────────────────────────────────────────────────────────

async def recommend(req: RecommendRequest) -> AsyncIterator[dict]:
    yield _stage("resolve", "start")
    seed = await _resolve_seed(req)
    if seed is None:
        query = f"{req.artist} {req.title}".strip()
        suggestions = await deezer.search(query, limit=5) if query else []
        yield _event("error", message="Couldn't find that song.",
                     suggestions=[t.model_dump() for t in suggestions])
        return
    yield _event("seed", track=seed.model_dump())
    yield _stage("resolve", "done")

    yield _stage("candidates", "start")
    groups = await asyncio.gather(
        _from_similar_tracks(seed), _from_similar_artists(seed), _from_seed_artist(seed)
    )
    cands = _merge(seed, list(groups))
    if not cands:
        yield _event("error", message="No recommendations found for this song.", suggestions=[])
        return
    yield _stage("candidates", "done", f"{len(cands)} candidates")

    yield _stage("listening", "start")
    try:
        embs = await audio.embed([seed] + [c.track for c in cands])
    except Exception:   # never fail the request because of audio
        log.exception("audio embedding failed")
        embs = {}
    seed_emb = embs.get(seed.deezer_id)
    yield _stage("listening", "done", f"{max(len(embs) - 1, 0)} previews analysed" if seed_emb is not None
                 else "audio unavailable, using listener data only")

    yield _stage("ranking", "start")
    scored = _rank(cands, seed_emb, embs, req.discovery)
    picked = _diversify(scored, seed, req.limit)
    all_sims = [sim for _, _, sim in scored if sim is not None]
    sound_reasons = _sound_reasons(picked, seed_emb, embs, all_sims)
    tag_reasons = await _tag_reasons(seed, picked)

    items = []
    for c, score, sim in picked:
        reasons = [Reason(kind="listeners" if "Last.fm listeners" in v else "artist", text=v) for v in c.via[:2]]
        reasons += sound_reasons.get(c.track.deezer_id, []) + tag_reasons.get(c.track.deezer_id, [])
        items.append(Recommendation(
            track=c.track, score=round(score, 4),
            sound_similarity=None if sim is None else round(sim, 4),
            listener_score=round(c.listener, 4), reasons=reasons,
        ).model_dump())
    yield _stage("ranking", "done")
    yield _event("results", items=items)
    yield _event("done")
