# Milestone 21.5 — Phase 5.1C Production Cutover + Rollback Runbook

Status: **DESIGN COMPLETE / EXTERNAL PRODUCTION SNAPSHOT + FOUNDER APPROVAL PENDING**

Date: 2026-09-12

Branch:

```text
feature/growth-foundation
```

Canonical parent:

```text
docs/strategy/MILESTONE_21_5_PHASE5_LAUNCH_READINESS.md
```

This document is a runbook, not authorization to execute production changes.

No step that changes `prompt-draft.ir`, `api.prompt-draft.ir`, production DNS, production Tunnel routing, production Worker routing or production indexability may be executed until the founder explicitly approves the cutover in that turn.

---

## 1. Accepted source architecture

Current production-like staging path:

```text
https://grassic.ir
  -> Cloudflare
  -> staging fallback Worker route
  -> Cloudflare Tunnel
  -> frontend:3000

https://api.grassic.ir
  -> Cloudflare
  -> Cloudflare Tunnel
  -> api:4000
```

Target production path:

```text
https://prompt-draft.ir
  -> Cloudflare
  -> Cloudflare Tunnel
  -> frontend:3000

https://api.prompt-draft.ir
  -> Cloudflare
  -> Cloudflare Tunnel
  -> api:4000
```

Docker-internal SSR API remains:

```text
http://api:4000
```

Host exposure remains loopback-only:

```text
127.0.0.1:3000 -> frontend:3000
127.0.0.1:4000 -> api:4000
```

---

## 2. Critical cutover finding — staging and production cannot share one frontend indexability state

Current noindex middleware reads one process-wide environment value:

```text
NUXT_PUBLIC_NOINDEX
```

Therefore one running frontend container cannot safely serve both:

```text
grassic.ir      -> noindex=true
prompt-draft.ir -> noindex=false
```

at the same time.

### Accepted initial-cutover policy

Use **staging frontend retirement**, not a Phase 4 redesign:

```text
before NUXT_PUBLIC_NOINDEX is changed to false
-> grassic.ir must stop serving the normal Nuxt frontend
-> then production env is applied
-> then production hostnames are routed to the verified containers
```

`api.grassic.ir` may remain temporarily during the transition because the API is not an indexable HTML surface, but it should be retired after production verification unless a deliberate staging API role remains.

Alternative architectures such as a second staging frontend container or hostname-aware indexability are explicitly outside the initial cutover unless separately designed and accepted.

---

## 3. Production fallback Worker decision

The existing Worker is staging-specific:

```text
cloudflare/fallback-worker/worker.js
Worker route: grassic.ir/*
```

Its copy describes the experimental cloud version and links users to:

```text
https://prompt-draft.ir/
```

Therefore:

```text
DO NOT attach the existing staging Worker unchanged to prompt-draft.ir/*
```

Initial production cutover policy:

```text
prompt-draft.ir -> Tunnel directly
production fallback Worker -> NOT part of initial cutover
```

A production fallback Worker can be designed later with production-safe copy and failure behavior. The staging Worker may be retired together with staging or kept only while it remains useful and safely noindexed.

---

## 4. Production environment contract

The production host `.env` must use:

```text
NUXT_PUBLIC_API_BASE=https://api.prompt-draft.ir
NUXT_PUBLIC_SITE_URL=https://prompt-draft.ir
NUXT_PUBLIC_NOINDEX=false
CORS_ORIGINS=https://prompt-draft.ir
FRONTEND_BIND_ADDRESS=127.0.0.1
API_BIND_ADDRESS=127.0.0.1
```

If `https://www.prompt-draft.ir` is intentionally retained as a browser origin rather than redirected before application traffic, add it explicitly to `CORS_ORIGINS`. Do not add it merely by assumption.

Keep server-internal SSR routing Compose-controlled:

```text
NUXT_API_BASE_INTERNAL=http://api:4000
```

Do not change these unrelated accepted secrets/services during cutover:

```text
BLOG_GITHUB_TOKEN
BLOG_GITHUB_REPOSITORY
BLOG_GITHUB_BRANCH
ARCHIVE_S3_*
DB data/volume
translator data/volume
```

