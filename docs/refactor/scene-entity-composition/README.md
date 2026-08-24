# Scene & Entity Composition Refactor

> **Status:** Phase 1 complete / Phase 2 ready
> **Working branch:** `refactor/scene-entity-composition`
> **Baseline main commit:** `83ed3e6374f8fc85e8a3b48f822cb75a1c1f862c`
> **Scope rule:** Until this refactor is accepted and merged, implementation work for this effort should stay on the working branch and unrelated project changes should be avoided.

## Why this document exists

This folder is the canonical reference for the Scene + repeatable module entity refactor. Any future development session or ChatGPT conversation continuing this work should read this file first, inspect the latest commit on `refactor/scene-entity-composition`, and continue from the current checklist instead of reconstructing the architecture from chat history.

Keep this document updated whenever an architectural decision changes, a phase is completed, or implementation discovers a constraint that affects later phases.

---

## Problem statement

Prompt Generator already has several semantic systems that can target entities, variables, typography elements, and module-owned child entities. Layout also exposes stable Region entities and Region reference tokens. However, most visual modules still behave as singleton configurations, and Layout regions cannot currently receive a complete independently configured scene without wiring many module configurations directly to each Region.

For example, a nine-region poster may require different Background, Camera, Pose, Lighting, Form, Material, Effects, and other configuration in each Region. Directly assigning each module to each Region creates excessive cross-module wiring and does not scale.

The refactor introduces two complementary concepts:

1. **Repeatable Module Entities** — modules that need multiple independent configurations can expose named entities/configurations instead of only one scalar state.
2. **Scene Entities** — a Scene composes references to existing module entities and scene content, then a Layout Region references the Scene as its content.

The intended relationship is:

```text
Global Module Defaults
        ↓ inheritance
Repeatable Module Entities
        ↓ references
Scene Entities
        ↓ content reference
Layout Regions
```

A Region should not need separate direct links to Camera, Background, Form, Lighting, Material, Pose, etc. It should normally need one Scene reference.

---

## Core architectural decisions

### 1. Scene is a real key module, not only a manual variable

Scene should be implemented as a structured module with repeatable Scene entities.

Each Scene entity must also be exposed through the existing prompt-variable catalog as a derived `reference` variable/token, following the same broad pattern already used for Layout Regions and other module entities.

Conceptually:

```text
Scene entity
   ↓
Derived PromptVariable
   ↓
{scene_*} token
```

Manual user-created reference variables remain an escape hatch, but they are not the primary Scene architecture.

### 2. Scene is composition, not duplicated module state

Scene must **not** embed copies of Camera, Background, Lighting, Form, Material, etc. settings.

Bad:

```ts
scene.camera.focalLength
scene.background.environment
scene.form.transformation
```

Preferred:

```ts
scene.components = [
  { moduleKey: "camera", entityId: "camera-wide" },
  { moduleKey: "background", entityId: "background-city" },
  { moduleKey: "form", entityId: "form-decay" },
]
```

Module entities remain the source of truth for their own configuration. Scene only composes references.

### 3. Region references Scene; Scene does not own Region

Canonical direction:

```text
Layout Region → Scene
```

Not:

```text
Scene → Layout Region
```

This allows one Scene to be reused by multiple Regions and avoids circular ownership.

Scene may be layout-aware for availability/compilation, but it must not store a canonical `regionId` ownership field.

### 4. Targets and layout scope are different concepts

Semantic targeting answers **what entity** a configuration applies to.

Layout scoping answers **where** it applies.

These should not be collapsed into one ambiguous target array.

Target direction:

```ts
type SemanticAssignment<T> = {
  id: string
  targets: SemanticTargetRef[]
  scopes: SemanticScopeRef[]
  payload: T
}
```

Examples:

- Form decay targets `building1` and `vehicle1`.
- Camera may have no semantic target but may be selected by a Scene used in a Region.
- Pose targets `person1`; the Scene/Region composition determines where that configured scene is used.

The exact final scope contract is still implementation work and must be validated against Scene composition before being generalized.

### 5. Global/default module state remains valid

Repeatable entities should not force users to duplicate common settings.

Existing scalar configuration should remain usable as the module's **global/default configuration**. Repeatable entities provide overrides or alternate configurations where needed.

This also provides the cleanest backward-compatible migration path for existing drafts.

### 6. Scene is layout-dependent at runtime, but Scene state must persist

Multiple Scenes only have meaningful output placement when Layout is active.

Expected UX:

```text
Layout inactive
→ Scene module unavailable/disabled for compilation
→ Scene state remains persisted

Layout active
→ Scene module available
→ Regions can select Scene content
```

