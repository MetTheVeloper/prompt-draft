# Camera Module

## Purpose

The Camera module defines the photographic or cinematic capture language of the generated prompt. It describes how the image should feel as if it was captured: lens behavior, camera type, perspective behavior, depth of field, capture realism, and photo or cinema camera character.

This module should answer questions like:

- What kind of camera or lens language should the image use?
- Should the result feel like a professional camera, smartphone snapshot, webcam, drone shot, action camera, film camera, or cinema camera?
- Should the image use shallow depth of field, deep focus, fisheye distortion, wide-angle perspective, macro detail, or telephoto compression?
- Should the result feel digital, analog, cinematic, documentary, casual, immersive, or surveillance-like?

The Camera module is about capture behavior. It should not replace the Framing module, Lighting module, Background module, or Style module.

---

## Source File

```txt
app/modules/camera.module.ts
```

Recommended documentation location:

```txt
docs/modules/camera.md
```

---

## Module Identity

```ts
key: "camera"
icon: "camera"
```

The `key` identifies the module across the registry, UI, draft state, i18n keys, and compiled prompt output.

The `icon` is used by the UI to visually represent the module.

---

## High-Level Structure

The module follows the standard `PromptKeyModule` shape:

```ts
export const CameraModule: PromptKeyModule = {
  key,
  icon,
  groups,
  fields,
  compile,
}
```

The Camera module is intentionally simple. It uses one categorized select for the main camera direction, plus optional additive and override text areas.

It does not currently define a `presets` section.

---

## Groups

The Camera module uses three UI groups:

| Group | Role |
|---|---|
| `core` | Primary camera or lens selection. |
| `advanced` | Optional user-written camera details. |
| `override` | Full manual replacement for the module output. |

General pattern:

- `core` contains the structured camera choice.
- `advanced` allows extra camera notes without changing the core structure.
- `override` allows a fully custom camera instruction.

---

## Fields Overview

| Field | Type | Group | Role |
|---|---:|---|---|
| `cameraStyle` | select | `core` | Main categorized camera, lens, or capture style. |
| `extraDetails` | textarea | `advanced` | Adds custom camera-related notes. |
| `customText` | textarea | `override` | Replaces the module output when filled. |

---

## Field Logic

### `cameraStyle`

`cameraStyle` is the main structured field in this module.

It uses a categorized select, is searchable, clearable, and full width. This is important because the option list includes both general lens behaviors and named camera-system looks.

This field should describe the photographic or cinematic capture behavior of the image.

Good camera-level directions include:

- macro lens look
- fisheye lens distortion
- wide-angle lens look
- telephoto compression
- portrait lens look
- shallow depth of field
- deep focus
- documentary camera feel
- smartphone camera look
- analog film camera look
- professional digital cinema camera look

Avoid using this field for composition, subject placement, lighting setup, environment, outfit, or global illustration style.

### `extraDetails`

`extraDetails` is additive.

Use it when the user wants a camera-specific detail that does not need a dedicated structured option yet.

Examples:

- “slightly low-quality front camera feel”
- “high shutter speed freeze-frame”
- “subtle lens breathing”
- “natural handheld imperfection”

This field should enhance the selected camera style rather than replace it.

### `customText`

`customText` is the override field.

When filled, it replaces the normal compiled output for this module. This is useful when the camera instruction needs to be very specific or when the available options are not enough.

---

## Options Strategy

The module uses one external option array:

```ts
const cameraOptions = [...]
```

Each option generally includes:

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable value. |
| `category` | Machine-readable category id for grouping. |
| `categoryLabel` | Human-readable category label. |
| `promptText` | Text fragment used in compiled prompt output. |
| `tags` | Semantic tags for search, filtering, or future compatibility logic. |

The current Camera module uses a broad single-field library instead of separate fields for lens, camera body, depth of field, and capture type.

This keeps the UI simple and makes the module fast to use.

---

## Camera Categories

The `cameraOptions` list is organized into three main categories.

| Category | Purpose |
|---|---|
| `general` | Generic lens, perspective, capture, and depth-of-field behaviors. |
| `analog` | Film camera and vintage camera looks. |
| `digital` | Modern digital camera, mirrorless, medium-format, and cinema camera looks. |

### General

The `general` category covers reusable camera behavior that is not tied to a specific named camera.

Examples include:

- macro lens
- fisheye lens
- wide-angle lens
- ultra wide-angle lens
- telephoto compression
- portrait lens
- shallow depth of field
- deep focus
- documentary camera
- cinematic camera
- handheld camera
- security camera
- webcam camera
- smartphone camera
- action camera
- aerial drone camera

