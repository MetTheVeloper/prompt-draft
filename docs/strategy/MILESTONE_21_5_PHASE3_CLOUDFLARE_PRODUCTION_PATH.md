# Milestone 21.5 — Phase 3 Cloudflare Production Path

Status: **FOUNDER-PRODUCTION-LIKE VERIFIED / ACCEPTED — FINAL API CACHE BYPASS CONFIGURATION PENDING**

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

Prove the real Cloudflare ingress path for the already-accepted Docker/Nitro runtime without exposing Docker-internal services or changing the application authorization model.

The founder deliberately chose a production-like staging domain for verification so the currently stable `prompt-draft.ir` deployment could remain untouched during Phase 3.

Verified staging path:

```text
https://grassic.ir
  -> Cloudflare edge
  -> Worker fallback layer
  -> Cloudflare Tunnel
  -> frontend:3000

https://api.grassic.ir
  -> Cloudflare edge
  -> Cloudflare Tunnel
  -> api:4000
```

Production cutover remains mechanically equivalent later:

```text
https://prompt-draft.ir
https://api.prompt-draft.ir
```

The application architecture remains split:

```text
Nuxt SSR server -> http://api:4000       Docker-internal only
browser          -> https://api.grassic.ir during staging verification
```

No Docker-internal hostname is intended to reach browser runtime configuration or public SSR output.

---

## 2. Auth and CORS contract

Prompt Draft auth remains Bearer-token based:

```text
browser localStorage
  -> Authorization: Bearer <token>
  -> API
```

Therefore Phase 3 did not require a SameSite/Domain cookie migration.

Verified staging CORS contract:

```text
Origin: https://grassic.ir
Access-Control-Allow-Origin: https://grassic.ir
Access-Control-Allow-Headers: Content-Type, Authorization
```

The browser successfully uses:

```text
https://api.grassic.ir
```

for client API traffic.

---

## 3. Cloudflare Tunnel runtime

Repository overlay:

```text
compose.cloudflare.yaml
```

Service:

```text
cloudflared
image: cloudflare/cloudflared:2026.8.3
remote-managed Tunnel token from CLOUDFLARE_TUNNEL_TOKEN
no public container port
waits for healthy frontend + API
restart: unless-stopped
```

Tunnel routes verified in the Cloudflare dashboard:

```text
grassic.ir     -> http://frontend:3000
api.grassic.ir -> http://api:4000
```

Cloudflare created the corresponding Tunnel CNAME records.

The local network blocks outbound QUIC/UDP 7844. Initial cloudflared runs therefore spent time retrying QUIC before falling back to HTTP/2. The Compose overlay was hardened to force HTTP/2 directly, eliminating the unnecessary restart delay.

Accepted transport for this environment:

```text
cloudflared -> Cloudflare edge over HTTP/2
```

---

## 4. Host exposure hardening

Base `compose.yaml` binds the host-facing frontend/API ports to loopback by default:

```text
127.0.0.1:3000 -> frontend:3000
127.0.0.1:4000 -> api:4000
```

Cloudflared talks to Docker service names on the Compose network and does not require LAN/public host-port exposure.

---

## 5. Staging environment contract

Verified local `.env` direction:

```text
NUXT_PUBLIC_API_BASE=https://api.grassic.ir
NUXT_PUBLIC_SITE_URL=https://grassic.ir
NUXT_PUBLIC_NOINDEX=true
CORS_ORIGINS includes https://grassic.ir plus accepted localhost development origins
FRONTEND_BIND_ADDRESS=127.0.0.1
API_BIND_ADDRESS=127.0.0.1
CLOUDFLARE_TUNNEL_TOKEN=<secret>
```

Compose supplies the private SSR API origin:

```text
NUXT_API_BASE_INTERNAL=http://api:4000
```

The Tunnel token remains local/secret and must never be committed.

Existing Arvan S3 archive-media configuration remains unchanged and independent of the frontend ingress decision.

---

## 6. Staging noindex hardening

`grassic.ir` is a temporary production-like staging hostname and must not become an independent search-indexed duplicate of Prompt Draft.

Repository middleware:

```text
server/middleware/staging-noindex.ts
```

When:

```text
NUXT_PUBLIC_NOINDEX=true
```

responses include:

```text
X-Robots-Tag: noindex, nofollow, noarchive
```

Founder verification confirmed the header over the real public Cloudflare path.

---

## 7. Edge fallback Worker

A Cloudflare Worker now protects the staging frontend UX when the local host/Tunnel is unavailable.

Repository source:

```text
cloudflare/fallback-worker/worker.js
cloudflare/fallback-worker/README.md
cloudflare/fallback-worker/wrangler.jsonc
```

Cloudflare Worker:

```text
prompt-draft-staging-fallback
```

Worker Route:

```text
grassic.ir/*
```

Failure mode:

```text
Fail open (proceed)
```

`api.grassic.ir` is intentionally not routed through the Worker.

Behavior:

```text
healthy Tunnel
  -> Worker transparently forwards normal application response

Tunnel/origin unavailable for HTML navigation
  -> Worker returns branded HTTP 503 fallback page
  -> links to https://prompt-draft.ir/
  -> provides retry action
```

Fallback response headers include:

```text
Cache-Control: no-store, max-age=0
Retry-After: 60
X-Robots-Tag: noindex, nofollow, noarchive
X-Prompt-Draft-Fallback: cloudflare-worker
```

This page is served from the Cloudflare edge, so it remains available when the Prompt Draft host machine or cloudflared process is offline.

---

## 8. Lifecycle commands

Local base stack:

```powershell
pnpm stack
pnpm stack:restart
pnpm stack:status
```

