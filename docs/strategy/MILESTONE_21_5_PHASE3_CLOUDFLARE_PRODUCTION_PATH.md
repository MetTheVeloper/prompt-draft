# Milestone 21.5 — Phase 3 Cloudflare Production Path

Status: **IMPLEMENTED REPO PREPARATION / AWAITING LOCAL REGRESSION + CLOUDFLARE CUTOVER**

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

Expose the already-verified Phase 2 Docker runtime through Cloudflare without changing the application security model or leaking Docker-internal services.

Primary production target:

```text
https://prompt-draft.ir
  -> Cloudflare edge
  -> Cloudflare Tunnel
  -> frontend:3000

https://api.prompt-draft.ir
  -> Cloudflare edge
  -> Cloudflare Tunnel
  -> api:4000
```

The API remains an independent service. Nuxt SSR continues to use the Docker-internal API origin:

```text
http://api:4000
```

Browser requests use the public API origin:

```text
https://api.prompt-draft.ir
```

---

## 2. Accepted auth implication

Current Prompt Draft auth is Bearer-token based:

```text
browser localStorage
  -> Authorization: Bearer <token>
  -> API
```

It is not currently cookie-session based.

Consequences for Phase 3:

```text
no SameSite cookie migration required
no production cookie Domain policy required
no Access-Control-Allow-Credentials requirement for auth
Authorization must remain allowed by CORS
CORS must allow the production frontend origin exactly
```

A future switch to HttpOnly cookie auth would require a separate cookie/proxy review.

---

## 3. Production ingress decision

Phase 3 uses a remotely managed Cloudflare Tunnel.

Repository overlay:

```text
compose.cloudflare.yaml
```

Service:

```text
cloudflared
  image: cloudflare/cloudflared:2026.8.3
  token: CLOUDFLARE_TUNNEL_TOKEN from environment
  no public container port
  waits for healthy frontend + API
  restart: unless-stopped
```

The real Tunnel token must never be committed.

Cloudflare dashboard owns public-hostname routing. Expected routes:

```text
prompt-draft.ir
  -> HTTP
  -> http://frontend:3000

api.prompt-draft.ir
  -> HTTP
  -> http://api:4000
```

The HTTP origin is private inside the Docker network; public browser traffic remains HTTPS at the Cloudflare edge.

---

## 4. Host exposure hardening

Base `compose.yaml` now binds host ports to loopback by default:

```text
127.0.0.1:3000 -> frontend:3000
127.0.0.1:4000 -> api:4000
```

Configurable variables:

```text
FRONTEND_BIND_ADDRESS
API_BIND_ADDRESS
```

This preserves localhost smoke tests while avoiding accidental direct LAN/public exposure as the normal production ingress path.

Cloudflared does not need these host bindings because it talks to Docker service names on the Compose network.

---

## 5. Production environment contract

Expected production `.env` values:

```text
NUXT_PUBLIC_API_BASE=https://api.prompt-draft.ir
NUXT_PUBLIC_SITE_URL=https://prompt-draft.ir
CORS_ORIGINS=https://prompt-draft.ir,https://www.prompt-draft.ir
FRONTEND_BIND_ADDRESS=127.0.0.1
API_BIND_ADDRESS=127.0.0.1
CLOUDFLARE_TUNNEL_TOKEN=<secret>
```

`NUXT_API_BASE_INTERNAL` remains supplied by Compose:

```text
http://api:4000
```

Do not replace the internal SSR origin with the Cloudflare public API hostname. SSR should not make a public round trip when the API is available on the same Docker network.

---

## 6. Cloudflare dashboard configuration

One-time external configuration is required.

### A. Tunnel

Create a remotely managed Cloudflare Tunnel for Prompt Draft and obtain its Docker/token credential.

Store only the token in the production `.env` or secret store:

```text
CLOUDFLARE_TUNNEL_TOKEN=...
```

### B. Public hostnames

Configure:

```text
prompt-draft.ir      -> http://frontend:3000
api.prompt-draft.ir  -> http://api:4000
```

Optional `www.prompt-draft.ir` policy should be a redirect to the canonical apex hostname rather than a second independently indexable site.

Recommended canonical host:

```text
https://prompt-draft.ir
```

### C. HTTPS

Public traffic must use HTTPS.

Enable/retain Cloudflare edge HTTPS and redirect HTTP to HTTPS.

Because the Tunnel connection is outbound and private, no public origin port or origin TLS certificate is required for the Docker HTTP services themselves.

