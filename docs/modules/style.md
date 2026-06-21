# Style Module

## Purpose

The Style module defines the overall visual language of the generated prompt. It is responsible for describing the image style, medium, stylization intensity, shape language, visual treatment, and final finish.

This module should answer questions like:

- What broad style should the output follow?
- What medium or production method should it look like?
- How stylized should the result be?
- What kind of forms, surfaces, and rendering language should guide the image?
- Should the result feel clean, premium, handmade, graphic, rough, matte, glossy, etc.?

The Style module is usually one of the strongest prompt-shaping modules because it affects the entire output rather than a local detail.

---

## Source File

```txt
app/modules/style.module.ts
```

Recommended documentation location:

```txt
docs/modules/style.md
```

---

## Module Identity

```ts
key: "style"
icon: "magicpen"
```

The `key` is used as the module identifier across the prompt system, registry, UI, i18n keys, presets, draft state, and compiled output.

The `icon` is used by the UI to visually represent the module.

---

## High-Level Structure

The module follows the standard `PromptKeyModule` shape:

```ts
export const StyleModule = {
  key,
  icon,
  groups,
  fields,
  presets,
  compile,
} satisfies PromptKeyModule
```

Main sections:

| Section | Purpose |
|---|---|
| `groups` | Defines how fields are visually grouped in the module UI. |
| `fields` | Defines user-editable inputs and their UI behavior. |
| `presets` | Defines ready-made combinations of field values. |
| `compile` | Defines how selected field values are converted into prompt text. |

---

## Groups

The Style module uses four UI groups:

| Group | Role |
|---|---|
| `core` | Primary style identity: broad preset and medium. |
| `modifiers` | Secondary controls that refine the look. |
| `advanced` | Freeform additive details. |
| `override` | Full manual replacement for the module output. |

General pattern:

- `core` is for high-impact style choices.
- `modifiers` is for controlled visual direction.
- `advanced` is for additional user notes.
- `override` is for replacing the generated module text completely.

This structure is a good pattern to reuse in future modules when a module needs both guided controls and a manual override.

---

## Fields Overview

The Style module currently has eight fields.

| Field | Type | Group | Role |
|---|---:|---|---|
| `preset` | select | `core` | Broad predefined style direction. |
| `medium` | select | `core` | The visual medium or production method. |
| `stylizationLevel` | select / segmented | `modifiers` | Controls how subtle or extreme the style transformation is. |
| `shapeLanguage` | select | `modifiers` | Controls the dominant form language. |
| `visualTreatment` | select | `modifiers` | Controls rendering treatment such as cel shading, flat graphic look, handmade marks, etc. |
| `finish` | select | `modifiers` | Controls final polish or surface feel. |
| `extraDetails` | textarea | `advanced` | Adds custom style notes without replacing the structured fields. |
| `customText` | textarea | `override` | Replaces the module output when filled. |

---

## Field Logic

### `preset`

`preset` is the broadest style selector. It provides a ready-made style phrase such as a cartoon, cinematic, handmade, editorial, print, toy, or CGI direction.

Use this field for large style changes.

### `medium`

`medium` defines the production medium or material language. It is categorized in the UI.

Current medium categories include:

- Digital / CG
- Drawing
- Painting
- Paper Craft
- Photography
- Printmaking
- Sculpture / Object
- Textile / Handmade

Use this field when the final output should feel like a specific art medium, render type, printed process, photo type, craft object, or handmade material.

### `stylizationLevel`

`stylizationLevel` controls how strongly the image should move away from realism or the input reference.

It has a default value of `controlled`, which makes the module useful even when the user does not manually adjust this field.

This field is shown as a segmented control and should stay compact.

### `shapeLanguage`

`shapeLanguage` describes the visual form system, such as rounded, geometric, fluid, blocky, elongated, or angular.

Use this field to shape the silhouette and construction logic of the output.

### `visualTreatment`

`visualTreatment` controls the rendering method or surface treatment.

It has compatibility logic that depends on `medium`. The UI can sort or hint options based on whether a treatment fits the selected medium.

This field is useful for treatments such as graphic rendering, painted marks, paper construction, comic halftone behavior, texture, minimalism, and similar style-level rendering choices.

### `finish`

`finish` controls the final look and polish.

Like `visualTreatment`, it depends on `medium` for compatibility sorting and hints.

This field should describe the final quality of the output rather than the base medium.

### `extraDetails`

`extraDetails` is an additive text field.

Use it for user-specific style notes that do not deserve a dedicated structured option yet.

It should not replace the structured fields.

### `customText`

`customText` is the override field.

When filled, it replaces the normal compiled output for this module. This allows the user to bypass all structured controls and write the exact style description manually.

---

## Options Strategy

The module uses option arrays outside the module object:

```ts
const stylePresetOptions = [...]
const mediumOptions = [...]
const stylizationLevelOptions = [...]
const shapeLanguageOptions = [...]
const visualTreatmentOptions = [...]
const finishOptions = [...]
```

