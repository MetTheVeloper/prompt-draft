# Scene & Entity Composition Refactor

> **Status:** Phase 7 — catalog architecture and consumer migration complete; Phase 7.5 running-app/regression validation is current
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

1. **Repeatable Module Entities** — named reusable configurations owned by modules.
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

A Scene can reference reusable module configurations such as Form, Camera, Framing, Background, Lighting, Style, Effects, and Texture / Material.

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

## 2. Existing module state remains global/default

Existing top-level module state remains backward compatible.

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

Structured fields remain structured inside `payload`; they are never flattened merely to fit the generic entity contract.

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

texture: {
  enabled: true,
  sceneExposable: true,
  sceneSelection: "single",
  targetPolicy: [],
  allowGlobalInheritanceToggle: true,
  preserveEntitiesInCustomMode: true,
}
```

Camera, Framing, Background, Lighting, Style, Effects, and Texture are Scene resources and do not need meaningless **outer** subject/object targets.

Texture is a special case conceptually: a named Texture configuration has no outer target selector because its structured `materialAssignments` already own semantic targets internally. One configuration can therefore contain material rules for subject, background, outfit, hair, typography, accents, or other eligible targets.

Scene-resource UX/compile options that are meaningful only for some modules are capability-driven. Style, Effects, and Texture opt into an Independent configuration model and keep Scene-referenced named definitions available while their Global/default panel is in custom mode.

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

Texture / Material is an explicit adapter case because the module is assignment-driven rather than scalar. `compileTextureModule()` remains canonical, `texture-stable.vue` keeps the existing specialized global panel, and `TextureEntitiesField.vue` reuses `MaterialAssignmentsField.vue` so material presets, freeform values, compatibility hints, assignment targets, and exceptions retain the existing structured semantics.

Named Configuration editors are secondary workspaces rather than permanent inline sections. Entity-capable Key Modules use `ModuleEntitiesPanelShell.vue` to expose one compact header FAB with the current configuration count. `useModuleEntitiesModal()` opens the existing editor component inside the project's global modal system and forwards edits live to canonical module state. Closing by Done, backdrop, Escape, or the modal close button never rolls changes back. The same generic and specialized editors are reused; no duplicate entity-editing implementation exists for the modal path.

The Named Configurations list itself remains visible when the workspace opens, but all existing entity cards start collapsed so the modal stays compact. A newly added configuration opens immediately for editing. Entity-capable module context menus also expose the same Named Configurations action through the shared panel-shell/context-menu path, so FAB and right-click access resolve to one modal workspace.

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
Texture: subject = handmade clay, background = polished metal, ...
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
{texture_clayScene}
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
Texture    → Use {tokens} as this scene's material and surface treatment.
```

The wording registry lives in `entityCapabilities.ts`, not scattered through `compileScene.ts`.

## 7. Scene-resource definitions are demand-driven

For Scene-oriented resources:

```text
Named entity exists but no active Scene references it
→ do not emit entity definition
→ legacy/global output stays unchanged

Active Scene references entity
→ owning module defines {module_entity}
→ Scene references that token
```

This keeps unused entity state out of prompts.

`compileSceneResourceModule()` supports both generic scalar compilation and specialized `compileValues` callbacks for modules such as Background, Lighting, Effects, and Texture. Scene-resource capability metadata can also opt into preserving referenced named definitions while Global/default custom mode is active and into exposing the shared Independent configuration control.

For structured compiler output, the helper keeps the canonical compiler text but indents multi-line specifications beneath their owning definition. This prevents Texture assignment bullets from being mistaken for sibling module definitions.

Example:

```text
{texture} =
• Global/default texture:
  • all scene surfaces: ...
  • background surface: ...
• {texture_clayScene} =
  • main subject: clay material; matte, porous, opaque, visible texture
  • background surface: polished metal material; high-gloss, smooth, opaque
```

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

# Completed Phase 6

## Phase 6 — Expand Scene-capable modules

General requirements for each conversion:

- preserve existing global/default output when no named entities are consumed;
- reuse generic entity infrastructure where semantics allow;
- choose explicit Scene cardinality;
- do not add meaningless target selectors;
- emit reusable definitions only when active Scenes reference them;
- keep stable IDs and missing-reference behavior;
- append concise Scene-local wording instead of payload duplication;
- preserve specialized compiler behavior through adapters when required.

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
- `customText` is the module override field. The UI uses the standard explicit `isCustomMode` switch.
- Lighting has no meaningful subject/object target semantics.

