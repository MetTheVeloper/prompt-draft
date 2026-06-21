# Outfit Module

## Purpose

The Outfit module defines the clothing, costume, wearable style, and major outfit direction of the subject. It is responsible for describing what the subject wears and how the clothing supports the visual concept.

This module should answer questions like:

- What kind of outfit should the subject wear?
- Should the clothing feel casual, sporty, formal, luxury, festive, traditional, cute, elegant, heroic, fantasy, sci-fi, or costume-like?
- Should the outfit support a portrait, character design, poster, fashion image, product mascot, fantasy scene, or cinematic concept?
- Should the clothing be simple and readable or more decorative and concept-driven?

The Outfit module should describe clothing and wearable styling only. It should not replace the Style, Texture, Hair, Pose, Expression, Color Palette, or Background modules.

---

## Source File

```txt
app/modules/outfit.module.ts
```

Recommended documentation location:

```txt
docs/modules/outfit.md
```

---

## Module Identity

```ts
key: "outfit"
icon: "clipboard"
```

The `key` identifies the module across the registry, UI, draft state, i18n keys, and compiled prompt output.

The `icon` visually represents outfit planning, wardrobe selection, or checklist-like styling in the UI.

---

## High-Level Structure

The module follows the standard `PromptKeyModule` shape:

```ts
export const OutfitModule: PromptKeyModule = {
  key,
  icon,
  groups,
  fields,
  compile,
}
```

The Outfit module is intentionally simple. It uses one categorized outfit selector plus optional additive and override text areas.

It does not currently define a `presets` section.

---

## Groups

The Outfit module uses three UI groups:

| Group | Role |
|---|---|
| `core` | Primary outfit style selection. |
| `advanced` | Optional user-written outfit details. |
| `override` | Full manual replacement for the module output. |

General pattern:

- `core` defines the main clothing or costume direction.
- `advanced` allows extra outfit notes without replacing the structured choice.
- `override` allows a fully custom outfit instruction.

---

## Fields Overview

| Field | Type | Group | Role |
|---|---:|---|---|
| `outfitStyle` | select | `core` | Main categorized outfit or costume direction. |
| `extraDetails` | textarea | `advanced` | Adds custom outfit-related notes. |
| `customText` | textarea | `override` | Replaces the module output when filled. |

---

## Field Logic

### `outfitStyle`

`outfitStyle` is the main structured field in this module.

It uses a categorized select, is searchable, clearable, and full width. This is useful because the outfit list covers general clothing, gender-coded styling buckets, and costume/fantasy directions.

This field should describe the subject's clothing direction.

Good outfit-level directions include:

- casual everyday outfit
- sporty active outfit
- formal elegant outfit
- luxury high-end outfit
- festive outfit
- traditional or ethnic-inspired outfit
- hoodie and jeans
- elegant dress
- superhero costume
- fantasy warrior costume
- sci-fi space suit
- medieval knight costume

Avoid using this field for hair, facial expression, body pose, camera, lighting, full background, or global art style unless the detail directly affects the clothing.

### `extraDetails`

`extraDetails` is additive.

Use it when the user wants a specific outfit note that does not need a dedicated structured option yet.

Examples:

- “keep the outfit close to the original reference”
- “avoid logos or readable brand names”
- “make the clothing practical rather than decorative”
- “add small gold accessories”
- “make the fabric look heavier and structured”

This field should refine the selected outfit style rather than replace it.

### `customText`

`customText` is the override field.

When filled, it replaces the normal compiled output for this module. This is useful when the outfit needs very specific clothing instructions that cannot be built from the available option list.

---

## Options Strategy

The module uses one external option array:

```ts
const outfitStyleOptions = [...]
```

Each option generally includes:

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable value. |
| `category` | Machine-readable category id for grouping. |
| `categoryLabel` | Human-readable category label. |
| `promptText` | Text fragment used in compiled prompt output. |
| `tags` | Semantic tags for search, filtering, or future compatibility logic. |

The current module contains a compact outfit library. It favors broad reusable outfit directions over very specific garment-level controls.

---

## Outfit Categories

The `outfitStyleOptions` list is organized into four broad categories.

| Category | Purpose |
|---|---|
| `general` | Broad everyday, sporty, formal, luxury, festive, and traditional clothing directions. |
| `boys` | Masculine-coded or boy-oriented outfit directions such as casual, formal, sporty, or hoodie-and-jeans looks. |
| `girls` | Feminine-coded or girl-oriented outfit directions such as casual, elegant, cute dress, or party dress looks. |
| `costume` | Character, fantasy, superhero, wizard, princess, sci-fi, and medieval costume directions. |

When adding new outfit options, place them inside an existing category whenever possible. Add a new category only when the new family represents a reusable clothing direction that does not fit the current structure.

---

## Compile Behavior

The compile section is:

```ts
compile: {
  separator: ", ",
  removeDuplicates: true,
  ignoreEmpty: true,
  overrideField: "customText",
}
```

Meaning:

- Selected prompt fragments are joined with `, `.
- Duplicate fragments are removed.
- Empty fields are ignored.
- `customText` overrides the structured output when filled.

Because the compiler combines selected field output directly, every `promptText` should be concise, reusable, and focused on outfit only.

---

## Writing New Outfit Options

When adding a new outfit option:

