# Wizard Development Status

Last updated: **2026-08-28**

Status: **Foundation implementation started — `WizardDefinition` + `WizardSession` checkpoint complete**

Working branch: `feature/wizard`

Branch baseline: `main@c60490681feb145d90749b1415337850f7c9c88c`

Architecture source of truth: [`README.md`](./README.md)

Actions contract: `prompt-draft.actions.v1`

---

## Current checkpoint

The first production Wizard foundation is now implemented on top of the completed Actions API baseline.

Foundation implementation commit:

- `51699c6dd61688f17fdde15210eb4e21a6df211f` — `feat(wizard): add definition and session foundation`

The checkpoint deliberately stops before the Portrait Action Planner, completion commit adapter, or full Wizard UI.

### Source inspection completed before implementation

The implementation was based on the current source rather than the earlier conceptual model alone:

- `app/actions/public.ts` confirms `invokePublicAction(...)` is the provider-neutral canonical invocation bridge for `prompt-draft.actions.v1`;
- `app/actions/registry.ts` confirms every Action executes against a cloned Draft and failed Actions return the caller's previous Draft unchanged;
- `app/modules/promptDraft.types.ts` confirms `PromptDraftState` contains canonical prompt/module state only, while record IDs/timestamps and collection metadata live outside it;
- `app/utils/promptDraftState.ts` already provides canonical `clonePromptDraftState(...)`;
- `app/pages/create.vue` currently owns Active Draft persistence/selection/localStorage behavior, so Wizard session state must remain independent from that page-owned persistence layer;
- `app/modules/registry.ts` remains the canonical module registry supplied by the host when Actions execute;
- current public Actions expose module/variable/entity/specialized mutation surfaces plus `prompt.validate` / `prompt.compile` reads.

One important integration constraint was identified:

> The current public Actions contract does not expose a dedicated Prompt Settings mutation surface. Portrait mapping must therefore either stay within existing canonical Actions or add the smallest required Prompt Settings capability to the canonical Actions API first. The Wizard must not patch `promptSettings` directly as a workaround.

### Implemented now

#### `app/wizard/definition.ts`

- minimal `WizardDefinition`, Step and Question contracts;
- only Portrait-required initial question kinds:
  - `singleChoice`;
  - `text`;
  - `variablePicker`;
- intentionally small visibility condition contract:
  - `equals`;
  - `notEquals`;
- definition validation for:
  - non-empty IDs/titles;
  - positive version;
  - at least one Step;
  - unique Step IDs;
  - globally unique Question/answer IDs;
  - valid single-choice options;
  - condition references to known answers;
- first semantic `portraitWizardV1Definition` covering:
  - Subject;
  - Portrait intent;
  - Appearance;
  - Composition;
  - Environment with conditional follow-up questions;
  - Lighting & mood;
  - Review;
- Portrait options remain user-facing semantic intent. They do **not** embed Action IDs, module keys, preset IDs, or mutation plans.

#### `app/wizard/session.ts`

- `WizardSession` now separates:
  - `answers`;
  - `derived`;
  - `workingDraft`;
- answer provenance is explicit through `source: "default" | "user"`;
- rule/default writes may replace previous defaults but do not overwrite an explicit user answer;
- session creation clones the supplied Active Draft through canonical `clonePromptDraftState(...)`;
- basic ordered Back/Next navigation is definition-driven;
- Step/Question visibility uses only the small current condition evaluator;
- `executeWizardAction(...)` delegates directly to canonical `invokePublicAction(...)` using host-owned Action context;
- failed Actions leave the existing Wizard session/Working Draft unchanged;
- successful Actions advance only `workingDraft`;
- there is intentionally **no Active Draft commit API inside `WizardSession`**. Applying a completed Working Draft remains a host/completion concern.

No Expert UI component or Create-page persistence code was rewritten in this checkpoint.

---

## Validation status

Added focused tests:

- `scripts/wizard-definition.test.ts` — **3 cases**;
- `scripts/wizard-session.test.ts` — **6 cases**;
- package command: `pnpm test:wizard`.

Coverage currently checks:

- Portrait Definition structure and semantic/action-decoupled data;
- duplicate Question IDs and invalid condition references;
- Active Draft clone/isolation;
- default vs user provenance;
- defaults not overwriting explicit user choices;
- `answers` vs `derived` separation;
- Portrait conditional Environment questions;
- ordered Step navigation;
- successful canonical `module.activate` execution against Working Draft only;
- failed canonical Action preserving the current Working Draft/session.

Validation performed in the current tool environment:

- TypeScript parser/transpile syntax check for the four new `.ts` files: **passed**;
- branch diff checked after commit: only the two Wizard source files, two Wizard tests, and the `test:wizard` package script changed.

Not yet executed here:

- `pnpm test:wizard`;
- full `pnpm test:actions-api` regression;
- production build.

The current connector/runtime does not have the repository workspace and pnpm dependencies mounted, and the existing GitHub workflow only runs deployment generation on `main`. These commands remain the next validation gate before expanding the runtime.

---

## Accepted architecture decisions

The following decisions remain accepted and unchanged:

1. The Wizard is a guided, goal-oriented interaction layer over the existing canonical Draft/domain/Actions system.
2. The Wizard must produce a normal editable `PromptDraftState`, not only a prompt string.
3. Wizard mutations must use canonical Actions/domain semantics; no parallel mutation implementation is allowed.
4. Expert UI and Wizard UI are separate presentation layers. The Wizard does not need to embed full Expert UI panels.
5. Existing reusable UI primitives/pickers may be reused where they genuinely fit Wizard UX.
6. The first concrete testcase is a **Portrait Wizard**.
7. Architecture is developed incrementally from real Wizard examples rather than from a speculative universal DSL.
8. Wizard state separates direct `answers`, deterministic `derived` intent, and the resulting `workingDraft`.
9. Defaults/recommendations must not silently overwrite explicit user choices.
10. Flow supports the minimum conditional Steps/Questions required by Portrait v1 while leaving later extension room.
11. Portrait v1 uses a temporary Working Draft so Cancel/failure cannot corrupt the user's Active Draft.
12. Completion will reuse canonical `prompt.validate` and `prompt.compile`.
13. A generalized Actions batch/transaction/dry-run engine remains deferred until a real Wizard demonstrates that Working Draft orchestration is insufficient.
14. AI planning/AI-generated Wizard flows remain deferred. Initial behavior is deterministic and rule-based.
15. Rich future cases such as Comic/Manga, posters, product layouts, video keyframes and fantasy transformations remain architecture pressure tests, not current implementation scope.

No new invariant from this checkpoint required changing [`README.md`](./README.md).

---

## Portrait Wizard conceptual flow

Current first-pass UX model remains:

1. **Subject**
   - identify the portrait subject;
   - reuse/select appropriate Subject variable/reference behavior as required by the real implementation.

2. **Portrait intent/type**
   - examples: professional, cinematic, fashion, fantasy;
   - influences later defaults/recommendations and conditional flow.

3. **Appearance**
   - simplified guided Expression, Hair and Outfit decisions;
   - do not expose the full Expert UI unless a reusable picker/control genuinely fits.

4. **Composition**
   - framing and camera-oriented choices;
   - may affect whether detailed Pose questions are useful.

5. **Environment**
   - e.g. studio/outdoor/abstract;
   - conditional follow-up questions based on the selected environment.

6. **Lighting & mood**
   - user-facing semantic choices such as soft/dramatic/moody rather than raw Expert UI complexity.

7. **Review**
   - summarize decisions;
   - allow navigation back to edit a section.

8. **Completion**
   - resolve rules;
   - build/execute Action Plan on Working Draft;
   - validate;
   - compile;
   - commit/apply resulting Draft;
   - allow continuation in Expert UI.

