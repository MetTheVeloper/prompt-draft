# Stage 15 — User Variables + Variable Blueprints

## Status

**Semantically closed.**

Stage 15 formalizes user variables as typed semantic handles and adds Variable Blueprints as editor-side recipes for creating ordinary user-variable state.

The implementation was exercised through the real editor, prompt-output inspection, cross-module targeting, profile expansion/indexing tests, and representative real image-generation workflows. The user approved the resulting architecture and behavior for closure.

Blueprint catalog growth, localization polish, release/build verification, or future convenience recipes do not by themselves keep this semantic stage open.

---

# Original product intent recovered during discovery

Variables exist so the user can create semantic handles that are not already produced naturally by Setup or another module.

Examples:

```text
{personA} = woman wearing glasses
{headline} = Summer Sale
{brandColor} = #ff3344
{printArtwork} = attached artwork reference image
```

The key discovery was that Variables had already become more than string substitution: variable `type` participates in prompt-graph contracts and determines where a handle may be meaningfully consumed or targeted.

The stage therefore preserved the original Variables concept instead of replacing it with a more complicated entity system.

---

# Responsibility contract

Variables owns:

- user-created semantic handles,
- stable user-variable identity,
- human semantic keys/tokens,
- typed value contracts,
- enable/disable state,
- manual variable CRUD,
- Blueprint-driven bulk creation,
- key validation and collision prevention,
- reusable profile/template expansion.

Variables does **not** own the domain semantics of modules that later consume those handles.

Examples:

```text
Variables identifies {anna} as a subject.
Hair defines Anna's hairstyle.
Outfit defines Anna's wearable composition.
Pose defines Anna's body configuration.
Color Palette assigns colors to eligible semantic targets.
```

A Blueprint must not become a mini-module. A Person Profile may create a subject handle, reusable name/label and auxiliary reference, but it does not own Hair, Outfit, Pose or Expression state.

---

# Variable types are semantic contracts

Current user-facing types remain intentionally compact:

```text
text
subject
reference
object
color
font
custom
```

No type expansion was required merely to support more use cases.

Every variable is semantic, but not every variable type has the same relationship to other modules.

## Entity / recipient handles

`subject` and `object` may identify concrete semantic entities.

Subject-scoped modules such as:

```text
Pose
Expression
Hair
Outfit
```

intentionally accept subject recipients.

Color Palette and Texture / Material retain their own broader target policies and may accept compatible subject/object variables.

## Value / input handles

`text`, `color`, `font` and `reference` remain semantic even when they are not assignment recipients.

Canonical rule:

> Semantic variable does not imply assignment target.

Target policy remains a consumer-module decision.

---

# Auxiliary-reference precedent

A user `reference` variable may represent an external semantic input distinct from Setup's main reference.

Canonical tested example:

```text
{printArtwork} = attached artwork reference image
```

The exact Outfit item can then be addressed directly while the user variable provides the image payload:

```text
Print {printArtwork} on {outfit_set1_tShirt} as a {printMethod} on the {printPlacement}.
```

Supporting values remain normal typed variables:

```text
{printPlacement} = front center of the t-shirt
{printMethod} = natural DTF garment print
```

This validated that a new `image`, `print` or `material` variable type was unnecessary.

It also established an authoring rule:

> Localized operations should target the exact semantic module entity when available rather than a broad parent token.

---

# Variable Blueprints

## Core rule

A Variable Blueprint is an **editor recipe** that creates ordinary `PromptVariable[]` state.

It is not a prompt-graph entity and has no independent compiled representation.

After creation, the resulting variables are ordinary editable user variables. They may be renamed, edited, duplicated, disabled or deleted without preserving hidden coupling to the originating Blueprint.

Canonical rule:

> Recipes create editable state; recipes do not own that state afterward.

---

# Blueprint engine

The final engine supports three complementary structures.

## 1. Static recipes

Used for known reusable sets such as:

```text
Poster Content
Business Card
Garment Print
```

Slots may define:

```text
key
type
initial value
description
optional state
```

## 2. Repeatable entity-profile templates

Profiles are intentionally small semantic bundles for common addressable entities.

Current profile starters include:

```text
Person Profile
Animal Profile
Building Profile
Product Profile
Vehicle Profile
Subject Set
```

Person and Animal primary handles use `subject`.
Building, Product and Vehicle primary handles use `object`.

A richer profile remains minimal:

