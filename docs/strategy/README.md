# Prompt Draft Strategy Documentation

Branch: `feature/growth-foundation`

Baseline commit inherited from `feature/docker-local-api`:

```text
3ef4b0c65777d6f2814744ed0a1fa8a78750a389
```

This directory is the source of truth for product strategy, commercialization, growth, marketplace design, creator economy, internal economy, content graph and future domain expansion.

## Mandatory upstream handoff

Before designing or implementing Growth, Credit, Referral, Creator or Marketplace work, read:

```text
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```

Then follow the canonical backend sources referenced by that handoff.

Core operating rule:

> Audit existing capability first. Build only the real gap. Do not create parallel systems for problems Prompt Draft has already solved.

The inherited backend baseline is complete through Milestone 20. The next SQL migration, if any, must be `020_*.sql`.

## Strategy document map

```text
FOUNDER_DISCOVERY_QA_V1.md
  -> founder intent record and product-discovery decisions

PRODUCT_STRATEGY_V1.md
  -> approved product direction and strategic boundaries

EXECUTION_ROADMAP_V1.md
  -> ordered phases from Growth Foundation to AI enhancement

MARKETPLACE_PRODUCT_MODEL.md
  -> Prompt / Template / Workflow and creator publishing model

CONTENT_GRAPH_AND_LINEAGE.md
  -> composable knowledge graph, remix and lineage principles

EXECUTION_LAYER_CONCEPT.md
  -> runtime customization and AI-tool handoff model

PRICING_AND_INTERNAL_ECONOMY_V1.md
  -> creator pricing, internal coin/credit economy, commission and ownership transfer

MILESTONE_21_GROWTH_FOUNDATION.md
  -> first executable strategy milestone on this branch

STATUS.md
  -> current strategy-branch checkpoint
```

## Strategic sequence

The founder-approved high-level order is:

```text
1. Growth Foundation
2. Domain Expansion
3. Marketplace Activation
4. AI Enhancement
```

Domain-expansion priority after the current Image / Visual Creation domain is currently:

```text
1. Content Creation
2. Programming
3. Education
4. Marketing / Advertising
```

This priority is a market hypothesis, not a permanent taxonomy constraint.

## Product boundary

Prompt Draft is not intended to become the final AI execution destination, a general AI model provider, an image/video generator, a generic social network, an academy or an everything-app.

Prompt Draft is the intelligent, structured layer between human intent and external AI tools, plus a marketplace/community for reusable AI knowledge engineering.

## Release invariant

Until a rendering/deployment architecture change is explicitly approved, frontend-affecting work must preserve:

```text
pnpm generate
```

The current frontend remains static-generated and talks directly to the independent Node API over CORS.
