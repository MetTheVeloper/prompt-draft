# Scene & Entity Composition Refactor

> **Status:** Phase 2 complete / Phase 3 implemented, user validation pending
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

## Goal

Prompt Generator already has semantic targets, prompt variables, Layout Regions, Typography entities, Hair entities, Outfit sets/items, and specialized assignment systems. Most visual modules, however, still behave as singleton configurations.

The refactor introduces two complementary concepts:

1. **Repeatable Module Entities** — named reusable configurations owned by a module.
2. **Scene Entities** — reusable scene compositions that reference existing module entities and semantic content.

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

Scene will be implemented as a structured key module with repeatable Scene entities.

Each Scene entity will also be exposed through the prompt-variable catalog as a derived `reference` variable/token:

```text
Scene entity
   ↓
Derived PromptVariable
   ↓
{scene_*}
```

Manual user-created reference variables remain an escape hatch, not the primary Scene model.

## 2. Scene composes references; it does not duplicate module state

Bad:

```ts
scene.camera.focalLength
scene.form.transformation
scene.background.environment
```

Preferred:

```ts
scene.components = [
  { moduleKey: "camera", entityId: "camera-entity-id" },
  { moduleKey: "form", entityId: "form-entity-id" },
  { moduleKey: "background", entityId: "background-entity-id" },
]
```

The source of truth for each configuration remains inside its owning module.

## 3. Canonical ownership is Region → Scene

```text
Layout Region → Scene
```

Scene must not canonically own a Region. One Scene may be reused by multiple Regions.

## 4. Semantic target and layout scope are different concepts

Semantic targeting answers **what entity** receives a configuration.

Layout scoping answers **where** a configured scene is placed.

Do not collapse these into one ambiguous target array.

Examples:

- Form may target `{person}`, `{car}`, or other subject/object references.
- Camera normally has no subject/object semantic target.
- Scene composition selects a Camera entity.
- Layout Region selects a Scene.

## 5. Existing scalar module state remains global/default state

A module converted to repeatable entities keeps its existing top-level `ModuleValues` as its global/default configuration.

Named configurations coexist under an optional sibling `entities` key.

This is the primary backward-compatibility strategy for old drafts.

## 6. Named entities may inherit or be independent

Generic module entities now support:

```ts
inheritGlobal?: boolean
```

Semantics:

- missing / `true` → inherit global/default values;
- `false` → do not inherit global/default values; only local payload values are used.

The default is intentionally inheriting, so existing entity state written before this flag remains compatible.

Form exposes this as **Independent Form**.

## 7. Scene can depend on Layout at runtime without losing state

Expected behavior:

```text
Layout inactive
→ Scene compilation/placement unavailable
→ Scene state remains persisted

Layout active
→ Scene available
→ Regions can reference Scenes
```

Disabling Layout must not destroy Scene state.

## 8. Stable IDs are identity; names/tokens are representation

Cross-module references must use stable entity identity whenever available.

Renaming an entity, changing its semantic key, or regenerating its token must not silently invalidate references.

---

# Implemented generic entity contract

Shared infrastructure lives primarily in:

- `app/modules/entityContracts.ts`
- `app/modules/entityCapabilities.ts`
- `app/modules/registry.ts`
- `app/components/modules/shared/ModuleEntitiesField.vue`

## Generic entity

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

Stable cross-module reference:

```ts
type ModuleEntityRef = {
  moduleKey: string
  entityId: string
  token?: string
  label?: string
}
```

Only `moduleKey + entityId` participate in canonical identity.

## Module entity capability metadata

```ts
type ModuleEntityConfig = {
  enabled: boolean
  sceneExposable?: boolean
  targetPolicy?: Array<"subject" | "object">
}
```

Current proof-module capabilities:

```ts
form: {
  enabled: true,
  sceneExposable: true,
  targetPolicy: ["subject", "object"],
}

camera: {
  enabled: true,
  sceneExposable: true,
  targetPolicy: [],
}
```

