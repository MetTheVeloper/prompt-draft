# Wizard UI Architecture

Status: **Accepted rewrite baseline**

Working branch: `feature/wizard`

Parent architecture source of truth: [`README.md`](./README.md)

Operational checkpoint: [`STATUS.md`](./STATUS.md)

This document is the **source of truth for Wizard presentation, flow structure, session ownership, routing, persistence, and Create-page handoff decisions**.

It complements the core Wizard architecture in `README.md` and should describe accepted product/UX invariants rather than temporary implementation details.

---

## 1. Product principle

The Wizard is not a reduced copy of the Expert UI.

The two surfaces share the same canonical Draft/domain/Actions foundation, but they serve different interaction goals:

```text
Expert UI = power, detail, direct control
Wizard UI = guidance, clarity, intent-driven decisions
```

The Wizard should feel like a focused creative flow where the user describes what they want and makes a small number of understandable decisions while the system translates those decisions into canonical Prompt Draft state.

The user should not need to understand Prompt Draft implementation concepts to use the Wizard.

Canonical UX rule:

> **Wizard questions describe user intent, not Prompt Draft implementation concepts.**

Do not expose concepts such as module keys, Action IDs, named configurations, variable IDs, assignment records, field IDs, or compiler implementation vocabulary merely because those concepts exist in the Expert UI.

---

## 2. Wizard and Create are independent authoring surfaces

A newly started Wizard must **not** clone or depend on the Active Draft from `/create`.

The standard Wizard flow starts from its own fresh isolated state:

```text
Open Wizard
   ↓
Create or restore Wizard Session
   ↓
Fresh isolated Wizard Working Draft
   ↓
Wizard answers + canonical Actions
   ↓
Completion
   ↓
finalDraft
```

The existence, contents, selected modules, variables, or current Active Draft in `/create` must not be prerequisites for starting or completing a Wizard.

This avoids leaking Expert UI state into the guided flow and makes each Wizard independently understandable and resumable.

A future feature may explicitly support a separate intent such as "edit this Create draft with a Wizard", but that is **not** the default Wizard lifecycle and must not be inferred from the current Active Draft.

---

## 3. Completion does not overwrite Create state

Wizard completion and Create-page persistence are separate product actions.

Successful completion produces a Wizard result:

```text
Wizard completion
   ↓
finalDraft + compiled output
```

Completion by itself must not replace the current Active Draft in `/create`.

If the user explicitly chooses an action such as:

```text
Continue editing in Create
```

then the completed `finalDraft` may be handed to the Create host as a **new Draft record** in the Create draft collection.

Canonical handoff:

```text
Wizard finalDraft
   ↓ user explicitly requests Create handoff
Create host adapter
   ↓
Create NEW draft record
   ↓
Open that new draft in Expert UI
```

Do not silently overwrite an unrelated existing Create draft.

Canceling or abandoning the Wizard changes nothing in Create.

---

## 4. Wizard Session ownership and persistence

The Wizard owns its own resumable session state.

For the initial implementation, a small local-first persistence model is sufficient. We do not need a generalized cloud/session service.

The persisted shape should conceptually contain only the state needed to resume the actual Wizard execution:

```ts
{
  wizardId,
  definitionVersion,
  currentStepId,
  answers,
  derived,
  workingDraft,
  createdAt,
  updatedAt,
}
```

The exact TypeScript shape should follow the real Session model rather than duplicate it unnecessarily.

Persist after meaningful changes such as:

- answer updates;
- subject/entity changes;
- canonical Working Draft changes;
- navigation changes.

Persistence may be debounced where appropriate.

On refresh or reopening the same Wizard, an in-progress session should be resumable.

A minimal resume UX may offer:

```text
Portrait Wizard in progress
You were working on Appearance · Outfit

[ Continue ]
[ Start over ]
```

For the first version, one active resumable session per Wizard ID is enough unless a real requirement proves otherwise.

---

## 5. Flow vocabulary: Stage → Step → Question

Use three lightweight concepts:

```text
Stage
  ↓
Step
  ↓
Question
```

### Stage

A **Stage** is a high-level user-facing chapter used for orientation, progress, Review grouping, and broad navigation context.

Examples:

```text
Start
Subjects
Portrait
Appearance
Composition
Scene
Final
Review
```

Stages should remain relatively stable even when conditional logic changes the number of actual pages shown to a user.

