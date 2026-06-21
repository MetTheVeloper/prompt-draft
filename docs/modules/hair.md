# Hair Module

## Purpose

The Hair module defines the hairstyle, hair color, and hair texture of the subject. It is responsible for describing the visible hair shape, length, styling, surface behavior, and optional color direction.

This module should answer questions like:

- What hairstyle should the subject have?
- Should the hair feel natural, clean, messy, slicked back, curly, flowing, fantasy-like, iconic, formal, sporty, or accessory-driven?
- What color should the hair use when a specific color is needed?
- What texture should the hair have?
- Should the hairstyle support a portrait, character design, fashion image, fantasy subject, poster, product mascot, or stylized illustration?

The Hair module should describe the hair only. It should not replace the Subject, Style, Texture, Outfit, Pose, Expression, or Color Palette modules.

---

## Source File

```txt
app/modules/hair.module.ts
```

Recommended documentation location:

```txt
docs/modules/hair.md
```

---

## Module Identity

```ts
key: "hair"
icon: "wind-2"
```

The `key` identifies the module across the registry, UI, draft state, i18n keys, and compiled prompt output.

The `icon` visually represents hair flow, movement, or wind-like strand direction in the UI.

---

## High-Level Structure

The module follows the standard `PromptKeyModule` shape:

```ts
export const HairModule: PromptKeyModule = {
  key,
  icon,
  groups,
  fields,
  compile,
}
```

The Hair module combines three core controls:

1. A categorized hairstyle selector.
2. A free color picker/input for hair color.
3. A simple hair texture selector.

It does not currently define a `presets` section.

---

## Groups

The Hair module uses three UI groups:

| Group | Role |
|---|---|
| `core` | Primary hairstyle, color, and texture controls. |
| `advanced` | Optional user-written hair details. |
| `override` | Full manual replacement for the module output. |

General pattern:

- `core` contains the structured hair controls.
- `advanced` allows extra hair notes without replacing structured fields.
- `override` allows a fully custom hair instruction.

---

## Fields Overview

| Field | Type | Group | Role |
|---|---:|---|---|
| `hairStyle` | select | `core` | Main categorized hairstyle direction. |
| `hairColor` | color | `core` | Optional specific hair color. |
| `hairTexture` | select | `core` | Optional texture or surface feel for the hair. |
| `extraDetails` | textarea | `advanced` | Adds custom hair-related notes. |
| `customText` | textarea | `override` | Replaces the module output when filled. |

---

## Field Logic

### `hairStyle`

`hairStyle` is the main structured field in this module.

It uses a categorized select, is searchable, clearable, and full width. This is useful because the hairstyle library covers natural, gender-coded, iconic, fantasy, stylized, and accessory-based directions.

This field should describe the overall hairstyle shape and styling logic.

Good hairstyle-level directions include:

- short clean hair
- medium natural hair
- long flowing hair
- messy casual hair
- slicked-back hair
- curly voluminous hair
- shaved or buzz-cut hair
- wind-blown hair
- bob cut
- twin tails
- fantasy glowing hair
- hair under a hat
- braided crown
- formal styled hair

Avoid using this field for face identity, outfit, pose, camera, lighting, full character design, or scene description unless the detail directly affects the hair.

### `hairColor`

`hairColor` is a color field, not an option list.

It lets the user assign a specific hair color directly. This is useful when the hairstyle should preserve the selected shape while changing or controlling the color.

Use this field for direct color choices such as:

- black
- blonde
- silver
- white
- red
- pink
- blue
- custom hex colors

This field should only describe hair color. Broader color systems should remain in the Color Palette module.

### `hairTexture`

`hairTexture` is a simple select field.

It is not categorized. Its options are generated from a compact list and mapped into prompt fragments like:

```txt
straight hair texture
wavy hair texture
curly hair texture
```

Current texture options include:

- straight
- wavy
- curly
- coily
- fluffy
- silky
- thick
- fine
- coarse
- glossy
- matte
- sculpted

Use this field for the physical or visual behavior of the hair surface and strand structure.

### `extraDetails`

`extraDetails` is additive.

