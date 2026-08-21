# Stage 15 — User Variables Semantics

## Status

**Implementation in progress.**

The semantic contract is stable enough for implementation and representative first-generation Blueprint tests have validated the core idea. The Blueprint editor has now been refactored toward repeatable entity profiles and an open-ended custom variable set. Build verification and user validation of this second Blueprint iteration are still required before closure.

---

## Original product intent recovered during discovery

Variables exist so the user can create semantic handles that are not already produced naturally by Setup or another module.

Examples:

```text
{personA} = woman wearing glasses
{headline} = Summer Sale
{brandColor} = #ff3344
{printArtwork} = attached artwork reference image
```

User variables are not merely string-substitution conveniences. Their type participates in semantic contracts across the prompt graph.

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

No type expansion is currently justified merely to support more Blueprints.

---

# Responsibility contract

Variables owns:

- user-created semantic handles,
- stable user-variable identity,
- human semantic keys/tokens,
- typed value contracts,
- enable/disable state,
- manual variable creation/editing,
- Blueprint-driven bulk creation,
- key validation and collision prevention.

Variables does not own the payload semantics of modules that later consume or target those handles.

Examples:

```text
Variables identifies {anna} as a subject.
Hair defines Anna's hairstyle.
Outfit defines Anna's wearable composition.
Pose defines Anna's body configuration.
Color Palette assigns colors to eligible semantic targets.
```

A Blueprint must not become a mini-module. For example, a Person Profile should not begin owning hairstyle, outfit, pose or expression state merely because those concepts relate to a person.

---

# Variable types are semantic contracts

Every variable is semantic, but not every variable type has the same relationship to other modules.

## Entity / recipient handles

`subject` and `object` may identify concrete semantic entities that selected modules can target directly.

Subject-scoped modules such as Pose, Expression, Hair and Outfit intentionally accept only subject recipients.

Color / Material use their own broader target policies and currently admit compatible user subject/object handles.

## Value / input handles

Types such as `text`, `color`, `font` and `reference` remain semantic even when they are not assignment recipients.

A semantic variable may therefore be useful as an input/reference without becoming a valid target.

The rule is:

> Semantic variable does not imply assignment target.

Target policy remains a consumer-module decision.

---

# Auxiliary-reference precedent

A user `reference` variable may represent an external semantic input distinct from the main Setup reference.

Canonical tested example:

```text
{printArtwork} = attached artwork reference image
```

An Outfit item may then be addressed directly while the reference variable supplies the artwork payload:

```text
Print {printArtwork} on {outfit_set1_tShirt} as a {printMethod} on the {printPlacement}.
```

The T-shirt remains an Outfit item entity. A duplicate user `object` variable is not required merely to make that garment addressable.

Optional supporting handles remain ordinary text variables:

```text
{printPlacement} = front center of the t-shirt
{printMethod} = natural DTF garment print
{printScale} = large chest print
```

This demonstrates why a new `image`, `material` or `print` variable type is not currently required.

The real-image tests also established a useful authoring precedent:

> Localized operations such as printing, embroidery, patches, labels or artwork placement should address the exact module entity when available rather than a broad parent module token.

---

# Variable Blueprints

## Core rule

A Variable Blueprint is an editor recipe for creating ordinary `PromptVariable[]` state.

It is **not** a new prompt-graph entity and must never compile into prompt output by itself.

After applying a Blueprint, created variables become fully ordinary editable user variables. The user may rename, edit, duplicate, disable or delete them without preserving any hidden dependency on the source Blueprint.

This follows the project-wide precedent:

> Recipes create editable state; recipes do not own that state afterward.

---

# Blueprint engine

The engine now supports three useful structures.

## 1. Static slots

Used for known content recipes such as Poster Content, Business Card and Garment Print.

A slot defines an initial:

```text
key
type
value
description
optional state
```

The resulting variable is still an ordinary `PromptVariable` after creation.

## 2. Repeatable profile groups

A repeatable group creates a coherent set of related variable slots per entity instance.

Canonical Person Profile shape:

```text
Person 1
├── {person1}          subject
├── {person1Name}      text      optional
└── {person1Reference} reference optional

Person 2
├── {person2}          subject
├── {person2Name}      text      optional
└── {person2Reference} reference optional
```

The user chooses the number of complete profiles, not the number of unrelated rows.

Group indexing is allocated coherently. If one candidate profile index would collide with an existing user/system/module key, the engine skips that index for the entire profile rather than allowing mixed numbering across its slots.

## 3. Dynamic Custom Variable Set

The Custom Variable Set is the escape hatch for unforeseen prompt structures.

It supports:

- adding/removing arbitrary variable rows,
- editing every key,
- entering initial values,
- choosing the type of each row independently from the existing Variables type catalog.

Example:

```text
{character}   subject
{chair}       object
{logoArtwork} reference
{headline}    text
{accentColor} color
{brandFont}   font
```

The Custom Variable Set does not introduce a separate variable schema. It creates the same ordinary `PromptVariable[]` state as every other Blueprint.

---

# Profile Blueprint policy

Profiles are intentionally limited to common reusable semantic entities rather than attempting to predict every possible use case.

Current profile starters:

```text
Person Profile
Animal Profile
Building Profile
Product Profile
Vehicle Profile
Subject Set
```