```text
primary semantic entity
optional reusable name/label
optional auxiliary reference
```

Module-owned properties remain outside the Profile.

## 3. Dynamic Custom Variable Set

The Custom Variable Set is the escape hatch for unforeseen structures.

It supports:

- adding/removing rows,
- editing keys,
- editing initial values,
- selecting each row's semantic type independently.

Example:

```text
{character}   subject
{chair}       object
{logoArtwork} reference
{headline}    text
{accentColor} color
{brandFont}   font
```

It still produces ordinary `PromptVariable[]` state and does not introduce a parallel schema.

---

# Profile pattern expansion

The first repeatable implementation rendered multiple independent copies of a profile editor. Real editor testing showed that this was unnecessarily verbose and made user-edited patterns difficult to propagate coherently.

The final model uses **one editable template + count-based expansion at Create time**.

For a profile count greater than one:

- every enabled key pattern must contain exactly one `#`,
- `#` marks the semantic index insertion point,
- a value pattern may contain zero or one `#`,
- a value without `#` is reused unchanged,
- a value with `#` receives the same profile index,
- nested variable references in values are preserved.

Example template:

```text
Key:   person#
Value: #th person in {reference}

Key:   person#Name
Value: ai-random-generated name suitable for {person#} personality
```

With count `3`, this expands to:

```text
{person1} = 1th person in {reference}
{person1Name} = "ai-random-generated name suitable for {person1} personality"
{person2} = 2th person in {reference}
{person2Name} = "ai-random-generated name suitable for {person2} personality"
{person3} = 3th person in {reference}
{person3Name} = "ai-random-generated name suitable for {person3} personality"
```

This pattern dramatically reduces repeated editing while preserving explicit final variables.

---

# Coherent profile indexing

Profile indexing is allocated as a **group-level identity decision** rather than independently uniquifying each generated key.

If an existing profile already occupies:

```text
person1
person1Name
person2
person2Name
```

then another Person Profile operation continues from the next coherent index rather than generating suffixes such as `_2` or mixing profile numbers.

Candidate profile indices are checked against the whole profile pattern, including optional slots, so one pre-existing member can reserve that profile index even when the corresponding optional slot is disabled in the new operation.

Canonical rule:

> A repeated semantic profile owns one coherent index across all of its generated handles.

---

# Human semantic key casing

Stage 15 exposed an important implementation distinction between **stored/display semantic keys** and **comparison identity**.

User-facing semantic keys preserve valid lowerCamelCase:

```text
person1Name
callToAction
printArtwork
```

They must not be destructively lowercased during normalization or serialization.

Collision detection remains case-insensitive, so keys that differ only by case are treated as the same logical namespace entry.

Canonical rule:

> Preserve human semantic casing; normalize separately for comparison identity.

---

# Compiler strategy

No Blueprint compiler exists.

Variables continue to compile ordinary enabled user-variable definitions through the existing Variables pipeline.

Blueprint identity, category, profile count, templates and editor metadata never appear in prompt output.

Text variables retain their existing quoted-value behavior; other types retain ordinary variable serialization.

---

# Natural strategy

Natural output must preserve the same reusable variable graph used by Modular output.

If a variable is referenced elsewhere, its definition must remain available rather than being flattened into duplicated prose.

Blueprints themselves have no Natural representation because they are editor recipes, not prompt semantics.

---

# Validation and warning UX

Variables validation distinguishes real blocking defects from normal prompt-authoring incompleteness.

Examples of real errors include invalid/reserved/duplicate keys or otherwise invalid variable state.

Unused-variable warnings are common during progressive prompt construction and are not semantic errors.

The output UI therefore keeps errors immediately visible while warnings are grouped under a collapsible summary.

Canonical UX rule:

> Blocking semantic errors should remain immediately visible; numerous non-blocking authoring warnings may be collapsed without weakening validation.

---

# Validation evidence

## Poster workflow

Blueprint-created handles such as brand name, headline, subheadline, product, price, call-to-action and address were consumed by structured Typography groups bound to Layout regions.

A real generated poster preserved the major content hierarchy and validated that user Blueprint handles can participate naturally in Layout/Typography prompt graphs.

## Garment Print workflows

Multiple image-to-image prompts used:

```text
{printArtwork}
{printPlacement}
{printMethod}
```

alongside referenced subjects, Pose/Expression assignments, hierarchical Outfit items, Color Palette targets, Background, Lighting, Camera and Effects.

