# Prompt Draft Wizard

Status: **Portrait Wizard active development; architecture baseline implemented and being validated**

Working branch: `feature/wizard`

Actions contract: `prompt-draft.actions.v1`

This document is the **source of truth for Wizard architecture and development decisions**.

Related sources:

- Wizard UX and presentation: [`UI.md`](./UI.md)
- Prompt Template architecture: [`TEMPLATES.md`](./TEMPLATES.md)
- Latest implementation/testing checkpoint: [`STATUS.md`](./STATUS.md)
- Actions operational status: `docs/actions-api/STATUS.md`

When an older example in a supporting document conflicts with a later accepted invariant recorded here or in `STATUS.md`, the later accepted decision wins.

---

## 1. Purpose

The Wizard is a goal-oriented guided interface for creating a real Prompt Draft without requiring the user to understand the full Expert UI, module structure, Variables, named configurations, assignments, or canonical Action vocabulary.

The Wizard does **not** replace Prompt Draft's domain model and does **not** introduce a second prompt-building system.

```text
User goal
  ↓
Wizard questions / choices
  ↓
Answers + deterministic interpretation
  ↓
Canonical Actions
  ↓
PromptDraftState
  ↓
prompt.validate
  ↓
prompt.compile
```

The final result is a normal editable `PromptDraftState`, not only a compiled prompt string.

---

## 2. Wizard and Expert UI

Wizard and Expert UI are two interaction layers over the same canonical domain:

```text
Expert UI ─────┐
               ├── Canonical domain / Actions ──> PromptDraftState
Wizard UI ─────┘
```

Product roles:

```text
Expert UI = power, detail, direct control
Wizard UI = guidance, clarity, intent-driven decisions
```

The Wizard should reuse design-system primitives and canonical domain behavior, but it should **not** embed full Expert domain panels simply to expose every field.

The user should not need to know terms such as:

- module key;
- Action ID;
- Variable ID;
- Named Configuration;
- assignment record;
- schema field ID.

Those concepts may be used internally when mapping the user's intent.

---

## 3. Core architectural rule

Every Wizard mutation must ultimately use existing canonical Actions/domain behavior.

The Wizard must not:

- directly mutate arbitrary `moduleValues` paths as its normal mapping strategy;
- recreate Hair/Outfit/Pose/etc. domain semantics;
- invent Wizard-only validation/compiler behavior;
- depend on mutable display labels as stable assignment identity;
- make the Create Active Draft an implicit input;
- silently overwrite Create state.

The Wizard is an orchestration consumer of the existing domain.

---

## 4. Independent Wizard lifecycle

A standard Wizard session is independent from Create.

It must **not** clone, read, or depend on the Create Active Draft.

```text
Open Wizard
  ↓
Create or restore Wizard Session
  ↓
Fresh isolated Working Draft
  ↓
Wizard answers + canonical mapping
  ↓
validate / compile
  ↓
finalDraft
```

This means the Wizard works even when Create has no useful Draft or has unrelated work open.

Abandoning, exiting, refreshing, or restarting the Wizard must not mutate Create.

---

## 5. Wizard Session and persistence

The Wizard owns a separate resumable Session.

Current persistence is local-first and stores one active resumable session per Wizard ID.

Storage key:

```text
prompt-draft:wizard:sessions:v1
```

The Session carries the execution state required to resume, including:

- Wizard ID/version;
- current Step ID;
- answers and provenance;
- derived/default state;
- isolated Working Draft;
- timestamps/persistence metadata.

Opening a compatible in-progress Wizard offers:

```text
Continue
Start over
```

Persist `currentStepId`; current Stage is derived from the Step definition.

---

## 6. Flow model: Stage → Step → Question

The accepted execution model is intentionally lightweight:

```text
Stage
  ↓
Step
  ↓
Question
```

### Stage

High-level user-facing chapter used for orientation, progress, and Review grouping.

### Step

Flat executable/navigation unit. Session persistence tracks the current Step.

### Question

Answer-producing unit inside a Step.

Invariant:

> **Stages group Steps; executable Steps remain a flat ordered sequence.**

Do not introduce a nested workflow tree, arbitrary graph, or universal DSL unless a concrete future Wizard requires it.

---

## 7. Definitions and rendering

Wizard definitions are data-driven where that remains useful, while domain-specific semantic mapping stays in the Wizard domain implementation.

Current question capabilities include:

- `singleChoice`;
- `text`;
- `entityCollection`;
- `modalOptions`;
- `subjectOverrides`;
- legacy-compatible `variablePicker` where genuinely needed.

Do not force every new UX into a universal question engine. Add the smallest reusable primitive justified by a real Wizard requirement.

Conditions should also remain small and deterministic rather than becoming a general expression language.

---

## 8. Answers, defaults, and user overrides

Explicit user choices and system defaults are different states.

A system-generated/default value may be recalculated when upstream context changes. A user-edited value must not be silently overwritten.

This is especially important for generated Idea and other derived Wizard answers.

Conceptually:

```text
value + source(default | user)
```

The implementation may use the real Session answer shape, but the invariant is fixed.

---

## 9. Subjects and stable identity

The Wizard constructs its own Subjects. The standard Portrait flow does not ask the user to manage Variables.

Current semantic entity foundation separates:

```text
entity ID       stable Wizard identity
label           user-facing editable name
canonical key   Variable key used in prompt semantics
variable ID     canonical Prompt Draft identity
```

Portrait currently supports one to four Person entities.

Names are optional. A blank name uses the semantic fallback `Person`.

For image-to-image Portraits, Subject variable values identify people in the attached reference by position when required:

```text
one person:
{person} = person in {reference}

multiple people:
{met} = first person in {reference}
{zahra} = second person in {reference}
```

For description-based generation, the values remain natural text descriptions rather than reference positions.

Stable assignments must follow identity, not mutable labels alone.

---

## 10. Multi-subject shared/per-subject behavior

The user should not see internal concepts such as Named Configurations.

The accepted UX is:

```text
Shared choice by default
  ↓
optional Customize per subject
  ↓
only selected people receive overrides
```

Current Portrait implementation supports this for:

- Expression;
- Hair;
- Outfit.

With one Subject, the extra per-subject UI is hidden.

With multiple Subjects, a Subject may inherit the shared settings or receive its own override.

Behind the scenes, canonical assignments/styles/sets are targeted so overridden Subjects are removed from the shared target set and receive their own configuration.

Per-subject overrides inherit shared values for fields that the user did not override.

Current scope intentionally does **not** imply that every domain must immediately support per-subject controls. Pose/Framing/Background/Lighting remain shared until real use cases justify additional targeting UX.

---

## 11. Portrait Wizard current product flow

Portrait is the first real Wizard used to evolve the architecture.

Current high-level Stages:

```text
Start
Subjects
Portrait
Appearance / Look
Composition
Scene
Final
Review
```

Current behavior:

### Start

Ask only how creation begins:

- Start from an image;
- Start from a description.

Internal mapping:

```text
from_image       → image_to_image
from_description → text_to_image
```

### Subjects

Create one to four Person entities with optional names.

### Portrait

Choose high-level intent such as:

- Professional;
- Cinematic;
- Fashion;
- Fantasy.

### Appearance / Look

Quick choices plus optional depth for:

- Expression;
- Hair;
- Outfit.

Each domain also supports shared/per-subject customization when multiple people exist.

### Composition

Current simplified controls cover Framing and Pose.

Framing includes Headshot / Head & shoulders / Half body / Full body semantics.

Pose remains shared in the current checkpoint.

### Scene

Environment direction + detail, Background More Options, and Lighting direction.

Background More Options currently exposes a curated subset of canonical Background semantics such as setting, spatial structure, material, detail density, and one key background element.

### Final

Technical output settings are kept late in the flow:

- generated/editable Idea;
- Aspect Ratio;
- image-reference usage when relevant;
- transformation strength when relevant.

### Review

Review is grouped by Stage and lets the user return to the relevant Step.

### Finish

Completion builds the canonical Draft, validates it, compiles it, and shows the Wizard result state.

---

## 12. Idea semantics

Idea is not a decision engine and is no longer asked at the beginning of Portrait.

The Wizard generates a structurally safe Idea near the end, after it knows enough semantic context.

Examples:

```text
A fashion portrait of {person} with the following settings
A fashion portrait of {met} and {zahra} together, with the following settings
```

The multi-subject wording must explicitly preserve co-presence (`together`) so a vague user Idea does not accidentally encourage separate images.

The generated Idea remains editable.

Before user editing, it may regenerate when relevant upstream answers change.

After the user edits it, the answer becomes user-owned and rules must not overwrite it.

---

## 13. Optional depth pattern

The Wizard should offer useful detail without becoming the Expert UI.

Accepted pattern:

```text
Quick intent choice
  +
More Options modal
```

