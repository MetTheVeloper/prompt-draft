# Prompt Semantics Refactor — Stage 04: Setup Subject Context

## Goal

Separate the semantic subject value that belongs in the prompt from the subject classification metadata used by the editor.

The core rule is:

- `subject` is semantic prompt data.
- `subjectType` is editor context metadata.
- `reference` is a separate semantic handle for the attached image in image-to-image mode.

## Canonical subject model

Prompt Settings now own one subject classification taxonomy for both prompt modes:

- unspecified
- person
- object
- animal
- building
- product
- vehicle
- scene
- typography
- abstract
- custom

There is no separate `ReferenceSubjectType` taxonomy.

`subjectType` is the single source of truth used by subject-aware modules such as Form. It is not emitted as a modular prompt key and is not exposed as an insertable System variable.

## Text-to-image subject

In text-to-image mode, `subject` is the user's semantic subject description directly:

```text
Subject Type = animal
Subject = a red fox
```

Produces:

```text
{subject} = a red fox
```

`subjectType = animal` only guides context-aware module controls.

## Image-to-image subject

In image-to-image mode, the same `subjectType` identifies what the main subject in the attached reference is. The same `subject` field optionally adds identifying details.

Example:

```text
Subject Type = person
Subject = young woman with curly hair
```

Produces:

```text
{subject} = person in the attached reference image, young woman with curly hair
```

If Subject Type is `custom`, the user-provided Subject text becomes the direct identity of the referenced subject:

```text
{subject} = red mechanical sculpture in the attached reference image
```

If Subject Type is `unspecified` and no details are supplied, the neutral fallback is:

```text
{subject} = subject in the attached reference image
```

This avoids the previous implicit `person` assumption.

## Subject vs reference

`subject` and `reference` are intentionally separate semantic handles.

```text
{reference} = attached reference image
{subject} = person in the attached reference image
```

This allows instructions such as:

```text
preserve the composition of {reference}, but redesign the form of {subject}
```

The reference identifies the source image; the subject identifies the semantic entity being discussed.

## Subject-aware module context

The active `subjectType` is synchronized to `usePromptSubjectContext()` in both modes.

Modules may use this context to surface applicable options, but must not inject the subject type into their compiled output simply because it is selected.

This preserves the same pattern established by the Form module:

```text
subjectType -> editor context -> applicable options
subject -> prompt semantic value -> reusable token
```

## System variable picker contract

Not every Setup output key is a useful nested variable.

System variables now distinguish between:

1. active/resolvable values
2. explicitly insertable values

This allows `{subject}` to remain visible in the picker even before its text-to-image value is populated, without pretending that an empty subject is already a resolved semantic value.

Insertable Setup variables currently include:

- `{idea}` when populated
- `{subject}` in both modes
- `{reference}` in image-to-image mode
- `{aspect}`
- `{rules}` when populated

The following remain Setup output/state semantics but are intentionally hidden from the variable picker:

- `{mode}`
- `{reference_usage}`
- `{preserve}`
- `{transformation_strength}`

They can remain part of modular output while the later Setup semantic audit decides whether each one belongs in the final prompt at all.

## UI ownership

Subject Type and Subject now belong to Core Context in both modes.

Image-to-Image Settings only own reference interpretation controls such as:

- Reference Usage
- Transformation Strength
- Preserve options

This prevents image-to-image mode from maintaining a second subject model.

## Deferred questions

The following Setup areas are intentionally not decided in this stage:

- whether `{mode}` belongs in final modular output
- final semantics and wording of Reference Usage
- final semantics and wording of Transformation Strength
- Preserve semantics
- Aspect Ratio semantic cleanup
- Global Rules ownership
- final ordering of Setup keys, including moving `{idea}` first

Those belong to the next Setup audit stages.
