# Actions API Status

## Current checkpoint

Phase: **1 — Canonical draft boundary and action primitives**

Branch: `refactor/actions-api`

Baseline: `main@3db3294ba738c09a04a8d1f79bdc430f2d7a8e83`

Last source audit: 2026-08-27

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

- [ ] Introduce reusable `PromptDraftState` and `ModulePanelState` contracts outside `create.vue`.
- [ ] Add canonical default/clone/normalize/apply helpers.
- [ ] Keep persistence timestamps/collection metadata outside the pure state contract.
- [ ] Reuse the extracted contract from `create.vue` without changing runtime behavior.

### 1B. Action runtime primitives

- [ ] Define `ActionIssue`.
- [ ] Define `ActionExecutionResult`.
- [ ] Define `ActionContext`.
- [ ] Define typed `ActionDefinition`.
- [ ] Implement registry `register/get/has/list/execute`.
- [ ] Reject duplicate action IDs.
- [ ] Return structured failure for unknown actions.
- [ ] Guarantee failed action execution returns the original draft state.

### 1C. Tests

- [ ] Draft clone/normalization tests.
- [ ] Registry discovery tests.
- [ ] Duplicate registration test.
- [ ] Successful execution test.
- [ ] Expected domain rejection test.
- [ ] Unknown action test.
- [ ] Verify no Vue/component dependency is required by the runtime tests.

## Phase 1 exit gate

Phase 1 is complete only when:

- [ ] `create.vue` no longer owns duplicate definitions of the canonical draft-state contract;
- [ ] the Actions runtime is headless and tested;
- [ ] no existing draft persistence behavior changes;
- [ ] no compiler output behavior changes;
- [ ] no new persisted schema version is introduced;
- [ ] the next low-risk domain extraction (Variables) can be implemented without changing the runtime architecture.

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
