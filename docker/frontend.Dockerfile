# ValueCell frontend image: static SPA build served by nginx, which
# also reverse-proxies API + SSE calls to the backend container so the
# browser only ever talks to one origin (no CORS, no baked-in host).
#
# Build context MUST be the repository root, e.g.:
#   docker build -f docker/frontend.Dockerfile -t valuecell-frontend .
#
# The bun version below MUST stay pinned, and MUST match
# frontend/package.json's "packageManager" field. This was originally
# `oven/bun:1` (a floating major-version tag) and it broke a real CI
# build: `bun run build` failed with exit code 1 on whatever bun 1.x
# the tag resolved to at that moment, while the exact same command
# against the pinned version below (reproduced locally, twice, from a
# clean install matching this Dockerfile's COPY order) built cleanly
# both times. If you bump the pinned bun version here, bump
# package.json's packageManager to match in the same change, and
# confirm `bun run build` still succeeds before merging.
FROM oven/bun:1.3.0 AS builder
WORKDIR /app

COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

COPY frontend/ .

# Vite inlines VITE_* at build time. A relative path means the bundle
# works behind any host/port the container ends up published on,
# since nginx (below) resolves /api/v1 on the same origin.
ENV VITE_API_BASE_URL=/api/v1
RUN bun run build

FROM nginx:1.27-alpine
COPY --from=builder /app/build/client /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