### Step

A **Step** is the real executable Wizard page.

A Step should normally represent one focused task or one tightly related decision group.

Examples:

```text
Start
Manage subjects
Choose portrait intent
Choose outfit strategy
Customize Sarah's outfit
Final image settings
```

Steps drive navigation, visibility, persistence position, and edit/resume targets.

### Question

A **Question** is an answer-producing control inside a Step.

Related questions may share one Step when they clearly belong to the same small task. For example, optional Idea + Starting Point belong naturally together in the initial Start Step.

---

## 6. Keep execution flat

The Stage/Step model must not become a nested workflow engine.

Preferred Definition direction:

```ts
{
  stages: [
    { id: "start", title: "Start" },
    { id: "subjects", title: "Subjects" },
    { id: "appearance", title: "Appearance" },
    // ...
  ],

  steps: [
    { id: "start", stageId: "start", questions: [...] },
    { id: "subjects", stageId: "subjects", questions: [...] },
    { id: "hair", stageId: "appearance", questions: [...] },
    { id: "outfit", stageId: "appearance", questions: [...] },
    // ...
  ],
}
```

The exact property names may be refined during implementation, but the invariant is:

> **Stages group Steps; Steps remain a flat executable sequence.**

Do not introduce nested sub-step trees, arbitrary flow graphs, route-per-step structures, or a universal workflow DSL unless a future concrete requirement proves they are necessary.

Navigation should continue to resolve the next/previous visible Step from the flat Definition sequence.

---

## 7. Stage is presentation metadata, not persisted execution state

Persist `currentStepId`, not a separate `currentStageId`.

The current Stage is derived from the current Step's `stageId`.

This matters for maintainability: if a future Definition moves a Step from one Stage to another, persisted sessions can still resume by stable Step identity without requiring a separate Stage-state migration.

Conceptually:

```text
currentStepId
   ↓
step.stageId
   ↓
current Stage
```

---

## 8. Navigation and progressive disclosure

Use two different mechanisms deliberately.

### New Step

Create a separate Step when the user is performing a meaningfully different task.

Example:

```text
Choose outfit strategy
   ↓
Customize Sarah's outfit
```

### Progressive disclosure inside the current Step

Reveal additional controls inside the same Step when they are direct details of the answer the user just selected.

Example:

```text
Environment = Outdoor
   ↓
show Outdoor setting field
```

Do not create a new page for every conditional field.

Conversely, do not overload one page with several unrelated tasks merely to minimize Step count.

The first implementation should continue to use accepted Definition/Session visibility behavior rather than creating a second conditional engine in Vue.

---

## 9. Progress is Stage-level, not raw Step percentage

Do not represent Wizard progress primarily as a raw percentage such as `43%`.

Conditional and per-entity Steps make raw percentages unstable and potentially misleading.

Desktop should prefer a lightweight Stage-level indicator, for example:

```text
Start   Subjects   Portrait   Appearance   Composition   Scene   Final   Review
  ✓        ✓           ●           ○            ○          ○       ○       ○
```

Current context may also show:

```text
Portrait · Stage 3 of 8
```

Mobile may collapse this into the current Stage plus a compact progress line:

```text
Subjects
2 of 8
━━━━━━━━━━━━────────────
```

The visual Stage indicator is orientation UI, not the execution model.

A user may move through several Steps while the active Stage remains unchanged.

---

## 10. Wizard shell and page composition

The Wizard should use the available viewport deliberately.

Preferred page anatomy:

```text
┌──────────────────────────────────────────────────────────────┐
│ Wizard header / exit / stage progress / save state          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                                                              │
│                  Focused current Step                        │
│                                                              │
│               choices / entities / inputs                    │
│                                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Back                                              Continue   │
└──────────────────────────────────────────────────────────────┘
```

The main Step content should normally be centered in a constrained readable area while preserving generous whitespace.

When content becomes tall, the central content region may scroll while navigation remains predictable.

The shell should avoid making each Step look like another Expert settings panel.

---

## 11. Header and footer responsibilities

Wizard-level actions and Step navigation should be visually separated.

### Header

The Wizard header may contain:

- Exit/close Wizard;
- Wizard identity/title where useful;
- Stage progress;
- saved/resume state feedback when useful.

Exit is a Wizard-shell action, not a Step answer.

### Footer

The footer should primarily contain predictable navigation:

```text
Back                                  Continue
```

On Review, Continue becomes the appropriate completion action.

Avoid placing several equally strong primary actions in the footer.

On mobile, footer navigation may be sticky.

---

## 12. Reuse boundary

Wizard UI should reuse the project's existing design-system primitives and shared infrastructure where their semantics fit.

Expected primitives include:

- `el-flex`;
- `el-grid`;
- `el-text`;
- `el-button`;
- `el-text-field`;
- `el-divider`;
- `el-icon`;
- global menu infrastructure;
- global modal infrastructure where a modal is genuinely appropriate.

The existing grid/flex primitives are sufficient for responsive centered stages, selectable cards, entity layouts, and mobile collapse behavior.

The Wizard should **not** embed complete Expert UI domain panels such as Hair, Outfit, Pose, Lighting, Framing, etc. merely to avoid writing presentation code.

Canonical boundary:

```text
Shared design primitives / suitable infrastructure   ✅
Expert workflow/domain panels                        ❌
Canonical domain + Actions behavior                  ✅
Duplicated Wizard-side domain mutation               ❌
```

---

## 13. Modal and menu usage

Core Wizard work should stay in the main Stage whenever practical.

Do not put basic required tasks such as naming the primary Subject inside a modal merely because modal infrastructure exists.

Use modal/menu infrastructure for secondary interactions such as:

- remove confirmation;
- optional advanced details;
- help/information;
- compact add-type selection;
- exceptional issue handling.

Desktop may use an anchored menu for compact entity-type choices.

Mobile may use an appropriate drawer/menu presentation from the same global menu system.

---

## 14. Choice interaction

For small intent-oriented option sets, prefer visible cards/tiles/segments over dropdowns.

Examples include:

- starting point;
- Portrait intent;
- Expression direction;
- Hair direction;
- Outfit direction;
- shared vs per-subject strategy;
- Framing;
- Environment;
- Lighting;
- Aspect Ratio presets.

Desktop may present choices in a responsive grid; mobile should naturally collapse to fewer columns or one item per row.

Options may display:

- label;
- icon where useful;
- short user-facing description when useful;
- selected/default state.

Do not expose implementation identifiers in option presentation.

---

## 15. The Start Stage

The first Stage should establish the user's broad creative starting point before domain-specific choices.

For the initial Portrait flow, the first Step should contain two closely related inputs:

### Idea

Ask what the user wants to create.

Idea is optional but important.

If the user supplies an Idea, preserve it as the user's explicit intent.

If the user leaves Idea empty, the Wizard may create a deterministic domain-appropriate Idea during finalization after enough semantic information is available.

The empty fallback should **not** be generated immediately on the Start page because later answers may provide better context.

### Starting Point

Ask the user in natural language whether they want to:

- start from a description;
- start from an image/reference.

Internally this maps to the canonical prompt mode (`text_to_image` / `image_to_image`).

The UI does not need to lead with those technical mode names.

---

## 16. Idea semantics

Idea is **descriptive, not procedural**.

Idea must not become a hidden rule engine or arbitrary branching input.

Canonical invariant:

```text
Idea
  ├── does not decide which Wizard questions exist
  ├── does not execute arbitrary rules
  └── does not replace deterministic Definition logic
```

If Idea is empty, a Wizard-specific deterministic fallback may be generated during finalization from resolved semantic answers.

The fallback may use Prompt Draft's variable/nested-variable system where useful.

Conceptual examples:

```text
Transform {subject} into a {style} portrait.
```

or for multiple resolved entities:

```text
Create a cinematic portrait featuring {sarah} and {john} in {style}.
```

The exact fallback recipe belongs to the Wizard-specific semantic layer, not the generic Vue renderer.

---

## 17. Subjects are constructed by the Wizard

Subject selection must not depend on Subject variables already existing in `/create`.

The primary Subjects flow should **construct the required entities and variables inside the isolated Wizard Working Draft**.

The user answers a simple product question such as:

> Who or what should appear in the image?

The Wizard decides how that intent maps to canonical Prompt Draft variables and related entity state.

For a simple Portrait Wizard, the domain already knows that the default/main entity is a Person, so the user should not need to select a technical subject type merely to begin.

---

## 18. Do not use the Variable Picker as the primary Subjects UI

`variablePicker` is not the main Question type for constructing Subjects.

