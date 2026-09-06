# Milestone 21.5 — Rendering & Organic Acquisition Foundation

Status: **APPROVED / PLANNED / NOT STARTED**

Date: 2026-09-06

Documentation branch:

```text
feature/growth-foundation
```

Position in roadmap:

```text
Milestone 21 — Growth Foundation                 DONE
Milestone 21.5 — Rendering & Organic Acquisition NEXT
Phase 2 — Domain Expansion                       AFTER 21.5 IMPLEMENTATION
```

Domain Expansion research may proceed in parallel with Milestone 21.5. Its implementation must still begin only after the required domain research and semantic modeling are sufficiently mature.

---

## 1. Why this milestone exists

Milestone 21 established the Growth Foundation and proved that Prompt Draft now has:

```text
behavioral analytics
referral activation
preference-driven discovery
public discovery/SEO primitives
internal economy
Growth metrics
```

Milestone 21D intentionally did not migrate the application to SSR. At that time the accepted release invariant remained:

```text
ssr: false
pnpm generate
static frontend
independent Node API
```

The targeted post-generate SEO snapshot solved the immediate crawler-visible-content gap for six controlled `/discover/*` routes without introducing speculative rendering infrastructure.

The product context has now changed enough to justify revisiting rendering deliberately rather than speculatively:

```text
public discovery content already exists
public dynamic acquisition routes are becoming more important
Blog content is planned as a real organic acquisition surface
Growth analytics now exists to measure acquisition behavior
Google Search Console can provide external indexing/search evidence
Domain Expansion requires founder research and should not be rushed
```

Therefore Milestone 21.5 creates a measurable organic-acquisition platform while founder research for Content Creation proceeds in parallel.

This is not a rewrite milestone.

---

## 2. Core strategic decision

Do **not** define success as "make the entire application SSR".

Define success as:

> Give public, dynamic and SEO-sensitive acquisition surfaces the correct server-rendering behavior, while keeping client-heavy authenticated/product-workspace surfaces client-oriented where SSR provides no meaningful benefit.

Target rendering direction:

```text
public acquisition surfaces
  -> SSR / prerender / hybrid according to route semantics

authenticated interactive application surfaces
  -> client-heavy where appropriate
```

Likely SSR/SEO-sensitive surfaces include:

```text
/
/discover/*
future /p/* public Prompt routes
future /creator/* public Creator routes
/blog
/blog/*
other future public landing/content pages
```

Likely client-heavy surfaces include:

```text
/create
/manage/*
authenticated editor/workspace flows
other interaction-dominant private routes
```

The exact route policy must be audited and documented during Phase 1 before global rendering configuration is changed.

---

## 3. Relationship to ADR-001

Historical rendering decision:

```text
docs/strategy/ADR_001_PUBLIC_RENDERING_STRATEGY.md
```

ADR-001 remains correct for Milestone 21D: full SSR was intentionally rejected because the need had not yet been proven and the static deployment invariant was working.

Milestone 21.5 is the explicit revisit point anticipated by that ADR.

New triggers now present:

```text
Blog is becoming a planned acquisition surface
public dynamic pages are expected to grow
SEO measurement can now be tied to internal Growth analytics
real production Cloudflare deployment can be tested
organic acquisition is an active product goal rather than hypothetical infrastructure
```

Phase 1 of 21.5 must either:

```text
update ADR-001
```

or create a successor rendering ADR that records the final hybrid/SSR decision.

Do not silently invalidate the previous ADR.

---

# 4. Five-phase execution plan

## Phase 1 — Hybrid / SSR Architecture

Goal:

```text
select the correct rendering mode per route class
prove Nuxt SSR compatibility locally
preserve application behavior
```

Required work:

```text
audit current nuxt.config.ts and generation assumptions
audit browser-only/client-only dependencies
classify public vs private route families
classify SEO-sensitive vs interaction-dominant routes
define SSR/prerender/client-only route policy
select Nuxt/Nitro production rendering mode
identify code relying on window/document/localStorage during server render
make required client guards or component boundaries
reconcile runtime config/API base behavior between server and browser
review i18n behavior under SSR
review authentication/session behavior under SSR
review PWA/offline assumptions that depended on static generation
create/update rendering ADR
```

Phase 1 verification gate:

```text
production-style local Nuxt build -> PASS
SSR server starts locally -> PASS
public route HTML contains meaningful route-specific content before JS -> PASS
critical private/client-heavy routes still function -> PASS
no hydration-breaking errors on accepted route set -> PASS
```

