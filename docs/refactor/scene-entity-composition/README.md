# Scene & Entity Composition Refactor

> **Status:** Phase 3 complete / Phase 4 implemented, user validation pending
> **Working branch:** `refactor/scene-entity-composition`
> **Baseline main commit:** `83ed3e6374f8fc85e8a3b48f822cb75a1c1f862c`
> **Scope rule:** Keep all work for this refactor on the working branch until explicit user approval to merge. Do not merge or transfer these changes to `main` implicitly.

## Why this document exists

This file is the canonical source of truth for the Scene + repeatable module entity refactor. Any future development session should:

1. inspect the latest history of `refactor/scene-entity-composition`;
2. read this file completely;
3. continue from the first incomplete phase;
4. inspect the current source before changing architecture;
5. update this file whenever a phase, migration rule, or architectural decision changes.

---

# Goal

Prompt Draft already has semantic targets, prompt variables, Layout Regions, Typography entities, Hair entities, Outfit sets/items, and specialized assignment systems. Most visual modules, however, originally behaved as singleton configurations.

This refactor introduces two complementary concepts:

1. **Repeatable Module Entities** — named reusable configurations owned by a module.
2. **Scene Entities** — reusable scene compositions that reference semantic content and existing module entities.

Target architecture:

```text
Global Module Defaults
        ↓ optional inheritance
Repeatable Module Entities
        ↓ stable references
Scene Entities
        ↓ content reference
Layout Regions
```

A Layout Region should normally reference one Scene rather than directly wiring Camera, Background, Form, Lighting, Material, Pose, etc. one-by-one.

---

# Core architectural decisions

## 1. Scene is a real key module

Scene is implemented as a real key module with specialized repeatable Scene entities.

Each Scene entity exposes a derived `reference` variable/token:

```text
Scene entity
   ↓
Derived PromptVariable
   ↓
{scene_*}
```

Manual user-created reference variables remain an escape hatch, not the canonical Scene model.

## 2. Every Key Module shell is Base-driven

Scene is specialized in its **field/editor semantics**, not in its outer Key Module shell.

Canonical UI layering:

```text
Prompt Key Module
→ ModulesPanelBase
→ module schema/groups/fields
→ specialized field component only where the field semantics require it
```

Scene therefore uses the same `ModulesPanelBase` shell as other Key Modules for:

- Key Module header/status;
- module expand/collapse;
- clear/delete state action;
- module output preview;
- copy action;
- right-click context menu;
- remove-from-Key-Modules action;
- shared visual spacing/radius/borders and responsive behavior.

The Scene-specific editor is injected through the Scene schema field:

```ts
fields: {
  scenes: {
    id: "scenes",
    type: "sceneEntities",
    ...
  }
}
```

`Base.vue` renders that field using `SceneEntitiesField.vue`.

`app/components/modules/panel/scene.vue` is only an orchestration wrapper for Scene-specific compile/issues/context; it must not recreate a second Key Module shell.

This rule applies to future structured Key Modules too unless a documented architecture-level exception is approved.

## 3. Scene composes references; it does not duplicate module state

Bad:

```ts
scene.camera.focalLength
scene.form.transformation
scene.background.environment
```

Canonical direction:

```ts
scene.components = [
  { moduleKey: "camera", entityId: "camera-entity-id" },
  { moduleKey: "form", entityId: "form-entity-id" },
]
```

The source of truth for each configuration stays inside its owning module.

## 4. Region owns the Scene placement relationship

Canonical ownership remains:

```text
Layout Region → Scene
```

Scene does not own a Region. One Scene may later be reused by multiple Regions.

## 5. Semantic target and layout scope are different concepts

Semantic targeting answers **what entity** receives a configuration.

Layout scoping answers **where** a composed Scene is placed.

Examples:

- Form may target `{person}`, `{car}`, or other semantic references.
- Camera normally has no subject/object semantic target.
- Scene selects a Camera entity.
- Layout Region selects a Scene.

Do not collapse these concepts into one target array.

## 6. Existing scalar module state remains global/default state

A scalar module converted to repeatable entities keeps its existing top-level `ModuleValues` as global/default configuration.

