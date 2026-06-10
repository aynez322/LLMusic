# ── Backend image: FastAPI + CrewAI recommendation API ──────────────
# Build context excludes the 997 MB of build-only data via .dockerignore;
# only data/merged_dataset.parquet and data/genre_fingerprints ship at runtime.
FROM python:3.12-slim

# uv binary (fast, lockfile-based installs)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Resolve + install dependencies (cached unless deps or src package change).
# src/ is needed because the project package is built from it (see pyproject.toml).
COPY pyproject.toml uv.lock ./
COPY src ./src
RUN uv sync --frozen --no-dev

# Application code + runtime data files
COPY api ./api
COPY data ./data

EXPOSE 8000

# $PORT is provided by Render/Railway; default 8000 locally.
CMD uv run uvicorn api.main:app --host 0.0.0.0 --port ${PORT}
