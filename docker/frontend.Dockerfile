# ValueCell frontend image: static SPA build served by nginx, which
# also reverse-proxies API + SSE calls to the backend container so the
# browser only ever talks to one origin (no CORS, no baked-in host).
#
# Build context MUST be the repository root, e.g.:
#   docker build -f docker/frontend.Dockerfile -t valuecell-frontend .
#
# STATUS (see docs/RELEASE_CN.md for the full writeup): `bun run build`
# fails with exit code 1 in this build stage on GitHub Actions, twice
# in a row, including after pinning `oven/bun:1` -> `oven/bun:1.3.0`
# (matching package.json's packageManager field exactly) — so the
# floating-tag theory was WRONG, not just unverified. Four different
# local reproduction attempts in a Linux sandbox (bun 1.3.11) all
# succeeded: plain `bun run build`, with VITE_API_BASE_URL set, a full
# clean-room copy of this exact COPY/install/build sequence, and a
# truly cold install via `--cache-dir` pointed at an empty directory
# (to rule out a warm global bun cache masking a fetch-time issue).
# None of that reproduces the failure, which means whatever's wrong is
# specific to the actual containerized BuildKit execution — most
# likely a resource constraint (memory) in that RUN step, not a
# dependency or version problem. The two RUN lines below exist to make
# the *next* failure self-diagnosing in the CI log instead of another
# bare "exit code: 1".
FROM oven/bun:1.3.0 AS builder
WORKDIR /app

COPY frontend/package.json frontend/bun.lock ./
RUN bun install --frozen-lockfile

COPY frontend/ .

# Vite inlines VITE_* at build time. A relative path means the bundle
# works behind any host/port the container ends up published on,
# since nginx (below) resolves /api/v1 on the same origin.
ENV VITE_API_BASE_URL=/api/v1
RUN bun --version && (free -h || true) && (df -h /tmp || true)
RUN bun run build

FROM nginx:1.27-alpine
COPY --from=builder /app/build/client /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
