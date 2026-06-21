# Background Module

## Purpose

The Background module defines the visual environment behind or around the main subject. It is responsible for describing where the subject appears, how detailed the surrounding space should feel, and what kind of contextual, atmospheric, graphic, or abstract backdrop supports the image.

This module should answer questions like:

- What kind of background should the image have?
- Should the background be clean, realistic, cinematic, graphic, abstract, transparent, textured, themed, or dynamic?
- Should the environment support a product, portrait, action shot, poster layout, fantasy scene, or reusable asset?
- How much visual information should exist behind the subject?

The Background module should support the subject without taking over responsibilities that belong to other modules such as style, lighting, framing, camera, texture, or color palette.

---

## Source File

```txt
app/modules/background.module.ts
```

Recommended documentation location:

```txt
docs/modules/background.md
```

---

## Module Identity

```ts
key: "background"
icon: "image"
```

The `key` is used as the module identifier across the prompt system, registry, UI, i18n keys, draft state, and compiled output.

The `icon` is used by the UI to visually represent the module.

---

## High-Level Structure

The module follows the standard `PromptKeyModule` shape:

```ts
export const BackgroundModule: PromptKeyModule = {
  key,
  icon,
  groups,
  fields,
  compile,
}
```

Main sections:

| Section | Purpose |
|---|---|
| `groups` | Defines how fields are visually grouped in the module UI. |
| `fields` | Defines user-editable inputs and their UI behavior. |
| `compile` | Defines how selected field values are converted into prompt text. |

Unlike some other modules, the Background module currently does not define a `presets` section. It relies on a single large categorized background selector plus optional manual details.

---

## Groups

The Background module uses three UI groups:

| Group | Role |
|---|---|
| `core` | Primary background selection. |
| `advanced` | Optional user-written background details. |
| `override` | Full manual replacement for the module output. |

General pattern:

- `core` contains the main structured background choice.
- `advanced` adds extra text without replacing the selected background.
- `override` lets the user bypass the structured fields and write the full background instruction manually.

This is a simpler structure than the Style module because background selection is currently handled through one broad categorized field instead of several independent style axes.

---

## Fields Overview

The Background module currently has three fields.

| Field | Type | Group | Role |
|---|---:|---|---|
| `backgroundStyle` | select | `core` | Main categorized background direction. |
| `extraDetails` | textarea | `advanced` | Adds custom background notes. |
| `customText` | textarea | `override` | Replaces the module output when filled. |

---

## Field Logic

### `backgroundStyle`

`backgroundStyle` is the main structured field in this module.

It uses a categorized select, is searchable, clearable, and full width. This is important because the option list is intentionally broad and covers many background families.

The field should describe the overall background concept, not every small object in the scene.

Good examples of background-level direction:

- clean seamless studio surface
- cinematic atmospheric environment
- realistic outdoor setting
- graphic poster backdrop
- futuristic architectural space
- transparent cutout background
- dynamic action backdrop

Avoid using this field for details that belong to other modules, such as exact lighting setup, camera lens, subject pose, outfit, or material finish.

### `extraDetails`

`extraDetails` is additive.

Use it when the user wants a specific environment note that does not need a dedicated structured option yet.

Examples:

- “with subtle floating dust particles”
- “with distant mountains but no visible people”
- “with Persian bakery interior details”
- “with soft product-category props in the far background”

This field should not duplicate the selected `backgroundStyle`. It should refine or localize it.

### `customText`

`customText` is the override field.

When filled, it replaces the normal compiled output for this module. This is useful when the background needs a very specific custom instruction that cannot be built from the available options.

---

## Options Strategy

The module uses a single external option array:

```ts
const backgroundStyleOptions = [...]
```

Each option generally includes:

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable value. |
| `category` | Machine-readable category id for grouping. |
| `categoryLabel` | Human-readable category label. |
| `promptText` | Text fragment used in compiled prompt output. |
| `tags` | Semantic tags for search, filtering, or future compatibility logic. |

The current structure favors a broad library of reusable background types rather than many small independent fields.

---

## Background Categories

The `backgroundStyleOptions` list is organized into broad categories. Each category contains multiple options with a shared visual purpose.

Current category families include:

| Category Family | Purpose |
|---|---|
| Clean / Minimal | Simple, uncluttered, seamless, negative-space backgrounds. |
| Studio | Controlled portrait, product, and commercial studio environments. |
| Environmental | Realistic indoor, outdoor, lifestyle, and contextual spaces. |
| Cinematic | Moody, atmospheric, story-driven backdrops. |
| Abstract | Non-literal forms, gradients, geometric or color-field backgrounds. |
| Graphic / Poster | Designed, editorial, campaign, and typography-friendly poster spaces. |
| Fantasy / Surreal | Dreamlike, enchanted, distorted, or impossible environments. |
| Nature | Landscape, sky, forest, garden, and organic outdoor settings. |
| Urban | City, street, rooftop, and neon urban environments. |
| Luxury / Premium | Elegant interiors, refined brand settings, and polished premium spaces. |
| Sports / Stadium | Arena, field, crowd, and spotlight environments. |
| Sci-Fi / Futuristic | Tech, holographic, cyber, and futuristic architectural spaces. |
| Vintage / Retro | Nostalgic, analog, retro graphic, and period-inspired backgrounds. |
| Texture / Material | Concrete, paper, metal, fabric, and tactile surface backdrops. |
| Transparent / Cutout | Asset-ready, isolated, or transparent-background intent. |
| Depth / Blurred | Bokeh, shallow-depth, and distant softened environments. |
| Thematic | Music, sports, technology, food, fashion, and story-specific contexts. |
| Pattern | Repeating geometric, organic, decorative, or branded motif backgrounds. |
| Collage / Mixed Media | Paper collage, scrapbook, layered poster, and mixed-media backdrops. |
| Dynamic / Action | Motion, speed lines, energy bursts, wind, and action-supporting spaces. |

When adding new background options, place them inside an existing category whenever possible. Add a new category only when the new option family represents a reusable background direction that does not fit the current structure.

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

Because the compiler combines selected field output directly, every `promptText` should be clean, reusable, and self-contained.

---

## Writing New Background Options

When adding a new background option:

1. Add it to `backgroundStyleOptions`.
2. Use a stable snake_case `value`.
3. Assign it to the correct `category`.
4. Use the matching `categoryLabel`.
5. Write a clear `promptText`.
6. Add useful semantic `tags`.
7. Add i18n keys if the UI expects labels and descriptions.
8. Avoid duplicating existing options unless the new one has a clearly different purpose.

Recommended `promptText` style:

- Describe the background as a whole.
- Keep the wording reusable across many subjects.
- Avoid subject-specific assumptions.
- Avoid camera, lighting, pose, outfit, and detailed material instructions unless they are necessary to explain the background.
- Make the background supportive, not dominant, unless the option is intentionally poster-like, cinematic, fantasy, or action-focused.

---

## When to Add a New Field Instead of a New Option

Add a new option when the idea is simply another background type.

Add a new field only when the idea represents a reusable independent axis of control.

A new Background field may be justified for controls such as:

- background complexity
- depth or blur intensity
- subject-background separation
- environment realism
- prop density
- background mood

Do not add a field for one-off scene details. Use `extraDetails` instead.

---

## Relationship With Other Modules

The Background module should focus on environment and backdrop only.

It should avoid taking over responsibilities from other modules:

| Responsibility | Better Module |
|---|---|
| Global visual style | Style |
| Material and surface details | Texture |
| Lighting setup | Lighting |
| Camera/lens/depth of field | Camera |
| Crop and composition | Framing |
| Subject pose | Pose |
| Facial emotion | Expression |
| Clothing and accessories | Outfit |
| Color system | Color Palette |
| Motion or image effects | Effects, unless the motion is specifically part of the background |

Some overlap is normal. For example, a cinematic background may imply atmosphere, and a studio background may imply controlled space. Still, the module should not become a replacement for lighting, camera, or style controls.

---

## i18n Notes

The module key is `background`, so related labels usually follow a pattern like:

```txt
modules.background.*
```

Common i18n areas:

```txt
modules.background.title
modules.background.description
modules.background.groups.*
modules.background.fields.*
modules.background.options.*
```

When adding new options, make sure the English and Persian locale files receive matching keys if option labels or descriptions are translated in the UI.

---

## Design Rule of Thumb

The Background module defines the world or surface behind the subject.

A good Background module output sounds like:

```txt
the background must be a clean seamless surface with no visible clutter
```

or:

```txt
the background must feel cinematic and atmospheric, with dramatic depth and a story-driven environment
```

A bad Background module output sounds like:

```txt
a smiling woman wearing a red leather jacket, lit by a softbox, shot with an 85mm lens
```

That belongs to subject, outfit, lighting, and camera modules, not Background.

---

## Checklist for Future Background Module Changes

Before committing changes, check:

- The new option belongs to the correct category.
- The `value` is stable and snake_case.
- The `category` and `categoryLabel` are consistent.
- The `promptText` describes the background, not unrelated modules.
- Tags are useful and not overly random.
- Similar existing options were checked to avoid duplication.
- `extraDetails` remains additive.
- `customText` still works as the override field.
- Empty values do not produce awkward compiled output.
- New i18n keys exist in both locales when needed.
- The module still satisfies `PromptKeyModule`.
