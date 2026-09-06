# Milestone 21.5 — Rendering & Organic Acquisition Foundation

Status: **IN PROGRESS / PHASES 1–2 DONE / PHASE 3 NEXT**

Date: 2026-09-07

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

Status: **NEXT / NOT STARTED**

Goal:

```text
prove the real international-internet production path through Cloudflare
```

Current milestone assumption:

```text
international internet available
Cloudflare connectivity available
Cloudflare is the primary production path
```

Required work includes frontend SSR origin connectivity, `api.prompt-draft.ir`, TLS, forwarded host/proto behavior, cookie/session correctness, production CORS, cache policy and production smoke tests.

The verified Phase 2 network split must be preserved:

```text
Nuxt SSR -> private/internal API origin
browser   -> public HTTPS API origin
```

Phase 3 must not serialize or expose Docker-internal service names to browser runtime configuration.

Iran/international-disconnection failover is not a prerequisite for this phase. The separately discussed Arvan/fallback architecture remains a later resilience layer and must not complicate the first verified Cloudflare SSR rollout.

---

## 6. Phase 4 — SEO Platform & Public Content Architecture

Status: **NOT STARTED**

Goal:

```text
replace tactical SPA SEO workarounds with native rendering where appropriate and establish reusable public-content SEO primitives
```

Required work:

```text
server-rendered route metadata
canonical URL contract
Open Graph/Twitter metadata
structured data only when authoritative
static + dynamic sitemap architecture
robots policy
public Prompt canonical route direction
public Creator canonical route direction
/discover/* cleanup from post-generate workaround
Blog route/content architecture
Blog metadata + sitemap
internal linking
404/redirect/canonical behavior
locale/indexing policy
```

### Creator public profile requirement

Accepted product direction:

```text
/user
  -> signed-in personal/account surface
  -> client-oriented/private product UX
  -> not the canonical indexable Creator page

/creator/:username
  -> future public Creator profile surface
  -> SSR/SEO-capable
  -> contains intentionally public creator/profile information and public publications only
```

A user becomes a candidate for search indexing when the account has meaningful public output such as public Drafts, future products or other intentionally published content.

However, having an account or a single trivial public item must **not** automatically guarantee indexability.

Phase 4 must define a deterministic Creator indexability/quality policy to prevent thin-content profile proliferation.

Candidate policy inputs may include:

```text
amount of meaningful public content
content completeness/substance
profile/public identity completeness
publication quality/visibility state
spam/abuse/moderation state
duplicate/low-value content signals
other evidence of a substantive public Creator surface
```

Exact thresholds and weighting are deliberately **TBD** until Phase 4 design discussion; do not hard-code arbitrary thresholds earlier.

Important architecture rule:

```text
Creator eligibility must be a shared server-authoritative policy,
not a one-off conditional implemented only in the Vue page.
```

The same eligibility result should drive, where appropriate:

```text
SSR robots/index metadata
sitemap inclusion/exclusion
canonical public Creator behavior
future search/discovery eligibility
```

If a public Creator page does not satisfy the accepted indexability policy, the default SEO behavior should be `noindex` and exclusion from indexable sitemap surfaces, while final accessibility/404 behavior is decided in Phase 4.

Security boundary remains absolute:

```text
SSR must not make protected Prompt bodies public
SSR must not expose email, balance, sessions, permissions or private Drafts
SSR must not bypass account/email authorization
public SEO projections expose only intentionally public information
```

The existing `scripts/generate-public-seo.ts` must be audited after the new runtime path is proven. Remove, reduce or retain only the parts still justified; do not keep duplicate SEO systems by inertia.

---

## 7. Phase 5 — Organic Acquisition Launch & Measurement

Status: **NOT STARTED**

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

Content storage should optimize for low operational complexity and later migration. Do not block the acquisition experiment on building a Creator-grade rich-text publishing system.

---

## 9. Domain Expansion relationship

Phase 2 — Domain Expansion remains the next major strategic roadmap phase.

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
Begin Phase 3 — Cloudflare Production Path.
```