Generic named configurations coexist under the optional sibling `entities` key.

This is the backward-compatible strategy for old drafts.

## 7. Named scalar entities may inherit or be independent

Generic module entities support:

```ts
inheritGlobal?: boolean
```

Semantics:

- missing / `true` → inherit global/default values;
- `false` → resolve only from local payload values.

Form exposes this as **Independent Form**.

## 8. Entity presets are local entity state

The generic entity editor has opt-in preset support.

When enabled:

- preset field values are written to the selected entity payload;
- those values become explicit local overrides;
- global/default state is unchanged;
- preset identity is derived from matching values, not stored as canonical identity.

Camera enables this behavior.

## 9. Scene-exposable and semantic-target capability are separate axes

A module can be useful inside a Scene without supporting semantic subject/object targeting.

Current proof modules:

```ts
form: {
  enabled: true,
  sceneExposable: true,
  sceneSelection: "multiple",
  targetPolicy: ["subject", "object"],
}

camera: {
  enabled: true,
  sceneExposable: true,
  sceneSelection: "single",
  targetPolicy: [],
}
```

`sceneSelection` controls cardinality in Scene composition:

- Camera → one named configuration per Scene;
- Form → multiple named configurations per Scene.

## 10. Scene can depend on Layout at runtime without losing state

Current Phase 4 behavior:

```text
Layout inactive
→ Scene entities remain stored and editable
→ Scene definitions do not compile
→ derived {scene_*} references are not exposed as active picker variables

Layout active
→ Scene definitions compile
→ derived {scene_*} references become available
```

Disabling Layout must never destroy Scene state.

## 11. Stable IDs are identity; keys/tokens/names are representation

Cross-module references use stable IDs whenever available.

For module configuration components:

```text
moduleKey + entityId
```

is canonical identity.

Scene itself also has a stable `id`. Its editable semantic key generates the `{scene_*}` token, but changing Name/Semantic Key must not change Scene identity.

Missing/deleted references remain missing; the system must never silently retarget them to another entity.

---

# Implemented generic entity infrastructure — Phase 1

Primary files:

- `app/modules/entityContracts.ts`
- `app/modules/entityCapabilities.ts`
- `app/modules/registry.ts`
- `app/components/modules/shared/ModuleEntitiesField.vue`

Generic scalar entity:

```ts
type ModuleEntity<TPayload extends object = Record<string, unknown>> = {
  id: string
  key: string
  name: string
  enabled?: boolean
  inheritGlobal?: boolean
  payload: TPayload
}
```

Target-oriented specialization:

```ts
type TargetedModuleEntity<TPayload extends object = Record<string, unknown>> =
  ModuleEntity<TPayload> & {
    targets: SemanticTargetRef[]
  }
```

Stable module-entity reference:

```ts
type ModuleEntityRef = {
  moduleKey: string
  entityId: string
  token?: string
  label?: string
}
```

Only `moduleKey + entityId` participate in canonical component identity.

---

# Form result — Phase 2

Form proves the architecture for a **target-oriented repeatable scalar module**.

Implemented behavior:

- existing Form scalar state remains global/default state;
- named Form configurations use the generic `entities` collection;
- Form entities support subject/object semantic targets;
- editor supports add/duplicate/rename/delete/enable, per-field overrides and inheritance;
- stable ID does not change when Name or Semantic Key changes;
- dedicated Form compiler handles scoped entity output;
- no named entities → legacy scalar behavior remains unchanged;
- optional Independent Form disables global inheritance.

Accepted Independent Form wording:

```text
• {target} — independent form: exclude {target} from the Global/default form. Use only: [local specification]
```

Phase 2 was manually validated in the running application with real generated-image comparisons and accepted.

---

# Camera result — Phase 3

Camera proves the architecture for a **scene-oriented repeatable scalar module**.

Implemented behavior:

- existing Camera state remains global/default state;
- named Camera configurations use the generic entity editor;
- Camera entities have no subject/object target picker;
- named Camera state does not add multiple Camera instructions to the global Camera output;
- Camera entities inherit global/default values unless locally overridden;
- per-entity Camera presets write only to local entity payload;
- Camera is `sceneExposable: true` and `sceneSelection: "single"`.

