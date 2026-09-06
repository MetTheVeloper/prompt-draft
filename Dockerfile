FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm --version

COPY . .

RUN --mount=type=cache,id=prompt-draft-pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

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
