# Wizard Development Status

Last updated: **2026-08-28**

Status: **Wizard foundation complete; Actions API Phase 10 Setup/Output extension implemented — validation pending**

Working branch: `feature/wizard`

Branch baseline: `main@c60490681feb145d90749b1415337850f7c9c88c`

Architecture source of truth: [`README.md`](./README.md)

Actions contract: `prompt-draft.actions.v1`

---

## Current checkpoint

Wizard implementation remains intentionally paused before the Portrait Action Planner while the canonical Actions API closes the persisted Setup/Output mutation gap discovered during source inspection.

### Wizard foundation already complete

Foundation implementation commit:

- `51699c6dd61688f17fdde15210eb4e21a6df211f` — `feat(wizard): add definition and session foundation`

Implemented foundation:

- minimal `WizardDefinition` contracts;
- first semantic Portrait v1 definition;
- `WizardSession` with separate `answers`, `derived`, and `workingDraft`;
- explicit answer provenance `default | user`;
- defaults cannot overwrite explicit user answers;
- Working Draft cloned from Active Draft;
- ordered navigation;
- minimal `equals` / `notEquals` visibility conditions;
- canonical single-Action execution through `invokePublicAction(...)`;
- failed Actions preserve the current Wizard session/Working Draft;
- no Active Draft persistence mutation inside `WizardSession`.

No Expert UI/Create-page rewrite was performed.

### Actions API gap discovered by Wizard inspection

`PromptDraftState` persists:

- module state;
- `promptSettings`;
- `outputFormat`.

The accepted 99-Action baseline already exposed canonical module/variable/entity/specialized mutations and `prompt.validate` / `prompt.compile`, but did not expose persisted mutation for `promptSettings` or `outputFormat`.

The earlier constraint was therefore:

> Wizard must never patch `PromptDraftState.promptSettings` or `outputFormat` directly; if Portrait needs those capabilities, they must be added to the canonical Actions API first.

That implementation gap is now closed in code.

---

## Actions API Phase 10 checkpoint

Implementation commit:

- `1e3bd96a9119210805eebc3db7ae00008502a110` — `feat(actions): add prompt settings and output mutations`

New canonical public Actions:

### `prompt.settings.update`

Typed closed aggregate mutation for the persisted Setup Prompt Settings:

- `mode`;
- `idea`;
- `subject`;
- `subjectType`;
- canonical `aspectRatio`;
- `globalRules`;
- partial nested `imageToImage` reference/transformation/preserve settings.

It is explicitly **not** an arbitrary path/object patch. Unknown properties and invalid enums are rejected; the domain implementation assigns only known fields.

The Setup module selector remains covered by existing `module.activate` / `module.deactivate`, so no duplicate Setup-specific module mutation was introduced.

### `prompt.outputFormat.set`

Persists `PromptDraftState.outputFormat` as `modular | natural | json`.

Existing `prompt.compile` already consumes the persisted format when its optional read-only override is absent.

### Public surface

- previous accepted surface: **99 Actions**;
- current additive surface: **101 Actions**;
- contract remains `prompt-draft.actions.v1`;
- exact v1 fixture now deliberately pins the 101 reviewed IDs.

This is an additive compatibility extension; no existing Action ID/meaning changed.

---

## Validation status

### Previously accepted baseline

Before Phase 10:

- Actions API: **168/168**;
- Reference Catalog: **15/15**;
- Phase 8 UX: **5/5**;
- Phase 9 compiler: **9/9**;
- production build: **successful**;
- public Actions: **99**.

### Wizard foundation tests

Existing focused suites:

- `scripts/wizard-definition.test.ts` — 3 cases;
- `scripts/wizard-session.test.ts` — 6 cases;
- command: `pnpm test:wizard`.

### Phase 10 tests

New `scripts/actions-prompt-settings.test.ts` adds **8 cases** covering:

- full Setup aggregate mutation + caller isolation;
- nested partial merge;
- intentional empty-string reset semantics;
- empty patch failure;
- invalid enum/unknown property failure;
- persisted Output mutation;
- invalid Output failure;
- downstream `prompt.validate` / `prompt.compile` consumption.

Public manifest and exact-ID fixtures were also updated from 99 to 101 Actions.

Expected full Actions test count: **176**.

### Validation performed in current tool environment

Passed:

- TypeScript parser/transpile syntax checks for Phase 10 TypeScript files;
- package JSON parse;
- Git diff/commit inspection.

Still pending in the real checkout:

- `pnpm test:actions-api`;
- `pnpm test:wizard`;
- reference/UX/compiler regression suites;
- production build.

Do not treat the new Setup/Output Actions as fully accepted until that gate passes.

---

## Accepted architecture decisions

These remain unchanged:

1. Wizard is a guided goal-oriented layer over canonical Draft/domain/Actions.
2. Wizard produces a normal editable `PromptDraftState`, not only a prompt string.
3. Wizard mutations use canonical public Actions; no parallel mutation implementation.
4. Expert UI and Wizard are separate presentation layers.
5. Reuse existing UI primitives/pickers only where they genuinely fit guided UX.
6. First concrete Wizard is Portrait.
7. Build abstractions from real Wizard requirements, not a speculative universal DSL.
8. Session state separates direct `answers`, deterministic `derived`, and `workingDraft`.
9. Defaults/recommendations never silently overwrite explicit user choices.
10. Portrait v1 uses only the minimum conditional flow required now.
11. Working Draft isolates cancel/failure from Active Draft.
12. Completion reuses `prompt.validate` and `prompt.compile`.
13. Active Draft replacement happens only after successful completion and stays host-owned.
14. Batch/transaction/dry-run remains deferred until a real orchestration need proves it necessary.
15. AI planning/generated Wizard flows remain deferred.
16. Wizard never directly mutates arbitrary Draft paths, including Setup/Output state.

The Phase 10 work confirms the existing canonical-mutation invariant rather than changing the Wizard architecture, so [`README.md`](./README.md) does not require an architectural rewrite.

---

## Portrait Wizard conceptual flow

Current first-pass flow remains:

1. Subject
2. Portrait intent/type
3. Appearance — Expression, Hair, Outfit
4. Composition — framing/camera, Pose where useful
5. Environment — conditional studio/outdoor/abstract follow-up
6. Lighting & mood
7. Review
8. Completion — derive → plan Actions → execute on Working Draft → validate → compile → host applies final Draft

The checked-in `portraitWizardV1Definition` remains an implementation-discovery definition, not a frozen public schema.

---

## Implementation component status

### Complete

- minimum `WizardDefinition` contracts;
- first Portrait semantic definition;
- minimum `WizardSession` runtime;
- provenance;
- Working Draft isolation;
- ordered navigation;
- `equals` / `notEquals` visibility;
- canonical single-Action bridge;
- Setup mutation capability in canonical Actions API;
- Output mutation capability in canonical Actions API;
- focused tests for all above code paths.

### Not implemented yet

- deterministic rule/derived-intent evaluator beyond explicit default setters;
- `requiredWhen`;
- `in` / `notIn` conditions unless Portrait actually needs them;
- exact Portrait module/preset/field mapping;
- Portrait Action Planner/Mapper;
- Review renderer/UI;
- completion state machine;
- completion `prompt.validate` gate;
- completion `prompt.compile` output;
- host adapter that replaces Active Draft after successful completion;
- full Wizard page/renderer.

---

## Explicitly deferred

Do not implement without a real requirement:

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

## Immediate next step

Resume in this exact order:

1. pull the latest `feature/wizard`;
2. run `pnpm test:actions-api` — expected **176/176** if Phase 10 is clean;
3. run `pnpm test:wizard`;
4. run `pnpm test:reference-catalog`;
5. run `pnpm test:phase8-ux`;
6. run `pnpm test:phase9-regression`;
7. run `pnpm build`;
8. record/fix any failures before advancing the Wizard;
9. once green, inspect the exact Portrait-targeted module fields/presets/specialized Action inputs;
10. implement the smallest deterministic derived-rule layer required by those real mappings;
11. implement the first Portrait Action Planner/Mapper strictly as public Action invocations;
12. only then add Review/completion orchestration and the host-owned Active Draft replacement step.

Do not start nested/repeatable flow, AI, batch Actions, or a Wizard-specific mutation layer.

---

## Documentation discipline

- [`README.md`](./README.md) is the Wizard architectural source of truth.
- This file is the operational checkpoint for resuming work.
- `docs/actions-api/STATUS.md` is the operational source for the Phase 10 Actions acceptance gate.
- Update status documents after meaningful implementation/test checkpoints.