Implementation / validation:

- [x] Lighting is entity-capable and `sceneExposable`.
- [x] Lighting cardinality is `single` per Scene.
- [x] Lighting target policy is empty.
- [x] Existing global Lighting panel and `compileLightingModule()` remain canonical.
- [x] `lighting-stable.vue` adapts the specialized panel to generic entity state and Scene reference consumption.
- [x] `LightingEntitiesField.vue` reuses `LightSourcesField.vue` for structured source state.
- [x] Named Lighting configurations support existing presets and Independent Lighting.
- [x] Global `customText` and Scene-referenced named Lighting definitions coexist without override leakage.
- [x] Demand-driven output, stable refs, Layout-off persistence, disable/delete behavior, and custom-mode UX validated.
- [x] Controlled repeated-scene / different-lighting real image test validated distinct Scene-local Lighting treatments.

**Result:** complete and accepted.

### Phase 6.4 — Style

Style is a direct generic scalar Scene-resource conversion; it does not need a specialized compiler adapter.

Audit findings:

- The active registry module is `style.freeform.ts`.
- Style uses the standard Base Key Module panel and generic `compileModule()` path.
- Style presets contain scalar values and fit the shared entity preset system.
- Freeform Style selections persist authored text directly.
- Style has no meaningful subject/object target semantics.

Implementation / validation:

- [x] Style is entity-capable and `sceneExposable` with single Scene cardinality and empty target policy.
- [x] Named Style configurations reuse `scene-resource.vue`, `ModuleEntitiesField.vue`, and `compileSceneResourceModule()`.
- [x] Existing presets and freeform values work per named configuration.
- [x] Named Style configurations support Independent Style and coexist with Global custom mode.
- [x] Demand-driven compile, stable refs, Layout-off persistence, disable/delete behavior, and freeform reload behavior accepted.
- [x] Real multi-scene image test validated cinematic realism/photography, Art Deco/vector illustration, and claymation treatments on reusable Scene content.

**Result:** complete and accepted.

### Phase 6.5 — Effects

Effects requires a specialized Scene-resource adapter because the module owns structured effect-layer state and a dedicated natural-language compiler.

Audit findings:

- `effectLayers` is a structured `EffectLayer[]` field with up to eight layers.
- `compileEffectsModule()` is canonical and handles custom layer text, intensity wording, duplicate suppression, punctuation normalization, and `extraDetails`.
- Existing Effects presets contain structured `EffectLayer[]` values.
- Because one configuration can already contain a complete stack of layers, Effects cardinality is `single` per Scene.
- Effects is Scene-wide and has no meaningful subject/object target selector.

Implementation / validation:

- [x] Effects is entity-capable and `sceneExposable` with single Scene cardinality and empty target policy.
- [x] Existing specialized global `effects.vue` and `compileEffectsModule()` remain canonical.
- [x] `effects-stable.vue` adapts the specialized panel to generic stable entity state and demand-driven Scene consumption.
- [x] `EffectsEntitiesField.vue` reuses `EffectLayersField.vue` and preserves structured presets.
- [x] Named Effects supports Independent Effects and Global custom coexistence without `customText` leakage.
- [x] Global Clear/edit behavior preserves sibling named entity state.
- [x] Demand-driven output, stable refs, Layout-off persistence, disable/delete behavior, and Scene single-selection validated.
- [x] Running-app UI/compile validation accepted.
- [x] Real 2×2 UI-kit image test validated four Scene-local Effects stacks on repeated reference content: motion/speed lines, HUD/data overlay, VHS/scanline/noise, and magical particles/sparkle/aura.

**Result:** complete and accepted.

### Phase 6.6 — Texture / Material

Texture / Material is the final planned Phase 6 module conversion and requires a specialized adapter because the existing module is an assignment-driven semantic system rather than a scalar configuration.

Audit findings:

- The active registry module is `texture.freeform.ts`, which preserves the semantic Texture schema while adding first-class freeform options for material, finish, surface texture, optical character, and conditions.
- `materialAssignments` is a structured `MaterialAssignment[]`. Each assignment owns material properties plus its own semantic `targets` and `exceptions`.
- `MaterialAssignmentsField.vue` already owns the canonical UX for assignment creation, presets, compatibility hints, freeform options, target catalog integration, and exception scopes.
- `compileTextureModule()` is canonical. It normalizes assignments, orders them by semantic target specificity, compiles material/surface properties, and appends `extraDetails`.
- A named Texture configuration therefore represents a reusable **bundle of material assignments**, not one material scalar.
- No outer Scene-resource target selector is needed because assignment targets live inside the bundle.
- One Texture configuration can already describe multiple target-specific materials, so cardinality is `single` per Scene.
- Texture compiler output may contain multiple assignment bullets. Scene-resource formatting must preserve those bullets while clearly nesting them beneath their owning Global/default or `{texture_*}` definition.

