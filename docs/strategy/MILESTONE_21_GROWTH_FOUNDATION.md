# Milestone 21 — Growth Foundation

Status: **SELECTED / DESIGN BASELINE CREATED / IMPLEMENTATION NOT YET STARTED**

Branch:

```text
feature/growth-foundation
```

Branch baseline:

```text
3ef4b0c65777d6f2814744ed0a1fa8a78750a389
```

Inherited source branch:

```text
feature/docker-local-api
```

---

# 1. Purpose

Milestone 21 is the first commercialization/growth milestone after the completed Docker/backend Milestones 1–20.

It does **not** reopen the completed backend program and does not start the full Marketplace.

The purpose is to create measurable growth infrastructure around the existing mature product.

Primary question:

> Can Prompt Draft attract users, produce meaningful repeat usage and support a circulating internal incentive loop before full Marketplace/fiat commercialization?

---

# 2. Mandatory capability audit

Before implementation, the following source must be read:

```text
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```

Mandatory canonical references include:

```text
docs/backend/STATUS.md
docs/backend/README.md
docs/backend/IMPLEMENTATION.md
docs/backend/API_GUIDE.md
docs/backend/MANAGE_GUIDE.md
docs/backend/MILESTONE_15_SCORE_LEDGER.md
docs/backend/MILESTONE_16_REFERRAL_FOUNDATION.md
docs/backend/MILESTONE_17_PROMPT_ARCHIVE_PLATFORM.md
docs/backend/MILESTONE_19_PUBLIC_USER_PROFILES.md
docs/backend/MILESTONE_20_PROFILE_SHOWCASE_DRAFT_MEDIA_ARCHIVE_PROMOTION.md
```

Rule:

> classify every requested capability as existing, extension, or genuinely new before code.

---

# 3. Verified inherited foundations

## COMPLETE / reusable

```text
Auth/session
progressive username/email completion
roles + permission resolver
Manage shell
Manage Users/Dashboard/Archive
Cloud Draft ownership/sync
public/private Draft visibility
Draft media
Draft soft delete / anti-resurrection
public profiles by UUID/username
avatar + cover
Prompt Archive relational platform
Archive search/filter/pagination
Archive tags/media
Draft -> Archive provenance
admin audit log
Arvan storage adapter
Global Menu / Global Modal
static generate + independent Node API architecture
```

## FOUNDATION / reusable but incomplete

```text
XP append-only/idempotent ledger -> internal economy foundation
persisted username-based referrals -> referral growth foundation
/user public profile -> Creator identity foundation
Prompt Archive -> future product/catalog foundation
Draft -> Archive provenance -> lineage precedent
```

## NOT PRESENT / real gaps

```text
behavioral product analytics
spendable wallet/debit semantics
commercial Product/Order/License/Payment/Payout
Creator verification/storefront/payout
server-side share entity/counter/reward
full personalization/recommender
marketplace ratings/reviews
follow graph
full Content Graph
```

---

# 4. Phase 21A — Behavioral Analytics Foundation

Status: **PLANNED FIRST IMPLEMENTATION PHASE**

## Why first

Founder Year-1 KPIs require data that Prompt Draft does not currently persist as product analytics.

Current `user_score_events` answers “why did score change?”

Current `admin_audit_log` answers “what privileged admin mutation occurred?”

Neither is a general behavioral analytics system.

## Design requirements

Before schema implementation, define:

- event taxonomy;
- anonymous vs authenticated identity semantics;
- session/device strategy if needed;
- event idempotency/deduplication policy;
- event payload boundaries;
- retention/privacy policy;
- aggregation/query needs;
- write-volume expectations.

## Initial event candidates

Only high-value events should ship first.

Candidates:

```text
archive/prompt public detail view
first prompt copy/unlock
repeat prompt copy after access
copy page link/share intent
wizard start
wizard complete
Draft created
Draft returned/opened
referral link landing
referral signup success
onboarding/preferences complete
```

Exact names and payloads must be fixed in the 21A implementation design.

## Data principle

Product analytics should support anonymous/aggregate platform intelligence without leaking Creator sellable knowledge unnecessarily.

---

# 5. Phase 21B — Referral Growth Activation

Status: **PLANNED**

Reuse Milestone 16.

Current relation already provides:

```text
username referral input
UUID-based authoritative relation
one referrer per referred user
self-referral prevention
active-referrer check
atomic relation + reward events
referredCount read model
```

Real Growth gaps may include:

```text
shareable referral URL
registration prefill from URL
simple referral CTA/copy UX
referral landing/conversion analytics
campaign policy abstraction only if required
stronger anti-abuse only as evidence requires
```

Do not generate a second referral identity/code system by default.

