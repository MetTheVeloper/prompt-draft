# Prompt Semantics Refactor — Stage 05: Setup Reference Semantics

## Goal

Clarify the three image-to-image reference controls so each owns a distinct semantic responsibility.

## Preserve

`preserve` is a declarative list of properties that must remain stable.

Modular output contains only the selected preservation targets:

```text
{preserve} = main subject, pose, original composition, main color impression, materials and surface details
```

It must not repeat `preserve` or `preserve the` before every item.

Natural output may still turn the list into an imperative sentence such as:

```text
Preserve the main subject, the pose, and the original composition.
```

### Current preserve targets

- main subject
- person's identity (Person only)
- pose
- outfit and visible accessories (Person only)
- original composition
- main color impression
- materials and surface details
- original lighting and mood

## Reference Usage

Reference Usage answers one question:

> How closely should the result follow the reference image overall?

It does not define a specific form transformation.

- Strict Reference: high fidelity to the reference.
- Balanced Reference: preserve the reference while allowing controlled flexibility.
- Loose Inspiration: use the reference as broad visual inspiration.

This axis remains intentionally separate from transformation strength.

## Reference Transformation Strength

The Setup-level `Transformation Strength` UI is named **Reference Transformation Strength**.

It answers:

> How radically may the overall image-to-image result transform away from the reference?

This is a global image-to-image control.

The underlying settings field remains `imageToImage.transformationStrength` so the runtime model does not churn unnecessarily.

## Form Transformation Strength

The Form module field is named **Form Transformation Strength**.

It answers:

> How strongly should the selected structural Form transformation affect the subject's form?

Examples include the strength of warp, grotesque exaggeration, serpentine restructuring, or other Form-specific transformations.

## Separation of responsibilities

```text
Reference Usage
→ overall fidelity to the input reference

Reference Transformation Strength
→ overall degree of allowed image-to-image transformation

Form Transformation Strength
→ strength of the selected structural Form transformation

Preserve
→ explicit properties that must remain stable
```

The controls may intentionally be combined in tension. For example, a strict reference with strong Form transformation can request recognizable identity while substantially changing structural form. The editor should not block such combinations unless future image testing demonstrates a reliably harmful conflict.

## Translation workflow

The English wording overrides for this stage are stored in:

```text
scripts/i18n-patches/en.transformation-scope-semantics.ts
```

Locale files are not edited directly on the semantic refactor branch.
