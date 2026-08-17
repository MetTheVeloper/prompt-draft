# Prompt Semantics Refactor — Stage 01: Style

## Goal

Make every Style field emit only the semantic signal owned by that field. The goal is removing semantic pollution, subject assumptions, duplicated responsibilities, and hidden cross-field decisions.

## Core model

Style now separates two concepts that were previously mixed together:

- `StyleModule.presets` are UI/state recipes. They populate fields but never emit their own prompt text.
- `fields.aesthetic` is an optional semantic anchor. It contributes only the selected visual identity.

Prompt Draft draft/version migration is responsible for compatibility with older stored schemas; the new module model is not constrained by legacy field or option ids.

## Compile order

UI order and prompt order are now separate concerns.

Modules can define `compile.fieldOrder`, and the compiler uses that order before falling back to each field's UI `order`.

Style v2 compiles in this order:

1. `aesthetic`
2. `medium`
3. `stylizationLevel`
4. `shapeLanguage`
5. `visualTreatment`
6. `finish`
7. `extraDetails`

This keeps the semantic anchor and rendering medium early while leaving polish/detail signals later.

## Preset UI and lifecycle

Style presets are no longer rendered as a large chip list above the module.

The module opts into the generic inline preset UI:

```ts
presetUi: {
  component: "select",
  group: "core",
  order: 0,
  allowNone: true,
  resetOnNone: true,
}
```

The preset selector therefore appears inside **Core Style**, before Aesthetic and Medium.

Preset behavior:

- selecting a preset applies its field recipe;
- selecting `None` clears the active preset and resets normal fields to module defaults;
- changing any field that belongs to the active recipe automatically clears the active preset id while preserving the user's edited values;
- changing unrelated fields such as `extraDetails` does not invalidate a preset whose recipe fields still match.

This makes presets starting points rather than hidden owners of module state.

## Aesthetic catalog v2

The old subject-oriented aesthetic ids have been removed from the effective Style module. Examples of removed concepts include ids tied to `character`, `portrait`, `poster`, `editorial`, or `game character`.

The catalog is rebuilt around subject-agnostic visual identities. Current groups of available identities include:

- digital/stylized: 3D Cartoon, Anime, Low-Poly, Pixel Art, Cinematic CGI;
- handcrafted/material aesthetics: Claymation, Cut Paper, Paper Collage, Papier-Mâché, Plush Textile;
- graphic/design movements: Art Deco, Art Nouveau, Bauhaus, Swiss International Style, Mid-Century Modern, Constructivist, Memphis, Brutalist Graphic;
- print/drawing identities: Risograph, Woodcut, Linocut, Etching, Screen-Print Graphic, Ink Sketch, Marker Illustration;
- art movements: Pop Art, Op Art, Surrealist, Cubist, Expressionist, Impressionist, Fauvist, Pointillist;
- illustrative identities: Storybook, Gothic Illustration, Vintage Scientific Illustration, Folk Art, Ukiyo-e;
- additional broad identities: Cinematic Realism, Photo Realism, Retro Comic, Retro-Futurist, Psychedelic, Minimal Geometric.

Every aesthetic prompt text is intentionally concise and subject-agnostic. Detail such as shape, rendering treatment, finish, medium, lighting, framing, or palette belongs to the corresponding field/module.

## Other Style field cleanup

- Medium output removes generic quality adjectives where they add no medium information.
- Stylization describes transformation strength instead of assuming stylization always means exaggeration.
- Shape Language avoids leaking surface, contrast, or sculpture assumptions.
- Visual Treatment removes contextual assumptions such as sketchbook context from ink-and-watercolor treatment.
- Finish values describe finish only.

## Translation / UI keys

Locale files are intentionally not edited in this branch so the semantic refactor stays isolated from the parallel locale-expansion work.

New English flat keys are staged in:

`scripts/i18n-patches/en.style-semantics.ts`

The patch contains:

- `modules.style.fields.aesthetic.*`
- labels for the complete Aesthetic v2 catalog;
- labels/descriptions for the new subject-agnostic preset recipe ids.

Use the existing `scripts/merge-i18n.ts` script to materialize the flat patch into a locale file for local testing.

## Runtime architecture

`app/modules/style.semantic.ts` is currently the registered Style v2 definition. It reuses stable base field metadata from `style.module.ts` while replacing the semantic contract where needed:

- legacy aesthetic field is replaced by `aesthetic`;
- the Aesthetic catalog is rebuilt with new ids;
- preset recipes are rebuilt with subject-agnostic ids and values;
- Style defines its own compile field order;
- Style opts into inline preset dropdown UI;
- prompt text overrides keep each field single-responsibility.

Once Style v2 is validated, this isolation layer can be folded into the canonical `style.module.ts` without changing behavior.

## Manual test matrix

Test the same aesthetic against unrelated subjects. The Style output should describe visual identity without inventing the subject type.

Recommended subjects:

1. Character: `a small astronaut holding a red balloon`
2. Landscape: `a wide mountain valley with a river and pine trees`
3. Typography: `the word CREATE as the main visual subject`
4. Object: `a vintage desk lamp on a plain surface`

Recommended presets/aesthetics:

- Soft 3D Cartoon
- Handmade Clay
- Pixel Art
- Low-Poly
- Expressive Ink Sketch
- Plush Textile
- Cinematic CGI
- Art Deco Graphic
- Bauhaus Graphic
- Storybook Watercolor

For each test, verify:

- output order is `aesthetic → medium → stylization → shape → treatment → finish`;
- Style does not inject an unrelated subject type;
- manually editing a recipe field changes the preset selector to `None` without reverting the edit;
- reselecting a preset reapplies the recipe;
- selecting `None` resets Style fields to their defaults.
