# Milestone 21.5 — Rendering & Organic Acquisition Foundation

Status: **IN PROGRESS / PHASES 1–4 DONE + ACCEPTED / PHASE 5 NEXT**

Date: 2026-09-11

Branch:

```text
feature/growth-foundation
```

Position in roadmap:

```text
Milestone 21 — Growth Foundation                 DONE
Milestone 21.5 — Rendering & Organic Acquisition IN PROGRESS
Phase 2 — Domain Expansion                       AFTER 21.5 IMPLEMENTATION
```

Domain Expansion research may proceed in parallel with Milestone 21.5. Its implementation must still begin only after the required domain research and semantic modeling are sufficiently mature.

Current implementation sources:

```text
docs/strategy/ADR_002_HYBRID_RENDERING_STRATEGY.md
docs/strategy/MILESTONE_21_5_PHASE1_HYBRID_SSR.md
docs/strategy/MILESTONE_21_5_PHASE2_DOCKER_RUNTIME.md
docs/strategy/MILESTONE_21_5_PHASE3_CLOUDFLARE_PRODUCTION_PATH.md
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
docs/strategy/STATUS.md
```

---

## 1. Why this milestone exists

Milestone 21 established the Growth Foundation and proved that Prompt Draft now has behavioral analytics, referral activation, preference-driven discovery, public discovery/SEO primitives, an internal economy and Growth metrics.

Milestone 21D intentionally retained:

```text
ssr: false
pnpm generate
static frontend
independent Node API
```

and used targeted post-generate SEO snapshots for six controlled `/discover/*` routes. That was the correct decision while SSR demand was still speculative.

Milestone 21.5 revisits rendering because the product now has concrete acquisition needs:

```text
existing public discovery content
planned Blog acquisition surface
growing public dynamic route needs
internal Growth analytics for measuring acquisition
planned Google Search Console evidence
real Cloudflare deployment path
Domain Expansion research that should not be rushed
```

This milestone is not a rewrite. It creates a measurable organic-acquisition platform while founder research for Content Creation proceeds in parallel.

---

## 2. Core rendering decision

Do **not** define success as "make the entire application SSR".

Selected direction:

```text
public / dynamic / SEO-sensitive acquisition surfaces
  -> SSR / prerender / hybrid according to route semantics

interaction-heavy authenticated/product-workspace surfaces
  -> client-rendered where SSR adds no meaningful value
```

ADR-002 records the selected hybrid strategy.

Current baseline:

```text
ssr: true
routeRules with explicit ssr:false for client-heavy routes
```

First SSR/default surfaces:

```text
/
/guide
/discover/**
```

Current explicit client-only surfaces:

```text
/create
/collage
/vectorizer
/history
/dashboard
/login
/manage
/manage/**
/wizard
/wizard/**
/prompts
/user
```

`/user` remains the signed-in personal/account surface. It is not the canonical public SEO profile URL.

Public Prompt and Creator canonical routing belongs to Phase 4.

---

## 3. Phase 1 — Hybrid / SSR Architecture

Status:

```text
DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE1_HYBRID_SSR.md
```

Accepted work:

```text
audited current Nuxt rendering assumptions
audited obvious browser/client-only boundaries
classified route families
selected hybrid route policy
enabled SSR as the default rendering mode
preserved interaction-heavy routes with ssr:false route rules
moved /discover/[slug] data loading from onMounted to SSR-aware useAsyncData
preserved sanitized /api/discover as the only discovery SSR data source
retained old static SEO snapshot path temporarily for rollback/history
created ADR-002
founder-local pnpm build + pnpm preview passed
SSR/public/client/auth smoke passed
```

Phase 1 is closed.

---

## 4. Phase 2 — Docker Production Runtime

Status:

```text
DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED
```

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE2_DOCKER_RUNTIME.md
```

Accepted runtime shape:

```text
browser
  -> http://localhost:3000
  -> production Nuxt/Nitro frontend container

Nuxt/Nitro SSR
  -> http://api:4000
  -> API over Compose network

browser client requests
  -> http://localhost:4000

API
  -> db:5432
  -> translator:5000