Person and Animal primary handles use `subject` because they may legitimately participate in subject-scoped semantic assignments.

Building, Product and Vehicle primary handles currently use `object`, avoiding accidental exposure as recipients for subject-specific Hair/Outfit/Pose/Expression behavior.

Each richer entity profile remains deliberately minimal:

```text
primary semantic entity
optional reusable name/label
optional auxiliary reference
```

Module-owned properties must remain in their owning modules.

---

# Content and utility recipes

Existing useful recipes remain available on the same Blueprint engine.

## Poster Content

Provides reusable handles such as brand name, headline, subheadline, product, price, discount, call-to-action and reusable colors.

## Business Card

Provides common identity/contact handles such as person name, role, company, phone, email, website, address, brand color and brand font.

## Garment Print

Provides the tested auxiliary-reference pattern:

```text
{printArtwork}   reference
{printPlacement} text
{printMethod}    text
{printScale}     text
```

## Custom Variable Set

Provides fully user-defined key/type/value rows for cases that no starter recipe predicts.

---

# Blueprint configuration behavior

Before creation, the user may configure Blueprint state:

- choose repeat count for profile groups,
- enable optional profile/static slots,
- edit generated keys,
- enter initial values,
- add/remove Custom Variable Set rows,
- edit the semantic type of Custom Variable Set rows.

Profile-owned slot types remain fixed by default because those types are part of the profile recipe's semantic contract. The custom set intentionally exposes type editing.

Creation remains collision-safe against:

- existing user variables,
- active system variables,
- active module variables,
- reserved structural namespaces,
- sibling variables being created in the same Blueprint operation.

Generated variables receive ordinary stable user-variable IDs when added to module state.

---

# Compiler strategy

No Blueprint compiler is introduced.

Variables continue to compile ordinary enabled user variables through the existing Variables pipeline.

Blueprint identity, category, labels, group counts and editor configuration metadata must not appear in prompt output.

---

# Natural strategy

Natural output must preserve the same user-variable prompt graph used by Modular output.

If a user variable is referenced elsewhere, its definition must remain available rather than being flattened into duplicated prose.

Blueprints have no Natural representation because they are editor recipes rather than prompt semantics.

---

# Target policy

Variable type does not automatically determine universal targetability.

Consumer modules retain their own recipient policy:

```text
Pose / Expression / Hair / Outfit → subject recipients
Color / Material                  → their own capability/target policy
```

Adding a variable type in the future must not automatically make it targetable.

A new type is justified only when it creates a real semantic contract difference such as distinct validation, picker behavior, consumer compatibility or serialization behavior.

---

# Validation evidence so far

## Poster Blueprint test

A real poster-generation prompt used Blueprint-generated handles for brand name, headline, subheadline, product, price, call-to-action and address. Those variables were consumed inside structured Typography groups bound to Layout regions.

The generated poster preserved the major requested text hierarchy and demonstrated that Blueprint-created text/object handles can participate naturally in structured Typography/Layout prompt graphs.

## Garment Print tests

Multiple image-to-image tests used:

```text
{printArtwork}
{printPlacement}
{printMethod}
```

alongside a referenced person, subject-scoped Pose/Expression, hierarchical Outfit items and item-level Color Palette targets.

The generated results successfully:

- replaced the referenced outfit,
- preserved recognizable subject identity,
- applied the supplied auxiliary artwork as a garment print,
- responded more precisely when the exact T-shirt entity token was targeted,
- combined the print operation with Pose, Expression, Background, Lighting, Camera and Effects without collapsing module ownership.

These tests validate the fundamental Blueprint/value-reference concept. They do **not** by themselves close the second-generation profile/custom-set editor implementation.

---

# Implementation checkpoint

Implemented on `refactor/prompt-semantics`:

- `app/modules/variables.blueprints.ts`
- `app/components/modules/variables/VariableBlueprintModal.vue`
- Blueprint integration in `app/components/modules/variables/VariablesField.vue`

Current editor architecture includes:

- categorized Blueprint discovery,
- static recipes,
- repeatable coherent profile groups,
- collision-aware group indexing,
- optional profile slots,
- dynamic Custom Variable Set rows,
- per-row type editing for custom sets,
- ordinary user-variable output with no persistent Blueprint coupling.

---

# Validation still required

Before Stage 15 can close:

1. Run a successful project build/generate check.
2. Test manual variable creation/editing for regressions.
3. Test each entity Profile Blueprint in the editor.
4. Verify profile counts create coherent group numbering.
5. Verify existing-key collisions skip/flag complete profile indices safely.
6. Verify optional profile slots and initial values.
7. Test Custom Variable Set add/remove behavior and per-row type switching.
8. Verify generated `subject` variables appear correctly in Pose/Expression/Hair/Outfit recipient pickers.
9. Verify generated `subject`/`object` variables remain compatible with Color/Material target policy.
10. Verify `reference` variables remain semantic inputs without incorrectly appearing as assignment recipients.
11. Verify Modular and Natural output preserve definitions and references.
12. Apply translation/localization coverage for the Blueprint UI.
13. Obtain user approval before marking Stage 15 semantically closed.

## Build note

A previous local build attempt from the assistant execution container could not start because that environment could not resolve `github.com` while cloning the repository. This is an environment/network limitation and is not build evidence. A real project build remains pending.
