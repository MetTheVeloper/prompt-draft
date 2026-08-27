# Actions API Status

## Current checkpoint

Phase: **2 — Core write services**

Branch: `refactor/actions-api`

Baseline: `main@3db3294ba738c09a04a8d1f79bdc430f2d7a8e83`

Last source audit: 2026-08-27

Latest validated Actions API checkpoint: **89/89 passed** on 2026-08-27.

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

Color + Texture now prove the shared semantic assignment scope contract across two distinct payload domains.

### 2K. Pose assignments — IMPLEMENTED, AWAITING USER VALIDATION

Services:

- `app/domain/poseAssignments.ts`
- `app/domain/subjectAssignmentTargets.ts` — shared exact subject-target mutation primitive intended for Pose/Expression

Actions present on branch:

- `pose.assignment.create`
- `pose.assignment.update`
- `pose.assignment.delete`
- `pose.assignment.applyPreset`

Audit/contract decisions:

- Pose uses a subject target list only; it does not have the Color/Texture target+exception builtin scope model;
- available subject refs are passed explicitly through `ActionEnvironment.subjectAssignmentTargets` rather than read from `useSubjectAssignmentTargets()` inside domain code;
- exact identity continues to use the shared `semanticTargetIdentity` / semantic reference catalog contract;
- new missing or unavailable refs reject;
- an exact persisted missing/unavailable ref may survive when that same identity is explicitly retained, and may be removed explicitly;
- no token/name fuzzy recovery or retargeting is introduced;
- assignment create uses a new stable ID and mirrors current Expert UI default-target semantics by selecting the first available explicit subject source when one exists, otherwise `[]`;
- update exposes only known Pose payload fields plus `targets`; there is no arbitrary structured patch escape hatch;
- Pose payload edits detach `presetId`; target-only changes preserve the active preset;
- preset application replaces preset-owned Pose payload, preserves exact targets and preserves authored `additionalDetails`;
- legacy assignments without IDs normalize to the existing deterministic `pose-assignment-{index}` compatibility identity before exact mutation;
- compiler and Expert UI remain unchanged.

Test checkpoint added:

- `scripts/actions-pose-assignments.test.ts`
- `pnpm test:actions-api` now includes the Pose suite
- coverage includes stable create identity/default target, freeform payload preservation, preset detachment, target-only preset preservation, exact target metadata refresh, new missing/unavailable rejection, persisted orphan preservation, preset application, exact-ID failures, legacy normalization and registry atomicity

Validation status:

- **not yet user-validated**
- latest accepted real-checkout baseline remains **89/89**
- Pose actions remain `planned` in `ACTIONS.md` until the real checkout suite passes, per the registry promotion rule
- an assistant-side smoke run was attempted, but the execution environment could not resolve GitHub to clone the repository; this does not count as validation or failure of the project suite

## Next

1. Run and confirm the Pose checkpoint with `pnpm test:actions-api` on the real `refactor/actions-api` checkout.
2. If Pose passes, promote its public action statuses to `implemented` and record the new validated test count.
3. Implement **Expression assignment actions** using the same exact subject-reference primitive and Expression-specific payload/preset semantics.
4. After Expression validation, re-evaluate the first low-risk Expert UI migration boundary.
5. Preserve domain-specific payload ownership; do not introduce a public generic assignment patch action.
6. Continue specialized domains after the migration-boundary decision: Lighting / Effects, then Hair / Outfit as appropriate.

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
