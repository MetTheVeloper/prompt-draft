# Pose Module

## Purpose

The Pose module defines the subject's body position, physical stance, gesture, and action state. It is responsible for describing how the body is arranged, how weight is distributed, how the limbs behave, and what kind of physical energy the subject communicates.

This module should answer questions like:

- What is the subject physically doing?
- Should the body feel neutral, relaxed, formal, editorial, seated, dynamic, athletic, emotional, or interaction-based?
- Should the pose be simple and readable or dramatic and expressive?
- Are hands, arms, legs, posture, balance, or body tension important to the concept?
- Should the subject be standing, sitting, jumping, running, leaning, reaching, pointing, holding something, or interacting with an object?

The Pose module should control body language and physical action without replacing the Expression, Framing, Deformation, Outfit, Camera, or Background modules.

---

## Source File

```txt
app/modules/pose.module.ts
```

Recommended documentation location:

```txt
docs/modules/pose.md
```

---

## Module Identity

```ts
key: "pose"
icon: "user-edit"
```

The `key` identifies the module across the registry, UI, draft state, i18n keys, and compiled prompt output.

The `icon` visually represents subject control, character editing, or body-position adjustment in the UI.

---

## High-Level Structure

The module follows the standard `PromptKeyModule` shape:

```ts
export const PoseModule: PromptKeyModule = {
  key,
  icon,
  groups,
  fields,
  compile,
}
```

The Pose module is intentionally simple. It uses one categorized pose selector plus optional additive and override text areas.

It does not currently define a `presets` section.

---

## Groups

The Pose module uses three UI groups:

| Group | Role |
|---|---|
| `core` | Primary pose style selection. |
| `advanced` | Optional user-written pose details. |
| `override` | Full manual replacement for the module output. |

General pattern:

- `core` defines the main physical pose or action.
- `advanced` allows extra pose notes without replacing the structured choice.
- `override` allows a fully custom pose instruction.

---

## Fields Overview

| Field | Type | Group | Role |
|---|---:|---|---|
| `poseStyle` | select | `core` | Main categorized body pose, stance, gesture, or action direction. |
| `extraDetails` | textarea | `advanced` | Adds custom pose-related notes. |
| `customText` | textarea | `override` | Replaces the module output when filled. |

---

## Field Logic

### `poseStyle`

`poseStyle` is the main structured field in this module.

It uses a categorized select, is searchable, clearable, and full width. This is useful because the pose library covers neutral body language, fashion poses, seated poses, action poses, hand gestures, sports movement, emotional character acting, and object interaction.

This field should describe the subject's body position, stance, or physical action.

Good pose-level directions include:

- neutral standing pose
- relaxed standing pose
- confident upright pose
- hand-on-hip fashion pose
- seated relaxed pose
- running action pose
- jumping pose
- pointing gesture
- arms crossed pose
- athletic stance
- shy body language
- holding an object
- leaning on a surface

Avoid using this field for facial emotion, camera crop, lens choice, lighting setup, outfit design, background environment, or shape deformation unless the detail directly affects body position.

### `extraDetails`

`extraDetails` is additive.

Use it when the user wants a specific pose note that does not need a dedicated structured option yet.

Examples:

- “keep the pose close to the reference image”
- “make the hands visible and anatomically clear”
- “avoid hiding the face with the arms”
- “keep the body posture natural, not exaggerated”
- “make the pose readable as a full-body silhouette”

This field should refine the selected pose style rather than replace it.

### `customText`

`customText` is the override field.

When filled, it replaces the normal compiled output for this module. This is useful when the pose needs a very specific instruction that cannot be built from the available option list.

---

## Options Strategy

The module uses one external option array:

```ts
const poseStyleOptions = [...]
```

Each option generally includes:

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable value. |
| `category` | Machine-readable category id for grouping. |
| `categoryLabel` | Human-readable category label. |
| `promptText` | Text fragment used in compiled prompt output. |
| `tags` | Semantic tags for search, filtering, or future compatibility logic. |

The current module contains a broad pose library. It favors reusable body-language and action directions instead of highly specific one-off pose descriptions.

---

## Pose Categories

The `poseStyleOptions` list is organized into broad pose families.

| Category | Purpose |
|---|---|
| `neutral_basic` | Simple, readable, balanced, relaxed, formal, or straightforward standing poses. |
| `editorial_fashion` | Fashion-oriented body language, elegant stance, runway posture, asymmetry, and stylized presentation. |
| `seated_resting` | Sitting, lounging, crouching, kneeling, resting, leaning, or grounded body positions. |
| `dynamic_action` | Running, jumping, twisting, reaching, falling, flying, combat, dance, or movement-heavy poses. |
| `gesture_hand_based` | Hand and arm gestures such as pointing, waving, thumbs-up, arms crossed, hands on face, or holding hands together. |
| `sports_athletic` | Athletic stances, sprinting, jumping, boxing, yoga, martial arts, workout, or sport-ready poses. |
| `character_emotional` | Body language driven by personality or emotion, such as shy, heroic, villainous, playful, dramatic, or tired poses. |
| `interaction_object` | Poses involving props, tools, objects, surfaces, pockets, phones, instruments, books, or interaction with nearby elements. |

When adding new pose options, place them inside an existing category whenever possible. Add a new category only when the new family represents a reusable pose logic that does not fit the current structure.

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

Because the compiler combines selected field output directly, every `promptText` should be concise, reusable, and focused on pose behavior.

