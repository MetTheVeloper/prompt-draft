# Framing Module

## Purpose

The Framing module defines how the subject or scene is placed inside the image frame. It is responsible for crop, subject distance, visual placement, perspective angle, compositional structure, safe margins, and layout intent.

This module should answer questions like:

- How much of the subject should be visible?
- Where should the subject sit inside the frame?
- Should the viewpoint feel eye-level, low-angle, high-angle, overhead, frontal, profile, or three-quarter?
- Should the composition feel centered, asymmetrical, cinematic, editorial, graphic, isolated, or layered?
- Should the frame preserve safe margins for poster design, product presentation, social media, icons, or editing?

The Framing module is about composition and frame structure. It should not replace the Camera, Pose, Background, Style, or Lighting modules.

---

## Source File

```txt
app/modules/framing.module.ts
```

Recommended documentation location:

```txt
docs/modules/framing.md
```

---

## Module Identity

```ts
key: "framing"
icon: "crop"
```

The `key` identifies the module across the registry, UI, draft state, i18n keys, and compiled prompt output.

The `icon` visually represents cropping, framing, and layout behavior in the UI.

---

## High-Level Structure

The module follows the standard `PromptKeyModule` shape:

```ts
export const FramingModule: PromptKeyModule = {
  key,
  icon,
  groups,
  fields,
  compile,
}
```

The Framing module is built around one categorized select. This keeps the user experience simple while still covering many framing decisions such as crop, placement, angle, composition style, cropping safety, camera distance feel, and final layout intent.

It does not currently define a `presets` section.

---

## Groups

The Framing module uses three UI groups:

| Group | Role |
|---|---|
| `core` | Primary framing selection. |
| `advanced` | Optional user-written framing details. |
| `override` | Full manual replacement for the module output. |

General pattern:

- `core` defines the main composition or framing rule.
- `advanced` allows extra framing notes without replacing the structured choice.
- `override` allows a fully custom framing instruction.

---

## Fields Overview

| Field | Type | Group | Role |
|---|---:|---|---|
| `framingStyle` | select | `core` | Main categorized framing, crop, angle, or layout direction. |
| `extraDetails` | textarea | `advanced` | Adds custom framing-related notes. |
| `customText` | textarea | `override` | Replaces the module output when filled. |

---

## Field Logic

### `framingStyle`

`framingStyle` is the main structured field in this module.

It uses a categorized select, is searchable, clearable, and full width. This is important because the option list covers multiple framing families rather than a single narrow axis.

This field should describe how the final image is composed inside the frame.

Good framing-level directions include:

- close-up portrait composition
- full-body safe frame
- centered composition
- rule-of-thirds placement
- low-angle view
- direct frontal view
- cinematic widescreen framing
- poster-safe composition
- negative-space composition
- thumbnail-readable framing

Avoid using this field for the subject's body action, facial expression, lighting setup, environment, lens model, outfit, material, or global art style unless the detail directly affects frame structure.

### `extraDetails`

`extraDetails` is additive.

Use it when the user wants a specific framing note that does not need a dedicated structured option yet.

Examples:

- “keep extra space above the head for title text”
- “do not crop the hands or fingers”
- “make the subject fill most of the vertical frame”
- “leave clean margins for a poster layout”
- “keep the face readable even at small size”

This field should refine the selected framing style rather than replace it.

### `customText`

`customText` is the override field.

When filled, it replaces the normal compiled output for this module. This is useful when the desired composition is very specific or when the available options are not enough.

---

## Options Strategy

The module uses one external option array:

```ts
const framingStyleOptions = [...]
```

Each option generally includes:

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable value. |
| `category` | Machine-readable category id for grouping. |
| `categoryLabel` | Human-readable category label. |
| `promptText` | Text fragment used in compiled prompt output. |
| `tags` | Semantic tags for search, filtering, or future compatibility logic. |

The current module uses one large categorized option library instead of separate fields for crop, angle, placement, and layout intent. This makes the UI faster to use, but it also means each option should remain clear and focused.

---

