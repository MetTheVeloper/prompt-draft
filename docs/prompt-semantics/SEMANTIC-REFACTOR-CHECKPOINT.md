# Prompt Draft — Semantic Refactor Checkpoint

## Status

**All semantic surfaces currently registered in `app/modules/registry.ts` are semantically closed.**

**Localization consolidation is closed.**

**Legacy semantic compatibility/migration is intentionally out of scope.**

**The semantic breaking-cleanup pass is closed.**

**The completed semantic refactor has been integrated into `main`.**

Historical refactor branch:

```text
refactor/prompt-semantics
```

Current development base:

```text
main
```

This checkpoint is the canonical end-state of the semantic-refactor project for the current registry. A closed module should not be reopened for ordinary model variance, catalog growth, localization, cosmetic UI work, old-draft compatibility, release maintenance, or theoretical micro-polish. Reopen only when a reproducible current-schema defect exposes a real ownership, identity, prompt-graph, compiler, target-policy, or state contract failure.

---

# Registered semantic surfaces

The current registry contains 16 modules:

```text
Variables
Layout
Style
Form
Framing
Expression
Pose
Hair
Outfit
Background
Lighting
Camera
Color Palette
Typography
Effects
Texture / Material
```

All 16 are semantically closed.

---

# Closure map

## Style + Form

Closed with orthogonal ownership, neutral defaults, minimum-sufficient state recipes, and removal of aesthetic/material/form leakage. Both modules are now standalone current implementations; their pre-refactor base modules have been removed.

## Setup / core prompt context

Closed as the shared semantic context foundation for mode, reference usage, subject context, transformation strength, preservation, aspect ratio, and related prompt-level state.

## Layout

Closed with stable region identity, structured spatial output, protected Natural serialization, region tokens, and tested schematic/image-layout behavior.

## Framing

Closed with framing axes separated from Camera, Pose, Style, and layout ownership.

## Camera

Closed with capture system, response, optics/focus behavior, and capture behavior separated from Framing and Lighting.

## Lighting

Closed with repeated source-local entities plus global ambient/contrast semantics.

## Color Palette

Closed with relational assignments, stable semantic target references, and capability-driven target discovery.

## Texture / Material

Closed with target-specific material assignments and independent material/surface axes. Its material and condition metadata now live in the neutral `app/modules/texture.catalog.ts`; the pre-refactor global Texture module has been removed.

## Pose + Expression

Closed with subject-scoped relational assignments and strict body-vs-face ownership.

## Background + Effects

Closed with Background owning depicted scene/backdrop content and Effects owning image-space/composited post-processing and overlays.

## Hair + Outfit

Closed with hierarchical entities, stable internal identity, global external paths, scoped aliases, selective token emission, subject-scoped assignments, capability-driven Color/Material targets, editable recipes, inherit baselines, and protected linked-module Natural behavior.

## User Variables + Variable Blueprints

Closed with typed semantic handles, lowerCamelCase prompt-facing keys, case-insensitive collision identity, auxiliary reference inputs, editor-only Blueprint recipes, repeatable Profile templates, coherent index allocation, Custom Variable Sets, and non-blocking warning UX.

## Typography

Closed with the ownership boundary:

```text
Variables  → reusable visible-text content
Typography → grouping and text-rendering semantics
Layout     → explicit spatial region geometry / placement
```

Typography uses variable-first authoring, selective structural-key emission, compact structured output, and protected Natural serialization.

---

# Global semantic precedents

The project now consistently uses these rules where applicable:

- minimum sufficient prompt semantics,
- explicit ownership and non-responsibilities,
- orthogonal fields instead of mega-selects,
- repeated/hierarchical entities when children or modifiers need identity,
- stable internal IDs separate from human semantic keys,
- lowerCamelCase prompt-facing keys,
- globally unique external structural tokens where required,
- scoped local aliases inside owning module definitions,
- selective token emission only when graph references require it,
- typed variables as semantic contracts,
- target policy separated from assignment mechanics,
- capability-driven Color/Material targets,
- presets and Blueprints as editable state recipes,
- `inherit` as a neutral baseline where appropriate,
- reference baseline plus explicit overrides,
- Natural output as a readable serialization of the same prompt graph,
- semantic correctness evaluated separately from stochastic generation-model compliance.

