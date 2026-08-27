# Actions API Status

## Current checkpoint

Phase: **2 — Core operations / read boundary stabilization**

Branch: `refactor/actions-api`

Baseline: `main@3db3294ba738c09a04a8d1f79bdc430f2d7a8e83`

Last source audit: 2026-08-27

Latest validated Actions API checkpoint: **147/147 passed** on 2026-08-27.

The latest separately confirmed production build remains the **119/119 Lighting / Effects** checkpoint. Hair and Outfit have confirmed green Actions API suites, but no newer build result has been recorded yet.

`main` remains untouched by Actions API development.

## Validation history

| Boundary | Result | Status |
|---|---:|---|
| Foundation | 18/18 | validated |
| Simple modules / presets | 27/27 | validated |
| ModuleEntity lifecycle | 35/35 | validated |
| ModuleEntity fields / presets | 41/41 | validated |
| Typography | 49/49 | validated |
| Scene | 57/57 | validated |
| Layout | 65/65 | validated |
| Semantic assignment scopes | 73/73 | validated |
| Color Palette | 81/81 | validated |
| Texture / Material | 89/89 | validated |
| Pose | 97/97 | validated |
| Expression | 105/105 | validated |
| Variables Expert UI migration | 107/107 | validated + build + manual UI |
| Lighting / Effects | 119/119 | validated + build |
| Hair | 131/131 | validated |
| Outfit | 147/147 | validated |
| Prompt validation read boundary | expected 153 | awaiting real-checkout validation |

Detailed public action status and domain invariants live in `docs/actions-api/ACTIONS.md`; this file tracks phase/checkpoint state and migration/readiness decisions.

## Completed foundations

- [x] Canonical `PromptDraftState` boundary and helpers.
- [x] Headless Action registry, input validation, structured issues/results, discovery.
- [x] Explicit `ActionEnvironment` for runtime facts.
- [x] Deterministic `ActionIdFactory` injection.
- [x] Atomic failure / caller-draft isolation.
- [x] Exact semantic reference catalogs; no fuzzy stable-reference rescue.
- [x] Shared exact subject-target resolver for Pose / Expression / Hair / Outfit.
- [x] Compiler behavior kept unchanged throughout write-domain stabilization unless an intentional fix was explicitly documented.

## Validated Phase 2 write domains

The following boundaries are implemented and validated in the real project checkout:

- Variables
- Modules / presets / Custom Mode
- Generic ModuleEntity lifecycle and simple fields
- Typography
- Scene
- Layout
- Semantic assignment scope foundation
- Color Palette
- Texture / Material
- Pose
- Expression
- Lighting / Effects
- Hair
- Outfit

### Variables Expert UI migration — COMPLETE + VALIDATED

`VariablesField.vue` remains the first deliberately migrated Expert UI boundary. Persisted create/update/duplicate/delete and Blueprint insertion route through `app/domain/variables.ts`; UI-only form/modal/translation concerns remain local to the component.

Accepted validation:

- `pnpm test:actions-api` => **107/107**
- `pnpm build` => successful
- manual UI regression => create, edit including Enabled, duplicate, delete, Blueprint insertion

`variable.create`, `variable.update`, `variable.duplicate`, and `variable.delete` are `migrated`; `variable.setEnabled` remains `implemented` because the UI still changes Enabled through the general update path.

### Lighting / Effects — IMPLEMENTED + VALIDATED

The first 119-test checkout exposed one Effects preset-equality bug: raw nested-object serialization was order-sensitive. The domain comparison was changed to recursive object-key-order-insensitive equality, matching current Expert UI behavior. No compiler/UI/action-schema change was required.

Final accepted checkpoint:

- `pnpm test:actions-api` => **119/119**
- `pnpm build` => successful

### Hair — IMPLEMENTED + VALIDATED

Service/action boundary:

- `app/domain/hairStyles.ts`
- `app/actions/hairStyles.ts`
- 12 public Hair actions covering Style + Component lifecycle/source/property/preset operations

Accepted real-checkout validation:

- `pnpm test:actions-api` => **131/131**
- exact stable style/component identities, subject/reference behavior, property validation, presets and nested-ID remapping all passed
- no compiler or Expert UI migration was part of this checkpoint

### Outfit — IMPLEMENTED + VALIDATED

Service/action boundary:

- `app/domain/outfitSets.ts`
- `app/actions/outfitSets.ts`
- 14 public Outfit actions covering Set + Item + Relation operations

Validated graph decisions:

