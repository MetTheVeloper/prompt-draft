# Scene & Entity Composition Refactor

> **Status:** Phase 5 complete / Phase 6 in progress — Framing, Background, Lighting, and Style accepted; Effects implemented / validation pending
> **Working branch:** `refactor/scene-entity-composition`
> **Baseline main commit:** `83ed3e6374f8fc85e8a3b48f822cb75a1c1f862c`
> **Deployment checkpoint:** `main` was explicitly fast-forwarded to `eafbe3be6dc27f6cebb884c862742396279509c1` for remote testing after Style implementation. All subsequent refactor work resumes on the working branch only; do not move `main` again without explicit user approval.

## Source-of-truth rule

Every development session must:

1. inspect the latest working-branch history;
2. read this document before architectural changes;
3. continue from the first incomplete phase;
4. inspect current source before patching;
5. update this document when architecture, migration behavior, or phase status changes.

---

# Goal

Prompt Draft already supports semantic targets, user/system variables, Layout Regions, Typography entities, Hair entities, Outfit sets/items, and specialized assignment systems.

This refactor adds:

1. **Repeatable Module Entities** — named reusable configurations owned by scalar modules.
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

A Scene references reusable module configurations such as Form, Camera, Framing, Background, Lighting, Style, Effects, and later other suitable modules.

---

# Core architecture

## 1. Stable IDs are canonical identity

Names, semantic keys, labels, and generated tokens are representation only.

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

Rename operations may change prompt-facing tokens but must not break persisted references. Missing references stay missing and must never silently retarget.

## 2. Scalar module state remains global/default

Existing top-level scalar module state remains backward compatible.

Named entities live under the optional `entities` sibling state:

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

Inheritance:

```text
inheritGlobal omitted / true
→ local payload overlays global/default values

inheritGlobal false
→ entity resolves from local payload only
```

Older drafts without `entities` remain valid.

## 3. Scene exposure and semantic targeting are separate axes

Current generic capability registry:

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

background: {
  enabled: true,
  sceneExposable: true,
  sceneSelection: "single",
  targetPolicy: [],
}

lighting: {
  enabled: true,
  sceneExposable: true,
  sceneSelection: "single",
  targetPolicy: [],
}

style: {
  enabled: true,
  sceneExposable: true,
  sceneSelection: "single",
  targetPolicy: [],
  allowGlobalInheritanceToggle: true,
  preserveEntitiesInCustomMode: true,
}

effects: {
  enabled: true,
  sceneExposable: true,
  sceneSelection: "single",
  targetPolicy: [],
  allowGlobalInheritanceToggle: true,
  preserveEntitiesInCustomMode: true,
}
```

Camera, Framing, Background, Lighting, Style, and Effects are Scene resources and do not need meaningless subject/object targets.

Scene-resource UX/compile options that are meaningful only for some modules are capability-driven. Style and Effects opt into an Independent configuration model and keep Scene-referenced named definitions available while their Global/default panel is in custom mode.

## 4. Key Module shells stay consistent

Specialized behavior belongs in schema fields or thin wrappers. Shared Key Module shell behavior should remain centralized whenever practical.

Scene uses a schema field of type `sceneEntities` rendered by `SceneEntitiesField.vue`.

Generic scalar Scene resources use:

```text
ModuleEntitiesField.vue
scene-resource.vue
compileSceneResourceModule()
```

Framing and Style are direct generic Scene-resource cases. Style continues using the standard Base panel and generic `compileModule()` semantics; its named configurations therefore need no specialized compiler adapter.

Background is an explicit adapter case because its existing global panel and compiler have specialized custom-input/natural-language behavior that must remain backward compatible.

Lighting is also an explicit adapter case. Its canonical compiler owns nested `lightSources` semantics plus inline `customText` override behavior, and its named configuration editor reuses the existing `LightSourcesField.vue` rather than flattening structured source state into generic scalar inputs.

Effects is another explicit adapter case. Its canonical compiler owns structured `effectLayers` semantics, including custom effect text, intensity, layer details, duplicate suppression, and extra effects direction. `effects-stable.vue` keeps the specialized global Effects panel while `EffectsEntitiesField.vue` reuses the existing `EffectLayersField.vue` for named configurations.

## 5. Scene Description is canonical scene content

The prototype `Content / Actors` picker was removed after real workflow testing showed it duplicated information already expressed more precisely through nested Description text.

Example:

```text
{char1} facing {char2} with an irritated expression while saying {dialogue1}
```

Description can encode actors, relationships, actions, dialogue, expression, body language, and temporary scene-specific framing without a second content list.

Persisted legacy `content` state remains compatibility-only and is ignored by compiler semantics.

## 6. Scene references configurations; it never dumps payloads

Bad:

```text
Camera: Nikon F3 35mm film camera capture system, ...
Form: angular form language with ...
```

Correct:

```text
{camera_telephoto}
{form_meltedCar}
{framing_closeGrass}
{background_sunsetDeck}
{lighting_neonRim}
{style_watercolorNight}
{effects_glitchPass}
```

Owning modules define reusable tokens. Scene appends only concise application instructions.

Current instruction registry:

```text
Form       → Apply {tokens} to this scene.
Camera     → Capture this scene with {tokens}.
Framing    → Frame this scene with {tokens}.
Background → Use only {tokens} as this scene's background.
Lighting   → Light this scene with {tokens}.
Style      → Use {tokens} as this scene's visual style.
Effects    → Apply {tokens} as this scene's effects.
```

The wording registry lives in `entityCapabilities.ts`, not scattered through `compileScene.ts`.

## 7. Scene-resource definitions are demand-driven

For scene-oriented scalar resources:

```text
Named entity exists but no active Scene references it
→ do not emit entity definition
→ legacy/global output stays unchanged

