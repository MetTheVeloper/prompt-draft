# ADR-002 — Hybrid Rendering Strategy

Status: **SELECTED / IMPLEMENTED IN PHASE 1 / AWAITING LOCAL VERIFICATION**

Date: 2026-09-06

Branch:

```text
feature/growth-foundation
```

Supersedes the future-direction portion of:

```text
docs/strategy/ADR_001_PUBLIC_RENDERING_STRATEGY.md
```

ADR-001 remains historically authoritative for Milestone 21D and its static-SPA decision.

Context:

```text
Milestone 21.5 — Rendering & Organic Acquisition Foundation
Phase 1 — Hybrid / SSR Architecture
```

---

## Decision

Prompt Draft selects **hybrid rendering** as the target frontend rendering architecture.

The application is no longer conceptually treated as one globally client-rendered SPA.

Instead:

```text
public acquisition / SEO-sensitive route
  -> server-rendered by default

interaction-heavy private/application route
  -> client-rendered when SSR adds no product or acquisition value
```

Nuxt configuration baseline:

```text
ssr: true
routeRules -> explicit ssr:false for selected client-heavy route families
```

This decision does not mean every public route is immediately declared a permanent SEO route. Route semantics and canonical URL contracts remain authoritative.

---

## Phase 1 route policy

### Server-rendered/default

```text
/
/guide
/discover/**
```

The six controlled `/discover/*` routes are the first dynamic SSR proof surface.

### Client-rendered by explicit route rule

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

`/prompts` and `/user` remain public product surfaces, but their current query-parameter contracts are not selected as final canonical acquisition URLs. Their future Prompt/Creator public route architecture belongs to the SEO platform phase.

---

## Discovery data decision

A route is not meaningfully SSR merely because Nuxt renders its shell on the server.

Therefore `/discover/[slug]` no longer waits for `onMounted()` to load its sanitized public collection.

It uses Nuxt server-aware async data so that the initial SSR request can obtain:

```text
GET /api/discover
```

and render intentionally public presentation data into HTML before browser JavaScript executes.

The security boundary from Milestone 21D is unchanged:

```text
Prompt body -> protected
Prompt variants -> protected
private Draft data -> protected
sanitized published presentation projection -> public
```

SSR must never be used as a reason to weaken backend authorization.

---

## Runtime implication

Hybrid rendering requires a server runtime for request-time behavior.

The correct production-style verification path is:

```text
pnpm build
pnpm preview
```

The previous static release command:

```text
pnpm generate
```

is retained temporarily as a compatibility/rollback artifact, but it is not the acceptance mechanism for hybrid rendering.

Production Node/Nitro packaging and Docker service topology are explicitly Phase 2 work.

---

## Why not full SSR everywhere

Global SSR without route classification would create risk without corresponding value on surfaces such as:

```text
/create
media/image tools
Manage workspace
Wizard interaction flows
other authenticated/editor-heavy application routes
```

These routes can remain client-oriented while public acquisition surfaces gain crawler-visible HTML and server metadata.

This is a deliberate product architecture choice, not merely a workaround for browser-only code.

---

## Why this now supersedes the old future direction

During Milestone 21D, keeping:

```text
ssr: false
pnpm generate
```

was correct because SSR demand was still speculative and targeted post-generation discovery snapshots solved the immediate SEO gap.

Milestone 21.5 has concrete triggers that ADR-001 anticipated:

```text
planned Blog acquisition surface
growing dynamic public routes
real Cloudflare production path
internal Growth analytics available for acquisition measurement
Search Console evidence planned
```

The rendering transition is therefore now tied to measurable product distribution, not infrastructure preference.

---

## Compatibility / rollback

Phase 1 intentionally does not delete the Milestone 21D post-generate SEO enrichment path.

Removal/reduction happens only after:

```text
Phase 1 local SSR verification
Phase 2 Docker runtime verification
Phase 3 Cloudflare production path verification
Phase 4 native SEO-platform verification
```

This preserves a clear rollback/history boundary during migration.

---

## Verification gate

ADR-002 moves from `AWAITING LOCAL VERIFICATION` to accepted implementation only when founder-local testing proves:

```text
pnpm build succeeds
Nuxt preview/server starts
/discover raw response contains meaningful server-rendered content
all six discovery routes hydrate without errors
/, /guide smoke correctly
client-only application routes retain expected behavior
no protected Prompt data appears in public SSR HTML
```

Canonical Phase 1 implementation record:

```text
docs/strategy/MILESTONE_21_5_PHASE1_HYBRID_SSR.md
```
