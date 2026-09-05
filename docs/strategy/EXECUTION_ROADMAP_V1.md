# Prompt Draft — Execution Roadmap V1

Status: **Founder-approved ordering; milestone scopes may refine after capability audit**

---

# 1. Operating principle

Prompt Draft has already completed a large technical-core program.

The next roadmap must not behave like a greenfield rewrite.

For every feature:

```text
Desired behavior
  -> audit existing capability
  -> classify gap
       extension
       or genuinely new primitive
  -> reuse existing architecture when semantics match
  -> implement only the gap
  -> verify real behavior
```

Mandatory capability source:

```text
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```

---

# 2. Approved strategic order

```text
Phase 1 — Growth Foundation
Phase 2 — Domain Expansion
Phase 3 — Marketplace Activation
Phase 4 — AI Enhancement
```

This order intentionally postpones full marketplace complexity until user behavior/growth evidence improves the design.

---

# Phase 1 — Growth Foundation

Primary branch:

```text
feature/growth-foundation
```

First selected program milestone:

```text
Milestone 21 — Growth Foundation
```

## Goal

Turn the existing technically mature product into a measurable growth system.

The core questions are:

- Can Prompt Draft attract users organically/referrally?
- Do users extract meaningful value?
- Do they return?
- Which public content attracts discovery?
- Can an internal reward/spend loop circulate before fiat monetization?
- Which behavior should inform future Marketplace design?

## Existing foundations to activate

Do not rebuild:

- Auth/session;
- roles/permissions;
- Manage shell;
- public profiles;
- avatar/cover;
- Cloud Draft ownership/sync;
- Draft media/soft delete;
- XP ledger;
- persisted referral relationship;
- Prompt Archive/search/tags/media;
- Draft -> Archive provenance;
- admin audit;
- Arvan storage adapter.

## Workstreams

### 21A — Behavioral Analytics Foundation

Genuinely missing primitive: product-behavior analytics.

The current `admin_audit_log` and `user_score_events` are not substitutes.

Build a dedicated event contract and persistence/read model for product analytics.

Initial high-value events should focus on founder KPIs and avoid tracking noise:

```text
public content/product view
prompt first copy/unlock
prompt repeat copy
copy page link/share intent
remix start/complete when available
wizard start/complete
draft create/return where analytically useful
referral landing/signup conversion
preference/onboarding completion
```

Exact event taxonomy is designed during 21A and documented before schema code.

### 21B — Referral Growth Activation

Reuse existing username-based referral relation and atomic rewards.

Potential gaps:

- shareable referral URL;
- URL prefill into registration;
- referral call-to-action surfaces;
- referral analytics;
- campaign/reward policy abstraction only if needed;
- minimum anti-abuse measures appropriate for the experiment.

Do not create a second referral-code identity unless product requirements later justify it.

### 21C — User Preference & Personalization Foundation

Add explicit user interests/preferences and use them to shape discovery.

Initial version should be simple and observable.

Possible signals:

- selected domains/interests;
- existing usage behavior;
- later creator follows and marketplace behavior.

The first personalized homepage should prioritize proving usefulness rather than building a complex recommender.

### 21D — Public Discovery & SEO Foundation

Improve public content discoverability while preserving the current static-release invariant.

Work may include:

- canonical public URL strategy;
- metadata architecture;
- sitemap/robots review;
- structured data where useful;
- category/content landing surfaces;
- public-page content quality;
- indexing strategy for Prompt Archive and future Creator/Product pages.

Also produce a formal rendering ADR for future scale:

```text
current: ssr:false + pnpm generate + independent Node API
future candidates: prerender / incremental / SSR / hybrid
```

Do **not** migrate to SSR merely as speculative infrastructure.

### 21E — Internal Economy Simulation Foundation

Reuse the existing idempotent XP ledger rather than building a parallel reward ledger.

Required design/extension areas:

- internal-unit semantics;
- spend/debit events;
- spendable balance read model;
- non-negative balance/transaction atomicity policy;
- durable access/unlock state where needed;
- reward/sink analytics;
- UI language transition away from XP when approved;
- separation of spendable economy from Creator reputation/level.

