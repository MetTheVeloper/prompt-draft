# Prompt Semantics Refactor — Stage 01: Style

## Goal

Make every Style field emit only the semantic signal owned by that field. The goal is removing semantic pollution, subject assumptions, duplicated responsibilities, and hidden cross-field decisions.

The guiding rule is **minimum sufficient semantics**: every selected field should contribute useful visual information, but no field should guess the subject, output purpose, camera, lighting, color palette, texture, structural form, or another module's responsibility.

> Stage 02 later moved `Shape Language` out of Style and into the independent `Form` module. This document reflects that final boundary.

## Data-model decision

The Style field previously named `preset` is now a first-class `aesthetic` field.

Module-level presets and field-level aesthetics are different concepts:

- `StyleModule.presets` are state recipes that populate Style fields.
- `fields.aesthetic` is an optional semantic anchor that contributes a visual-style identity to the prompt.

Preset recipes populate fields; they do not generate an independent description of their own.

Prompt Draft draft/version migration is responsible for compatibility with older stored schemas. The new module model is not constrained by legacy field names or option ids.

## Final Style semantic dimensions

Style uses these independent dimensions:

1. **Aesthetic** — recognizable visual identity or art/design language.
2. **Medium** — production or rendering medium.
3. **Stylization Level** — how strongly the rendering departs from a literal treatment.
4. **Linework** — character of visible drawn/defined lines.
5. **Visual Treatment** — rendering or mark-making treatment applied to forms and tones.
6. **Detail Level** — visual detail density, independent of composition and subject complexity.
7. **Finish** — final polish and surface-reflection character.
8. **Extra Details** — free-form user additions.

`Linework` and `Detail Level` fill real semantic gaps without taking ownership from another module.

Structural geometry is intentionally outside Style:

- form language / proportions / deformation → Form
- color decisions → Color Palette
- texture/material surface detail → Texture
- illumination → Lighting
- lens/viewpoint → Camera
- crop/composition → Framing/Layout
- subject-specific content → subject-related modules

## Medium cleanup

The Medium catalog is limited to production/rendering media. Context-specific options such as studio/outdoor/macro photography, game assets, collectible figures, fabric dolls, and other subject/purpose assumptions are not generic Style media.

Subject-agnostic physical/craft media include:

- woodblock print
- hand-modeled clay
- ceramic artwork
- hand-modeled plasticine
- papier-mâché craft
- textile craft
- plush textile craft

This allows those media to apply to a character, landscape, object, typography, or abstract subject without forcing the subject into a predefined object category.

## Field-level cleanup

- `Stylization Level` does not assume stylization always means anatomical exaggeration.
- `Linework` owns line character instead of hiding it inside an aesthetic description.
- `Visual Treatment` does not own generic texture or structural form.
- `Detail Level` owns minimal/simplified/balanced/intricate/dense detail density.
- `Finish` describes actual final polish/sheen behavior instead of vague quality labels such as premium or graphic.
- Style no longer contains `Shape Language`; that responsibility belongs to Form.

## Preset rule: minimum sufficient configuration

A preset must not fill every Style field simply because the field exists.

A preset sets only signals intrinsic or strongly expected for that recipe. All other Style semantic fields are reset to empty when the preset is applied so switching presets cannot leave stale values behind.

### Pixel Art

Sets only:

- aesthetic: `pixel_art`
- medium: `pixel_art_digital`

It does not automatically force stylization level, form language, detail density, or finish.

### Photo Realism

Sets only:

- aesthetic: `photo_realism`
- medium: `photography`

It does not inject stylization, form, or finish assumptions.

### Ukiyo-e Print

Sets:

- aesthetic: `ukiyo_e`
- medium: `woodblock_print`
- linework: `clean_contour`

### Soft 3D Cartoon

Sets:

- aesthetic: `3d_cartoon`
- medium: `three_d_render`
- visual treatment: `cel_shaded`

It does not force Soft Rounded Form; the Form module owns that decision.

## Preset UI behavior

Style presets are displayed as a dropdown inside `Core Style` instead of a large chip wall.

- `None` is available at the beginning of the dropdown.
- selecting a preset applies its recipe.
- Style semantic fields not owned by that recipe are cleared, preventing stale values from another preset.
- manually changing a Style semantic field after applying a preset makes the active preset state become `None`.
- `Extra Details` remains user-controlled.

## Compile order

UI order and prompt order are separate concepts.

Style declares its prompt order explicitly:

1. aesthetic
2. medium
3. stylization level
4. linework
5. visual treatment
6. detail level
7. finish
8. extra details

This is implemented through `ModuleCompileConfig.fieldOrder` and does not require the UI layout to mirror prompt order.

## Translation / UI keys

Locale files are intentionally not edited directly in this branch so the semantic refactor stays isolated from the parallel locale-expansion work.

English flat keys are staged in:

```text
scripts/i18n-patches/en.style-semantics.ts
```

## Runtime architecture

`app/modules/style.semantic.ts` currently acts as the registered Style v2 definition. It isolates the semantic refactor while output tests are active.

Once the semantic model has passed validation, it can be folded into the canonical `style.module.ts` without changing runtime behavior.

For the Style/Form boundary and subject-aware Form controls, see:

```text
docs/prompt-semantics/stage-02-style-form-boundary.md
```
