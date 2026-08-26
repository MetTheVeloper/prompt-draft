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
- `app/domain/moduleFields.ts` — shared canonical simple-field validation/write semantics

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

User runtime checkpoint on 2026-08-27: **35/35 passed**.

### 2D. ModuleEntity simple fields and presets — IMPLEMENTED + VALIDATED

Services:

- `app/domain/moduleFields.ts` — shared by Global module fields and ModuleEntity payload fields;
- `app/domain/moduleEntityFields.ts` — entity-local field/preset orchestration.

Implemented actions:

- `moduleEntity.field.set`
- `moduleEntity.field.clear`
- `moduleEntity.preset.apply`

Validated semantics:

- only simple schema-backed non-override fields are accepted;
- structured fields require specialized domain actions;
- `field.set` writes one local payload override and preserves entity identity;
- `field.clear` removes the local field plus its `customInput` sidecar, restoring inherited/unset semantics;
- Global and entity simple fields share one canonical validator/mutator implementation;
- entity preset application overlays only real non-override module fields;
- unrelated payload survives preset application;
- stale custom sidecars are removed when the preset leaves a custom selection.

User runtime checkpoint on 2026-08-27:

- command: `pnpm test:actions-api`
- result: **41 tests / 41 passed / 0 failed**
- suites: Foundation + Variables + Modules + ModuleEntity lifecycle + ModuleEntity fields/presets

### 2E. Typography — IMPLEMENTED + VALIDATED

Service: `app/domain/typography.ts`

Implemented actions:

- `typography.group.create`
- `typography.group.update`
- `typography.group.delete`
- `typography.group.move`
- `typography.text.create`
- `typography.text.update`
- `typography.text.delete`
- `typography.text.move`

Validated contract decisions:

- `groupName` and `layerName` are structural tokens derived from stable IDs and are not arbitrary update fields;
- create resolves the final stable ID first, then derives the structural token from that identity;
- group update preserves stable group ID/token and all contained text identities;
- text update preserves stable text ID/layer token;
- text create/update reject empty authored text, matching the current editor validation;
- group metadata remains optional, matching the current editor behavior;
- configured purpose/direction/alignment/distribution/font options validate against the Typography field schema;
- a structural variable token remains valid as a font-style value;
- explicit Layout Region positioning requires `positionSource: "layout_region"` plus an exact active region ID;
- explicit missing-region replacement rejects rather than fuzzy-retargeting;
- unrelated persisted missing region references are not rewritten by unrelated Typography mutations;
- move operations use exact stable IDs and explicit target indices;
- group deletion deletes the contained text blocks as current ownership semantics imply.

User runtime checkpoint on 2026-08-27:

- command: `pnpm test:actions-api`
- result: **49 tests / 49 passed / 0 failed**
- suites: all prior suites + Typography

### 2F. Scene — IMPLEMENTED + VALIDATED

Service: `app/domain/scenes.ts`

Implemented actions:

- `scene.create`
- `scene.update`
- `scene.duplicate`
- `scene.delete`
- `scene.setEnabled`
- `scene.component.attach`
- `scene.component.detach`
- `scene.component.replace`

Validated contract decisions:

- canonical Scene identity remains `scene.id`; key/name are editable presentation/semantic metadata;
- create/duplicate receive deterministic-injectable stable IDs and unique camel-style semantic keys;
- duplicate is adjacent and deep-copies explicit component refs;
- delete touches only Scene-owned state, so existing Layout Region `contentRef.entityId` remains missing instead of being rewritten;
- component identity remains exact `moduleKey + entityId`;
- attach/replace require the target module to be active, Scene-exposable, and the target entity to exist and be enabled;
- `single` Scene-selection modules reject implicit replacement during attach; callers must use explicit `scene.component.replace`;
- `multiple` modules may attach several distinct exact entity refs;
- duplicate attachment is rejected instead of silently deduplicating an authored mutation;
- detach intentionally validates only the exact stored reference, not current target availability, so missing/orphan refs can always be explicitly removed;
- replace can repair an exact missing entity ref when the module is still active/exposable and the replacement entity is exact/available;
- no Scene action performs token/name/fuzzy reference rescue.

User runtime checkpoint on 2026-08-27:

- command: `pnpm test:actions-api`
- result: **57 tests / 57 passed / 0 failed**
- suites: all prior suites + Scene

### 2G. Layout — SOURCE IMPLEMENTED / VALIDATION PENDING

Service:

- `app/domain/layouts.ts`

Actions:

- [x] `layout.region.create`
- [x] `layout.region.update`
- [x] `layout.region.duplicate`
- [x] `layout.region.delete`
- [x] `layout.region.move`
- [x] `layout.grid.update`
- [x] `layout.region.assignScene`
- [x] `layout.region.clearScene`

Tests:

- `scripts/actions-layouts.test.ts`
- included in `pnpm test:actions-api`

Layout audit/contract decisions:

- Region identity remains `region.id`; update cannot replace it;
- create/duplicate receive deterministic-injectable stable IDs and reject ID conflicts;
- create/update/duplicate reuse canonical `layoutRegions` normalization instead of reimplementing geometry rules;
- `custom` role requires a non-empty custom-role description;
- width/height must remain positive after canonical clamp/normalization;
- duplicate keeps explicit Scene binding metadata, clears duplicated name, offsets geometry by one grid cell where possible, and uses a new authored layer value matching current UI behavior;
- collection move changes order only; it deliberately does not rewrite authored `layer` values;
- grid update uses canonical grid min/max/round rules and preserves Region geometry;
- delete touches Layout-owned state only, so Typography/future external Region refs remain missing until explicitly repaired;
- direct `contentRef` patching is not exposed through `layout.region.update`;
- Scene binding requires exact active Scene ID and synchronizes cached token/label plus backward-compatible `contentKey`;
- manual `contentKey` replacement explicitly detaches the stable Scene ref when it no longer matches the cached Scene token;
- `clearScene` removes only the Scene binding and clears `contentKey` only when that content was the Scene token being cleared;
- no Layout action uses legacy token lookup as fallback for an existing/missing stable Scene ref;
- compiler and current Expert UI remain unchanged in this checkpoint.

Validation pending:

- [ ] Run updated `pnpm test:actions-api` in the real project checkout.
- [ ] Expected current total if all tests pass: **65**.
- [ ] Resolve any Layout or prior-suite regression before marking the eight Layout actions `implemented`.

## Next after Layout validation

1. Mark the eight Layout actions `implemented` if the suite is green.
2. Scene + Layout will then form the first validated cross-domain relational path usable by future Wizard orchestration.
3. Re-evaluate the first low-risk Expert UI migration boundary now that Variables, Modules, ModuleEntity, Typography, Scene and Layout write contracts are stable.
4. Continue Phase 2 into shared semantic-assignment write services, then specialized assignment domains.

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
