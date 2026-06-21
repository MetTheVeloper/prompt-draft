# Effects Module

## Purpose

The Effects module defines visual effects, overlays, image artifacts, atmospheric additions, motion treatments, and post-processing-style details that are applied on top of the core image direction.

This module should answer questions like:

- Should the image have photographic, analog, digital, print, glow, motion, atmospheric, magical, UI, or degradation effects?
- Should the effect be subtle, balanced, strong, or extreme?
- Should the effect behave like a post-processing layer, an overlay, a lens artifact, a print artifact, or a stylized graphic treatment?
- Should the final image feel cleaner, more cinematic, more retro, more energetic, more magical, more degraded, or more designed?

The Effects module should add controlled visual treatments without replacing the Style, Lighting, Background, Camera, Texture, or Deformation modules.

---

## Source File

```txt
app/modules/effects.module.ts
```

Recommended documentation location:

```txt
docs/modules/effects.md
```

---

## Module Identity

```ts
key: "effects"
icon: "magic-star"
```

The `key` identifies the module across the registry, UI, draft state, i18n keys, and compiled prompt output.

The `icon` visually represents visual enhancement, sparkle, magic, or post-processing effects in the UI.

---

## High-Level Structure

The module follows the standard `PromptKeyModule` shape:

```ts
export const EffectsModule: PromptKeyModule = {
  key,
  icon,
  groups,
  fields,
  compile,
}
```

The Effects module is built around a multi-select field, which means users can combine multiple effects in one module output.

This is different from many single-choice modules. Because multiple effects can stack together, each effect option should stay concise and should not try to describe a full scene.

The module does not currently define a `presets` section.

---

## Groups

The Effects module uses three UI groups:

| Group | Role |
|---|---|
| `core` | Main effect selection and effect intensity. |
| `advanced` | Optional user-written effect details. |
| `override` | Full manual replacement for the module output. |

General pattern:

- `core` contains the structured effect controls.
- `advanced` allows extra effect notes without replacing selected options.
- `override` allows a fully custom effects instruction.

---

## Fields Overview

| Field | Type | Group | Role |
|---|---:|---|---|
| `effectStyle` | multiSelect | `core` | Main categorized list of visual effects. |
| `effectIntensity` | select | `core` | Controls the strength or visibility of the selected effects. |
| `extraDetails` | textarea | `advanced` | Adds custom effect-related notes. |
| `customText` | textarea | `override` | Replaces the module output when filled. |

---

## Field Logic

### `effectStyle`

`effectStyle` is the main structured field in this module.

It uses:

```ts
type: "multiSelect"
```

and the UI component:

```ts
component: "multiSelect"
optionLayout: "categorized"
```

This allows the user to choose more than one effect at the same time.

Good effect-level directions include:

- film grain
- subtle vignette
- lens flare
- chromatic aberration
- VHS tape effect
- RGB split
- halftone overlay
- neon glow
- speed lines
- fog overlay
- magical particles
- HUD overlay
- JPEG compression artifacts

Because this field is a multi-select, each option should describe one effect clearly and avoid overlapping too much with other options.

### `effectIntensity`

`effectIntensity` controls how visible or aggressive the selected effects should be.

Current intensity options are:

| Value | Purpose |
|---|---|
| `subtle` | Very soft effect impact. |
| `balanced` | Moderate effect impact. |
| `strong` | Highly visible effect impact. |
| `extreme` | Dramatic stylization. |

This field affects the selected effects as a group. It should not introduce a new effect type by itself.

### `extraDetails`

`extraDetails` is additive.

Use it when the user wants a specific effect note that does not need a dedicated structured option yet.

Examples:

- “keep the effect only around the edges”
- “make the glitch visible but not destructive”
- “apply the halftone mostly to shadows”
- “use the particles only behind the subject”
- “keep the image readable despite the VHS effect”

This field should refine the selected effect set rather than replace it.

### `customText`

`customText` is the override field.

When filled, it replaces the normal compiled output for this module. This is useful when the desired effect stack is too specific for the structured fields.

---

## Options Strategy

The module uses two external option arrays:

```ts
const effectOptions = [...]
const intensityOptions = [...]
```

### `effectOptions`

Each effect option generally includes:

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable value. |
| `category` | Machine-readable category id for grouping. |
| `categoryLabel` | Human-readable category label. |
| `promptText` | Text fragment used in compiled prompt output. |
| `tags` | Semantic tags for search, filtering, or future compatibility logic. |

### `intensityOptions`

Each intensity option includes:

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable intensity id. |
| `promptText` | Text fragment used in compiled prompt output. |

The current structure separates “what effect is used” from “how strong the effect should be”. This is a good pattern to reuse in future modules that need both a visual type and a strength control.

---

## Effect Categories

The `effectOptions` list is organized into broad effect families.

| Category | Purpose |
|---|---|
| `photographic` | Lens, optical, focus, grain, vignette, motion blur, and atmospheric photo effects. |
| `film_analog` | Film, VHS, light leak, dust, scratches, and nostalgic analog artifacts. |
| `digital_glitch` | Glitch, RGB split, datamosh, scanlines, pixel sorting, and digital artifacts. |
| `print_poster` | Halftone, risograph offset, screen print texture, and comic dot treatments. |
| `light_glow` | Bloom, neon glow, halo, sparkle, and luminous highlight effects. |
| `motion_energy` | Speed lines, trails, energy aura, and dynamic action effects. |
| `atmospheric` | Fog, mist, dust particles, rain droplets, and environmental overlays. |
| `surreal_magical` | Magical particles, fantasy sparkles, ethereal aura, and supernatural overlays. |
| `ui_graphic` | HUD overlays, interface graphics, comic speech bubbles, and graphic UI elements. |
| `quality_degradation` | Intentional low quality, JPEG artifacts, pixelation, and degraded image treatments. |

