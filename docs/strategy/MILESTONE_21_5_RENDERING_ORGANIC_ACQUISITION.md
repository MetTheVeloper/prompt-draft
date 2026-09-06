# Milestone 21.5 — Rendering & Organic Acquisition Foundation

Status: **IN PROGRESS / PHASE 1 IMPLEMENTED / AWAITING FOUNDER-LOCAL VERIFICATION**

Date: 2026-09-06

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

ADR-002 now records the selected hybrid strategy.

Phase 1 baseline:

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

`/prompts` and `/user` are public today, but their query-parameter contracts are not selected as final canonical acquisition URLs. Public Prompt and Creator canonical routing belongs to Phase 4.

---

## 3. Phase 1 — Hybrid / SSR Architecture

Status:

```text
IMPLEMENTED / AWAITING FOUNDER-LOCAL VERIFICATION
```

Canonical implementation record:

```text
docs/strategy/MILESTONE_21_5_PHASE1_HYBRID_SSR.md
```

Implemented work:

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
```

Important runtime consequence:

```text
hybrid request-time behavior requires Nuxt/Nitro server runtime
```

Therefore Phase 1 acceptance uses:

```powershell
pnpm build
pnpm preview
```

and not `pnpm generate`.

Phase 1 acceptance gate:

```text
production-style Nuxt build -> PASS
SSR server starts -> PASS
raw /discover HTML contains meaningful route-specific content before JS -> PASS
sanitized discovery rows are present when API has data -> PASS
all six discovery routes hydrate correctly -> PASS
/, /guide smoke correctly -> PASS
client-only application routes still work -> PASS
no protected Prompt data appears in public SSR HTML -> PASS
```

Do not begin Phase 2 until founder-local verification is accepted.

---

## 4. Phase 2 — Docker Production Runtime

Status: **NOT STARTED**

Goal:

```text
run the selected Nuxt/Nitro server and the existing independent Node API as production-like Docker services
```

Required work:

```text
frontend production Docker target
long-lived Nuxt/Nitro service
independent API service retained
internal Docker networking
server-internal API origin vs browser-public API origin contract
health checks / restart behavior
environment variable contract
static asset and public media verification
```

Expected shape:

```text
browser
  -> frontend public origin

Nuxt SSR container
  -> internal API service over Docker network for server-side data

browser client requests
  -> public API origin
```

Acceptance gate includes healthy frontend/API containers, internal SSR-to-API connectivity and smoke tests for login, create, manage and discovery.

---

## 5. Phase 3 — Cloudflare Production Path

Status: **NOT STARTED**

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

Required work includes frontend SSR origin connectivity, `api.prompt-draft.ir`, TLS, forwarded host/proto behavior, cookie/session correctness, cache policy and production smoke tests.

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

Security boundary remains absolute:

```text
SSR must not make protected Prompt bodies public
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
Founder-local verification of Phase 1 hybrid SSR implementation.
```
