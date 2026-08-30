# Prompt Draft Wizard

Status: **Portrait Wizard active development; Subject Definition and per-subject Pose implemented, manual Pose validation next**

Working branch: `feature/wizard`

Actions contract: `prompt-draft.actions.v1`

This document is the **source of truth for Wizard architecture and accepted product/domain decisions**.

Related sources:

- Wizard UX and presentation: [`UI.md`](./UI.md)
- Prompt Template architecture: [`TEMPLATES.md`](./TEMPLATES.md)
- Latest implementation/testing checkpoint: [`STATUS.md`](./STATUS.md)
- Actions operational status: `docs/actions-api/STATUS.md`

When an older example conflicts with this file or the latest `STATUS.md`, the later accepted decision wins.

---

## 1. Purpose

The Wizard is a goal-oriented guided interface for producing a normal editable `PromptDraftState` without requiring the user to understand the full Expert UI.

The Wizard is not a second prompt system.

```text
User intent
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

Expert UI and Wizard are separate interaction layers over the same canonical domain.

```text
Expert UI ─────┐
               ├── Canonical domain / Actions ──> PromptDraftState
Wizard UI ─────┘
```

---

## 2. Core architectural rules

Every Wizard mutation must ultimately use existing canonical Actions/domain behavior.

The Wizard must not:

- directly mutate arbitrary `moduleValues` paths as its normal mapping strategy;
- recreate module semantics in Wizard-only code;
- invent a Wizard compiler or validator;
- depend on mutable labels as stable assignment identity;
- use the Create Active Draft as an implicit input;
- silently overwrite Create state;
- enable Preserve flags implicitly;
- add speculative per-subject controls without a real use case.

The preferred development loop is:

```text
real use case
  ↓
small implementation
  ↓
automated regression
  ↓
real generation test
  ↓
fix only proven gaps
```

---

## 3. Independent Wizard lifecycle

A standard Wizard session is independent from Create.

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

Abandoning, exiting, refreshing, restarting, or merely completing the Wizard must not mutate Create.

Only the explicit action:

```text
Continue editing in Create
```

creates a **new** Create Draft from `finalDraft`.

Existing Create Drafts remain untouched.

---

## 4. Session and flow model

Wizard session persistence is local-first.

Storage key:

```text
prompt-draft:wizard:sessions:v1
```

Persisted execution is based on a flat ordered Step sequence.

```text
Stage
  ↓
Step
  ↓
Question
```

Stages are presentation/grouping metadata. `currentStepId` is persisted; current Stage is derived from the Step.

Do not introduce a universal workflow DSL, arbitrary graph, nested execution tree, or rule scripting language unless a future concrete Wizard proves it necessary.

Current reusable Question capabilities include:

- `singleChoice`;
- `text`;
- `entityCollection`;
- `modalOptions`;
- `subjectOverrides`;
- legacy-compatible `variablePicker` where genuinely needed.

---

## 5. Answers, defaults, and generated values

Explicit user values and system defaults are different states.

A default may be recomputed when upstream context changes. A user-edited value must not be silently overwritten.

This is especially important for generated Idea.

Conceptually:

```text
answer = value + source(default | user)
```

---

## 6. Subject model — accepted foundation

Subjects are constructed inside the Wizard and later mapped to canonical Prompt Variables.

A Subject has separate concerns:

```text
entity ID        stable Wizard identity
label            optional user-facing name
canonical key    Prompt Variable key
variable ID      canonical Draft identity
definition       what/who this Subject actually means
```

Stable assignment targeting follows identity, not display label or variable key text alone.

### 6.1 Optional names

Names are optional and are primarily for UI readability and variable naming.

For multiple unnamed people, display labels are indexed:

```text
Person 1
Person 2
Person 3
```

Canonical keys remain unique independently, for example:

```text
{person}
{person_2}
{person_3}
```

### 6.2 Subject Definition is separate from the name

The optional Subject name does **not** define age, gender, appearance, or identity semantics.

Each Subject has a semantic definition strategy used to produce the Prompt Variable value.

For **image-to-image**, current Portrait options are:

```text
By position in reference
Male person in reference
Female person in reference
Custom reference description
```

Examples:

```text
{person} = first person in {reference}
{met} = male person in {reference}
{zahra} = female person in {reference}
{subject} = woman with a short black bob and pearl choker in {reference}
```

Position remains available as a fallback, but semantic definitions are preferred when reference order is fragile or ambiguous.

For **text-to-image**, current options are:

```text
Person
Man
Woman
Boy
Girl
Custom subject
```

Examples:

```text
{met} = an adult man
{zahra} = an adult woman
{subject} = a black Persian cat with green eyes
```

Custom definitions are required when `Custom` is selected.

The definition is independent from the optional variable/display name.

### 6.3 Why this exists

The previous multi-reference strategy relied heavily on:

```text
first person in {reference}
second person in {reference}
```

That is unsafe as a universal identity strategy because upload/display order can be unstable and multiple similar Subjects can remain ambiguous.

The accepted fix is semantic Subject Definition, not hidden reliance on attachment sequence.

A future asset-level binding system may provide even stronger identity such as one explicit reference asset per Subject, but that is not part of the current Prompt Draft reference model.

---

## 7. Multi-subject shared/per-subject pattern

The user-facing pattern is:

```text
Shared choice by default
  ↓
