# ── Stage 1: build the React frontend ───────────────────────────────
FROM node:20-slim AS frontend
WORKDIR /build
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build          # → /build/dist

# ── Stage 2: Python backend that also serves the built frontend ──────
FROM python:3.12-slim

# build tools for any Python deps without prebuilt wheels
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# uv — fast, lockfile-based installer
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Hugging Face Spaces run the container as a non-root user (uid 1000)
RUN useradd -m -u 1000 user && mkdir -p /home/user/app && chown -R user:user /home/user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    PYTHONUNBUFFERED=1 \
    PORT=7860
WORKDIR /home/user/app

# Install dependencies first (cached unless deps or the src package change).
# src/ is required because the project package is built from it (pyproject.toml).
COPY --chown=user pyproject.toml uv.lock ./
COPY --chown=user src ./src
RUN uv sync --frozen --no-dev

# App code, runtime data (build-only files excluded via .dockerignore),
# and the frontend bundle from stage 1.
COPY --chown=user api ./api
COPY --chown=user data ./data
COPY --chown=user --from=frontend /build/dist ./frontend/dist

EXPOSE 7860
CMD uv run uvicorn api.main:app --host 0.0.0.0 --port ${PORT}