Active Scene references entity
→ owning module defines {module_entity}
→ Scene references that token
```

This keeps unused entity state out of prompts.

`compileSceneResourceModule()` supports both generic scalar compilation and a specialized `compileValues` callback for modules such as Background, Lighting, and Effects. Scene-resource capability metadata can also opt into preserving referenced named definitions while Global/default custom mode is active and into exposing the shared Independent configuration control.

## 8. Form keeps two consumption modes

Direct Form behavior remains valid for named Form entities not consumed by Scenes:

```text
• {target}: [form specification]
```

Independent direct Form:

```text
• {target} — independent form: exclude {target} from the Global/default form. Use only: [form specification]
```

When a Scene references a Form entity, the owning Form module exposes a reusable definition instead of applying it globally:

```text
• {form_form1} = Form for {target}: [form specification]
```

Independent Scene-local Form:

```text
• {form_form1} = Independent form for {target}: [form specification]. When applied, exclude {target} from the Global/default form.
```

Then only the selected Scene applies it:

```text
Apply {form_form1} to this scene.
```

A Scene-local Form must never leak into unrelated Scenes.

## 9. Compact Scenes output

Internal module key remains `scene` for registry/persistence compatibility. UI and prompt presentation use plural **Scenes**.

Canonical output:

```text
{scenes} =
• {scene_topScene} = [nested scene description]
• {scene_centerScene} = [nested scene description]
• {scene_bottomScene} = [nested scene description]. Frame this scene with {framing_x}. Use only {background_x} as this scene's background.
```

Removed as redundant:

- `Scene definitions:`
- `Scene: <name>`
- `Description:`
- `Content:`
- inline module payload blocks.

## 10. Region owns Scene placement

Canonical relationship:

```text
Layout Region → Scene
```

One Scene may be reused by multiple Regions.

Stable Region state:

```ts
type LayoutRegionContentRef = {
  kind: "scene"
  entityId: string
  token?: string
  label?: string
}
```

`contentRef` is canonical persistence identity. `contentKey` remains prompt-facing representation/backward compatibility.

Prompt output exposes only:

```json
"contentKey": "{scene_topScene}"
```

Stable IDs never leak into prompt text.

Legacy manual `{scene_*}` contentKey values are upgraded non-destructively when a matching Scene exists.

Rename updates representation from the stable ref. Deleted/disabled Scenes remain missing/unavailable and never auto-retarget.

## 11. Layout fidelity is best effort

Real image tests show that image models can follow region ordering, content binding, roles, and broad geometry while still rebalancing exact panel proportions.

When Layout and Scenes both compile, one concise rule is appended:

```text
Match each scene's dimensions exactly to its corresponding region in {layout}.
```

`{layout}` remains the single source of numeric geometry. Exact literal image-model adherence is not a compiler correctness requirement or phase exit condition.

## 12. Layout-off persistence

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

## 13. Explicit user variables own their semantic role

Enabled user variables with explicit semantic types are more specific than Setup aliases.

```text
User variable type = subject
→ suppress generated Setup {subject}
→ suppress generated system {subject} in picker

