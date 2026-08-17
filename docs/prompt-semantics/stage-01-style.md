# Prompt Semantics Refactor — Stage 01: Style

## Goal

Make every Style field emit only the semantic signal owned by that field. The goal is removing semantic pollution, subject assumptions, duplicated responsibilities, and hidden cross-field decisions.

## Data-model decision

The Style field previously named `preset` is now a first-class `aesthetic` field.

This is intentional. Module-level presets and field-level aesthetics are different concepts:

- `StyleModule.presets` are recipes that populate Style fields.
- `fields.aesthetic` is an optional semantic anchor that contributes a visual-style identity to the prompt.

Preset recipes now populate `aesthetic` instead of a field named `preset`.

Prompt Draft draft/version migration is responsible for compatibility with older stored schemas; the new module model is not constrained by the legacy field name.

## Stage 01 changes

- Aesthetic text is subject-agnostic.
- Character, portrait, poster, editorial, studio, game, and similar assumptions are removed where they are not intrinsic to the selected aesthetic.
- Medium output removes generic quality adjectives where they add no medium information.
- Stylization describes transformation strength instead of assuming stylization always means exaggeration.
- Shape Language avoids leaking surface, contrast, or sculpture assumptions.
- Visual Treatment removes contextual assumptions such as sketchbook context from ink-and-watercolor treatment.
- Finish values describe finish only.
- Module presets remain state recipes and do not own a second independent prompt description.

## Translation / UI keys

Locale files are intentionally not edited in this branch so the semantic refactor stays isolated from the parallel locale-expansion work.

New English flat keys are staged in:

`scripts/i18n-patches/en.style-semantics.ts`

The important new key namespace is:

`modules.style.fields.aesthetic.*`

Use the existing merge script when you want to materialize those keys into a locale file.

## Runtime architecture

`app/modules/style.semantic.ts` currently acts as the registered Style v2 definition. It derives reusable option metadata from the existing Style module, but changes the effective runtime contract:

- `preset` field is removed from the registered module.
- `aesthetic` field is added.
- all module preset recipes are migrated to populate `aesthetic`.
- promptText values are replaced with subject-agnostic, single-responsibility semantics.

This isolation layer makes the behavior easy to review while the Style semantic model is being validated. Once accepted, it can be folded into the canonical `style.module.ts` without changing runtime behavior.

## Manual test matrix

Test the same aesthetic against unrelated subjects. The Style output should describe the visual treatment without inventing the subject type.

Recommended subjects:

1. Character: `a small astronaut holding a red balloon`
2. Landscape: `a wide mountain valley with a river and pine trees`
3. Typography: `the word CREATE as the main visual subject`
4. Object: `a vintage desk lamp on a plain surface`

Recommended aesthetics:

- 3D Cartoon
- Claymation / Clay
- Pixel Art
- Low-Poly Geometric
- Ink Sketch
- Plush Textile
- Cinematic CGI

For each test, inspect the modular output and verify that Style does not inject `character`, `portrait`, `game`, `poster`, `studio`, anatomy, or another unrelated subject assumption unless that information was explicitly selected elsewhere.