Do not present a `Use existing subject` path sourced from the Create Active Draft in the standard Wizard flow.

The user should not have to understand that Subject variables exist.

Variable/entity selection remains useful later when a domain choice must be assigned to one of several **Wizard-owned** entities, such as choosing which person receives a particular Outfit, Pose, Hair, Material, or other targetable configuration.

Even in those cases, the user-facing UI should prefer entity labels such as `Sarah` or `John` rather than exposing variable implementation vocabulary.

---

## 19. Subject entity model

The Subjects Stage defines the entity topology used by later Stages.

Keep the semantic shape collection-friendly from the start even when the first Portrait flow normally begins with one Person.

Conceptually, a resolved Wizard entity needs stable identity separate from its display label:

```ts
{
  entityId,
  kind,
  label,
  variableId,
}
```

The exact runtime type should be extracted from the real implementation.

Important distinction:

```text
entityId    = stable internal semantic identity
label       = user-facing name, editable
variableId  = canonical Prompt Draft variable identity
```

Assignments should not depend only on a mutable display label or raw variable-key string.

Renaming `Sarah Connor` to `Sarah` must not break downstream entity-targeted decisions.

---

## 20. Subject naming

User-facing entity names should be recognizable and meaningful.

Avoid generic labels such as `Subject 1`, `Subject 2` when a more semantic fallback is available.

For Portrait, a Subject card may ask for an optional name/label:

```text
Name this person
[ Sarah Connor ]

Optional — leave blank to use “Person”.
```

Display label and canonical variable key are separate concerns.

Example:

```text
Display: Sarah Connor
Canonical variable key: normalized by the existing variable domain service
```

Do not duplicate key normalization, uniqueness, or reserved-key logic inside Wizard UI.

Use canonical variable/domain Actions for creation and mutation.

---

## 21. Subject cards and Add Subject interaction

Prefer direct entity cards in the central Stage rather than a separate mechanical "How many subjects?" question followed by another naming page.

Conceptual Subjects Step:

```text
              Who should appear in the image?

      ┌────────────────────┐
      │ 👤 Sarah            │
      │ Person             │
      └────────────────────┘

                  + Add subject
```

The number of cards naturally expresses the number of entities.

The Wizard domain defines:

- which entity kinds are allowed;
- minimum/maximum counts where relevant;
- default entity kind/count.

`Add subject` may open a compact type chooser when multiple entity kinds are valid for that Wizard.

Examples of possible domain-driven choices include Person, Animal, Product, Vehicle, or other supported semantic entity kinds.

Do not expose Variable Blueprint terminology to the user.

---

## 22. Reuse Variable Blueprint semantics, not Expert workflow

Existing Variable Blueprints are useful canonical recipes/catalog data for repeatable Person, Animal, Subject Set, and related entities.

The Wizard may reuse or adapt their semantic information where appropriate.

However, the Wizard should not simply open the existing Expert Variable Blueprint workflow as the core Subjects experience.

Canonical direction:

```text
User intent
   ↓
Wizard Subject plan
   ↓
canonical variable/domain Actions
   ↓
Wizard Working Draft
```

Reuse data/behavior where it is genuinely canonical; keep the guided presentation purpose-built.

---

## 23. Entity count controls downstream assignment strategy

The number and kind of Subjects created early in the Wizard affects later domain presentation.

Example: Outfit.

With one Person:

```text
1 subject
   ↓
Outfit choice can use global module output
```

With multiple targetable Persons:

```text
multiple subjects
   ↓
ask whether the choice is shared or individualized
```

If shared:

```text
one global choice
```

If individualized:

```text
per-entity choices
   ↓
named configurations + assignments internally
```

The user should see language such as:

```text
Same for everyone
Customize each
```

The user should **not** need to understand `named configuration` or `assignment` terminology.

This pattern may later apply to domains such as:

- Outfit;
- Hair;
- Pose;
- Expression;
- Material / Texture;
- other modules that support entity-targeted configuration.

Only introduce per-entity branching where the real module capability and Wizard requirement justify it.

---

## 24. Generic question rendering and semantic interaction components

Keep generic rendering for atomic Question types.

Examples:

```text
singleChoice → Wizard choice/card group
text         → Wizard text question
```

Add renderer types only when a real Definition requires them.

However, not every meaningful Wizard interaction needs to be forced into a primitive Question renderer.

