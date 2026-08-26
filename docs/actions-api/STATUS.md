# Actions API Status

## Current checkpoint

Phase: **2 — Core write services**

Branch: `refactor/actions-api`

Baseline: `main@3db3294ba738c09a04a8d1f79bdc430f2d7a8e83`

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

- [x] Extracted canonical draft contracts/helpers.
- [x] Migrated `create.vue` to shared draft contracts without persisted schema changes.
- [x] Added headless Action registry, validation, structured issues/results and deterministic ID factories.
- [x] Enforced atomic failure and caller-draft isolation.
- [x] Kept compiler code unchanged.

Phase 1 exit gate: **accepted**.

## Current work — Phase 2

### 2A. Variables — IMPLEMENTED + VALIDATED

Service: `app/domain/variables.ts`

Implemented actions:

- `variable.create`
- `variable.update`
- `variable.duplicate`
- `variable.delete`
- `variable.setEnabled`

Status: `implemented`, not yet `migrated`.

### 2B. Simple modules and presets — IMPLEMENTED + VALIDATED

Service: `app/domain/modules.ts`

Implemented actions:

- `module.activate`
- `module.deactivate`
- `module.field.set`
- `module.preset.apply`
- `module.customMode.set`

User runtime validation on 2026-08-27:

- command: `pnpm test:actions-api`
- result: **27 tests / 27 passed / 0 failed**
- suites covered: Foundation + Variables + Modules

Canonical semantics now validated:

- activation preserves existing inactive state and initializes only missing state;
- deactivation is non-destructive;
- generic field mutation rejects structured fields;
- freeform and `customInput` persistence semantics remain distinct;
- preset overlay leaves unrelated state intact and synchronizes sidecars;
- active preset clears only after values stop matching;
- Custom Mode requires an override field.

Deferred: `module.reset` remains planned because generic/specialized Clear behavior is not yet one canonical contract.

### 2C. Generic ModuleEntity lifecycle — SOURCE IMPLEMENTED / VALIDATION PENDING

Service:

- `app/domain/moduleEntities.ts`

Actions:

- [x] `moduleEntity.create`
- [x] `moduleEntity.update`
- [x] `moduleEntity.duplicate`
- [x] `moduleEntity.delete`
- [x] `moduleEntity.setEnabled`
- [x] `moduleEntity.setInheritance`

Tests:

- `scripts/actions-module-entities.test.ts`
- included in `pnpm test:actions-api`

Lifecycle invariants encoded:

- entity identity is exact stable `moduleKey + entityId` ownership; editable key/name never replace identity;
- create/duplicate use new IDs and canonical unique editable keys;
- duplicate is inserted adjacent to the source and deep-copies its payload;
- metadata update preserves stable ID;
- delete removes only the exact entity and deliberately leaves Scene/Layout/external refs untouched so they become explicit missing refs rather than silently retargeting;
- enabled toggle preserves identity;
- inheritance toggle is allowed only when module capability explicitly supports it;
- inactive or non-entity-capable modules reject lifecycle mutation;
- deterministic `ActionContext.idFactory.moduleEntity` is supported for tests/consumers;
- lifecycle update deliberately does not expose arbitrary payload patching.

Validation pending:

- [ ] Run updated `pnpm test:actions-api` in the real project checkout.
- [ ] Resolve any lifecycle-suite failures before marking the six actions `implemented`.

### Next after lifecycle validation

1. Mark the six ModuleEntity lifecycle actions `implemented` if the suite is green.
2. Add schema-backed `moduleEntity.field.set` using the same simple-field/custom-sidecar rules as module fields.
3. Add `moduleEntity.preset.apply` using entity-local payload overlay semantics.
4. Re-evaluate low-risk Expert UI migration only after these contracts stabilize.
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