Do not proceed to deployment work until the local rendering model is stable.

---

## Phase 2 — Docker Production Runtime

Goal:

```text
run the selected Nuxt server/runtime and the existing Node API as production-like Docker services
```

Required work:

```text
add/adjust frontend production Docker target
run Nuxt/Nitro server as a long-lived service
preserve independent Node API service
configure internal Docker networking
separate server-internal API origin from browser-public API origin where necessary
add health checks
review restart policy
review environment variable contract
verify database/API dependencies
verify static assets and public media behavior
```

Expected internal shape, subject to Phase 1 audit:

```text
browser
  -> frontend public origin

Nuxt SSR container
  -> internal API service over Docker network when server rendering

browser client requests
  -> public API origin
```

Phase 2 verification gate:

```text
frontend container healthy -> PASS
API container healthy -> PASS
SSR request can reach API internally -> PASS
browser-side API calls reach public/dev-equivalent API path -> PASS
login/session smoke -> PASS
/create smoke -> PASS
/manage smoke -> PASS
/discover smoke -> PASS
```

---

## Phase 3 — Cloudflare Production Path

Goal:

```text
prove the real international-internet production path through Cloudflare before SEO launch
```

Current assumption for this milestone:

```text
international internet is available
Cloudflare connectivity is available
Cloudflare is the primary production path
```

Required work:

```text
connect frontend SSR origin to Cloudflare/Tunnel or selected Cloudflare origin path
connect api.prompt-draft.ir to the production API path
verify TLS and origin behavior
verify forwarded host/proto headers
verify canonical origin handling
verify cookies/session attributes across real HTTPS origins
review cache policy so personalized/private responses are not cached incorrectly
review public static asset caching
review API caching rules
verify WebSocket/stream behavior only if currently required
add production health/smoke procedure
```

Iran/international-disconnection failover is **not** the primary implementation target of this phase.

The separately discussed Arvan/fallback architecture remains a later resilience layer and must not complicate the first verified Cloudflare SSR rollout.

Phase 3 verification gate:

```text
real domain frontend request -> PASS
real domain SSR HTML -> PASS
api.prompt-draft.ir -> PASS
HTTPS/session/login -> PASS
critical authenticated route smoke -> PASS
critical public route smoke -> PASS
Cloudflare cache behavior -> PASS
origin restart/recovery smoke -> PASS
```

---

## Phase 4 — SEO Platform & Public Content Architecture

Goal:

```text
replace tactical SPA SEO workarounds with native rendering where the new architecture makes them unnecessary, and establish reusable public-content SEO primitives
```

Required work:

```text
route-specific server-rendered title/description
canonical URL contract
Open Graph/Twitter metadata
structured data only when authoritative
sitemap architecture for static + dynamic public routes
robots policy
public Prompt route direction
public Creator route direction
/discover/* migration from post-generate snapshot workaround where appropriate
Blog route architecture
Blog post metadata/content model
Blog sitemap integration
internal linking between Blog, Discovery, Prompt Archive and relevant product surfaces
404/redirect/canonical behavior
locale/indexing policy review
```

Important security/content boundary:

```text
SSR must not make protected Prompt bodies public
SSR must not bypass existing account/email authorization
SEO projection/public route models must expose only intentionally public information
```

The existing `scripts/generate-public-seo.ts` and targeted discovery snapshots must be audited after SSR/hybrid behavior is working.

Possible outcomes:

```text
remove obsolete snapshot logic
reduce it to static-only routes
retain only the portions still useful under hybrid rendering
```

Do not keep duplicate SEO systems merely because the old workaround already exists.

Phase 4 verification gate:

```text
view-source/curl receives meaningful public HTML without JS -> PASS
canonical/meta/OG fields correct on sampled routes -> PASS
structured data validation -> PASS
sitemap contains intended indexable surfaces only -> PASS
robots excludes intended private/workspace routes -> PASS
no protected Prompt body leakage -> PASS
Blog index/post route SEO smoke -> PASS
```

---

## Phase 5 — Organic Acquisition Launch & Measurement

Goal:

```text
turn the rendering/SEO work into a measurable acquisition experiment rather than stopping at infrastructure completion
```

Required work:

```text
production cutover
rollback procedure
Google Search Console property/setup
sitemap submission
indexing inspection
first Blog content batch
analytics instrumentation for Blog/public acquisition surfaces
source/referrer/landing analysis where privacy-appropriate
links from organic content into useful Prompt Draft product surfaces
Growth dashboard extension only for metrics backed by persisted data
baseline snapshot before/at launch
post-launch measurement cadence
```