Use it when the user wants a specific hair note that does not need a dedicated structured option yet.

Examples:

- “preserve the original hairline”
- “keep the hair out of the eyes”
- “make the bangs slightly asymmetrical”
- “add small loose strands around the face”
- “keep the hairstyle realistic, not fantasy-like”

This field should refine the selected hairstyle, color, or texture rather than replace them.

### `customText`

`customText` is the override field.

When filled, it replaces the normal compiled output for this module. This is useful when the hairstyle needs very specific instructions that cannot be built from the available fields.

---

## Options Strategy

The module uses two external option arrays:

```ts
const hairStyleOptions = [...]
const hairTextureOptions = [...]
```

### `hairStyleOptions`

Each hairstyle option generally includes:

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable value. |
| `category` | Machine-readable category id for grouping. |
| `categoryLabel` | Human-readable category label. |
| `promptText` | Text fragment used in compiled prompt output. |
| `tags` | Semantic tags for search, filtering, or future compatibility logic. |

### `hairTextureOptions`

The texture options are generated by mapping over a compact string list.

Each generated option includes:

| Property | Purpose |
|---|---|
| `value` | The texture value itself. |
| `promptText` | A generated text fragment in the form `{value} hair texture`. |
| `tags` | Shared tags for hair and texture. |

This makes texture options easy to maintain, but it also means every texture value should read naturally inside the generated prompt text.

---

## Hair Style Categories

The `hairStyleOptions` list is organized into broad hairstyle families.

| Category | Purpose |
|---|---|
| `general` | Common everyday hairstyles, lengths, natural shapes, and basic styling directions. |
| `boys_masculine` | Masculine-coded or short structured haircut directions. |
| `girls_feminine` | Feminine-coded styles such as bobs, bangs, ponytails, braids, buns, and long layered hair. |
| `iconic_celebrity_inspired` | Recognizable pop-culture, fashion, anime, rockstar, royal, model, or idol-inspired hair archetypes. |
| `fantasy_stylized` | Magical, surreal, creature-like, toy-like, sculptural, exaggerated, or impossible hair designs. |
| `hair_styling_accessories` | Hairstyles shaped by accessories, headwear, clips, ornaments, scarves, hats, or formal styling. |

When adding new hairstyle options, place them inside an existing category whenever possible. Add a new category only when the new hairstyle family represents a reusable hair direction that does not fit the current structure.

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

Because the compiler combines selected field output directly, every hairstyle and texture `promptText` should be concise, reusable, and focused on hair only.

---

## Writing New Hair Style Options

When adding a new hairstyle option:

1. Add it to `hairStyleOptions`.
2. Use a stable snake_case `value`.
3. Assign it to the correct `category`.
4. Use the matching `categoryLabel`.
5. Write a clear `promptText`.
6. Add useful semantic `tags`.
7. Add i18n keys if the UI expects translated labels and descriptions.
8. Avoid near-duplicate hairstyles unless the new option produces a meaningfully different silhouette or styling behavior.

Recommended `promptText` style:

- Describe the hairstyle shape clearly.
- Mention length, volume, direction, silhouette, or styling behavior when useful.
- Keep the wording reusable across realistic, stylized, human, character, and fantasy subjects.
- Avoid camera, lighting, background, outfit, or pose instructions.
- Avoid turning the hairstyle into a full character description.
- Avoid adding cultural, identity, or nationality assumptions unless the option explicitly requires a neutral style archetype already present in the design system.

---

## Writing New Hair Texture Options

When adding a new texture option:

1. Add the new value to the texture string list.
2. Make sure it reads naturally inside `{value} hair texture`.
3. Keep the value short and reusable.
4. Avoid values that already belong more strongly to hairstyle, color, material, or effects.

Good texture values are simple adjectives such as:

```txt
straight
wavy
curly
silky
coarse
glossy
matte
```

Avoid texture values that describe a full hairstyle, outfit accessory, or global visual style.

---

## When to Add a New Field Instead of a New Option

Add a new option when the idea is another hairstyle or hair texture.

Add a new field only when the idea represents a reusable independent axis of hair control.