Reusable semantic interaction components may exist for patterns such as:

- entity management;
- entity cards;
- entity target selection;
- shared-vs-individual strategy;
- Review groups.

Do not implement these as hardcoded `if question.id === ...` branches in a generic page.

The goal is **small reusable Wizard patterns**, not a universal UI schema.

---

## 25. Final Settings Stage

Most low-level Setup controls should appear near the end of the Wizard, after the creative intent has been defined.

Examples include:

- Aspect Ratio;
- image-reference adherence;
- transformation strength;
- preserve controls that are relevant to `image_to_image`;
- other final output/setup decisions proven necessary by the Wizard.

Do not interrupt early creative Stages with technical Setup controls unless they materially change the semantic path.

Idea and Starting Point are the important exceptions and belong at the beginning.

Final Settings must be conditional where appropriate. For example, image-reference preserve controls should not appear in a `text_to_image` flow merely because those fields exist in the canonical Setup model.

---

## 26. Review presentation

Review is not another editable Expert form.

Render semantic results grouped primarily by Stage.

Conceptual structure:

```text
Start                                      Edit
──────────────────────────────────────────────
From an image
Idea: Cinematic portrait...

Subjects                                   Edit
──────────────────────────────────────────────
Sarah · Person
John · Person

Appearance                                 Edit
──────────────────────────────────────────────
Sarah · Professional outfit
John · Casual outfit
Natural hair

Final settings                             Edit
──────────────────────────────────────────────
Portrait 4:5 · Preserve identity
```

Review must not expose mapper implementation details.

An Edit action should navigate to the relevant Step/Stage and support returning to Review after the edit without forcing the user through every already-completed Step again.

The exact `returnToStepId`/edit-navigation mechanism should remain small and Session-driven.

---

## 27. Completion presentation

Finish invokes the accepted canonical completion pipeline for the resolved Wizard runtime.

Conceptual flow:

```text
Finish
  ↓
Wizard-specific mapping
  ↓
prompt.validate
  ↓
prompt.compile
  ↓
Success: finalDraft + compiled output
Failure: Wizard-facing issue state
```

The UI should distinguish completing/loading, success, validation failure, mapping/action failure, and other recoverable issue states where practical.

Raw internal codes should not be the primary user-facing message when a Wizard-context explanation or navigation target can be provided.

After success, optional product actions may include copying/using the result or explicitly continuing in Create as a **new** Draft.

---

## 28. Routing model

Use one shared dynamic Wizard page rather than one page implementation per Wizard.

Preferred Nuxt route:

```text
/wizard/[wizardId]
```

Examples:

```text
/wizard/portrait
/wizard/anime
/wizard/product
/wizard/comic
```

The route identifies and initializes the requested Wizard. It should not contain goal-specific mutation/business logic.

Conceptually:

```text
route.params.wizardId
   ↓
Wizard Registry
   ↓
Wizard runtime entry
   ├── definition
   ├── semantic adapters
   ├── review adapter
   └── completion adapter
   ↓
shared Wizard Shell / renderer
```

Do not create one copied Vue page per Wizard while this shared model remains sufficient.

---

## 29. Wizard Registry

Use the smallest registry required to resolve a route ID to a supported Wizard runtime entry.

The runtime entry may grow only as proven requirements appear, for example Definition plus Wizard-specific semantic/review/completion behavior.

The Registry answers which Wizard implementation a route represents; it is not a universal plugin/DSL system.

Unknown `wizardId` values should fail gracefully instead of silently initializing another Wizard.

---

## 30. Static generation / deployment

The application is built and deployed statically with `pnpm generate`.

Using a dynamic Nuxt route does **not** mean Wizard pages require runtime server rendering.

Supported Wizard URLs must be explicitly included in static prerender generation using a maintainable public route list.

Current accepted pattern:

```text
/wizard/portrait
/wizard/anime
...
```

Do not rely solely on crawler discovery for essential Wizard entry points.

---

## 31. Reusable Wizard presentation direction

The implementation should remain modest and pattern-driven.

Likely shared components may include:

```text
WizardShell
WizardProgress
WizardStage
WizardFooter
WizardQuestionRenderer
WizardChoiceGroup / WizardChoiceCard
WizardEntityCard
WizardEntityManager
WizardEntitySelector
WizardReview
```

Do not freeze this exact list as a public contract.

