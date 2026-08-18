# Prompt Semantics Refactor — Stage 02: Style / Form Boundary

## Goal

Separate **visual style** from **structural form** so the two key modules can be composed independently without competing for the same semantic responsibility.

The central rule remains:

> A module should emit only the signal it owns. It must not guess decisions owned by another module.

## Why Deformation changed

The former `deformation` module contained many useful transformations, especially for people, but its vocabulary mixed several responsibilities:

- generic form geometry
- anatomical proportion changes
- material assumptions
- pose and motion
- character archetypes
- editorial/fashion context
- deformation intensity

At the same time, Style contained `Shape Language`, which also controlled form geometry. That created a direct overlap between two modules.

Stage 02 resolves the overlap by replacing the registered Deformation module with a new first-class `form` module.

The legacy `deformation.module.ts` is intentionally left in the repository during validation, but it is no longer registered in the active module registry.

## Final semantic boundary

### Style owns

1. Aesthetic
2. Medium
3. Stylization Level
4. Linework
5. Visual Treatment
6. Detail Level
7. Finish
8. Extra Details

Style no longer contains Shape Language and Style presets no longer choose form geometry.

### Form owns

1. Form Language
2. Proportions
3. Transformation
4. Transformation Strength
5. Extra Details
6. Custom override

Form is optional and independent. Selecting Style never activates or modifies Form automatically.

This is intentional: if the user chooses Claymation, Low-Poly, Bauhaus, Pixel Art, or another aesthetic without enabling Form, the image model is allowed to infer that aesthetic's normal/default form behavior.

Form becomes meaningful only when the user explicitly wants to override or steer that default.

## Form Language

Universal Form Language options are subject-agnostic:

- soft rounded
- geometric
- fluid organic
- blocky
- angular
- irregular / asymmetric
- faceted / planar
- biomorphic
- monolithic
- branching

Example:

```text
Style: claymation aesthetic, hand-modeled clay, handcrafted finish with tactile variation
Form: irregular asymmetric form language with uneven contours
```

The Form instruction changes the structural character while leaving the Claymation aesthetic intact.

## Proportions

Universal proportional controls include:

- balanced
- elongated
- compact
- wide
- tapered
- top heavy
- bottom heavy
- asymmetric
- oversized elements

Subject-specific proportions are also supported through applicability metadata. Initial Person-specific options include:

- chibi
- fashion elongated
- oversized head
- compact mascot
- long limbs / narrow torso

## Transformation

Universal transformations describe structural behavior without assuming a particular subject:

### Elastic

- stretch
- squash
- elastic bend

### Volume

- compress
- inflate
- flatten

### Warp

- twist
- warp
- melt / droop
- fold

### Structural

- fragment
- offset segments
- fractured planes

### Surreal / Experimental

- directional smear
- impossible geometry
- biomorphic growth

## Person-specific transformations

The former Deformation module had strong person-oriented ideas that produced useful results. They are not discarded; the useful concepts are being preserved as specialized Form options.

Initial retained groups include:

### Person / Caricature

- grotesque caricature
- fashion caricature
- facial exaggeration
- personality asymmetry

### Person / Elastic Anatomy

- rubber-hose anatomy
- spring-loaded anatomy
- balloon anatomy
- squashed compact anatomy

### Person / Constructed Anatomy

- marionette anatomy
- mannequin anatomy
- cuboid anatomy
- faceted anatomy

### Person / Creature Shift

- insectoid anatomy
- creature hybrid
- alien elongation

### Person / Grotesque

- grotesque misshapen
- distorted elegance
- radical silhouette

The legacy file remains available during testing so additional high-value specialized options can be ported after output evaluation instead of blindly migrating every old phrase.

## Subject applicability metadata

`ModuleFieldOption` now supports:

```ts
appliesTo?: Array<ModuleSubjectType | "*">
```

Omitting `appliesTo` means the option is universal.

Example:

```ts
{
  value: "grotesque_caricature",
  appliesTo: ["person"],
}
```

Subject applicability is a UI/context feature. It does **not** add subject-type wording to the compiled prompt.

## Subject Type context

Text-to-image Setup now has an optional `Subject Type` selector:

- General / Unspecified
- Person
- Object
- Animal
- Building / Architecture
- Product
- Vehicle
- Scene / Environment
- Typography
- Abstract
- Custom

Image-to-image reuses the existing reference subject type as module context.

Subject Type is metadata for editor assistance and JSON output. It is not emitted as an extra Modular prompt instruction.

## Subject-aware option behavior

The generic module panel now filters options according to `appliesTo`:

- universal options are always visible
- specialized options appear when the active subject type matches
- General / Unspecified shows universal options only
- existing selected specialized values are never silently deleted

If the user selects a Person-only transformation and later changes Subject Type to Object, the selected value remains in the field and a warning is displayed. The user decides whether to keep, change, or clear it.

This preserves user intent while keeping the option browser relevant.

## Style preset changes

Style recipes no longer set Form values.

Examples:

### Soft 3D Cartoon

Style sets:

- aesthetic: 3D Cartoon
- medium: 3D Render
- visual treatment: Cel Shaded

It does not set Soft Rounded Form. If the user wants that form explicitly, they can enable Form and select it.

### Low-Poly

Style sets:

- aesthetic: Low-Poly
- medium: Low-Poly 3D Render

It does not force Faceted Form Language. The model may infer normal low-poly geometry unless the user explicitly overrides Form.

### Bauhaus Graphic

Style sets:

- aesthetic: Bauhaus
- medium: Vector Illustration
- visual treatment: Flat Graphic

It does not force Geometric Form Language.

## Recommended manual tests

### Test A — Independent Style

Enable Style only.

Try:

- Pixel Art
- Photo Realism
- Handmade Clay
- Low-Poly
- Bauhaus Graphic

Verify that no Form instruction appears and the Style output remains sufficient by itself.

### Test B — Universal Form

Use any non-person subject and enable Form.

Examples:

```text
Subject type: Object
Subject: a vintage desk lamp
Form Language: Irregular / Asymmetric
Transformation: Twist
Transformation Strength: Strong
```

```text
Subject type: Typography
Subject: the word CREATE
Form Language: Blocky
Transformation: Fragment
```

Verify that Form language remains meaningful without anatomy terminology.

### Test C — Person-specific Form

```text
Subject type: Person
Form Transformation: Grotesque Caricature
Transformation Strength: Strong
```

Verify that Person-specific categories are available and the specialized anatomy wording produces the intended behavior.

### Test D — Context change preservation

1. Choose Subject Type = Person.
2. Select a Person-only Form transformation.
3. Change Subject Type to Object.

Expected:

- the Person-only option disappears from normal browsing
- the current selected value remains visible/selected
- an incompatibility warning appears
- the value is not deleted automatically

## Translation patches

English flat-key patches for this stage are stored in:

```text
scripts/i18n-patches/en.style-semantics.ts
scripts/i18n-patches/en.form-semantics.ts
```

The locale files themselves are intentionally not edited directly in this refactor branch.