User variable type = reference
→ suppress generated Setup {reference}
→ suppress generated system {reference} in picker
→ also suppress generated Setup {subject} when that default depends on {reference}
```

Setup state is preserved. Ownership is compile/presentation behavior and is type-driven, not key-name-driven.

---

# Phase results

## Phase 0 — Baseline and source of truth

- [x] Dedicated working branch.
- [x] Baseline main commit recorded.
- [x] Canonical refactor document established.
- [x] Main kept untouched during the branch-only refactor until the explicitly approved deployment checkpoint.

**Result:** complete.

## Phase 1 — Generic entity contracts

- [x] Shared repeatable entity contract.
- [x] Stable entity refs.
- [x] Capability metadata.
- [x] Global/default inheritance model.
- [x] Optional backward-compatible `entities` state.
- [x] Reusable `ModuleEntitiesField` editor.

**Result:** complete.

## Phase 2 — Form

- [x] Global/default Form preserved.
- [x] Repeatable named Form entities.
- [x] Subject/object targets.
- [x] Per-field overrides and independent Form behavior.
- [x] Direct and Scene-local semantics validated with real generated images.

**Result:** complete and accepted.

## Phase 3 — Camera

- [x] Global/default Camera preserved.
- [x] Repeatable named Camera entities.
- [x] Single Camera per Scene.
- [x] Per-entity presets.
- [x] Unused named Camera state stays out of prompt.
- [x] Running-app behavior accepted.

**Result:** complete and accepted.

## Phase 4 — Scenes

- [x] Scene registered as a Key Module.
- [x] Stable Scene IDs and `{scene_*}` tokens.
- [x] Description-only canonical content.
- [x] Generic Scene component discovery/cardinality.
- [x] Compact plural `{scenes}` output.
- [x] Missing/deleted/disabled component safety.
- [x] Layout-off persistence.
- [x] Form/Camera reference semantics.
- [x] Typed user-subject ownership.
- [x] Real three-scene comic tests accepted.

**Result:** complete and accepted.

## Phase 5 — Layout Region → Scene

- [x] Stable Region → Scene `contentRef`.
- [x] First-class Scene picker in Region editor.
- [x] Existing contentKey compatibility.
- [x] Rename/delete/disable safety.
- [x] Scene reuse across Regions.
- [x] Legacy manual token upgrade.
- [x] Layout compiler schema preserved.
- [x] Running-app tests accepted.
- [x] Real changed-layout comic test accepted.

**Result:** complete and accepted.

---

# Current phase

## Phase 6 — Expand Scene-capable modules

General requirements for each conversion:

- preserve existing global/default output when no named entities are consumed;
- reuse generic entity infrastructure where semantics allow;
- choose explicit Scene cardinality;
- do not add meaningless target selectors;
- emit reusable definitions only when active Scenes reference them;
- keep stable IDs and missing-reference behavior;
- append concise Scene-local wording instead of payload duplication;
- preserve specialized scalar compiler behavior through adapters when required.

### Phase 6.1 — Framing

- [x] Framing entity capability added.
- [x] `sceneExposable: true`.
- [x] `sceneSelection: "single"`.
- [x] Named Framing configurations use `ModuleEntitiesField`.
- [x] Generic `scene-resource.vue` panel introduced.
- [x] Generic `compileSceneResourceModule()` introduced.
- [x] Unused Framing entities stay out of prompt.
- [x] Scene-referenced Framing entities emit `{framing_*}` definitions.
- [x] Scene wording: `Frame this scene with {framing_*}.`
- [x] Rename/delete/disable/Layout-off behavior validated.
- [x] Real multi-scene comic image validates different Framing configurations across Scenes.

**Result:** complete and accepted.

### Phase 6.2 — Background

Background is specialized because its existing global panel and `compileBackgroundModule()` produce module-specific natural-language clauses and custom-input behavior.

Implementation:

- [x] Background is entity-capable.
- [x] Background is `sceneExposable`.
- [x] Background cardinality is `single` per Scene.
- [x] Existing global Background panel remains in place.
- [x] Existing specialized Background compiler remains canonical for both global and named configurations.
- [x] Named Background configurations use the generic entity editor and support presets.
- [x] Named Background configurations may inherit global values or opt into **Independent Background** mode.
- [x] `compileSceneResourceModule()` accepts a specialized scalar compiler callback.
- [x] Unused named Background configurations stay out of prompt output.
- [x] Scene-referenced Background configurations emit `{background_*}` definitions.
- [x] Scene wording: `Use only {background_*} as this scene's background.`
- [x] Running-app UI/compile validation accepted.
- [x] Real image test validates different Background configurations across Scenes.

