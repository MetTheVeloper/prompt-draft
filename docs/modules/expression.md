# Expression Module

## Purpose

The Expression module defines the visible emotional state and facial attitude of the subject. It is responsible for describing how the face communicates emotion through the eyes, brows, mouth, facial tension, and overall readable mood.

This module should answer questions like:

- What emotion or facial attitude should the subject show?
- Should the expression be neutral, friendly, serious, angry, sad, surprised, comic, cute, editorial, or creature-like?
- Should the face feel subtle and controlled or exaggerated and theatrical?
- Should the expression support a portrait, character design, poster, fashion image, action scene, or fantasy creature?

The Expression module should control the face and emotional readability without replacing the Pose, Style, Deformation, Outfit, Lighting, or Background modules.

---

## Source File

```txt
app/modules/expression.module.ts
```

Recommended documentation location:

```txt
docs/modules/expression.md
```

---

## Module Identity

```ts
key: "expression"
icon: "smileys"
```

The `key` identifies the module across the registry, UI, draft state, i18n keys, and compiled prompt output.

The `icon` visually represents facial expression, mood, and emotional state in the UI.

---

## High-Level Structure

The module follows the standard `PromptKeyModule` shape:

```ts
export const ExpressionModule: PromptKeyModule = {
  key,
  icon,
  groups,
  fields,
  compile,
}
```

The Expression module is intentionally simple. It uses one categorized select for the main expression direction, plus optional additive and override text areas.

It does not currently define a `presets` section.

---

## Groups

The Expression module uses three UI groups:

| Group | Role |
|---|---|
| `core` | Primary expression selection. |
| `advanced` | Optional user-written expression details. |
| `override` | Full manual replacement for the module output. |

General pattern:

- `core` defines the main emotional or facial direction.
- `advanced` allows extra expression notes without replacing the structured choice.
- `override` allows a fully custom expression instruction.

---

## Fields Overview

| Field | Type | Group | Role |
|---|---:|---|---|
| `expressionStyle` | select | `core` | Main categorized facial expression direction. |
| `extraDetails` | textarea | `advanced` | Adds custom expression-related notes. |
| `customText` | textarea | `override` | Replaces the module output when filled. |

---

## Field Logic

### `expressionStyle`

`expressionStyle` is the main structured field in this module.

It uses a categorized select, is searchable, clearable, and full width. This is useful because the expression library covers many emotional families and facial attitudes.

This field should describe the subject's visible facial expression and emotional readability.

Good expression-level directions include:

- calm neutral expression
- gentle smile
- intense serious stare
- furious shouting expression
- sad vulnerable face
- shocked wide-eyed reaction
- grotesque comic grin
- cute shy smile
- detached editorial gaze
- mysterious creature-like expression

Avoid using this field for body pose, gesture, camera angle, lighting setup, scene, outfit, material, or full character design unless the detail directly affects the face.

### `extraDetails`

`extraDetails` is additive.

Use it when the user wants a specific expression note that does not need a dedicated structured option yet.

Examples:

- “keep the smile very subtle”
- “make the eyes intense but the mouth calm”
- “preserve the original face identity while changing the emotion”
- “make the expression funny, not scary”
- “avoid exaggerated mouth distortion”

This field should refine the selected expression rather than replace it.

### `customText`

`customText` is the override field.

When filled, it replaces the normal compiled output for this module. This is useful when the expression needs a very specific custom instruction that cannot be built from the available option list.

---

## Options Strategy

The module uses one external option array:

```ts
const expressionStyleOptions = [...]
```

Each option generally includes:

| Property | Purpose |
|---|---|
| `value` | Stable machine-readable value. |
| `category` | Machine-readable category id for grouping. |
| `categoryLabel` | Human-readable category label. |
| `promptText` | Text fragment used in compiled prompt output. |
| `tags` | Semantic tags for search, filtering, or future compatibility logic. |

The current module contains multiple expression categories. Each category holds related expression options that differ in emotional tone, intensity, or use case.

---

## Expression Categories

The `expressionStyleOptions` list is organized into broad expression families.

| Category | Purpose |
|---|---|
| `neutral_controlled` | Calm, restrained, professional, minimal, or natural facial expressions. |
| `positive_friendly` | Smiling, warm, cheerful, playful, confident, or approachable expressions. |
| `dramatic_serious` | Focused, stern, cinematic, mysterious, melancholic, or emotionally heavy expressions. |
| `angry_aggressive` | Angry, furious, confrontational, gritted-teeth, battle-ready, or protest-like expressions. |
| `sad_vulnerable` | Sad, melancholic, vulnerable, tearful, lonely, or heartbroken expressions. |
| `surprised_shocked` | Surprised, shocked, startled, gasping, disbelieving, or overwhelmed reaction faces. |
| `comic_grotesque` | Grotesque, goofy, awkward, satirical, theatrical, or caricature-like expressions. |
| `cute_chibi` | Adorable, innocent, shy, excited, sleepy, mascot-friendly, or chibi-like expressions. |
| `editorial_fashion` | Cool, detached, confident, elegant, aloof, luxury, or model-like expressions. |
| `fantasy_creature` | Mysterious, predatory, ancient, magical, alien, or nonhuman creature expressions. |