The checked-in `portraitWizardV1Definition` is still an implementation-discovery definition, not a frozen public schema.

---

## Implementation component status

### Complete for the current foundation checkpoint

- `WizardDefinition` minimum TypeScript contracts;
- first Portrait v1 semantic Definition;
- `WizardSession` minimum state/runtime;
- default-vs-user answer provenance;
- Working Draft clone/isolation;
- basic ordered navigation;
- minimal `equals` / `notEquals` visibility evaluation;
- canonical single-Action execution bridge;
- focused unit/integration-style tests for the above.

### Not implemented yet

- deterministic rule/derived-intent evaluator beyond explicit default setters;
- `requiredWhen`;
- `in` / `notIn` conditions;
- Portrait Action Planner/Mapper;
- exact Portrait preset/field/action mapping;
- Review renderer/UI;
- completion state machine;
- `prompt.validate` completion gate;
- `prompt.compile` completion output;
- host adapter that replaces Active Draft only after successful completion;
- full Wizard page/renderer.

These omissions are intentional and keep the current foundation smaller than a universal Wizard engine.

---

## Explicitly deferred

Do not implement these unless a real Wizard requirement justifies them:

- universal Wizard DSL;
- arbitrary rule scripting/expression language;
- generalized repeat/nested/collection flow engine;
- Actions batch/transaction/dry-run;
- AI-assisted planning or AI-generated Wizard definitions;
- broad Expert UI migration/rewrite;
- universal capability/catalog adapter;
- Wizard-specific compiler/validator;
- direct arbitrary Draft/path mutation.

---

## Future architectural pressure tests

Keep these cases in mind when evaluating abstractions, without implementing them prematurely:

### Comic / Manga

Potential needs:

- multiple Subject variables/characters;
- multiple Scenes;
- per-panel composition/framing;
- Layout Regions;
- repeatable/nested scene flows;
- character consistency across panels;
- Typography/dialogue.

### Video keyframe

Potential needs:

- camera/composition emphasis;
- pose and environment specificity;
- downstream image-to-video-oriented guidance.

### Poster / Business card

Potential needs:

- Typography-first flows;
- structured Layout;
- visual hierarchy and content placement.

### Product + description

Potential needs:

- product/Subject configuration;
- photography/style/environment;
- Layout + Typography composition.

### Fantasy/world transformation

Potential needs:

- heavy Style/Form/Material/Environment orchestration;
- broad cross-module defaults and overrides.

These examples should challenge assumptions such as "one Subject", "one Scene", "one Region" or "all Wizards are linear".

---

## Immediate next step

Resume from this exact order:

1. run `pnpm test:wizard` against the branch workspace;
2. run `pnpm test:actions-api` and production build after the Wizard tests are green;
3. inspect the exact real Portrait-targeted module presets/fields and specialized Action inputs needed by the semantic answers already defined;
4. add the smallest deterministic rule/derived-intent evaluator required to translate Portrait choices into planner intent while preserving user overrides;
5. implement the first Portrait Action Planner/Mapper strictly as `PublicActionInvocation[]`/canonical Action calls;
6. if Portrait genuinely requires Prompt Settings mutation, add that capability to the canonical Actions API first rather than writing through `PromptDraftState.promptSettings` from Wizard code;
7. only after the mapper is stable, add Review/completion orchestration using `prompt.validate`, `prompt.compile`, and a host-owned successful Active Draft replacement step;
8. then build the first renderer/page integration using existing UI primitives where appropriate.

Do not begin with generalized nested/repeatable flow, AI, batch Actions, or a Wizard-specific mutation layer.

---

## Documentation discipline

- [`README.md`](./README.md) is the architectural source of truth.
- This file is the operational checkpoint for resuming work in a later chat/session.
- Update this file after meaningful implementation/test checkpoints.
- Record what is complete, what is currently active, validation results, known issues and the immediate next step.
- Move a decision into `README.md` only when it becomes an accepted architectural invariant or reusable canonical behavior.