## Framing Categories

The `framingStyleOptions` list is organized into broad composition families.

| Category | Purpose |
|---|---|
| `shot_size_crop` | Controls how much of the subject is visible in the frame. |
| `subject_placement` | Controls where the subject sits inside the composition. |
| `perspective_angle` | Controls the viewing angle or directional point of view. |
| `composition_style` | Controls the overall compositional structure and visual balance. |
| `cropping_rules` | Controls what must be preserved or avoided when cropping. |
| `camera_distance_lens_feel` | Controls the perceived distance and perspective feel of the framing. |
| `format_layout_intent` | Optimizes framing for final use cases such as social media, poster, thumbnail, product, widescreen, or icon layouts. |

When adding new framing options, place them inside an existing category whenever possible. Add a new category only when the new family represents a reusable framing logic that does not fit the current structure.

---

## Category Notes

### Shot Size / Crop

This category defines how much of the subject is visible.

It includes options such as:

- extreme close-up
- close-up
- head and shoulders
- bust shot
- medium shot
- three-quarter shot
- full body
- wide full-body frame

Use this category when the main decision is subject crop or visible body range.

### Subject Placement

This category defines where the subject is positioned in the frame.

It includes options such as:

- centered composition
- off-center composition
- rule-of-thirds placement
- lower or upper frame placement
- edge-weighted composition
- negative-space composition
- poster-safe composition

Use this category when the crop may stay flexible but subject placement matters.

### Perspective / Angle

This category defines the viewpoint direction.

It includes options such as:

- eye-level angle
- low-angle view
- high-angle view
- top-down view
- worm’s-eye view
- bird’s-eye view
- three-quarter angle
- profile view
- frontal view

Use this category when the user cares about how the camera or viewer sees the subject.

### Composition Style

This category defines the overall visual organization of the frame.

It includes options such as:

- symmetrical composition
- asymmetrical composition
- cinematic composition
- editorial composition
- graphic composition
- dynamic diagonal composition
- layered depth composition
- isolated subject composition

Use this category when the layout language matters more than a specific crop or angle.

### Cropping Rules

This category defines safety rules for what must remain visible.

It includes options such as:

- no-crop safe frame
- tight intentional crop
- face-safe crop
- hands-safe crop
- silhouette-safe crop
- asset-safe margin

Use this category when avoiding bad crops is more important than picking a specific shot size.

### Camera Distance / Lens Feel

This category defines perceived distance and perspective feel.

It includes options such as:

- intimate portrait distance
- natural portrait distance
- telephoto compressed frame
- wide-angle environmental frame
- dramatic wide-angle frame
- distant observational frame

This category overlaps slightly with the Camera module, but in this module it should remain about how the frame feels spatially, not about selecting a camera model or capture technology.

### Format / Layout Intent

This category defines the intended final-use layout.

It includes options such as:

- social portrait framing
- thumbnail framing
- poster framing
- product-style framing
- cinematic widescreen framing
- square icon framing

Use this category when the output format or publishing context is the main framing constraint.

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

Because the compiler combines selected field output directly, every `promptText` should be concise, reusable, and focused on composition or framing.

---

## Writing New Framing Options

When adding a new framing option:

1. Add it to `framingStyleOptions`.
2. Use a stable snake_case `value`.
3. Assign it to the correct `category`.
4. Use the matching `categoryLabel`.
5. Write a clear `promptText`.
6. Add useful semantic `tags`.
7. Add i18n keys if the UI expects translated labels and descriptions.
8. Avoid near-duplicate framing options unless the new option produces a meaningfully different composition.

Recommended `promptText` style:

- Describe the frame structure clearly.
- Mention crop, placement, angle, margins, or layout intent when relevant.
- Keep the wording reusable across portraits, products, characters, animals, objects, and scenes when possible.
- Avoid lighting, outfit, material, expression, or background instructions.
- Avoid turning the framing option into a full scene description.
- Be careful with camera words: describe the perceived frame, not the camera device unless the option specifically requires it.

---

## When to Add a New Field Instead of a New Option

