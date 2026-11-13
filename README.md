# Listeners Like Me

> Type a song. LLMusic finds what people who love it also play, listens to every candidate, and tells you why each one fits.

**[Try it live →](https://huggingface.co/spaces/aynez/llmusic)**

![Demo: typing "Holocene" by Bon Iver and getting ten recommendations with reasons](docs/demo.gif)

## How it works

1. **Follows the listeners.** Last.fm, ListenBrainz and Deezer supply ~50 candidates: songs and artists that people who play your song also play.
2. **Listens to them.** Each candidate's 30-second preview goes through [CLAP](https://huggingface.co/laion/clap-htsat-unfused), an audio AI model, to measure how close it *sounds* to your song.
3. **Ranks and explains.** Listener evidence and sound similarity are blended, with one song per artist. A **Discovery** slider shifts results from familiar hits to deep cuts, and every pick shows the evidence behind it, e.g. *"Both have: acoustic guitar, slow and calm"*.

Any song on Deezer works, including new releases.

**Stack:** FastAPI · PyTorch (CLAP) · React · TypeScript · Tailwind · Docker on Hugging Face Spaces

## Running locally

Add a free [Last.fm API key](https://www.last.fm/api/account/create) to a `.env` file in the project root:

```
LASTFM_API_KEY=your_key_here
```

```bash
uv sync && uv run uvicorn api.main:app --reload --port 8000   # backend (downloads the ~600 MB model on first start)
cd frontend && npm install && npm run dev                      # frontend → http://localhost:5173
```

Or with Docker: `docker build -t llmusic . && docker run -p 7860:7860 --env-file .env llmusic` → http://localhost:7860

Tests: `uv run pytest`

## Background

This started as a university project: a multi-agent LLM pipeline that compared nine Spotify audio statistics from a fixed dataset. As a music enthusiast, I wanted a recommender that shows *why* it suggests something, not a black box. Version 2 rebuilt the engine around real listening data and an audio model, so new songs work and matches actually sound alike. With no LLM left, the name now stands for **Listeners Like Me**.

## What could be better

- **Feedback and profiles:** thumbs up/down and listening history to learn the ranking weights, which are currently hand-tuned.
- **Speed:** a first-time search takes ~40 s on the free CPU tier (repeats are instant). A GPU or a pre-embedded catalog would fix that.
