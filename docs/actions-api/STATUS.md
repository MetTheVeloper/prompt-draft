# Actions API Status

## Current checkpoint

Phase: **2 — Core write services**

Branch: `refactor/actions-api`

Baseline: `main@3db3294ba738c09a04a8d1f79bdc430f2d7a8e83`

Last source audit: 2026-08-27

`main` remains untouched by Actions API development.

## Completed

### Phase 0 — audit and scope — COMPLETE

- [x] Audited draft/session ownership and persistence boundary.
- [x] Audited module registry/field schema and current mutation ownership.
- [x] Audited Variables, ModuleEntity, Scene, Layout, semantic target and assignment domains.
- [x] Audited Lighting, Effects, Typography, Hair and Outfit specialized semantics.
- [x] Audited top-level compile coupling.
- [x] Created `refactor/actions-api` from the accepted main baseline.
- [x] Created durable source-of-truth docs under `/docs/actions-api`.

### Phase 1 — canonical draft boundary and action primitives — COMPLETE + ACCEPTED

- [x] Extracted canonical `PromptDraftState` contracts/helpers.
- [x] Migrated `create.vue` to shared draft contracts without persisted schema changes.
- [x] Added headless Action registry, input validation, structured issues/results and discovery.
- [x] Added explicit `ActionEnvironment` and deterministic ID factory injection.
- [x] Enforced atomic failure and caller-draft isolation.
- [x] Kept compiler code unchanged.

Initial user runtime checkpoint on 2026-08-27: **18/18 passed**.

## Current work — Phase 2

### 2A. Variables — IMPLEMENTED + VALIDATED

Service: `app/domain/variables.ts`

Implemented actions:

- `variable.create`
- `variable.update`
- `variable.duplicate`
- `variable.delete`
- `variable.setEnabled`

Status: `implemented`, not yet `migrated` to Expert UI.

### 2B. Simple modules and presets — IMPLEMENTED + VALIDATED

Services:

- `app/domain/modules.ts`
- shared simple-field rules: `app/domain/moduleFields.ts`

Implemented actions:

- `module.activate`
- `module.deactivate`
- `module.field.set`
- `module.preset.apply`
- `module.customMode.set`

Validated semantics:

- activation preserves inactive stored state and initializes only missing state;
- deactivation is non-destructive;
- structured fields reject generic field mutation;
- freeform and `customInput` contracts remain distinct;
- preset overlay preserves unrelated state and synchronizes sidecars;
- active preset clears only after values stop matching;
- Custom Mode requires an override field.

User runtime checkpoint on 2026-08-27: **27/27 passed**.

Deferred: `module.reset` remains planned because generic/specialized Clear semantics are not yet one canonical contract.

### 2C. Generic ModuleEntity lifecycle — IMPLEMENTED + VALIDATED

Service: `app/domain/moduleEntities.ts`

Implemented actions:

- `moduleEntity.create`
- `moduleEntity.update`
- `moduleEntity.duplicate`
- `moduleEntity.delete`
- `moduleEntity.setEnabled`
- `moduleEntity.setInheritance`

Validated invariants:

- identity is stable `moduleKey + entityId` ownership;
- editable key/name never replace identity;
- create/duplicate receive new stable IDs and unique editable keys;
- duplicate is adjacent and deep-clones payload;
- update preserves stable ID;
- delete removes only the exact entity and never rewrites Scene/Layout/external refs;
- enabled toggle preserves identity;
- inheritance mutation requires explicit module capability;
- inactive/non-entity-capable/missing/conflicting targets reject explicitly.

User runtime checkpoint on 2026-08-27:

- command: `pnpm test:actions-api`
- result: **35 tests / 35 passed / 0 failed**
- suites: Foundation + Variables + Modules + ModuleEntity lifecycle

### 2D. ModuleEntity simple fields and presets — SOURCE IMPLEMENTED / VALIDATION PENDING

Services:

- `app/domain/moduleFields.ts` — canonical simple-field validation/write semantics shared by Global module fields and ModuleEntity payload fields.
- `app/domain/moduleEntityFields.ts` — entity-local field/preset orchestration.

Source actions:

- [x] `moduleEntity.field.set`
- [x] `moduleEntity.field.clear`
- [x] `moduleEntity.preset.apply`

Important semantics:

- only simple schema-backed non-override fields are accepted;
- structured fields require specialized domain actions;
- `field.set` writes one local payload override and preserves entity identity;
- `field.clear` removes the local field plus its `customInput` sidecar, restoring inherited/unset semantics;
- `customInput` sidecar behavior is shared with Global `module.field.set` through one canonical helper;
- entity preset application overlays only real non-override module fields;
- unrelated entity payload survives preset application;
- stale custom sidecars are removed when a preset selects a non-custom option;
- entity preset application does not expose arbitrary payload patching.

Tests:

- `scripts/actions-module-entity-fields.test.ts`
- the main Actions API command now runs all prior suites plus this suite.

Validation pending:

- [ ] Run `pnpm test:actions-api` in the real project checkout.
- [ ] Expected current total if all tests pass: **41**.
- [ ] Resolve any regression/new-suite failure before marking the three new actions `implemented`.

## Next after 2D validation

1. Mark ModuleEntity field/preset actions `implemented` if the suite is green.
2. Decide the first low-risk Expert UI migration boundary after the service contracts are stable.
3. Continue Phase 2 to Typography domain services/actions.
4. Then continue toward Scene and Layout, which are required before Wizard work begins.

## Known deferred decisions

- `module.reset` contract — defer until Clear semantics are canonicalized.
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
