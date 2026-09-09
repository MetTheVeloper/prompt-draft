FROM node:24-alpine AS builder

WORKDIR /app

# Bootstrap the pinned package manager before copying project manifests so
# ordinary package.json/lockfile changes do not invalidate the Corepack layer.
# Docker Desktop connections can intermittently expose unreachable IPv6 routes,
# so prefer IPv4 DNS ordering and retry the one-time Corepack download.
ARG PNPM_VERSION=11.6.0
RUN corepack enable && \
    for attempt in 1 2 3; do \
      NODE_OPTIONS=--dns-result-order=ipv4first corepack install --global pnpm@${PNPM_VERSION} && \
      pnpm --version && break; \
      if [ "$attempt" = "3" ]; then exit 1; fi; \
      echo "Corepack pnpm bootstrap failed on attempt $attempt; retrying..."; \
      sleep 5; \
    done

COPY package.json pnpm-lock.yaml ./
COPY . .

# Keep the pnpm content-addressable store across Docker builds. The registry can
# be slow or intermittently unavailable on the local development connection, so
# use conservative concurrency, longer fetch timeouts and retries. The outer
# retry loop reuses the same BuildKit cache and lets a partially completed
# install continue instead of discarding already downloaded packages.
RUN --mount=type=cache,id=prompt-draft-pnpm-store,target=/pnpm/store,sharing=locked \
    pnpm config set store-dir /pnpm/store && \
    pnpm config set network-concurrency 8 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 10000 && \
    pnpm config set fetch-retry-maxtimeout 120000 && \
    pnpm config set fetch-timeout 300000 && \
    for attempt in 1 2 3; do \
      pnpm install --frozen-lockfile && break; \
      if [ "$attempt" = "3" ]; then exit 1; fi; \
      echo "pnpm install failed on attempt $attempt; retrying with cached downloads..."; \
      sleep 5; \
    done

ENV NODE_ENV=production
# Nuxt's SSR bundle for this project exceeds Node's ~2 GB default heap while
# rendering server chunks in the Alpine build container. Keep the larger heap
# scoped to the builder only; the runtime image does not inherit NODE_OPTIONS.
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm build

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
