# Actions API Source Audit

Audit baseline: `main@3db3294ba738c09a04a8d1f79bdc430f2d7a8e83`

## Summary

Prompt Draft already has a strong domain/read foundation: stable identities, normalizers, reference catalogs, module schemas, compilers, and several reusable factories. The missing layer is a canonical write/application boundary. Most create/update/delete and cross-field mutation semantics still live inside Vue components.

The Actions API should therefore be built by extracting canonical domain mutations, not by wrapping arbitrary component state or adding a generic JSON patch layer.

## Current architectural shape

```text
Vue Components
     |
 create/update/delete
     |
Canonical State
     |
 +-- Normalizers
 +-- Resolvers/catalogs
 +-- Validators
 +-- Compilers
```

Desired shape:

```text
UI / Wizard / Templates / AI
            |
        Actions API
            |
      Domain Services
            |
    Canonical Draft State
            |
 normalizers/resolvers/validators/compilers
```

## Domain audit

### Draft / create page

Current canonical draft snapshot already has a useful serializable shape:

```ts
type PromptDraftSnapshot = {
  version: 1
  selectedModuleKeys: string[]
  moduleValues: Record<string, ModuleValues>
  modulePanelStates: Record<string, ModulePanelState>
  promptSettings: PromptSettings
  outputFormat: PromptOutputFormat
  updatedAt: string
}
```

Current `create.vue` owns too many responsibilities at once:

- active draft state
- saved draft collection
- persistence/localStorage
- autosave coordination
- import/export/share
- snapshot apply/create/reset
- create-page context actions

Extraction need:

- move reusable draft state contracts/helpers into headless files;
- keep storage/browser behavior in an adapter/service separate from Actions API execution;
- actions operate on canonical draft state, not directly on localStorage or page refs.

### Module registry and scalar fields

Strong existing foundation:

- central module registry;
- `ModuleField` / `ModuleFieldType` schema;
- module defaults and presets;
- generic compiler fallback;
- module entity capability decorators;
- custom-input companion-state helpers.

Good candidate for generic actions:

- simple scalar fields (`text`, `textarea`, `select`, `multiSelect`, `checkbox`, `color`, `number`, `range`);
- module activation/deactivation;
- reset/default/preset application.

Not suitable for unrestricted generic patching:

- `sceneEntities`
- `layoutRegions`
- `materialAssignments`
- `poseAssignments`
- `expressionAssignments`
- `outfitSets`
- `hairStyles`
- `lightSources`
- `effectLayers`
- `textGroups`
- `variables`

These require domain-specific services.

### Variables

Existing reusable domain utilities include:

- key normalization;
- case-insensitive identity;
- reserved-key checks;
- unique-key generation;
- token formatting;
- definition formatting;
- reference extraction;
- validation.

Gap:

Variable create/edit/duplicate/delete lifecycle is still UI-owned.

Recommended service boundary:

- `createVariable`
- `updateVariable`
- `duplicateVariable`
- `removeVariable`
- `setVariableEnabled`

### Generic named module entities

The entity refactor created a strong reusable contract:

- opaque stable `id`;
- editable `key` / `name`;
- `enabled`;
- `inheritGlobal`;
- local `payload`;
- stable `ModuleEntityRef` identity (`moduleKey + entityId`);
- Scene-selection cardinality and target-policy capability metadata.

Existing helpers already cover read/resolve behavior:

- create entity ID;
- normalize/get/set entity list;
- resolve inherited values;
- create stable refs;
- inspect entity capabilities.

Gap:

Lifecycle semantics are still primarily implemented by editors.

Recommended service boundary:

- create/update/duplicate/delete entity;
- set enabled/inheritance;
- set entity field;
- apply entity preset;
- enforce key uniqueness where relevant.

### Scene

Existing domain/read foundation:

- `SceneEntity` and stable `SceneComponentRef`;
- Scene normalization;
- stable module-entity resolver;
- Scene compiler and compile issues;
- module capability/cardinality metadata.

UI currently owns:

- create/duplicate/delete Scene;
- unique semantic key generation;
- name/key edits;
- single/multiple component attachment;
- detach/replace behavior;
- presentation metadata refresh;
- missing/unavailable recovery actions.

Recommended service boundary:

- Scene lifecycle;
- component attach/detach/replace;
- stable-reference reconciliation;
- cardinality validation.