Disabling Layout must not destroy Scene data.

### 7. Stable IDs are identity; tokens are representation

Cross-module references must be stored by stable entity identity wherever possible.

Tokens such as `{scene_city}` are compiled representations, not canonical identity.

Renaming a Scene, Region, or generated variable token must not silently break entity references.

---

## Target model

### Generic repeatable module entity

The shared Phase 1 contract is implemented in `app/modules/entityContracts.ts`.

```ts
type ModuleEntity<TPayload extends object = Record<string, unknown>> = {
  id: string
  key: string
  name: string
  enabled?: boolean
  payload: TPayload
}
```

Stable cross-module references use:

```ts
type ModuleEntityRef = {
  moduleKey: string
  entityId: string
  token?: string
  label?: string
}
```

Only `moduleKey + entityId` participate in canonical reference identity. `key`, `name`, `token`, and `label` are representation metadata and may change without invalidating the reference.

Module entity capabilities are kept separate from existing color/material semantic-target capabilities:

```ts
type ModuleEntityConfig = {
  enabled: boolean
  sceneExposable?: boolean
  targetPolicy?: Array<"subject" | "object">
}
```

The initial capability registry in `app/modules/entityCapabilities.ts` enables the two proof modules:

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

Camera is intentionally scene-exposable while having no semantic subject/object target policy. This is the concrete reason scene exposure must remain distinct from semantic target eligibility.

### Global/default state and named entity state

The existing top-level `ModuleValues` object remains the module's global/default configuration.

Generic named scalar-module entities use the optional reserved sibling state key:

```ts
{
  // existing scalar/global fields remain unchanged
  formLanguage: "geometric",
  proportions: "balanced",

  // optional new state
  entities: [
    {
      id: "form-abc123",
      key: "decayedBuilding",
      name: "Decayed Building",
      payload: {
        proportions: "elongated",
      },
    },
  ],
}
```

Entity payloads are **partial patches** over the top-level global/default values. Omitted or `undefined` payload keys inherit from the global configuration. Explicit empty strings, `null`, `false`, and empty arrays remain valid overrides.

The generic helpers in `entityContracts.ts` provide normalization, collection read/write, global-value extraction, entity-value resolution, stable ref construction/comparison, and capability queries.

### Backward-compatible migration behavior

Existing scalar drafts do not require a destructive migration.

If the optional `entities` key is absent:

```text
legacy scalar ModuleValues
→ global/default configuration remains unchanged
→ generic entity collection normalizes to []
→ existing compiler behavior is unchanged
```

No existing compiler currently consumes the reserved entity state key. Form and Camera conversion phases must continue to preserve scalar output when no named entities exist.

### Specialized entity-owning modules

Hair and Outfit already use stable module-owned entity structures with the same core identity principles (`id`, semantic `key`, editable `name`) but richer domain-specific shapes.

They are **not** forced into generic scalar `payload` storage. Later generic reference/catalog work should adapt their existing entities where useful rather than rewriting them into an unnatural structure.

The same principle applies to other already-structured systems such as Typography and Layout Regions.

### Scene entity

Conceptual model:

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

Conceptual component reference:

```ts
type SceneComponentRef = {
  moduleKey: string
  entityId: string
  token?: string
  label?: string
}
```

Scene component references should be generic. The Scene type must not require a new property every time a module is added.

### Scene content vs Scene configuration

Scene should distinguish between:

**Content / actors**

- subject variables
- object variables
- typography groups/texts when appropriate
- other semantic scene content

and:

**Configuration components**

- Background
- Camera
- Form
- Lighting
- Style
- Material / Texture
- Effects
- Framing
- Pose / Expression configurations where applicable
- future scene-exposable modules

This distinction should remain visible in both data and UI.

### Layout content reference

`LayoutRegion.contentKey` is currently string-oriented. The refactor should move the editing/state model toward a stable typed reference while preserving backward-compatible compilation.

Conceptual model:

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

Compiler output may still emit the resolved token/string used by the existing Layout prompt format.

---

## General target/catalog direction

The project currently has specialized target-selection paths. The long-term direction is one reusable semantic entity/reference catalog with module-specific eligibility policies rather than separate hard-coded pickers for every module.

A module should declare what it can target or expose, and generic UI/resolvers should derive valid choices.

Examples:

```ts
Form:     subject + object targets
Pose:     subject targets
Material: subject + object + supported module entities
Camera:   usually no semantic entity target; Scene composition supplies placement
```