**Result:** complete and accepted.

### Phase 6.3 — Lighting

Lighting requires a specialized Scene-resource adapter rather than the plain generic scalar panel/compiler path.

Audit findings:

- `compileLightingModule()` owns the canonical natural-language semantics for nested `lightSources`, including role/type/direction/quality/intensity/color/custom-color/features.
- Lighting presets contain structured `LightingSource[]` payloads and must remain structured when stored inside named entities.
- `customText` is the module override field. The UI must use the same explicit `isCustomMode` switch as other override-capable Key Modules instead of treating the textarea as an always-visible normal form section.
- Lighting has no meaningful subject/object target semantics.

Implementation:

- [x] Lighting is entity-capable and `sceneExposable`.
- [x] Lighting cardinality is `single` per Scene.
- [x] Lighting target policy is empty; no target selector is exposed.
- [x] Existing global Lighting panel remains canonical.
- [x] Existing `compileLightingModule()` remains canonical for global and named configuration specifications.
- [x] `lighting-stable.vue` adapts the specialized panel to generic entity state and Scene reference consumption.
- [x] Named Lighting configurations use stable generic `ModuleEntity` identity/state.
- [x] `LightingEntitiesField.vue` reuses the existing `LightSourcesField.vue` so nested source state, custom colors, and source features persist as structured values.
- [x] Named Lighting configurations support existing Lighting presets, including structured `lightSources` arrays.
- [x] Named Lighting configurations may inherit global values or opt into Independent Lighting mode.
- [x] Global custom mode is driven by `panelState.isCustomMode`; stored `customText` is preserved while custom mode is off but is excluded from normal global compilation.
- [x] Lighting custom mode uses the standard top-of-module switch and custom-only editor view instead of an inline always-visible override accordion.
- [x] Global `customText` and Scene-referenced named Lighting definitions may compile together; named entity definitions still clear the override field so the global custom text never leaks into them.
- [x] `compileSceneResourceModule()` has an opt-in `preserveEntitiesInCustomMode` path; adapters that do not request it keep their previous behavior.
- [x] Demand-driven output remains canonical: created-but-unreferenced Lighting entities do not compile. If only `{lighting_lighting1}` is referenced by active Scenes, seeing only that named definition is expected; referencing Lighting 1/2/3 from active Scenes emits all three definitions.
- [x] Unused named Lighting configurations stay out of prompt output.
- [x] Scene-referenced Lighting configurations emit `{lighting_*}` definitions.
- [x] Scene wording: `Light this scene with {lighting_*}.`
- [x] Layout-off consumption gate matches Framing/Background: state remains stored, but named Lighting definitions are not treated as consumed while Layout is inactive.
- [x] Running-app test confirmed Global `customText` can coexist with referenced named Lighting definitions without leaking the global override into named specifications.
- [x] Custom-mode UX/state behavior was validated after the standard top-level switch fix.
- [x] Controlled repeated-scene / different-lighting prompt and real image test validated three distinct named Lighting configurations on otherwise repeated Scene content.
- [x] Static compiler-path sanity review completed after custom-mode fixes.

**Result:** complete and accepted.

### Phase 6.4 — Style

Style is a direct generic scalar Scene-resource conversion; it does not need a specialized compiler adapter.

Audit findings:

- The active registry module is `style.freeform.ts`, which overlays the semantic Style schema with first-class freeform options.
- Style uses the standard Base Key Module panel and generic `compileModule()` path; no module-specific compiler exists to preserve through an adapter.
- Style presets contain scalar field values and fit the shared entity preset system directly.
- Freeform Style selections persist the authored text itself through `el-dropdown`; they do not use a separate sidecar state object.
- `medium` is a categorized freeform select. Scene-resource editors re-introduce persisted arbitrary values as temporary known options so the `Custom` category can be reconstructed after reload without changing the stored or compiled value.
- Style has no meaningful subject/object target semantics.

Implementation:

- [x] Style is entity-capable and `sceneExposable`.
- [x] Style cardinality is `single` per Scene.
- [x] Style target policy is empty; no target selector is exposed.
- [x] Existing global Style Base panel and generic `compileModule()` behavior remain canonical.
- [x] Named Style configurations reuse `scene-resource.vue`, `ModuleEntitiesField.vue`, and `compileSceneResourceModule()` directly.
- [x] Existing Style presets are available per named configuration.
- [x] Freeform `aesthetic`, `medium`, `linework`, `visualTreatment`, and `finish` values remain raw persisted strings and compile through existing Style semantics.
- [x] Categorized freeform values are restored into editor category state after reload without introducing new persistence state.
- [x] Named Style configurations may inherit Global/default Style or opt into **Independent Style** mode.
- [x] Global Style custom mode may coexist with Scene-referenced named Style definitions; the global `customText` override does not leak into named definitions.
- [x] Unused named Style configurations stay out of prompt output.
- [x] Scene-referenced Style configurations emit `{style_*}` definitions.
- [x] Scene wording: `Use {style_*} as this scene's visual style.`
- [x] Layout-off consumption gate preserves Style entity/Scene state while suppressing Scene-related Style definitions.
- [x] Static compiler/UI-path sanity review completed.
- [x] Running-app UI/compile validation accepted.
- [x] Real multi-scene image test validated three Scene-local Style configurations — cinematic realism/photography, Art Deco/vector illustration, and claymation/hand-modeled clay — while Scene content remained reusable and token-based.

**Result:** complete and accepted.

### Phase 6.5 — Effects

Effects requires a specialized Scene-resource adapter because the module owns structured effect-layer state and a dedicated natural-language compiler.

Audit findings:

- `effectLayers` is a structured `EffectLayer[]` field with up to eight layers; each layer may carry effect type, custom effect text, intensity, and details.
- `compileEffectsModule()` is canonical and handles custom layer text, intensity wording, duplicate suppression, punctuation normalization, and `extraDetails`.
- Existing Effects presets contain structured `EffectLayer[]` values and must stay structured inside named entities.
- Because one configuration can already contain a complete stack of layers, Effects cardinality is `single` per Scene.
- Effects is Scene-wide and has no meaningful subject/object target selector.
- Existing Global/default Effects custom mode already follows the standard top-level switch UX.

Implementation:

- [x] Effects is entity-capable and `sceneExposable`.
- [x] Effects cardinality is `single` per Scene.
- [x] Effects target policy is empty.
- [x] Existing specialized global `effects.vue` panel remains canonical.
- [x] Existing `compileEffectsModule()` remains canonical for Global/default and named specifications.
- [x] `effects-stable.vue` adapts the specialized global panel to generic stable entity state and demand-driven Scene consumption.
- [x] `EffectsEntitiesField.vue` stores named Effects through generic `ModuleEntity` identity while reusing `EffectLayersField.vue` for structured layer editing.
- [x] Named Effects configurations support existing structured Effects presets.
- [x] Named Effects configurations may inherit Global/default Effects or opt into **Independent Effects** mode.
- [x] Global Effects custom mode may coexist with Scene-referenced named Effects definitions; global `customText` is cleared from named entity compilation and cannot leak into their specifications.
- [x] Global panel edits, including Clear, are adapter-guarded so they preserve sibling named entity state.
- [x] Unused named Effects configurations remain stored but stay out of prompt output.
- [x] Scene-referenced Effects configurations emit `{effects_*}` definitions.
- [x] Scene wording: `Apply {effects_*} as this scene's effects.`
- [x] Layout-off consumption gating preserves Effects/Scene state while suppressing Scene-related Effects definitions.
- [x] Static compiler/UI-path sanity review completed.
- [ ] Running-app UI/compile validation.
- [ ] Real image validation with repeated Scene content and contrasting Effects stacks if useful.

**Result:** implemented / validation pending.

### Remaining Phase 6 candidates

Next conversion target after Effects validation:

- [ ] Texture / Material
- [ ] other suitable modules after audit.

Exact order may change based on specialized module constraints and real workflow tests.

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
- [ ] Audit generic entity support for module-specific custom-input sidecars and other specialized field patterns.

## Phase 9 — Regression and migration

- [ ] Old drafts load without destructive migration.
- [ ] Prompts without Scenes remain behaviorally equivalent.
- [ ] Existing Layout/Pose/Expression/Color/Material semantics remain functional.
- [ ] Re-validate typed user `reference` ownership and Setup alias restoration.
- [ ] Re-validate Scene-local Form/Camera/Framing/Background/Lighting/Style/Effects definitions across Modular/Natural/JSON as applicable.
- [ ] Import/export JSON remains valid or gets explicit migration.
- [ ] Final user acceptance tests.

## Phase 10 — Merge readiness

- [ ] Rebase/validate against intended `main` if required.
- [ ] Verify no unrelated changes.
- [ ] Finalize docs.
- [ ] Receive explicit final user approval for final branch synchronization.
- [ ] Move/merge remaining branch work to `main` only after that approval.

---

