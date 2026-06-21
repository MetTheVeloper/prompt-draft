# Color Palette Module

## Purpose

The Color Palette module defines the color system of the generated prompt. It is responsible for describing the overall palette direction and, when needed, assigning specific colors to specific parts of the subject, scene, or design.

This module should answer questions like:

- What color mood should the output follow?
- Should the image feel monochrome, pastel, cinematic, neon, luxury, natural, playful, or brand-like?
- Are there specific color assignments for important parts of the image?
- Should the palette support a poster, product image, portrait, character design, or graphic composition?

The Color Palette module should guide color usage across the image without replacing the Style, Lighting, Background, Texture, or Subject description.

---

## Source File

```txt
app/modules/colorPalette.module.ts
```

Recommended documentation location:

```txt
docs/modules/colorPalette.md
```

---

## Module Identity

```ts
key: "colorPalette"
icon: "color-swatch"
```

The `key` uses camelCase rather than a simple lowercase word. This is important because the same key is used across the registry, UI, draft state, i18n keys, and compiled prompt output.

The `icon` visually represents the module in the UI.

---

## High-Level Structure

The module follows the standard `PromptKeyModule` shape:

```ts
export const ColorPaletteModule: PromptKeyModule = {
  key,
  icon,
  groups,
  fields,
  compile,
}
```

The Color Palette module is slightly different from many other modules because its main field uses a custom `colorAssignments` field type instead of a normal select.

It does not currently define a `presets` section. Instead, it provides a reusable categorized palette library inside the `colorAssignments` field.

---

## Groups

The Color Palette module uses three UI groups:

| Group | Role |
|---|---|
| `core` | Main palette assignment interface. |
| `advanced` | Optional user-written color details. |
| `override` | Full manual replacement for the module output. |

General pattern:

- `core` contains the structured palette assignment field.
- `advanced` allows extra color notes without replacing structured data.
- `override` allows a fully custom color instruction.

---

## Fields Overview

| Field | Type | Group | Role |
|---|---:|---|---|
| `paletteAssignments` | `colorAssignments` | `core` | Main structured color palette and color assignment control. |
| `extraDetails` | textarea | `advanced` | Adds optional color-related notes. |
| `customText` | textarea | `override` | Replaces the module output when filled. |

---

## Field Logic

### `paletteAssignments`

`paletteAssignments` is the main field of this module.

It uses the custom field type:

```ts
type: "colorAssignments"
```

and the UI component:

```ts
component: "colorAssignments"
```

This field is designed for more than a simple single-choice palette. It can support palette selection and assignment-style color behavior, where selected palette ideas may be connected to parts of the image.

Its default value is an empty array:

```ts
default: []
```

This means the module can start with no palette assignments and only contribute output when the user adds color information.

Use this field for broad palette direction and structured color assignments.

Good examples of color-level direction:

- monochrome black and white palette
- teal and orange cinematic palette
- gold and black luxury palette
- cyber blue and magenta palette
- forest green and earth tone palette
- toy-like primary color palette

Avoid using this field for lighting setup, material texture, camera style, pose, outfit structure, or background layout unless the color instruction specifically applies to those areas.

### `extraDetails`

`extraDetails` is additive.

Use it when the user wants a color-specific note that does not need a dedicated structured palette option yet.

Examples:

- “keep the background darker than the subject”
- “use the accent color only in small details”
- “avoid pure white except for highlights”
- “make the palette feel print-friendly”

This field should enhance the selected palette assignments rather than replace them.

### `customText`

`customText` is the override field.

When filled, it replaces the normal compiled output for this module. This is useful when the color system needs a very specific custom instruction or when the structured assignment interface is not enough.

---

## Options Strategy

The module uses one external option array:

```ts
const colorPaletteAssignmentsOptions = [...]
```

Each option generally includes:

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable value. |
| `category` | Machine-readable category id for grouping. |
| `categoryLabel` | Human-readable category label. |
| `promptText` | Text fragment used in compiled prompt output. |
| `tags` | Semantic tags for search, filtering, or future compatibility logic. |

The current design favors broad reusable palette families instead of many narrow single-color controls.

---

## Palette Categories

The `colorPaletteAssignmentsOptions` list is organized into broad palette categories.

| Category | Purpose |
|---|---|
| `general` | Balanced, common, flexible palettes such as monochrome, grayscale, pastel, earthy, or cool muted palettes. |
| `cinematic` | Film-like palette systems such as teal/orange, desaturated cinema, moody blue-gray, or golden sunset. |
| `neon_stylized` | High-energy stylized palettes such as neon, cyberpunk, electric, and vivid pop combinations. |
| `luxury` | Premium and elegant palettes such as gold/black, ivory/champagne, emerald/gold, or burgundy. |
| `nature` | Organic palettes inspired by forests, oceans, deserts, and autumn foliage. |
| `candy_playful` | Sweet, toy-like, colorful, playful, and bright palette systems. |