Scene exposure is deliberately separate from the existing color/material `semanticTargets` capability metadata.

## State model

Example:

```ts
{
  // existing scalar/global/default module values
  formLanguage: "geometric",
  proportions: "balanced",

  entities: [
    {
      id: "form-entity-stable-id",
      key: "meltedCar",
      name: "Melted Car",
      inheritGlobal: false,
      targets: [...],
      payload: {
        formLanguage: "melted",
        transformation: "offset_segments",
      },
    },
  ],
}
```

Entity payloads are partial patches.

When inheritance is enabled, omitted fields resolve from global/default state.

When inheritance is disabled, omitted fields are genuinely unset for that entity.

Explicit empty strings, `null`, `false`, and empty arrays remain explicit values rather than implicit inheritance.

## Specialized existing modules

Hair, Outfit, Typography, Layout Regions, Pose, and Expression already contain richer entity/assignment structures.

They are not forced into generic scalar payload storage. Later phases should adapt their stable references where useful rather than destructively rewriting domain-specific state.

---

# Form implementation result — Phase 2

Form is the proof for a **target-oriented repeatable scalar module**.

Implemented files include:

- `app/utils/compileForm.ts`
- `app/components/modules/panel/form.vue`
- `app/components/modules/shared/ModuleEntitiesField.vue`
- `app/composables/prompt/useModuleEntityTargets.ts`

## Behavior

- Existing Form scalar state remains global/default state.
- Named Form configurations use the generic `entities` collection.
- Form entities can target subject/object semantic references.
- The generic editor supports add, duplicate, rename, delete, enable/disable, target selection, per-field overrides, compatibility hints, and inheritance.
- Existing stable IDs remain unchanged when Name or Semantic Key changes.
- Form has a dedicated compiler because targeted scoped output cannot be represented correctly by the generic scalar compiler.
- No named entities → legacy scalar Form output remains unchanged.

## Independent Form

A Form entity may disable global inheritance.

UI concept:

```text
Independent Form
Do not inherit or apply the Global/default configuration to this target.
Only local overrides are used.
```

Compiler wording accepted after real generation tests:

```text
• {target} — independent form: exclude {target} from the Global/default form. Use only: [local specification]
```

Example:

```text
Form:
• Global/default form: realistic and natural forms
• {car} — independent form: exclude {car} from the Global/default form. Use only: melted physical behavior, offset segmented form with displaced structural sections
```

## Phase 2 manual validation

Phase 2 was manually tested in the running application with a vehicle target and several generated-image comparisons.

Observed behavior:

- inherited Form entities correctly combine global/default values with local overrides;
- Independent Form removes inherited values from the entity specification;
- explicit exclusion wording keeps target-specific melted/deformed behavior substantially better isolated from the environment;
- a neutral Global/default Form (`realistic and natural forms`) produces a clear normal-environment + transformed-target separation;
- an aggressive Global/default Form can still style the surrounding scene while the independent target retains its own distinct Form specification;
- the resulting behavior matches the intended global-rule + explicit-target-exception model.

Phase 2 is accepted as complete.

---

# Camera implementation direction — Phase 3

Camera is the proof for a **scene-oriented repeatable scalar module**.

Unlike Form, named Camera entities do not receive subject/object targets.

A Camera entity represents a reusable scene configuration that will later be selected by Scene composition.

Current implementation:

- `app/components/modules/panel/camera.vue` wraps the existing Camera scalar panel.
- `ModuleEntitiesField.vue` is reused for named Camera configurations.
- Camera entity target policy is empty, so no `Apply To` picker is shown.
- Named Camera configurations inherit global/default Camera values through the same generic payload resolver.
- Named Camera configurations are intentionally **not compiled into the current global Camera prompt output**. Compiling several cameras globally before Scene exists would create ambiguous/conflicting camera instructions.
- Existing Camera compilation remains owned by the existing scalar compiler.
- Camera capability metadata already marks it `sceneExposable: true`, so Phase 4 can discover it for Scene composition without adding Camera-specific Scene wiring.