Phase 3 was manually validated in the running application and accepted.

---

# Scene implementation — Phase 4

Scene is a **specialized repeatable entity-owning module**, not another scalar `ModuleEntity.payload` module. Its outer Key Module UI is nevertheless fully Base-driven.

Primary Phase 4 files:

- `app/modules/scene.types.ts`
- `app/modules/scene.module.ts`
- `app/utils/scene.ts`
- `app/utils/compileScene.ts`
- `app/components/modules/scene/SceneEntitiesField.vue`
- `app/components/modules/panel/scene.vue`
- `app/components/modules/panel/base.vue`
- `app/utils/promptVariableCatalog.ts`
- `app/components/prompt/editor.vue`

## Scene UI architecture

`SceneModule` declares the structured field in its schema:

```ts
scenes: {
  id: "scenes",
  type: "sceneEntities",
  default: [],
  group: "scenes",
}
```

`ModulesPanelBase` owns the common Key Module shell and renders the field via `SceneEntitiesField.vue`.

The specialized field component owns only Scene-domain controls:

- Scene add/duplicate/delete/enable;
- Scene card expand/collapse;
- Name + Semantic Key;
- Description + Extra Details;
- Content / Actors picker;
- Configuration Components picker;
- per-Scene missing-reference warnings.

The thin `panel/scene.vue` wrapper owns canonical Scene compilation and combines Scene-specific issues with Base issues.

## Scene state model

```ts
type SceneContentRef = {
  variableId: string
  token?: string
  label?: string
  source?: PromptVariableSource
  type?: PromptVariableType
}

type SceneComponentRef = ModuleEntityRef

type SceneEntity = {
  id: string
  key: string
  name: string
  enabled?: boolean
  description?: string
  content: SceneContentRef[]
  components: SceneComponentRef[]
  extraDetails?: string
}
```

Scene state is stored under the Scene module's `scenes` field.

Scene does not copy Camera/Form payloads.

## Scene Content / Actors

The Scene editor currently exposes a deliberately small Phase 4 content catalog rather than prematurely replacing the project's full semantic target catalog.

Supported Scene content includes:

- user `subject` variables;
- user `object` variables;
- user `reference` variables;
- active system `{subject}`.

Important implementation detail discovered during the first UI test:

User variables created by the Variables module do not need to persist `source: "user"` inside their own stored record. The Scene catalog therefore reads them directly from `enabledPromptVariables` and normalizes a missing source to `user`; it must **not** filter user content by requiring `variable.source === "user"`.

This is what allows variables such as `{car}` and `{buildings}` to appear correctly in Content / Actors.

Scene and Layout Region references are intentionally excluded from Scene Content in this phase.

Scene stores `variableId` as canonical content identity and resolves the current token during compilation.

A deleted/disabled content variable remains a missing reference and surfaces a warning.

## Scene Configuration Components

The Scene editor discovers configuration modules generically from capability metadata:

```ts
isSceneExposableModule(module)
```

It does not hard-code a Camera picker and a Form picker separately.

Current behavior:

- Camera picker → single selection;
- Form picker → multiple selection;
- only named module entities are selectable;
- disabled entities cannot be newly selected;
- existing missing/disabled refs remain visible as missing instead of being silently removed;
- component refs store stable `moduleKey + entityId`.

## Scene component compilation

`compileScene.ts` resolves a component ref back to the source module entity.

Generic scalar entity path:

```text
SceneComponentRef
→ find module + entity by stable ID
→ resolve global/default + local payload
→ compile selected entity
```

Form uses its dedicated exported adapter so target scoping and Independent Form semantics are preserved.

Camera uses the generic scalar entity path.

Scene therefore does not know Camera/Form field schemas.

## Scene compiler output

Initial Phase 4 structural format:

```text
• Scene definitions:
{scene_scene1} =
Scene: Scene 1
Content: {car}, {buildings}
Form:
• {car} — independent form: exclude {car} from the Global/default form. Use only: ...
Camera: ...
```

The leading bullet marks Scene output as a protected structural block in the current Natural output pipeline so the optimizer cannot split Scene definitions into ordinary comma-separated style instructions.

