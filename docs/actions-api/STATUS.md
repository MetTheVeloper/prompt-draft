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

### 2G. Layout — IMPLEMENTED + VALIDATED

Service: `app/domain/layouts.ts`

Implemented actions:

- `layout.region.create`
- `layout.region.update`
- `layout.region.duplicate`
- `layout.region.delete`
- `layout.region.move`
- `layout.grid.update`
- `layout.region.assignScene`
- `layout.region.clearScene`

Validated contract decisions:

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
- no Layout action uses legacy token lookup as fallback for an existing/missing stable Scene ref.

User runtime checkpoint on 2026-08-27:

- command: `pnpm test:actions-api`
- result: **65 tests / 65 passed / 0 failed**
- suites: all prior suites + Layout

Scene + Layout now form the first fully validated cross-domain relational write path for future Wizard orchestration.

### 2H. Semantic assignment scope foundation — IMPLEMENTED + VALIDATED

Service:

- `app/domain/assignmentScopes.ts`

Runtime contract extension:

- `ActionEnvironment.semanticTargetSources`
- sources are grouped by semantic capability (`color` / `material`)
- domain code remains independent from `useSemanticTargetCatalog()` and Vue/i18n state

Validated scope ownership decisions:

- this service is an internal foundation primitive, not a public generic `assignment.*` action namespace;
- specialized Color/Texture/Pose/Expression actions call the same scope service, keeping payload ownership local to each domain;
- exact identity uses `semanticTargetIdentity` and shared reference-catalog resolution;
- domain builtin slots are merged with optional dynamic semantic sources; a live dynamic source may canonically upgrade the same builtin slot identity;
- new missing or unavailable dynamic refs reject explicitly;
- exact persisted missing/unavailable refs may survive unrelated edits so recovery remains possible;
- exact duplicates are removed by stable identity;
- target/exception conflicts follow the current editor's directional semantics: the side explicitly changed wins; when both are authored atomically, targets win deterministically;
- domain-exclusive builtin target values collapse the target scope and cannot be authored as exceptions;
- custom targets remain valid exact semantic refs and dedupe by normalized semantic identity;
- no token/name fuzzy recovery is introduced.

Public API decision:

- generic `assignment.targets.set` and `assignment.exceptions.set` were rejected as public API design;
- public assignment mutations remain domain-specific (`colorPalette.*`, `texture.*`, `pose.*`, `expression.*`).

User runtime checkpoint on 2026-08-27:

- command: `pnpm test:actions-api`
- result: **73 tests / 73 passed / 0 failed**
- suites: all prior suites + semantic assignment scope foundation

### 2I. Color Palette assignments — SOURCE IMPLEMENTED / VALIDATION PENDING

Service:

- `app/domain/colorPalette.ts`

Actions:

- [x] `colorPalette.assignment.create`
- [x] `colorPalette.assignment.delete`
- [x] `colorPalette.assignment.scope.set`
- [x] `colorPalette.assignment.applyPreset`
- [x] `colorPalette.swatch.add`
- [x] `colorPalette.swatch.setLiteral`
- [x] `colorPalette.swatch.setVariable`
- [x] `colorPalette.swatch.delete`

Tests:

- `scripts/actions-color-palette.test.ts`
- included in `pnpm test:actions-api`

Color contract decisions:

- public mutation is granular; no broad arbitrary `colorPalette.assignment.update` patch is exposed;
- assignment and swatch mutations target stable IDs rather than UI indices;
- new assignments default to canonical `overall` scope and empty colors;
- scope mutation delegates to the validated shared semantic scope service;
- preset apply replaces colors only and preserves target/exception scope, matching current Expert UI behavior;
- clearing a preset detaches preset metadata without clearing authored colors;
- any swatch add/edit/delete detaches the active palette preset;
- literal swatches preserve authored string values; the domain layer does not silently coerce them through the visual color picker;
- variable swatches bind only to exact enabled user variables with `type="color"`, matching the current Color editor source picker;
- missing/disabled/non-color variables reject explicit new binding;
- variable swatches cache token/label presentation metadata while stable ownership remains `variableId`;
- legacy color assignment shapes are normalized before exact stable-ID mutation;
- compiler and Expert UI remain unchanged in this checkpoint.

Validation pending:

- [ ] Run updated `pnpm test:actions-api` in the real project checkout.
- [ ] Expected current total if all tests pass: **81**.
- [ ] Resolve any Color Palette or prior-suite regression before marking these actions `implemented`.

## Next after Color Palette validation

1. Mark the eight Color Palette actions `implemented` if the suite is green.
2. Implement Texture Material assignment actions on the same semantic scope foundation while preserving Texture-specific preset-detach and payload compatibility semantics.
3. Continue to Pose and Expression assignment actions after Color/Texture prove the shared scope contract across two different payload domains.
4. Re-evaluate the first low-risk Expert UI migration boundary after assignment contracts stabilize.

## Known deferred decisions

- `module.reset` contract — defer until Clear semantics are canonicalized.
- Batch/transaction API — defer until real multi-step Wizard flows justify it.
- Dry-run semantics — defer with batch design.
- Third-party schema validator — avoid until action input complexity justifies dependency cost.
- Headless semantic source builder from canonical draft/compiler outputs — current actions accept explicit capability-scoped sources; extraction of a universal builder is deferred until specialized assignment consumers establish the exact runtime needs.
- AI-facing tool schema/export format — design after internal registry contract stabilizes.
- Wizard UI — out of scope until core actions and relational/assignment paths are stable.

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
