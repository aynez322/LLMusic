import numpy as np

from api.models import Track
from api.recommender import Candidate, _diversify, _merge, _rank


def track(i: int, title: str, artist: str, rank: int = 500_000, isrc: str = "") -> Track:
    return Track(deezer_id=i, title=title, artist=artist, artist_id=i, rank=rank, isrc=isrc)


SEED = track(1, "Reckoner", "Radiohead", isrc="GB1")


def test_merge_drops_seed_and_its_versions():
    groups = [[
        Candidate(track(2, "Reckoner (Live)", "Radiohead"), listener=0.9),
        Candidate(track(3, "Reckoner", "Radiohead", isrc="GB1"), listener=0.9),
        Candidate(track(4, "Nude", "Radiohead"), listener=0.5),
    ]]
    assert [c.track.deezer_id for c in _merge(SEED, groups)] == [4]


def test_merge_combines_duplicates_keeping_strongest_evidence():
    a = Candidate(track(5, "Grace", "Jeff Buckley"), listener=0.4, via=["artist"])
    b = Candidate(track(6, "Grace - Remastered", "Jeff Buckley"), listener=0.8, via=["listeners"],
                  from_similar_track=True)
    [merged] = _merge(SEED, [[a], [b]])
    assert merged.listener == 0.8
    assert merged.from_similar_track
    assert merged.via == ["artist", "listeners"]


def test_rank_prefers_closer_sound_when_listener_evidence_ties():
    cands = [Candidate(track(10, "A", "X"), listener=0.8), Candidate(track(11, "B", "Y"), listener=0.8)]
    seed = np.array([1.0, 0.0])
    embs = {10: np.array([0.0, 1.0]), 11: np.array([0.9, 0.1])}
    scored = _rank(cands, seed, embs, discovery=0.5)
    best = max(scored, key=lambda s: s[1])[0]
    assert best.track.deezer_id == 11


def test_rank_without_audio_falls_back_to_listeners():
    cands = [Candidate(track(10, "A", "X"), listener=0.3), Candidate(track(11, "B", "Y"), listener=0.9)]
    scored = _rank(cands, None, {}, discovery=0.5)
    assert max(scored, key=lambda s: s[1])[0].track.deezer_id == 11
    assert all(sim is None for _, _, sim in scored)


def test_discovery_dial_flips_popularity_preference():
    cands = [
        Candidate(track(10, "Hit", "X", rank=990_000), listener=0.5),
        Candidate(track(11, "Deep cut", "Y", rank=1_000), listener=0.5),
    ]
    top = lambda d: max(_rank(cands, None, {}, discovery=d), key=lambda s: s[1])[0].track.title  # noqa: E731
    assert top(0.0) == "Hit"
    assert top(1.0) == "Deep cut"


def test_diversify_keeps_one_song_per_artist():
    scored = [
        (Candidate(track(10, "A", "Muse")), 0.9, None),
        (Candidate(track(11, "B", "Muse")), 0.8, None),
        (Candidate(track(12, "C", "Blur")), 0.7, None),
    ]
    picked = _diversify(scored, SEED, limit=10)
    assert [c.track.title for c, _, _ in picked] == ["A", "C"]