Do not generalize this prematurely before the Scene/entity contracts are stable.

---

## Module conversion strategy

Not every module needs identical behavior.

### Highest priority / best first candidates

- **Form** — strong repeatable-entity candidate; useful for different transformations on different semantic entities.
- **Camera** — strong repeatable-entity candidate; essential for independently configured scenes.
- **Background** — strong Scene component candidate.
- **Lighting** — strong Scene component candidate.

### Already structurally advanced / use as references

- **Pose** — already uses repeatable target assignments and is a useful proof of concept.
- **Expression** — similar direction to Pose.
- **Hair** — already has module-owned entities/components.
- **Outfit** — already has module-owned sets/items.
- **Typography** — already has hierarchical entities.
- **Color / Material semantic targeting** — useful reference for the generalized semantic catalog.

### Later candidates

- Style
- Effects
- Framing
- Texture / Material integration details
- Background refinements
- other visual modules after the generic contract proves stable

### Infrastructure modules

- **Layout** exposes Regions and consumes Scene references; it should not become the owner of every module configuration.
- **Variables** remains reference infrastructure and should not become the source of truth for structured Scene definitions.

---

## Phase 1 audit findings

The Phase 1 source audit covered the current state/type/compiler/reference patterns needed to define the generic contract.

Key findings:

- `PromptKeyModule` values are persisted as direct `ModuleValues`; wrapping existing module state inside a new container would be unnecessarily destructive.
- `createDefaultModuleValues()` creates only declared module fields, and generic compilation reads declared fields. An optional sibling entity collection therefore does not change legacy scalar compilation by itself.
- Form and Camera are currently scalar modules and are suitable proof modules for inheritance from global/default values.
- Pose and Expression already model repeatable target-oriented assignments and remain useful compiler/UI references, but their assignment payloads should not become the generic storage shape for every module.
- Hair and Outfit already establish stable persistence identity with `id`, semantic `key`, and editable `name`; nested child identity also uses stable IDs.
- Layout Regions already generate/persist stable Region IDs and derive variable references from them.
- `promptVariableCatalog` consistently treats module-child IDs as persistence identity while generated keys/tokens are representation.
- `semanticTargetIdentity()` already prefers `entityId` for module child entities, reinforcing the stable-ID rule.
- Existing `semanticTargets` module metadata is specifically about color/material capability filtering. Scene exposure must remain a separate capability axis.
- The repository currently has no dedicated unit-test framework or standalone typecheck script in `package.json`; Phase 1 therefore uses `satisfies`-based type checks plus strict TypeScript/runtime invariant validation of the new isolated contracts without introducing new dependencies.

---

## Implementation phases and tracker

### Phase 0 — Baseline and source of truth

- [x] Confirm latest `main` baseline.
- [x] Create dedicated working branch from exact main SHA.
- [x] Create this canonical refactor document.
- [x] From now on, update this document when decisions or phase status change.

### Phase 1 — Define generic entity contracts

Goal: establish the smallest reusable infrastructure before converting many modules.

- [x] Audit current module state/type contracts that represent repeatable entities or assignments.
- [x] Define shared `ModuleEntity` / entity metadata contract.
- [x] Define module-level entity capability/configuration metadata.
- [x] Define stable reference identity rules.
- [x] Decide how global/default configuration and named entities coexist in module state.
- [x] Define migration behavior for existing scalar drafts.
- [x] Define scene-exposable eligibility without overloading existing color/material semantic capabilities.
- [x] Add tests/type-level checks where practical before UI conversion.

**Exit condition:** Form and Camera can adopt the contract without bespoke architecture and existing drafts remain valid.

**Phase 1 result:** Exit condition satisfied. The shared contract is implemented, Form/Camera capability metadata is available through the module registry, old scalar state remains the global/default state, and no existing compiler/UI behavior was replaced.

### Phase 2 — Convert Form as first generic repeatable module

- [ ] Preserve current Form scalar state as global/default behavior.
- [ ] Add repeatable Form entities/configurations using the generic contract.
- [ ] Support semantic targets appropriate for Form, especially subject/object references.
- [ ] Reuse generic entity editor UI primitives where possible.
- [ ] Add dedicated Form compiler handling only where generic compilation is insufficient.
- [ ] Confirm old Form drafts compile identically when no entities are added.
- [ ] Test multiple Form configurations against multiple target entities.

**Exit condition:** Form proves the generic repeatable entity architecture works for a normal scalar module.

### Phase 3 — Convert Camera as second generic repeatable module