### Layout

Strong headless utilities already exist:

- region/grid normalization;
- cloning;
- region creation and ID generation;
- bounds clamping;
- stable Scene `contentRef` shape.

UI currently owns:

- create/edit/duplicate/delete/move region;
- Scene binding/reconciliation;
- compatibility synchronization of `contentRef` and legacy `contentKey`;
- visual-builder application.

Recommended service boundary:

- region lifecycle;
- region reorder;
- grid update;
- Scene assign/clear;
- explicit legacy upgrade/reconciliation helper.

### Semantic target/catalog layer

The generic reference catalog already provides strict canonical resolution states:

- `resolved`
- `unavailable`
- `missing`

The semantic target layer already owns stable identity and representation helpers.

Gap:

`useSemanticTargetCatalog()` is Vue/i18n/global-state aware. It is useful as a UI adapter, but should not become the Actions API domain dependency.

Recommended extraction:

- pure `buildSemanticTargetCatalog(context)`;
- pure `resolveSemanticTarget(context, ref)`;
- pure `querySemanticTargets(context, query)`;
- keep current composable as reactive/presentation adapter.

### Color / Material assignment scopes

Existing read/resolve behavior is strong. Scope editors correctly preserve missing/unavailable refs and require explicit replacement/removal.

Mutation semantics that should move to services:

- resolve selected targets;
- add/remove custom target/exception;
- target/exception conflict cleanup;
- exclusivity handling;
- assignment lifecycle and preset application.

### Pose / Expression

Structured assignments include domain-specific payloads plus semantic targets. UI currently owns normalization, lifecycle, preset application, target changes, and preset detachment.

Recommended service boundary:

- assignment lifecycle;
- preset application;
- field changes that detach presets;
- target mutation through shared semantic-target services.

### Lighting

Structured `LightingSource` lifecycle lives in the editor. Important semantics include maximum source count and custom color companion state.

Recommended service boundary:

- create/update/delete source;
- normalize source;
- color/custom-color transition rules.

### Effects

Structured `EffectLayer` lifecycle lives in the editor. Custom effect text is coupled to `effectType === "custom"`.

Recommended service boundary:

- create/update/delete layer;
- normalize custom-effect transitions;
- preset/layer constraints as applicable.

### Typography

This domain is already comparatively headless:

- stable ID factory;
- group/text factory;
- normalization and cloning utilities.

Remaining extraction:

- group lifecycle;
- text lifecycle within groups;
- reorder/move behavior;
- updates that preserve canonical IDs and custom sidecars.

### Hair

Hair is a specialized structured domain and must remain explicit. UI currently contains substantial behavior for:

- style lifecycle;
- source modes and references;
- stable keys;
- property state modes (`inherit`, `reference`, `absent`, `custom`, option);
- component lifecycle/starters;
- target changes;
- preset detachment.

Do not replace this with generic array/object patch actions.

### Outfit

Outfit is also specialized. Critical mutation semantics include:

- set/item stable IDs and keys;
- duplicating sets while remapping nested item IDs;
- remapping relation endpoints during duplication;
- deleting relations attached to removed items;
- preset/starters;
- target changes.

These invariants require a dedicated Outfit service.

### Prompt compilation

`compileModule()` is largely headless and dispatches to specialized compilers.

The top-level `compilePrompt.ts` wrapper still reads and mutates global prompt-variable composable state for user-variable ownership behavior. This prevents it from being a fully headless draft compile API.

Recommended target:

```ts
compilePromptFromDraft({
  draft,
  format,
})
```

with explicit derived context rather than implicit Vue/global state.

## Extraction priority

Lowest risk / highest leverage first:

1. draft contracts + action runtime;
2. variables;
3. simple module fields/presets;
4. generic module entities;
5. typography;
6. Scene + Layout;
7. semantic target mutations and assignment modules;
8. Lighting/Effects;
9. Hair/Outfit;
10. headless whole-draft validation/compile;
11. transactions/orchestration;
12. Expert UI migration.

## Anti-goals confirmed by audit

- no universal `patch(path, value)` public action;
- no action that calls a Vue component method;
- no dependency on open modal/editor state;
- no token/name fallback for stable reference resolution;
- no attempt to force Hair/Outfit/Scene/Layout into one generic entity CRUD implementation;
- no duplicate implementation of a mutation for Wizard vs Expert UI.