- Set identity is exact `set.id`; Item/Relation identity is scoped by owning Set plus stable child ID.
- Set duplication remaps known relation endpoints only through the exact old-item-ID → new-item-ID map.
- Existing orphan endpoints remain orphaned; no key/name/type fuzzy repair exists.
- Item duplication does not clone relation edges.
- Item deletion removes only relations connected to the exact deleted Item ID.
- Relation create requires exact current endpoints; relation update validates only changed endpoints so a persisted orphan may survive unrelated edits and later be repaired/deleted explicitly.
- Item references resolve through exact `ActionEnvironment.outfitReferenceSources` identities with domain-owned `{reference}` fallback.
- Property mutation validates exact current type/profile, option-set shape and custom/reference/absent capabilities.
- Structural Item/Relation changes detach the active preset; Set metadata/targets preserve it while authored Set details detach it.
- Preset application rebuilds recipe-owned Items + Relations with fresh IDs and preserves Set targets/details.
- Compiler and Expert UI were unchanged.

Validation history:

- first real-checkout run => **147 tests / 146 passed / 1 failed**; all domain/graph tests passed and the sole failure was a registry-discovery order assertion;
- an intermediate test-only patch accidentally rewrote too much of the Outfit regression fixture and temporarily produced two false Relation failures;
- that test file was fully restored to the original 718-line suite; the only retained change was order-insensitive discovery comparison using `.sort()`, matching Hair's existing pattern;
- no Outfit production domain/action behavior changed for those fixture fixes;
- final real-checkout `pnpm test:actions-api` => **147/147**.

All 14 Outfit public actions are promoted to `implemented` in `ACTIONS.md`.

## Current work

### Prompt validation read boundary — IMPLEMENTED, AWAITING USER VALIDATION

The next boundary was selected after auditing `prompt.validate`, `prompt.compile`, and the current Expert UI/compiler ownership.

Why validation first:

- `moduleOutputs` are currently derived by module panels and are not persisted inside `PromptDraftState`;
- `app/utils/compilePrompt.ts` and `compilePromptCore.ts` still contain Vue-composable/runtime side effects (`usePromptVariables`, `usePromptSubjectContext` and system-variable synchronization);
- exposing `prompt.compile` directly from those files would violate the headless-domain rule or create a second compiler implementation;
- validation itself can be separated safely by rebuilding module outputs headlessly with the same existing module compiler primitives, then reusing `validatePromptSettings`.

Implementation now present:

- `app/domain/promptRead.ts`
  - builds active module outputs from canonical `PromptDraftState` + module registry;
  - mirrors persisted Custom Mode behavior;
  - reproduces Scene, Form, Camera and Scene-resource output ownership using the existing compiler helpers;
  - derives exact Scene-referenced entity IDs only when both Scene and Layout are active;
  - maps Scene compile issues into existing prompt-validation issue codes;
  - runs the existing `validatePromptSettings` rules and adds `no_modules_selected` / custom-override issues without Vue coupling.
- `app/actions/promptRead.ts`
  - exposes `prompt.validate` as a read operation;
  - validation errors/warnings are returned as read data rather than making Action execution fail;
  - caller-draft isolation remains enforced by the Action registry.
- `scripts/actions-prompt-read.test.ts`
  - 6 tests for active output derivation, Custom Mode, global setup errors, variable-reference warnings, read-only execution and registry/schema behavior.

Status:

- `prompt.validate` remains `planned` until the new real-checkout suite passes.
- expected `pnpm test:actions-api` total: **153 tests**.
- no Expert UI file and no existing compiler file has been modified in this checkpoint.

### Prompt compile — DEFERRED TO NEXT CHECKPOINT

`prompt.compile` remains `planned`. The next implementation must extract a pure compiler adapter from the existing final compiler behavior instead of importing Vue composables into the Actions API or duplicating compiler logic. This starts only after the 153-test `prompt.validate` checkpoint is validated.

## Next

1. Pull the current `refactor/actions-api` checkpoint.
2. Run `pnpm test:actions-api`; expected result is **153/153**.
3. Run `pnpm build` for TypeScript/Nuxt integration validation.
4. If green, promote `prompt.validate` from `planned` to `implemented` and record the checkpoint.
5. Then extract the pure final-compile adapter and implement `prompt.compile` without changing current Expert UI output semantics.

## Known deferred decisions

- `module.reset` contract — defer until Clear semantics are canonicalized.
- Batch/transaction API — defer until real multi-step Wizard flows justify it.
- Dry-run semantics — defer with batch design.
- Third-party schema validator — avoid until action input complexity justifies dependency cost.
- AI-facing tool schema/export format — design after internal registry/read contracts stabilize.
- Wizard UI — out of scope until core actions and read/compile paths are stable.

## Regression guardrails

Every implementation phase must preserve:

- stable identity semantics;
- missing/unavailable reference behavior;
- current draft import/export compatibility;
- prompt compiler behavior unless an intentional fix is documented;
- current Expert UI behavior until that UI path is deliberately migrated;
- one canonical implementation for every domain operation.

## Main branch rule

Do not update or move `main` as part of Actions API development without explicit approval. Development checkpoints remain on `refactor/actions-api` until a merge/readiness decision is made.
