# Prompt Draft Wizard

Status: **Architecture baseline accepted — implementation not started**

Working branch: `feature/wizard`

Branch baseline: `main@c60490681feb145d90749b1415337850f7c9c88c`

Actions contract: `prompt-draft.actions.v1`

This document is the **source of truth for Wizard architecture and development decisions**. Update it deliberately when an implemented Wizard exposes a real requirement that changes or extends the architecture.

For the latest implementation checkpoint, see [`STATUS.md`](./STATUS.md).

---

## 1. Purpose

The Wizard is a goal-oriented guided interface for building a real Prompt Draft without requiring the user to understand the full Expert UI, module structure, entity model, assignment semantics, or canonical Action vocabulary.

The Wizard does **not** replace Prompt Draft's domain model and does **not** introduce a second prompt-building system.

Its job is to translate user intent into the existing canonical application model:

```text
User Goal
   ↓
Wizard Questions / Choices
   ↓
Wizard Answers
   ↓
Rules / Derived Intent
   ↓
Action Plan
   ↓
Actions API
   ↓
PromptDraftState
   ↓
prompt.validate / prompt.compile
```

The final Wizard result is therefore not only a compiled prompt string. It is a normal editable `PromptDraftState` that can be opened and refined in the Expert UI.

---

## 2. Existing foundation

The Wizard starts after completion of the Actions API refactor. The required domain foundation already exists and should be reused rather than recreated.

Available canonical capabilities include:

- `PromptDraftState` as the serializable application-state boundary;
- the public `prompt-draft.actions.v1` contract;
- 99 stable public Actions;
- Variables, including multiple user-defined Subject variables;
- generic Modules, presets, fields and Custom Mode;
- generic named Module Entities;
- Scene and Scene-component composition;
- Layout and Region/Scene assignment;
- Typography groups and texts;
- Color Palette and Material/Texture semantic assignments;
- Pose and Expression subject assignments;
- Lighting and Effects;
- Hair styles/components and subject targeting;
- Outfit sets/items/relations and subject targeting;
- stable-reference semantics across specialized domains;
- atomic single-Action execution;
- headless `prompt.validate`;
- headless `prompt.compile`.

The Wizard must treat these capabilities as canonical. It must not implement parallel mutation rules for domains that already have Actions.

---

## 3. Expert UI relationship

The **Expert UI** is the current full-detail editing interface where users directly control modules, fields, entities, Scenes, Layout, assignments, Typography and other advanced settings.

The Wizard and Expert UI are two different interaction layers over the same Draft/domain system:

```text
Expert UI ─────┐
               ├── Canonical domain / Actions layer ──> PromptDraftState
Wizard UI ─────┘
```

The Wizard is **not required to render the full Expert UI panels or reuse their complete panel components**.

Reusable UI primitives and truly reusable pickers/components may be shared where appropriate, but Wizard presentation should be optimized for guided intent rather than exposing domain complexity.

For example, the user may choose `Dramatic lighting` in a Wizard instead of editing every Lighting field manually. The Wizard translates that intent into canonical Actions.

No broad Expert UI rewrite is required to begin Wizard development. Existing Expert UI migration to canonical services remains incremental.

---

## 4. Core architectural rule

Every Wizard mutation must ultimately use the canonical Actions/domain behavior.

The Wizard must not:

- directly patch arbitrary Draft object paths;
- duplicate Scene/Layout/Hair/Outfit/etc. mutation semantics;
- fuzzy-retarget missing stable references;
- write directly to localStorage as part of Action execution;
- make model/AI-owned data responsible for trusted host context;
- introduce a Wizard-only compiler or validator.

The Wizard is an orchestration consumer, not a new domain layer.

Where practical, Wizard invocation should stay aligned with the provider-neutral public Actions contract so the same Action vocabulary remains reusable by future AI/agent hosts.

---

## 5. Development strategy: examples first, abstraction second

Do **not** attempt to design a universal Wizard language before real Wizard flows exist.

Development should follow the same evolutionary approach that successfully shaped the current module system:

```text
Real Wizard #1
   ↓
Implement only required engine capabilities
   ↓
Observe actual problems and repetition
   ↓
Refine architecture
   ↓
Real Wizard #2 / #3
   ↓
Extract proven common abstractions
```

The first implementation target is a **Portrait Wizard**.

Future examples that must remain conceptually possible, but should not be prematurely implemented, include:

- multi-panel Comic/Manga creation with multiple Subjects, Scenes and panel-specific framing;
- a key frame intended for later image-to-video generation;
- poster design;
- business-card design;
- product photography combined with descriptive Typography/Layout;
- full fantasy/world/style transformations;
- other goal-specific guided flows not yet known.

These examples are architectural pressure tests, not current implementation requirements.

A design decision made for Portrait should be questioned if it unnecessarily blocks those future cases, but future complexity must not be implemented without a concrete need.

---

## 6. Wizard as a dynamic flow

A Wizard is not assumed to be a fixed linear sequence of pages.

The conceptual model is:

```text
Goal
 ↓
Flow
 ├── Step
 │    ├── Question
 │    └── Question
 ├── Conditional Step
 └── Future nested/repeatable flow
       ↓
Rules
 ↓
Derived Intent
 ↓
Action Plan
```

For Portrait v1, only the flow capabilities actually required by the Portrait experience should be implemented.

The architecture should avoid preventing future support for:

- conditional steps;
- conditional questions;
- branching;
- nested groups/sub-flows;
- repeatable flows/collections;
- dependencies between answers.

However, repeat/nested/collection engines are **deferred until a real Wizard requires them**.

---

## 7. Initial Wizard definition model

The first implementation should aim for a data-driven definition rather than one hardcoded Vue component per Wizard.

The working conceptual shape is:

```ts
type WizardDefinition = {
  id: string
  version: number

  title: string
  description?: string

  steps: WizardStepDefinition[]
  rules?: WizardRule[]
  mappings?: WizardActionMapping[]
  review?: WizardReviewDefinition
  completion?: WizardCompletionDefinition
}
```

This is an initial model, not a compatibility-frozen public contract.

It should evolve only in response to implemented Wizard requirements.

---

## 8. Step and Question model

A Step groups one or more user decisions.

Questions should be reusable renderable definitions rather than custom UI for every Wizard.

Likely initial question types include only what Portrait v1 needs, selected from concepts such as:

- `singleChoice`;
- `multiChoice`;
- `text` / `textarea`;
- `boolean`;
- `number` / `range`;
- `variablePicker`;
- other existing reusable selectors only when actually required.

Potential future types such as image choices, entity pickers or preset pickers should be added only when a real flow requires them.

Questions and Steps may have conditions such as `visibleWhen` or `requiredWhen`.

The first condition evaluator should stay intentionally small. Operators such as the following are sufficient candidates for the initial implementation if Portrait needs them:

```text
equals
notEquals
in
notIn
```

Do not build a general expression language prematurely.

---

## 9. Three-state interpretation model

A key separation is required between what the user actually chose, what the Wizard inferred, and how Prompt Draft represents it.

### 9.1 Answers

`answers` contain direct user-facing decisions.

Example:

```ts
{
  portraitType: 'cinematic',
  framing: 'closeUp',
  environmentType: 'studio',
  studioMood: 'dark',
}
```

### 9.2 Derived intent

`derived` contains deterministic interpretation produced by Wizard rules.

Example:

```ts
{
  styleIntent: 'cinematic',
  lightingIntent: 'dramatic',
  poseImportance: 'low',
}
```

### 9.3 Draft implementation

The Action Planner translates answers/derived intent into canonical Action requests and therefore into `PromptDraftState`.

```text
User intent       → answers
Interpretation    → derived
Implementation    → Actions
Canonical result  → Draft
```

This separation prevents UI options from becoming coupled directly to domain implementation details.

---

## 10. Defaults and user overrides

Rule-provided defaults and explicit user choices are not equivalent.

If choosing `Cinematic` suggests `Dramatic` lighting, that suggested/default value must not later overwrite a user who explicitly changes Lighting to `Soft`.

Wizard answer state should therefore be capable of preserving provenance, conceptually:

```ts
{
  value: 'dramatic',
  source: 'default',
}
```

versus:

```ts
{
  value: 'soft',
  source: 'user',
}
```

The exact runtime representation may evolve, but the invariant is fixed:

> Re-evaluating rules may replace stale defaults, but must not silently overwrite an explicit user override unless the flow deliberately invalidates that answer and communicates it.

---

## 11. Rule responsibilities

Rules should remain deterministic in the initial system.

A Rule may influence the Wizard experience or derived planning state, for example:

- show/hide a Step;
- show/hide a Question;
- mark a Question required;
- provide a default;
- provide a recommendation;
- derive semantic intent used by Action mappings.