```

Accepted work:

```text
production multi-stage frontend Dockerfile
long-lived Nitro Node runtime
frontend service added to compose.yaml
private NUXT_API_BASE_INTERNAL runtime config
public NUXT_PUBLIC_API_BASE retained for browser requests
usePublicDiscovery selects internal origin during SSR
frontend/API/db/translator health checks
restart policy
service dependency health gates
stack lifecycle pnpm commands
Docker build-context secret/output exclusions
local environment contract documentation
builder-only 4 GB Node heap for Nuxt SSR bundle
pnpm BuildKit store cache + network retry/timeout hardening
Corepack package-manager integrity correction
```

Founder-local verification passed:

```text
production Docker build
Nuxt client + SSR server build
all four services healthy
public SSR route smoke
raw discovery HTML fetch
browser API origin verified as http://localhost:4000
GET /api/auth/me -> 200 in browser network
regular + super-admin auth/application smoke
full stack rebuild/recreate via pnpm stack:restart
post-restart recovery to healthy state
```

Phase 2 is closed. The accepted Docker runtime is the baseline for Phase 3.

---

## 5. Phase 3 — Cloudflare Production Path

Status: **DONE / FOUNDER-PRODUCTION-LIKE VERIFIED / ACCEPTED**

Canonical record:

```text
docs/strategy/MILESTONE_21_5_PHASE3_CLOUDFLARE_PRODUCTION_PATH.md
```

Goal achieved:

```text
prove the real international-internet production path through Cloudflare
without disturbing the stable prompt-draft.ir deployment
```

Accepted production-like staging path:

```text
https://grassic.ir
  -> Cloudflare edge
  -> fallback Worker
  -> Cloudflare Tunnel
  -> frontend:3000

https://api.grassic.ir
  -> Cloudflare edge
  -> Cloudflare Tunnel
  -> api:4000
