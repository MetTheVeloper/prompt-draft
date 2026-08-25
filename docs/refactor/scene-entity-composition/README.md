# Scene & Entity Composition Refactor

> **Status:** Phase 3 complete / Phase 4 compiler direction validated, refinement validation pending
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

Names, semantic keys, and generated tokens are representation. Cross-module references use stable IDs.

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

Camera is useful inside a Scene without a subject/object target. Form may contribute multiple target-specific configurations to one Scene; Camera is single-selection.

## 4. Every Key Module shell is Base-driven

Scene is specialized only in field/editor semantics. Its outer Key Module shell uses `ModulesPanelBase`, exactly like other Key Modules.

```text
Key Module
→ ModulesPanelBase
→ schema group/field
→ specialized field component when required
```

Scene uses `sceneEntities` as a schema field rendered by `SceneEntitiesField.vue`. The thin `panel/scene.vue` wrapper owns Scene-specific compile/issues orchestration only.

This preserves shared header/status, expand/collapse, preview, copy, clear/delete, right-click context menu, responsive layout, and visual styling.

## 5. Scene Description is canonical scene content

The first Phase 4 prototype had a separate **Content / Actors** picker. Real workflow testing showed that it duplicated variables already expressed more precisely through nested Description text.

Example:

```text
{char1} facing {char2} with an irritated expression while saying {dialogue1}
```

This communicates entities, roles, relationship, action, expression, and dialogue in one nested definition. A second list containing the same tokens adds no semantic information.

Therefore:

- Content / Actors UI is removed;
- Description is the canonical content definition;
- variables are inserted directly through the normal variable system;
- legacy `content` state is compatibility-only and normalized away from compile semantics.

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

Selected Camera/Form configuration payloads remain defined by their owning modules. Scene only refers to reusable named configuration tokens.

Generated representation:

```text
{form_form1}
{camera_telephoto}
```

Canonical persistence remains `moduleKey + entityId`; tokens are generated representation only.

Scene appends compact instructions:

```text
Apply {form_form1} to this scene.
Capture this scene with {camera_telephoto}.
```

If no Scene-specific Form/Camera is selected, no local instruction is emitted and global/default module behavior remains applicable.

### 6.1 Camera entity locality

Named Camera entities are Scene resources, not extra global Camera instructions.

```text
Camera entity exists but no active Scene references it
→ do not emit its definition
→ keep legacy/global Camera output unchanged

Active Scene references Camera entity
→ owning Camera module defines {camera_*}
→ Scene says: Capture this scene with {camera_*}.
```

This keeps unused named Camera state out of the prompt.

### 6.2 Form entity locality

Form has two valid consumption modes and they must remain distinct.

**Phase-2 direct Form behavior:**

A named Form entity that is not referenced by any active Scene keeps the accepted direct target behavior.

```text
• {target}: [form specification]
```

Independent Form keeps the accepted wording:

```text
• {target} — independent form: exclude {target} from the Global/default form. Use only: [form specification]
```

**Scene-local Form behavior:**

When an active Scene references a Form entity, that entity must stop acting as an immediately applied global target instruction. The owning Form module exposes a reusable definition instead:

```text
• {form_form1} = Form for {target}: [form specification]
```

Independent Form becomes:

```text
• {form_form1} = Independent form for {target}: [form specification]. When applied, exclude {target} from the Global/default form.
```

Then only the Scene applies it:

```text
Apply {form_form1} to this scene.
```

This rule is critical: a Form selected for one Scene must not leak onto the same target in other Scenes.

The target remains encoded in the reusable Form definition so Scene-local application does not lose semantic scope.

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
- inline Camera/Form payload blocks.

The leading bullet format keeps the block protected from Natural prompt comma splitting.

`scenes` is a presentation alias only. Internal storage/module key remains `scene`, avoiding destructive migration.

### 7.1 Scene/Layout fidelity rule

Real comic-page testing showed that models can follow the top/center/bottom region order while still drifting from the exact region dimensions in `{layout}`.

When both Layout and Scenes have active output, the prompt compiler now appends one concise nested rule to the effective `{rules}` value:

```text
Match each scene's dimensions exactly to its corresponding region in {layout}.
```

The numeric region geometry is never repeated in system prose. `{layout}` remains the single source of truth.

This is a compile/presentation rule only. The user's stored `globalRules` setting is not mutated.

## 8. Region owns Scene placement

Canonical relationship remains:

```text
Layout Region → Scene
```

Scene does not own a Region. One Scene may later be referenced by multiple Regions. This is Phase 5 work.

## 9. Layout-off persistence

```text
Layout inactive
→ Scene state remains stored/editable
→ Scene definitions do not compile
→ derived {scene_*} variables are inactive
→ Form/Camera entities are not treated as Scene-consumed

Layout active
→ Scene definitions compile
→ derived {scene_*} variables become active
→ active Scene component refs determine reusable Form/Camera definitions
```

Disabling Layout must never destroy Scene state.

## 10. Explicit user variables take ownership from Setup defaults

User-created typed variables are more explicit than generated Setup aliases.

Compile ownership policy:

```text
Enabled user variable with type = subject
→ do not emit generated Setup {subject}
→ do not expose generated system {subject} in the variable picker

Enabled user variable with type = reference
→ do not emit generated Setup {reference}
→ do not expose generated system {reference} in the variable picker
→ also suppress generated Setup {subject} because the default i2i subject definition depends on {reference}
```

Setup state is preserved; it is not cleared or migrated. This policy affects prompt compilation/presentation only.

The suppression is type-driven, not key-name-driven. A user subject variable may be `{char1}`, `{personA}`, etc.; its `type: "subject"` is what transfers ownership.