Founder activity that can proceed in parallel with engineering:

```text
research Content Creation domain
build semantic notes for Domain Expansion
research organic-search topics
prepare Blog article briefs/drafts
identify queries where Prompt Draft can provide actual user value
```

Milestone 21.5 should create the distribution/measurement system; it should not force low-quality content production merely to populate a Blog.

Phase 5 verification gate:

```text
production smoke -> PASS
rollback tested or operationally proven -> PASS
Search Console sees property/sitemap -> PASS
sample public URLs inspectable/indexable -> PASS
organic landing events measurable internally -> PASS
first content batch published -> PASS
measurement baseline documented -> PASS
```

---

# 5. Blog scope for this milestone

Blog is part of the acquisition platform, but the milestone should avoid building a CMS/marketplace-sized authoring system prematurely.

Minimum useful Blog V1:

```text
/blog index
/blog/<slug> detail
stable slug
server-rendered article HTML
per-post title/description/canonical/OG
published/updated date
author attribution when authoritative
Article/BlogPosting structured data where fields are real
sitemap inclusion
internal links/tags/categories only if they improve navigation
responsive EN/FA-compatible presentation architecture
analytics for article view and meaningful product CTA/action
```

Content storage should be selected for low operational complexity and easy migration later.

Do not block the first acquisition experiment on building a full rich-text Creator publishing platform.

---

# 6. Measurement model

Milestone 21 introduced analytics, so 21.5 must use it.

Questions this milestone should make answerable:

```text
Which public landing pages receive real visits?
Which Blog posts attract users?
Which discovery categories attract users?
Do organic visitors continue into Prompt Archive/product use?
Which pages generate registration/referral/product actions?
What content is indexed but receives no engagement?
What content receives impressions but weak click-through?
```

External acquisition evidence:

```text
Google Search Console
```

Internal behavioral evidence:

```text
Prompt Draft product analytics / Growth metrics
```

Do not confuse Search Console impressions/clicks with product engagement, and do not call measured acquisition-surface users whole-product DAU/MAU unless instrumentation later supports that claim.

---

# 7. Non-goals

Milestone 21.5 does **not** include:

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
rewriting the entire application for SSR
Iran-disconnection failover implementation as a prerequisite for Cloudflare rollout
```

The Arvan/domain failover design remains a separate deployment-resilience concern and can be implemented after the primary Cloudflare production path is stable.

---

# 8. Domain Expansion relationship

Phase 2 — Domain Expansion remains the next major strategic roadmap phase.

Its first domain remains:

```text
Content Creation
```

Required Domain Expansion sequence remains:

```text
research domain
  -> identify semantic components
  -> define independent modules
  -> define wiring / compile semantics
  -> build domain generator
  -> test real user value
```

Milestone 21.5 intentionally gives the founder time to perform the research portion correctly while engineering work continues on a separate, already-evidenced acquisition need.

Do not use 21.5 as an excuse to skip or abbreviate Domain Expansion research.

---

# 9. Implementation discipline

Each phase must be independently documented, implemented and verified.

Preferred sequence:

```text
plan/audit
  -> implementation
  -> local verification
  -> founder acceptance
  -> checkpoint commit
  -> next phase
```

No phase should be marked DONE because code merely builds.

Verification documents should record:

```text
commands used
expected behavior
actual behavior
failures/fixes
known limitations
accepted deployment/runtime assumptions
```

Recommended phase docs as work begins:

```text
MILESTONE_21_5_PHASE_1_RENDERING.md
MILESTONE_21_5_PHASE_2_DOCKER_RUNTIME.md
MILESTONE_21_5_PHASE_3_CLOUDFLARE.md
MILESTONE_21_5_PHASE_4_SEO_BLOG.md
MILESTONE_21_5_PHASE_5_ACQUISITION_MEASUREMENT.md
```

Exact filenames may vary, but this file remains the milestone-level source of truth.

---

# 10. Start gate

Milestone 21.5 is approved to start.

First implementation action:

```text
Phase 1 — audit the current Nuxt/runtime/client-only assumptions and produce the route-level rendering policy before changing global SSR behavior.
```

Do not begin by simply changing:

```text
ssr: false -> true
```

The first step is architecture/capability audit, then the smallest correct rendering transition.
