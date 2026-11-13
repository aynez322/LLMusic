# ── Stage 1: build the React frontend ───────────────────────────────
FROM node:20-slim AS frontend
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build          # → /build/dist

# ── Stage 2: Python backend that also serves the built frontend ──────
FROM python:3.12-slim

# uv — fast, lockfile-based installer
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Hugging Face Spaces run the container as a non-root user (uid 1000)
RUN useradd -m -u 1000 user && mkdir -p /home/user/app && chown -R user:user /home/user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_CACHE=1 \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/home/user/.cache/huggingface \
    CACHE_DIR=/home/user/app/.cache \
    PORT=7860
WORKDIR /home/user/app

# Dependencies first (cached unless pyproject/uv.lock change). CPU-only torch
# comes from the PyTorch CPU index configured in pyproject.toml.
COPY --chown=user pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

# Bake the CLAP model into the image so the first request doesn't download ~600 MB.
RUN uv run --no-sync python -c "from transformers import ClapModel, ClapProcessor; \
m='laion/clap-htsat-unfused'; ClapModel.from_pretrained(m, use_safetensors=True); ClapProcessor.from_pretrained(m)"

COPY --chown=user api ./api
COPY --chown=user --from=frontend /build/dist ./frontend/dist

EXPOSE 7860
CMD uv run --no-sync uvicorn api.main:app --host 0.0.0.0 --port ${PORT}