When adding new expression options, place them inside an existing category whenever possible. Add a new category only when the new family represents a reusable expression direction that does not fit the current structure.

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

Because the compiler combines selected field output directly, every `promptText` should be concise, reusable, and focused on expression.

---

## Writing New Expression Options

When adding a new expression option:

1. Add it to `expressionStyleOptions`.
2. Use a stable snake_case `value`.
3. Assign it to the correct `category`.
4. Use the matching `categoryLabel`.
5. Write a clear `promptText`.
6. Add useful semantic `tags`.
7. Add i18n keys if the UI expects translated labels and descriptions.
8. Avoid near-duplicate expression options unless the new option produces a meaningfully different facial result.

Recommended `promptText` style:

- Describe the expression through facial behavior.
- Mention eyes, brows, mouth, facial tension, or emotional tone when useful.
- Keep the wording reusable across many subject types.
- Avoid camera, lighting, background, outfit, or pose instructions.
- Avoid turning the expression into a full scene description.
- Be careful with intensity so expression options remain usable across realistic and stylized outputs.

---

## When to Add a New Field Instead of a New Option

Add a new option when the idea is another expression style or emotional state.

Add a new field only when the idea represents a reusable independent axis of expression control.

A new Expression field may be justified for controls such as:

- expression intensity
- mouth openness
- eye direction
- smile strength
- facial tension level
- emotional subtlety
- identity preservation
- realism versus exaggeration

However, avoid overcomplicating the module unless the UI needs more granular control. The current module intentionally keeps expression as one primary categorized choice plus freeform details.

---

## Relationship With Other Modules

The Expression module should focus on facial emotion and mood only.

It should avoid taking over responsibilities from other modules:

| Responsibility | Better Module |
|---|---|
| Body pose or gesture | Pose |
| Global art direction | Style |
| Shape or anatomy distortion | Deformation |
| Camera/lens/depth of field | Camera |
| Crop and composition | Framing |
| Clothing and accessories | Outfit |
| Scene or environment | Background |
| Light setup and illumination | Lighting |
| Surface material and finish | Texture |
| Color system | Color Palette |
| Post-processing or overlays | Effects |

Some overlap is natural. For example, a battle-ready expression may support an action pose, and a fashion expression may support an editorial style. Still, this module should describe the face, while other modules should describe the body, scene, lighting, and visual language.

---

## Expression vs Pose

The Pose module defines body position, gesture, and physical stance.

The Expression module defines facial emotion.

For example:

```txt
Pose: heroic standing pose with squared shoulders
Expression: stern powerful expression with authoritative eyes and a firm mouth
```

These two can work together, but they should not duplicate each other.

---

## Expression vs Deformation

The Deformation module defines structural changes to the face or body.

The Expression module defines emotional facial behavior.

For example:

```txt
Deformation: grotesque comic facial exaggeration with distorted proportions
Expression: grotesque comic grin with overstated facial tension and satirical energy
```

Deformation changes the structure. Expression changes the emotional signal.

---

## Expression vs Style

The Style module defines the global visual language.

The Expression module defines what the face is communicating.

For example:

```txt
Style: cinematic realistic portrait style
Expression: melancholic serious face with thoughtful eyes and subtle sadness
```

The style controls rendering. The expression controls emotional content.

---

## i18n Notes

The module key is `expression`, so related labels usually follow a pattern like:

```txt
modules.expression.*
```

Common i18n areas:

```txt
modules.expression.title
modules.expression.description
modules.expression.groups.*
modules.expression.fields.*
modules.expression.options.*
```

When adding new options, make sure the English and Persian locale files receive matching keys if option labels or descriptions are translated in the UI.

---

## Design Rule of Thumb

The Expression module defines what the face emotionally communicates.

A good Expression module output sounds like:

```txt
the expression must feel warm and friendly. Use a welcoming smile, approachable eyes, pleasant facial energy, and an open emotional tone without becoming exaggerated.
```

or:

```txt
the expression must feel intense and serious. Use focused eyes, controlled mouth tension, and strong facial presence with a clear dramatic emotional weight.
```

A bad Expression module output sounds like:

```txt
a person standing in a neon street, wearing a leather jacket, shot with a wide-angle camera and dramatic blue lighting
```

That belongs to subject, background, outfit, camera, and lighting modules, not Expression.

---

## Checklist for Future Expression Module Changes

Before committing changes, check:

- The new option belongs to the correct category.
- The `value` is stable and snake_case.
- The `category` and `categoryLabel` are consistent.
- The `promptText` describes facial expression, not unrelated modules.
- Tags are useful and consistent.
- Similar existing options were checked to avoid duplication.
- The option stays reusable across realistic, stylized, human, character, and creature outputs when possible.
- `extraDetails` remains additive.
- `customText` still works as the override field.
- Empty values do not produce awkward compiled output.
- New i18n keys exist in both locales when needed.
- The module still satisfies `PromptKeyModule`.