```

Verified and accepted:

```text
real Cloudflare-authoritative staging zone
Cloudflare Tunnel Compose overlay
loopback-only host binds for frontend/API
browser API origin -> https://api.grassic.ir
Nuxt SSR internal API origin -> http://api:4000
Bearer auth/CORS compatibility
public HTTPS frontend and API
request-time SSR over the public path
no tested Docker-internal hostname leakage in SSR HTML
staging X-Robots-Tag noindex hardening
HTTP/2 cloudflared transport for the current network
full stack restart/recovery
branded Cloudflare Worker fallback when cloudflared is stopped
Worker route grassic.ir/* with Fail open
stable-version link to https://prompt-draft.ir/
active Cloudflare API cache bypass for api.grassic.ir
```

Founder outage testing intentionally stopped `cloudflared`; the Worker returned the branded HTTP 503 fallback and the site automatically returned to HTTP 200 after the Tunnel was restarted.

The verified network split remains:

```text
Nuxt SSR -> private/internal http://api:4000
browser   -> public HTTPS https://api.grassic.ir during staging
```

A later production cutover to `prompt-draft.ir` is now primarily a controlled hostname/configuration migration rather than an unproven runtime architecture change.

Iran/international-disconnection failover remains a separate resilience concern and is not part of the accepted Phase 3 scope.

Phase 3 is closed.

---

## 6. Phase 4 — SEO Platform & Public Content Architecture

Status: **DONE / FOUNDER-LOCAL VERIFIED / ACCEPTED 2026-09-11**

Canonical Phase 4 record:

```text
docs/strategy/MILESTONE_21_5_PHASE4_SEO_PUBLIC_CONTENT.md
```

Goal achieved:

```text
replace tactical SPA SEO workarounds with native rendering where appropriate and establish reusable public-content SEO primitives
```

Completed execution slices:

```text
21.5.4A — SEO Contracts & Route Semantics                         DONE / ACCEPTED
21.5.4B — Public Prompt Architecture                              DONE / ACCEPTED
21.5.4C — Public Creator Architecture + Indexability Policy       DONE / ACCEPTED
21.5.4D — Sitemap / Robots / Discovery Migration + AI Discovery   DONE / ACCEPTED
21.5.4E — Blog V1                                                 DONE / ACCEPTED
21.5.4F — SEO Integration / Verification / Legacy Retirement      DONE / ACCEPTED
```

Accepted Phase 4 architecture includes:

```text
public Prompt canonical route -> /prompt/:id
public Creator canonical route -> /creator/:username
/user remains private/account-oriented and non-canonical for Creator SEO
Creator thin/new/incomplete pages may remain accessible but noindex
nonexistent/removed/moderation-prohibited Creator state -> unavailable/404 semantics
Creator eligibility is shared and server-authoritative
English/default locale -> unprefixed URL
Persian -> /fa prefix
both EN/FA may be indexable only when authoritative localized content exists
self-canonical localized URLs + reciprocal language alternates
Blog V1 -> repository-backed editorial content, not a database CMS
/manage/blog -> canonical Git-backed authoring workflow
Git repository -> canonical editorial source
Arvan Object Storage -> Blog media + explicit optional emergency role
Docker/Nitro deployed content -> normal request-time Blog source
Blog images -> existing/shared Arvan media upload pipeline; no base64 in Markdown
shared Blog-aware public inventory -> sitemap.xml + llms.txt
native Discovery SSR/prerender -> visible Discovery SEO/JSON-LD authority
```

Security boundary remains absolute:

```text
SSR must not make protected Prompt bodies public
SSR must not expose email, balance, sessions, permissions or private Drafts
SSR must not bypass account/email authorization
public SEO projections expose only intentionally public information
```

Phase 4F completed the retirement/integration audit. Accepted compatibility paths were retained when still required, obsolete pre-Blog/legacy Discovery verification code was retired only after replacement coverage passed, branch/runtime API drift was repaired, and duplicate Nuxt auto-import ownership was removed while preserving the accepted prompt-compiler Core/Pure/runtime architecture.

Final Phase 4 acceptance evidence on 2026-09-11 included:

```text
pnpm test:public-creator-web -> PASS 20/20
pnpm test:phase9-regression  -> PASS 9/9
pnpm frontend                -> PASS
pnpm verify:phase4f-static   -> PASS
sitemap URLs                 -> 224
llms URLs                    -> 224
Nuxt prerendered routes      -> 341
native Discovery HTML        -> 12 checked
```

The final frontend/static build contained none of the previously reported duplicate-import warnings for `toAbsolutePublicUrl`, `normalizePublicSiteUrl` or `compilePromptOutput`.

No production cutover was part of Phase 4. Staging remains `NUXT_PUBLIC_NOINDEX=true`; `prompt-draft.ir` remains untouched until explicit Phase 5 rollout.

Phase 4 is closed.

---

## 7. Phase 5 — Organic Acquisition Launch & Measurement

Status: **NEXT / NOT STARTED**

Goal:

```text
turn rendering/SEO work into a measurable acquisition experiment
```

Required work:

```text
production cutover + rollback procedure
Google Search Console setup
sitemap submission/indexing inspection
first Blog content batch
analytics for Blog/public acquisition surfaces
organic landing/referrer analysis where privacy-appropriate
links from organic content into useful Prompt Draft surfaces
baseline + post-launch measurement cadence
```

External acquisition evidence:

```text
Google Search Console
```

Internal behavioral evidence:

```text
Prompt Draft product analytics / Growth metrics
```

Do not confuse search impressions/clicks with product engagement, and do not label measured acquisition-surface users as whole-product DAU/MAU without sufficient instrumentation.

Phase 5 must begin with a controlled launch plan. Staging remains globally noindex until the explicit production cutover step, and `prompt-draft.ir` must not be changed before the founder explicitly approves that rollout.

---

## 8. Blog V1 scope

Blog is part of the acquisition platform but must not become a premature CMS project.

Minimum useful V1:

```text
/blog index
/blog/<slug> detail
stable slug
server-rendered article HTML
per-post title/description/canonical/OG
published/updated date
author attribution when authoritative
Article/BlogPosting structured data where real
sitemap inclusion
responsive EN/FA-compatible presentation
analytics for article view and meaningful product action
```

Accepted V1 storage/authoring direction:

```text
repository-backed Article + Localization contract
admin-friendly /manage/blog Markdown authoring
Git canonical source
Arvan mirror + emergency pending-publication path
normal request-time serving from deployed/local Nuxt/Nitro content
existing Arvan media pipeline for article images
```

The repository contract must be structured so a later database/CMS migration changes storage, not public article semantics.

---

## 9. Domain Expansion relationship

Phase 2 — Domain Expansion remains the next major strategic roadmap phase after Milestone 21.5.

First domain:

```text
Content Creation
```

Required sequence remains:

```text
research domain
  -> identify semantic components
  -> define independent modules
  -> define wiring / compile semantics
  -> build domain generator
  -> test real user value
```

Founder research may run in parallel with 21.5 engineering. Do not use Milestone 21.5 to skip or abbreviate the research requirement.

---

## 10. Non-goals

Milestone 21.5 does not include:

```text
full Domain Expansion implementation
Programming domain implementation
Marketplace activation
Creator commerce
payments/payout
AI enhancement
full CMS
multi-Creator ownership
public exposure of protected Prompt bodies
forcing the whole application into SSR
Iran-disconnection failover as a prerequisite for Cloudflare rollout
```

---

## 11. Implementation discipline

Each phase follows:

```text
plan/audit
  -> implementation
  -> local verification
  -> founder acceptance
  -> checkpoint
  -> next phase
```

No phase is DONE because code merely exists.

Current next action:

```text
Begin Phase 5 — Organic Acquisition Launch & Measurement:
  -> audit current production/staging hostname + noindex configuration
  -> define explicit production cutover and rollback procedure before changing prompt-draft.ir
  -> define Google Search Console property/verification + sitemap submission plan
  -> establish pre-launch indexing/acquisition measurement baseline
  -> prepare the first production Blog/acquisition content batch and internal links
  -> verify acquisition-surface analytics and privacy-appropriate referrer/landing evidence
  -> only then execute the founder-approved production cutover and begin measurement cadence
```