Use this category when the desired effect is about lens behavior, capture style, viewpoint, or general camera feeling.

### Analog Cameras

The `analog` category covers vintage, film, instant, compact, rangefinder, and medium-format camera aesthetics.

Examples include:

- Polaroid SX-70
- Kodak disposable camera
- Canon AE-1
- Nikon F3
- Pentax K1000
- Leica M6
- Hasselblad 500C/M
- Rolleiflex
- Contax T2
- Lomography

Use this category when the output should feel like film photography, instant photography, vintage capture, analog snapshots, or nostalgic photographic texture.

### Digital Cameras

The `digital` category covers modern digital camera and cinema camera looks.

Examples include:

- Canon EOS R5
- Nikon Z8
- Sony A7R IV
- Sony A7S III
- Fujifilm X100V
- Fujifilm GFX 100S
- Leica Q2
- Leica SL2
- Hasselblad X2D
- RED Komodo
- ARRI Alexa
- Blackmagic Pocket Cinema Camera

Use this category when the output should feel like high-resolution modern photography, premium mirrorless capture, medium-format detail, or professional digital cinema capture.

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

## Writing New Camera Options

When adding a new camera option:

1. Add it to `cameraOptions`.
2. Use a stable snake_case `value`.
3. Assign it to the correct `category`.
4. Use the matching `categoryLabel`.
5. Write a concise `promptText`.
6. Add useful semantic `tags`.
7. Add i18n keys if the UI expects translated labels and descriptions.
8. Avoid adding near-duplicate camera names unless they produce meaningfully different prompt behavior.

Recommended `promptText` style:

- Describe the camera look or capture behavior directly.
- Keep it short enough to combine with other module fragments.
- Avoid subject-specific assumptions.
- Avoid background, outfit, pose, and lighting instructions.
- Avoid turning camera options into full scene descriptions.
- Prefer “camera look”, “lens look”, “capture style”, “perspective”, or “depth-of-field” language.

---

## When to Add a New Field Instead of a New Option

Add a new option when the idea is another camera, lens, or capture style.

Add a new field only when the idea represents a reusable independent camera-control axis.

A new Camera field may be justified for controls such as:

- lens length
- aperture / depth-of-field strength
- shutter behavior
- sensor or film feel
- camera movement
- image sharpness
- camera height or viewpoint

However, avoid overcomplicating the module unless the UI needs more granular control. The current module intentionally keeps camera behavior as a single categorized choice.

---

## Relationship With Other Modules

The Camera module should focus on capture behavior only.

It should avoid taking over responsibilities from other modules:

| Responsibility | Better Module |
|---|---|
| Crop, distance, and subject placement | Framing |
| Lighting setup and mood | Lighting |
| Scene or environment | Background |
| Global art direction | Style |
| Surface material | Texture |
| Pose or gesture | Pose |
| Facial emotion | Expression |
| Clothing and accessories | Outfit |
| Color system | Color Palette |
| Post-processing effects | Effects |

Some overlap is natural. For example, shallow depth of field affects background blur, and wide-angle lenses affect composition. Still, the Camera module should describe the capture behavior, while Framing and Background should handle layout and environment.

---

## i18n Notes

The module key is `camera`, so related labels usually follow a pattern like:

```txt
modules.camera.*
```

Common i18n areas:

```txt
modules.camera.title
modules.camera.description
modules.camera.groups.*
modules.camera.fields.*
modules.camera.options.*
```

When adding new options, make sure the English and Persian locale files receive matching keys if option labels or descriptions are translated in the UI.

---

## Design Rule of Thumb

The Camera module defines how the image feels captured.

A good Camera module output sounds like:

```txt
portrait lens look, flattering subject proportions
```

or:

```txt
ARRI Alexa digital cinema camera look, professional cinematic capture
```

A bad Camera module output sounds like:

```txt
a woman standing in a neon alley with dramatic blue lighting and a leather jacket
```

That belongs to subject, background, lighting, and outfit modules, not Camera.

---

## Checklist for Future Camera Module Changes

Before committing changes, check:

- The new option belongs to the correct category.
- The `value` is stable and snake_case.
- The `category` and `categoryLabel` are consistent.
- The `promptText` describes camera behavior, not unrelated modules.
- Tags are useful and consistent.
- Similar existing options were checked to avoid duplication.
- `extraDetails` remains additive.
- `customText` still works as the override field.
- Empty values do not produce awkward compiled output.
- New i18n keys exist in both locales when needed.
- The module still satisfies `PromptKeyModule`.
