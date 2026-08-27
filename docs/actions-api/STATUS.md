# Actions API Status

## Current checkpoint

Phase: **2 — Core write services**

Branch: `refactor/actions-api`

Baseline: `main@3db3294ba738c09a04a8d1f79bdc430f2d7a8e83`

Last source audit: 2026-08-27

Latest validated Actions API checkpoint: **105/105 passed** on 2026-08-27.

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
- `app/domain/moduleFields.ts`

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

- `app/domain/moduleFields.ts`
- `app/domain/moduleEntityFields.ts`

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

User runtime checkpoint on 2026-08-27: **41/41 passed**.

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
- group/text update preserves stable identity and structural tokens;
- text create/update reject empty authored text;
- explicit Layout Region positioning requires exact active region ID;
- missing persisted Region refs are not silently rewritten;
- move/delete operations use exact stable IDs.

User runtime checkpoint on 2026-08-27: **49/49 passed**.

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

- canonical Scene identity remains `scene.id`;
- delete leaves Layout Region refs missing rather than retargeting;
- component identity remains exact `moduleKey + entityId`;
- attach/replace require active scene-exposable module and exact available entity;
- `single` modules require explicit replacement;
- detach can remove missing/orphan refs;
- no token/name/fuzzy rescue is performed.

User runtime checkpoint on 2026-08-27: **57/57 passed**.

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

- Region identity remains `region.id`;
- geometry uses existing canonical normalization/clamp helpers;
- direct `contentRef` patching is forbidden;
- Scene binding requires exact active Scene ID and synchronizes cached token/label + `contentKey`;
- manual content detaches incompatible Scene binding explicitly;
- delete never rewrites external Region refs.

User runtime checkpoint on 2026-08-27: **65/65 passed**.

Scene + Layout form the first fully validated cross-domain relational write path for Wizard orchestration.

### 2H. Semantic assignment scope foundation — IMPLEMENTED + VALIDATED

Service: `app/domain/assignmentScopes.ts`

Runtime contract extension:

- `ActionEnvironment.semanticTargetSources`
- sources grouped by semantic capability (`color` / `material`)
- domain code remains independent from Vue/i18n adapters

Validated decisions:

- internal foundation primitive only; no public generic `assignment.*` action namespace;
- exact identity uses `semanticTargetIdentity` + shared reference catalog;
- new missing/unavailable dynamic refs reject;
- persisted exact missing/unavailable refs can survive unrelated edits;
- target/exception conflicts are resolved directionally;
- exclusive builtin target collapses target scope and cannot be an exception;
- no token/name fuzzy recovery.

User runtime checkpoint on 2026-08-27: **73/73 passed**.

### 2I. Color Palette assignments — IMPLEMENTED + VALIDATED

Service: `app/domain/colorPalette.ts`

Implemented actions:

- `colorPalette.assignment.create`
- `colorPalette.assignment.delete`
- `colorPalette.assignment.scope.set`
- `colorPalette.assignment.applyPreset`
- `colorPalette.swatch.add`
- `colorPalette.swatch.setLiteral`
- `colorPalette.swatch.setVariable`
- `colorPalette.swatch.delete`

Validated decisions:

- public mutation is granular; no broad arbitrary assignment patch;
- assignment/swatch mutation uses stable IDs rather than UI indices;
- new assignment defaults to canonical `overall` scope;
- scope mutation reuses shared semantic scope service;
- preset replaces colors only and preserves scope;
- swatch add/edit/delete detaches active preset;
- variable swatches bind only to exact enabled user `type="color"` variables;
- legacy assignment shapes normalize before stable-ID mutation;
- compiler and Expert UI remain unchanged.

User runtime checkpoint on 2026-08-27: **81/81 passed**.

### 2J. Texture Material assignments — IMPLEMENTED + VALIDATED

Service: `app/domain/materialAssignments.ts`

Actions:

- `texture.assignment.create`
- `texture.assignment.delete`
- `texture.assignment.scope.set`
- `texture.assignment.applyPreset`
- `texture.assignment.property.set`
- `texture.assignment.conditions.set`