- [ ] Preserve existing Camera state as global/default behavior.
- [ ] Add named Camera entities/configurations.
- [ ] Avoid forcing semantic subject/object targets onto Camera if they are not meaningful.
- [ ] Ensure Camera entities can be exposed to Scene composition.
- [ ] Verify current Camera output remains unchanged without named entities.

**Exit condition:** The entity contract works for both a target-oriented module (Form) and a scene-configuration module (Camera).

### Phase 4 — Introduce Scene module

- [ ] Add Scene to module types/registry/schema.
- [ ] Add `scene` to prompt-variable entity typing where required.
- [ ] Implement repeatable Scene entities.
- [ ] Implement Scene `content` references.
- [ ] Implement generic Scene `components` references.
- [ ] Restrict Scene component picker to scene-exposable module entities.
- [ ] Generate derived reference variables/tokens for Scenes in `promptVariableCatalog`.
- [ ] Ensure Scene reference identity uses stable `entityId`.
- [ ] Implement Scene compiler format.
- [ ] Define ordering/deduplication behavior for Scene components.
- [ ] Handle missing/deleted referenced entities gracefully.
- [ ] Keep Scene state persisted while Layout is inactive.

**Exit condition:** A Scene can compose content + at least Form/Camera references and compile into a reusable Scene token/value.

### Phase 5 — Connect Layout Regions to Scenes

- [ ] Introduce typed Layout content reference state or equivalent safe resolver.
- [ ] Preserve compatibility with existing `contentKey` strings.
- [ ] Add Region content picker with Scene as a first-class option.
- [ ] Continue supporting user variables/custom content where valid.
- [ ] Store stable Scene identity rather than only generated token text.
- [ ] Compile Region content to the expected Scene token/value.
- [ ] Support one Scene referenced by multiple Regions.
- [ ] Handle deleted/missing Scenes without corrupting Layout state.

**Exit condition:** `Region → Scene` works end to end and a multi-region Layout can assign different Scenes without direct per-module wiring.

### Phase 6 — Expand Scene-capable modules

Convert modules incrementally, not all at once.

Suggested order:

- [ ] Background
- [ ] Lighting
- [ ] Style
- [ ] Effects
- [ ] Framing
- [ ] Texture / Material refinements
- [ ] Remaining suitable modules

For every conversion:

- preserve backward-compatible default behavior;
- avoid module-specific duplicate entity infrastructure;
- expose only meaningful entities to Scene;
- update this tracker with discovered constraints.

### Phase 7 — Generalize semantic target/reference catalog

Only after Scene + entity contracts are proven:

- [ ] Audit `useSubjectAssignmentTargets` and semantic target catalog overlaps.
- [ ] Define one reusable reference/target catalog.
- [ ] Support module-specific eligibility policies.
- [ ] Preserve color/material capability filtering.
- [ ] Include relevant user subject/object variables.
- [ ] Include relevant module child entities.
- [ ] Include typography entities where valid.
- [ ] Include stable missing-reference recovery behavior.
- [ ] Migrate Pose/Expression and other assignment editors to shared infrastructure where beneficial.

### Phase 8 — UX consolidation

- [ ] Generic entity list/editor interaction.
- [ ] Add / duplicate / rename / delete entity actions.
- [ ] Generic reference picker patterns.
- [ ] Clear distinction between global defaults and named entities.
- [ ] Scene editor separated into Content and Configuration Components.
- [ ] Region content picker optimized for Scene-first workflow.
- [ ] Missing reference warnings and recovery UI.
- [ ] Mobile behavior using the project's existing component system.

### Phase 9 — Regression, migration, and cleanup

- [ ] Existing saved drafts load without destructive migration.
- [ ] Existing prompts with no Scene compile the same as before.
- [ ] Existing Layout region content continues to work.
- [ ] Existing Pose/Expression/Color/Material semantics remain functional.
- [ ] Imported/exported JSON remains valid or is explicitly migrated.
- [ ] No orphan generated variables after entity deletion/rename.
- [ ] Remove transitional module-specific infrastructure only after all consumers migrate.
- [ ] Update public/internal documentation affected by the refactor.
- [ ] Final user acceptance testing on the working branch.

### Phase 10 — Merge readiness

- [ ] Branch is rebased/validated against the intended main baseline if necessary.
- [ ] All refactor-specific tests and manual scenarios pass.
- [ ] This document reflects final architecture rather than obsolete plans.
- [ ] No unrelated changes are included.
- [ ] User gives explicit final approval.
- [ ] Merge/refactor transfer to `main` only after final approval.

---

## Required manual test scenarios