# Accepted validation scenario — multi-scene retro comic

The core accepted workflow uses:

```text
{idea} → references {scenes} and {layout}
{scenes} → nested scene descriptions + optional reusable module refs
{layout} → stable Region → Scene bindings
```

Accepted Framing example:

```text
{framing} =
• Global/default framing: ...
• {framing_closeGrass} = ...
• {framing_wideConversation} = ...

{scenes} =
• {scene_topScene} = ... Frame this scene with {framing_wideConversation}.
• {scene_centerScene} = ... Frame this scene with {framing_closeGrass}.
• {scene_bottomScene} = ... Frame this scene with {framing_wideConversation}.
```

Accepted Background example:

```text
{background} =
• Global/default background: ...
• {background_openSea} = ...
• {background_darkGraffitiClub} = ...

{scenes} =
• {scene_topScene} = ... Use only {background_openSea} as this scene's background.
• {scene_centerScene} = ... Use only {background_darkGraffitiClub} as this scene's background.
• {scene_bottomScene} = ... Use only {background_openSea} as this scene's background.
```

Accepted Lighting example:

```text
{lighting} =
• Global/default lighting: ...
• {lighting_lighting1} = neutral soft environment light ...
• {lighting_lighting2} = soft key light with blue rim ...
• {lighting_lighting3} = magenta/cyan neon accent lighting ...

{scenes} =
• {scene_dup1} = [repeated scene content]. Light this scene with {lighting_lighting1}.
• {scene_dup2} = [repeated scene content]. Light this scene with {lighting_lighting3}.
• {scene_dup3} = [repeated scene content]. Light this scene with {lighting_lighting2}.
```

The real repeated-scene image test showed clearly different lighting treatments while Scene content, Background, and Framing remained intentionally repeated.

Accepted Style example:

```text
{style} =
• Global/default style: retro comic-book aesthetic, digital illustration, ...
• {style_style1} = cinematic realism aesthetic, photography
• {style_style2} = Art Deco aesthetic, vector illustration
• {style_style3} = claymation aesthetic, hand-modeled clay, handcrafted finish ...

{scenes} =
• {scene_topScene} = [reusable scene content]. Use {style_style1} as this scene's visual style.
• {scene_centerScene} = [reusable scene content]. Use {style_style2} as this scene's visual style.
• {scene_bottomScene} = [reusable scene content]. Use {style_style3} as this scene's visual style.
```

The real Style image test produced visibly distinct photographic/cinematic, graphic/vector-like, and claymation treatments while the Scene architecture remained reference-driven.

Selected configuration payloads are defined by owning modules and are never repeated inside `{scenes}`.

---

# Implementation rules

1. Inspect latest branch history and this file before changes.
2. Keep subsequent refactor commits on `refactor/scene-entity-composition`; do not move `main` again without explicit user approval.
3. Stable IDs are canonical identity; tokens are representation.
4. Scene stores references, never duplicated module payload state.
5. Description is canonical Scene content; avoid redundant parallel representations.
6. Region owns Scene placement.
7. Preserve global/default behavior and old drafts unless explicit migration is defined.
8. Keep shared Key Module behavior centralized; document explicit adapter exceptions.
9. Prefer concise nested compiler text over restating information already defined elsewhere.
10. Missing references remain missing; never auto-retarget.
11. Keep compiler behavior explicit and testable.
12. Scene-local configurations must never leak into unrelated Scenes.
13. Reference precise module tokens such as `{layout}` instead of repeating their structural data in prose.
14. Typed user variables may take prompt-output ownership from generated Setup aliases.
15. Exact literal image-model adherence to Layout geometry is not a compiler correctness requirement.
16. Scene-component application wording stays centralized.
17. Generic scalar Scene resources reuse `scene-resource.vue` and `compileSceneResourceModule()` unless specialized semantics require an adapter.
18. Specialized scalar adapters must preserve their existing canonical compiler behavior.
19. Structured module fields such as Lighting `lightSources` and Effects `effectLayers` must remain structured in named entity state and reuse specialized editors when generic scalar inputs are insufficient.
20. Scene-resource-specific UX/compile behavior such as Independent entity controls or preserving named definitions during Global custom mode must be capability-driven rather than scattered module-key conditionals.
21. Persisted freeform values must remain raw user-authored values; UI reconstruction may add temporary presentation options but must not rewrite persistence identity or compiler text.
22. Specialized global panels wrapped by entity adapters must preserve unknown sibling entity state during global resets/edits.
23. Update this document with architectural changes and phase status.
