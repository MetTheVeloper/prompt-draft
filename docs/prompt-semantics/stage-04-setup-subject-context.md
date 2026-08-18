# Prompt Semantics Refactor — Stage 04: Setup Subject Context

## Goal

Separate the semantic subject value that belongs in the prompt from the subject classification metadata used by the editor.

The core rule is:

- `subject` is semantic prompt data.
- `subjectType` is editor context metadata.
- `reference` is a separate semantic handle for the attached image in image-to-image mode.

## Canonical subject model

Prompt Settings own one subject classification taxonomy for both prompt modes:

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

## Resolved subject model

The raw `subject` field always remains user-authored data. The compiler derives a resolved subject without writing generated text back into the input.

The rule is:

```text
resolved subject = user subject || subject-type fallback
```

A subject-type fallback is only generated for semantically specific subject types. `unspecified` and `custom` do not invent a text-to-image subject when the user field is empty.

This preserves authorship while still giving the prompt a minimal usable subject when the user has already provided enough classification context.

## Text-to-image subject

When the user provides a subject explicitly, that text wins:

```text
Subject Type = animal
Subject = a red fox
```

Produces:

```text
{subject} = a red fox
```

When the user leaves Subject empty but selects a specific Subject Type, the compiler supplies a minimal fallback:

```text
Subject Type = scene
Subject =
```

Produces:

```text
{subject} = scene or environment
```

Typical text-to-image fallbacks include:

```text
person -> person
object -> object
animal -> animal
building -> building or architectural subject
product -> product
vehicle -> vehicle
scene -> scene or environment
typography -> typography
abstract -> abstract forms
```

`subjectType` itself still only guides context-aware module controls.

The Setup UI surfaces the generated fallback separately instead of mutating the user's Subject input.

## Image-to-image subject

In image-to-image mode, the same `subjectType` identifies what the main subject in the reference is. The same `subject` field optionally adds identifying details.

Reference remains a first-class System variable:

```text
{reference} = attached reference image
```

Generated image-to-image subjects reuse that variable instead of repeating the literal reference phrase:

```text
Subject Type = scene
Subject =
```

Produces:

```text
{subject} = scene or environment in {reference}
```

With additional details:

```text
Subject Type = person
Subject = young woman with curly hair
```

Produces:

```text
{subject} = person in {reference}, young woman with curly hair
```

If Subject Type is `custom`, the user-provided Subject text becomes the direct identity of the referenced subject:

```text
{subject} = red mechanical sculpture in {reference}
```

If Subject Type is `unspecified` and no details are supplied, the neutral fallback is:

```text
{subject} = subject in {reference}
```

This avoids the previous implicit `person` assumption while demonstrating the intended nested-variable architecture.

## Subject vs reference

`subject` and `reference` are intentionally separate semantic handles.

```text
{reference} = attached reference image
{subject} = person in {reference}
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

A Setup variable is shown in the picker only when it has a resolved semantic value and is explicitly useful for nesting.

Insertable Setup variables currently include:

- `{idea}` when populated
- `{subject}` when the resolved subject is non-empty
- `{reference}` in image-to-image mode
- `{aspect}`
- `{rules}` when populated

The following remain Setup output/state semantics but are intentionally hidden from the variable picker:

- `{mode}`
- `{reference_usage}`
- `{preserve}`
- `{transformation_strength}`

## Mode semantics

`{mode}` remains in modular output for now:

```text
{mode} = text to image
{mode} = image to image
```

It is short, explicit, and provides a high-level interpretation cue without adding detailed assumptions. It is intentionally not exposed as an insertable variable.

## Aspect Ratio semantics

Aspect Ratio now owns only canvas proportion.

All platform, document, layout, composition, and use-case hints remain UI metadata and are not injected into prompt semantics.

Examples:

```text
{aspect} = 1:1
{aspect} = 3:2
{aspect} = 9:16
{aspect} = 1:1.414
```

The semantic compiler reads the option's `ratio` value directly. Labels and descriptions may still explain common use cases in the UI, but those explanations do not enter the prompt.

## UI ownership

Subject Type and Subject belong to Core Context in both modes.

Image-to-Image Settings only own reference interpretation controls such as:

- Reference Usage
- Transformation Strength
- Preserve options

This prevents image-to-image mode from maintaining a second subject model.

## Deferred questions

The following Setup areas remain intentionally open:

- final semantics and wording of Reference Usage
- final semantics and wording of Transformation Strength
- Preserve semantics
- Global Rules ownership
- final ordering of Setup keys, including moving `{idea}` first

Those belong to the next Setup audit stages.