---

# 6. Phase 21C — User Preferences & Personalized Discovery

Status: **PLANNED**

## Goal

Move the homepage from static/general toward intent-aware discovery.

## Initial scope

Start with explicit preferences rather than a complex recommender.

Potential preference taxonomy:

```text
Image / Visual Creation
Content Creation
Programming
Education
Marketing / Advertising
```

Only currently useful categories should be surfaced; future-domain choices must not create dead-end UI promises before those domains exist.

## Later signals

After analytics/Marketplace/community exist:

- content usage;
- copy/remix behavior;
- followed Creators;
- related categories;
- purchase behavior.

---

# 7. Phase 21D — Public Discovery & SEO Foundation

Status: **PLANNED**

## Current invariant

```text
ssr: false
pnpm generate
static frontend
independent Node API
```

Do not break this invariant in 21D without an explicit rendering ADR decision.

## Goals

- canonical public URL review;
- metadata/open-graph foundation;
- sitemap/indexing review;
- structured data where appropriate;
- useful category/discovery landing surfaces;
- improve public Prompt Archive content for organic acquisition;
- prepare Creator/Product URL conventions without building full Marketplace.

## Rendering ADR

Create a decision record comparing the current static system with future:

- prerender-at-build;
- incremental regeneration;
- SSR;
- hybrid rendering.

The ADR should define observable triggers for migration (page volume, freshness, SEO needs, build duration, dynamic Creator publishing), not migrate because “marketplaces usually use SSR.”

---

# 8. Phase 21E — Internal Economy Simulation

Status: **PLANNED AFTER ANALYTICS DESIGN**

## Existing foundation

`user_score_events` is append-only and idempotent and accepts negative non-zero points at schema level.

Existing events include:

- account creation;
- email addition;
- Cloud Draft creation;
- referral joined;
- referral reward.

## Required product decisions before code

- rename/evolve XP semantics into internal unit or introduce compatible read model;
- debit/spend transaction semantics;
- atomic no-overspend rule;
- balance projection;
- event reason/source contract;
- user-facing transaction history needs;
- unlock/access state;
- economy analytics;
- inflation/farming controls;
- separation of spendable balance from Creator reputation.

## Experiment principle

First phase is virtual circulation only.

No requirement for:

- fiat purchase;
- cash-out;
- payout provider;
- investment/token promise.

Potential first sinks should use existing product surfaces and must not require building the full Marketplace.

---

# 9. Phase 21F — Growth Metrics in Manage

Status: **PLANNED AFTER 21A**

Extend current Manage architecture.

Do not build another dashboard shell.

Possible metrics once persisted:

- active/returning users;
- prompt views/copies/shares;
- referral landing/signup conversion;
- Wizard completion;
- internal units earned/spent;
- economy circulation;
- popular content categories.

Objective: produce decision-quality evidence for accelerator/investor/product choices.

---

# 10. Explicitly out of Milestone 21

```text
full Prompt/Template/Workflow commercial Product schema
Creator payout
fiat payments
subscriptions
full ownership-transfer commerce
marketplace order system
reviews/ratings marketplace
remix revenue sharing
multi-Creator ownership
Content Creation generator implementation
Programming generator implementation
AI assistant/model
dynamic AI Wizard
full social/follow graph
SSR migration
```

These concepts are documented so Milestone 21 can prepare compatible foundations, but they are not permission to expand scope.

---

# 11. Proposed implementation order

```text
21A1 analytics event contract + privacy/identity design
21A2 schema/API/event writer
21A3 first real UI event producers
21A4 read/verification queries

21B referral link/prefill + analytics

21C preference persistence/onboarding
21C personalized homepage first pass

21D SEO/public discovery improvements
21D rendering strategy ADR

21E economy semantic design
21E spendable ledger extension + balance/access primitive
21E controlled simulation experiment

21F Manage growth metrics
```

The order may be adjusted if capability audit reveals a simpler dependency path, but analytics should precede major growth/economy experiments.

---

# 12. Verification rules

Every implementation phase must verify:

- real UI behavior;
- backend persistence/read-back;
- correct anonymous/authenticated behavior where relevant;
- no duplicate/retry corruption;
- authorization boundaries;
- failure/recovery semantics;
- EN/FA copy parity when user-facing;
- no parallel architecture where an existing primitive should be extended;
- `pnpm generate` for frontend-affecting closure.

Phase status changes to `DONE` only after local verification and explicit user acceptance.

---

# 13. First coding gate

Before writing migration `020`, complete the Phase 21A event-contract design and inspect the concrete current API/frontend locations where the first analytics events will originate.

No schema should be created until the event identity/retention/write-volume contract is explicit.
