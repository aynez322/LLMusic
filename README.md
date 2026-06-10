---
title: LLMusic
emoji: 🎵
colorFrom: orange
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# LLMusic — AI-Based Music Recommendation

> Type a song. Three AI agents figure out why you like it and what to listen to next.

---

![LLMusic home page screenshot](docs/screenshot.png)
<!-- replace with an actual screenshot once the app is running -->

---

## What it does

LLMusic takes a song title and artist and runs them through a multi-agent pipeline that:

1. **Looks up the track** in a dataset of 114 000+ songs and reads its nine Spotify audio features — energy, danceability, valence, tempo, acousticness, and more.
2. **Finds the five closest matches** using cosine similarity across those features.
3. **Explains the recommendations** in plain English, backed by SHAP values and an XGBoost genre classifier — so you know *why* a song was suggested, not just *that* it was.

The result shows up progressively in the UI as each agent finishes, so you're never staring at a blank screen.

---

## Tech at a glance

| Layer | Stack |
|---|---|
| AI pipeline | [CrewAI](https://github.com/crewaiinc/crewai) · Gemini 2.5 Flash · SHAP · XGBoost · scikit-learn |
| Backend | Python · FastAPI · Server-Sent Events (SSE) · Last.fm API |
| Frontend | React 19 · TypeScript · Vite · Tailwind CSS · Framer Motion |
| Data | Kaggle Spotify dataset (~114 k tracks, 9 audio features) |

---

## Project structure

```
src/ai_based_music_recommendation/   ← CrewAI agents, tools, config
api/                                  ← FastAPI wrapper (SSE streaming)
frontend/                             ← React + Vite UI
data/                                 ← processed dataset
scripts/                              ← dataset preparation
```

---

## Running locally

**Backend**
```bash
# from project root, with the virtualenv active
uvicorn api.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

A `.env` file with `GEMINI_API_KEY` and `LASTFM_API_KEY` is required in the project root.

---

## Background

This started as a university project — a multi-agent AI pipeline that printed recommendations straight to the terminal. It worked, but it felt unfinished. The logic was solid; what was missing was a real interface around it.

The topic wasn't random. I'm a music enthusiast and I've always spent a lot of time digging for new artists and sounds. Most recommendation systems feel like a black box that just throws songs at you. I wanted something that could show its work — not just *what* to listen to next, but *why* it thinks you'd like it.

So I wrapped the original pipeline in a FastAPI backend and built a full React frontend on top. The terminal output became a live streaming UI where you can watch each agent run.

---

## What could be better

A few honest things that would make this significantly stronger:

- **Better audio features.** The current dataset describes music statistically (energy as a 0–1 float, tempo in BPM, etc). What's missing is features that describe how a song *actually sounds* — timbre, texture, instrument presence. That kind of data would make matches feel more natural to a human ear.

- **User profiles.** Right now every search is stateless. A proper user layer — storing what people search for, what they skip, what they play — would let the system build a taste profile over time and weight recommendations accordingly.

- **Feedback loop.** A simple thumbs up / thumbs down on each recommendation would be enough to start closing the gap between "statistically similar" and "actually what I wanted." Without that signal the system can't learn from its own mistakes.

---

## A note on the design

Most music recommenders are black boxes — they tell you *what* to listen to but never *why*. The interesting part of this project is the third agent: it uses SHAP feature importance to generate a one-paragraph human explanation for each recommendation, grounded entirely in the audio data. No hallucination, no filler — just a direct answer to "what do these two songs actually have in common?"

The UI reflects that: agent steps animate in one by one so you can follow the reasoning as it happens, not just see the final answer.