### D. Cache safety

For the first production rollout:

```text
api.prompt-draft.ir/** -> BYPASS CACHE
```

Do not enable a blanket `Cache Everything` rule for the API or application HTML during Phase 3.

Static Nuxt assets may use Cloudflare's normal static-asset caching behavior.

Fine-grained HTML/public-data caching belongs to Phase 4 after SEO/public route semantics are finalized.

### E. Security / proxy headers

Do not strip Cloudflare proxy headers.

Cloudflare/Tunnel may provide headers such as forwarded protocol/host and Cloudflare client-IP metadata. Current application authorization does not trust these headers for permissions, so Phase 3 does not introduce an IP-auth security dependency.

---

## 7. CORS contract

The backend uses an exact-origin allowlist from:

```text
CORS_ORIGINS
```

Production must include the frontend browser origins that are actually allowed to call the API.

Recommended initial value:

```text
https://prompt-draft.ir,https://www.prompt-draft.ir
```

If `www` is immediately redirected and never runs the application, the allowlist can later be reduced to only the apex origin.

Current API CORS response supports:

```text
Content-Type
Authorization
GET, POST, PUT, DELETE, OPTIONS
```

Bearer-token auth therefore remains compatible with the cross-origin frontend/API split.

---

## 8. Lifecycle commands

Local Phase 2 stack remains:

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

Equivalent base command:

```powershell
docker compose -f compose.yaml -f compose.cloudflare.yaml up -d --build
```

---

## 9. Phase 3 verification gates

### Gate A — local regression after host-bind hardening

Before configuring a real Tunnel, verify the normal local stack still passes:

```powershell
git pull
pnpm stack:restart
pnpm stack:status
```

Expected:

```text
frontend healthy
api healthy
db healthy
translator healthy
```

Then smoke:

```text
http://localhost:3000/
http://localhost:3000/discover/posters-editorial
regular login
super-admin login
/create
/prompts
/user
/manage
Wizard
```

Browser API requests must still use:

```text
http://localhost:4000
```

### Gate B — production environment build

On the production host, set the production `.env` values before building the frontend image because `NUXT_PUBLIC_*` values affect the browser/public runtime contract.

Start:

```powershell
pnpm stack:cloudflare
pnpm stack:cloudflare:status
```

Expected services:

```text
frontend healthy
api healthy
db healthy
translator healthy
cloudflared running
```

### Gate C — public frontend

Verify:

```text
https://prompt-draft.ir/
https://prompt-draft.ir/guide
https://prompt-draft.ir/discover/posters-editorial
```

Raw HTML check:

```powershell
curl.exe -s https://prompt-draft.ir/discover/posters-editorial > phase3-public-ssr.html
```

Expected:

```text
SSR route-specific HTML present
published discovery content present when data exists
no Docker-internal hostname exposed
```

### Gate D — public API and CORS

Verify:

```text
https://api.prompt-draft.ir/api/db-check
```

From the real frontend browser session verify client requests target:

```text
https://api.prompt-draft.ir
```

and login/authenticated requests succeed without CORS errors.

### Gate E — auth/application smoke

Verify through the real HTTPS frontend:

```text
regular login
super-admin login
/create
/prompts
/user
/manage
Wizard
```

### Gate F — restart/recovery

```powershell
pnpm stack:cloudflare:restart
pnpm stack:cloudflare:status
```

After recovery, repeat:

```text
/
/discover/posters-editorial
login/authenticated request
```

---

## 10. Rollback

If the public Cloudflare path is unhealthy:

```text
do not expose DB or translator publicly
stop/disable Tunnel hostname routing
keep the already-verified local Docker runtime intact
```

The Phase 2 runtime remains the rollback baseline.

No database migration is part of Phase 3.

---

## 11. Non-goals

Phase 3 does not include:

```text
Arvan/Iran-disconnection failover
Cloudflare-specific business logic
public Creator implementation
Blog implementation
advanced edge caching
full SEO metadata/sitemap redesign
changing Bearer auth to cookie auth
public database exposure
public translator exposure
```

The Arvan/fallback architecture discussed separately remains a later resilience layer.

---

## 12. Next phase after acceptance

```text
Phase 4 — SEO Platform & Public Content Architecture
```

Phase 4 can begin only after the real Cloudflare production path is verified or the founder explicitly chooses to defer public cutover while retaining the prepared Phase 3 infrastructure.