Implementation / validation:

- [x] Texture is entity-capable and `sceneExposable`.
- [x] Texture cardinality is `single` per Scene.
- [x] Texture outer target policy is empty; semantic target selection remains inside each Material Assignment.
- [x] Existing specialized global `texture.vue` panel remains canonical.
- [x] Existing `compileTextureModule()` remains canonical for Global/default and named configuration specifications.
- [x] `texture-stable.vue` adapts the specialized global panel to generic stable entity state and demand-driven Scene consumption.
- [x] `TextureEntitiesField.vue` stores named Texture configurations through generic `ModuleEntity` identity while reusing `MaterialAssignmentsField.vue` for structured assignment editing.
- [x] Named Texture configurations retain assignment-level presets, freeform values, material compatibility hints, semantic targets, and exceptions.
- [x] Named Texture configurations may inherit Global/default Texture state or opt into **Independent Texture** mode.
- [x] Global Texture custom mode may coexist with Scene-referenced named Texture definitions; global `customText` is excluded from entity compilation and cannot leak into named specifications.
- [x] Specialized global panel edits are adapter-guarded so sibling named entity state is preserved.
- [x] `compileSceneResourceModule()` formats multi-line compiler output as nested definition content; existing single-line Scene-resource output is unchanged.
- [x] Unused named Texture configurations stay stored but out of prompt output.
- [x] Scene-referenced Texture configurations emit `{texture_*}` definitions.
- [x] Scene wording: `Use {texture_*} as this scene's material and surface treatment.`
- [x] Layout-off consumption gating preserves Texture/Scene state while suppressing Scene-related Texture definitions.
- [x] Static compiler/UI-path sanity review completed.
- [x] Running-app UI/compile validation accepted.
- [x] Real 2×2 reference-image test validated distinct Scene-local vinyl, brushed aluminum, transparent glass, and weathered leather material/surface bundles while Effects were simultaneously active.

**Result:** complete and accepted.

### Phase 6 UX closeout — Named Configurations workspace

The inline Named Configurations blocks became increasingly tall as structured editors gained real-world depth, especially Effects and Texture / Material. They are management workspaces, not information that must remain permanently visible in the Key Module page.

Implementation:

- [x] Form, Camera, Framing, Style, Background, Lighting, Effects, and Texture no longer render Named Configurations inline below the Global/default panel.
- [x] `ModuleEntitiesPanelShell.vue` provides one shared compact header launcher with an entity count and FAB.
- [x] `useModuleEntitiesModal()` opens the correct existing generic or specialized entity editor in the project's global modal system.
- [x] Modal edits are live and immediately update canonical module state and compiled output; dismissing the modal never rolls changes back.
- [x] Generic and specialized editor logic is reused directly; no modal-specific editor copies exist.
- [x] Desktop modal width and mobile near-full-screen sizing use the existing global modal scroll container.
- [x] Existing Named Configuration entity cards start collapsed whenever the workspace opens; the list remains visible and newly added configurations open immediately for editing.
- [x] Right-click context menus for entity-capable Key Modules expose a Named Configurations action through the shared panel shell and `usePageContextMenu()` augmentation path.
- [x] Running-app visual/interaction validation accepted for FAB access, modal workflow, live edits, collapsed defaults, and context-menu access.

**Result:** complete and accepted.

### Phase 6 completion gate

- [x] All planned Scene-capable module conversions are complete and accepted.
- [x] Compact Named Configurations modal UX accepted after running-app validation.
- [x] Phase 6 closed; continue to Phase 7 — Generalize semantic/reference catalog.

---

# Current phase

## Phase 7 — Generalize semantic/reference catalog

Phase 7 does **not** change prompt semantics by itself. Its goal is to consolidate the increasingly duplicated logic that discovers, filters, labels, groups, and resolves semantic targets and stable references across editors while preserving the module-specific rules that already work.

The approved architectural boundary is deliberately narrower than a universal picker abstraction:

```text
Canonical domain data
        ↓
Shared reference catalog / resolver
  • canonical identity
  • current presentation metadata
  • resolved / unavailable / missing state
  • optional generic capabilities / eligibility query
        ↓
Consumer-specific policy
  • Scene cardinality
  • Form subject/object policy
  • Texture target/exception semantics
  • Layout contentKey compatibility
  • Typography/Hair/Outfit domain rules
        ↓
Existing specialized picker / editor UX
```

Stable IDs remain canonical wherever they exist. Tokens, semantic keys, names, labels, and descriptions are presentation/representation only and must never become fallback identity for a missing stable reference.

### Phase 7.1 — Audit existing catalogs and pickers

- [x] Inventory every target/reference option source and every picker that builds its own catalog.
- [x] Trace identity used by each path: semantic token, stable entity ID, module/entity pair, Scene ID, Region content ref, or compatibility-only string.
- [x] Identify duplicated eligibility/filtering/grouping/label logic versus genuinely module-specific behavior.
- [x] Explicitly audit Scene component selection, Form target selection, Texture Material Assignment targets/exceptions, Layout Region → Scene selection, and existing entity-oriented systems such as Typography/Hair/Outfit where relevant.
- [x] Record current missing/disabled/deleted-reference behavior before changing shared infrastructure.

Audit result:

- seven semantic/reference families remain meaningfully distinct at the policy level: Scene components, Form targets, Texture assignment targets/exceptions, Layout Region → Scene, Typography, Hair, and Outfit;
- the repeated machinery is primarily canonical-ID lookup, current presentation refresh, availability/missing representation, and option-source filtering/grouping;
- module-specific eligibility and compiler semantics stay specialized rather than moving into the generic resolver.

### Phase 7.2 — Define the reusable catalog contract

- [x] Define one reusable catalog item/reference contract with canonical identity plus presentation metadata.
- [x] Keep stable IDs canonical where stable IDs exist; tokens/names remain representation only.
- [x] Support eligibility predicates/capabilities instead of hard-coded picker-specific filtering.
- [x] Support grouping, labels/descriptions, semantic kind/scope, enabled/disabled state, and missing-reference recovery metadata without forcing every consumer to use every field.
- [x] Preserve module-specific policies through adapters/capabilities rather than flattening specialized semantics.

Current contract:

- `ReferenceCatalogItem` owns canonical `identity`, the persisted/reference value, presentation metadata, optional kind/scope/capabilities/state, and optional consumer metadata;
- `ReferenceCatalogResolution` has explicit `resolved`, `unavailable`, and `missing` states;
- duplicate canonical identities fail loudly in the shared index instead of silently choosing an arbitrary target;
- generic queries may filter by capabilities and consumer-supplied eligibility predicates without teaching the generic layer what Form, Texture, Layout, or another module means.

### Phase 7.3 — Build shared catalog/resolver infrastructure

- [x] Introduce reusable catalog-building/resolution utilities or composables after the audit proves the correct boundary.
- [x] Add adapters for current semantic targets and stable entity references rather than destructively rewriting persisted state.
- [x] Centralize duplicate identity, availability, missing, and safe presentation-refresh resolution while keeping consumer-specific wording/grouping local.
- [x] Keep missing references representable and never silently auto-retarget them.

Implemented infrastructure:

- `app/utils/referenceCatalog.ts` — generic catalog contract, strict canonical index, resolver, availability state, and capability/eligibility query;
- `app/utils/semanticReferenceCatalog.ts` — adapter from existing `SemanticTargetRef` option sources to the generic resolver while preserving `semanticTargetIdentity()` as canonical identity;
- `app/utils/moduleEntityReferenceCatalog.ts` — stable `ModuleEntityRef` adapter using `moduleKey + entityId`, with enabled/unavailable state and refreshed presentation metadata;
- `app/utils/sceneReferenceCatalog.ts` — stable Layout Region → Scene adapter using `scene:${entityId}` plus an explicitly separate compatibility-only legacy `{scene_*}` token lookup for drafts that do not yet have a stable `contentRef`;
- `scripts/reference-catalog.test.ts` — regression coverage for rename, missing, unavailable, no token/name retarget, duplicate identity, capability filtering, semantic entity IDs, module-scope isolation, Scene stable refs, and legacy Scene-token migration boundaries.

The isolated runtime resolver/catalog validation currently passes **15/15** invariants. Full Nuxt/running-app regression remains part of Phase 7.5.

### Phase 7.4 — Migrate consumers incrementally