Avoid splitting trivial one-use markup into components only for architectural appearance.

Likewise, avoid a giant generic renderer that attempts to encode every future Wizard interaction.

Extract a reusable component when a real interaction pattern is shared or clearly reusable by the next Wizard.

---

## 32. Initial Portrait flow direction

The accepted product direction for the Portrait rewrite is approximately:

```text
1. Start
   - Idea (optional)
   - Start from description / image

2. Subjects
   - construct Person/entity records inside Wizard
   - meaningful labels
   - add additional supported subjects where the Portrait scope allows it

3. Portrait
   - Portrait intent

4. Appearance
   - Expression
   - Hair
   - Outfit
   - shared/per-entity strategy only when needed

5. Composition
   - Framing
   - Pose
   - shared/per-entity strategy only when needed

6. Scene
   - Environment
   - Lighting as appropriate to the accepted Definition split

7. Final
   - Aspect Ratio
   - image-to-image reference/preserve behavior when applicable
   - other final Setup choices required by this Wizard

8. Review

9. Complete
   - Wizard result
   - optional explicit “Continue in Create” → new Create Draft
```

The exact Step count inside these Stages may change as the real UX is implemented and tested.

Stage grouping is the stable orientation layer; Step count is allowed to evolve.

---

## 33. Portrait rewrite acceptance criteria

The next Portrait UI rewrite should demonstrate at minimum:

1. Wizard starts from a fresh isolated Draft rather than cloning the Create Active Draft;
2. Start captures optional Idea and user-facing Starting Point in one focused Step;
3. empty Idea may be deterministically generated later instead of blocking progress;
4. Subjects are constructed inside the Wizard rather than selected from Create variables;
5. Subject/entity identity is stable and collection-friendly;
6. canonical variable/domain Actions remain the mutation path;
7. multiple Subjects can inform shared-vs-per-entity presentation where a real module supports assignment;
8. Stage-level progress replaces raw percentage progress;
9. Steps remain a flat executable sequence grouped by Stage metadata;
10. Wizard Session is persisted and resumable independently of Create;
11. Review groups semantic decisions and supports focused Edit/return behavior;
12. completion does not overwrite an existing Create draft;
13. explicit Continue-in-Create creates a new Create Draft;
14. static `/wizard/portrait` generation remains valid;
15. no Expert domain panel is embedded merely to implement Wizard UI;
16. no parallel arbitrary Draft mutation path is introduced.

---

## 34. Explicitly deferred

Do not implement without a concrete requirement:

- universal Wizard DSL;
- arbitrary expression/rule scripting;
- nested sub-step trees;
- generalized workflow graph engine;
- generalized repeat/nested collection renderer;
- arbitrary per-question rendering scripts;
- AI-generated Wizard definitions or UI;
- automatic free-form Idea interpretation as flow logic;
- cloud/multi-device Wizard session sync;
- multiple saved Wizard sessions per Wizard ID;
- one Vue page per Wizard while the shared route/registry model is sufficient;
- broad Expert UI migration/refactor purely for Wizard reuse;
- Wizard-specific compiler/validator;
- direct arbitrary Draft/path mutation.

---

## 35. Extensibility rule

The Wizard architecture should be easy to evolve without committing early to abstractions that have not been proven by a second real use case.

Preferred strategy:

```text
stable semantic identities
+ flat executable Steps
+ lightweight Stage grouping
+ canonical Actions
+ isolated resumable Session
+ small reusable UI patterns
```

If a future Wizard proves that these structures are insufficient, extend them around the stable semantic/session boundaries rather than replacing the entire flow engine.

The design goal is not to predict every future Wizard. The goal is to make the first architecture cheap to extend and cheap to revise.

---

## 36. Update rule

Update this document when an accepted decision changes around:

- Wizard vs Expert presentation boundaries;
- Wizard independence from Create;
- session persistence/resume semantics;
- Stage/Step/Question responsibilities;
- progress/navigation behavior;
- Subjects/entity construction and assignment presentation;
- generic renderer/component responsibilities;
- Idea/Starting Point semantics;
- Final Settings placement;
- Review or completion presentation semantics;
- routing/registry structure;
- static-generation strategy;
- Create handoff ownership;
- reusable UI architecture proven by implemented Wizards.

Use `STATUS.md` for temporary implementation progress, test checkpoints, current defects, and immediate next work rather than turning this document into a development diary.