Current Phase 3 state: implementation is present; user validation in the running app is still required before the phase is marked complete.

---

# Scene target model

Conceptual Scene entity:

```ts
type SceneEntity = {
  id: string
  key: string
  name: string
  description?: string
  content: SceneContentRef[]
  components: SceneComponentRef[]
  extraDetails?: string
}
```

Generic component reference:

```ts
type SceneComponentRef = {
  moduleKey: string
  entityId: string
  token?: string
  label?: string
}
```

Scene should distinguish:

### Content / actors

- subject variables
- object variables
- typography groups/texts where appropriate
- other semantic content references

### Configuration components

- Camera
- Form
- Background
- Lighting
- Style
- Effects
- Framing
- Material / Texture
- Pose / Expression configurations where meaningful
- future modules marked scene-exposable

Scene component references remain generic. Do not add a hard-coded property per module.

---

# Layout content direction

Current `LayoutRegion.contentKey` is string-oriented.

Long-term editing/state direction:

```ts
type LayoutContentRef = {
  kind: "scene" | "variable" | "module_entity" | "custom"
  entityId?: string
  variableId?: string
  moduleKey?: string
  token?: string
  value?: string
}
```

Compilation may still resolve this to the token/string expected by the existing Layout prompt format.

---

# General target/reference catalog direction

The project currently has several specialized picker paths.

Long-term direction: one reusable semantic entity/reference catalog with module-specific eligibility policies.

Examples:

```text
Form     → subject + object
Pose     → subject
Material → supported semantic/module entities
Camera   → no semantic target; selected by Scene
```

Do not generalize this prematurely before Scene composition proves the final reference requirements.

---

# Implementation phases and tracker

## Phase 0 — Baseline and source of truth

- [x] Confirm latest `main` baseline.
- [x] Create dedicated working branch from exact main SHA.
- [x] Create canonical refactor document.
- [x] Keep this document updated as architecture changes.

## Phase 1 — Generic entity contracts

- [x] Audit repeatable entity/assignment patterns.
- [x] Define shared `ModuleEntity` contract.
- [x] Define capability metadata.
- [x] Define stable identity/reference rules.
- [x] Preserve top-level scalar state as global/default configuration.
- [x] Define backward-compatible optional `entities` state.
- [x] Keep scene exposure separate from color/material semantic targeting.
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

**Exit condition:** Form proves the entity model for a target-oriented scalar module.

**Result:** complete and manually accepted.

## Phase 3 — Camera

- [x] Preserve existing Camera state as global/default behavior.
- [x] Add named Camera entities/configurations.
- [x] Avoid semantic subject/object targets for Camera.
- [x] Keep Camera entities scene-exposable through capability metadata.
- [x] Keep named Camera entities out of global Camera compilation before Scene exists.
- [ ] User-test Camera named configurations in the running app.
- [ ] Verify old/no-entity Camera prompt output remains unchanged in the running app.

**Exit condition:** The same generic contract works for both target-oriented Form and scene-oriented Camera.

**Current state:** implementation done; manual validation pending.

## Phase 4 — Scene module

- [ ] Add Scene to module types/registry/schema.
- [ ] Add `scene` to prompt-variable entity typing where required.
- [ ] Implement repeatable Scene entities.
- [ ] Implement Scene `content` references.
- [ ] Implement generic Scene `components` references.
- [ ] Restrict Scene component picker to scene-exposable module entities.
- [ ] Generate derived Scene reference variables/tokens.
- [ ] Use stable `entityId` for Scene reference identity.
- [ ] Implement Scene compiler format.
- [ ] Define component ordering/deduplication.
- [ ] Handle missing/deleted component references safely.
- [ ] Keep Scene state persisted while Layout is inactive.

**Exit condition:** A Scene composes content + at least Form and Camera references and compiles into a reusable Scene reference/value.

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

## Phase 7 — Generalize target/reference catalog

