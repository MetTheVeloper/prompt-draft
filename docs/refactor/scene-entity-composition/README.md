# Scene & Entity Composition Refactor

> **Status:** Phase 5 complete / Phase 6 in progress — Framing implemented, validation pending
> **Working branch:** `refactor/scene-entity-composition`
> **Baseline main commit:** `83ed3e6374f8fc85e8a3b48f822cb75a1c1f862c`
> **Scope rule:** all refactor work stays on the working branch. Never merge or transfer to `main` without explicit final user approval.

## Source-of-truth rule

Every development session must:

1. inspect the latest working-branch history;
2. read this document before architectural changes;
3. continue from the first incomplete phase;
4. inspect current source before patching;
5. update this document whenever architecture, migration behavior, or phase status changes.

---

# Goal

Prompt Draft already supports semantic targets, prompt variables, Layout Regions, Typography entities, Hair entities, Outfit sets/items, and specialized assignment systems. This refactor adds:

1. **Repeatable Module Entities** — named reusable configurations owned by a module.
2. **Scene Entities** — reusable nested scene definitions that reference named module configurations.
3. **Stable Region → Scene binding** — Layout Regions own Scene placement through stable references instead of fragile token strings.

Target architecture:

```text
Global Module Defaults
        ↓ optional inheritance
Repeatable Module Entities
        ↓ stable references
Scene Entities
        ↓ stable scene reference
Layout Regions
```

A Layout Region references one Scene. A Scene references named module configurations such as Camera, Form, Framing, and later other scene-capable modules.

---

# Core architectural decisions

## 1. Stable IDs are identity

Names, semantic keys, and generated tokens are representation. Cross-module references use stable IDs.

Module entity identity:

```text
moduleKey + entityId
```

Scene identity:

```text
scene.id
```

Region → Scene identity:

```text
contentRef.kind = "scene"
contentRef.entityId = scene.id
```

Renaming a Scene or changing its semantic key may change `{scene_*}` representation but must not change persistence identity. Missing references remain missing and must never silently retarget.

## 2. Scalar module values remain global/default

Existing top-level scalar module state remains the backward-compatible global/default configuration. Named entities live under the optional `entities` sibling state.

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

`inheritGlobal` semantics:

- omitted / `true`: local payload overlays global/default values;
- `false`: entity resolves from local payload only.

Older drafts without `entities` remain valid.

## 3. Scene-exposure and semantic targeting are separate axes

Current generic entity capabilities:

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

framing: {
  enabled: true,
  sceneExposable: true,
  sceneSelection: "single",
  targetPolicy: [],
}
```

Camera and Framing are scene-oriented resources and do not need subject/object targets. Form may contribute several target-specific configurations to one Scene.

## 4. Every Key Module shell is Base-driven

Specialized behavior belongs in fields or thin wrappers; the outer Key Module shell must use `ModulesPanelBase` unless an explicit architecture exception is documented.

```text
Key Module
→ ModulesPanelBase
→ schema field / thin wrapper
→ specialized editor only where required
```

This preserves shared header/status, expand/collapse, preview, copy, clear/delete, right-click context menu, responsive layout, and visual styling.

Scene uses `sceneEntities` as a schema field rendered by `SceneEntitiesField.vue`.

Generic scalar Scene resources use `panel/scene-resource.vue` plus `ModuleEntitiesField.vue`.

## 5. Scene Description is canonical scene content

The first Scene prototype had a separate **Content / Actors** picker. Real workflow testing showed that it duplicated information already expressed more precisely through nested Description text.

Example:

```text
{char1} facing {char2} with an irritated expression while saying {dialogue1}
```

This communicates entities, roles, action, expression, dialogue, and framing without a parallel content list.

Therefore:

- Content / Actors UI is removed;
- Description is canonical Scene content;
- variables are inserted directly through the normal variable system;
- legacy `content` state is compatibility-only and ignored by compile semantics.

Scene state direction:

```ts
type SceneEntity = {
  id: string
  key: string
  name: string
  enabled?: boolean
  description?: string
  content: [] // deprecated compatibility state
  components: ModuleEntityRef[]
  extraDetails?: string
}
```

## 6. Scene references configurations; it never dumps payloads

Bad:

```text
Camera: Nikon F3 35mm film camera capture system, ...
Form: angular form language with ...
```

Correct direction:

```text
{camera_telephoto}
{form_meltedCar}
{framing_closeGrass}
```

The owning module defines the reusable token. Scene only appends a concise reference instruction.

Current instruction registry:

```text
Form    → Apply {tokens} to this scene.
Camera  → Capture this scene with {tokens}.
Framing → Frame this scene with {tokens}.
```

Scene instruction wording is centralized in `entityCapabilities.ts` rather than hard-coded throughout `compileScene.ts`, so Phase 6 can add more modules cleanly.

## 7. Scene-local resource definitions are emitted only when referenced

For scalar scene-oriented resources such as Camera and Framing:

```text
Named entity exists but no active Scene references it
→ do not emit entity definition
→ global/default output remains unchanged

