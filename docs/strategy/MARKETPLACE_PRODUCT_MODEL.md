# Prompt Draft — Marketplace Product Model V1

Status: **Strategic model; implementation intentionally deferred until Marketplace Activation**

This document defines the marketplace product concepts that future schema/API/UI work must support without prematurely building the commercial system during Growth Foundation.

---

# 1. Core principle

Prompt Draft is not a marketplace of plain text files.

The marketplace represents reusable AI knowledge products and composable knowledge components.

The first three first-class product types are:

```text
Prompt
Template
Workflow
```

They should share common identity/creator/category/economic concepts, but their user experience is not identical and they should not be forced into one generic detail-page behavior.

---

# 2. Prompt product

A Prompt is a structured AI instruction ready for direct use.

Typical capabilities:

- public/free discovery metadata;
- preview/examples;
- instructions/tool compatibility;
- first meaningful unlock/copy accounting;
- optional controlled customization;
- remix permissions;
- lineage/source information;
- save/share signals;
- Creator attribution.

The current Prompt Archive is a strong content/catalog foundation but is not yet a Product/Order/License model.

Future work must extend the Archive only where its semantics remain correct. Do not silently reinterpret `prompt_archive_items` as commercial orders or wallet transactions.

---

# 3. Template product

A Template is a reusable Prompt Draft knowledge product with explicit user-editable variables or controlled choices.

Example:

```text
Event Poster Template
  title
  subtitle
  brand
  event date
  event time
  visual style
  aspect ratio
```

## Target buyer journey

```text
open Template page
  -> understand result/examples
  -> unlock if required
  -> enter own variables
  -> finalize output in-place
  -> copy/export final instruction
```

The user should not need to:

- open the full `/create` editor;
- understand internal module semantics;
- manually find/replace placeholder text.

Template variables should be typed/validated product data rather than opaque textual conventions when possible.

Possible variable classes include:

- free text;
- multiline text;
- number;
- date/time;
- choice;
- ratio/dimension;
- color;
- structured domain-specific value.

Exact variable schema is intentionally deferred to the Marketplace implementation design.

---

# 4. Workflow product

A Workflow is a broader reusable knowledge system for accomplishing a task.

It may contain or reference:

- Prompts;
- Templates;
- instructions;
- step-by-step processes;
- examples;
- screenshots/media;
- external-tool guidance;
- educational explanations;
- other reusable knowledge components.

## Workflow authoring requirement

Future Creator/Manage authoring should support rich structured editorial content rather than a single plain textarea.

Expected capabilities may include:

- headings;
- paragraphs;
- ordered/unordered lists;
- rich links;
- callouts;
- embedded product references;
- media;
- examples/code blocks where domain-appropriate.

The exact editor implementation is not selected yet. A rich-text/HTML-like editing experience is the product requirement; the storage/editor technology should be chosen later with security, portability, SEO and structured-content needs in mind.

## SEO value

Workflow pages are both products and educational/public content surfaces. Their explanatory content can become an important organic acquisition asset.

---

# 5. Shared product concepts

All product types will eventually require some common concepts:

```text
stable product identity
product type
Creator/owner
publication state
category/tags
title/description
preview/media
usage instructions
pricing/monetization mode
permissions
usage metrics
ratings/reviews
lineage/relationships
created/updated timestamps
```

Do not assume that all of these belong in one database table. This is a domain model, not a schema prescription.

---

# 6. Monetization modes V1

Founder-approved initial modes:

```text
FREE
ONE_TIME_PURCHASE
OWNERSHIP_TRANSFER
```

Deferred:

```text
subscription
pay-per-use billing plan
complex recurring licensing
multi-owner revenue sharing
```

## Free

A Creator can publish for portfolio/reputation/community value without requiring payment.

Free products still generate legitimate marketplace signals such as usage, rating, remix and referral/discovery value.

## One-time purchase

The buyer unlocks ordinary use according to the product's defined permissions.

Repeated copy of an already-unlocked prompt should not automatically imply repeated purchase.

Execution/customization may have its own economy semantics in future, but this is separate from the base ownership/access state.

## Ownership transfer

A Creator may offer full transfer of the product inside Prompt Draft.

After a successful transfer:

- product administrative control moves to the buyer/new owner;
- future sale economics/control move to the new owner;
- configurable product permissions move to the new owner;
- historical Creator/source attribution remains;
- product performance/history should remain associated with the same product identity where appropriate;
- lineage must preserve the original creation history.

This is product ownership transfer, not merely an “exclusive use” label.

---

# 7. Creator-controlled permissions

Future products may expose clear Creator settings such as:

```text
allow ordinary use
allow customization
allow remix
allow derived publication
allow derived resale
allow commercial use
allow ownership transfer
```

Not every setting needs to ship in the first Marketplace release.

The UX must remain simple and contract terms must be explicit.

---

# 8. Remix product model

A remix/derived product is a new product identity that references a source product.

Minimum future requirements:

- source relationship preserved;
- original Creator attribution visible;
- derived Creator explains modifications where useful;
- source Creator's permissions respected;
- revenue-share rule applied when configured;
- duplicate/source history not erased.

Possible future pricing rules controlled by the source Creator:

- derived product cannot exceed source price;
- derived product may exceed source price;
- custom maximum;
- source-Creator share of derived sales.

These are strategic requirements, not Milestone 21 implementation tasks.

---

# 9. Product vs knowledge component

A Product is a marketplace/commercial/public packaging of knowledge.

A Knowledge Component is a composable building block that may participate in one or more products.

This distinction is important.

Example:

```text
Knowledge component: brand voice specification
Knowledge component: audience-analysis prompt
Knowledge component: campaign idea template

Workflow product:
  uses all three
```

Future architecture should not require copying the same component into every Workflow if a relationship/reference is more appropriate.

---

# 10. Consumer vs Creator surfaces

## Consumer

Prioritize:

- intent;
- evidence/examples;
- simple value proposition;
- controlled personalization;
- final output/use;
- trust signals.

Do not expose unnecessary internal engineering complexity.

## Creator

Prioritize:

- explicit product structure;
- reusable components;
- permissions;
- market pricing context;
- performance analytics;
- lineage;
- clear economic rules.

---

# 11. Existing platform primitives to reuse

Before Marketplace implementation, audit and reuse:

- `Prompt Archive` content/tags/media/public routing;
- public `/user` profile and avatar/cover identity;
- Cloud Draft ownership and public/private visibility;
- Draft preview media;
- Draft -> Archive source provenance;
- authorization/Manage shell;
- admin audit log;
- idempotent score ledger;
- referral relation;
- Global Menu / Global Modal;
- API/static-generation conventions.

Canonical capability map:

```text
docs/backend/PRODUCT_STRATEGY_GROWTH_FOUNDATION_HANDOFF.md
```

---

# 12. Explicit non-goals for Growth Foundation

Do not build the full Product/Order/Payment/Payout/License system merely because the concepts are now documented.

Growth Foundation should collect the behavioral evidence and extend foundations needed to decide the Marketplace implementation with real data.
