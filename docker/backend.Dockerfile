# ValueCell backend image: FastAPI server + the default agent set
# (ResearchAgent, AutoTradingAgent, NewsAgent), started the same way
# start.sh does locally — via python/scripts/launch.py.
#
# Build context MUST be the repository root, not python/, e.g.:
#   docker build -f docker/backend.Dockerfile -t valuecell-backend .
# This is what docker-compose.yml does; it is called out here because
# getting the context wrong is the single easiest way to break this
# image (see the note on repo layout below).
#
# IMPORTANT — repo layout is preserved on purpose:
# ValueCell resolves its data directory (valuecell.db, lancedb/,
# .knowledge/, logs/) by walking a fixed number of parent directories
# up from source files under python/valuecell/... (see
# python/valuecell/utils/path.py and python/valuecell/server/config/
# settings.py). That math only lands on the right directory if the
# container filesystem mirrors the real repo layout: /app/python/...,
# not a flattened /app/.... So this image copies python/ into
# /app/python instead of collapsing it into /app.
FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

WORKDIR /app/python

# Install dependencies first so this layer is cached across code-only
# changes.
COPY python/pyproject.toml python/uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-install-project --no-dev

# Now copy the actual application source (third_party/ and other
# runtime-generated directories are excluded via .dockerignore — the
# investment-master personas and TradingAgents multi-analyst mode are
# a deliberate v1 scope cut, see docs/RELEASE_CN.md).
COPY python/ .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev

# ResearchAgent's web-search tool (crawl4ai) needs a real headless
# Chromium, matching what scripts/prepare_envs.sh installs for local
# dev. --with-deps also pulls the OS libraries Chromium needs.
RUN uv run playwright install --with-deps chromium

COPY docker/backend-entrypoint.sh /app/backend-entrypoint.sh
RUN chmod +x /app/backend-entrypoint.sh

EXPOSE 8000

# The entrypoint fails fast with an actionable message if no LLM
# provider key is set in .env, instead of the Python stack trace you
# get without it (verified: AgentOrchestrator builds a model eagerly
# at import time, so a blank .env crashes startup outright). Once
# that check passes it execs launch.py, which starts the API server
# plus the default agents (ResearchAgent, AutoTradingAgent, NewsAgent)
# as sibling processes — exactly what start.sh does outside Docker.
CMD ["/app/backend-entrypoint.sh"]