When adding new palette options, place them inside an existing category whenever possible. Add a new category only when the palette family represents a reusable color direction that does not fit the current structure.

---

## Compile Behavior

The compile section is:

```ts
compile: {
  separator: ", ",
  removeDuplicates: true,
  overrideField: "customText",
}
```

Meaning:

- Selected prompt fragments are joined with `, `.
- Duplicate fragments are removed.
- `customText` overrides the structured output when filled.

Unlike some other modules, this compile configuration does not explicitly include `ignoreEmpty: true` in the module file. If empty values need to be ignored, that behavior must either come from the shared compiler defaults or be added explicitly in this module.

Because the compiler combines selected field output directly, every `promptText` should be concise, reusable, and self-contained.

---

## Writing New Color Palette Options

When adding a new color palette option:

1. Add it to `colorPaletteAssignmentsOptions`.
2. Use a stable snake_case `value`.
3. Assign it to the correct `category`.
4. Use the matching `categoryLabel`.
5. Write a concise `promptText`.
6. Add useful semantic `tags`.
7. Add i18n keys if the UI expects translated labels and descriptions.
8. Avoid adding near-duplicate palettes unless the new option produces a meaningfully different visual direction.

Recommended `promptText` style:

- Describe the palette as a color system.
- Mention the mood or visual behavior of the palette.
- Keep the wording reusable across many subjects.
- Avoid subject-specific assumptions.
- Avoid camera, lighting, pose, outfit, or background instructions unless the color rule directly depends on them.
- Avoid using too many exact colors unless the option is meant to be a strict palette.

---

## When to Add a New Field Instead of a New Option

Add a new option when the idea is another reusable palette family.

Add a new field only when the idea represents a reusable independent axis of color control.

A new Color Palette field may be justified for controls such as:

- palette intensity
- contrast level
- saturation level
- dominant color
- accent color
- background color
- subject color
- color harmony type
- strictness of palette adherence

However, avoid overcomplicating the module unless the UI needs more granular color control. The current module intentionally keeps the main experience centered around `colorAssignments`.

---

## Relationship With Other Modules

The Color Palette module should focus on color strategy only.

It should avoid taking over responsibilities from other modules:

| Responsibility | Better Module |
|---|---|
| Global art direction | Style |
| Surface material and tactile finish | Texture |
| Light source, shadow, and illumination | Lighting |
| Scene or environment | Background |
| Camera/lens/depth of field | Camera |
| Crop and composition | Framing |
| Subject pose | Pose |
| Facial emotion | Expression |
| Clothing type and accessories | Outfit |
| Post-processing or distortion | Effects |

Some overlap is natural. For example, cinematic palettes may imply a film mood, and neon palettes may imply glow. Still, the Color Palette module should describe color behavior, while Lighting and Style should handle illumination and visual rendering language.

---

## i18n Notes

The module key is `colorPalette`, so related labels usually follow a pattern like:

```txt
modules.colorPalette.*
```

Common i18n areas:

```txt
modules.colorPalette.title
modules.colorPalette.description
modules.colorPalette.groups.*
modules.colorPalette.fields.*
modules.colorPalette.options.*
```

When adding new options, make sure the English and Persian locale files receive matching keys if option labels or descriptions are translated in the UI.

Because this module uses a custom `colorAssignments` component, also check whether that component has its own shared i18n keys outside the module namespace.

---

## Design Rule of Thumb

The Color Palette module defines the color system, not the full scene.

A good Color Palette module output sounds like:

```txt
teal and orange cinematic palette with warm highlights, cool shadows, and strong film-like color contrast
```

or:

```txt
gold and black luxury palette with premium contrast, elegant dark grounding, and refined high-end visual mood
```

A bad Color Palette module output sounds like:

```txt
a woman standing in a neon alley, wearing a leather jacket, lit by a blue rim light, shot with an 85mm lens
```

That belongs to subject, background, outfit, lighting, and camera modules, not Color Palette.

---

## Checklist for Future Color Palette Module Changes

Before committing changes, check:

- The new palette belongs to the correct category.
- The `value` is stable and snake_case.
- The `category` and `categoryLabel` are consistent.
- The `promptText` describes color strategy, not unrelated modules.
- Tags are useful and consistent.
- Similar existing palettes were checked to avoid duplication.
- `paletteAssignments` remains compatible with the `colorAssignments` UI component.
- `extraDetails` remains additive.
- `customText` still works as the override field.
- Empty values do not produce awkward compiled output.
- New i18n keys exist in both locales when needed.
- The module still satisfies `PromptKeyModule`.
