"""Audio embeddings from 30s Deezer previews using CLAP (laion/clap-htsat-unfused).

CLAP maps audio and text into the same space, so the same model gives us
  * audio-to-audio similarity (how alike two songs sound), and
  * audio-to-text scores against a fixed list of sound descriptors, used to
    explain *what* two songs have in common ("acoustic guitar", "melancholic").

Embeddings are cached on disk by Deezer id, so each song is only processed once.
"""
import asyncio
import json
import logging
import os
import threading

import diskcache
import miniaudio
import numpy as np

from api.http import CACHE_DIR, get_bytes
from api.models import Track
from api.sources import deezer

log = logging.getLogger(__name__)

MODEL_NAME = os.getenv("CLAP_MODEL", "laion/clap-htsat-unfused")
SR = 48_000
CLIP_SECONDS = 10
BATCH = 16

DESCRIPTORS = [
    "acoustic guitar", "distorted electric guitar", "piano", "synthesizers", "strings and orchestra",
    "heavy drums", "drum machine beat", "deep bass", "brass and horns", "saxophone",
    # (no vocal-style descriptors like "rap" or "instrumental": CLAP gets those wrong too often)
    "choir",
    "fast and energetic", "slow and calm", "dark and moody", "happy and upbeat", "melancholic and sad",
    "dreamy and atmospheric", "aggressive and intense", "danceable groove", "lo-fi and warm",
    "raw and live sounding", "polished modern production", "retro 80s sound", "folk", "jazzy", "funky",
]

_emb_cache = diskcache.Cache(os.path.join(CACHE_DIR, "embeddings"), size_limit=256 * 1024**2)
_model = None
_processor = None
_text_emb: np.ndarray | None = None
_load_lock = threading.Lock()
_infer_lock = threading.Lock()   # one forward pass at a time keeps CPU usage predictable


def _load_model() -> None:
    global _model, _processor, _text_emb
    with _load_lock:
        if _model is not None:
            return
        import torch
        from transformers import ClapModel, ClapProcessor

        torch.set_num_threads(max(1, os.cpu_count() or 1))
        # safetensors only: otherwise the hub also fetches pytorch_model.bin (+600 MB)
        model = ClapModel.from_pretrained(MODEL_NAME, use_safetensors=True).eval()
        processor = ClapProcessor.from_pretrained(MODEL_NAME)
        with torch.inference_mode():
            inp = processor(text=[f"music with {d}" for d in DESCRIPTORS], return_tensors="pt", padding=True)
            text = model.get_text_features(**inp)
            text = getattr(text, "pooler_output", text)
        _text_emb = _unit(text.numpy())
        _model, _processor = model, processor
        log.info("CLAP model %s loaded", MODEL_NAME)


def warm_up() -> None:
    """Load the model in the background so the first request doesn't pay for it."""
    threading.Thread(target=_safe_load, daemon=True).start()


def _safe_load() -> None:
    try:
        _load_model()
    except Exception:  # the app still works without audio, just less precisely
        log.exception("Could not load CLAP model; audio similarity disabled")


def available() -> bool:
    return _model is not None


def _unit(x: np.ndarray) -> np.ndarray:
    return x / np.maximum(np.linalg.norm(x, axis=-1, keepdims=True), 1e-9)


def _decode_clip(mp3: bytes) -> np.ndarray | None:
    try:
        d = miniaudio.decode(mp3, output_format=miniaudio.SampleFormat.FLOAT32, nchannels=1, sample_rate=SR)
    except miniaudio.DecodeError:
        return None
    y = np.asarray(d.samples, dtype=np.float32)
    if len(y) < SR * 3:
        return None
    # the middle of a preview is usually the most representative part (past intros)
    mid, half = len(y) // 2, CLIP_SECONDS * SR // 2
    return y[max(0, mid - half): mid + half]


def _embed_waves(waves: list[np.ndarray]) -> np.ndarray:
    import torch

    _load_model()
    out = []
    with _infer_lock, torch.inference_mode():
        for i in range(0, len(waves), BATCH):
            inp = _processor(audio=waves[i:i + BATCH], sampling_rate=SR, return_tensors="pt")
            emb = _model.get_audio_features(**inp)
            out.append(getattr(emb, "pooler_output", emb).numpy())
    return _unit(np.concatenate(out))


async def _download(track: Track) -> bytes | None:
    audio = await get_bytes(track.preview) if track.preview else None
    if audio is None:   # signed preview URLs expire; ask Deezer for a fresh one
        url = await deezer.fresh_preview(track.deezer_id)
        audio = await get_bytes(url) if url else None
    return audio


async def embed(tracks: list[Track]) -> dict[int, np.ndarray]:
    """Return {deezer_id: unit embedding} for every track whose preview could be processed."""
    result: dict[int, np.ndarray] = {}
    missing: list[Track] = []
    for t in tracks:
        hit = _emb_cache.get(t.deezer_id)
        if hit is not None:
            result[t.deezer_id] = hit
        else:
            missing.append(t)
    if not missing:
        return result

    sem = asyncio.Semaphore(8)

    async def fetch(t: Track):
        async with sem:
            return t, await _download(t)

    downloaded = [(t, a) for t, a in await asyncio.gather(*(fetch(t) for t in missing)) if a]
    waves = await asyncio.gather(*(asyncio.to_thread(_decode_clip, a) for _, a in downloaded))
    clips = [(t, w) for (t, _), w in zip(downloaded, waves) if w is not None]
    if not clips:
        return result

    embs = await asyncio.to_thread(_embed_waves, [w for _, w in clips])
    for (t, _), e in zip(clips, embs):
        e = e.astype(np.float32)
        _emb_cache.set(t.deezer_id, e)
        result[t.deezer_id] = e
    return result


def _load_stats() -> tuple[np.ndarray, np.ndarray] | None:
    path = os.path.join(os.path.dirname(__file__), "descriptor_stats.json")
    try:
        with open(path, encoding="utf-8") as fh:
            s = json.load(fh)
    except (OSError, ValueError):
        return None
    if s.get("descriptors") != DESCRIPTORS or s.get("model") != MODEL_NAME:
        log.warning("descriptor_stats.json is stale; run scripts/build_descriptor_stats.py")
        return None
    return np.array(s["mean"]), np.maximum(np.array(s["std"]), 1e-6)


_stats = _load_stats()


def raw_descriptor_scores(embs: np.ndarray) -> np.ndarray:
    """Audio-text cosine per descriptor, minus each track's own average.

    Some tracks match *every* text prompt strongly and others weakly; removing
    that per-track offset leaves only which descriptors stand out for the track.
    """
    raw = embs @ _text_emb.T
    return raw - raw.mean(axis=1, keepdims=True)


def descriptor_scores(embs: np.ndarray) -> np.ndarray:
    """z-score of each embedding against each descriptor.

    Scores are standardised against a genre-diverse reference set (see
    scripts/build_descriptor_stats.py): z > 1 means "noticeably more X than
    typical music". Without the reference file, falls back to the given batch.
    """
    raw = raw_descriptor_scores(embs)
    if _stats is not None:
        mean, std = _stats
    else:
        mean, std = raw.mean(axis=0), np.maximum(raw.std(axis=0), 1e-6)
    return (raw - mean) / std
