# Scene & Entity Composition Refactor

> **Status:** Phase 3 complete / Phase 4 implemented, compiler validation pending
> **Working branch:** `refactor/scene-entity-composition`
> **Baseline main commit:** `83ed3e6374f8fc85e8a3b48f822cb75a1c1f862c`
> **Scope rule:** all refactor work stays on the working branch. Never merge or transfer to `main` without explicit final user approval.

## Source-of-truth rule

Every development session must:

1. inspect the latest working-branch history;
2. read this document before architectural changes;
3. continue from the first incomplete phase;
4. inspect current source before patching;
5. update this document when architecture, migration, or phase status changes.

---

# Goal

Prompt Draft already supports semantic targets, prompt variables, Layout Regions, Typography entities, Hair entities, Outfit sets/items, and specialized assignment systems. This refactor adds:

1. **Repeatable Module Entities** — named reusable configurations owned by a module.
2. **Scene Entities** — reusable nested scene definitions that reference named module configurations.

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

A Layout Region should ultimately reference one Scene instead of wiring Camera, Form, Background, Lighting, Style, etc. individually.

---

# Core architectural decisions

## 1. Stable IDs are identity

Names, semantic keys, and generated tokens are presentation. Cross-module references use stable IDs.

Module entity identity:

```text
moduleKey + entityId
```

Scene identity:

```text
scene.id
```

Renaming a Scene or changing its semantic key may change `{scene_*}` representation but must not change persistence identity. Missing references must remain missing and must never silently retarget.

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

## 3. Scene-exposure and semantic targeting are separate axes

Current proof capabilities:

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

Camera is useful inside a Scene without having a subject/object target. Form may contribute multiple target-specific configurations to the same Scene; Camera is single-selection.

## 4. Every Key Module shell is Base-driven

Scene is specialized only in field/editor semantics. Its outer Key Module shell must use `ModulesPanelBase`, exactly like other Key Modules.

Canonical UI layering:

```text
Key Module
→ ModulesPanelBase
→ schema group/field
→ specialized field component when required
```

Scene uses `sceneEntities` as a schema field rendered by `SceneEntitiesField.vue`. The thin `panel/scene.vue` wrapper owns Scene-specific compile/issues orchestration only.

This preserves shared header/status, expand/collapse, preview, copy, clear/delete, right-click context menu, responsive layout, and visual styling.

## 5. Scene Description is the canonical scene-content definition

The original Phase 4 prototype had a separate **Content / Actors** picker. Real workflow testing showed that it duplicated variables already expressed more precisely through nested Scene Description text.

Example:

```text
{char1} facing {char2} with an irritated expression while saying {dialogue1}
```

This communicates entities, roles, relationships, action, expression, and dialogue in one nested definition. A second list containing `{char1}`, `{char2}`, `{dialogue1}` adds no semantic information.

Therefore:

- Content / Actors UI is removed;
- Description is the canonical content definition;
- nested variables are inserted directly through the normal variable system;
- the legacy `content` array is retained only as temporary type/draft compatibility and normalized to `[]`;
- legacy content selections have no compile semantics.

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

## 6. Scene references configurations; it never dumps their payload

Bad:

```text
Camera: Nikon F3 35mm film camera capture system, ...
Form: angular form language with ...
```

The selected Camera/Form remains defined by its owning module. Scene only refers to the reusable named configuration token.

Named entity tokens use the module + semantic key representation:

```text
{form_form1}
{camera_telephoto}
```

Canonical persistence is still `moduleKey + entityId`; tokens are generated representation.

The owning module exposes the actual definition. Scene appends only a compact instruction:

```text
Apply {form_form1} to this scene.
Capture this scene with {camera_telephoto}.
```

If no Scene-specific Form/Camera is selected, no local instruction is emitted and the module's global/default behavior remains applicable.

## 7. Compact Scenes output

Internal module key remains `scene` for persistence/registry compatibility. UI title and prompt presentation use **Scenes**.