---

# Localization consolidation — closed

Release-facing verification remains:

```bash
pnpm locale:consolidate
```

The completed consolidation established:

- EN/FA parity must remain clean,
- canonical semantic metadata may remain locale-independent when translated at render time,
- prompt-facing semantic values, compiler/Natural wording, tokens, and Blueprint defaults remain locale-independent,
- `localization-audit.mjs`, `localization-review.mjs`, and `localization-consolidate.mjs` are the maintained localization verification tools.

One-off patch/merge scripts used during the completed localization migration have been removed.

---

# Backward compatibility decision

Pre-refactor saved drafts and pre-refactor importable JSON are **not** part of the current product contract.

Do not add migration code for removed legacy fields unless backward compatibility becomes an explicit future product requirement.

This includes old mega-select/flat schemas from Framing, Camera, Lighting, Texture, Pose, Expression, Background, Effects, Hair, Outfit, Style/Form ancestors, and related cross-module pollution.

The review backlog is reserved for reproducible defects in the **current schema**, not speculative old-state migration.

---

# Breaking cleanup — closed

The cleanup pass removed obsolete implementation and migration artifacts, including:

- unregistered legacy Pose, Expression, Hair, Outfit and Deformation implementations,
- pre-refactor Style and Form base implementations after standalone consolidation,
- pre-refactor Texture implementation after neutral catalog extraction,
- migration-only Stage 13/14 backlog documents,
- tracked Layout stage backup/payload directories,
- completed one-off localization patch and hardcoded-batch scripts.

Temporary Layout backup/payload paths are ignored by `.gitignore` to prevent accidental reintroduction.

The maintained runtime remains centered on the current registry and its current semantic modules/catalogs.

See also:

```text
docs/prompt-semantics/SEMANTIC-BREAKING-CLEANUP.md
```

---

# Final integration audit — completed

The final branch audit verified these boundaries:

- registry imports only current implementations,
- no known `BaseStyleModule`, `BaseFormModule`, or legacy Texture runtime dependency remains,
- no tracked semantic-refactor backup/payload directory remains,
- no migration-only localization patch pipeline remains,
- migration backlog is not a release blocker,
- branch changes are limited to intentional semantic cleanup/integration work,
- current-schema validation, not old-state compatibility, is the acceptance criterion.

Release validation was performed with the maintained project gates, including:

```bash
pnpm locale:consolidate
pnpm generate
pnpm build
```

The semantic-refactor branch was then fast-forward integrated into `main`.

---

# Post-refactor engineering tracker

Post-refactor UX, bug-fixing, maintainability, architecture-hardening, and centralization work must now be tracked in:

```text
docs/refactor/ARCHITECTURE-UX-TRACKER.md
```

That file is a living development record. It owns:

- UX findings from ongoing testing,
- reproducible current-product bugs,
- duplication and centralization opportunities,
- architecture improvements that preserve module ownership,
- implementation decisions,
- verification results,
- completed-case history and commit references.

Do not turn this semantic checkpoint into a general product backlog. Only update this file again when a post-refactor case genuinely changes a semantic contract or the historical checkpoint itself.

---

# Recommended next phase

Continue product development from `main` and use the Architecture & UX Tracker as the canonical cross-chat work state.

The preferred loop is:

```text
real testing / development finding
        ↓
record case in ARCHITECTURE-UX-TRACKER.md
        ↓
inspect current implementation
        ↓
decide local fix vs reusable architecture improvement
        ↓
implement + verify
        ↓
record resolution + commit + Completed status
```

This allows UX work and architecture hardening to progress together without reopening the accepted semantic architecture by default.

---

# Checkpoint rule

> **The current Prompt Draft registry is semantically closed, localization is consolidated, legacy migration is intentionally unsupported, semantic cleanup is complete, and the refactor has been integrated into `main`. Post-refactor UX and architecture work is tracked separately in `docs/refactor/ARCHITECTURE-UX-TRACKER.md`.**
