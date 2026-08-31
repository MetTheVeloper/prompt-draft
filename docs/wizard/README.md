# Prompt Draft Wizard

Status: **Portrait domain foundation accepted; Living Sentence redesign is the accepted future Wizard UX direction**

Working branch: `feature/wizard`

Actions contract: `prompt-draft.actions.v1`

This document is the **source of truth for Wizard architecture and accepted product/domain decisions**.

Related sources:

- Wizard UX and Living Sentence presentation: [`UI.md`](./UI.md)
- Prompt Template architecture: [`TEMPLATES.md`](./TEMPLATES.md)
- Latest implementation/testing checkpoint and next-chat plan: [`STATUS.md`](./STATUS.md)
- Actions operational status: `docs/actions-api/STATUS.md`

When an older example conflicts with this file, `UI.md`, or the latest `STATUS.md`, the later accepted decision wins.

---

## 1. Purpose

The Wizard is a goal-oriented guided interface for producing a normal editable `PromptDraftState` without requiring the user to understand the full Expert UI.

The Wizard is not a second prompt system.

```text
User intent
  ↓
Wizard experience
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
- add speculative per-subject controls without a real use case;
- hard-code generic Wizard infrastructure to Portrait-specific wording or step names.

The preferred development loop remains:

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

## 3. Reusable Wizard Experience architecture

Portrait is the first Wizard use case and the proving ground, not the permanent shape of every Wizard.

The reusable layer should provide concepts such as:

- session lifecycle and persistence;
- navigation/history;
- deterministic branching;
- answer/default ownership;
- shared + per-subject override mechanics;
- progressive disclosure;
- review/edit navigation;
- canonical Action mapping;
- Living Sentence presentation/composition primitives.

Each use case provides its own semantic definition:

- questions/intents;
- available choices;
- branch rules;
- grammar/sentence composition;
- canonical mappings;
- technical metadata relevant to that use case.

Conceptually:

```text
Wizard Experience Engine
  ├── common lifecycle / navigation / interaction primitives
  ├── Living Sentence primitives
  └── use-case definition
        ├── Portrait
        ├── future Product Photography
        ├── future Architecture
        └── future use cases
```

Do not build a universal scripting DSL in anticipation of future use cases. Generalize only the behavior that is proven reusable.

---

## 4. Living Sentence — accepted experience model

The accepted future Wizard UX is centered on **Living Sentence**.

The user should feel that they are gradually shaping a natural-language creative intention rather than filling out a form.

Important choices become editable semantic tokens in an evolving sentence. The sentence may **recompose** itself when necessary so that it remains concise and natural English; answers are not mechanically appended in chronological order.

Living Sentence is a **presentation/interaction layer**, not a replacement for canonical domain state.

```text
Wizard semantic state
  ├──> Living Sentence composer → user-facing creative sentence
  └──> canonical mapping         → PromptDraftState
```

Technical metadata such as Aspect Ratio, Reference Fidelity, and Transformation Strength remains conceptually separate from the creative sentence.

A possible future direction is to seed/generated Idea from the Living Sentence, but this is **not yet an accepted mapping change**. Do not couple Idea generation to Living Sentence until it is explicitly validated.

See [`UI.md`](./UI.md) for the interaction and visual rules.

---

## 5. Independent Wizard lifecycle

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

Only the explicit handoff to Create creates a **new** Create Draft from `finalDraft`.

Existing Create Drafts remain untouched.

---

## 6. Session and flow model

Wizard session persistence is local-first.

Storage key:

```text
prompt-draft:wizard:sessions:v1
```

The current runtime uses a flat ordered Step sequence grouped by Stage metadata.

```text
Stage
  ↓
Step
  ↓
Question / micro-state
```

`currentStepId` is persisted; current Stage is derived from the Step.

The Living Sentence redesign may present several Steps as a continuous sequence of scenes/micro-states. The **number of screens is not a product invariant**.

Do not introduce a universal workflow DSL, arbitrary graph, nested execution tree, or rule scripting language unless a future concrete Wizard proves it necessary.

---

## 7. Answers, defaults, and generated values

Explicit user values and system defaults are different states.

A default may be recomputed when upstream context changes. A user-edited value must not be silently overwritten.

Conceptually:

```text
answer = value + source(default | user)
```

This remains especially important for generated Idea and any future Living Sentence-derived defaults.

---

## 8. Subject model — accepted foundation

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

### 8.1 Optional names

Names are optional and are primarily for UI readability and variable naming.

For multiple unnamed people, indexed labels may be used while canonical keys remain independently unique.

### 8.2 Subject Definition is separate from the name

The optional Subject name does **not** define age, gender, appearance, or identity semantics.

For **image-to-image**, accepted Portrait semantic options are:

```text
By position in reference
Male person in reference
Female person in reference
Custom reference description
```

For **text-to-image**, accepted options are:

```text
Person
Man
Woman
Boy
Girl
Custom subject
```

Custom definitions are required when `Custom` is selected.

Sequence remains available as a fallback, but semantic definitions are preferred when reference order is fragile or ambiguous.

---

## 9. Multi-subject shared/per-subject pattern

The accepted semantic pattern is:

```text
Shared choice by default
  ↓
optional change for one or more Subjects
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

Lighting is intentionally scene-level. Do not automatically expand every domain to per-subject behavior.

The Living Sentence UI should express this as natural intent first (for example, “everyone”) and reveal individual override controls only when requested.

