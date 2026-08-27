# Actions API Status

## Current checkpoint

Phase: **2 — Core operations / read + compile stabilization**

Branch: `refactor/actions-api`

Baseline: `main@3db3294ba738c09a04a8d1f79bdc430f2d7a8e83`

Last source audit: 2026-08-27

Latest validated Actions API checkpoint: **153/153 passed** on 2026-08-27.

Latest separately confirmed production build remains the **119/119 Lighting / Effects** checkpoint. Hair, Outfit, and Prompt Validate have newer green Actions API runs but no newer build result has been recorded yet.

`main` remains untouched.

## Validation history

| Boundary | Result | Status |
|---|---:|---|
| Foundation | 18/18 | validated |
| Simple modules / presets | 27/27 | validated |
| ModuleEntity lifecycle | 35/35 | validated |
| ModuleEntity fields / presets | 41/41 | validated |
| Typography | 49/49 | validated |
| Scene | 57/57 | validated |
| Layout | 65/65 | validated |
| Semantic assignment scopes | 73/73 | validated |
| Color Palette | 81/81 | validated |
| Texture / Material | 89/89 | validated |
| Pose | 97/97 | validated |
| Expression | 105/105 | validated |
| Variables Expert UI migration | 107/107 | validated + build + manual UI |
| Lighting / Effects | 119/119 | validated + build |
| Hair | 131/131 | validated |
| Outfit | 147/147 | validated |
| Prompt Validate | 153/153 | validated |
| Prompt Compile | expected 161 | awaiting real-checkout validation |

Detailed action inventory lives in `docs/actions-api/ACTIONS.md`.

## Completed foundations and write domains

Validated public/domain boundaries:

- canonical `PromptDraftState` + clone/normalize helpers;
- Action registry/discovery/input schema/atomic caller-draft isolation;
- explicit `ActionEnvironment` and deterministic `ActionIdFactory`;
- Variables;
- Modules / presets / Custom Mode;
- generic ModuleEntity lifecycle + simple fields/presets;
- Typography;
- Scene;
- Layout;
- semantic assignment scope foundation;
- Color Palette;
- Texture / Material;
- Pose;
- Expression;
- Lighting / Effects;
- Hair;
- Outfit.

Stable-reference rules remain unchanged: stable IDs are canonical identity, missing refs never fuzzy-retarget, and exact persisted orphans may survive only where the owning domain explicitly permits it.

## Expert UI migration status

### Variables — COMPLETE + VALIDATED

Persisted Create/Update/Duplicate/Delete and Blueprint insertion in `VariablesField.vue` route through `app/domain/variables.ts`.

Accepted validation:

- `pnpm test:actions-api` => **107/107**
- `pnpm build` => successful
- manual UI regression => Create/Edit including Enabled/Duplicate/Delete/Blueprint

The four CRUD actions are `migrated`; `variable.setEnabled` remains `implemented` because the UI uses general update for the Enabled field.

No other broad Expert UI migration is part of the current compiler checkpoint.

## Prompt Validate — IMPLEMENTED + VALIDATED

Files:

- `app/domain/promptRead.ts`
- `app/actions/promptRead.ts`
- `scripts/actions-prompt-read.test.ts`

Contract:

- rebuild active module outputs from canonical Draft state;
- mirror persisted Custom Mode and existing Scene/Form/Camera/Scene-resource compile ownership;
- reuse current `validatePromptSettings` rules;
- add current global `no_modules_selected` and custom-override issues;
- return validation errors/warnings as read data rather than Action execution failure;
- no Vue/composable dependency and no caller-draft mutation.

Real checkout first exposed a test-fixture import of Nuxt-coupled `compilePromptCore.ts`; the fixture was decoupled without changing production behavior. Final validation: **153 tests / 153 passed / 0 failed**.

`prompt.validate` is promoted to `implemented`.

## Current work: Prompt Compile — IMPLEMENTED, AWAITING USER VALIDATION

### Why compiler extraction was required

Before this checkpoint, final compilation was split across:

- `compilePromptCore.ts`, which contained the actual formatting algorithm plus Vue runtime synchronization;
- `compilePrompt.ts`, which added typed user-variable ownership, automatic Scene/Layout rules, system-variable filtering, and Scene presentation aliases.

