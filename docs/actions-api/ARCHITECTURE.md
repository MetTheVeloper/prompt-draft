# Actions API Architecture

## 1. Canonical draft state

The Actions API operates on a serializable, application-level draft state rather than Vue refs or component-local state.

Proposed core contract:

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

Timestamps, active draft IDs, collection membership, persistence metadata, and save status are session/storage concerns and are not required for a pure mutation.

A separate record/snapshot contract may add persistence metadata:

```ts
export type PromptDraftRecord = PromptDraftState & {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}
```

## 2. Draft session boundary

The UI needs a session adapter that owns the active draft and persistence behavior, but the domain/action layer should not know about localStorage.

Conceptual split:

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

The current create page can progressively delegate to `DraftSession` while keeping its UX unchanged.

## 3. Pure mutation rule

Preferred domain-service shape:

```ts
function updateSomething(
  state: PromptDraftState,
  input: SomeInput,
  context: DomainContext,
): DomainMutationResult
```

The mutation should return a new canonical state or a domain fragment that can be immutably applied. It must not:

- open a modal;
- display a toast;
- write localStorage;
- depend on DOM APIs;
- depend on component instances;
- silently repair a missing stable reference by fuzzy matching.

## 4. Action definition

Initial target contract:

```ts
export type ActionDefinition<TInput, TData = unknown> = {
  id: string
  description: string
  inputSchema: ActionInputSchema
  canExecute?: (context: ActionContext, input: TInput) => ActionAvailability
  execute: (
    context: ActionContext,
    input: TInput,
  ) => ActionExecutionResult<TData>
}
```

The schema representation should initially remain small and repository-owned. Do not commit to a third-party schema library unless implementation needs justify it.

## 5. Action context

Actions need explicit access to canonical registry/domain context without reaching into Vue globals.

Proposed shape:

```ts
export type ActionContext = {
  draft: PromptDraftState
  modules: PromptKeyModule[]
  idFactory?: ActionIdFactory
}
```

Derived catalogs/resolvers should be created from this explicit context.

Do not place translation functions, modal APIs, current screen size, or persistence adapters in `ActionContext`.

## 6. Results and errors

An action should not throw for expected domain rejection.

Proposed result shape:

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

`draft` on failure is unchanged.

Issue shape:

```ts
export type ActionIssue = {
  code: string
  message?: string
  path?: string
  details?: Record<string, unknown>
}
```

Machine-readable `code` is authoritative. UI localization belongs to adapters.

## 7. Action registry and discovery

The registry should support:

```ts
registry.get(id)
registry.list()
registry.has(id)
registry.execute(id, context, input)
```

Discovery metadata should be sufficient for a future Wizard/AI planner to understand:

- action ID;
- description;
- expected fields;
- required/optional fields;
- simple enum constraints where practical.

The registry should not expose arbitrary implementation functions by path.

## 8. Domain-service namespaces

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

Not every service must map one-to-one to an action namespace. Services are implementation boundaries; actions are consumer-facing operations.

## 9. Generic vs specialized mutations

### Generic operations allowed

For simple module fields:

```text
module.activate
module.deactivate
module.field.set
module.reset
module.preset.apply
```

The implementation must use module schema/default/custom-input rules.

### Specialized operations required

Examples:

```text
scene.component.attach
layout.region.assignScene
outfit.item.delete
hair.style.setSource
typography.text.create
texture.assignment.setTargets
```

These operations encode invariants that a generic patch cannot safely express.

## 10. Stable reference policy

All mutation services that consume persisted references follow these rules:

1. resolve using canonical stable identity;
2. if identity is present but missing, preserve it as missing unless the operation explicitly removes/replaces it;
3. unavailable references remain unavailable, not silently substituted;
4. legacy token lookup is allowed only in explicitly named compatibility/upgrade paths where no stable identity exists;
5. replacement is always explicit.

## 11. ID generation

Production services may use existing repository ID factories. Tests should be able to inject deterministic ID generation where needed.

Conceptual interface:

```ts
export type ActionIdFactory = {
  moduleEntity?: (moduleKey: string) => string
  scene?: () => string
  layoutRegion?: () => string
  typographyGroup?: () => string
  typographyText?: () => string
  generic?: (prefix: string) => string
}
```

Do not introduce a single global ID format that rewrites existing domain ID conventions.

## 12. Transactions / batches

Do not implement a sophisticated transaction engine in Phase 1.

Phase 1 requirement:

- a single action is atomic: either it returns a valid next draft or the original draft unchanged.

Later batch target, only after real Wizard use-cases are documented:

```ts
executeBatch(actions, {
  atomic: true,
  dryRun: false,
})
```

Potential behavior:

- `atomic: true`: any failed step rolls back the whole batch;
- `dryRun: true`: return proposed next state/issues without applying to session;
- step results remain inspectable.

## 13. Validation strategy

Validation happens at three levels:

### Input validation

Checks action input shape and primitive constraints.

### Domain validation

Checks operation invariants such as:

- module exists and is active/eligible;
- field exists and accepts the supplied value;
- entity ID exists;
- Scene component cardinality;
- relation endpoints exist;
- duplicate keys are normalized safely;
- target capability eligibility.

### Whole-draft validation

Existing prompt/module validation remains available for final/regression checks. It should not be required for every small action unless the action can violate a global invariant that cannot be checked locally.

## 14. Compilation boundary

Actions mutate state; they do not compile prompts as a side effect.

Compilation is a separate explicit operation/service:

```text
prompt.compile
prompt.validate
```

The target implementation must be headless and derive user-variable ownership and module outputs from explicit draft context rather than implicit Vue composable state.

## 15. Expert UI migration

Migration is incremental:

1. extract a service from one UI-owned mutation;
2. add isolated service tests;
3. expose the corresponding action if useful;
4. change the existing component to call the service;
5. remove duplicate mutation code;
6. confirm UI behavior/output equivalence.

No big-bang rewrite of the create page or all module editors.

## 16. Compatibility

Actions API introduction must not require an immediate draft schema version bump. Existing serialized `moduleValues` remain canonical unless a domain change separately justifies migration.

The first phases are architecture/extraction work, not persisted-schema redesign.
