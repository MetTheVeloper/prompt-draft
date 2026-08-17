# Prompt Semantics Refactor — Stage 01: Style

## Goal

Make every Style field emit only the semantic signal owned by that field. The goal is removing semantic pollution, subject assumptions, duplicated responsibilities, and hidden cross-field decisions.

The guiding rule is **minimum sufficient semantics**: every selected field should contribute useful visual information, but no field should guess the subject, output purpose, camera, lighting, color palette, texture, or another module's responsibility.

## Data-model decision

The Style field previously named `preset` is now a first-class `aesthetic` field.

Module-level presets and field-level aesthetics are different concepts:

- `StyleModule.presets` are state recipes that populate Style fields.
- `fields.aesthetic` is an optional semantic anchor that contributes a visual-style identity to the prompt.

Preset recipes populate `aesthetic`; they do not generate an independent description of their own.

Prompt Draft draft/version migration is responsible for compatibility with older stored schemas. The new module model is not constrained by legacy field names or option ids.

## Style semantic dimensions

Style v2 currently uses these independent dimensions:

1. **Aesthetic** — the recognizable visual identity or art/design language.
2. **Medium** — the production or rendering medium.
3. **Stylization Level** — how far visual forms are transformed away from a literal treatment.
4. **Shape Language** — the geometry and contour behavior of forms.
5. **Linework** — the character of visible drawn/defined lines.
6. **Visual Treatment** — the rendering or mark-making treatment applied to forms and tones.
7. **Detail Level** — visual detail density, independent of composition and subject complexity.
8. **Finish** — final polish and surface-reflection character.
9. **Extra Details** — free-form user additions.

`Linework` and `Detail Level` were added after auditing the original field set. They fill real semantic gaps without taking ownership from another module.

The following intentionally remain outside Style:

- color decisions → Color Palette
- texture/material surface detail → Texture
- illumination → Lighting
- lens/viewpoint → Camera
- crop/composition → Framing/Layout
- subject-specific anatomy/content → subject-related modules

## Medium cleanup

The Medium catalog was narrowed to production/rendering media. Context-specific options such as studio/outdoor/macro photography, game assets, collectible figures, fabric dolls, and plush toys are not treated as generic media in Style v2.

New subject-agnostic physical/craft media include:

- woodblock print
- hand-modeled clay
- ceramic artwork
- hand-modeled plasticine
- papier-mâché craft
- textile craft
- plush textile craft

This lets a user apply those media to a character, landscape, object, typography, or abstract subject without forcing the subject into a predefined object category.

## Field-level cleanup

- `Stylization Level` no longer assumes stylization always means exaggeration.
- `Shape Language.blocky` now describes squared geometry rather than 3D volumetric masses.
- `Shape Language` gained `irregular` and `faceted` for genuinely distinct form languages.
- `Visual Treatment` no longer contains generic texture ownership or detail-density ownership.
- `Detail Level` now owns minimal/simplified/balanced/intricate/dense detail density.
- `Finish` no longer uses `premium` or `graphic` as pseudo-finishes; it describes actual final polish/sheen behavior.

## Preset rule: minimum sufficient configuration

A preset must not fill every Style field just because the field exists.

A preset should set only signals that are intrinsic or strongly expected for that recipe. All other semantic fields are explicitly reset to empty when a preset is applied so switching presets cannot leave stale decisions from the previous recipe.

Examples:

### Pixel Art

Sets only:

- aesthetic: `pixel_art`
- medium: `pixel_art_digital`

It does **not** automatically force strong stylization, blocky shape language, minimal detail, or a graphic finish because pixel art can legitimately vary on all of those dimensions.

### Photo Realism

Sets only:

- aesthetic: `photo_realism`
- medium: `photography`

It does not inject a stylization level or finish.

### Ukiyo-e Print

Sets:

- aesthetic: `ukiyo_e`
- medium: `woodblock_print`
- linework: `clean_contour`

It no longer uses ink-and-wash as a substitute for woodblock printing.

### Soft 3D Cartoon

Sets:

- aesthetic: `3d_cartoon`
- medium: `three_d_render`
- shape language: `soft_rounded`
- visual treatment: `cel_shaded`

It does not force a generic quality adjective, subject type, or unrelated finish.

## Preset UI behavior

Style presets are displayed as a dropdown inside `Core Style` instead of a large chip wall.

- `None` is available at the beginning of the dropdown.
- selecting a preset applies its recipe.
- all Style semantic fields not owned by that recipe are cleared, preventing stale values from another preset.
- manually changing any semantic field after applying a preset makes the active preset state become `None`.
- `Extra Details` is not part of preset matching and can remain user-controlled.

## Compile order

UI order and prompt order are now separate concepts.

Style declares its prompt order explicitly:

1. aesthetic
2. medium
3. stylization level
4. shape language
5. linework
6. visual treatment
7. detail level
8. finish
9. extra details

This is implemented through `ModuleCompileConfig.fieldOrder` and does not require the UI layout to mirror prompt order.

## Translation / UI keys

Locale files are intentionally not edited directly in this branch so the semantic refactor stays isolated from the parallel locale-expansion work.

English flat keys are staged in:

`scripts/i18n-patches/en.style-semantics.ts`

Use the existing merge script to materialize them into a locale file.

## Runtime architecture

`app/modules/style.semantic.ts` currently acts as the registered Style v2 definition. It isolates the semantic refactor while tests are still active.

Once Style v2 has passed the semantic/output tests, the semantic definition can be folded into the canonical `style.module.ts` in a cleanup commit without changing behavior.

## Manual test matrix

Test the same preset against unrelated subjects. Style output should remain valid without inventing the subject type.

Recommended subjects:

1. Character: `a small astronaut holding a red balloon`
2. Landscape: `a wide mountain valley with a river and pine trees`
3. Typography: `the word CREATE as the main visual subject`
4. Object: `a vintage desk lamp on a plain surface`

Priority presets:

- Soft 3D Cartoon
- Pixel Art
- Photo Realism
- Ukiyo-e Print
- Crafted Paper Collage
- Handmade Clay
- Plush Textile
- Retro Comic Pop

For each test, inspect the modular output and verify that Style does not inject `character`, `portrait`, `game`, `poster`, `studio`, `macro`, anatomy, camera behavior, lighting, palette, or another unrelated assumption unless explicitly selected elsewhere.