Active Scene references entity
→ owning module defines {module_entity}
→ Scene references that token
```

This keeps unused entity state out of the prompt.

Generic implementation:

```text
compileSceneResourceModule()
```

It preserves the existing global/default scalar output and emits only Scene-referenced named entity definitions.

### 7.1 Camera

```text
{camera} =
• Global/default camera: ...
• {camera_telephoto} = ...

{scenes} =
• {scene_x} = ... Capture this scene with {camera_telephoto}.
```

Camera selection is single per Scene.

### 7.2 Framing

Phase 6 introduces Framing using the same scalar Scene-resource infrastructure.

Expected pattern:

```text
{framing} =
• Global/default framing: ...
• {framing_closeGrass} = close-up framing, off-center subject placement, ...

{scenes} =
• {scene_x} = ... Frame this scene with {framing_closeGrass}.
```

Framing selection is single per Scene.

A named Framing entity may inherit unspecified fields from global/default Framing and override only the fields needed by that Scene.

### 7.3 Form locality

Form has two valid consumption modes.

**Direct Phase-2 behavior:** a named Form entity not consumed by a Scene acts directly on its target.

```text
• {target}: [form specification]
```

Independent Form:

```text
• {target} — independent form: exclude {target} from the Global/default form. Use only: [form specification]
```

**Scene-local behavior:** when an active Scene references a Form entity, the owning Form module exposes a reusable definition instead of globally applying it.

```text
• {form_form1} = Form for {target}: [form specification]
```

Independent Form:

```text
• {form_form1} = Independent form for {target}: [form specification]. When applied, exclude {target} from the Global/default form.
```

Then only the Scene applies it:

```text
Apply {form_form1} to this scene.
```

A Form selected for one Scene must never leak onto the same target in unrelated Scenes.

## 8. Compact Scenes output

Internal module key remains `scene` for persistence/registry compatibility. UI title and prompt presentation use **Scenes**.

Canonical modular presentation:

```text
{scenes} =
• {scene_topScene} = [nested description]
• {scene_centerScene} = [nested description]
• {scene_bottomScene} = [nested description]. Apply {form_x} to this scene. Capture this scene with {camera_x}. Frame this scene with {framing_x}.
```

Removed as redundant:

- `Scene definitions:`
- `Scene: <name>`
- `Description:`
- `Content:`
- inline module payload blocks.

The leading bullet format keeps the block protected from Natural prompt comma splitting.

## 9. Region owns Scene placement

Canonical relationship:

```text
Layout Region → Scene
```

Scene does not own a Region. One Scene may be reused by multiple Regions.

Phase 5 adds typed stable binding:

```ts
type LayoutRegionContentRef = {
  kind: "scene"
  entityId: string
  token?: string
  label?: string
}
```

`contentRef` is canonical persistence identity. Existing `contentKey` remains prompt-facing representation/backward compatibility.

Compile output continues to expose only:

```json
"contentKey": "{scene_topScene}"
```

Stable IDs never leak into prompt text.

### 9.1 Legacy contentKey upgrade

If an existing Region contains a manual token such as:

```text
{scene_topScene}
```

and a live Scene with that token exists, the Region UI upgrades it to a stable Scene `contentRef` non-destructively.

### 9.2 Rename safety

If Scene semantic key changes:

```text
topScene → openingScene
```

Region keeps the same stable `entityId`, while its prompt-facing content token automatically becomes:

```text
{scene_openingScene}
```

### 9.3 Missing/disabled safety

Deleting a referenced Scene must not select another Scene automatically. The stale stable ref remains visible as missing.

Disabling a referenced Scene keeps the ref but reports it as unavailable.

### 9.4 Manual content binding remains supported

Region editor provides a dedicated **Scene binding** selector. Manual `contentKey` remains available for non-Scene/general content.

When a Scene binding is active, manual contentKey editing is disabled to avoid two competing sources of truth.

## 10. Layout accuracy is best-effort, not a compiler contract

Real image tests show that models can follow region order, content binding, role, and broad geometry while still rebalancing exact dimensions.

When both Layout and Scenes have output, compiler adds one concise rule:

```text
Match each scene's dimensions exactly to its corresponding region in {layout}.
```

Numeric geometry is not repeated. `{layout}` remains the single source of truth.

Literal pixel/ratio adherence by image models is explicitly not a phase exit condition.

## 11. Layout-off persistence

```text
Layout inactive
→ Scene state remains stored/editable
→ Scene definitions do not compile
→ derived {scene_*} variables are inactive
→ Scene-referenced module entities are not treated as consumed