Validated decisions:

- public surface stays granular; no arbitrary `texture.assignment.update` patch;
- assignments target exact stable IDs;
- new assignments default to canonical `all_surfaces` scope;
- scope mutation reuses the same validated semantic scope foundation with `material` capability;
- preset application replaces material payload axes/conditions while preserving exact target/exception scope;
- property/condition mutations detach active preset;
- authored freeform material/property/condition strings are preserved rather than silently coerced;
- compatibility metadata remains warning-only and does not block intentional combinations;
- legacy material assignment shapes normalize before exact domain mutation;
- compiler and Expert UI remain unchanged.

User runtime checkpoint on 2026-08-27:

- command: `pnpm test:actions-api`
- result: **89 tests / 89 passed / 0 failed**
- suites: Foundation + Variables + Modules + ModuleEntity lifecycle/fields + Typography + Scene + Layout + semantic scopes + Color Palette + Texture Material assignments

### 2K. Pose assignments — IMPLEMENTED + VALIDATED

Services:

- `app/domain/poseAssignments.ts`
- `app/domain/subjectAssignmentTargets.ts` — shared exact subject-target mutation primitive for Pose/Expression

Implemented actions:

- `pose.assignment.create`
- `pose.assignment.update`
- `pose.assignment.delete`
- `pose.assignment.applyPreset`

Validated decisions:

- Pose uses a subject target list only; it does not have the Color/Texture target+exception builtin scope model;
- available subject refs are passed explicitly through `ActionEnvironment.subjectAssignmentTargets` rather than read from `useSubjectAssignmentTargets()` inside domain code;
- exact identity continues to use `semanticTargetIdentity` / semantic reference catalog;
- new missing or unavailable refs reject;
- an exact persisted missing/unavailable ref may survive when that same identity is explicitly retained, and may be removed explicitly;
- `user_variable` and `system_variable` identities remain distinct even if `variableId` text matches;
- no token/name fuzzy recovery or retargeting;
- assignment create uses a new stable ID and mirrors current Expert UI default-target semantics by selecting the first available explicit subject source when one exists, otherwise `[]`;
- update exposes only known Pose payload fields plus `targets`; there is no arbitrary structured patch escape hatch;
- Pose payload edits detach `presetId`; target-only changes preserve the active preset;
- preset application replaces preset-owned Pose payload, preserves exact targets and preserves authored `additionalDetails`;
- legacy assignments without IDs normalize to deterministic `pose-assignment-{index}` compatibility identity before exact mutation;
- compiler and Expert UI remain unchanged.

Validation history:

- first real-checkout Pose run: **97 tests / 96 passed / 1 failed**;
- sole failure was a test-fixture kind mismatch (`system_variable` source vs `user_variable` request), which exact identity correctly classified as missing;
- fixture corrected without changing domain implementation;
- corrected real-checkout command: `pnpm test:actions-api`;
- final result: **97 tests / 97 passed / 0 failed**.

Pose public actions are promoted to `implemented` in `ACTIONS.md`.

### 2L. Expression assignments — IMPLEMENTED + VALIDATED

Services:

- `app/domain/expressionAssignments.ts`
- `app/domain/subjectAssignmentTargets.ts` — shared exact subject-target resolver; no second Expression resolver exists

Implemented actions:

- `expression.assignment.create`
- `expression.assignment.update`
- `expression.assignment.delete`
- `expression.assignment.applyPreset`

Validated decisions:

- Expression assignments use stable/compatibility IDs plus `coreExpression`, `intensity`, `eyeState`, `browState`, `mouthState`, `additionalDetails`, and exact subject `targets`;
- create mirrors existing Expert UI default-target behavior using the first available explicit `ActionEnvironment.subjectAssignmentTargets` source, otherwise `[]`;
- target mutation uses the same exact subject resolver already validated by Pose;
- new missing/unavailable refs reject; exact persisted orphan refs may be retained/removed only by the same identity;
- no token/name fuzzy recovery or cross-kind retargeting;
- update exposes only known Expression payload axes plus `targets`; there is no arbitrary structured patch escape hatch;
- authored strings are preserved instead of silently coercing to catalog options;
- payload edits detach `presetId`; target-only changes preserve the preset;
- preset application replaces the five preset-owned Expression axes while preserving exact targets and authored `additionalDetails`;
- legacy assignments without IDs normalize to deterministic `expression-assignment-{index}` compatibility identity before exact mutation;
- compiler and Expert UI remain unchanged.

