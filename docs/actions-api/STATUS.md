# Actions API Status

## Current checkpoint

Phase: **Final Readiness Audit**

Branch: `refactor/actions-api`

Baseline: `main@3db3294ba738c09a04a8d1f79bdc430f2d7a8e83`

Last source audit: 2026-08-27

Latest validated Actions API checkpoint: **167/167 passed** on 2026-08-27.

Latest confirmed production build: **Public Contract checkpoint — successful**.

Latest compiler regression: **phase9 9/9** at the Prompt Compile checkpoint; no compiler production file changed after that checkpoint.

`main` remains untouched and still points to the recorded baseline.

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
| Exact public-ID freeze | expected 168 | final validation pending |

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
- provider-neutral public registry/manifest/invocation bridge.

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

- `pnpm test:actions-api` => **167/167**;
- `pnpm build` => successful.

Provider-specific OpenAI/Gemini/MCP/REST adapters remain intentionally outside this branch.

## Current work: exact public-ID freeze + final readiness

The public-contract checkpoint proved count, uniqueness, discovery, schema export, and invocation behavior. The final audit identified one additional compatibility guard worth adding before merge readiness: pin the exact v1 set of all 99 public Action IDs.

Added:

- `scripts/actions-public-ids.test.ts` — exact v1 compatibility set;
- package test registration.

This adds one test only; no production behavior changes.

Expected final Actions API total: **168**.

## Branch-to-main audit

At the final audit checkpoint the branch was **191 commits ahead / 0 behind** `main` and shared the exact recorded merge base.

Existing production files modified relative to `main` are intentionally narrow:

- `app/pages/create.vue` — canonical Draft contract/helper extraction; browser persistence/import/export stays page-owned;
- `app/components/modules/variables/VariablesField.vue` — accepted Variables Expert UI migration;
- `app/utils/compilePrompt.ts` / `compilePromptCore.ts` — intentional pure compiler extraction validated by phase9;
- `package.json` — test command coverage only.

All other Actions/domain/compiler additions are new files introduced by this refactor. See `FINAL-AUDIT.md` for the detailed scope review.

## Final validation gate

After pulling the final audit commits, run:

1. `pnpm test:actions-api` — expected **168/168**;
2. `pnpm test:reference-catalog` — must pass;
3. `pnpm test:phase8-ux` — must pass;
4. `pnpm test:phase9-regression` — expected **9/9**;
5. `pnpm build` — must succeed.

If all five are green, the branch has no known Actions API blocker and can be declared merge-ready.

## Intentionally deferred / non-blocking

- `module.reset` until Clear semantics are canonicalized;
- Batch/transaction API until a real orchestration consumer requires it;
- Dry-run semantics with batch design;
- Wizard UI;
- provider-specific OpenAI/Gemini/MCP adapters;
- additional Expert UI migrations;
- third-party schema validator while the repository-owned subset remains sufficient.

## Regression guardrails

Final state must preserve:

- stable ID identity semantics;
- missing/unavailable reference behavior;
- current draft import/export compatibility;
- current prompt output semantics;
- current Expert UI behavior outside the accepted Variables migration;
- one canonical implementation for every mutation/read/compiler operation;
- exact `prompt-draft.actions.v1` public Action-ID compatibility set.

## Main branch rule

Do not update or move `main` without explicit approval. All current work remains on `refactor/actions-api`.
