# Actions API Status

## Current checkpoint

Phase: **1 — Canonical draft boundary and action primitives**

Branch: `refactor/actions-api`

Baseline: `main@3db3294ba738c09a04a8d1f79bdc430f2d7a8e83`

Last source audit: 2026-08-27

Current implementation checkpoint: action runtime foundation implemented; create-page adoption still pending.

## Completed

### Phase 0 — audit and scope

- [x] Audited current draft/session ownership.
- [x] Audited module registry and field schema.
- [x] Audited Variables mutation ownership.
- [x] Audited generic named module entity contracts.
- [x] Audited Scene stable references and component mutation flow.
- [x] Audited Layout region/Scene binding flow.
- [x] Audited semantic target/reference catalog architecture.
- [x] Audited assignment-driven modules.
- [x] Audited Lighting and Effects structured editors.
- [x] Audited Typography factories/normalizers.
- [x] Audited Hair and Outfit specialized mutation invariants.
- [x] Audited top-level compilation coupling.
- [x] Created `refactor/actions-api` from the accepted main baseline.
- [x] Created durable source-of-truth docs under `/docs/actions-api`.

## Current work — Phase 1

### 1A. Draft contracts

- [x] Introduce reusable `PromptDraftState` and `ModulePanelState` contracts outside `create.vue`.
- [x] Separate canonical draft state from timestamp/record/collection persistence metadata.
- [x] Add headless default/clone/normalize helpers.
- [ ] Reuse the extracted contracts/helpers from `create.vue` without changing runtime behavior.
- [ ] Remove the duplicate local draft-state type definitions from `create.vue` after adoption.

Implemented files:

- `app/modules/promptDraft.types.ts`
- `app/utils/promptDraftState.ts`

### 1B. Action runtime primitives

- [x] Define `ActionIssue`.
- [x] Define `ActionExecutionResult`.
- [x] Define `ActionContext`.
- [x] Define typed `ActionDefinition`.
- [x] Define repository-owned input schema metadata.
- [x] Implement headless input validation.
- [x] Implement registry `register/get/has/list/execute`.
- [x] Reject duplicate/empty action IDs.
- [x] Return structured failure for unknown actions.
- [x] Guarantee failed action execution returns the original draft state.
- [x] Isolate `canExecute` and `execute` from the caller draft through cloned contexts.
- [x] Convert unexpected execution exceptions to structured runtime issues.
- [x] Add a single public export surface at `app/actions/index.ts`.

Implemented files:

- `app/actions/types.ts`
- `app/actions/inputSchema.ts`
- `app/actions/registry.ts`
- `app/actions/index.ts`

### 1C. Tests

- [x] Add draft clone/normalization tests.
- [x] Add registry discovery tests.
- [x] Add duplicate registration test.
- [x] Add successful execution/immutability test.
- [x] Add schema validation/no-execution test.
- [x] Add expected `canExecute` rejection/atomicity test.
- [x] Add failed action rollback-to-original test.
- [x] Add unknown action test.
- [x] Add thrown action structured-failure test.
- [x] Add `pnpm test:actions-api` script.
- [x] Confirm the runtime foundation itself has no Vue/component runtime dependency.
- [x] Run a local Node 22 headless smoke harness for normalize/clone and atomic registry success/failure (3/3 passed).
- [ ] Run the repository's exact `pnpm test:actions-api` suite in the project checkout/runtime.

Test file:

- `scripts/actions-api.test.ts`

## Phase 1 exit gate

Phase 1 is complete only when:

- [ ] `create.vue` no longer owns duplicate definitions of the canonical draft-state contract;
- [x] the Actions runtime is headless;
- [ ] the exact repository Actions API test suite passes in the project runtime;
- [x] current branch changes do not modify prompt compiler code;
- [x] no new persisted schema version is introduced;
- [ ] create-page persistence/import/export behavior is confirmed unchanged after adoption;
- [x] the next low-risk domain extraction (Variables) can use the runtime without changing its architecture.

## Current branch delta

At the foundation checkpoint the branch is additive relative to its main baseline:

- Actions runtime files added;
- canonical draft-state contracts/helpers added;
- isolated tests added;
- `/docs/actions-api` source-of-truth set added;
- one package test script added;
- no compiler file changed;
- no existing domain schema changed;
- `main` not modified by this work.

## Next work in Phase 1

1. Adopt the shared draft contracts/helpers in `create.vue` with behavior-preserving changes only.
2. Run `pnpm test:actions-api` in the project runtime.
3. Re-check draft import/export/autosave behavior.
4. Close Phase 1 and open Phase 2 with Variables as the first canonical write service.

## Next planned phase

Phase 2 begins with **Variables**, followed by simple module fields/presets, generic `ModuleEntity` lifecycle, then Typography.

Reason: these domains offer high leverage with comparatively low cross-domain reference risk.

## Known deferred decisions

- Batch/transaction API shape — defer until real multi-step Wizard flows are specified.
- Dry-run semantics — defer with batch design.
- Third-party schema validator — do not adopt until Action input complexity justifies dependency cost.
- AI-facing tool schema/export format — design after the internal registry contract stabilizes.
- Wizard UI — explicitly out of scope until core actions and at least Scene/Layout paths are stable.

## Regression guardrails

Every implementation phase must preserve:

- stable identity semantics;
- missing/unavailable reference behavior;
- current draft import/export compatibility;
- prompt compiler behavior unless an intentional fix is documented;
- current Expert UI behavior until that UI path is deliberately migrated.

## Main branch rule

Do not update or move `main` as part of Actions API development without explicit approval. Development checkpoints remain on `refactor/actions-api` until a merge/readiness decision is made.