When adding new effects, place them inside an existing category whenever possible. Add a new category only when the new effect family represents a reusable post-processing or overlay logic that does not fit the current structure.

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

Because `effectStyle` is a multi-select field, the compiler may combine several effect prompt fragments before adding intensity and extra details. This makes it especially important that each effect option stays short and modular.

---

## Writing New Effect Options

When adding a new effect option:

1. Add it to `effectOptions`.
2. Use a stable snake_case `value`.
3. Assign it to the correct `category`.
4. Use the matching `categoryLabel`.
5. Write a concise `promptText`.
6. Add useful semantic `tags`.
7. Add i18n keys if the UI expects translated labels and descriptions.
8. Check existing effects to avoid duplicates or near-duplicates.
9. Make sure the option can combine cleanly with intensity options.

Recommended `promptText` style:

- Describe one effect only.
- Keep it short enough to combine with other effects.
- Avoid full scene descriptions.
- Avoid subject, outfit, camera, background, or pose instructions.
- Mention visual behavior clearly, such as overlay, glow, streaks, noise, artifacts, haze, particles, or distortion.
- Avoid repeating intensity words unless the option requires a specific strength.

---

## When to Add a New Field Instead of a New Option

Add a new option when the idea is another reusable effect.

Add a new field only when the idea represents a reusable independent axis of effect control.

A new Effects field may be justified for controls such as:

- effect placement
- effect blend mode
- effect density
- effect area
- effect direction
- artifact quality
- motion direction
- glow color
- particle amount
- degradation level

However, avoid overcomplicating the module unless the UI needs more granular control. The current module intentionally keeps effects simple: multiple effect choices, one intensity selector, optional extra details, and a manual override.

---

## Relationship With Other Modules

The Effects module should focus on visual effects, overlays, post-processing, and artifacts.

It should avoid taking over responsibilities from other modules:

| Responsibility | Better Module |
|---|---|
| Global art direction | Style |
| Light source and lighting setup | Lighting |
| Scene or environment | Background |
| Camera/lens/capture behavior | Camera |
| Crop and composition | Framing |
| Material and surface quality | Texture |
| Subject shape transformation | Deformation |
| Subject pose or gesture | Pose |
| Facial emotion | Expression |
| Clothing and accessories | Outfit |
| Color system | Color Palette |

Some overlap is natural. For example, lens flare relates to camera and lighting, neon glow relates to lighting, and halftone relates to style or print texture. Still, the Effects module should describe the visible overlay or post-processing treatment, while the other modules define the underlying scene, style, light, and capture logic.

---

## Effects vs Lighting

The Lighting module defines how the scene is illuminated.

The Effects module defines visual additions or post-processing effects.

For example:

```txt
Lighting: dramatic rim light from behind the subject
Effects: lens flare effect, controlled highlight streaks
```

The lighting creates the light in the scene. The effect creates the visible artifact or treatment on top of the image.

---

## Effects vs Style

The Style module defines the global visual language.

The Effects module adds secondary visual treatment.

For example:

```txt
Style: vintage silkscreen poster illustration
Effects: halftone dot pattern overlay, risograph misregistration style
```

The style defines the art direction. The effects add print-like surface behavior.

---

## Effects vs Background

The Background module defines the environment.

The Effects module can add atmospheric or overlay elements.

For example:

```txt
Background: dark cinematic alley environment
Effects: fog overlay, floating dust particles
```

The background defines the place. The effects add atmosphere or visual particles.

---

## i18n Notes

The module key is `effects`, so related labels usually follow a pattern like:

```txt
modules.effects.*
```

Common i18n areas:

```txt
modules.effects.title
modules.effects.description
modules.effects.groups.*
modules.effects.fields.*
modules.effects.options.*
```

When adding new options, make sure the English and Persian locale files receive matching keys if option labels or descriptions are translated in the UI.

---

## Design Rule of Thumb

The Effects module defines what is added on top of the image or how the image is visually processed.

A good Effects module output sounds like:

```txt
film grain effect, subtle texture and visual noise, subtle effect intensity, very soft impact
```

or:

```txt
RGB split effect, chromatic color displacement, scanline effect, horizontal line texture overlay, strong effect intensity, highly visible impact
```

A bad Effects module output sounds like:

```txt
a warrior standing in a ruined city, wearing armor, lit by a blue spotlight, shot with a wide-angle lens
```

That belongs to subject, background, outfit, lighting, and camera modules, not Effects.

---

## Checklist for Future Effects Module Changes

Before committing changes, check:

- The new effect belongs to the correct category.
- The `value` is stable and snake_case.
- The `category` and `categoryLabel` are consistent.
- The `promptText` describes one visual effect, overlay, artifact, or post-processing behavior.
- Tags are useful and consistent.
- Similar existing effects were checked to avoid duplication.
- The option combines cleanly with other multi-selected effects.
- The option combines cleanly with all intensity values.
- `extraDetails` remains additive.
- `customText` still works as the override field.
- Empty values do not produce awkward compiled output.
- New i18n keys exist in both locales when needed.
- The module still satisfies `PromptKeyModule`.