- [ ] Audit specialized target picker overlaps.
- [ ] Define reusable reference/target catalog.
- [ ] Support module-specific eligibility policies.
- [ ] Preserve color/material capability filtering.
- [ ] Include relevant user subject/object variables.
- [ ] Include relevant module child entities.
- [ ] Include typography entities where valid.
- [ ] Preserve missing-reference recovery behavior.
- [ ] Migrate existing specialized editors where beneficial.

## Phase 8 — UX consolidation

- [ ] Consolidate generic entity list/editor patterns.
- [ ] Consolidate add/duplicate/rename/delete interactions.
- [ ] Consolidate reference picker patterns.
- [ ] Keep global/default vs named configuration distinction obvious.
- [ ] Separate Scene Content and Configuration Components in UI.
- [ ] Optimize Region picker for Scene-first workflow.
- [ ] Add missing-reference warnings/recovery UI.
- [ ] Validate mobile behavior with the existing component system.

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

# Required manual scenarios

## Scenario A — targeted Form

- Global scene remains normal or follows a global Form language.
- A named Form entity targets a specific subject/object.
- Optional Independent Form excludes that target from Global/default Form.
- Output scopes the local transformation without unintentionally applying it to everything.

**Phase 2 proof:** manually exercised with a vehicle target and generated images; accepted.

## Scenario B — independent multi-region cameras

- Layout contains multiple Regions.
- Scene A references Camera A.
- Scene B references Camera B.
- Camera configurations differ significantly.
- Regions reference Scenes, not Camera directly.

## Scenario C — nine-region poster

- Nine Regions exist.
- Several Scenes are created/reused.
- Scenes combine distinct Camera, Background, Lighting, Form, content, etc.
- Regions select Scene references only.

## Scenario D — Layout toggle persistence

- Create Scenes and Region assignments.
- Disable Layout.
- Scene state remains stored.
- Re-enable Layout.
- Scene/Region references recover intact.

## Scenario E — rename/delete safety

- Rename Scene/module entities without breaking stable references.
- Delete referenced entities and surface missing references rather than silently retargeting.

## Scenario F — backward compatibility

- Load an old draft with only singleton Form/Camera values.
- Create no named entities or Scenes.
- Prompt output remains equivalent to previous behavior.

---

# Implementation rules

1. Inspect latest working-branch history before each implementation session.
2. Read this file before architectural changes.
3. Prove infrastructure incrementally; do not convert every module at once.
4. Scene stores references; never duplicate module field schemas inside Scene.
5. Region owns the Scene content reference; Scene does not own Region.
6. Stable IDs are canonical identity; generated keys/tokens are representation.
7. Preserve existing scalar/global behavior unless an explicit backward-compatible migration is defined.
8. Prefer reusable contracts/editors over module-specific duplicate entity infrastructure.
9. Specialized UI is acceptable only when the module genuinely requires different semantics.
10. Keep compiler behavior explicit and testable rather than coupling semantics to UI structure.
11. Keep unrelated feature work out of this branch.
12. Update this document in the same development cycle as meaningful architectural changes.
13. **Never merge to `main` without explicit final user approval.**

---

# Current checkpoint

As of the latest working-branch implementation:

- Phase 1 generic entity infrastructure is complete.
- Phase 2 Form conversion is complete and manually accepted with real generated-image testing.
- Form supports global/default inheritance, per-field local overrides, subject/object targeting, and optional Independent Form behavior.
- Independent Form uses `inheritGlobal: false` and compiler wording: `exclude {target} from the Global/default form. Use only: ...`.
- Camera now has repeatable named configurations using the same generic entity editor.
- Camera entities intentionally have no semantic target picker.
- Camera entities remain scene-only configurations and do not alter the current global Camera output.
- Camera is already marked scene-exposable through entity capability metadata.
- Phase 3 implementation is ready for manual running-app validation.
- After Phase 3 validation, the next implementation phase is **Phase 4: introduce the Scene module and compose stable references to at least Form + Camera entities**.
- `main` remains untouched by this refactor and must remain untouched until explicit user approval.