---

## 10. Portrait Wizard semantic flow

The accepted semantic chapters remain roughly:

```text
Start
People / Subjects
Portrait
Look
Composition
Scene
Final
Review
```

Presentation may split or merge these into micro-states without changing the canonical domain.

### Start

- Transform own image(s) → `image_to_image`;
- Create a photo → `text_to_image`.

### People / Subjects

- one to four people;
- optional names;
- stable identity;
- Subject Definition appropriate to creation mode.

### Portrait

Quick intent:

- Professional;
- Cinematic;
- Fashion;
- Fantasy.

### Look

Quick choices + optional refinement for:

- Expression;
- Hair;
- Outfit.

All three support shared + per-subject overrides.

### Composition

Framing:

- Headshot;
- Head & shoulders;
- Half body;
- Full body.

Pose:

- Natural;
- Formal;
- Dynamic.

Headshot suppresses Pose. Pose supports shared + per-subject overrides when relevant.

### Scene

Environment:

- Studio;
- Outdoor;
- Abstract.

Optional scene detail and advanced Background refinement may expose a curated canonical subset:

- setting;
- spatial structure;
- visible material;
- detail density;
- key element.

Lighting remains scene-level:

- Soft;
- Dramatic;
- Moody;
- Clean.

### Final

Technical settings:

- Aspect Ratio;
- Reference Fidelity/Usage for image-to-image;
- Transformation Strength for image-to-image.

Generated Idea remains part of the current domain implementation, but the redesigned presentation intentionally does not make a large Idea textarea part of the main creative flow. Any future Living Sentence → Idea mapping requires a separate accepted decision.

### Review / completion

Review presents a polished Living Sentence as the main payoff, with compact creative and technical recap. Important sentence tokens should navigate back to the relevant semantic state.

Finish still maps through canonical Actions, validates, compiles, and produces `finalDraft`.

---

## 11. Preserve policy

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

## 12. Prompt Templates relationship

Prompt Templates are reusable structured starting points extracted from proven use cases.

Invariant:

```text
Template = versioned PromptDraftState snapshot
Template ≠ compiled prompt string
```

Accepted integration includes Start from Template, built-in/local Templates, Save as Template, and the LinkedIn Profile Portrait built-in.

Starting from a Template always creates a **new Draft**.

Template infrastructure is accepted and feature expansion is frozen unless a concrete bug or proven reusable use case justifies more work.

See [`TEMPLATES.md`](./TEMPLATES.md).

---

## 13. Design-system boundary

Do not discard the existing Prompt Draft component/design system, and do not force the experimental Wizard UX into generic components that cannot express it.

Accepted implementation strategy:

```text
Existing design system
  ├── tokens / spacing / typography foundations
  ├── accessibility / focus / input primitives
  └── global infrastructure

Wizard-specific interaction layer
  ├── LivingSentence
  ├── typographic gateways / choices
  ├── cinematic scene shell
  ├── ambient visual feedback
  ├── sentence-token editing
  └── Wizard-specific motion/layout primitives
```

If a Wizard-specific primitive later proves broadly reusable, promote/extend it into the shared component system deliberately.

Do not rewrite the whole design system merely to imitate the Figma prototype.

---

## 14. Figma Make role

The current Living Sentence prototype was generated in Figma Make as a functional **React + Vite + Tailwind** prototype.

It is a design/interaction reference, not production source code.

Production remains the existing Nuxt/Vue Prompt Draft application. Do not copy the React implementation wholesale or create a parallel runtime.

The migration target is:

```text
Figma Make behavior / visual intent
            +
existing Nuxt/Vue canonical Wizard/domain logic
            ↓
production Living Sentence Wizard
```

---

## 15. Accepted real-world validation

Existing tests and generation checks have demonstrated:

- multi-person co-presence using explicit `together` semantics;
- independent Expression/Hair/Outfit semantics across multiple Subjects;
- stronger identity reliability with semantic Subject Definition;
- useful shared Pose behavior and implemented per-subject Pose support;
- strong Look transformation from More Options;
- controlled Background depth;
- Outdoor + Moody Lighting after removing studio-specific source wording;
- useful LinkedIn/profile outputs that became the first built-in Template.

A model may still under-follow detailed Hair/Expression instructions. If the compiled prompt is semantically correct, do not treat every generation miss as a Wizard architecture failure.

---

## 16. Current development sequencing

Until the Figma/Living Sentence direction is fully reviewed and locked:

Safe work includes:

- domain/state model;
- branching and validation;
- use-case architecture;
- Living Sentence composition semantics;
- canonical mapping;
- shared/per-subject behavior;
- automated tests.

Avoid spending significant time polishing the current Wizard presentation layer because it is scheduled to be replaced/refactored against the accepted Figma direction.

See [`STATUS.md`](./STATUS.md) for the exact branch/merge plan.

---

## 17. Deferred architecture

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

## 18. Documentation discipline

- `README.md` — architectural/domain source of truth;
- `UI.md` — Living Sentence presentation/UX source of truth;
- `TEMPLATES.md` — Template architecture/status;
- `STATUS.md` — exact operational checkpoint, Figma state, branch plan, and next action;
- `docs/actions-api/STATUS.md` — accepted Actions surface/status.

Update `STATUS.md` after every meaningful validated checkpoint. Change architecture docs when accepted product/domain decisions change.
