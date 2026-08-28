# Wizard Development Status

Last updated: **2026-08-28**

Status: **Architecture baseline documented — implementation not started**

Working branch: `feature/wizard`

Branch baseline: `main@c60490681feb145d90749b1415337850f7c9c88c`

Architecture source of truth: [`README.md`](./README.md)

Actions contract: `prompt-draft.actions.v1`

---

## Current checkpoint

The Actions API refactor is complete and has been fast-forwarded into `main`.

Accepted baseline inherited by the Wizard branch:

- Actions API: **168 / 168**;
- Reference Catalog: **15 / 15**;
- Phase 8 UX: **5 / 5**;
- Phase 9 compiler regression: **9 / 9**;
- production build: **successful**;
- public Actions surface: **99 stable Actions**;
- headless `prompt.validate` and `prompt.compile`: available;
- stable-reference semantics and atomic single-Action failure: established.

`feature/wizard` was created from the final `main` Actions API baseline. No Wizard production code has been implemented yet.

---

## Accepted architecture decisions

The following decisions are currently accepted and should be treated as the starting point for implementation:

1. The Wizard is a guided, goal-oriented interaction layer over the existing canonical Draft/domain/Actions system.
2. The Wizard must produce a normal editable `PromptDraftState`, not only a prompt string.
3. Wizard mutations must use canonical Actions/domain semantics; no parallel mutation implementation is allowed.
4. Expert UI and Wizard UI are separate presentation layers. The Wizard does not need to embed full Expert UI panels.
5. Existing reusable UI primitives/pickers may be reused where they genuinely fit Wizard UX.
6. The first concrete testcase is a **Portrait Wizard**.
7. Architecture is developed incrementally from real Wizard examples rather than from a speculative universal DSL.
8. Wizard state should separate direct `answers`, deterministic `derived` intent, and the resulting `workingDraft`.
9. Defaults/recommendations must not silently overwrite explicit user choices.
10. Flow must support basic conditional Steps/Questions for Portrait v1 while leaving an extension path for later branching/nested/repeatable flows.
11. Portrait v1 should use a temporary Working Draft so Cancel/failure cannot corrupt the user's Active Draft.
12. Completion should reuse canonical `prompt.validate` and `prompt.compile`.
13. A generalized Actions batch/transaction/dry-run engine is deferred until a real Wizard demonstrates that Working Draft orchestration is insufficient.
14. AI planning/AI-generated Wizard flows are deferred. Initial behavior is deterministic and rule-based.
15. Rich future cases such as Comic/Manga, posters, product layouts, video keyframes and fantasy transformations are architecture pressure tests, not current implementation scope.

---

## Portrait Wizard conceptual flow

Current first-pass UX model:

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

This flow is not frozen. It is the first testcase used to discover the minimum real engine requirements.

---

## Initial implementation components

The next implementation phase should create only the minimum pieces required by Portrait v1:

- `WizardDefinition` types;
- `WizardSession` state/runtime;
- basic Step/Question renderer;
- minimal condition evaluator;
- deterministic rules/derived-intent evaluation;
- provenance handling for default vs user-selected answers;
- Portrait Action Planner/Mapper;
- Working Draft lifecycle;
- Review/completion flow;
- canonical validate/compile integration;
- focused automated tests.

Exact file layout and TypeScript contracts have **not** yet been frozen. They should be chosen after inspecting the current application/component structure immediately before implementation.

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

Before writing production code:

1. inspect the current `feature/wizard` application/component structure relevant to the Create page, Draft session helpers and reusable UI primitives;
2. verify the real module field/preset/entity schemas required by the Portrait flow;
3. define the **minimum** Portrait v1 `WizardDefinition` and `WizardSession` TypeScript contracts;
4. define the first deterministic rule/condition subset based only on those Portrait requirements;
5. define the initial Portrait Action mappings using real stable Action inputs/IDs from the repository;
6. add isolated tests before building the full page experience.

Do not begin with a generalized nested/repeatable engine.

---

## Documentation discipline

- [`README.md`](./README.md) is the architectural source of truth.
- This file is the operational checkpoint for resuming work in a later chat/session.
- Update this file after meaningful implementation/test checkpoints.
- Record what is complete, what is currently active, validation results, known issues and the immediate next step.
- Move a decision into `README.md` only when it becomes an accepted architectural invariant or reusable canonical behavior.
