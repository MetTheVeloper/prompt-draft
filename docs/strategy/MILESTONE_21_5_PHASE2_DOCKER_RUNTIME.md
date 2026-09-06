# Milestone 21.5 — Phase 2 Docker Production Runtime

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED**

Date: 2026-09-07

Branch:

```text
feature/growth-foundation
```

Parent milestone:

```text
docs/strategy/MILESTONE_21_5_RENDERING_ORGANIC_ACQUISITION.md
```

---

## 1. Objective

Run Prompt Draft's hybrid Nuxt/Nitro frontend and the existing Node API as a production-like Docker stack with explicit service networking, health checks and separate server/browser API origins.

Phase 2 does not deploy Cloudflare yet. It proves the runtime shape locally before Phase 3 introduces the real public domain path.

---

## 2. Accepted runtime shape

```text
browser
  -> http://localhost:3000
  -> Nuxt/Nitro frontend container

browser-side API calls
  -> http://localhost:4000
  -> API container

server-side Nuxt SSR data calls
  -> http://api:4000
  -> API container over Docker Compose network

API
  -> db:5432
  -> translator:5000
```

The browser never receives `http://api:4000` as its API origin.

Founder-local DevTools verification confirmed authenticated browser traffic such as:

```text
GET http://localhost:4000/api/auth/me -> 200
```

---

## 3. Frontend production image

Root `Dockerfile` uses a multi-stage build.

Builder:

```text
node:24-alpine
corepack/pnpm
frozen lockfile install
Nuxt preparation
pnpm build
```

Runtime:

```text
node:24-alpine
only .output copied from builder
node .output/server/index.mjs
HOST=0.0.0.0
PORT=3000
```

The runtime image is therefore a long-lived Nitro Node server rather than a static generated frontend.

A root `.dockerignore` excludes local build outputs, node_modules, git metadata, backend/docs irrelevant to the frontend image, and local `.env` files/secrets from the frontend Docker build context.

### Build hardening discovered during founder-local verification

The first real Docker builds exposed three environment/build issues that were fixed before acceptance:

```text
1. packageManager integrity metadata for pnpm@11.6.0 was corrected so Corepack verification succeeds.
2. Nuxt SSR server bundling exceeded Node's default ~2 GB heap in the Alpine builder.
   Builder-only NODE_OPTIONS=--max-old-space-size=4096 was added.
3. Slow/unstable registry access caused pnpm install timeouts.
   BuildKit pnpm-store caching, longer fetch timeouts, additional retries,
   lower network concurrency and bounded install retries were added.
```

The larger Node heap is scoped to the **builder only** and is not inherited by the production runtime image.

The pnpm cache proved effective during restart/rebuild verification: once populated, the later install reused the full dependency set from the BuildKit cache instead of downloading it again.

---

## 4. Request-time SSR vs legacy static generation

The old Milestone 21 static configuration explicitly listed the six `/discover/*` routes in `nitro.prerender.routes`.

Keeping those routes unconditionally prerendered during `pnpm build` would be incorrect for Phase 2 because it could bake discovery data into the frontend image or build an empty/stale discovery page when no API is available inside the builder.

Phase 2 therefore separates the modes:

```text
pnpm build
  -> normal hybrid production build
  -> /discover/* remains request-time SSR

pnpm generate
  -> scripts/run-static-generate.mjs
  -> sets NUXT_LEGACY_STATIC_GENERATE=true only for the legacy compatibility run
  -> six controlled discovery routes are explicitly prerendered for the old static path
```

This preserves the rollback/history path without contaminating the production SSR runtime.

---

## 5. Server-internal vs browser-public API origins

Nuxt runtime config has two distinct API concepts:

```text
NUXT_API_BASE_INTERNAL
  -> private/server-only
  -> Compose value: http://api:4000

NUXT_PUBLIC_API_BASE
  -> serialized/browser-visible
  -> local Compose default: http://localhost:4000
```

`usePublicDiscovery()` selects:

```text
server render -> config.apiBaseInternal
browser render/client requests -> config.public.apiBase
```

This is the key networking invariant for Phase 2 and later Cloudflare deployment.

Host-side `pnpm build` / `pnpm preview` continues to fall back to the public/local API base when `NUXT_API_BASE_INTERNAL` is not provided.

---

## 6. Compose services

`compose.yaml` includes:

```text
frontend
api
translator
db
```

