# Prompt Draft — Semantic Refactor Checkpoint

## Status

**All semantic surfaces currently registered in `app/modules/registry.ts` are semantically closed.**

**Localization consolidation is also closed as of 2026-08-22.**

Checkpoint branch:

```text
refactor/prompt-semantics
```

This checkpoint marks the end of the module-by-module semantic-refactor phase for the current registry and records the completed localization/release-cleanup pass that followed it.

A closed module should not be reopened for ordinary model variance, recipe/catalog growth, localization, cosmetic UI work, legacy migration, release/build maintenance, or theoretical micro-polish. Reopen only when concrete evidence reveals a real semantic ownership defect, prompt-graph loss, broken identity/target policy, reproducible compiler/state regression, or another contract-level failure.

---

# Registered semantic surfaces at this checkpoint

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

All 16 are covered by completed semantic stages and accepted closure precedents.

---

# Closure map

## Style + Form

Closed through the early semantic-refactor stages.

Key outcomes include orthogonal Style/Form ownership, neutral defaults, minimum-sufficient preset state, and removal of aesthetic/material/form leakage across module boundaries.

## Setup / core prompt context

Closed as the shared semantic context foundation for mode, reference usage, subject context, transformation strength, preservation, aspect ratio, and related prompt-level state.

## Layout

Closed with stable region identity, structured spatial output, protected Natural serialization, region tokens, and tested schematic/image-layout behavior.

## Framing

Closed with orthogonal framing axes separated from Camera and Pose ownership.

## Camera

Closed with capture system, response, optics/focus behavior, and capture behavior separated from Framing and Lighting.

## Lighting

Closed with repeated source-local entities and global ambient/contrast semantics.

## Color Palette

Closed with relational target assignments and capability-driven target discovery.

## Texture / Material

Closed with target-specific material assignments and independent material/surface axes.

## Pose + Expression

Closed with subject-scoped relational assignments and strict body-vs-face ownership.

## Background + Effects — Stage 13

Semantically closed.

Background owns depicted scene/backdrop content. Effects owns image-space/composited post-processing and overlays.

## Hair + Outfit — Stage 14

Semantically closed.

Established hierarchical semantic entities, stable internal identity, global external paths, scoped local aliases, selective token emission, subject-scoped assignments, capability-driven Color/Material targets, editable recipes, inherit baselines, and protected linked-module Natural behavior.

## User Variables + Variable Blueprints — Stage 15

Semantically closed.

Established typed semantic user handles, preserved lowerCamelCase prompt-facing keys, case-insensitive collision identity, auxiliary reference inputs, editor-only Blueprint recipes, repeatable Profile templates using `#` index patterns, coherent whole-profile index allocation, Custom Variable Sets, and collapsed non-blocking warning UX.

## Typography — Stage 16

Semantically closed.

Final ownership boundary:

```text
Variables  → reusable visible-text content
Typography → grouping and text-rendering semantics
Layout     → explicit spatial region geometry / placement
```

Stage 16 also established variable-first Typography authoring, multi-select Text-variable insertion, selective structural-key emission, compiler removal of internal IDs/default noise, compact structured Typography output, and concise protected Natural serialization while retaining tested generation accuracy.

---

# Localization consolidation — closed

The project-wide localization consolidation pass is complete and should be treated as a closed release-cleanup checkpoint unless a concrete localization defect is reproduced.

The final verified command was:

```bash
pnpm locale:consolidate
```

Final verification on 2026-08-22:

```text
Semantic boundary check passed. ✅
Missing in EN:          0
Missing in FA:          0
Extra in FA:            0
Actionable UI/metadata: 0
Review required:        0
Localization consolidation complete. ✅
```

Additional final review categories were intentionally non-actionable:

```text
RENDER_LOCALIZED   493
SEMANTIC_VALUE      20
COMPILER_TEXT       24
DEVELOPER_TEXT      37
INTENTIONAL          3
```

The consolidation established these release rules:

- English and Persian locale parity must remain clean.
- Canonical semantic metadata may remain English/locale-independent when a render-layer translation boundary supplies the active UI locale.
- Hair, Outfit and Variable Blueprint presentation metadata must be localized at render time without mutating semantic values.
- Blueprint defaults, compiler/Natural wording, token identities, prompt-facing semantic values and other semantic payloads remain locale-independent.
- Canonical module metadata can remain stable fallback/source data while module panels resolve matching i18n keys at render time.
- `scripts/localization-audit.mjs` is the broad inventory scanner; its raw hardcoded-candidate count is not itself an error count.
- `scripts/localization-review.mjs` classifies candidates into actionable, render-localized, semantic, compiler, developer and intentional groups.
- `pnpm locale:consolidate` is the release-facing verification command and must continue to enforce semantic-boundary safety and EN/FA parity.
- Do not reopen closed semantic stages merely to eliminate canonical English metadata that is already correctly localized at render time.

---

# Current global semantic precedents

The project now consistently uses these rules where applicable:

- minimum sufficient prompt semantics,
- explicit ownership and non-responsibilities,
- orthogonal fields instead of mega-selects,
- repeated/hierarchical entities when modifiers or children need independent identity,
- stable internal entity IDs separate from human semantic keys,
- lowerCamelCase human prompt-facing keys,
- globally unique external structural tokens where required,
- scoped local aliases inside owning module definitions,
- selective structural-token emission only when graph references require it,
- typed variables as semantic contracts rather than UI labels,
- target policy separate from shared assignment mechanics,
- capability-driven Color/Material target discovery,
- presets/Blueprints as editable state recipes rather than prompt semantics,
- `inherit` as a neutral baseline where appropriate,
- reference baseline plus explicit overrides,
- protected Natural serializers for structured/relational modules,
- Natural output as a readable serialization of the same prompt graph rather than graph flattening,
- blocking errors immediately visible while repetitive non-blocking warnings may be collapsed,
- semantic correctness evaluated separately from stochastic generation-model compliance.

---

# What is no longer a module-semantic-stage task

The following may still exist as normal engineering work without reopening semantic closure:

- legacy-state migration,
- future translation additions for genuinely new UI,
- cosmetic UI polish,
- blueprint/preset/catalog expansion,
- build/release verification,
- performance cleanup,
- ordinary bug fixes,
- warning text refinement,
- stochastic model-specific tuning that does not expose an ownership defect.

Existing items under `docs/prompt-semantics/review-backlog/` remain valid deferred work where applicable.

---

# Recommended next phase

There is currently no registered module that needs another speculative semantic rewrite, and there is no open localization-consolidation task.

The preferred sequence from this checkpoint is:

```text
1. review remaining concrete migration/integration backlog
2. run normal project generation/build/release validation
3. fix only reproducible integration defects
4. merge or otherwise integrate the semantic-refactor branch when ready
```

If a new module is added later, or a closed module exposes a real contract-level defect, use the canonical semantic-refactor workflow again starting with original-intent discovery and ownership definition.

If new UI is added later, extend EN/FA localization together and keep `pnpm locale:consolidate` clean rather than reopening this consolidation stage wholesale.

---

# Checkpoint rule

At this commit:

> **The current Prompt Draft module registry is semantically closed as a complete set, and localization consolidation is clean and closed.**

Future work should prefer integration, validation, migration, release work and product polish over reopening accepted module architectures or localization boundaries without concrete evidence.