The existing `CLOUDFLARE_TUNNEL_TOKEN` may remain unchanged if production public hostnames are added to the accepted remote-managed Tunnel. Replacing the Tunnel/token is a separate infrastructure change and must not be bundled into cutover without evidence that it is required.

---

## 5. External production snapshot — mandatory unresolved values

Before founder approval, capture the current stable production state from Cloudflare/current hosting. These values are intentionally not guessed from the repository.

Record:

```text
CURRENT_PROD_FRONTEND_DNS_TYPE=
CURRENT_PROD_FRONTEND_DNS_VALUE=
CURRENT_PROD_FRONTEND_PROXY_STATE=

CURRENT_PROD_API_DNS_TYPE=
CURRENT_PROD_API_DNS_VALUE=
CURRENT_PROD_API_PROXY_STATE=

CURRENT_WWW_DNS_TYPE=
CURRENT_WWW_DNS_VALUE=
CURRENT_WWW_POLICY=redirect|serve|unused

CURRENT_PRODUCTION_ORIGIN_DESCRIPTION=
CURRENT_PRODUCTION_ROLLBACK_TARGET=

CLOUDFLARE_TUNNEL_NAME=
CLOUDFLARE_TUNNEL_ID=
CURRENT_TUNNEL_PUBLIC_HOSTNAMES=

CURRENT_WORKER_ROUTES=
CURRENT_CACHE_RULES=
CURRENT_API_BYPASS_RULE=
```

Save screenshots/exported values outside the repository. The rollback section is not executable until these values are known.

---

## 6. Phase 5.2 gate before cutover

Production cutover is blocked until focused measurement verification passes locally/staging.

From repository root:

```powershell
pnpm test:product-analytics-web
pnpm api
pnpm test:product-analytics
pnpm frontend
pnpm stack:cloudflare:status
```

Do not run `pnpm stack` merely for reassurance.

Required runtime smoke before production approval:

```text
public Prompt client view event
public Creator client view event
Blog index client view event
Blog Article client view event
valid Discovery client view event
invalid Discovery route does not create public_discovery_view
protected Prompt copy intent
locked Prompt unlock intent
successful clipboard copy
completed unlock recorded transactionally
Goin spend recorded transactionally
/api/admin/growth/summary?days=7 returns launchFunnel
staging still returns X-Robots-Tag noindex
```

---

## 7. Pre-cutover local checkpoint

Run immediately before the approved production maintenance window:

```powershell
git fetch origin
git checkout feature/growth-foundation
git pull --ff-only
git rev-parse HEAD
git status --short
pnpm stack:cloudflare:status
```

The recorded HEAD must equal the founder-approved cutover SHA.

### Private `.env` backup

