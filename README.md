# LLMusic — Music Recommendations That Show Their Work

> Type a song. LLMusic finds what its listeners also play, listens to every candidate, and tells you why each one fits.

**[Try it live →](https://huggingface.co/spaces/aynez/llmusic)**

---

![LLMusic home page screenshot](docs/screenshot.png)

---

## What it does

You type a song and artist and pick the exact track from the suggestions. Then LLMusic:

1. **Follows the listeners.** It asks Last.fm which tracks people who play your song also play, and collects artists that Last.fm, ListenBrainz and Deezer consider related. This gives ~50 candidates based on real listening behaviour.
2. **Listens to them.** It downloads each candidate's 30-second preview and runs it through [CLAP](https://huggingface.co/laion/clap-htsat-unfused), an audio AI model, to measure how close each song actually *sounds* to yours.
3. **Ranks and explains.** Listener evidence and sound similarity are blended, at most one song per artist is kept, and a **Discovery** slider shifts the results between familiar hits and deep cuts. Every recommendation lists the evidence behind it:
   - 👥 *Last.fm listeners of "Holocene" also play this*
   - 🎧 *Both have: acoustic guitar, slow and calm*
   - \# *Shared tags: indie folk, singer-songwriter*

Results stream into the UI stage by stage, and every result has a playable preview.

Because songs are looked up live, **anything on Deezer works**, including releases from this week. Nothing depends on a static dataset.

---

## Tech at a glance

| Layer | Stack |
|---|---|
| Recommendation | Last.fm + ListenBrainz co-listening data · CLAP audio embeddings (PyTorch, CPU) · Deezer previews |
| Backend | Python · FastAPI · Server-Sent Events · httpx · on-disk cache |
| Frontend | React 19 · TypeScript · Vite · Tailwind CSS · Framer Motion |
| Deploy | Docker · Hugging Face Spaces (free CPU tier) |

---

## Project structure

```
api/
  main.py            ← FastAPI routes (search, recommend via SSE, chart, track info)
  recommender.py     ← the pipeline: candidates → audio → ranking → explanations
  audio.py           ← CLAP model, preview decoding, embedding cache, sound descriptors
  sources/           ← Deezer, Last.fm and ListenBrainz clients
  descriptor_stats.json  ← reference stats so "Both have: piano" means more than typical
frontend/            ← React + Vite UI
scripts/             ← descriptor stats builder, Hugging Face deploy script
tests/               ← unit tests for normalisation and ranking
```

---

## Running locally

Create a `.env` file in the project root with a free [Last.fm API key](https://www.last.fm/api/account/create):

```
LASTFM_API_KEY=your_key_here
```

**Backend** (Python 3.10–3.13, uses [uv](https://docs.astral.sh/uv/)):
```bash
uv sync
uv run uvicorn api.main:app --reload --port 8000
```
The first start downloads the CLAP model (~600 MB).

**Frontend:**
```bash
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

**Or with Docker** (UI and API on one port):
```bash
docker build -t llmusic .
docker run -p 7860:7860 -e LASTFM_API_KEY=your_key_here llmusic   # → http://localhost:7860
```

**Tests:**
```bash
uv run pytest
```

Without a Last.fm key the app still works, using Deezer and ListenBrainz related artists only, but recommendations are noticeably weaker.

---

## Background

This started as a university project — a multi-agent AI pipeline that printed recommendations straight to the terminal. It worked, but it felt unfinished. The logic was solid; what was missing was a real interface around it.

The topic wasn't random. I'm a music enthusiast and I've always spent a lot of time digging for new artists and sounds. Most recommendation systems feel like a black box that just throws songs at you. I wanted something that could show its work — not just *what* to listen to next, but *why* it thinks you'd like it.

So I wrapped the original pipeline in a FastAPI backend and built a full React frontend on top. The terminal output became a live streaming UI where you can watch each agent run.

**Version 2** rebuilt the engine. The first version compared nine Spotify audio statistics (energy, tempo, …) from a fixed Kaggle dataset. That meant new songs were missing, and the matches often didn't *sound* alike. Spotify has also stopped offering those features to new apps. Now recommendations start from what real listeners play together, and an audio model listens to the actual music to decide which candidates fit.

---

## What could be better

- **User profiles.** Every search is still stateless. Storing what people search for, play and skip would allow a taste profile that weights recommendations over time.
- **Feedback loop.** A thumbs up / thumbs down on each recommendation would show which signals (listeners vs. sound) matter most, and let the weights be learned instead of hand-tuned.
- **Evaluation.** The ranking weights were tuned by listening to the results. A held-out benchmark (e.g. ListenBrainz listening sessions) would make that measurable.
- **Speed for brand-new searches.** Analysing ~50 previews takes around 40 seconds on a free 2-core CPU the first time a song is searched; repeat searches are instant thanks to the cache. A GPU or a pre-embedded catalog of popular songs would remove that wait.

---

## A note on the design

Most music recommenders are black boxes — they tell you *what* to listen to but never *why*. Every reason LLMusic shows comes from evidence it actually used: a co-listening signal, a measured sound similarity, or tags both songs share. Nothing is generated or guessed.

The sound descriptors ("acoustic guitar", "dark and moody") come from the same CLAP model, which understands both audio and text. A descriptor is only shown when *both* songs score clearly above typical music on it, measured against a genre-diverse reference set (`scripts/build_descriptor_stats.py`).
