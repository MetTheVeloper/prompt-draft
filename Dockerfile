FROM node:24-alpine AS builder

WORKDIR /app

# Bootstrap the pinned package manager before copying project manifests so
# ordinary source changes do not invalidate the Corepack layer.
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

# Dependency downloads are keyed only by the package manifests. As long as
# package.json and pnpm-lock.yaml are unchanged, Docker can reuse this layer and
# no registry access is needed for ordinary frontend source edits.
COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=prompt-draft-pnpm-store,target=/pnpm/store,sharing=locked \
    pnpm config set store-dir /pnpm/store && \
    pnpm config set network-concurrency 8 && \
    pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-mintimeout 10000 && \
    pnpm config set fetch-retry-maxtimeout 120000 && \
    pnpm config set fetch-timeout 300000 && \
    for attempt in 1 2 3; do \
      NODE_OPTIONS=--dns-result-order=ipv4first pnpm fetch --frozen-lockfile && break; \
      if [ "$attempt" = "3" ]; then exit 1; fi; \
      echo "pnpm fetch failed on attempt $attempt; retrying with cached downloads..."; \
      sleep 5; \
    done

# Copy application source only after the dependency-fetch layer. Source edits
# invalidate the install/build layers below, but not the registry-download layer.
COPY . .

# The project postinstall runs `nuxt prepare`, which needs the application
# source/config to exist. Install from the already-fetched store in strict
# offline mode so normal frontend rebuilds cannot spend time re-downloading
# packages. The shared BuildKit store also survives lockfile changes and lets
# pnpm fetch only newly introduced package content.
RUN --mount=type=cache,id=prompt-draft-pnpm-store,target=/pnpm/store,sharing=locked \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --offline --frozen-lockfile

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