Wording/outer formatting is intentionally still open to refinement after running-app and generation tests. UI correctness is being validated before compiler wording is finalized.

## Derived Scene variables

Each Scene generates a module-owned reference variable:

```text
id: scene:<stable-scene-id>
entityType: scene
entityId: <stable-scene-id>
key: scene_<semantic-key>
type: reference
```

The module-level generic `{scene}` output variable is intentionally suppressed; Scene exposes child `{scene_*}` references instead.

Generated `scene_*` keys are reserved so user variables cannot collide with them.

## Missing-reference safety

Scene compile/editor warnings currently cover:

- missing/disabled content reference;
- missing/disabled/unavailable module entity reference;
- multiple references for a module whose Scene cardinality is `single`.

No missing ref is silently mapped to another entity.

## Layout runtime rule

Scene editor remains editable when Layout is inactive.

Scene compilation and active derived Scene variables are disabled until Layout is active.

This satisfies the persistence requirement before Phase 5 adds the actual Region → Scene relationship.

---

# Implementation phases and tracker

## Phase 0 — Baseline and source of truth

- [x] Confirm latest `main` baseline.
- [x] Create dedicated working branch from exact main SHA.
- [x] Create canonical refactor document.
- [x] Keep this document updated as architecture changes.

**Result:** complete.

## Phase 1 — Generic entity contracts

- [x] Audit repeatable entity/assignment patterns.
- [x] Define shared `ModuleEntity` contract.
- [x] Define capability metadata.
- [x] Define stable identity/reference rules.
- [x] Preserve top-level scalar state as global/default configuration.
- [x] Define backward-compatible optional `entities` state.
- [x] Keep Scene exposure separate from color/material semantic targeting.
- [x] Add focused type/runtime checks where practical.

**Result:** complete.

## Phase 2 — Form

- [x] Preserve current Form scalar state as global/default behavior.
- [x] Add repeatable Form entities using the generic contract.
- [x] Support subject/object semantic targets.
- [x] Reuse the generic entity editor.
- [x] Add dedicated scoped Form compiler behavior.
- [x] Preserve legacy scalar output when no entities exist.
- [x] Test named Form configurations and independent target behavior in the running app.
- [x] Add optional independent/no-global-inheritance behavior.

**Result:** complete and manually accepted.

## Phase 3 — Camera

- [x] Preserve existing Camera state as global/default behavior.
- [x] Add named Camera entities/configurations.
- [x] Avoid semantic subject/object targets for Camera.
- [x] Keep Camera entities Scene-exposable through capability metadata.
- [x] Keep named Camera entities out of global Camera compilation before Scene exists.
- [x] User-test Camera named configurations in the running app.
- [x] Verify old/no-entity Camera prompt output remains unchanged.
- [x] Add per-entity Camera preset selection.

**Result:** complete and manually accepted.

## Phase 4 — Scene module

- [x] Add Scene to module types/registry/schema.
- [x] Add `scene` to prompt-variable entity typing.
- [x] Implement specialized repeatable Scene entities.
- [x] Render Scene through the shared `ModulesPanelBase` Key Module shell.
- [x] Inject Scene editing via the schema-driven `sceneEntities` field type.
- [x] Implement Scene `content` references.
- [x] Include user subject/object/reference variables without requiring persisted `source: user` metadata.
- [x] Implement generic Scene `components` references.
- [x] Restrict component picker to Scene-exposable module entities.
- [x] Add per-module Scene selection cardinality metadata.
- [x] Generate derived Scene reference variables/tokens.
- [x] Use stable Scene ID and `moduleKey + entityId` reference identity.
- [x] Implement Scene compiler with generic scalar + Form adapter paths.
- [x] Define deterministic component ordering/deduplication.
- [x] Handle missing/deleted/disabled component references safely.
- [x] Handle missing/disabled content references safely.
- [x] Keep Scene state persisted/editable while Layout is inactive.
- [x] Protect Scene definitions from Natural prompt comma-splitting.
- [ ] User-test corrected Base-driven Scene UI in the running app.
- [ ] Validate/refine Scene compiler wording/outer formatting from real output.

