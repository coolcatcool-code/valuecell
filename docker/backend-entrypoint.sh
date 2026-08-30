#!/usr/bin/env bash
# Fails fast with a clear message instead of a Python stack trace when
# no LLM provider is configured. Without this, the backend crashes
# during startup (AgentOrchestrator eagerly builds a model for the
# super_agent) and, under `restart: unless-stopped`, would just
# crash-loop silently. Verified locally: a .env freshly copied from
# .env.example (i.e. every key still blank) reproduces this exact
# crash before this script existed.
set -euo pipefail

ENV_FILE="/app/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ /app/.env not found. docker-compose.yml should bind-mount your" >&2
  echo "   repo-root .env into the backend container — check the volumes:" >&2
  echo "   section, and that you ran 'cp .env.example .env' first." >&2
  exit 1
fi

# Matches any of the supported providers with a non-empty value
# (see .env.example's "Model Provider Settings" section).
if ! grep -Eq '^(OPENROUTER_API_KEY|GOOGLE_API_KEY|AZURE_OPENAI_API_KEY|OPENAI_API_KEY|SILICONFLOW_API_KEY|OPENAI_COMPATIBLE_API_KEY)=.+[^[:space:]]' "$ENV_FILE"; then
  echo "❌ No LLM provider API key found in .env." >&2
  echo "" >&2
  echo "   ValueCell needs at least one of these set before it can start:" >&2
  echo "   OPENROUTER_API_KEY, GOOGLE_API_KEY, AZURE_OPENAI_API_KEY," >&2
  echo "   OPENAI_API_KEY, SILICONFLOW_API_KEY, or OPENAI_COMPATIBLE_API_KEY." >&2
  echo "" >&2
  echo "   Edit .env at the repo root, then re-run:" >&2
  echo "     docker compose up -d --build" >&2
  exit 1
fi

echo "✅ Found a configured LLM provider — starting ValueCell."
exec uv run python scripts/launch.py