Importing that path directly into Actions would have coupled headless execution to Vue/Nuxt. Copying the logic would have created a second compiler. The implementation therefore extracts runtime effects while preserving one canonical final compile path.

### New ownership

`app/utils/compilePromptCore.ts`

- existing compiler/formatting algorithm remains in place;
- Vue composable imports and runtime sync calls are removed;
- existing `getSystemPromptVariables` is exported;
- no formatting/optimizer/module-order algorithm is intentionally changed.

`app/utils/compilePromptPure.ts`

- pure final adapter shared by UI and Actions;
- owns automatic Scene/Layout global rule;
- owns typed user Subject/Reference suppression semantics;
- owns pure system-variable filtering;
- owns modular/natural/json Scene presentation aliases;
- returns output + effective settings + final system variables.

`app/utils/compilePrompt.ts`

- now only the Expert UI runtime adapter;
- reads enabled user variable ownership from `usePromptVariables`;
- calls `compilePromptOutputPure`;
- synchronizes subject context and returned system variables back into existing Vue runtime state;
- returns the same pure output.

`app/domain/promptRead.ts`

- `compilePromptDraft` reuses the already validated headless module-output builder;
- derives Subject/Reference ownership from the active canonical Variables module using the same enabled/key/value rules as the current variable composable;
- defaults to persisted `draft.outputFormat`;
- explicit format override is read-only.

`app/actions/promptRead.ts`

- adds public `prompt.compile`;
- optional input: `format: modular | natural | json`;
- validation issues do not block compile, matching current Expert UI behavior.

### Regression coverage

- new `scripts/actions-prompt-compile.test.ts`: **8 tests**;
- covers persisted/default format, explicit JSON override, Subject ownership, Reference ownership, automatic Scene/Layout rule, Scene modular/JSON aliases, read-only Action execution, discovery/schema atomicity;
- existing prompt read discovery test updated for `prompt.validate + prompt.compile`;
- `scripts/phase9-compiler-regression.test.ts` updated so the old byte-identical core guard now proves that current core differs from baseline only by the intentional headless extraction and that Vue synchronization remains isolated in the runtime adapter.

Expected `pnpm test:actions-api`: **161 tests**.

`prompt.compile` remains `planned` in `ACTIONS.md` until real-checkout validation passes.

## Validation required for this checkpoint

Run from the real checkout after `git pull`:

1. `pnpm test:actions-api` — expected **161/161**.
2. `pnpm test:phase9-regression` — compiler extraction/parity guard must pass.
3. `pnpm build` — Nuxt/TypeScript integration must succeed.

If all three are green:

- promote `prompt.compile` to `implemented`;
- record the 161-test/compiler/build checkpoint;
- move to AI-facing public schema/export packaging and final branch readiness audit.

## Remaining branch work after Prompt Compile

1. **AI-facing Actions contract / export**
   - expose stable discovery descriptors/input schemas in a consumer-friendly form;
   - define the transport-neutral invocation/result contract for ChatGPT/Gemini/agent consumers;
   - add integration tests without introducing provider-specific domain logic.
2. **Final readiness audit**
   - full Actions suite;
   - compiler regression suite;
   - production build;
   - compare branch against baseline/main for accidental scope changes;
   - freeze/document public IDs and explicitly deferred work;
   - leave the branch merge-ready without moving `main` automatically.

## Intentionally deferred / non-blocking

- `module.reset` until Clear semantics are canonicalized;
- Batch/transaction API until a real multi-action Wizard flow requires it;
- Dry-run semantics with batch design;
- third-party schema validator until input complexity warrants it;
- Wizard UI;
- additional Expert UI migrations not needed for Actions API branch readiness.

## Regression guardrails

Every remaining change must preserve:

- stable ID identity semantics;
- missing/unavailable reference behavior;
- current draft import/export compatibility;
- current prompt output semantics unless an intentional compiler fix is explicitly documented;
- current Expert UI behavior until deliberately migrated;
- one canonical implementation for every mutation/read/compiler operation.

## Main branch rule

Do not update or move `main` without explicit approval. All current work remains on `refactor/actions-api`.