optional Customize per subject
  ↓
only selected Subjects receive overrides
```

With one Subject, extra per-subject UI is hidden.

With multiple Subjects, overridden Subjects are removed from the shared target set and receive their own canonical assignment/configuration.

Per-subject overrides inherit shared values for fields that were not explicitly overridden.

Current Portrait support:

- Expression — shared + per-subject;
- Hair — shared + per-subject;
- Outfit — shared + per-subject;
- Pose — shared + per-subject.

Current shared-only domains:

- Framing;
- Background;
- Lighting.

Lighting is intentionally scene-level; per-subject Lighting is not an accepted product concept for the current Portrait Wizard.

Do not automatically expand every domain to per-subject behavior.

---

## 8. Portrait Wizard current flow

Current Stages:

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

### Start

Ask only:

- Start from an image;
- Start from a description.

Internal mapping:

```text
from_image       → image_to_image
from_description → text_to_image
```

Idea is no longer asked here.

### Subjects

Create one to four Person entities with:

- optional names;
- stable identity;
- Subject Definition appropriate to creation mode.

### Portrait

Quick intent:

- Professional;
- Cinematic;
- Fashion;
- Fantasy.

### Appearance / Look

Quick choices + optional depth for:

- Expression;
- Hair;
- Outfit.

Expression More Options:

- intensity;
- eyes;
- brows;
- mouth.

Hair More Options:

- length;
- curl pattern;
- volume;
- parting.

Outfit More Options:

- fit;
- accessories;
- additional details.

Expression/Hair/Outfit all support per-subject overrides.

### Composition

Framing options:

- Headshot;
- Head & shoulders;
- Half body;
- Full body.

Pose quick intents:

- Natural;
- Formal;
- Dynamic.

Pose is now **shared by default with optional per-subject override** for multi-subject Portraits.

Pose per-subject mapping uses canonical `PoseAssignment` targeting and canonical Pose presets. Headshot still suppresses Pose controls.

### Scene

Environment direction + optional detail, Background More Options, and Lighting.

Background More Options currently exposes a curated canonical subset:

- setting;
- spatial structure;
- visible material;
- detail density;
- one key background element.

Current Background depth is considered sufficient until a real test shows otherwise.

### Lighting

Lighting remains shared for the scene.

Current quick choices:

- Soft;
- Dramatic;
- Moody;
- Clean.

A real Outdoor + Moody test exposed a semantic mismatch because the generic `moody_side` preset described a `studio` light source. The preset was made environment-neutral by using a focused spotlight source while preserving side / hard / low-ambient / high-contrast behavior.

Do not couple Lighting to Environment with a large matrix unless future tests require it.

### Final

Contains:

- system-generated editable Idea;
- Aspect Ratio;
- reference usage for image-to-image;
- transformation strength for image-to-image.

### Review / completion

Review is grouped by Stage.

Finish maps through canonical Actions, validates, compiles, and produces `finalDraft`.

---

## 9. Idea semantics

Idea is generated near the end after enough semantic context is known.

Examples:

```text
A fashion portrait of {person} with the following settings
A cinematic portrait of {met} and {zahra} together, with the following settings
```

For multi-subject Portraits, explicit `together` wording is important for co-presence.

Before user editing, generated Idea may update with upstream changes. After user editing, it becomes user-owned and must not be silently replaced.

Idea is descriptive, not a hidden rule engine.

---

## 10. Preserve policy

All Wizard Preserve flags remain false unless a future explicit requirement changes the policy.

```text
preserveMainSubject
preserveIdentity
preservePose
preserveOutfit
preserveComposition
preserveColors
preserveMaterials
preserveLighting
```

Hair/Outfit `Keep reference` behavior must be expressed through those domains, not by silently toggling Setup Preserve flags.

---

## 11. Prompt Templates relationship

Prompt Templates are reusable structured starting points extracted from proven use cases.

Invariant:

```text
Template = versioned PromptDraftState snapshot
Template ≠ compiled prompt string
```

Accepted integration:

- Start from Template in Create;
- built-in registry;
- local user Templates;
- Save as Template from Create;
- Save as Template from Wizard success;
- first built-in: LinkedIn Profile Portrait.

Starting from a Template always creates a **new Draft**. There is no Apply Template to Current Draft flow.

Template infrastructure is accepted and feature expansion is frozen unless a concrete bug or proven reusable Wizard use case justifies more work.

See [`TEMPLATES.md`](./TEMPLATES.md).

---

## 12. Accepted real-world validation

Real generation tests have demonstrated:

- multi-person co-presence using explicit `together` Idea semantics;
- independent Expression/Hair/Outfit semantics across multiple Subjects;
- much stronger identity reliability after semantic Subject Definition (`male person`, `female person`, custom descriptions) replaced fragile sequence-only assumptions;
- useful shared Pose behavior in multi-person portraits;
- a concrete product reason for per-subject Pose, now implemented for testing;
- strong Look transformation from More Options;
- controlled Background depth;
- Outdoor + Moody Lighting after removing the studio-specific source mismatch;
- useful LinkedIn/profile outputs that became the first built-in Template.

A real model may still under-follow detailed Hair/Expression instructions. If the compiled prompt is semantically correct, do not treat every generation miss as a Wizard architecture failure.

---

## 13. Runtime / dependency discipline

The project must not rely on undeclared transitive dependencies.

`useScreen.ts` directly imports `@vueuse/core`, therefore `@vueuse/core` is now an explicit root dependency and `package.json` / `pnpm-lock.yaml` must stay synchronized.

Local dev also unregisters stale Prompt Draft Service Workers/caches to avoid old offline state interfering with Nuxt development.

Do not paper over lockfile drift with `--no-frozen-lockfile` in accepted checkpoints; the branch should pass frozen install.

---

## 14. Current immediate continuation

The next product validation is **manual per-subject Pose testing**.

Recommended first case:

```text
2 Subjects
Framing: Half body or Full body
Shared Pose: Natural
Subject A: Shared
Subject B: Customize → Dynamic
```

Validate both:

1. Expert UI Pose assignments/targets are independent and correct;
2. compiled prompt gives each Subject the intended Pose;
3. real generation visibly benefits from the separate Pose semantics.

Only after this test should the next capability be chosen.

---

## 15. Deferred architecture

Do not implement without a concrete requirement:

- universal Wizard DSL;
- arbitrary scripting/expression language;
- nested/repeatable workflow engine;
- Wizard-owned compiler/validator;
- direct arbitrary Draft/path mutation;
- AI-generated Wizard definitions;
- broad Expert UI rewrite;
- per-subject Lighting;
- automatic per-subject targeting for every module;
- Template merge/apply-to-current semantics;
- Template marketplace/cloud infrastructure;
- broad asset-binding system before a concrete reference-management design exists.

---

## 16. Documentation discipline

- `README.md` — architectural source of truth;
- `UI.md` — presentation/UX source;
- `TEMPLATES.md` — Template architecture/status;
- `STATUS.md` — exact operational checkpoint and next action;
- `docs/actions-api/STATUS.md` — accepted Actions surface/status.

Update `STATUS.md` after every meaningful validated checkpoint. Change architecture docs when accepted product/domain decisions change.