1. Add it to `outfitStyleOptions`.
2. Use a stable snake_case `value`.
3. Assign it to the correct `category`.
4. Use the matching `categoryLabel`.
5. Write a clear `promptText`.
6. Add useful semantic `tags`.
7. Add i18n keys if the UI expects translated labels and descriptions.
8. Avoid near-duplicate outfit options unless the new option produces a meaningfully different clothing direction.

Recommended `promptText` style:

- Describe the outfit type and clothing behavior clearly.
- Mention structure, fit, silhouette, decoration level, function, or concept when useful.
- Keep the wording reusable across realistic, stylized, human, character, and fantasy subjects.
- Avoid camera, lighting, background, pose, facial expression, or hair instructions.
- Avoid turning the outfit option into a full character or scene description.
- Avoid brand names unless the project intentionally supports branded fashion references.

---

## When to Add a New Field Instead of a New Option

Add a new option when the idea is another outfit style, clothing archetype, or costume direction.

Add a new field only when the idea represents a reusable independent axis of outfit control.

A new Outfit field may be justified for controls such as:

- outfit formality
- outfit complexity
- clothing fit
- fabric weight
- accessory level
- armor level
- preserve original outfit
- color strictness
- gender-neutral styling
- realism versus fantasy costume intensity

However, avoid overcomplicating the module unless the UI needs more granular control. The current module intentionally keeps outfit simple: one outfit selector, optional extra details, and an override.

---

## Relationship With Other Modules

The Outfit module should focus on clothing and wearable styling only.

It should avoid taking over responsibilities from other modules:

| Responsibility | Better Module |
|---|---|
| Global art direction | Style |
| Material and surface finish | Texture |
| Hair style, hair color, and hair accessories | Hair |
| Body pose or gesture | Pose |
| Facial emotion | Expression |
| Scene or environment | Background |
| Light setup and illumination | Lighting |
| Camera/lens/capture behavior | Camera |
| Crop and composition | Framing |
| Color system beyond clothing | Color Palette |
| Shape or anatomy distortion | Deformation |
| Post-processing or overlays | Effects |

Some overlap is natural. For example, clothing may imply material, color, or character archetype. Still, the Outfit module should describe what is worn, while other modules describe rendering, color strategy, lighting, pose, and environment.

---

## Outfit vs Style

The Style module defines the global visual language.

The Outfit module defines the clothing worn by the subject.

For example:

```txt
Style: cinematic realistic portrait style
Outfit: formal elegant outfit with structured clothing and polished details
```

The style controls rendering. The outfit controls clothing.

---

## Outfit vs Texture

The Texture module defines material and surface behavior.

The Outfit module may mention broad fabric or clothing quality, but detailed material handling should stay in Texture.

For example:

```txt
Outfit: luxury high-end outfit with refined clothing design
Texture: velvet fabric texture with soft directional nap and rich tactile surface
```

The outfit defines the clothing concept. The texture defines the surface behavior.

---

## Outfit vs Hair

The Hair module defines hairstyle and hair-specific accessories.

The Outfit module defines clothing and wearable accessories.

For example:

```txt
Hair: braided crown hairstyle with decorative hair clips
Outfit: formal elegant outfit with polished ceremonial clothing
```

If an accessory primarily affects the hair shape, use Hair. If it belongs to the clothing or wearable styling system, use Outfit.

---

## Outfit vs Color Palette

The Color Palette module defines the overall color system.

The Outfit module may mention outfit type but should avoid managing full color strategy unless the clothing direction requires it.

For example:

```txt
Color Palette: black and gold luxury palette
Outfit: luxury high-end outfit with refined fabrics and polished design
```

The palette controls color logic. The outfit controls clothing logic.

---

## i18n Notes

The module key is `outfit`, so related labels usually follow a pattern like:

```txt
modules.outfit.*
```

Common i18n areas:

```txt
modules.outfit.title
modules.outfit.description
modules.outfit.groups.*
modules.outfit.fields.*
modules.outfit.options.*
```

When adding new options, make sure the English and Persian locale files receive matching keys if option labels or descriptions are translated in the UI.

---

## Design Rule of Thumb

The Outfit module defines what the subject wears.

A good Outfit module output sounds like:

```txt
the outfit must feel formal and elegant. Use structured clothing, polished details, and clean readable style suitable for professional or ceremonial purposes.
```

or:

```txt
the outfit must be a sci-fi space suit. Use futuristic suit panels, technical seams, protective gear details, and readable space-exploration design.
```

A bad Outfit module output sounds like:

```txt
a person standing in a neon city, smiling, shot with a wide-angle camera and dramatic blue lighting
```

That belongs to subject, background, expression, camera, and lighting modules, not Outfit.

---

## Checklist for Future Outfit Module Changes

Before committing changes, check:

- The new option belongs to the correct category.
- The `value` is stable and snake_case.
- The `category` and `categoryLabel` are consistent.
- The `promptText` describes clothing, costume, or wearable styling only.
- Tags are useful and consistent.
- Similar existing outfit options were checked to avoid duplication.
- The option stays reusable across realistic, stylized, human, character, and fantasy outputs when possible.
- `extraDetails` remains additive.
- `customText` still works as the override field.
- Empty values do not produce awkward compiled output.
- New i18n keys exist in both locales when needed.
- The module still satisfies `PromptKeyModule`.
