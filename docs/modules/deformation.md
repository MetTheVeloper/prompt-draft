# Deformation Module

## Purpose

The Deformation module defines how the subject's form, anatomy, proportions, silhouette, or structural logic should be intentionally altered.

This module should answer questions like:

- Should the subject stay mostly natural or become strongly stylized?
- What kind of proportion change should happen?
- Should the body feel elastic, compressed, geometric, organic, puppet-like, grotesque, chibi, sculptural, or surreal?
- Should deformation affect the face, body, limbs, silhouette, posture, or full subject structure?

The Deformation module is mainly about shape transformation. It should not replace the Style, Texture, Pose, Framing, or Subject description modules.

---

## Source File

```txt
app/modules/deformation.module.ts
```

Recommended documentation location:

```txt
docs/modules/deformation.md
```

---

## Module Identity

```ts
key: "deformation"
icon: "forward-item"
```

The `key` identifies the module across the registry, UI, draft state, i18n keys, and compiled prompt output.

The `icon` visually represents transformation, direction, or form shifting in the UI.

---

## High-Level Structure

The module follows the standard `PromptKeyModule` shape:

```ts
export const DeformationModule: PromptKeyModule = {
  key,
  icon,
  groups,
  fields,
  compile,
}
```

The Deformation module is intentionally built around one large categorized select. This keeps the user experience simple while still supporting many different transformation families.

It does not currently define a `presets` section.

---

## Groups

The Deformation module uses three UI groups:

| Group | Role |
|---|---|
| `core` | Primary deformation style selection. |
| `advanced` | Optional user-written deformation details. |
| `override` | Full manual replacement for the module output. |

General pattern:

- `core` defines the main transformation logic.
- `advanced` allows extra deformation notes without replacing the structured choice.
- `override` allows a fully custom deformation instruction.

---

## Fields Overview

| Field | Type | Group | Role |
|---|---:|---|---|
| `deformationStyle` | select | `core` | Main categorized deformation direction. |
| `extraDetails` | textarea | `advanced` | Adds custom deformation-related notes. |
| `customText` | textarea | `override` | Replaces the module output when filled. |

---

## Field Logic

### `deformationStyle`

`deformationStyle` is the main structured field in this module.

It uses a categorized select, is searchable, clearable, and full width. This is important because the option list is large and covers many different deformation families.

This field should describe the core logic of shape transformation.

Good deformation-level directions include:

- exaggerated caricature proportions
- rubber-hose elastic body stretch
- liquid-like body warping
- compressed or squashed anatomy
- geometric faceted body structure
- organic asymmetric growth
- puppet or doll-like jointing
- chibi proportions
- brutalist blocky anatomy
- surreal impossible body geometry

Avoid using this field for global art style, material texture, camera behavior, scene layout, lighting, outfit, or expression unless those details directly affect deformation.

### `extraDetails`

`extraDetails` is additive.

Use it when the user wants a specific deformation note that does not need a dedicated structured option yet.

Examples:

- “keep the face recognizable while exaggerating the jaw”
- “make only the arms elongated”
- “preserve the original body pose but exaggerate proportions”
- “make the deformation funny, not scary”

This field should enhance the selected deformation style rather than replace it.

### `customText`

`customText` is the override field.

When filled, it replaces the normal compiled output for this module. This is useful when the transformation needs very specific instructions that cannot be built from the available option list.

---

## Options Strategy

The module uses one external option array:

```ts
const deformationStyleOptions = [...]
```

Each option generally includes:

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable value. |
| `category` | Machine-readable category id for grouping. |
| `categoryLabel` | Human-readable category label. |
| `promptText` | Text fragment used in compiled prompt output. |
| `tags` | Semantic tags for search, filtering, or future compatibility logic. |

The current module contains many deformation categories, with each category holding several related options. This makes the module broad enough for many visual concepts while keeping each option reusable.

---

## Deformation Categories

The `deformationStyleOptions` list is organized into broad transformation families.

| Category | Purpose |
|---|---|
| `caricature` | Humorous, expressive, personality-driven exaggeration. |
| `elastic` | Rubber-hose, springy, bendable, flexible body distortion. |
| `liquid` | Flowing, melting, warped, fluid deformation. |
| `inflated` | Balloon-like, overstuffed, swollen, rounded expansion. |
| `compressed` | Squashed, squeezed, flattened, compacted body structure. |
| `geometric` | Angular, faceted, cuboid, triangular, or fractured forms. |
| `organic` | Biomorphic, asymmetric, natural-growth-like distortion. |
| `insectoid_creature` | Creature-like, alien, segmented, exoskeletal transformation. |
| `puppet_doll` | Marionette, wooden doll, porcelain doll, mannequin logic. |
| `sculptural` | Clay, stone, miniature model, or statue-like body construction. |
| `material_driven` | Deformation based on wax, latex, fabric, wood, or similar materials. |
| `fashion_editorial` | Runway-style elongation, luxury body distortion, avant-garde silhouette. |
| `grotesque` | Strange, theatrical, misshapen, intentionally awkward anatomy. |
| `cute_chibi` | Oversized head, tiny body, mascot-like, toy-like proportions. |
| `brutalist` | Heavy, blocky, rough, monumental figure distortion. |
| `paper_cutout` | Flat paper, layered cutout, collage, puppet-like graphic body shapes. |
| `motion_driven` | Speed smears, squash-and-stretch, impact distortion, action arcs. |
| `surreal` | Impossible geometry, gravity-defying forms, dreamlike body shifts. |
| `minimal` | Low-intensity, subtle, restrained proportion changes. |
| `extreme_stylized` | Radical silhouette transformation and full expressive abstraction. |