The resulting images successfully demonstrated:

- recognizable reference identity,
- outfit replacement,
- artwork application to the intended T-shirt,
- improved precision from item-level Outfit targeting,
- compatibility between Variables and multiple independently owned semantic modules.

## Profile-template workflow

The final Person Profile editor was tested with multiple profile counts and user-edited key/value patterns.

A three-profile template correctly produced:

```text
{person1}
{person1Name}
{person2}
{person2Name}
{person3}
{person3Name}
```

with value patterns expanded using matching indices and nested references such as `{person2}` preserved correctly.

The editor/list/output path also confirmed that lowerCamelCase keys remain intact after creation/editing rather than being destructively lowercased.

## Broader integration

Earlier real-image and editor tests already confirmed that generated subject/object/reference variables interact correctly with the existing recipient/target infrastructure rather than creating a separate graph system.

The user accepted Stage 15 after the final profile expansion, casing and warning-UX fixes.

---

# Implementation checkpoint

Implemented on `refactor/prompt-semantics` across the existing Variables pipeline and the new Blueprint surfaces, including:

```text
app/modules/variables.blueprints.ts
app/components/modules/variables/VariableBlueprintModal.vue
app/components/modules/variables/VariablesField.vue
app/utils/promptVariables.ts
app/components/prompt/output-preview.vue
```

The final architecture includes:

- ordinary manual Variables CRUD,
- typed semantic handles,
- categorized Blueprint discovery,
- static recipes,
- entity Profile templates,
- `#`-based indexed key/value expansion,
- coherent collision-aware profile indexing,
- optional profile slots,
- dynamic Custom Variable Set rows,
- per-row type editing for Custom Variable Set,
- lowerCamelCase-preserving semantic keys,
- collapsed non-blocking warning presentation,
- no persistent Blueprint coupling in prompt state.

---

# Non-semantic follow-up

The following work may still be performed as normal engineering/release maintenance without reopening Stage 15:

- additional Blueprint/Profile catalog entries,
- translation/localization polish,
- cosmetic editor refinements,
- release/build/generate verification in the target deployment environment,
- additional warning presentation improvements,
- documentation examples.

These do not change the accepted semantic contract.

---

# Reusable lessons established by Stage 15

1. **Variables are semantic handles, not mere string placeholders.** Type participates in cross-module contracts.
2. **Semantic does not mean universally targetable.** Recipient policy belongs to the consuming module.
3. **Auxiliary references can remain normal typed variables.** A new variable type is unnecessary when the semantic difference is already represented by existing types and consumer context.
4. **Blueprints should create ordinary state and then disappear.** Do not make recipe identity part of the prompt graph.
5. **Profile recipes should remain small.** Do not turn entity profiles into mini-modules that steal domain ownership.
6. **Repeat one editable template, not the editor UI.** Count-based template expansion is more reusable and easier to customize than rendering many near-identical forms.
7. **An explicit index marker is useful for user-editable repeat patterns.** A single `#` cleanly identifies index placement in keys and optionally values.
8. **Repeated semantic groups need coherent index allocation.** Resolve collisions at the whole-profile level rather than uniquifying each key independently.
9. **Human semantic casing and comparison identity are separate concerns.** Preserve lowerCamelCase while comparing keys case-insensitively.
10. **Non-blocking warning volume is a UX concern, not a semantic failure.** Keep errors prominent while allowing repetitive warnings to collapse.
11. **The best proof of a variable system is composition.** Variables should work naturally inside Typography, Outfit, Color, Pose/Expression and other independently owned semantics rather than requiring special-case compilers.

---

# Closure rule

Do not reopen Variables / Variable Blueprints for:

- ordinary requests for additional Profile or content recipes,
- minor Blueprint wording preferences,
- cosmetic modal/layout changes,
- localization polish,
- release-environment build chores,
- ordinary image-model variance,
- warnings caused simply by variables not yet being used during prompt construction.

Reopen only when later evidence reveals:

- a concrete variable ownership/type-contract defect,
- broken variable definition/reference preservation,
- incorrect target/recipient exposure,
- reproducible key collision or profile-index corruption,
- destructive semantic-key normalization,
- Blueprint metadata leaking into prompt semantics,
- Natural/Modular prompt-graph loss,
- or another real semantic failure that cannot be represented by the accepted contract.

With those exceptions, **Stage 15 — User Variables + Variable Blueprints is closed.**
