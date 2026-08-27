# Actions API Status

## Current checkpoint

Phase: **2 — Core operations / read + compile stabilization COMPLETE**

Branch: `refactor/actions-api`

Baseline: `main@3db3294ba738c09a04a8d1f79bdc430f2d7a8e83`

Last source audit: 2026-08-27

Latest validated Actions API checkpoint: **161/161 passed** on 2026-08-27.

Latest confirmed production build: **Prompt Compile 161/161 + phase9 compiler regression 9/9 + successful build**.

`main` remains untouched.

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
| Prompt Validate | 153/153 | validated |
| Prompt Compile | 161/161 | validated + phase9 9/9 + build |

Detailed action inventory lives in `docs/actions-api/ACTIONS.md`.

## Completed foundations and write domains

Validated public/domain boundaries:

- canonical `PromptDraftState` + clone/normalize helpers;
- Action registry/discovery/input schema/atomic caller-draft isolation;
- explicit `ActionEnvironment` and deterministic `ActionIdFactory`;
- Variables;
- Modules / presets / Custom Mode;
- generic ModuleEntity lifecycle + simple fields/presets;
- Typography;
- Scene;
- Layout;
- semantic assignment scope foundation;
- Color Palette;
- Texture / Material;
- Pose;
- Expression;
- Lighting / Effects;
- Hair;
- Outfit;
- Prompt Validate;
- Prompt Compile.

Stable-reference rules remain unchanged: stable IDs are canonical identity, missing refs never fuzzy-retarget, and exact persisted orphans may survive only where the owning domain explicitly permits it.

## Expert UI migration status

### Variables — COMPLETE + VALIDATED

Persisted Create/Update/Duplicate/Delete and Blueprint insertion in `VariablesField.vue` route through `app/domain/variables.ts`.

Accepted validation:

- `pnpm test:actions-api` => **107/107**
- `pnpm build` => successful
- manual UI regression => Create/Edit including Enabled/Duplicate/Delete/Blueprint

The four CRUD actions are `migrated`; `variable.setEnabled` remains `implemented` because the UI uses general update for the Enabled field.

No other broad Expert UI migration is required for current Actions API branch readiness.

## Prompt Validate — IMPLEMENTED + VALIDATED

Files:

- `app/domain/promptRead.ts`
- `app/actions/promptRead.ts`
- `scripts/actions-prompt-read.test.ts`

Contract:

- rebuild active module outputs from canonical Draft state;
- mirror persisted Custom Mode and existing Scene/Form/Camera/Scene-resource compile ownership;
- reuse current `validatePromptSettings` rules;
- add current global `no_modules_selected` and custom-override issues;
- return validation errors/warnings as read data rather than Action execution failure;
- no Vue/composable dependency and no caller-draft mutation.

Final real-checkout validation: **153/153**.

## Prompt Compile — IMPLEMENTED + VALIDATED

### Compiler ownership

`app/utils/compilePromptCore.ts`

- existing formatting/compiler algorithm remains in place;
- Vue composable imports/runtime sync calls are removed;
- existing system-variable builder is exported;
- no formatting/optimizer/module-order algorithm was intentionally changed.

`app/utils/compilePromptPure.ts`

- pure final adapter shared by UI and Actions;
- owns automatic Scene/Layout global rule;
- owns typed user Subject/Reference suppression semantics;
- owns pure system-variable filtering;
- owns modular/natural/json Scene presentation aliases;
- returns output + effective settings + final system variables.

`app/utils/compilePrompt.ts`

- Expert UI runtime adapter only;
- reads enabled user variable ownership from `usePromptVariables`;
- calls `compilePromptOutputPure`;
- synchronizes subject context and returned system variables back into existing Vue runtime state;
- returns the pure output.

`app/domain/promptRead.ts`

- `compilePromptDraft` reuses the validated headless module-output builder;
- derives Subject/Reference ownership from the active canonical Variables module;
- defaults to persisted `draft.outputFormat`;
- explicit format override is read-only.

`app/actions/promptRead.ts`

- exposes public `prompt.compile`;
- optional `format: modular | natural | json`;
- validation issues do not block compile, matching current Expert UI behavior.

### Accepted validation

- `pnpm test:actions-api` => **161/161**;
- `pnpm test:phase9-regression` => **9/9**;
- `pnpm build` => successful.

During validation, phase9 exposed only regression-fixture/guard assumptions: an outdated baseline, source-shape expectations after the intentional extraction, and finally a damaged local Git `HEAD`/branch ref in one checkout. The guard was hardened to inspect current working-tree source directly while historical baselines remain SHA-pinned. No production compiler behavior was changed for those guard repairs.

`prompt.compile` is promoted to `implemented`.

## Current work: AI-facing public contract / export

Core domain/read/compiler stabilization is complete. The next boundary is transport-neutral packaging of the already validated registry so an external agent/model host can discover and invoke Actions without importing internal TypeScript implementation details.

Target responsibilities:

1. export stable public action descriptors: ID, description, input schema and explicit operation metadata;
2. define a provider-neutral invocation envelope, e.g. action ID + input + canonical Draft/context, without embedding OpenAI/Gemini-specific logic into domains;
3. define a provider-neutral result envelope around the existing structured Action result (`ok`, draft, issues, read data);
4. ensure only public actions are exported and internal foundation helpers/domain functions are not accidentally exposed;
5. serialize the repository-owned input schema into a JSON-safe contract suitable for tool/function adapters;
6. add discovery/export/invocation integration tests and compatibility checks for stable action IDs.

Provider-specific adapters, if needed later, should consume this neutral contract rather than becoming part of domain/action implementations.

## Remaining branch work

1. **AI-facing Actions contract / export**
   - implement the transport-neutral public manifest + invocation/result bridge;
   - add integration tests;
   - document compatibility/freeze rules.
2. **Final readiness audit**
   - full Actions suite;
   - compiler regression suite;
   - production build;
   - compare branch against baseline/main for accidental scope changes;
   - freeze/document public IDs and explicitly deferred work;
   - leave branch merge-ready without moving `main` automatically.

## Intentionally deferred / non-blocking

- `module.reset` until Clear semantics are canonicalized;
- Batch/transaction API until a real multi-action Wizard flow requires it;
- Dry-run semantics with batch design;
- third-party schema validator until input complexity warrants it;
- Wizard UI;
- additional Expert UI migrations not needed for Actions API branch readiness.

## Regression guardrails

Every remaining change must preserve:

- stable ID identity semantics;
- missing/unavailable reference behavior;
- current draft import/export compatibility;
- current prompt output semantics unless an intentional compiler fix is explicitly documented;
- current Expert UI behavior until deliberately migrated;
- one canonical implementation for every mutation/read/compiler operation.

## Main branch rule

Do not update or move `main` without explicit approval. All current work remains on `refactor/actions-api`.
