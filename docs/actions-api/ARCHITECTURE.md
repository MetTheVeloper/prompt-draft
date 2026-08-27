# Actions API Architecture

## 1. Canonical draft state

The Actions API operates on serializable application state, never Vue refs or component-local state.

```ts
export type PromptDraftState = {
  version: 1
  selectedModuleKeys: string[]
  moduleValues: Record<string, ModuleValues>
  modulePanelStates: Record<string, ModulePanelState>
  promptSettings: PromptSettings
  outputFormat: PromptOutputFormat
}
```

Timestamps, active draft IDs, collection membership, autosave status and storage metadata are session concerns, not domain mutation input.

Persistence records may extend the canonical state:

```ts
export type PromptDraftRecord = PromptDraftState & {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}
```

## 2. Draft session boundary

```text
DraftSession
  - active state
  - replace/apply state
  - persistence scheduling
  - import/export integration

ActionsRuntime
  - receives PromptDraftState
  - executes one canonical domain mutation
  - returns next PromptDraftState + structured result
```

The create page may progressively delegate to this boundary while keeping its UX and persistence behavior unchanged.

## 3. One canonical mutation rule

Every domain mutation has one canonical implementation outside Vue components.

```text
Expert UI ─┐
Wizard ────┼─> Action / adapter ─> Domain Service ─> Canonical Draft State
AI Planner ┘
```

Domain services must not:

- open modals or menus;
- display toasts;
- write localStorage;
- depend on DOM APIs;
- depend on component instances;
- import Vue/Nuxt composables for runtime facts;
- silently repair missing stable references by fuzzy matching.

## 4. Action definition

```ts
export type ActionDefinition<TInput, TData = unknown> = {
  id: string
  description: string
  inputSchema?: ActionInputSchema
  canExecute?: (
    context: ActionContext,
    input: TInput,
  ) => ActionAvailability
  execute: (
    context: ActionContext,
    input: TInput,
  ) => ActionExecutionResult<TData>
}
```

The schema representation remains small and repository-owned until real complexity justifies a third-party validator.

## 5. Action context and explicit environment

Actions receive all required facts explicitly.

```ts
export type ActionEnvironment = {
  activeSystemVariableKeys?: readonly string[]
  semanticTargetSources?: Partial<
    Record<SemanticTargetCapability, readonly SemanticReferenceCatalogSource[]>
  >
  subjectAssignmentTargets?: readonly SemanticReferenceCatalogSource[]
}

export type ActionContext = {
  draft: PromptDraftState
  modules: readonly PromptKeyModule[]
  environment?: ActionEnvironment
  idFactory?: ActionIdFactory
}
```

`environment` contains runtime/domain facts that are not persisted in the draft but are needed for a deterministic decision. Concrete examples now include:

- active system/module variable keys used to reject user-variable key collisions;
- capability-scoped semantic target sources used by Color/Material assignments;
- exact subject-variable target sources used by Pose/Expression assignments without importing the Vue `useSubjectAssignmentTargets()` adapter.

For subject assignment targets, source ordering is an explicit input: create may select the first available supplied subject source to mirror current Expert UI behavior. Existing missing/unavailable persisted references are still matched only by stable semantic identity; token/name presentation changes never authorize retargeting.

Rules:

- domain/actions must not read `usePromptVariables()`, Pinia, i18n, screen size, modal state or other ambient Vue/Nuxt state;
- if a runtime fact is required, add the smallest explicit environment contract needed;
- environment values are inputs, never hidden mutation targets;
- translation stays in UI adapters; issue `code` is the authoritative machine contract.

## 6. Results and expected failures

Expected domain rejection does not throw.

```ts
export type ActionExecutionResult<TData = unknown> =
  | {
      ok: true
      draft: PromptDraftState
      data?: TData
      warnings?: ActionIssue[]
    }
  | {
      ok: false
      draft: PromptDraftState
      issues: ActionIssue[]
    }
```

On failure `draft` is the original caller state. Registry execution uses detached clones so an action cannot mutate the caller by accident.

```ts
export type ActionIssue = {
  code: string
  message?: string
  path?: string
  details?: Record<string, unknown>
}
```

## 7. Registry and discovery

The runtime supports:

```ts
registry.get(id)
registry.has(id)
registry.list()
registry.execute(id, context, input)
```

Discovery metadata exposes action ID, description and input schema. It does not expose arbitrary implementation paths.

## 8. Domain service families

Expected service families:

```text
draft
module
variable
moduleEntity
typography
scene
layout
semanticTarget
colorPalette
texture
pose
expression
lighting
effects
hair
outfit
prompt
```

Services are implementation boundaries; action namespaces are consumer-facing contracts. They do not need a one-to-one mapping.