The initial economy is a simulation. No fiat purchase, payout or real-money conversion is required in Milestone 21 unless separately approved.

### 21F — Growth/Accelerator Metrics Surface

Extend the existing Manage workspace rather than creating another analytics admin shell.

Once real product analytics exists, surface a compact decision dashboard for metrics such as:

- active users;
- referral conversion;
- public-content usage;
- copy/share activity;
- internal units issued/spent;
- repeat behavior;
- Creator/Product metrics once those primitives exist.

Only show metrics backed by persisted data.

---

# Phase 2 — Domain Expansion

Goal: prove that the Semantic Prompt Engine is a reusable domain framework, not an image-only architecture.

Current priority hypothesis:

```text
1. Content Creation
2. Programming
3. Education
4. Marketing / Advertising
```

Each domain must begin with domain research and semantic modeling, not UI cloning.

Required sequence:

```text
research domain
  -> identify semantic components
  -> define independent modules
  -> define wiring/compile semantics
  -> build domain generator
  -> test real user value
```

Do not build all four domains simultaneously.

Start with Content Creation, validate architecture, then Programming.

---

# Phase 3 — Marketplace Activation

Goal: convert real user/content behavior into a Creator marketplace.

Major workstreams:

## Creator identity expansion

Extend current `/user` foundation with marketplace-specific identity such as:

- bio/expertise;
- portfolio/catalog;
- creator status/verification;
- reputation/level;
- follow graph;
- creator analytics.

## Product model

Implement first-class:

```text
Prompt
Template
Workflow
```

Use `MARKETPLACE_PRODUCT_MODEL.md`.

## Publishing

Creator authoring/publishing should support:

- product type;
- category;
- media/evidence;
- usage instructions;
- pricing mode;
- permissions;
- publish lifecycle.

## Workflow rich content

Provide a safe structured/rich authoring system capable of educational/SEO content and embedded assets/product references.

## Commerce

Activate after economy validation:

- one-time purchase;
- free product;
- ownership transfer;
- commission;
- Creator payout/cash-out;
- fiat purchase of internal units when approved.

## Trust

- buyer ratings/reviews;
- automated Creator reputation;
- verification;
- separate Prompt Draft Picks/editorial promotion.

## Content Graph

Introduce general product relationships/lineage using existing Draft -> Archive provenance as precedent.

## Remix economy

Implement permission-based remix/derived publication and attribution once the core Product model is stable.

---

# Phase 4 — AI Enhancement

Goal: use accumulated structured data and validated product flows to add intelligence without replacing Prompt Draft semantics.

Potential capabilities:

## Structured module assistant

User describes an unsupported value; AI maps it into valid Prompt Draft fields/modules.

## Intent mapping

User intent maps to relevant structured products/modules/workflows.

## Dynamic Wizard

AI selects/generates the next Wizard step while using existing validated schemas/actions.

## Internal model/assistant

Use appropriately anonymized structured platform intelligence to reduce dependency on external API providers over time.

AI product-quality judging is not a current priority.

---

# Cross-phase constraints

## Static build

Until a rendering ADR selects otherwise:

```text
pnpm generate
```

remains a release invariant.

## Backend authorization

Backend permission checks remain authoritative.

## Data migrations

Applied migrations `001`–`019` are immutable. Next schema migration is `020_*.sql`.

## Local verification

A milestone/phase is not `DONE` merely because code exists. Product behavior must be locally verified and explicitly accepted.

## Avoid feature creep

Deferred items stay deferred unless a milestone explicitly selects them.

Examples:

- multi-Creator ownership;
- subscriptions;
- generic pay-per-use Creator products;
- graph database migration;
- full SSR migration;
- final AI model training;
- final marketplace legal system.

---

# Founder-facing proof sequence

The roadmap is designed to build an increasingly strong company narrative:

```text
Strong technical engine
  -> measurable user growth
  -> cross-domain proof
  -> Creator/marketplace supply
  -> internal economic circulation
  -> real monetization
  -> structured-data AI advantage
```

This is the evidence chain intended to make Prompt Draft progressively more credible to users, Creators, accelerators and investors.