Layout active
→ Scene definitions compile
→ derived {scene_*} variables become active
→ active Scene component refs determine reusable module definitions
```

Disabling Layout must never destroy Scene or module-entity state.

## 12. Explicit user variables take ownership from Setup defaults

Enabled user variables with explicit semantic types are more specific than generated Setup aliases.

```text
User variable type = subject
→ suppress generated Setup {subject}
→ suppress generated system {subject} in picker

User variable type = reference
→ suppress generated Setup {reference}
→ suppress generated system {reference} in picker
→ also suppress generated Setup {subject} when that default depends on {reference}
```

Setup state is preserved. This is compile/presentation behavior, not destructive migration.

Ownership is type-driven, not key-name-driven.

---

# Phase results

## Phase 0 — Baseline and source of truth

- [x] Confirm baseline main commit.
- [x] Create dedicated working branch.
- [x] Establish canonical refactor document.
- [x] Keep all work isolated from `main`.

**Result:** complete.

## Phase 1 — Generic entity contracts

- [x] Shared repeatable entity contract.
- [x] Stable entity refs.
- [x] Capability metadata.
- [x] Global/default inheritance model.
- [x] Backward-compatible optional `entities` state.
- [x] Reusable `ModuleEntitiesField` editor.

**Result:** complete.

## Phase 2 — Form

- [x] Preserve scalar Form as global/default.
- [x] Repeatable named Form entities.
- [x] Subject/object targets.
- [x] Per-field inheritance/override.
- [x] Independent Form behavior.
- [x] Real generated-image tests accepted.
- [x] Scene-local reusable Form semantics added later without breaking direct behavior.

**Result:** complete and accepted.

## Phase 3 — Camera

- [x] Preserve scalar Camera as global/default.
- [x] Repeatable named Camera entities.
- [x] No subject/object target picker.
- [x] Single Camera per Scene.
- [x] Per-entity presets.
- [x] Unused named Camera state stays out of prompt.
- [x] Running-app behavior accepted.

**Result:** complete and accepted.

## Phase 4 — Scenes

- [x] Scene registered as a real Key Module.
- [x] Base-driven shell and specialized schema field.
- [x] Stable Scene IDs and `{scene_*}` tokens.
- [x] Generic discovery of scene-exposable modules.
- [x] Cardinality support.
- [x] Missing/deleted/disabled component safety.
- [x] Layout-off persistence.
- [x] Description variable insertion.
- [x] Remove redundant Content / Actors picker.
- [x] Description becomes canonical nested content.
- [x] Stop inline module payload dumping.
- [x] Reusable `{form_*}` / `{camera_*}` references.
- [x] Compact plural `{scenes}` presentation.
- [x] Real three-scene comic tests validate nested descriptions, dialogue, framing text, Scene/Layout interaction, and prompt structure.
- [x] Typed user-subject ownership validated.
- [x] Compiler direction accepted from real generated-image testing.

**Result:** complete and accepted.

## Phase 5 — Layout Region → Scene

Implementation:

- [x] Add typed/stable Region → Scene `contentRef` state.
- [x] Preserve existing `contentKey` compatibility.
- [x] Add Scene as a first-class Region content option.
- [x] Keep stable ID internal while compiling current `{scene_*}` token.
- [x] Allow one Scene to be reused by multiple Regions.
- [x] Automatically reconcile renamed Scene tokens from stable IDs.
- [x] Preserve deleted Scene refs as missing without silent retargeting.
- [x] Preserve disabled Scene refs as unavailable.
- [x] Non-destructively upgrade matching legacy manual Scene contentKey values.
- [x] Preserve Visual Builder geometry and Region metadata behavior.
- [x] Keep Layout compiler prompt schema unchanged except for the already-existing contentKey representation.
- [x] Running-app tests for selection, reuse, rename, delete, disable, and output behavior accepted.
- [x] Real 16:9 comic test confirms Region → Scene content binding works across a changed Layout arrangement.

**Result:** complete and accepted.

---

# Current phase

## Phase 6 — Expand Scene-capable modules

Phase 6 converts suitable modules one at a time while preserving their existing global/default behavior.

General conversion requirements:

- keep existing scalar/global output unchanged when no named entities are used;
- reuse `ModuleEntitiesField` for generic scalar modules;
- choose explicit Scene cardinality;
- do not require meaningless subject/object targets;
- define reusable entity tokens only when referenced by active Scenes for scene-oriented resources;
- append concise Scene-local reference wording instead of duplicating payload;
- preserve stable IDs and missing-reference behavior;
- do not introduce module-specific shell divergence from Base.

### Phase 6.1 — Framing

Rationale: real Phase-4 comic tests already needed different framing per Scene, but framing had to be written manually inside Scene Description because the Framing module was scalar-only.

Implementation:

- [x] Framing is entity-capable.
- [x] Framing is `sceneExposable`.
- [x] Framing cardinality is `single` per Scene.
- [x] Named Framing configurations reuse the generic `ModuleEntitiesField`.
- [x] Generic scalar `scene-resource.vue` panel added for future Phase-6 modules.
- [x] Generic `compileSceneResourceModule()` added.
- [x] Unused named Framing configurations do not alter prompt output.
- [x] Scene-referenced Framing configurations emit reusable `{framing_*}` definitions.
- [x] Scene compiler appends `Frame this scene with {framing_*}.`
- [x] Scene component instruction wording moved to a centralized registry to avoid scattered module-key conditionals.
- [ ] Running-app UI/compile validation.
- [ ] Real image test with different Framing configurations across Scenes.

**Status:** implemented / user validation pending.

### Remaining Phase 6 candidates

Proposed continuation after Framing validation:

- [ ] Background
- [ ] Lighting
- [ ] Style
- [ ] Effects
- [ ] Texture / Material
- [ ] other suitable modules after audit.

The exact order may change based on real workflow tests and specialized module constraints.

---

# Later phases

## Phase 7 — Generalize semantic/reference catalog

- [ ] Audit overlapping specialized target/reference pickers.
- [ ] Define reusable eligibility-aware catalog.
- [ ] Preserve missing-reference recovery and module-specific capabilities.

## Phase 8 — UX consolidation

- [ ] Consolidate entity editor/reference picker patterns.
- [ ] Validate mobile behavior.
- [ ] Improve missing-reference recovery UX.

## Phase 9 — Regression and migration

- [ ] Old drafts load without destructive migration.
- [ ] Prompts without Scenes remain behaviorally equivalent.
- [ ] Existing Layout/Pose/Expression/Color/Material semantics remain functional.
- [ ] Re-validate typed user `reference` ownership and Setup alias restoration.
- [ ] Re-validate Scene-local Form/Camera/Framing definitions in Modular/Natural/JSON as applicable.
- [ ] Import/export JSON remains valid or gets explicit migration.
- [ ] Final user acceptance tests.

## Phase 10 — Merge readiness

- [ ] Rebase/validate against intended `main` if required.
- [ ] Verify no unrelated changes.
- [ ] Finalize docs.
- [ ] Receive explicit final user approval.
- [ ] Merge/transfer to `main` only after that approval.

---

# Accepted validation scenario — multi-scene retro comic

The accepted Scene/Region test uses:

```text
{char1}
{char2}
{dialogue1}
{dialogue2}
{dialogue3}
```

Idea:

```text
A retro comic-book page showing a short conversation between {char1} and {char2}, built from {scenes}, and arranged in {layout} regions, with one short dialogue line in each scene.
```

Canonical Scenes shape:

```text
{scenes} =
• {scene_topScene} = [nested scene description]
• {scene_centerScene} = [nested scene description]
• {scene_bottomScene} = [nested scene description]
```

Region binding is represented in Layout prompt output as:

```json
{
  "contentKey": "{scene_topScene}"
}
```

but persistence identity is the Region's stable Scene `contentRef.entityId`.

Accepted speech-balloon rule:

```text
Speech balloon tails must always point to the correct speaking character. Never point a speech balloon to a silent listener. When a scene contains lines from two speakers, use separate balloons in clear reading order.
```

Compiler-added best-effort Layout rule:

```text
Match each scene's dimensions exactly to its corresponding region in {layout}.
```

Exact literal image-model adherence to region geometry is not required for compiler correctness.

---

# Implementation rules

1. Inspect latest branch history and this file before changes.
2. Keep `main` untouched until explicit approval.
3. Stable IDs are canonical identity; tokens are representation.
4. Scene stores references, never duplicated module payload state.
5. Description is canonical Scene content; avoid redundant parallel representations.
6. Region owns Scene placement.
7. Preserve global/default behavior and old drafts unless explicit migration is defined.
8. Keep Key Module shells Base-driven.
9. Prefer concise nested compiler text over restating information already defined elsewhere.
10. Missing references remain missing; never auto-retarget.
11. Keep compiler behavior explicit and testable.
12. A Scene-local module configuration must never leak into unrelated Scenes.
13. If precise structural data already exists in a module token such as `{layout}`, reference that token instead of restating its numeric contents in system prose.
14. Enabled user variables with explicit semantic types may take prompt-output ownership from generated Setup aliases; ownership is determined by variable type, not key name.
15. Exact literal image-model adherence to Layout geometry is not a compiler correctness requirement.
16. Scene-component application wording should be centralized instead of spread across module-key conditionals.
17. Generic scalar Scene resources should reuse `scene-resource.vue` and `compileSceneResourceModule()` unless specialized semantics require a dedicated adapter.
18. Update this document with architectural changes and phase status.