Current examples:

### Expression More Options

- intensity;
- eyes;
- brows;
- mouth.

### Hair More Options

- length;
- curl pattern;
- volume;
- parting.

### Outfit More Options

- fit;
- accessories;
- additional details.

### Background More Options

- setting;
- spatial structure;
- visible background material;
- detail density;
- one key background element.

These fields use canonical-safe vocabulary/subsets rather than embedding the Expert panel.

---

## 14. Preserve policy

Image-to-image Preserve controls are an Expert feature and should not be implicitly enabled by the Wizard.

Canonical Wizard rule:

> **All Preserve flags remain false unless a future explicit Wizard requirement deliberately changes this policy.**

This includes:

- preserveMainSubject;
- preserveIdentity;
- preservePose;
- preserveOutfit;
- preserveComposition;
- preserveColors;
- preserveMaterials;
- preserveLighting.

Hair/Outfit choices such as `Keep reference` must not secretly turn Setup Preserve flags on. They should be represented through their own domain semantics only.

---

## 15. Canonical mapping and completion

The standard completion pipeline is:

```text
answers
  ↓
Wizard rules / derived intent
  ↓
canonical Actions on isolated Working Draft
  ↓
prompt.validate
  ↓
prompt.compile
  ↓
finalDraft
```

If mapping fails, completion stops and the caller/Create state remains unchanged.

Do not add a Wizard-specific compiler, validator, or arbitrary mutation escape hatch.

---

## 16. Create handoff

Successful Wizard completion does **not** mutate Create automatically.

Only the explicit action:

```text
Continue editing in Create
```

creates a **new** Create Draft from `finalDraft` and makes that new record active.

Existing Create Drafts remain untouched.

---

## 17. Prompt Templates relationship

Prompt Templates were introduced as a direct extension of real Wizard validation.

A successful reusable Wizard recipe may be promoted into a curated Template after testing.

Template invariant:

```text
Template = versioned PromptDraftState snapshot
Template ≠ compiled prompt string
```

Current integration includes:

- `Start from a template` in Create;
- built-in Template registry;
- local user Templates;
- `Save as template` from Create;
- `Save as template` from Wizard success;
- first curated built-in: `LinkedIn Profile Portrait`.

Starting from a Template always creates a **new Draft**. There is no `Apply Template to Current Draft` flow.

See [`TEMPLATES.md`](./TEMPLATES.md) for the complete Template architecture and acceptance plan.

---

## 18. Development strategy: real use cases first

Do not attempt to perfect every possible Wizard/domain combination up front.

Preferred loop:

```text
implement one useful slice
  ↓
run automated tests
  ↓
test a real image-generation use case
  ↓
inspect prompt + visual result
  ↓
fix semantics / UX gaps
  ↓
extract only proven reusable behavior
```

This process produced the current multi-subject semantics, optional Look/Background depth, and Prompt Template concept.

Examples that work well may become built-in Templates, but Template catalog growth must remain subordinate to Wizard validation.

---

## 19. Current accepted real-world validation

Useful manual tests already demonstrated:

- multi-person image-to-image Portrait with explicit co-presence;
- independent Expression/Hair/Outfit semantics for multiple Subjects;
- strong Look transformation from More Options;
- controlled Background detail through the curated Background subset;
- professional LinkedIn-style profile portraits using the current module recipe.

The LinkedIn recipe became the first curated Prompt Template because it produced consistently useful professional/profile outputs while remaining editable in Expert UI.

---

## 20. Deferred architecture

Do not implement without a concrete requirement:

- universal Wizard DSL;
- arbitrary rule scripting language;
- generalized nested/repeatable workflow tree;
- Wizard-owned duplicate compiler/validator;
- direct arbitrary Draft/path mutation;
- AI-generated Wizard definitions;
- broad Expert UI rewrite;
- automatic per-subject controls for every domain;
- Template merge/apply-to-current-Draft semantics;
- Template marketplace/cloud system.

---

## 21. Documentation discipline

Use the docs as follows:

- `README.md` — architectural source of truth;
- `UI.md` — detailed Wizard presentation/UX baseline;
- `TEMPLATES.md` — Prompt Template architecture and tests;
- `STATUS.md` — exact operational checkpoint and next steps;
- `docs/actions-api/STATUS.md` — accepted Actions surface/status.

Update `STATUS.md` after meaningful implementation or validation checkpoints. Change architectural documents only when product/architecture decisions actually change.