JSON output keeps its existing data schema for now; this ownership policy currently targets prompt-text/system-variable presentation. JSON migration/schema changes belong to the later regression/migration phase if needed.

---

# Phase results

## Phase 0 — Baseline and source of truth

- [x] Confirm baseline main commit.
- [x] Create dedicated working branch.
- [x] Establish canonical refactor document.
- [x] Keep all work isolated from `main`.

**Result:** complete.

## Phase 1 — Generic entity contracts

Primary files:

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

Phase 4 adds a second consumption path for Scene-referenced Form entities. Direct Phase-2 behavior remains unchanged for Form entities that are not consumed by Scenes.

**Result:** Phase 2 accepted; Scene-local reusable representation pending Phase 4 running-app validation.

## Phase 3 — Camera

Camera proves scene-oriented repeatable scalar entities.

- [x] Preserve scalar Camera as global/default.
- [x] Repeatable named Camera entities.
- [x] No subject/object target picker.
- [x] Camera `sceneSelection: "single"`.
- [x] Per-entity presets.
- [x] Running-app behavior accepted.

Phase 4 emits reusable `{camera_*}` definitions only for named Camera entities referenced by active Scenes.

**Result:** Phase 3 accepted; Scene-reference representation pending Phase 4 running-app validation.

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
- `app/components/modules/panel/form.vue`
- `app/components/modules/panel/camera.vue`
- `app/components/modules/panel/base.vue`
- `app/components/prompt/editor.vue`
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
- [x] Keep unused Camera entities out of prompt output.
- [x] Preserve Phase-2 direct Form behavior for non-Scene Form entities.
- [x] Convert Scene-referenced Form entities to reusable definitions without global target leakage.
- [x] Append compact component instructions to Scene definitions.
- [x] Present module output as plural `{scenes}` while preserving internal `scene` key.
- [x] Running-app validation of compact `{scenes}` output.
- [x] Real three-scene retro-comic prompt/image test validates Description-as-content, nested `{scenes}`, per-scene framing text, and dialogue structure.
- [x] Add automatic nested Scene/Layout fidelity rule.
- [x] Add typed user-variable ownership for generated Setup `{subject}` / `{reference}` aliases.
- [ ] Validate automatic Scene/Layout fidelity rule in the next generated output.
- [ ] Validate user subject/reference ownership suppression in running-app Modular output.
- [ ] Validate Form/Camera nested reference definitions in final Modular/Natural output.
- [ ] Final wording refinement if real model interpretation exposes ambiguity.

**Current state:** compiler direction is validated by a real three-scene comic generation. The remaining Phase 4 work is focused refinement validation, not a compiler-architecture redesign.

**Exit condition:** a Scene description can nest user/system variables, optionally reference named Form/Camera configurations without payload duplication or cross-scene leakage, expose a stable `{scene_*}` reference, survive rename/delete/Layout toggles safely, preserve exact Layout intent through nested rules, respect explicit user variable ownership, and produce concise interpretable output.

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
- [ ] other suitable modules.

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
A retro comic-book page showing a short conversation between {char1} and {char2}, built from {scenes}, and arranged in {layout} regions, with one short dialogue line in each scene.
```

Scene descriptions:

```text
{scene_topScene}
Medium two-shot of {char1} and {char2}. {char1} faces {char2} with an irritated expression and sharp body language, confronting him while saying {dialogue1}. {char2} stands relaxed with a teasing dark-humor smirk.

{scene_centerScene}
Closer framing focused on {char2}, with {char1} still visible in the shot. {char2} replies with a smug, darkly playful expression while saying {dialogue2}. {char1} looks more annoyed, staring at him with disbelief and restrained anger.

{scene_bottomScene}
Wider two-shot at table level, showing stronger tension between both characters. {char1} looks fed up and ready to snap while saying {dialogue3}. {char2} answers with a calm mischievous grin, turning the tension into dark humor.
```

Accepted speech-balloon test rule:

```text
Speech balloon tails must always point to the correct speaking character. Never point a speech balloon to a silent listener. When a scene contains lines from two speakers, use separate balloons in clear reading order.
```

The compiler appends this nested Layout fidelity rule whenever active Scenes and Layout output coexist:

```text
Match each scene's dimensions exactly to its corresponding region in {layout}.
```

Current refinement validation pass:

1. keep the tested comic setup and verify the generated `{rules}` includes the Layout fidelity rule once;
2. confirm the next image follows top/center/bottom region heights more closely;
3. with user variables of type `subject`, verify generated Setup `{subject}` is absent;
4. with no user `subject`, verify Setup `{subject}` returns;
5. with a user variable of type `reference`, verify generated Setup `{reference}` and its dependent generated `{subject}` are absent;
6. remove/disable the user `reference` variable and verify Setup `{reference}` returns;
7. select one named Form for only the bottom Scene and verify Form defines `{form_*}` once and only bottom Scene applies it;
8. repeat with Independent Form and confirm exclusion wording remains Scene-local;
9. select one named Camera for only the bottom Scene and verify Camera defines `{camera_*}` once and only bottom Scene captures with it;
10. verify an unused named Camera entity produces no extra output.

Expected nested component pattern:

```text
{form} =
• Global/default form: ...
• {form_someConfig} = Form for {char1}: ...

{camera} =
• Global/default camera: ...
• {camera_someConfig} = ...

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
12. A Scene-local module configuration must never leak into unrelated Scenes.
13. If precise structural data already exists in a module token such as `{layout}`, reference that token instead of restating its numeric contents in system prose.
14. Enabled user variables with explicit semantic types may take prompt-output ownership from generated Setup aliases; ownership is determined by variable type, not key name.
15. Update this document with architectural changes.
