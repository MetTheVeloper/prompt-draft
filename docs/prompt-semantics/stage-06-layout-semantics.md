# Prompt Semantics Refactor — Stage 06: Layout Semantics

## Goal

Define Layout as the exact spatial schema of a multi-region canvas or artifact while keeping framing, image generation, typography styling, and other content-generation concerns outside Layout ownership.

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

The core contract is:

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

`bounds` is the only required spatial semantic and is represented canonically with normalized values from `0` to `1` in structured output.

## Templates

Layout templates are editor helpers implemented through module presets.

They only initialize region geometry and never become a second source of truth.

Current templates include:

- Full bleed
- Vertical split
- Horizontal split
- Side panel
- Bottom panel
- Modular grid
- Feature + support
- Centered stack
- Layered overlap

Once a user edits template-generated regions, the regions remain authoritative and the preset state may clear normally.

## Removed semantics

The previous `composition` and `hierarchy` fields are no longer compiled by Layout.

They were removed because region geometry and explicit region roles already express the relevant structure without requiring generic semantic duplication.

Legacy stored values containing those keys remain harmless because the compiler ignores them.

## Optional artifact semantics

`layoutType` and `density` have empty defaults and only compile when explicitly selected.

This prevents Layout from injecting assumptions into prompts that only require a spatial schema.

## Region field semantics

### Name

`name` is a human-readable label only.

It does not define identity or references. Renaming a region must not break bindings.

### Structural key

Region structural keys are derived from the stable region `id`:

```text
{layout_region_<id-suffix>}
```

The `layout_region_*` namespace is reserved to prevent collisions with user-created variables.

Natural output only shows a region key when another module actually references it.

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

A custom role compiles to its actual custom text rather than the generic word `custom`.

### Content binding

`contentKey` identifies which content entity belongs in the region.

Examples:

```text
{headline}
{description}
{hero_image}
```

`role` and `contentKey` are complementary:

```text
role       → what kind of responsibility the region has
contentKey → which concrete content entity is bound to it
```

### Content alignment

Horizontal and vertical alignment describe content placement inside the region container.

This is intentionally distinct from Framing, which owns photographic or compositional framing of a subject.

### Content fit

Fit describes how content occupies its region container.

Semantic output uses clearer terms where appropriate:

```text
cover   → cover
contain → contain
fill    → stretch
natural → intrinsic
```

### Content overflow

Overflow describes whether content may extend beyond the region boundary.

Semantic output uses:

```text
visible → visible
hidden  → clip
```

### Layer

Layer information is emitted only when regions actually overlap and have meaningful differing layer values.

This avoids structural noise in ordinary split/grid layouts while preserving exact z-order in layered compositions.

### Description

`description` remains an optional region-specific escape hatch for semantic instructions that are not represented by the structured fields.

## Output formats

### JSON

JSON is the canonical, fully structured representation.

It keeps normalized `0..1` geometry and complete structural region metadata.

### Modular

Modular output preserves the structured object but serializes module objects on a single line to avoid excessive line count.

Example:

```text
{layout} = {"coordinateSystem":"normalized values from 0 to 1","regions":[...]}
```

### Natural

Layout uses a dedicated protected Natural block and does not pass structured Layout text through the generic Natural optimizer.

Region coordinates are converted to percentages for readability:

```text
Use a structured layout.
Interpret all region bounds as percentages from 0% to 100%.

Regions:
• top (bounds: x: 0%, y: 0%, width: 100%, height: 50%).
• bottom (bounds: x: 0%, y: 50%, width: 100%, height: 50%).
```

Keys appear only when actually referenced by another module.

## Typography integration

Typography may bind a text group to a Layout region using the region structural token.

Example structured relationship:

```text
Typography position → {layout_region_top}
Layout region key   → {layout_region_top}
```

Natural output preserves this relationship explicitly while keeping Layout responsible only for region placement and Typography responsible for text semantics and rendering.

Typography structured output also uses its own protected Natural serializer so exact text values and render rules are not altered by the generic optimizer.

## Validation and tests completed

The following behaviors were manually verified during Stage 06:

- default Layout emits no implicit artifact type or density
- templates initialize geometry correctly and edited regions remain authoritative
- Modular and JSON preserve exact normalized region structure
- Natural output converts geometry to percentages without decimal corruption
- Natural regions render as a readable bullet list
- unused region keys are hidden from Natural output
- referenced region keys appear only for the referenced regions
- Typography region binding is preserved in Modular and Natural output
- structured module objects remain one-line in Modular output
- non-overlapping layouts omit meaningless layer values
- layered overlapping layouts preserve layer ordering
- role, alignment, fit, overflow, and description compile conditionally
- custom region roles remain semantically consistent in compiler output and variable catalog metadata
- `layout_region_*` is protected as a reserved structural variable namespace

## Translation workflow

English wording overrides introduced during this stage are stored in:

```text
scripts/i18n-patches/en.layout-semantics.ts
scripts/i18n-patches/en.layout-region-semantics.ts
```

Locale files are not edited directly on the semantic refactor branch.

## Closure

Stage 06 is considered complete after a successful project generation/build check.

The next semantic refactor target is **Framing**.