Cloudflare overlay stack:

```powershell
pnpm stack:cloudflare
pnpm stack:cloudflare:restart
pnpm stack:cloudflare:status
pnpm stack:cloudflare:logs
pnpm stack:cloudflare:stop
```

---

## 9. Verification evidence

### Gate A — local regression

Status:

```text
PASS / FOUNDER-LOCAL VERIFIED
```

Verified before public ingress:

```text
Nuxt client build PASS
Nuxt SSR server build PASS
Nitro node-server build PASS
frontend healthy
api healthy
db healthy
translator healthy
loopback host exposure PASS
homepage/discovery smoke PASS
regular login PASS
super-admin login PASS
application smoke PASS
```

### Gate B — public Docker/Tunnel runtime

Status:

```text
PASS / FOUNDER-PRODUCTION-LIKE VERIFIED
```

Verified services:

```text
frontend healthy
api healthy
db healthy
translator healthy
cloudflared running
```

Tunnel became healthy and received the dashboard-managed configuration:

```text
grassic.ir     -> http://frontend:3000
api.grassic.ir -> http://api:4000
```

### Gate C — public frontend + SSR safety

Status:

```text
PASS
```

Verified:

```text
https://grassic.ir returns current Docker/Nitro application
public discovery route renders through the public Cloudflare path
browser behavior matches accepted local runtime
```

SSR output audit searched for:

```text
api:4000
localhost:4000
api.prompt-draft.ir
```

and found no matches in the tested public SSR HTML.

### Gate D — public API + CORS

Status:

```text
PASS
```

Verified request:

```text
GET https://api.grassic.ir/api/db-check
Origin: https://grassic.ir
```

Observed:

```text
HTTP 200
Access-Control-Allow-Origin: https://grassic.ir
```

Browser DevTools confirmed client traffic targets `https://api.grassic.ir`.

### Gate E — application parity

Status:

```text
PASS / FOUNDER ACCEPTED
```

Founder reported no behavioral difference from the previously accepted application runtime after the public Cloudflare path became active. Homepage data/API behavior and authenticated application behavior were verified through the real HTTPS staging hostname.

### Gate F — restart/recovery

Status:

```text
PASS
```

Verified:

```text
pnpm stack:cloudflare:restart
pnpm stack:cloudflare:status
```

All application services recovered healthy. Direct HTTP/2 cloudflared transport substantially reduced the post-restart Tunnel recovery delay compared with QUIC retry/fallback behavior.

### Gate G — noindex

Status:

```text
PASS
```

Verified public response includes:

```text
X-Robots-Tag: noindex, nofollow, noarchive
```

### Gate H — Worker outage fallback

Status:

```text
PASS / FOUNDER VERIFIED
```

Healthy path:

```text
HTTP 200
normal Nuxt response
Worker remains transparent
```

Founder then intentionally stopped only `cloudflared`.

Observed outage response:

```text
HTTP/1.1 503 Service Unavailable
X-Prompt-Draft-Fallback: cloudflare-worker
X-Robots-Tag: noindex, nofollow, noarchive
custom Prompt Draft fallback HTML
```

Browser screenshot confirmed the branded fallback UI replaces Cloudflare Error 1033 for frontend navigation.

After restarting cloudflared, the same public route returned `HTTP 200` again without manual infrastructure intervention.

---

## 10. Cache safety

Required final Cloudflare rule before administrative closure:

```text
hostname == api.grassic.ir
-> Cache eligibility: Bypass cache
```

Do not enable blanket `Cache Everything` behavior for the API or application HTML during Phase 3.

Static Nuxt assets may use normal Cloudflare static-asset caching behavior.

Fine-grained public HTML/data caching belongs to Phase 4 after route/indexing semantics are finalized.

---

## 11. Rollback and resilience

If the staging Tunnel is unavailable:

```text
frontend HTML navigation -> Cloudflare Worker fallback page
stable product link       -> https://prompt-draft.ir/
```

If the Worker itself fails, its Cloudflare Route is configured `Fail open`, allowing requests to proceed to the underlying Tunnel/origin when possible.

The stable `prompt-draft.ir` deployment was intentionally not cut over during this phase, which preserved a separate known-good user path throughout staging verification.

No database migration is part of Phase 3.

---

## 12. Production cutover implication

Phase 3 proves the architecture required for a later production hostname switch.

The intended future cutover is primarily a hostname/configuration operation:

```text
grassic.ir            -> prompt-draft.ir
api.grassic.ir        -> api.prompt-draft.ir
NUXT_PUBLIC_*         -> production hostnames
CORS allowlist        -> production frontend origin
Cloudflare Tunnel DNS -> production zone
Worker policy         -> production decision
```

The accepted Docker/Nitro/Tunnel architecture does not require a new application rendering design for that switch.

---

## 13. Non-goals

Phase 3 does not include:

```text
full Iran/international-disconnection failover
public Creator implementation
Blog implementation
advanced HTML caching
full SEO metadata/sitemap redesign
changing Bearer auth to cookie auth
public database exposure
public translator exposure
```

The stable Prompt Draft/Arvan path and later resilience architecture remain separate concerns.

---

## 14. Final closure condition

All functional/runtime/public/fallback gates have passed.

The only remaining administrative hardening item is:

```text
Cloudflare Cache Rule:
api.grassic.ir -> Bypass cache
```

After that rule is confirmed, Phase 3 should be recorded as:

```text
DONE / FOUNDER-PRODUCTION-LIKE VERIFIED / ACCEPTED
```

and Milestone 21.5 Phase 4 — SEO Platform & Public Content Architecture — becomes the next implementation phase.