Add a new option when the idea is another framing, crop, angle, or layout style.

Add a new field only when the idea represents a reusable independent axis of composition control.

A new Framing field may be justified for controls such as:

- subject scale
- safe margin amount
- horizontal or vertical layout bias
- text-safe area placement
- subject alignment
- crop strictness
- number of subjects in frame
- foreground/background layering

However, avoid overcomplicating the module unless the UI needs more granular composition control. The current module intentionally keeps framing as one primary categorized choice plus freeform details.

---

## Relationship With Other Modules

The Framing module should focus on composition and frame structure only.

It should avoid taking over responsibilities from other modules:

| Responsibility | Better Module |
|---|---|
| Camera model, lens type, capture technology | Camera |
| Body stance, gesture, or action | Pose |
| Facial emotion | Expression |
| Scene or environment | Background |
| Light source and illumination | Lighting |
| Global art direction | Style |
| Surface material and tactile finish | Texture |
| Clothing and accessories | Outfit |
| Color system | Color Palette |
| Visual overlays or post-processing | Effects |
| Shape or anatomy transformation | Deformation |

Some overlap is natural. For example, wide-angle framing affects perceived lens feel, and poster framing may imply negative space. Still, this module should describe composition, while Camera, Background, and Style should handle their own specialized responsibilities.

---

## Framing vs Camera

The Camera module defines capture behavior, lens identity, and camera-system look.

The Framing module defines how the subject is positioned and cropped in the image.

For example:

```txt
Camera: portrait lens look with flattering subject proportions
Framing: head-and-shoulders portrait composition with clean upper-body context
```

Camera controls the capture language. Framing controls the composition.

---

## Framing vs Pose

The Pose module defines body position and gesture.

The Framing module defines how that body is shown inside the frame.

For example:

```txt
Pose: dynamic running pose with one arm extended forward
Framing: full-body safe frame preserving the complete silhouette and hand placement
```

Pose controls what the subject is doing. Framing controls how much of it is visible and where it sits.

---

## Framing vs Background

The Background module defines the environment or backdrop.

The Framing module defines how much surrounding space appears around the subject.

For example:

```txt
Background: clean seamless studio surface
Framing: wide full-body frame with extra safe margins for design flexibility
```

Background controls the place or surface. Framing controls the visual boundaries and spacing.

---

## i18n Notes

The module key is `framing`, so related labels usually follow a pattern like:

```txt
modules.framing.*
```

Common i18n areas:

```txt
modules.framing.title
modules.framing.description
modules.framing.groups.*
modules.framing.fields.*
modules.framing.options.*
```

When adding new options, make sure the English and Persian locale files receive matching keys if option labels or descriptions are translated in the UI.

---

## Design Rule of Thumb

The Framing module defines how the image is composed inside its borders.

A good Framing module output sounds like:

```txt
the framing must show the full body from head to toe. Preserve the complete silhouette, posture, feet, clothing, and important body details without cropping any part of the subject.
```

or:

```txt
the framing must preserve enough empty space around the subject for future text or graphic layout. Avoid tight cropping, keep the subject readable, and leave clean design-friendly margins.
```

A bad Framing module output sounds like:

```txt
a smiling warrior in a neon alley, wearing black armor, lit by blue rim light, with film grain and a cyberpunk style
```

That belongs to subject, expression, background, outfit, lighting, effects, and style modules, not Framing.

---

## Checklist for Future Framing Module Changes

Before committing changes, check:

- The new option belongs to the correct category.
- The `value` is stable and snake_case.
- The `category` and `categoryLabel` are consistent.
- The `promptText` describes framing, crop, angle, placement, margins, or layout intent.
- Tags are useful and consistent.
- Similar existing options were checked to avoid duplication.
- The option does not replace Camera, Pose, Background, or Style responsibilities.
- `extraDetails` remains additive.
- `customText` still works as the override field.
- Empty values do not produce awkward compiled output.
- New i18n keys exist in both locales when needed.
- The module still satisfies `PromptKeyModule`.