Rules should not become an unrestricted script escape hatch.

A Question Option should generally represent a user-facing value, not contain large embedded lists of domain Actions.

Prefer:

```text
Question
   ↓
Answer
   ↓
Rule / Derived Intent
   ↓
Action Mapping
```

rather than coupling every visual Option directly to mutation code.

---

## 12. Action Planner / Mapper

The Action Planner converts resolved Wizard state into canonical Actions.

Example conceptually:

```text
Answer:
portraitType = cinematic

Derived:
styleIntent = cinematic
lightingIntent = dramatic

Action Plan:
module.activate(...)
module.preset.apply(...)
lighting.source.create(...)
...
```

The Action Planner must respect the existing Actions contract and stable-reference rules.

It must not recreate domain validation or perform arbitrary JSON/path mutation.

The exact Action IDs, registered preset IDs, field IDs and specialized inputs used by Portrait must be verified against the real repository during implementation rather than guessed from Wizard UX labels.

---

## 13. Actions discovery vs Wizard knowledge

The public Actions manifest answers:

> **What can Prompt Draft do?**

A Wizard Definition answers:

> **What should this goal-specific Wizard ask and do?**

Action discovery alone cannot determine good Wizard UX or domain intent.

For example, discovery can describe `module.preset.apply` and its input schema, but it does not decide which preset represents a good Cinematic Portrait.

Goal-specific product knowledge belongs in the Wizard Definition/rules/mappings.

If implemented Wizards repeatedly require richer runtime catalogs or capability discovery, introduce the smallest shared adapter justified by those real requirements. Do not build a universal catalog layer in advance.

---

## 14. Wizard Session

The Wizard needs session state separate from the persistent Draft record/session metadata.

Initial conceptual state:

```ts
type WizardSession = {
  wizardId: string
  currentStepId: string
  answers: Record<string, unknown>
  derived: Record<string, unknown>
  workingDraft: PromptDraftState
}
```

The exact shape will be refined during Portrait implementation.

Session responsibilities include:

- current flow position;
- user answers;
- derived/default state;
- Back/Next behavior;
- conditional flow evaluation;
- temporary Working Draft;
- review and completion state.

Persistence strategy for an in-progress Wizard is not yet frozen and should be implemented only if required by the first real UX.

---

## 15. Working Draft lifecycle

The Wizard should not destructively mutate the user's active Draft while the guided session is incomplete.

Preferred lifecycle:

```text
Active Draft
   ↓ clone
Wizard Working Draft
   ↓
Actions execute on working state
   ↓
prompt.validate
   ↓
Finish / Commit
   ↓
Active Draft replaced/applied
```

Canceling the Wizard leaves the original Active Draft unchanged.

This also gives the Wizard session-level atomic behavior without immediately requiring a new Actions batch/transaction engine.

If an Action fails while building the Working Draft, completion stops and the Active Draft remains untouched.

---

## 16. Batch/transaction policy

The Actions API currently guarantees atomicity for one Action.

Do **not** implement `executeBatch`, dry-run or a transaction engine merely because a Wizard may execute multiple Actions.

The Working Draft provides a sufficient first isolation boundary:

- actions may execute sequentially on a temporary Draft;
- an intermediate failure prevents completion;
- the user's Active Draft is committed only after successful resolution/validation.

Introduce true batch/transaction semantics only when a concrete implemented Wizard demonstrates a requirement that Working Draft orchestration cannot satisfy cleanly.

---

## 17. Validation and compilation

The Wizard must reuse the canonical read Actions:

```text
prompt.validate
prompt.compile
```

No Wizard-specific compiler or validator should be created.

At completion, the expected flow is conceptually:

```text
Resolve Wizard state
   ↓
Build / execute Action Plan on Working Draft
   ↓
prompt.validate
   ↓
If valid: prompt.compile
   ↓
Commit Draft / expose final result
```

Technical Action/validation issues should be mapped back to user-facing Wizard context where possible, for example directing the user to a Subject step rather than exposing an opaque domain error as the primary UX.

---

## 18. AI policy

AI-assisted Wizard planning is intentionally **out of scope for the initial implementation**.

The initial Wizard should be deterministic and rule-based. This makes the semantics testable and establishes a trustworthy orchestration layer before adding model behavior.

Future AI assistance should feed the same architecture rather than bypass it:

```text
User Answers ───┐
                ├── Wizard Intent / Plan ──> Actions API
AI Suggestion ──┘
```

AI should not directly gain ownership of Draft, module registry, `ActionEnvironment`, ID factories or arbitrary object mutation.

---

## 19. Portrait Wizard v1 — first real testcase

Portrait is the first concrete Wizard used to discover the minimum viable engine.

The exact UX will be refined against real module schemas, but the current conceptual flow is:

1. **Subject** — who/what the portrait is about; reference/user Subject handling as needed.
2. **Portrait intent/type** — e.g. professional, cinematic, fashion, fantasy.
3. **Appearance** — simplified guided choices around Expression, Hair and Outfit.
4. **Composition** — framing and camera-oriented decisions.
5. **Environment** — studio/outdoor/abstract/etc., with conditional follow-up choices.
6. **Lighting & mood** — simplified intent-oriented choices rather than the full Expert UI.
7. **Review** — summarize user decisions and allow correction.
8. **Completion** — build canonical Draft, validate, compile and allow continuation in Expert UI.

The flow may conditionally remove or alter later questions. For example, a close-up framing may make detailed full-body Pose questions unnecessary.

The Portrait Wizard should teach us which Definition, Session, Rule and Action-Planning abstractions are actually necessary.

---

## 20. Multi-Subject and advanced-domain awareness

Prompt Draft already supports richer structures than the first Portrait Wizard needs.

For example, user-defined Subject variables can support multiple independent characters. This can later be combined with domain capabilities such as:

- subject-targeted Pose/Expression/Hair/Outfit;
- multiple Scenes;
- Scene component composition;
- per-Scene or per-Region layout decisions;
- multiple unique framings/configurations through existing module/entity semantics;
- Typography and structured Layout for poster/comic/product flows.

The Wizard engine must not assume that there is always exactly one Subject, one Scene, one Region, one entity, or one linear image composition.

At the same time, Portrait v1 should not implement multi-character Comic orchestration until that Wizard becomes an active testcase.

---

## 21. Initial implementation scope

### Build now

- minimal `WizardDefinition` types required by Portrait;
- `WizardSession` state;
- basic Step/Question renderer;
- minimal condition/rule evaluator required by Portrait;
- default vs explicit user-choice behavior;
- Action Planner/Mapper for Portrait;
- Working Draft lifecycle;
- Review flow;
- completion via canonical `prompt.validate` / `prompt.compile`;
- focused tests for deterministic flow/rules/planning and Draft isolation.

### Reuse as-is

- Actions API;
- canonical Draft state/helpers;
- domain services through canonical Actions;
- existing stable-reference semantics;
- validation/compiler;
- reusable design-system primitives and suitable existing pickers.

### Do not build yet

- universal Wizard DSL/expression language;
- arbitrary scripting inside Wizard definitions;
- generalized repeat/nested/collection flow engine without a real use case;
- batch/transaction/dry-run Actions without demonstrated need;
- AI planning/AI-generated Wizard flows;
- universal capability/catalog abstraction without repeated need;
- broad Expert UI rewrite;
- Wizard-specific mutation/domain/compiler logic.

---

## 22. Architecture acceptance principles

A Wizard architecture change should generally satisfy these questions:

1. Does it solve a real implemented Wizard requirement?
2. Can the requirement be solved by existing Actions/domain capabilities first?
3. Does it preserve `PromptDraftState` as the canonical result?
4. Does it preserve stable-reference and Action validation semantics?
5. Does it separate user-facing answers from derived intent and domain implementation?
6. Does it preserve explicit user overrides against changing defaults?
7. Does it avoid coupling the Wizard to full Expert UI panels?
8. Does it avoid unnecessary abstraction based only on hypothetical future flows?
9. Does it leave a reasonable extension path for future multi-Subject, multi-Scene, nested or repeatable flows?
10. Is the new abstraction backed by tests and a real Wizard example?

---

## 23. Source-of-truth update rule

This README is intentionally architectural rather than a diary.

Update it when:

- an accepted invariant changes;
- a new Wizard proves a reusable capability is required;
- a deferred capability becomes implemented and canonical;
- the Wizard/Draft/Actions boundary changes;
- the development strategy or compatibility policy changes.

Do not update it for every small implementation detail.

Use [`STATUS.md`](./STATUS.md) for current progress, test checkpoints, active work, immediate next steps and temporary implementation notes.