Desired modular presentation:

```text
{scenes} =
• {scene_topScene} = [nested description]
• {scene_centerScene} = [nested description]
• {scene_bottomScene} = [nested description]. Apply {form_x} to this scene. Capture this scene with {camera_x}.
```

Removed as redundant:

- `Scene definitions:`
- `Scene: <name>`
- `Description:`
- `Content:`
- inline Camera/Form payload blocks

The leading bullet format keeps the block protected from Natural prompt comma splitting.

`scenes` is a presentation alias only. Internal storage/module key remains `scene`, avoiding destructive migration.

## 8. Region owns Scene placement

Canonical relationship remains:

```text
Layout Region → Scene
```

Scene does not own a Region. One Scene may later be referenced by multiple Regions. This is Phase 5 work.

## 9. Layout-off persistence

Current Phase 4 behavior:

```text
Layout inactive
→ Scene state remains stored/editable
→ Scene definitions do not compile
→ derived {scene_*} variables are inactive

Layout active
→ Scene definitions compile
→ derived {scene_*} variables become active
```

Disabling Layout must never destroy Scene state.

---

# Phase results

## Phase 0 — Baseline and source of truth

- [x] Confirm baseline main commit.
- [x] Create dedicated working branch.
- [x] Establish canonical refactor document.
- [x] Keep all work isolated from `main`.

**Result:** complete.

## Phase 1 — Generic entity contracts

Primary files include:

- `app/modules/entityContracts.ts`
- `app/modules/entityCapabilities.ts`
- `app/modules/registry.ts`
- `app/components/modules/shared/ModuleEntitiesField.vue`

- [x] Shared repeatable entity contract.
- [x] Stable entity refs.
- [x] Capability metadata.
- [x] Global/default inheritance model.
- [x] Backward-compatible optional `entities` state.

**Result:** complete.

## Phase 2 — Form

Form proves target-oriented repeatable scalar entities.

- [x] Preserve scalar Form as global/default.
- [x] Repeatable named Form entities.
- [x] Subject/object target support.
- [x] Per-field inheritance/override.
- [x] Independent Form behavior.
- [x] Real generated-image tests accepted.

The accepted independent semantic remains: the target may be excluded from Global/default Form and use only its local configuration.

Phase 4 extends named Form output with a reusable `{form_*}` token so Scene can reference the configuration without repeating its specification. This new nested representation still requires running-app validation.

**Result:** Phase 2 accepted; reusable token representation pending Phase 4 validation.

## Phase 3 — Camera

Camera proves scene-oriented repeatable scalar entities.

- [x] Preserve scalar Camera as global/default.
- [x] Repeatable named Camera entities.
- [x] No subject/object target picker.
- [x] Camera `sceneSelection: "single"`.
- [x] Per-entity presets.
- [x] Running-app behavior accepted.

Phase 4 extends named Camera output with reusable `{camera_*}` definitions so Scene may reference them without inline payload duplication. No named entities still preserves legacy scalar Camera output.

**Result:** Phase 3 accepted; reusable token representation pending Phase 4 validation.

## Phase 4 — Scenes

Primary files:

- `app/modules/scene.types.ts`
- `app/modules/scene.module.ts`
- `app/utils/scene.ts`
- `app/utils/compileScene.ts`
- `app/utils/moduleEntityVariables.ts`
- `app/utils/compileCamera.ts`
- `app/utils/compileForm.ts`
- `app/components/modules/scene/SceneEntitiesField.vue`
- `app/components/modules/panel/scene.vue`
- `app/components/modules/panel/base.vue`
- `app/utils/promptVariableCatalog.ts`
- `app/utils/compilePrompt.ts`
- `app/utils/compilePromptCore.ts`

Implemented:

- [x] Scene registered as a real Key Module.
- [x] Base-driven Key Module shell.
- [x] Specialized repeatable Scene editor via schema field.
- [x] Stable Scene IDs and `{scene_*}` tokens.
- [x] Generic scene-exposable component discovery.
- [x] Camera single / Form multiple cardinality.
- [x] Missing/deleted/disabled component safety.
- [x] Layout-off persistence.
- [x] Description variable insertion and stable editor IDs.
- [x] Remove redundant Content / Actors picker.
- [x] Make Description canonical nested content.
- [x] Stop inline compilation of selected Form/Camera payloads in Scene.
- [x] Generate reusable `{form_*}` / `{camera_*}` entity references.
- [x] Append compact component instructions to Scene definitions.
- [x] Present module output as plural `{scenes}` while preserving internal `scene` key.
- [ ] Running-app validation of compact Scenes output.
- [ ] Validate Form/Camera nested reference definitions in final Modular/Natural output.
- [ ] Real prompt/image test with three-scene comic workflow.
- [ ] Final wording refinement if the real model interpretation exposes ambiguity.

**Current state:** implementation ready for user testing; do not mark Phase 4 complete yet.

**Exit condition:** a Scene description can nest user/system variables, optionally reference named Form/Camera configurations without payload duplication, expose a stable `{scene_*}` reference, survive rename/delete/Layout toggles safely, and produce concise interpretable output.

---

# Next phases

## Phase 5 — Layout Region → Scene

- [ ] Introduce typed/stable Region → Scene reference state while preserving existing `contentKey` compatibility.
- [ ] Add Scene as a first-class Region content option.
- [ ] Compile selected Region content to the correct `{scene_*}` reference.
- [ ] Allow one Scene to be reused by multiple Regions.
- [ ] Preserve missing/deleted Scene references safely.

## Phase 6 — Expand Scene-capable modules

Suggested order:

- [ ] Background
- [ ] Lighting
- [ ] Style
- [ ] Effects
- [ ] Framing
- [ ] Texture / Material
- [ ] other suitable modules

Every conversion must preserve old global/default behavior and reuse generic entity infrastructure where appropriate.

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
- [ ] Import/export JSON remains valid or gets explicit migration.
- [ ] Final user acceptance tests.

## Phase 10 — Merge readiness

- [ ] Rebase/validate against intended `main` if required.
- [ ] Verify no unrelated changes.
- [ ] Finalize docs.
- [ ] Receive explicit final user approval.
- [ ] Merge/transfer to `main` only after that approval.

---

# Current manual test scenario — three-scene retro comic

User-defined variables:

```text
{char1}
{char1Name}
{char2}
{char2Name}
{dialogue1}
{dialogue2}
{dialogue3}
```

Idea:

```text
A retro comic-book page showing a short conversation between {char1} and {char2}, built from {scene1}, {scene2}, and {scene3}, and arranged in {layout} regions, with one short dialogue line in each scene.
```

Scene descriptions:

```text
{scene_topScene}
{char1} facing {char2} with an irritated expression and sharp body language, confronting him while saying {dialogue1}; {char2} stands relaxed with a teasing dark-humor smirk.

{scene_centerScene}
{char2} replying with a smug darkly playful expression while saying {dialogue2}; {char1} looks more annoyed, staring at him with disbelief and restrained anger.

{scene_bottomScene}
{char1} looking fed up and ready to snap while saying {dialogue3}; {char2} answers with a calm mischievous grin, turning the tension into dark humor.
```

For the first compiler test, global Form may remain global and no Scene-specific configuration needs to be selected. Then select a named Form and/or Camera for one Scene and verify that only short nested-reference instructions are appended.

Expected pattern:

```text
{scenes} =
• {scene_topScene} = ...
• {scene_centerScene} = ...
• {scene_bottomScene} = .... Apply {form_someConfig} to this scene. Capture this scene with {camera_someConfig}.
```

The selected configuration payload must be defined by its owning module and must not be repeated inside `{scenes}`.

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
12. Update this document with architectural changes.
