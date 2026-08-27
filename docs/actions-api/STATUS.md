# Actions API Status

## Current checkpoint

Phase: **MERGE-READY**

Branch: `refactor/actions-api`

Baseline: `main@3db3294ba738c09a04a8d1f79bdc430f2d7a8e83`

Last source audit: 2026-08-27

Latest validated Actions API checkpoint: **168/168 passed** on 2026-08-27.

Final reference-catalog regression: **15/15 passed**.

Final Phase 8 UX regression: **5/5 passed**.

Final Phase 9 compiler regression: **9/9 passed**.

Final production build: **successful**.

`main` remained untouched throughout validation and still points to the recorded baseline until an explicit merge/update is performed.

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
| Prompt Compile | 161/161 | validated + phase9 9/9 + build |
| Public Contract / Export | 167/167 | validated + build |
| Exact public-ID freeze / final Actions gate | 168/168 | validated |
| Reference catalog final regression | 15/15 | validated |
| Phase 8 UX final regression | 5/5 | validated |
| Phase 9 compiler final regression | 9/9 | validated |
| Final production build | successful | validated |

Detailed Action inventory lives in `docs/actions-api/ACTIONS.md`.
Public transport contract lives in `docs/actions-api/PUBLIC-CONTRACT.md`.
Final branch audit lives in `docs/actions-api/FINAL-AUDIT.md`.

## Completed boundaries

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
- Outfit;
- Prompt Validate;
- Prompt Compile;
- provider-neutral public registry/manifest/invocation bridge;
- exact `prompt-draft.actions.v1` public-ID compatibility freeze.

Stable-reference rules remain unchanged: stable IDs are canonical identity, missing refs never fuzzy-retarget, and exact persisted orphans may survive only where the owning domain explicitly permits it.

## Expert UI migration status

### Variables — COMPLETE + VALIDATED

Persisted Create/Update/Duplicate/Delete and Blueprint insertion in `VariablesField.vue` route through `app/domain/variables.ts`.

Accepted validation:

- `pnpm test:actions-api` => **107/107**;
- `pnpm build` => successful;
- manual UI regression => Create/Edit including Enabled/Duplicate/Delete/Blueprint.

The four CRUD actions are `migrated`; `variable.setEnabled` remains `implemented` because the UI uses general update for the Enabled field.

No other broad Expert UI migration is required for this branch.

## Prompt Validate — IMPLEMENTED + VALIDATED

`prompt.validate` rebuilds active module outputs from canonical Draft state and returns existing validation semantics as read data without Vue/composable dependency or caller-draft mutation.

Final validation: **153/153**.

## Prompt Compile — IMPLEMENTED + VALIDATED

The existing compiler was made headless without duplication:

- `compilePromptCore.ts` owns the existing formatting/compiler algorithm and no longer performs Vue synchronization;
- `compilePromptPure.ts` owns pure Scene/Layout rule injection, typed user-variable ownership, system-variable filtering, and Scene presentation aliases;
- `compilePrompt.ts` remains the Expert UI runtime adapter;
- `prompt.compile` uses the same pure final path from canonical Draft state.

Accepted validation:

- `pnpm test:actions-api` => **161/161**;
- `pnpm test:phase9-regression` => **9/9**;
- `pnpm build` => successful.

## Public Contract / Export — IMPLEMENTED + VALIDATED

Contract: `prompt-draft.actions.v1`.

`app/actions/public.ts` provides:

- canonical assembly of all **99 public Actions**;
- JSON-safe discovery manifest;
- JSON-Schema-compatible mapping of the repository-owned input schema subset;
- explicit `effect: read | mutation` metadata;
- model-owned invocation envelope `{ actionId, input }`;
- strict separation of trusted host-owned `ActionContext` (`draft`, modules, environment, ID factory);
- structured invocation/runtime failures through the existing atomic Action result contract.

Accepted validation:

- public-contract checkpoint: **167/167 + successful build**;
- exact public-ID compatibility set: **168/168 final Actions gate**.

Provider-specific OpenAI/Gemini/MCP/REST adapters remain intentionally outside this branch.

## Branch-to-main audit

At the final audit checkpoint the branch was **191 commits ahead / 0 behind** `main` and shared the exact recorded merge base.

Existing production files modified relative to `main` are intentionally narrow:

- `app/pages/create.vue` — canonical Draft contract/helper extraction; browser persistence/import/export stays page-owned;
- `app/components/modules/variables/VariablesField.vue` — accepted Variables Expert UI migration;
- `app/utils/compilePrompt.ts` / `compilePromptCore.ts` — intentional pure compiler extraction validated by phase9;
- `package.json` — test command coverage only.

All other Actions/domain/compiler additions are new files introduced by this refactor. See `FINAL-AUDIT.md` for the detailed scope review.

## Final validation gate — ACCEPTED

The complete merge-readiness gate passed in the real checkout on 2026-08-27:

1. `pnpm test:actions-api` => **168/168**;
2. `pnpm test:reference-catalog` => **15/15**;
3. `pnpm test:phase8-ux` => **5/5**;
4. `pnpm test:phase9-regression` => **9/9**;
5. `pnpm build` => **successful**.

No known Actions API blocker remains. `refactor/actions-api` is **merge-ready**.

## Intentionally deferred / non-blocking

- `module.reset` until Clear semantics are canonicalized;
- Batch/transaction API until a real orchestration consumer requires it;
- Dry-run semantics with batch design;
- Wizard UI;
- provider-specific OpenAI/Gemini/MCP adapters;
- additional Expert UI migrations;
- third-party schema validator while the repository-owned subset remains sufficient.

## Regression guardrails

Final state preserves:

- stable ID identity semantics;
- missing/unavailable reference behavior;
- current draft import/export compatibility;
- current prompt output semantics;
- current Expert UI behavior outside the accepted Variables migration;
- one canonical implementation for every mutation/read/compiler operation;
- exact `prompt-draft.actions.v1` public Action-ID compatibility set.

## Main branch rule

The branch is merge-ready, but this status update itself does not move `main`. Merge/update of `main` remains an explicit operation.