Keep the backup outside the repository:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path (Split-Path $PWD -Parent) "prompt-draft-private-backups"
New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
Copy-Item .env (Join-Path $backupRoot "prompt-draft-env-$stamp")
```

Do not print or commit the Tunnel token, GitHub token or S3 credentials.

### Database checkpoint policy

The cutover does not change schema, migrations, persistent volumes or business data. Database restore is therefore **not** part of normal DNS/env rollback. If a separate database mutation is introduced before cutover, this runbook must be amended before approval.

---

## 8. Approved cutover sequence

### Step 1 — retire the staging frontend ingress before enabling production indexability

In Cloudflare Zero Trust / Tunnel public hostnames, disable/remove the frontend mapping:

```text
grassic.ir -> http://frontend:3000
```

Do not yet change production DNS.

Verification gate:

```powershell
curl.exe -sS -D - -o NUL https://grassic.ir/
```

Pass condition:

```text
grassic.ir no longer serves the normal Nuxt application as an indexable HTTP 200 surface
```

A staging Worker 503 with `X-Robots-Tag: noindex...`, a retired hostname response or another clearly non-application response is acceptable during this transition.

Do **not** set `NUXT_PUBLIC_NOINDEX=false` while `grassic.ir` still serves the normal frontend container.

### Step 2 — change only production-facing runtime environment values

Edit `.env` to:

```text
NUXT_PUBLIC_API_BASE=https://api.prompt-draft.ir
NUXT_PUBLIC_SITE_URL=https://prompt-draft.ir
NUXT_PUBLIC_NOINDEX=false
CORS_ORIGINS=https://prompt-draft.ir
FRONTEND_BIND_ADDRESS=127.0.0.1
API_BIND_ADDRESS=127.0.0.1
```

Preserve all secrets and unrelated variables.

### Step 3 — recreate API and frontend without rebuilding verified images

Environment-only changes do not justify an image rebuild:

```powershell
pnpm api:recreate
pnpm api:status
pnpm frontend:recreate
pnpm frontend:status
```

Do not recreate DB, translator or cloudflared unless a separate failure proves it is necessary.

### Step 4 — loopback production-env verification before DNS cutover

API health + production CORS:

```powershell
curl.exe -sS -D - -o NUL http://127.0.0.1:4000/api/db-check -H "Origin: https://prompt-draft.ir"
```

Require:

```text
HTTP 200
Access-Control-Allow-Origin: https://prompt-draft.ir
```

Frontend health:

```powershell
curl.exe -sS -D - -o NUL http://127.0.0.1:3000/guide
```

Require:

```text
HTTP 200
X-Robots-Tag noindex header ABSENT
```

Production canonical check from loopback SSR:

```powershell
curl.exe -sS http://127.0.0.1:3000/blog | Select-String -Pattern "https://prompt-draft.ir"
```

Require at least the expected production canonical/absolute URL evidence and no `grassic.ir` canonical output.

### Step 5 — switch production API ingress

Using the already accepted remote-managed Tunnel, configure:

```text
api.prompt-draft.ir -> http://api:4000
```

If Cloudflare reports a conflicting existing DNS record, replace it only after the exact old record has been captured in the external production snapshot.

Verify immediately:

```powershell
curl.exe -sS -D - -o NUL https://api.prompt-draft.ir/api/db-check -H "Origin: https://prompt-draft.ir"
```

Require:

```text
HTTP 200
Access-Control-Allow-Origin: https://prompt-draft.ir
```

### Step 6 — switch production frontend ingress

Configure the accepted Tunnel public hostname:

```text
prompt-draft.ir -> http://frontend:3000
```

Replace the previous production DNS/origin record only using the captured external snapshot as the rollback reference.

Do not attach the staging fallback Worker to production.

### Step 7 — immediate production verification

Frontend/indexability:

```powershell
curl.exe -sS -D - -o NUL https://prompt-draft.ir/
curl.exe -sS -D - -o NUL https://prompt-draft.ir/blog
curl.exe -sS -D - -o NUL https://prompt-draft.ir/discover/portrait-photography
```

Require:

```text
HTTP 200
X-Robots-Tag noindex ABSENT
normal Nuxt/Nitro application response
```

Discovery route `portrait-photography` is branch-defined and safe as a representative canonical route.

Discovery/search files:

```powershell
curl.exe -sS -D - -o NUL https://prompt-draft.ir/robots.txt
curl.exe -sS -D - -o NUL https://prompt-draft.ir/sitemap.xml
curl.exe -sS -D - -o NUL https://prompt-draft.ir/llms.txt
```

Require HTTP 200 and production-host URLs where applicable.

SSR safety spot-check:

```powershell
curl.exe -sS https://prompt-draft.ir/blog | Select-String -Pattern "api:4000|localhost:4000|grassic.ir"
```

Require no Docker-internal origin and no staging canonical leakage.

### Step 8 — browser smoke

Verify through `https://prompt-draft.ir`:

```text
homepage loads
public Prompt renders
public Creator renders
Blog index renders
at least one current published Blog Article renders
Discovery category renders
login works
protected Prompt opens
copy/unlock behavior works
browser API traffic targets https://api.prompt-draft.ir
no private Prompt/Draft/account fields appear in public SSR/network payloads
```

Use a currently published Prompt/Creator/Blog route from production sitemap/inventory rather than hardcoding a potentially stale editorial slug into this runbook.

### Step 9 — measurement smoke

After generating a small controlled set of actions, verify the admin API as an authorized admin:

```text
GET /api/admin/growth/summary?days=7
```