A new Hair field may be justified for controls such as:

- hair length
- bangs or fringe presence
- hair volume
- hair movement
- hair color strictness
- preserve original hairstyle
- preserve original hairline
- accessory type
- fantasy intensity

However, avoid overcomplicating the module unless the UI needs more granular control. The current module intentionally keeps hair simple: one hairstyle selector, one color field, one texture selector, optional extra details, and an override.

---

## Relationship With Other Modules

The Hair module should focus on hair only.

It should avoid taking over responsibilities from other modules:

| Responsibility | Better Module |
|---|---|
| Face identity or subject identity | Subject / image-to-image reference settings |
| Global art direction | Style |
| Material and surface behavior outside hair | Texture |
| Clothing and accessories not attached to hair | Outfit |
| Body pose or gesture | Pose |
| Facial emotion | Expression |
| Shape or anatomy distortion | Deformation |
| Scene or environment | Background |
| Light setup and illumination | Lighting |
| Color system beyond hair | Color Palette |
| Camera/lens/capture behavior | Camera |
| Crop and composition | Framing |
| Post-processing or overlays | Effects |

Some overlap is natural. For example, glossy hair can relate to texture, wind-blown hair can relate to motion, and hair accessories can overlap with outfit. Still, this module should describe the hair itself, while other modules describe the rest of the image.

---

## Hair vs Style

The Style module defines the global visual language.

The Hair module defines the subject's hairstyle.

For example:

```txt
Style: bold anime cover illustration
Hair: long flowing hair with soft wave patterns and readable grouped strands
```

The style controls rendering. The hair module controls the hairstyle.

---

## Hair vs Texture

The Texture module defines material and surface behavior across the image.

The Hair module can define hair texture specifically.

For example:

```txt
Texture: soft matte clay material
Hair: sculpted hair texture with clean grouped shapes
```

The Texture module may affect the whole render surface. The Hair module describes only the hair's visible strand or shape behavior.

---

## Hair vs Outfit

The Outfit module defines clothing and wearable accessories.

The Hair module can include hair-specific accessories when they directly shape the hairstyle.

For example:

```txt
Outfit: futuristic streetwear jacket
Hair: hair with decorative clips and controlled face-framing strands
```

If the accessory is primarily worn as clothing, use Outfit. If it directly affects the hairstyle, Hair can describe it.

---

## i18n Notes

The module key is `hair`, so related labels usually follow a pattern like:

```txt
modules.hair.*
```

Common i18n areas:

```txt
modules.hair.title
modules.hair.description
modules.hair.groups.*
modules.hair.fields.*
modules.hair.options.*
```

When adding new options, make sure the English and Persian locale files receive matching keys if option labels or descriptions are translated in the UI.

---

## Design Rule of Thumb

The Hair module defines what the hair looks like.

A good Hair module output sounds like:

```txt
the hair must be long and flowing. Create soft length, graceful movement, readable strands or grouped shapes, and a natural sense of motion or elegance around the subject, wavy hair texture
```

or:

```txt
the hair must be slicked back. Keep the hair swept away from the face, controlled in shape, polished in styling, and visually clean with a confident refined appearance, glossy hair texture
```

A bad Hair module output sounds like:

```txt
a woman standing in a neon alley, wearing a leather jacket, lit by a blue rim light, shot with an 85mm lens
```

That belongs to subject, background, outfit, lighting, and camera modules, not Hair.

---

## Checklist for Future Hair Module Changes

Before committing changes, check:

- The new hairstyle belongs to the correct category.
- The `value` is stable and snake_case.
- The `category` and `categoryLabel` are consistent.
- The `promptText` describes hair only.
- Tags are useful and consistent.
- Similar existing hairstyles were checked to avoid duplication.
- Texture values read naturally in the generated `{value} hair texture` prompt text.
- `hairColor` remains focused on hair color only.
- `extraDetails` remains additive.
- `customText` still works as the override field.
- Empty values do not produce awkward compiled output.
- New i18n keys exist in both locales when needed.
- The module still satisfies `PromptKeyModule`.