Shared internal primitives are allowed when they preserve a narrow invariant across specialized domains. For example, `subjectAssignmentTargets` is an internal exact-reference mutation primitive shared by Pose/Expression; it does not publish a generic cross-domain assignment action.

## 9. Generic vs specialized mutations

### Generic operations

Safe generic operations must be schema-backed and narrow:

```text
module.activate
module.deactivate
module.field.set
module.preset.apply
module.customMode.set
```

`module.field.set` is deliberately limited to simple field types:

```text
text
textarea
select
multiSelect
checkbox
color
number
range
```

Structured field types reject and require domain-specific actions.

### Specialized operations

Examples:

```text
scene.component.attach
layout.region.assignScene
outfit.item.delete
hair.style.setSource
typography.text.create
texture.assignment.update
```

A generic JSON/path patch API is prohibited for these invariants.

## 10. Module activation semantics

Activation and removal are different operations in the current product.

`module.activate`:

- adds the module key when inactive;
- preserves existing inactive module values/panel state;
- initializes canonical defaults/panel state only when state is missing.

`module.deactivate`:

- removes only the key from `selectedModuleKeys`;
- preserves `moduleValues[moduleKey]`;
- preserves `modulePanelStates[moduleKey]`.

This matches toggling a module from the current module selector. Destructive removal from a module panel is a different behavior and must not be silently folded into `module.deactivate`.

## 11. Module field / preset semantics

### Freeform

For a field option marked `freeform`, authored text becomes the field value itself.

### `customInput`

For `customInput`, the field keeps its sentinel selection (normally `"custom"`) while authored text lives in the companion key:

```ts
field.customInput?.valueKey || `${field.id}Custom`
```

`module.field.set` preserves this distinction.

### Presets

`module.preset.apply`:

- overlays only values owned by the preset;
- preserves unrelated module state;
- updates `activePresetId`;
- exits Custom Mode;
- synchronizes `customInput` companion state when a preset changes the owning field.

Changing a normal field clears `activePresetId` only if the current values no longer match the active preset.

### Reset is intentionally deferred

`module.reset` is not published yet. Current Clear/Reset behavior differs between generic and specialized panels, so a generic reset contract would be misleading until those semantics are explicitly canonicalized.

## 12. Stable reference policy

All services consuming persisted references follow these rules:

1. resolve using canonical stable identity;
2. preserve missing identity unless the operation explicitly removes/replaces it;
3. unavailable references remain unavailable, never silently substituted;
4. legacy token lookup is restricted to explicit compatibility/upgrade paths where no stable identity exists;
5. replacement is always explicit.

Pose/Expression subject-target mutation follows the same policy with one additional boundary: new targets must resolve exactly against explicit `subjectAssignmentTargets` environment sources, while an exact already-persisted orphan may be retained or removed without being retargeted.

## 13. ID generation

Production services use existing domain ID conventions. Tests can inject deterministic factories.

```ts
export type ActionIdFactory = {
  variable?: () => string
  moduleEntity?: (moduleKey: string) => string
  scene?: () => string
  layoutRegion?: () => string
  typographyGroup?: () => string
  typographyText?: () => string
  colorAssignment?: () => string
  colorSwatch?: () => string
  materialAssignment?: () => string
  poseAssignment?: () => string
  generic?: (prefix: string) => string
}
```

Do not introduce a global ID format that rewrites existing domain conventions.

## 14. Transactions / batches

Do not build a sophisticated transaction engine before real Wizard flows require one.

Current guarantee:

- one action is atomic;
- success returns a detached next draft;
- failure returns the original caller draft.

Future target, if justified:

```ts
executeBatch(actions, {
  atomic: true,
  dryRun: false,
})
```

## 15. Validation layers

### Input validation

Action shape and primitive constraints.

### Domain validation

Examples:

- module exists and is active/eligible;
- field exists and accepts supplied value;
- structured fields use specialized actions;
- entity/Scene IDs exist;
- Scene component cardinality;
- relation endpoints exist;
- duplicate keys normalize safely;
- semantic target capability eligibility.

### Whole-draft validation

Existing prompt/module validation remains a final/regression layer and is not automatically run after every small action.

## 16. Compilation boundary

Actions mutate state; compilation is explicit and separate:

```text
prompt.compile
prompt.validate
```

The final compile service must be headless and derive variable ownership and module outputs from explicit context, not implicit Vue composable state.

## 17. Expert UI migration

Migration is incremental:

1. extract canonical domain service;
2. add isolated service/action tests;
3. validate the action contract;
4. migrate one existing Expert UI path to the same service;
5. remove duplicate mutation code;
6. verify UI/output equivalence.

No big-bang rewrite.

## 18. Compatibility

Actions API introduction does not itself require a persisted draft schema bump. Existing serialized `moduleValues` remain canonical unless a separate domain change explicitly requires migration.
