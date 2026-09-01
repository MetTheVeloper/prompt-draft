# Prompt Semantics Refactor — Stage 06: Layout Semantics

## Status

**Semantically closed and revalidated by `refactor/module-wording`.**

The final prompt-facing Layout contract is defined here together with `PROMPT-FACING-IDENTITY-REFERENCE.md`.

## Goal

Define Layout as the spatial schema of a multi-region canvas or artifact while keeping framing, image generation, typography styling, and other content-generation concerns outside Layout ownership.

Layout is intentionally strict about authored region geometry. The automatic Scene/Layout rule remains:

```text
Match each scene's dimensions exactly to its corresponding region in {layout}.
```

This wording is retained because repeated real generation tests produced acceptable near-exact adherence. Do not weaken `exactly` without new empirical evidence.

## Ownership

Layout owns:

- artifact-level layout type when explicitly selected
- overall visual density when explicitly selected
- region geometry
- region semantic role
- region content binding
- content alignment inside a region
- content fit and overflow behavior inside a region
- meaningful layer ordering for overlapping regions
- optional region-specific instructions

Layout does not own:

- camera framing of a subject
- subject pose or composition inside an image region
- typography appearance
- image generation behavior inside a region
- per-region module stacks

Core contract:

```text
Layout defines where content goes.
Other modules define what that content is and how it is rendered.
```

## Canonical region structure

`regions` is the authoritative semantic structure.

A region may contain:

```text
id
name
key
role
contentKey
bounds
alignment
fit
overflow
layer
description
```

`bounds` is the required spatial semantic and is represented canonically with normalized values from `0` to `1` in structured state/JSON.

## Identity

### Persistence identity

Region `id` is stable implementation identity. Renaming a Region must not break bindings.

Canonical structural keys remain derived from stable identity and may use the internal namespace:

```text
{layout_region_<id-suffix>}
```

This namespace remains internal/canonical and may appear in JSON.

### Prompt-facing identity

The user-authored Region name is the preferred Modular/Natural identity, normalized to lowerCamelCase.

Examples:

```text
top left     -> {topLeft}
top right    -> {topRight}
bottom left  -> {bottomLeft}
bottom right -> {bottomRight}
```

The previous compiler-facing `{r_1}`, `{r_2}`, ... aliases are obsolete.

Prompt-facing identity is not persistence identity. The compiler resolves Region names through the global collision-aware identity registry.

## Templates

Layout templates are editor helpers implemented through module presets.

They initialize geometry but never become a second source of truth. Once a user edits template-generated regions, the regions remain authoritative.

Current template families include:

- Full bleed
- Vertical split
- Horizontal split
- Side panel
- Bottom panel
- Modular grid
- Feature + support
- Centered stack
- Layered overlap

## Region field semantics

### Name

`name` is an editable human-facing label and the preferred prompt-facing semantic identity.

Renaming changes the final Modular/Natural alias but does not change stable Region identity or break references.

### Role

`role` describes the semantic responsibility of a region, for example:

- background
- hero image
- supporting image
- text
- logo
- badge
- CTA
- metadata
- decoration
- empty space
- custom role

A custom role compiles to its authored semantic text rather than the generic word `custom`.

### Content binding

`contentKey` identifies the concrete content entity bound to the region.

Examples may include Scene or Typography identities:

```text
{scene1}
{tg_1}
```

Prompt-facing bindings use the same global identity registry as the referenced entity definition, so definitions and references cannot drift.

### Content alignment

Horizontal and vertical alignment describe content placement inside the region container.

This remains distinct from Framing, which owns photographic/compositional framing of subjects.

### Content fit

Fit describes how content occupies its region container.

Semantic output uses:

```text
cover   -> cover
contain -> contain
fill    -> stretch
natural -> intrinsic
```

### Content overflow

Semantic output uses:

```text
visible -> visible
hidden  -> clip
```

### Layer

Layer information is emitted only when regions overlap and have meaningful differing layer values.

Ordinary grids/splits do not emit meaningless layer noise; layered compositions preserve z-order.

### Description

`description` remains an optional semantic escape hatch for region-specific instructions not represented by structured fields.

## Output formats

### JSON

JSON is the canonical structured representation.

It retains normalized `0..1` geometry, internal IDs, canonical keys, and complete region metadata.

### Modular

Modular no longer serializes the Layout object as raw JSON-like prompt text.

It uses the same dedicated semantic serializer as Natural while preserving the explicit module definition:

```text
{layout} =
Use a structured layout.
Interpret all region bounds as percentages from 0% to 100%.

Regions:
• {topLeft} (content: {scene1}; bounds: x: 0%, y: 0%, width: 50%, height: 50%).
• {topRight} (content: {scene2}; bounds: x: 50%, y: 0%, width: 50%, height: 50%).
```

### Natural

Natural uses the same semantic Layout block without exposing internal structure:

```text
Use a structured layout.
Interpret all region bounds as percentages from 0% to 100%.

Regions:
• {topLeft} (content: {scene1}; bounds: x: 0%, y: 0%, width: 50%, height: 50%).
• {topRight} (content: {scene2}; bounds: x: 50%, y: 0%, width: 50%, height: 50%).
```

Modular and Natural must resolve the same Region and content identities for the same compile.

## Typography integration

Typography may bind a text group to a Layout region through stable internal references.

Prompt-facing relationship:

```text
Layout region -> {topLeft}
Typography group -> {tg_1}
```

Example:

```text
• {topLeft} (content: {tg_1}; bounds: ...)
```

Typography remains responsible for text organization/rendering; Layout remains responsible for region placement.

## Scene integration

Scene bindings use stable internal IDs but resolve to semantic prompt-facing Scene aliases.

Example:

```text
• {topLeft} (content: {scene1}; ...)
```

The automatic rule remains:

```text
Match each scene's dimensions exactly to its corresponding region in {layout}.
```

The retained wording is based on observed generation behavior and is part of the validated contract.

## Validation and closure evidence

Final `refactor/module-wording` validation confirmed:

- canonical normalized Layout state remains intact
- JSON remains fully structured
- Modular no longer exposes raw Layout object noise
- Modular and Natural use percentage bounds
- user-authored Region names become lowerCamelCase prompt identities
- `{r_n}` aliases are no longer emitted
- Scene and Typography content bindings resolve through the same global identity registry
- non-overlapping layouts omit meaningless layer values
- overlapping layouts preserve meaningful layer ordering
- module-card preview matches final Output
- four-Scene 2x2 Layout emits `{topLeft}`, `{topRight}`, `{bottomLeft}`, `{bottomRight}` with `{scene1}` ... `{scene4}`
- real generation behavior remained acceptably near-exact under the retained `exactly` rule

Regression validation:

```text
pnpm test:module-wording
13 passed / 0 failed

pnpm test:actions-api
176 passed / 0 failed
```

## Closure

> **Stage 06 — Layout Semantics: closed and revalidated.**

Future changes should preserve the distinction between canonical normalized geometry and concise semantic prompt presentation. Any change to the `exactly` rule requires new empirical evidence, not merely theoretical preference.
