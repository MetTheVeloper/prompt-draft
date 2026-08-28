# Wizard Development Status

Last updated: **2026-08-28**

Status: **Portrait mapper accepted; Review + Completion implemented; validation pending**

Working branch: `feature/wizard`

Branch baseline: `main@c60490681feb145d90749b1415337850f7c9c88c`

Architecture source of truth: [`README.md`](./README.md)

Actions contract: `prompt-draft.actions.v1`

---

## Current checkpoint

The first Portrait Action Mapper is now **accepted** after real checkout validation:

```text
pnpm test:wizard
17/17 passed
```

Review and Completion orchestration are now implemented on top of that accepted mapper. This new checkpoint is implementation-complete but runtime-validation-pending.

### Accepted mapper

Implementation commit:

- `4818fdf1e12f1338678589af3bf69894a3cf2dab` — `feat(wizard): add portrait action mapper`

Accepted behaviors include:

- stable Subject normalization;
- deterministic Portrait defaults/derived intent;
- user overrides preserved over changing defaults;
- canonical Expression/Hair/Outfit/Framing/Pose/Background/Lighting Actions;
- canonical Setup mutation;
- no direct Draft/path mutation;
- rollback to pre-mapping Working Draft when a later mapping Action fails.

Accepted Wizard gate after mapper: **17/17**.

---

## Review model implemented

New file:

- `app/wizard/portraitReview.ts`

`buildPortraitWizardReview(...)` produces a renderer-neutral semantic review model containing:

- step identity;
- user-facing label;
- user-facing resolved value;
- answer source (`default | user`, or derived fallback);
- answer identity for later edit/navigation wiring.

The Review intentionally does **not** expose:

- Action IDs;
- module keys;
- field IDs;
- preset IDs;
- other implementation vocabulary.

Rules are resolved before Review, so recommendations/defaults shown to the user match the state that mapping will consume. Explicit user overrides remain visible and sticky.

This is the semantic Review model only; no renderer/page UI has been added yet.

---

## Completion orchestration implemented

New files:

- `app/wizard/completion.ts`
- `app/wizard/portraitCompletion.ts`

Generic completion now runs canonical read Actions in this exact order:

```text
Wizard Working Draft
  ↓
prompt.validate
  ↓ only if valid
prompt.compile
  ↓
clone final Draft + compiled output
```

### Completion invariants

- validation/compile use only the public Actions API;
- validation errors stop completion before compile;
- read-action failures are surfaced separately from validation failures;
- completion does not mutate the Wizard Session while reading;
- successful `finalDraft` is cloned from the completed Working Draft;
- no Active Draft reference is accepted or replaced by the completion layer;
- persisted `outputFormat` is unchanged when compile uses a one-off format override;
- host/Create-page application of `finalDraft` remains a separate success-only responsibility.

### Portrait pipeline

`completePortraitWizard(...)` now provides the first full deterministic backend flow:

```text
Answers
  ↓
Portrait rules / derived intent
  ↓
Portrait Action Mapper
  ↓
Working Draft
  ↓
prompt.validate
  ↓
prompt.compile
  ↓
completed finalDraft + output
```

A mapping failure never enters validation/compile.

---

## New tests

`wizard-completion.test.ts` adds **6** tests covering:

1. semantic Review values and deterministic defaults;
2. explicit user override preservation in Review;
3. validation failure stopping before compile;
4. end-to-end Portrait map → validate → compile while Active Draft remains unchanged;
5. compile format override remaining read-only;
6. mapping failure preventing completion reads.

If all previously accepted Wizard tests remain green, `pnpm test:wizard` is expected to move from **17** to **23 tests**.

This **23-test gate is pending real checkout validation** and must not be marked accepted until it runs successfully.

---

## Accepted foundation remains unchanged

- Actions API Phase 10: **176/176** accepted;
- public Actions surface: **101** under `prompt-draft.actions.v1`;
- Wizard before mapper: **9/9** accepted;
- Wizard with mapper: **17/17** accepted;
- Reference Catalog: **15/15** accepted baseline;
- Phase 8 UX: **5/5** accepted baseline;
- Phase 9 compiler: **9/9** accepted baseline;
- production build successful at the previous accepted full gate.

---

## Still not implemented

- Review renderer/UI;
- host adapter/Create-page success-only application of `finalDraft`;
- full Wizard page/renderer;
- in-progress Wizard persistence;
- `requiredWhen`;
- `in` / `notIn` conditions unless a real flow proves they are needed.

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

1. Pull the latest `feature/wizard` checkout.
2. Run `pnpm test:wizard`.
3. Expected result if this checkpoint is clean: **23/23**.
4. If green, mark Review + Completion accepted.
5. Then implement the first Wizard presentation/host boundary:
   - render the existing definition/questions;
   - render the structured Portrait Review model;
   - invoke `completePortraitWizard(...)` on Finish;
   - apply returned `finalDraft` to Active Draft only after successful completion;
   - keep persistence ownership in the existing Create-page host.
6. After that UI/host checkpoint is stable, run the full regression/build gate again.

---

## Documentation discipline

- [`README.md`](./README.md) remains the Wizard architectural source of truth.
- This file is the operational checkpoint for resuming work.
- `docs/actions-api/STATUS.md` remains the operational source for the accepted Actions surface.
- Update status documents after meaningful implementation/test checkpoints.