User runtime checkpoint on 2026-08-27:

- command: `pnpm test:actions-api`
- result: **105 tests / 105 passed / 0 failed**
- Expression public actions are now promoted to `implemented` in `ACTIONS.md`.

### 2M. First Expert UI migration boundary — REVIEW COMPLETE, VARIABLES SELECTED

Audit result: **Variables is the first low-risk migration boundary.**

Why Variables is selected:

- `app/components/modules/variables/VariablesField.vue` currently owns direct create/edit/duplicate/delete list mutation and blueprint insertion;
- `app/domain/variables.ts` already operates directly on `PromptVariable[]`, exactly matching the component's `modelValue` / `update:modelValue` boundary;
- `VariablesField.vue` already has `activeSystemVariableKeys`, which maps directly to canonical `VariableMutationOptions.blockedKeys`;
- migration therefore does not require passing a full `PromptDraftState` into the component and does not require Action registry coupling inside Vue;
- the Variable editor's translation, validation hints, modal orchestration and blueprint configuration remain UI concerns and can stay in place while persisted mutations move to the domain service;
- blueprint insertion can be applied through repeated canonical `createPromptVariable` calls against a detached working list and emitted once, preserving an atomic UI commit;
- no compiler behavior needs to change.

Why `base.vue` generic module fields are not the first migration:

- `base.vue` currently owns local reactive `ModuleValues` and `ModulePanelState` slices and emits them separately;
- canonical module actions operate against the full draft boundary;
- migrating Base first would require broader prop/context plumbing and would affect many modules at once, making it a poor first regression surface.

Why Pose/Expression assignment UI is not the first migration:

- the shared `SubjectAssignmentsField.vue` is a cross-domain UI abstraction with Vue-derived target catalogs;
- the new canonical services require module/draft context plus explicit subject source environment;
- that migration is valuable later, but crosses more adapters than Variables and is therefore not the first low-risk proof.

Migration status:

- **review complete; path selected**;
- no Expert UI file has been changed in this review checkpoint;
- no compiler file has been changed;
- Variable actions remain `implemented`, not `migrated`, until the UI patch is applied and regression behavior is checked;
- when the UI patch lands, `variable.create`, `variable.update`, `variable.duplicate`, and `variable.delete` are candidates for `migrated` status because those current UI paths exist;
- `variable.setEnabled` remains `implemented` unless/until a current Expert UI path explicitly uses its dedicated canonical `setPromptVariableEnabled` mutation (the existing editor currently changes `enabled` as part of the general variable update form).

## Next

1. Enter the first Expert UI migration checkpoint by refactoring `VariablesField.vue` persisted CRUD/blueprint writes to call `app/domain/variables.ts` instead of directly rebuilding the array.
2. Keep modal state, translations, validation presentation, and `usePromptVariables()` catalog synchronization in the UI adapter layer.
3. Do not route this component through a second mutation implementation or introduce full-draft plumbing where the array-level canonical service already fits.
4. Run `pnpm test:actions-api` after the UI patch and regression-check Variable create/edit/duplicate/delete/blueprint flows in the real app.
5. Only after that regression checkpoint, promote the corresponding Variable actions from `implemented` to `migrated`.
6. Continue specialized domains after this first migration proof: Lighting / Effects, then Hair / Outfit as appropriate.

## Known deferred decisions

- `module.reset` contract — defer until Clear semantics are canonicalized.
- Batch/transaction API — defer until real multi-step Wizard flows justify it.
- Dry-run semantics — defer with batch design.
- Third-party schema validator — avoid until action input complexity justifies dependency cost.
- Headless semantic source builder from canonical draft/compiler outputs — defer until specialized consumers establish exact runtime needs.
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