These scenarios should guide implementation and acceptance testing.

### Scenario A — targeted Form inside one scene

- City scene is globally normal.
- Building and vehicle variables exist.
- A named Form entity applies strong decay to those objects.
- Scene references the Form entity.
- Region references the Scene.
- Compiled prompt clearly scopes the decay without making the entire image decayed.

### Scenario B — independent multi-region cameras

- Layout contains multiple Regions.
- Region 1 references Scene A with Camera A.
- Region 2 references Scene B with Camera B.
- Camera settings differ significantly.
- No direct Camera → Region wiring is necessary.

### Scenario C — nine-region poster

- Nine Regions exist.
- Several Scenes are created and reused.
- Each Scene may combine distinct Background, Camera, Lighting, Form, Pose/content, etc.
- Regions only select Scene/content references.
- Reusing the same Scene in multiple Regions remains stable.

### Scenario D — Layout disabled and re-enabled

- Create Scenes and Region assignments.
- Disable Layout.
- Scene data remains stored but does not produce invalid scene-layout compilation.
- Re-enable Layout.
- Scene and Region references recover intact.

### Scenario E — rename/delete safety

- Rename a Scene or module entity.
- Stable references continue working.
- Delete a referenced entity.
- Scene/Region reports a missing reference instead of silently pointing at a different entity.

### Scenario F — backward compatibility

- Load an older draft containing only singleton Form/Camera configuration.
- Do not create any named entities or Scenes.
- Prompt output remains equivalent to current main behavior.

---

## Implementation rules

1. **Inspect the latest working-branch history before every implementation session.**
2. **Read this file before making architectural changes.**
3. **Do not implement all modules at once.** Prove the contract with Form and Camera first.
4. **Do not duplicate module field schemas inside Scene.** Scene stores references.
5. **Do not make Scene own Regions.** Region consumes Scene.
6. **Do not use generated tokens as canonical identity when stable entity IDs are available.**
7. **Do not replace existing scalar/global behavior without a backward-compatible migration path.**
8. **Prefer reusable contracts and editors over one-off `*Assignments` / `*Entities` implementations.** Specialized UI is allowed when the module genuinely requires it.
9. **Keep compile behavior explicit and testable.** UI structure and compiler semantics should not be coupled unnecessarily.
10. **Update this document whenever implementation changes the plan.**
11. **Keep unrelated feature work out of this branch.**
12. **Do not merge to `main` until explicit final user approval.**

---

## Instructions for future ChatGPT/development sessions

When continuing this refactor in another conversation:

1. Open repository `MetTheVeloper/prompt-draft`.
2. Inspect branch `refactor/scene-entity-composition` and its latest commit.
3. Read `docs/refactor/scene-entity-composition/README.md` completely.
4. Check the current phase/checklist in this file.
5. Inspect the actual current source files relevant to the next unchecked step; do not rely only on this document or old chat context.
6. Make changes only on the working branch unless explicitly instructed otherwise.
7. Update this document in the same development cycle when a decision, phase status, migration rule, or implementation constraint changes.
8. Stop before merging to `main`; final merge requires explicit user approval.

Suggested continuation prompt:

```text
Read the latest history of branch `refactor/scene-entity-composition` and then read
`docs/refactor/scene-entity-composition/README.md` as the source of truth.
Continue from the first incomplete implementation phase, validating the current source before making changes.
Do not merge to main without my explicit approval.
```

---

## Current checkpoint

As of completion of Phase 1:

- The generic repeatable scalar-module entity contract lives in `app/modules/entityContracts.ts`.
- The optional `entities` sibling state preserves existing top-level `ModuleValues` as global/default configuration.
- Entity payloads are partial patches resolved over those global/default values.
- Stable generic references use `moduleKey + entityId`; token/key/name changes are non-identity changes.
- Form and Camera entity capability metadata is attached in the module registry through `app/modules/entityCapabilities.ts`.
- Form is target-capable for subject/object entities; Camera has no semantic target policy but is scene-exposable.
- Existing color/material `semanticTargets` capability metadata remains separate and unchanged.
- Hair, Outfit, Typography, and Layout keep their specialized entity structures; the generic contract does not force a storage rewrite.
- Existing UI and compiler behavior has not been replaced by Phase 1.
- Strict TypeScript validation and focused runtime invariant checks passed for the new contract in isolation; the repository has no dedicated test runner/typecheck script and branch pushes do not trigger the production-only workflow.
- The next implementation task is **Phase 2: convert Form into the first generic repeatable module while proving legacy scalar Form output remains unchanged when no entities are present**.