---

## Writing New Pose Options

When adding a new pose option:

1. Add it to `poseStyleOptions`.
2. Use a stable snake_case `value`.
3. Assign it to the correct `category`.
4. Use the matching `categoryLabel`.
5. Write a clear `promptText`.
6. Add useful semantic `tags`.
7. Add i18n keys if the UI expects translated labels and descriptions.
8. Avoid near-duplicate pose options unless the new option produces a meaningfully different body arrangement.

Recommended `promptText` style:

- Describe body position, body tension, gesture, action, balance, or silhouette.
- Mention arms, hands, legs, torso, weight shift, or posture when useful.
- Keep the wording reusable across realistic, stylized, human, character, and creature outputs when possible.
- Avoid camera, lighting, background, outfit, facial expression, or material instructions.
- Avoid turning the pose option into a full scene description.
- Keep anatomy and readability in mind, especially for hands and dynamic action poses.

---

## When to Add a New Field Instead of a New Option

Add a new option when the idea is another pose, stance, gesture, or action type.

Add a new field only when the idea represents a reusable independent axis of pose control.

A new Pose field may be justified for controls such as:

- pose intensity
- body direction
- hand visibility
- full-body readability
- symmetry/asymmetry
- action speed
- weight distribution
- preserve original pose
- anatomical strictness
- dynamic versus static body language

However, avoid overcomplicating the module unless the UI needs more granular control. The current module intentionally keeps pose simple: one pose selector, optional extra details, and an override.

---

## Relationship With Other Modules

The Pose module should focus on body position and physical action only.

It should avoid taking over responsibilities from other modules:

| Responsibility | Better Module |
|---|---|
| Facial emotion | Expression |
| Crop, angle, and frame placement | Framing |
| Shape or anatomy distortion | Deformation |
| Global art direction | Style |
| Clothing and accessories | Outfit |
| Hair style and hair movement | Hair |
| Camera/lens/capture behavior | Camera |
| Scene or environment | Background |
| Light setup and illumination | Lighting |
| Surface material and finish | Texture |
| Color system | Color Palette |
| Post-processing or overlays | Effects |

Some overlap is natural. For example, a heroic pose may imply emotional energy, and a dynamic pose may imply motion. Still, the Pose module should describe the body's physical arrangement, while other modules describe face, framing, style, lighting, and environment.

---

## Pose vs Expression

The Pose module defines body language.

The Expression module defines facial emotion.

For example:

```txt
Pose: heroic standing pose with squared shoulders and stable posture
Expression: stern powerful face with focused eyes and controlled mouth tension
```

The body communicates physical attitude. The face communicates emotion.

---

## Pose vs Framing

The Pose module defines what the body is doing.

The Framing module defines how that body is placed inside the image.

For example:

```txt
Pose: relaxed seated pose with one arm resting on the knee
Framing: medium shot with the subject centered and clear negative space around the body
```

The pose controls body arrangement. The framing controls crop, angle, and composition.

---

## Pose vs Deformation

The Pose module defines position and gesture.

The Deformation module defines structural form change.

For example:

```txt
Pose: dynamic running pose with strong forward motion
Deformation: rubber-hose elastic limb stretch with exaggerated flexible anatomy
```

Pose moves or positions the body. Deformation changes the body's shape logic.

---

## Pose vs Outfit

The Pose module should not describe clothing, but it may need to account for clothing readability.

For example:

```txt
Pose: hand-on-hip stance with clear waist and shoulder structure
Outfit: formal elegant outfit with structured tailoring
```

The pose creates the body silhouette. The outfit defines the clothing.

---

## i18n Notes

The module key is `pose`, so related labels usually follow a pattern like:

```txt
modules.pose.*
```

Common i18n areas:

```txt
modules.pose.title
modules.pose.description
modules.pose.groups.*
modules.pose.fields.*
modules.pose.options.*
```

When adding new options, make sure the English and Persian locale files receive matching keys if option labels or descriptions are translated in the UI.

---

## Design Rule of Thumb

The Pose module defines what the subject's body is doing.

A good Pose module output sounds like:

```txt
the pose must include a casual weight shift. Let the subject rest more weight on one leg, create a natural asymmetry in the hips and shoulders, and maintain a relaxed but visually appealing stance.
```

or:

```txt
the pose must feel like a dynamic running action pose. Use forward body momentum, active limbs, clear direction of movement, and a readable energetic silhouette.
```

A bad Pose module output sounds like:

```txt
a person in a neon city, wearing a leather jacket, smiling, shot with an 85mm lens and dramatic blue lighting
```

That belongs to subject, background, outfit, expression, camera, and lighting modules, not Pose.

---

## Checklist for Future Pose Module Changes

Before committing changes, check:

- The new option belongs to the correct category.
- The `value` is stable and snake_case.
- The `category` and `categoryLabel` are consistent.
- The `promptText` describes body position, gesture, stance, or action only.
- Tags are useful and consistent.
- Similar existing pose options were checked to avoid duplication.
- The option stays reusable across realistic, stylized, human, character, and creature outputs when possible.
- The option does not accidentally describe facial expression, camera framing, outfit, or lighting.
- `extraDetails` remains additive.
- `customText` still works as the override field.
- Empty values do not produce awkward compiled output.
- New i18n keys exist in both locales when needed.
- The module still satisfies `PromptKeyModule`.