- [x] Move overlapping picker/catalog consumers to the shared infrastructure one at a time.
- [x] Keep specialized UI components where their UX is genuinely different; Phase 7 generalizes data/catalog semantics, not necessarily every visual picker.
- [x] Preserve Scene cardinality, target policies, Texture assignment scopes/exceptions, Region → Scene stable refs, and entity enable/disable behavior in migrated source paths.
- [x] Avoid unrelated compiler/output changes while catalog plumbing is being consolidated.

Migrated consumers:

- `useModuleEntityTargets.ts` — subject/object eligibility remains local; availability/upgrade resolution is shared;
- `useSubjectAssignmentTargets.ts` — subject-specific option discovery remains local; availability/upgrade resolution is shared;
- `useSemanticTargetCatalog.ts` — builtin/module/Typography/user discovery, capability filtering, grouping, missing UX, and summaries remain specialized while canonical availability/upgrade resolution is shared;
- `AssignmentScopeEditor.vue` — target/exception missing detection now uses the same semantic resolver rather than rebuilding an identity set independently; custom/exclusive/conflict semantics remain local;
- `SceneEntitiesField.vue` — Scene-exposable discovery and single/multiple cardinality remain unchanged while stable module-entity lookup, missing detection, disabled state, and current reference presentation use the shared module-entity adapter;
- `LayoutRegionsField.vue` — stable Region → Scene reconciliation/list status use the Scene resolver; rename refreshes cached token/label/contentKey by stable ID, deleted refs remain missing, and legacy token upgrade runs only when no stable `contentRef` exists;
- `LayoutRegionEditorModal.vue` — Scene picker items, missing/unavailable state, selection, and save-time presentation refresh use the same Scene resolver while preserving manual `contentKey` compatibility behavior.

Consumer-boundary audit after migration:

- Texture / Material targets and exceptions both flow through `MaterialAssignmentsField → AssignmentScopeEditor → useSemanticTargetCatalog`; no parallel material-only reference resolver remains;
- Typography, Hair, and Outfit export their existing stable domain `entityId` values through `promptVariableCatalog.ts` and attach semantic capabilities there, so they are consumed naturally by the semantic adapter and do not justify extra resolver layers;
- no additional consumer migration is currently justified merely for abstraction symmetry.

**Result:** source migration complete; proceed to Phase 7.5 validation.

### Phase 7.5 — Validation and exit gate

- [ ] Verify old drafts and current branch drafts resolve the same valid targets/references after migration.
- [ ] Verify rename keeps stable references intact in the running app across every migrated stable-reference path.
- [ ] Verify delete/disable leaves references missing/unavailable rather than silently retargeting across every migrated consumer.
- [ ] Verify Scene, Form, Texture, Layout, and other migrated consumers expose the same eligible choices as before unless an explicit bug is documented and intentionally fixed.
- [ ] Confirm prompt output remains behaviorally unchanged for accepted Phase 2–6 scenarios.
- [x] Update this source of truth with the final catalog architecture and complete migrated consumer list.

Static validation checkpoint:

- isolated resolver/catalog runtime harness passes **15/15** identity, rename, unavailable, missing, scope-isolation, and legacy-migration invariants;
- branch comparison from Phase 7 start (`04874f5`) through the migration checkpoint changes only catalog utilities, picker/composable plumbing, tests, package script, and this document;
- no prompt compiler file or persistence/domain schema/type file was changed by Phase 7;
- GitHub reports no CI/status checks for the current branch commits;
- a full Nuxt checkout/build could not be executed in the current tool environment because direct GitHub network access is unavailable, so running-app regression remains the acceptance gate.

**Result:** in progress — catalog architecture and source migration are complete; running-app regression/acceptance is current.

---

# Later phases

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
- [ ] Re-validate Scene-local Form/Camera/Framing/Background/Lighting/Style/Effects/Texture definitions across Modular/Natural/JSON as applicable.
- [ ] Import/export JSON remains valid or gets explicit migration.
- [ ] Final user acceptance tests.

## Phase 10 — Merge readiness

- [ ] Rebase/validate against intended `main` if required.
- [ ] Verify no unrelated changes.
- [ ] Finalize docs.
- [ ] Receive explicit final user approval for final branch synchronization.
- [ ] Move/merge remaining branch work to `main` only after that approval.

---

# Accepted validation scenarios

The core accepted workflow uses:

```text
{idea} → references {scenes} and {layout}
{scenes} → nested scene descriptions + optional reusable module refs
{layout} → stable Region → Scene bindings
```

## Framing

