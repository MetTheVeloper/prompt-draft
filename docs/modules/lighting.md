# Lighting Module

## Purpose

The Lighting module defines how the subject, scene, or object is illuminated. It is responsible for describing the visible light setup, light softness or harshness, contrast, mood, direction, separation, and environmental lighting behavior.

This module should answer questions like:

- What kind of light should illuminate the image?
- Should the lighting feel natural, studio-controlled, cinematic, dramatic, graphic, atmospheric, practical, colorful, or stylized?
- Should the light be soft, hard, warm, cool, high-key, low-key, backlit, rim-lit, neon, volumetric, or environmental?
- Should the lighting support a portrait, product image, poster, cinematic scene, fashion image, toy render, or stylized illustration?

The Lighting module should define illumination and light mood without replacing the Style, Camera, Background, Effects, Color Palette, or Texture modules.

---

## Source File

```txt
app/modules/lighting.module.ts
```

Recommended documentation location:

```txt
docs/modules/lighting.md
```

---

## Module Identity

```ts
key: "lighting"
icon: "lamp"
```

The `key` identifies the module across the registry, UI, draft state, i18n keys, and compiled prompt output.

The `icon` visually represents illumination, lamps, light sources, and lighting setup in the UI.

---

## High-Level Structure

The module follows the standard `PromptKeyModule` shape:

```ts
export const LightingModule: PromptKeyModule = {
  key,
  icon,
  groups,
  fields,
  compile,
}
```

The Lighting module is intentionally built around one large categorized select. This keeps the UI simple while still supporting many lighting families, from natural lighting to cinematic, studio, practical, atmospheric, and stylized light setups.

It does not currently define a `presets` section.

---

## Groups

The Lighting module uses three UI groups:

| Group | Role |
|---|---|
| `core` | Primary lighting style selection. |
| `advanced` | Optional user-written lighting details. |
| `override` | Full manual replacement for the module output. |

General pattern:

- `core` defines the main lighting direction.
- `advanced` allows extra lighting notes without replacing the structured choice.
- `override` allows a fully custom lighting instruction.

---

## Fields Overview

| Field | Type | Group | Role |
|---|---:|---|---|
| `lightingStyle` | select | `core` | Main categorized lighting direction. |
| `extraDetails` | textarea | `advanced` | Adds custom lighting-related notes. |
| `customText` | textarea | `override` | Replaces the module output when filled. |

---

## Field Logic

### `lightingStyle`

`lightingStyle` is the main structured field in this module.

It uses a categorized select, is searchable, clearable, and full width. This is useful because the lighting library covers many different lighting purposes, from simple natural light to dramatic cinematic and stylized art lighting.

This field should describe the core lighting setup or lighting mood.

Good lighting-level directions include:

- soft diffused light
- natural window light
- clean studio lighting
- beauty lighting
- dramatic cinematic lighting
- low-key studio lighting
- hard direct light
- neon color lighting
- hazy volumetric light
- rim light
- candlelight glow
- anime-style dramatic lighting

Avoid using this field for camera lens, crop, subject pose, environment layout, material texture, outfit, or global illustration style unless the detail directly affects illumination.

### `extraDetails`

`extraDetails` is additive.

Use it when the user wants a specific lighting note that does not need a dedicated structured option yet.

Examples:

- “keep the face readable despite the dramatic shadows”
- “make the highlights soft and controlled”
- “avoid overexposed skin”
- “use the light mostly from camera left”
- “keep the product edges clearly separated from the background”

This field should refine the selected lighting style rather than replace it.

### `customText`

`customText` is the override field.

When filled, it replaces the normal compiled output for this module. This is useful when the lighting instruction needs to be very specific or when the available options are not enough.

---

## Options Strategy

The module uses one external option array:

```ts
const lightingStyleOptions = [...]
```

Each option generally includes:

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable value. |
| `category` | Machine-readable category id for grouping. |
| `categoryLabel` | Human-readable category label. |
| `promptText` | Text fragment used in compiled prompt output. |
| `tags` | Semantic tags for search, filtering, or future compatibility logic. |

The current module contains many lighting categories, with each category holding several related options. This gives the module broad coverage while keeping the UI to a single main field.

---

## Lighting Categories

The `lightingStyleOptions` list is organized into broad lighting families.

| Category | Purpose |
|---|---|
| `soft_natural` | Gentle, realistic, flattering, low-harshness lighting such as diffused light, window light, overcast daylight, ambient light, warm natural light, or cool natural light. |
| `studio` | Controlled studio setups such as clean studio lighting, beauty lighting, softbox light, rim-lit studio setup, high-key lighting, or low-key lighting. |
| `cinematic` | Dramatic story-driven lighting such as cinematic contrast, side lighting, silhouettes, chiaroscuro, spotlights, film noir, or golden-hour cinema light. |
| `hard_graphic` | Strong, direct, contrast-heavy lighting such as harsh flash, hard shadows, graphic contrast, top light, or underlighting. |
| `color_mood` | Mood-based and color-driven lighting such as warm glow, cool blue light, neon lighting, dual-tone lighting, pastel lighting, monochromatic lighting, or iridescent light. |
| `atmospheric` | Light shaped by air, haze, mist, dust, smoke, rain, bloom, and volumetric visibility. |
| `subject_separation` | Lighting that separates the subject from the background, such as rim light, edge highlight, halo backlight, silhouette emphasis, or subject-focused light. |
| `practical_environmental` | Light from visible or implied real-world sources such as streetlights, candles, screens, fire, fluorescent interiors, or stage lights. |
| `stylized_artistic` | Art-directed lighting for anime, comics, painterly images, toy renders, claymation, or surreal dreamlike scenes. |

