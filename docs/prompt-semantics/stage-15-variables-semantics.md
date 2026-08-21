# Stage 15 — User Variables Semantics

## Status

**Implementation in progress.**

Semantic discovery is complete enough to begin implementation, but this stage is not closed yet. Build verification, editor testing, prompt-output validation and user approval are still required.

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

No type expansion is currently justified merely to support more presets/blueprints.

---

## Responsibility contract

Variables owns:

- user-created semantic handles,
- stable user-variable identity,
- human semantic keys/tokens,
- typed value contracts,
- enable/disable state,
- manual variable creation/editing,
- blueprint-driven bulk creation,
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

---

## Variable types are semantic contracts

Every variable is semantic, but not every variable type has the same relationship to other modules.

### Entity/recipient handles

`subject` and `object` may identify concrete semantic entities that selected modules can target directly.

Subject-scoped modules such as Pose, Expression, Hair and Outfit intentionally accept only subject recipients.

Color/Material use their own broader target policies and currently admit compatible user subject/object handles.

### Value/input handles

Types such as `text`, `color`, `font` and `reference` remain semantic even when they are not assignment recipients.

A semantic variable may therefore be useful as an input/reference without becoming a valid target.

The rule is:

> Semantic variable does not imply assignment target.

Target policy remains a consumer-module decision.

---

## Auxiliary-reference precedent

A user `reference` variable may represent an external semantic input distinct from the main Setup reference.

Canonical example:

```text
{printArtwork} = attached artwork reference image
```

An Outfit item can then describe a relationship such as applying `{printArtwork}` to a T-shirt as a realistic DTF garment print.

The T-shirt itself remains an Outfit item entity; a duplicate user `object` variable is not required merely to make the garment addressable.

Optional supporting handles may remain ordinary text variables:

```text
{printPlacement} = front of the garment
{printMethod} = natural DTF garment print
{printScale} = large chest print
```

This example demonstrates why a new `image`, `material`, or `print` variable type is not currently required.

---

# Variable Blueprints

## Core rule

A Variable Blueprint is an editor recipe for creating ordinary `PromptVariable[]` state.

It is **not** a new prompt-graph entity and must never compile into prompt output by itself.

After applying a blueprint, created variables become fully ordinary editable user variables. The user may rename, edit, duplicate, disable or delete them without preserving any hidden dependency on the source blueprint.

This follows the project-wide precedent:

> Recipes create editable state; recipes do not own that state afterward.

---

## Blueprint slot model

Blueprints may contain:

```text
static slots
optional slots
repeatable slots
```

Each slot resolves to the existing PromptVariable contract:

```text
key
value
description
type
enabled
```

Repeatable slots support a configurable count and a key pattern such as:

```text
subject{index}
```

A count of 3 produces:

```text
{subject1}
{subject2}
{subject3}
```

A count of 5 uses the same blueprint rather than requiring a separate preset.

---

## Initial implementation catalog

The initial implementation provides four starter blueprints:

### Multiple Subjects

Creates a configurable number of `subject` variables for independent subject-scoped targeting.

### Poster Content

Provides common reusable handles such as headline, subheadline, product, price, discount, call-to-action and reusable colors.

### Business Card

Provides common identity/contact handles such as person name, role, company, phone, email, website, address, brand color and brand font.

### Garment Print

Provides the auxiliary-reference pattern discovered during semantic discussion:

```text
{printArtwork}   reference
{printPlacement} text
{printMethod}    text
{printScale}     text
```

---

## Blueprint configuration behavior

Before creation, the user may configure blueprint state:

- choose repeat count where supported,
- enable optional slots,
- edit generated keys,
- enter initial values.

Creation must remain collision-safe against:

- existing user variables,
- active system variables,
- active module variables,
- reserved structural namespaces.

Generated variables receive ordinary stable user-variable IDs when added to module state.

---

# Compiler strategy

No new blueprint compiler is introduced.

Variables continue to compile ordinary enabled user variables through the existing Variables pipeline.

Blueprint identity, labels and configuration metadata must not appear in prompt output.

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

# Implementation checkpoint

Implemented on `refactor/prompt-semantics`:

- `app/modules/variables.blueprints.ts`
- `app/components/modules/variables/VariableBlueprintModal.vue`
- blueprint integration in `app/components/modules/variables/VariablesField.vue`

The implementation currently creates ordinary user variables and does not modify the existing prompt compiler or assignment target policies.

## Validation still required

Before Stage 15 can close:

1. Run a successful project build/generate check.
2. Test manual variable creation/editing for regressions.
3. Test each starter blueprint in the editor.
4. Verify configurable subject counts and key collision handling.
5. Verify optional-slot behavior and initial values.
6. Verify generated `subject` variables appear correctly in Pose/Expression/Hair/Outfit recipient pickers.
7. Verify generated `subject`/`object` variables remain compatible with Color/Material target policy.
8. Verify `reference` variables remain semantic inputs without incorrectly appearing as assignment recipients.
9. Verify Modular and Natural output preserve definitions and references.
10. Apply translation/localization coverage for the new Blueprint UI.
11. Obtain user approval before marking Stage 15 semantically closed.

## Build note

A local build attempt from the assistant execution container could not start because that environment could not resolve `github.com` while cloning the repository. This is an environment/network limitation and is not build evidence. A real project build remains pending.