**Exit condition:** A Scene composes content + at least Form and Camera references, exposes a stable Scene reference, and preserves missing-reference/layout-toggle behavior while behaving visually/interaction-wise as a normal Key Module.

**Current state:** implementation complete; corrected Base-driven UI validation pending.

## Phase 5 — Layout Region → Scene

- [ ] Introduce typed Layout content reference state or equivalent safe resolver.
- [ ] Preserve compatibility with existing `contentKey` strings.
- [ ] Add Scene as a first-class Region content option.
- [ ] Continue supporting user variables/custom content where valid.
- [ ] Store stable Scene identity rather than only generated token text.
- [ ] Compile Region content to the expected Scene token/value.
- [ ] Support one Scene referenced by multiple Regions.
- [ ] Handle missing/deleted Scenes safely.

**Exit condition:** Region → Scene works end-to-end.

## Phase 6 — Expand Scene-capable modules

Suggested incremental order:

- [ ] Background
- [ ] Lighting
- [ ] Style
- [ ] Effects
- [ ] Framing
- [ ] Texture / Material refinements
- [ ] Remaining suitable modules

For every conversion:

- preserve backward-compatible default behavior;
- reuse generic entity infrastructure where appropriate;
- expose only meaningful entities to Scene;
- document newly discovered constraints.

## Phase 7 — Generalize semantic target/reference catalog

- [ ] Audit specialized target picker overlaps.
- [ ] Define reusable reference/target catalog.
- [ ] Support module-specific eligibility policies.
- [ ] Preserve color/material capability filtering.
- [ ] Include relevant user subject/object variables.
- [ ] Include relevant module child entities.
- [ ] Include typography entities where valid.
- [ ] Preserve missing-reference recovery behavior.
- [ ] Migrate specialized editors where beneficial.

## Phase 8 — UX consolidation

- [ ] Consolidate generic entity list/editor interactions.
- [ ] Consolidate reference picker patterns.
- [ ] Keep global/default vs named configuration distinction obvious.
- [ ] Keep Scene Content and Configuration Components visually distinct.
- [ ] Optimize Region picker for Scene-first workflow.
- [ ] Improve missing-reference recovery UI.
- [ ] Validate mobile behavior with the existing component system.
- [ ] Complete Scene-specific localization/UX wording if needed.

## Phase 9 — Regression, migration, cleanup

- [ ] Older drafts load without destructive migration.
- [ ] Prompts with no Scene remain equivalent to previous behavior.
- [ ] Existing Layout content still works.
- [ ] Existing Pose/Expression/Color/Material semantics remain functional.
- [ ] Import/export JSON remains valid or is explicitly migrated.
- [ ] Entity rename/delete does not create unsafe orphan references.
- [ ] Remove transitional infrastructure only after consumers migrate.
- [ ] Update affected public/internal docs.
- [ ] Final user acceptance testing on working branch.

## Phase 10 — Merge readiness

- [ ] Rebase/validate against intended `main` if necessary.
- [ ] Pass refactor-specific tests and manual scenarios.
- [ ] Make this document reflect final architecture.
- [ ] Confirm no unrelated changes are included.
- [ ] Receive explicit final user approval.
- [ ] Merge/transfer to `main` only after that approval.

---

# Required manual test scenarios

## Scenario A — targeted Form

- Global scene remains normal or follows a global Form language.
- A named Form entity targets a specific subject/object.
- Optional Independent Form excludes that target from Global/default Form.
- Output scopes the local transformation without unintentionally applying it to everything.

**Status:** passed and accepted in Phase 2.

## Scenario B — Scene composition proof

Prepare:

```text
Content variables:
- {car}
- {buildings}

Named Camera entities:
- Camera A
- Camera B

Named Form entities:
- Melted Car
```

Create:

```text
Scene A
Content: {car}, {buildings}
Components: Camera A + Melted Car

Scene B
Content: {car}, {buildings}
Components: Camera B
```

Expected:

- Scene is rendered with the same Base Key Module shell/interactions as Camera/Form/etc.;
- `{car}` and `{buildings}` appear under user content in Content / Actors;
- system `{subject}` may also appear separately;
- two independent `{scene_*}` references are exposed while Layout is active;
- Scene A resolves Camera A + targeted Form;
- Scene B resolves Camera B without inheriting Scene A components;
- source Camera/Form entities are not copied into Scene state.

## Scenario C — stable rename/delete behavior

- rename a Scene; stable Scene ID remains unchanged;
- change Scene Semantic Key; token representation changes but identity remains stable;
- delete a referenced Camera/Form entity;
- Scene retains the old reference and reports it missing;
- Scene must never auto-select another configuration.

## Scenario D — Layout toggle persistence

- create Scenes and component assignments;
- disable Layout;
- Scene state remains visible/editable;
- Scene output and active `{scene_*}` references disappear;
- re-enable Layout;
- Scene definitions and references recover from persisted state.

## Scenario E — Camera cardinality

- Camera is single-selection inside one Scene;
- selecting Camera B replaces Camera A for that Scene;
- no Scene should compile two Camera entity configurations accidentally.

## Scenario F — backward compatibility

- load an old draft containing only singleton Form/Camera values;
- create no named entities or Scenes;
- previous prompt behavior remains intact.

---

# Implementation rules

1. Inspect latest working-branch history before each implementation session.
2. Read this file before architectural changes.
3. Prove infrastructure incrementally; do not convert every module at once.
4. Scene stores references; never duplicate module field schemas inside Scene.
5. Region owns the Scene content reference; Scene does not own Region.
6. Stable IDs are canonical identity; generated keys/tokens are representation.
7. Preserve existing scalar/global behavior unless an explicit backward-compatible migration is defined.
8. Prefer reusable contracts/editors over duplicated module-specific entity infrastructure.
9. **Every Key Module shell must remain Base-driven.** Domain-specific UI belongs in schema-injected field components unless an explicit architecture exception is documented and approved.
10. Keep compiler behavior explicit and testable rather than coupling semantics to UI structure.
11. Missing references must remain missing; never silently retarget by list position/name.
12. Keep unrelated feature work out of this branch.
13. Update this document in the same development cycle as meaningful architectural changes.
14. **Never merge to `main` without explicit final user approval.**

---

# Current checkpoint

As of the corrected Phase 4 UI checkpoint:

- Phase 1 generic repeatable-entity infrastructure is complete.
- Phase 2 Form is complete and manually accepted.
- Phase 3 Camera is complete and manually accepted.
- Scene is a registered Key Module with specialized `SceneEntity` state.
- Scene now uses `ModulesPanelBase` for the complete Key Module shell and interactions.
- Scene-specific editing is injected via `SceneModule.fields.scenes` with field type `sceneEntities` and `SceneEntitiesField.vue`.
- The earlier standalone Scene shell was removed; `panel/scene.vue` is now a thin compile/issues wrapper around Base.
- Content / Actors now reads user variables from `enabledPromptVariables` and normalizes missing source metadata, fixing `{car}` / `{buildings}` omission from the picker.
- Scene distinguishes Content / Actors from Configuration Components.
- Content references use stable variable IDs.
- Component references use stable `moduleKey + entityId` identity.
- Camera is single-select per Scene; Form is multi-select.
- Scene component discovery is driven by `sceneExposable` capability metadata, not hard-coded picker branches.
- Camera entities compile through the generic scalar entity resolver.
- Form entities compile through the dedicated Form entity adapter so target and Independent Form semantics are preserved.
- Derived `{scene_*}` reference variables are generated from Scene entities.
- Generated `scene_*` keys are reserved against user-variable collisions.
- Missing/disabled content and component refs produce warnings and are not silently retargeted.
- Scene state remains stored/editable with Layout off, while Scene compilation/reference exposure is disabled.
- Scene output is protected from Natural optimizer comma-splitting.
- Base English/Persian Scene localization is registered.
- The repository has no branch CI/typecheck workflow for this branch; running-app validation is the remaining Phase 4 acceptance gate.
- **Next action:** user pulls `refactor/scene-entity-composition`, validates the corrected Base-driven Scene UI and Content / Actors picker, then compiler wording is reviewed separately.
- `main` remains untouched and must remain untouched until explicit final approval.