When adding new lighting options, place them inside an existing category whenever possible. Add a new category only when the new family represents a reusable lighting logic that does not fit the current structure.

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

Because the compiler combines selected field output directly, every `promptText` should be concise, reusable, and focused on lighting.

---

## Writing New Lighting Options

When adding a new lighting option:

1. Add it to `lightingStyleOptions`.
2. Use a stable snake_case `value`.
3. Assign it to the correct `category`.
4. Use the matching `categoryLabel`.
5. Write a clear `promptText`.
6. Add useful semantic `tags`.
7. Add i18n keys if the UI expects translated labels and descriptions.
8. Avoid near-duplicate lighting options unless the new option produces a meaningfully different lighting behavior.

Recommended `promptText` style:

- Describe the light setup, quality, direction, contrast, or mood.
- Mention softness, harshness, shadow behavior, highlight behavior, separation, or atmosphere when useful.
- Keep the wording reusable across portraits, products, characters, objects, and scenes.
- Avoid camera, crop, pose, outfit, material, or background instructions.
- Avoid turning the lighting option into a full scene description.
- Do not overuse color details unless the lighting option is specifically color-driven.

---

## When to Add a New Field Instead of a New Option

Add a new option when the idea is another lighting style or lighting setup.

Add a new field only when the idea represents a reusable independent axis of lighting control.

A new Lighting field may be justified for controls such as:

- lighting intensity
- light direction
- shadow softness
- contrast level
- highlight strength
- key light color
- fill light amount
- rim light strength
- subject-background separation
- natural versus artificial light

However, avoid overcomplicating the module unless the UI needs more granular control. The current module intentionally keeps lighting as one primary categorized choice plus freeform details.

---

## Relationship With Other Modules

The Lighting module should focus on illumination only.

It should avoid taking over responsibilities from other modules:

| Responsibility | Better Module |
|---|---|
| Global art direction | Style |
| Camera/lens/depth of field | Camera |
| Crop and composition | Framing |
| Scene or environment | Background |
| Surface material and finish | Texture |
| Subject pose or gesture | Pose |
| Facial emotion | Expression |
| Clothing and accessories | Outfit |
| Shape or anatomy distortion | Deformation |
| Color system beyond light color | Color Palette |
| Post-processing, overlays, and artifacts | Effects |

Some overlap is natural. For example, neon lighting may overlap with Color Palette, lens flare may overlap with Effects, and cinematic lighting may overlap with Style. Still, this module should describe how light illuminates the image, while the other modules define rendering language, color strategy, camera behavior, and post-processing.

---

## Lighting vs Effects

The Lighting module defines the light that exists in the scene.

The Effects module defines visual artifacts or overlays that sit on top of the image.

For example:

```txt
Lighting: strong rim light behind the subject
Effects: lens flare effect with controlled highlight streaks
```

The rim light illuminates the subject. The lens flare is a visible optical/post-processing artifact.

---

## Lighting vs Camera

The Camera module defines capture behavior.

The Lighting module defines illumination behavior.

For example:

```txt
Camera: portrait lens look with shallow depth of field
Lighting: soft beauty lighting with smooth facial shadows
```

The camera affects capture and perspective. The lighting affects light, shadow, and highlight quality.

---

## Lighting vs Background

The Background module defines the environment or backdrop.

The Lighting module defines how that environment and subject are illuminated.

For example:

```txt
Background: dark cinematic alley environment
Lighting: cool blue side lighting with strong shadow contrast
```

The background defines the place. The lighting defines how the place is lit.

---

## Lighting vs Color Palette

The Color Palette module defines the overall color system.

The Lighting module may define light color only when the color belongs to illumination.

For example:

```txt
Color Palette: teal and orange cinematic palette
Lighting: warm key light with cool blue fill shadows
```

The palette controls the whole color strategy. The lighting controls light color and shadow color behavior.

---

## i18n Notes

The module key is `lighting`, so related labels usually follow a pattern like:

```txt
modules.lighting.*
```

Common i18n areas:

```txt
modules.lighting.title
modules.lighting.description
modules.lighting.groups.*
modules.lighting.fields.*
modules.lighting.options.*
```

When adding new options, make sure the English and Persian locale files receive matching keys if option labels or descriptions are translated in the UI.

---

## Design Rule of Thumb

The Lighting module defines how the image is illuminated.

A good Lighting module output sounds like:

```txt
the lighting must be soft and evenly diffused. Gentle shadows, smooth transitions, low harshness, flattering subject visibility, and a calm natural atmosphere with no aggressive contrast.
```

or:

```txt
the lighting must use dramatic cinematic contrast. Strong directional light, deep controlled shadows, clear highlight separation, and a high-impact movie-scene atmosphere.
```

A bad Lighting module output sounds like:

```txt
a woman standing in a neon street, wearing a leather jacket, shot with a wide-angle camera and a centered composition
```

That belongs to subject, background, outfit, camera, and framing modules, not Lighting.

---

## Checklist for Future Lighting Module Changes

Before committing changes, check:

- The new option belongs to the correct category.
- The `value` is stable and snake_case.
- The `category` and `categoryLabel` are consistent.
- The `promptText` describes lighting behavior, not unrelated modules.
- Tags are useful and consistent.
- Similar existing lighting options were checked to avoid duplication.
- The option stays reusable across portraits, products, objects, characters, and scenes when possible.
- `extraDetails` remains additive.
- `customText` still works as the override field.
- Empty values do not produce awkward compiled output.
- New i18n keys exist in both locales when needed.
- The module still satisfies `PromptKeyModule`.
