# Actions API Status

## Current checkpoint

Phase: **2 — Core write services**

Branch: `refactor/actions-api`

Baseline: `main@3db3294ba738c09a04a8d1f79bdc430f2d7a8e83`

Current source checkpoint: `d5104fbb6ae97cea779d47c314a02da8a90b2900`

Last source audit: 2026-08-27

## Completed

### Phase 0 — audit and scope

- [x] Audited draft/session ownership and persistence boundary.
- [x] Audited module registry/field schema and current mutation ownership.
- [x] Audited Variables, ModuleEntity, Scene, Layout, semantic target and assignment domains.
- [x] Audited Lighting, Effects, Typography, Hair and Outfit specialized semantics.
- [x] Audited top-level compile coupling.
- [x] Created `refactor/actions-api` from the accepted main baseline.
- [x] Created durable source-of-truth docs under `/docs/actions-api`.

### Phase 1 — canonical draft boundary and action primitives — COMPLETE

Draft boundary:

- [x] Extracted `PromptDraftState`, `ModulePanelState`, snapshot/record/collection contracts.
- [x] Separated canonical draft state from persistence/session metadata.
- [x] Added headless create/clone/normalize helpers.
- [x] Migrated `app/pages/create.vue` to the shared draft contracts/helpers.
- [x] Removed duplicate local draft-state contracts from `create.vue`.
- [x] Kept persisted schema version at `1`.
- [x] No prompt compiler file changed as part of Phase 1.

Action runtime:

- [x] Added typed `ActionDefinition`, `ActionContext`, result/issues and discovery contracts.
- [x] Added repository-owned input schema validation.
- [x] Added headless registry `register/get/has/list/execute`.
- [x] Added duplicate/unknown/exception handling.
- [x] Enforced atomic failure: failed actions return the original caller draft.
- [x] Isolated execution from caller mutation through cloned contexts.
- [x] Added deterministic ID factory injection.
- [x] Added explicit `ActionEnvironment` for runtime facts instead of Vue/global reads.

Validation:

- [x] User ran `pnpm test:actions-api` in the real project checkout on 2026-08-27.
- [x] Result: **18 tests / 18 passed / 0 failed**.
- [x] Foundation and Variables suites passed together.

Phase 1 exit gate: **accepted**.

## Current work — Phase 2

### 2A. Variables — IMPLEMENTED + VALIDATED

Canonical service:

- `app/domain/variables.ts`

Actions:

- [x] `variable.create`
- [x] `variable.update`
- [x] `variable.duplicate`
- [x] `variable.delete`
- [x] `variable.setEnabled`

Invariants covered:

- stable IDs on update;
- new IDs on create/duplicate;
- canonical user-key normalization and uniqueness;
- active system/module variable collisions reject explicitly;
- reserved keys reject;
- exact stable-ID delete/enable mutations;
- `variable.create` activates Variables when required;
- failures remain atomic.

Status: `implemented`, not yet `migrated`. The current Expert UI still owns its existing mutation calls and will be migrated only after the service/action contract is stable.

### 2B. Simple modules and presets — SOURCE IMPLEMENTED / VALIDATION PENDING

Current service:

- `app/domain/modules.ts`

Current actions:

- [x] `module.activate`
- [x] `module.deactivate`
- [x] `module.field.set`
- [x] `module.preset.apply`
- [x] `module.customMode.set`

Tests added:

- `scripts/actions-modules.test.ts`

`pnpm test:actions-api` now runs foundation + Variables + Modules suites.

Important semantics fixed by audit:

- `module.activate` preserves existing inactive state and initializes defaults only when state is missing.
- `module.deactivate` is non-destructive: it removes only the active module key and preserves values/panel state, matching module-selector behavior.
- `module.field.set` supports only simple schema-backed field types; structured fields reject with `module_field_structured` and require specialized actions.
- freeform and `customInput` remain distinct persistence contracts.
- preset application overlays only preset-owned values and leaves unrelated module state intact.
- preset application exits Custom Mode and synchronizes `customInput` sidecars.
- ordinary field changes clear `activePresetId` only when the current values no longer match that preset.
- Custom Mode can only be enabled for modules exposing an override field.

Validation pending:

- [ ] Run updated `pnpm test:actions-api` in the project checkout.
- [ ] Resolve any module-suite failures before marking these actions `implemented` in `ACTIONS.md`.

### Deferred from 2B: `module.reset`

`module.reset` remains intentionally planned, not implemented. Source audit found that current Clear/Reset semantics are not identical across generic and specialized panels (notably Background). We will not publish a fake generic reset contract until that behavior is explicitly canonicalized.

## Next work after 2B validation

1. Fix any Module action test failures.
2. Mark validated Module actions `implemented`.
3. Decide whether to migrate the low-risk Expert UI module selector/field paths onto the canonical service now or after the next service family.
4. Continue to generic `ModuleEntity` lifecycle.
5. Continue to Typography.

## Known deferred decisions

- Batch/transaction API — defer until real multi-step Wizard flows justify it.
- Dry-run semantics — defer with batch design.
- Third-party schema validator — avoid until action input complexity justifies dependency cost.
- AI-facing tool schema/export format — design after internal registry contract stabilizes.
- Wizard UI — out of scope until core actions and at least Scene/Layout paths are stable.

## Regression guardrails

Every implementation phase must preserve:

- stable identity semantics;
- missing/unavailable reference behavior;
- current draft import/export compatibility;
- prompt compiler behavior unless an intentional fix is documented;
- current Expert UI behavior until that UI path is deliberately migrated;
- one canonical implementation for every domain mutation.

## Main branch rule

Do not update or move `main` as part of Actions API development without explicit approval. Development checkpoints remain on `refactor/actions-api` until a merge/readiness decision is made.
