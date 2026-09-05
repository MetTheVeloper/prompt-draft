# Prompt Draft — Content Graph & Lineage V1

Status: **Strategic architecture direction; implementation staged**

---

# 1. Why a Content Graph

Prompt Draft's value should not be represented as an isolated list of products.

The platform should understand relationships among knowledge, products and people.

A simple catalog looks like:

```text
Product A
Product B
Product C
```

Prompt Draft's intended model is closer to:

```text
Creator
  -> creates Product
  -> Product belongs to Category
  -> Product uses Knowledge Component
  -> Product is remixed from Product
  -> Workflow contains Prompt/Template
  -> User follows Creator
  -> related products can be discovered
```

This relationship layer is the Content Graph.

---

# 2. Graph does not mean graph database

V1 does **not** require Neo4j or a specialized graph store.

The existing PostgreSQL architecture is a valid starting point.

The important requirement is to model relationships explicitly and preserve stable identities.

A relational implementation can use concepts such as:

```text
products
product_relationships
creator_follows
product_categories
workflow_items
```

Exact schema is deferred until the feature milestone.

---

# 3. Core node concepts

Potential nodes include:

- User / Creator
- Product
- Prompt
- Template
- Workflow
- Knowledge Component
- Category
- Tag
- Collection
- Tutorial/guide content

Not all of these need separate tables or V1 implementation.

---

# 4. Core relationship concepts

Possible relationships include:

```text
CREATED_BY
OWNED_BY
DERIVED_FROM
REMIXED_FROM
USES
CONTAINS
RELATED_TO
BELONGS_TO_CATEGORY
TAGGED_WITH
FOLLOWED_BY
FEATURED_BY
```

Do not encode relationship semantics only in UI strings. Durable relationships that affect ownership, lineage, discovery or economics should be first-class data.

---

# 5. Lineage

The founder wants the evolution of reusable knowledge to remain visible.

Example:

```text
Original Prompt — Ali
  -> remixed by Sara
     -> expanded into Workflow by Mehdi
```

Lineage should support:

- attribution;
- source navigation;
- derived-product rules;
- revenue-share logic when enabled;
- trust/context;
- historical knowledge evolution.

Lineage is distinct from version history.

## Version history

Same owner/product identity evolving over time.

## Lineage

A new product derives from another product or component.

Both may exist simultaneously.

---

# 6. Existing partial lineage foundation

Milestone 20 already introduced real provenance for Draft -> Archive promotion:

```text
source_kind = user_draft
source_user_id
source_draft_id
unique source-Draft promotion
```

This is not yet a general Content Graph but must be treated as reusable precedent.

Do not create a second incompatible provenance model when general product lineage is introduced.

---

# 7. Minimal staged implementation

## Stage 1 — provenance/lineage primitive

When Marketplace implementation begins, support the minimum relationship data needed for:

- source product;
- derived product;
- relationship type;
- original creator attribution.

## Stage 2 — composable product graph

Add relationships needed for:

- Workflow contains/uses Prompt;
- Workflow contains/uses Template;
- related knowledge/components;
- category relationships.

## Stage 3 — discovery/community graph

Use relationship data for:

- related products;
- similar Creators;
- follow-based recommendations;
- personalized homepage;
- lineage visualization.

---

# 8. Deletion/retention principle

Deleting/unpublishing a commercial product should not erase Prompt Draft-owned internal intelligence that has already been generated from ecosystem activity.

Where product identity must disappear from public surfaces, retained internal data should respect the platform privacy/anonymization policy.

Lineage and analytics retention rules must distinguish:

- commercial/public Creator-owned content;
- platform-owned non-sellable intelligence.

---

# 9. Ownership transfer and graph continuity

Full ownership transfer should change the active owner without destroying creation history.

Conceptually:

```text
created_by = original Creator (historical)
owned_by   = current owner (mutable through transfer)
```

The exact fields are not prescribed here, but implementation must preserve that distinction.

Product metrics/history should not be reset simply because ownership transfers.

---

# 10. Community graph

Users and Creators should eventually be able to follow Creators.

This relationship can feed:

- new product feed;
- inferred categories/interests;
- similar Creator recommendations;
- personalized homepage ranking.

Creator follows are future work and are not a Milestone 21 requirement unless explicitly selected in a later phase.

---

# 11. Discovery implications

Prompt Draft's preferred discovery mode is Intent First.

Content Graph relationships allow an intent such as:

> “I want to launch an Instagram page for my product.”

To map to multiple useful assets:

- Workflow
- Template
- Prompt
- relevant Creator
- related categories

Rather than only matching literal title keywords.

---

# 12. Scale guidance

Do not optimize prematurely for a million-node graph by introducing infrastructure that the current product does not need.

Do design stable IDs, indexed relationships and bounded list/read APIs so the relational model can grow safely.

The existing backend conventions already prefer:

- first-class queryable columns;
- list/detail projections;
- cursor pagination;
- stable identifiers;
- explicit ownership;
- numbered migrations.

Reuse those conventions.