Confirm the `launchFunnel` object is present and acquisition events increment plausibly. Confirm completed unlock and Goin spend remain consistent with transactional records rather than client event counts.

### Step 10 — retire remaining staging ingress

After production is stable:

```text
retire api.grassic.ir Tunnel public hostname unless deliberately retained
retire grassic.ir staging Worker route if staging is no longer needed
remove obsolete staging DNS records only after production verification
```

Do not leave `grassic.ir` serving the same indexable frontend container after production noindex is disabled.

---

## 9. Cutover abort / rollback triggers

Rollback immediately if any of the following occurs and is not explained by a transient single request:

```text
production frontend persistent 5xx / Tunnel 1033/530
production API persistent 5xx
production CORS does not allow https://prompt-draft.ir
browser still targets staging/localhost/Docker-internal API
production returns X-Robots-Tag noindex
canonical/hreflang point at staging or wrong host
robots/sitemap/llms fail materially
login/auth fails
protected Prompt unlock/copy fails materially
public surface exposes protected/private data
grassic.ir serves the production-indexable frontend after noindex=false
Cloudflare cache behavior serves API responses through an unsafe cache path
```

Do not debug indefinitely on live production when the previous stable route can be restored.

---

## 10. Exact rollback order

### Step R1 — restore old production Cloudflare/DNS targets first

Restore the captured values for:

```text
prompt-draft.ir
api.prompt-draft.ir
www.prompt-draft.ir if applicable
```

This returns users to the pre-cutover stable production deployment before changing the new local runtime back to staging mode.

### Step R2 — restore private `.env`

From the backup path created in Section 7:

```powershell
Copy-Item <FULL_PATH_TO_SAVED_ENV> .env -Force
```

Verify the restored non-secret direction is the previous staging contract:

```text
NUXT_PUBLIC_API_BASE=https://api.grassic.ir
NUXT_PUBLIC_SITE_URL=https://grassic.ir
NUXT_PUBLIC_NOINDEX=true
CORS_ORIGINS includes https://grassic.ir
```

### Step R3 — recreate API/frontend with restored environment, no rebuild

```powershell
pnpm api:recreate
pnpm api:status
pnpm frontend:recreate
pnpm frontend:status
```

### Step R4 — restore staging Tunnel hostnames only after noindex=true is active

Restore:

```text
grassic.ir -> http://frontend:3000
api.grassic.ir -> http://api:4000
```

Restore the staging Worker route `grassic.ir/*` if it was removed and staging is being returned to the previously accepted topology.

### Step R5 — post-rollback verification

```powershell
curl.exe -sS -D - -o NUL https://grassic.ir/
curl.exe -sS -D - -o NUL https://api.grassic.ir/api/db-check -H "Origin: https://grassic.ir"
```

Require:

```text
grassic.ir normal application 200
X-Robots-Tag: noindex, nofollow, noarchive
api.grassic.ir HTTP 200
Access-Control-Allow-Origin: https://grassic.ir
```

Then verify the restored old production target independently using the external production snapshot.

### Rollback data rule

Do not roll back Postgres data solely because ingress/env cutover is rolled back. This runbook performs no data migration or schema change, and users may have created valid data during the cutover window.

---

## 11. Post-cutover Search Console handoff

Only after production runtime/indexability verification passes:

```text
confirm/create the intended prompt-draft.ir Search Console property
confirm ownership verification
submit https://prompt-draft.ir/sitemap.xml
inspect representative Prompt/Creator/Blog/Discovery canonical URLs
capture indexing baseline
monitor impressions/clicks separately from internal product engagement
```

Do not submit the staging sitemap as the production property.

---

## 12. Readiness gates still open

This runbook is operationally complete from the repository side, but production execution remains blocked until:

```text
Phase 5.2 focused local/runtime verification passes
external current-production DNS/origin snapshot is recorded
production Search Console property/ownership plan is explicit
www.prompt-draft.ir policy is confirmed
founder selects the exact cutover SHA
founder explicitly approves production cutover
```

Until then:

```text
prompt-draft.ir -> untouched
api.prompt-draft.ir -> untouched
production Cloudflare routes -> untouched
staging NUXT_PUBLIC_NOINDEX=true -> keep
```