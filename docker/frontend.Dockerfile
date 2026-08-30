# ValueCell frontend image: static SPA build served by nginx, which
# also reverse-proxies API + SSE calls to the backend container so the
# browser only ever talks to one origin (no CORS, no baked-in host).
#
# Build context MUST be the repository root, e.g.:
#   docker build -f docker/frontend.Dockerfile -t valuecell-frontend .

FROM oven/bun:1 AS builder
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