Frontend:

```text
port 3000
production Nitro runtime
waits for healthy API
restart: unless-stopped
healthcheck against /guide
```

API:

```text
port 4000
waits for healthy db + translator
restart: unless-stopped
healthcheck against /api/db-check
```

Database:

```text
postgres:17-alpine
pg_isready healthcheck
restart: unless-stopped
existing persistent volume retained
```

Translator:

```text
existing LibreTranslate healthcheck retained
restart: unless-stopped
existing model volume retained
```

No database or translation persistence volume is removed by normal stack startup/restart.

Founder-local acceptance confirmed all four services reach `healthy` state together.

---

## 7. Local CORS contract

The API local default allowlist includes both Nuxt modes used during development/testing:

```text
http://localhost:3030
http://127.0.0.1:3030
http://localhost:3000
http://127.0.0.1:3000
```

`CORS_ORIGINS` can be overridden from environment for later production/domain configuration.

Phase 3 must replace/extend this contract for the real HTTPS frontend origin rather than leaving production dependent on localhost defaults.

---

## 8. Lifecycle commands

Root `package.json` provides:

```powershell
pnpm stack
pnpm stack:restart
pnpm stack:stop
pnpm stack:status
pnpm stack:logs
pnpm frontend:logs
```

Existing API-only commands remain available:

```powershell
pnpm api
pnpm api:restart
pnpm api:stop
pnpm api:status
pnpm api:logs
```

Primary Phase 2 startup command:

```powershell
pnpm stack
```

Equivalent Docker command:

```powershell
docker compose up -d --build
```

---

## 9. Environment contract

`.env.example` documents the browser-visible API base:

```text
NUXT_PUBLIC_API_BASE=http://localhost:4000
```

Compose supplies the private internal value itself:

```text
NUXT_API_BASE_INTERNAL=http://api:4000
```

Do not normally put `NUXT_API_BASE_INTERNAL=http://api:4000` into the host `.env`, because host-side `pnpm preview` cannot resolve Docker's service hostname `api`.

---

## 10. Founder-local verification evidence

Phase 2 acceptance is complete.

### A. Build/start — PASS

Founder-local production-like build completed successfully:

```text
Nuxt client build -> PASS
Nuxt SSR server build -> PASS
Nitro node-server output -> PASS
frontend image -> BUILT
api image -> BUILT
```

Final healthy stack:

```text
frontend   -> healthy
api        -> healthy
db         -> healthy
translator -> healthy
```

### B. Public SSR path — PASS

Verified public routes include:

```text
/
/guide
/discover/posters-editorial
```

Raw discovery HTML was fetched from the running Nitro frontend with:

```powershell
curl.exe -s http://localhost:3000/discover/posters-editorial > phase2-ssr.html
```

The discovery route remained functional in the Docker runtime, proving the frontend container can resolve and use the internal API service path during SSR.

### C. Browser-public API path — PASS

DevTools verified browser-side authenticated API traffic targets:

```text
http://localhost:4000
```

Example observed request:

```text
GET http://localhost:4000/api/auth/me -> 200 OK
```

No Docker-internal `http://api:4000` origin was exposed to browser networking.

### D. Auth/application smoke — PASS

Founder-local smoke covered the previously accepted application routes and authentication behavior, including regular and super-admin access, client-heavy product routes and Wizard behavior.

### E. Restart/recovery smoke — PASS

Founder-local command:

```powershell
pnpm stack:restart
```

completed a full rebuild/recreate successfully.

After startup, all services returned to healthy state:

```text
frontend healthy
api healthy
db healthy
translator healthy
```

Application/discovery/login behavior remained correct after restart.

---

## 11. Non-goals

Phase 2 does not include:

```text
Cloudflare Tunnel/domain cutover
production TLS/cookie policy
production cache policy
Arvan failover
Blog implementation
Creator public route implementation
Creator indexability scoring
SEO snapshot cleanup
```

Those remain later milestone phases.

---

## 12. Acceptance result

```text
Phase 21.5.2 Docker Production Runtime
-> DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

The verified local production runtime is now the baseline for Phase 3.

---

## 13. Next phase

```text
Phase 3 — Cloudflare Production Path
```

Phase 3 will map the verified Docker runtime to real frontend/API origins and validate TLS, forwarded host/proto behavior, sessions/cookies, CORS and cache behavior through Cloudflare.