When adding new deformation options, place them inside an existing category whenever possible. Add a new category only when the new family represents a reusable deformation logic that does not fit the current structure.

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

Because the compiler combines selected field output directly, every `promptText` should be concise, reusable, and self-contained.

---

## Writing New Deformation Options

When adding a new deformation option:

1. Add it to `deformationStyleOptions`.
2. Use a stable snake_case `value`.
3. Assign it to the correct `category`.
4. Use the matching `categoryLabel`.
5. Write a clear `promptText`.
6. Add useful semantic `tags`.
7. Add i18n keys if the UI expects translated labels and descriptions.
8. Avoid near-duplicate deformation options unless the new option produces a meaningfully different transformation.

Recommended `promptText` style:

- Start by defining the deformation logic clearly.
- Describe what changes in the subject's form, proportions, or silhouette.
- Keep the wording reusable across humans, animals, products, characters, and objects when possible.
- Avoid camera, lighting, background, or outfit instructions.
- Avoid overly specific subject details unless the option requires them.
- Mention intensity only when it is essential to the deformation type.

---

## When to Add a New Field Instead of a New Option

Add a new option when the idea is another deformation style or shape-transformation family.

Add a new field only when the idea represents a reusable independent axis of deformation control.

A new Deformation field may be justified for controls such as:

- deformation intensity
- affected body area
- face preservation
- identity preservation
- symmetry/asymmetry level
- realism versus abstraction
- anatomy safety or naturalness
- silhouette exaggeration level

However, avoid overcomplicating the module unless the UI needs more granular control. The current module intentionally keeps deformation as one primary categorized choice plus freeform details.

---

## Relationship With Other Modules

The Deformation module should focus on shape transformation only.

It should avoid taking over responsibilities from other modules:

| Responsibility | Better Module |
|---|---|
| Global art direction | Style |
| Material and surface finish | Texture |
| Camera/lens/depth of field | Camera |
| Crop and composition | Framing |
| Subject pose or gesture | Pose |
| Facial emotion | Expression |
| Clothing and accessories | Outfit |
| Scene or environment | Background |
| Color system | Color Palette |
| Light setup and illumination | Lighting |
| Post-processing effects | Effects |

Some overlap is natural. For example, a deformation option may imply stylization, and a motion-driven deformation may imply action. Still, this module should describe form transformation, while other modules should handle style, pose, lighting, and scene context.

---

## Deformation vs Style

The Style module defines the visual language of the image.

The Deformation module defines how the subject's shape changes.

For example:

```txt
Style: bold geometric editorial illustration
Deformation: angular faceted anatomy with fractured body planes
```

These two can work together, but they should not duplicate each other.

A style option may say the image is “geometric”; a deformation option should explain how the subject's anatomy or silhouette becomes geometric.

---

## Deformation vs Texture

The Texture module defines material and surface behavior.

The Deformation module defines structural shape behavior.

For example:

```txt
Texture: glossy latex material
Deformation: latex-like body stretch and warped flexible proportions
```

The deformation can be material-inspired, but it should still describe the transformation of the form, not just the surface.

---

## i18n Notes

The module key is `deformation`, so related labels usually follow a pattern like:

```txt
modules.deformation.*
```

Common i18n areas:

```txt
modules.deformation.title
modules.deformation.description
modules.deformation.groups.*
modules.deformation.fields.*
modules.deformation.options.*
```

When adding new options, make sure the English and Persian locale files receive matching keys if option labels or descriptions are translated in the UI.

---

## Design Rule of Thumb

The Deformation module defines how the subject's form is transformed.

A good Deformation module output sounds like:

```txt
all deformation must follow rubber-hose elasticity aesthetics, with flexible noodle-like limbs, rounded bendable anatomy, and playful body stretch
```

or:

```txt
all deformation must use oversized head and tiny body proportions, creating a cute chibi-like silhouette
```

A bad Deformation module output sounds like:

```txt
a character in a neon city, wearing a leather jacket, shot with a cinematic camera and dramatic blue lighting
```

That belongs to background, outfit, camera, and lighting modules, not Deformation.

---

## Checklist for Future Deformation Module Changes

Before committing changes, check:

- The new option belongs to the correct category.
- The `value` is stable and snake_case.
- The `category` and `categoryLabel` are consistent.
- The `promptText` describes shape transformation, not unrelated modules.
- Tags are useful and consistent.
- Similar existing options were checked to avoid duplication.
- `extraDetails` remains additive.
- `customText` still works as the override field.
- Empty values do not produce awkward compiled output.
- New i18n keys exist in both locales when needed.
- The module still satisfies `PromptKeyModule`.
