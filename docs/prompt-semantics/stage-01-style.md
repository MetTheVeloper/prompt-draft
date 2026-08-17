# Prompt Semantics Refactor — Stage 01: Style

## Goal

Make every Style field emit only the semantic signal owned by that field. The goal is removing semantic pollution, subject assumptions, and duplicated responsibilities.

## Compatibility decision

The internal field id `preset` is intentionally preserved in this stage because existing drafts and imported Prompt Draft JSON may already store that value.

For runtime semantics, this field is treated as an aesthetic anchor. Module-level presets remain recipes that populate Style fields.

A future data-model rename from `preset` to `aesthetic` should only happen with an explicit migration path.

## Stage 01 changes

- Aesthetic anchor text is subject-agnostic.
- Character, portrait, poster, editorial, studio, game, and similar assumptions are removed where they are not intrinsic to the selected aesthetic.
- Medium output removes generic quality adjectives where they add no medium information.
- Stylization describes transformation strength instead of assuming stylization always means exaggeration.
- Shape Language avoids leaking surface, contrast, or sculpture assumptions.
- Visual Treatment removes contextual assumptions such as sketchbook context from ink-and-watercolor treatment.
- Finish values describe finish only.

## Translation / UI follow-up

No locale files are modified in this stage so this branch stays isolated from the parallel language-expansion branch.

No new translation key is technically required yet because the persisted field id remains `preset`. When UI terminology is updated, these existing flat keys should be overwritten:

- `modules.style.fields.preset.label` → `Aesthetic`
- `modules.style.fields.preset.description` → `Choose the core visual aesthetic without defining the subject or output purpose.`
- `modules.style.fields.preset.placeholder` → `Select an aesthetic`

The existing `scripts/merge-i18n.ts` script supports overwriting existing flat keys later.

## Architecture note

`app/modules/style.semantic.ts` is a Stage 01 isolation layer. It derives the registered Style module from the existing definition and replaces only prompt semantics, leaving stored values, option ids, compatibility metadata, presets, and UI behavior intact. Once the semantic audit stabilizes, these prompt texts can be folded back into `style.module.ts` in a dedicated cleanup commit without changing behavior.