Each option generally includes:

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable value. |
| `promptText` | Text fragment used in compiled prompt output. |
| `tags` | Semantic tags used for search, filtering, or compatibility logic. |
| `category` | Used by categorized selects, mainly for medium options. |
| `compatibility` | Optional compatibility metadata for fields that depend on another field. |

The current Style module uses compatibility metadata mainly for `visualTreatment` and `finish`, both depending on `medium`.

---

## Compatibility Pattern

Some style fields include compatibility data:

```ts
compatibility: {
  preferredTags: [...],
  supportedTags: [...],
  discouragedTags: [...],
  warningKey: "..."
}
```

This lets the UI guide the user without blocking creative choices.

Recommended behavior for future modules:

- Use `preferredTags` for strong matches.
- Use `supportedTags` for acceptable matches.
- Use `discouragedTags` for unlikely or visually inconsistent combinations.
- Use `warningKey` for i18n-friendly UI messages.
- Prefer hinting and sorting over hard validation unless a combination is truly invalid.

The Style module uses this pattern well because unusual style combinations can still be creatively useful.

---

## Presets

The `presets` section contains ready-made combinations of field values.

A preset usually fills:

```ts
{
  preset,
  medium,
  stylizationLevel,
  shapeLanguage,
  visualTreatment,
  finish
}
```

Presets should represent useful real-world combinations, not every possible option.

Good Style presets should:

- Create a coherent style direction.
- Fill multiple fields at once.
- Avoid overly narrow one-off use cases.
- Stay reusable across many prompt subjects.
- Use stable field values that already exist in the module options.

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

This means every structured option should have clean, reusable `promptText` because the compiler simply combines selected fragments.

Avoid writing option prompt text that assumes too much about the subject, background, camera, or other modules.

---

## Writing New Style Options

When adding a new Style option:

1. Add it to the correct option array.
2. Use a stable snake_case `value`.
3. Write a concise `promptText`.
4. Add useful semantic `tags`.
5. Add `category` when the field uses categorized layout.
6. Add compatibility metadata when the option depends on another field.
7. Add i18n labels and descriptions if the UI expects them.
8. Add the option to a preset only if it creates a reusable style combination.

Recommended `promptText` style:

- Short enough to combine with other fields.
- Descriptive enough to affect the output.
- No duplicated wording from other common fields.
- No subject-specific assumptions.
- No camera, background, pose, outfit, or lighting instructions unless the style absolutely requires it.

---

## When to Add a New Field Instead of a New Option

Add a new option when the idea fits an existing axis such as medium, finish, treatment, or shape language.

Add a new field only when the idea represents a new reusable axis of control.

A new Style field may be justified when:

- The concept affects many styles.
- It cannot be expressed cleanly as a preset, medium, treatment, finish, or shape language.
- It should be independently adjustable by the user.
- It has clear UI behavior and compile behavior.

Avoid adding fields for one-off prompt details. Use `extraDetails` or a preset instead.

---

## Relationship With Other Modules

The Style module should focus on visual language only.

It should avoid taking over responsibilities from other modules:

| Responsibility | Better Module |
|---|---|
| Scene or environment | Background |
| Light setup | Lighting |
| Camera/lens/depth of field | Camera |
| Composition/crop | Framing |
| Character pose | Pose |
| Face emotion | Expression |
| Clothing | Outfit |
| Surface material details | Texture |
| Color palette | Color Palette |

Some overlap is natural, but the Style module should stay broad and global.

---

## i18n Notes

The module key is `style`, so related labels usually follow a pattern like:

```txt
modules.style.*
```

Common i18n areas:

```txt
modules.style.title
modules.style.description
modules.style.groups.*
modules.style.fields.*
modules.style.presets.*
modules.style.options.*
modules.style.fields.visualTreatment.compatibilityWarnings.*
modules.style.fields.finish.compatibilityWarnings.*
```

When adding options or presets, make sure the English and Persian locale files receive matching keys.

---

## Design Rule of Thumb

The Style module should define the global art direction.

It should not describe the subject itself.

A good Style module output sounds like:

```txt
cinematic realistic image style, photo-real medium, controlled stylization, clean polished aesthetic
```

A bad Style module output sounds like:

```txt
a man standing in a neon street with dramatic lighting and a leather jacket
```

The second example belongs to subject, background, lighting, and outfit modules, not Style.

---

## Checklist for Future Style Module Changes

Before committing changes, check:

- The new option belongs to the correct field.
- The `value` is stable and snake_case.
- The `promptText` is concise and reusable.
- Tags are useful for search or compatibility.
- Compatibility metadata is added when needed.
- Presets remain coherent and not too specific.
- `customText` still works as the override field.
- Empty values do not produce awkward compiled output.
- New i18n keys exist in both locales.
- The module still satisfies `PromptKeyModule`.