```text
{framing} =
• Global/default framing: ...
• {framing_closeGrass} = ...
• {framing_wideConversation} = ...

{scenes} =
• {scene_topScene} = ... Frame this scene with {framing_wideConversation}.
• {scene_centerScene} = ... Frame this scene with {framing_closeGrass}.
```

## Background

```text
{background} =
• Global/default background: ...
• {background_openSea} = ...
• {background_darkGraffitiClub} = ...

{scenes} =
• {scene_topScene} = ... Use only {background_openSea} as this scene's background.
• {scene_centerScene} = ... Use only {background_darkGraffitiClub} as this scene's background.
```

## Lighting

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

## Style

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

## Effects

```text
{effects} =
• {effects_effects1} = Effects: strong graphic speed-line overlay; balanced composited motion trails.
• {effects_effects2} = Effects: balanced HUD interface overlay; restrained data-readout interface graphics overlay.
• {effects_effects3} = Effects: strong VHS signal-tracking artifacts; balanced horizontal scanline overlay; balanced added digital signal noise.
• {effects_effects4} = Effects: balanced composited magical-particle VFX; restrained composited sparkle-highlight overlay; balanced composited energy-aura VFX around the subject.

{scenes} =
• {scene_scene1} = [repeated reference content]. Apply {effects_effects1} as this scene's effects.
• {scene_scene2} = [repeated reference content]. Apply {effects_effects2} as this scene's effects.
• {scene_scene3} = [repeated reference content]. Apply {effects_effects3} as this scene's effects.
• {scene_scene4} = [repeated reference content]. Apply {effects_effects4} as this scene's effects.
```

The accepted 2×2 UI-kit image test produced four clearly distinct treatments while reference composition and region placement remained consistent enough to validate Scene-local Effects isolation.

## Texture / Material

```text
{texture} =
• {texture_texture1} =
  • all scene surfaces: vinyl material; satin, smooth, opaque, subtle texture, clean
• {texture_texture2} =
  • all scene surfaces: aluminum material; satin, brushed, opaque, visible texture, clean
• {texture_texture3} =
  • all scene surfaces: glass material; glossy, smooth, transparent, subtle texture, clean
• {texture_texture4} =
  • all scene surfaces: leather material; matte, fine grain, opaque, visible texture, weathered, scratches

{scenes} =
• {scene_scene1} = [repeated reference content]. Use {texture_texture1} as this scene's material and surface treatment.
• {scene_scene2} = [repeated reference content]. Use {texture_texture2} as this scene's material and surface treatment.
• {scene_scene3} = [repeated reference content]. Use {texture_texture3} as this scene's material and surface treatment.
• {scene_scene4} = [repeated reference content]. Use {texture_texture4} as this scene's material and surface treatment.
```

The accepted 2×2 image test showed the material/surface axis is interpreted even when Effects are more visually dominant: vinyl remained smooth/subtle, aluminum read as cooler/brushed, glass read as smooth/transparent, and leather carried visible grain/weathering. Stronger material visibility is a prompt-strength/scope choice rather than a Scene-resource compiler requirement.

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
18. Specialized adapters must preserve their existing canonical compiler behavior.
19. Structured module fields such as Lighting `lightSources`, Effects `effectLayers`, and Texture `materialAssignments` must remain structured in named entity state and reuse specialized editors when generic scalar inputs are insufficient.
20. Scene-resource-specific UX/compile behavior such as Independent entity controls or preserving named definitions during Global custom mode must be capability-driven rather than scattered module-key conditionals.
21. Persisted freeform values must remain raw user-authored values; UI reconstruction/presentation must not rewrite persistence identity or compiler text.
22. Specialized global panels wrapped by entity adapters must preserve unknown sibling entity state during global resets/edits.
23. Multi-line specialized compiler output must remain clearly nested beneath the Global/default or named definition that owns it.
24. Named Configuration management belongs in the shared modal workspace; wrappers expose one compact launcher and must reuse the canonical entity editor component.
25. Modal entity edits are live state edits, not a temporary transaction; dismissing the workspace must not discard valid changes.
26. Existing Named Configuration entity cards start collapsed whenever the modal workspace opens; the list remains visible and newly added configurations may open immediately for editing.
27. Entity-capable Key Module context menus expose the same Named Configurations workspace action as the header FAB.
28. Shared semantic/reference catalog work must preserve canonical identities and module-specific eligibility rules; consolidation must never silently change target/reference meaning.
29. Update this document with architectural changes and phase status.
30. Legacy token matching is compatibility-only and may upgrade a reference only when no stable reference exists; it must never rescue or retarget a missing stable reference.
