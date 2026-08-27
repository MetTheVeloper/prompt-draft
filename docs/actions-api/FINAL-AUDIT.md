# Actions API Final Readiness Audit

Audit date: 2026-08-27

Branch: `refactor/actions-api`

Merge baseline: `main@3db3294ba738c09a04a8d1f79bdc430f2d7a8e83`

## Executive result

The Actions API branch is in final validation. Core mutation/read/compiler work is complete, the provider-neutral public contract is implemented, and the branch has no merge-base drift from `main`.

At the start of the final audit the branch was **191 commits ahead / 0 behind** the baseline. `main` remained exactly at the recorded baseline commit.

One final compatibility hardening was added during this audit: an exact v1 public Action-ID fixture. This turns the already validated 99-action count/uniqueness check into a true compatibility freeze against accidental renames/removals/additions.

No domain, compiler, or UI production behavior was changed by that hardening.

## Accepted validation before the final audit

- `pnpm test:actions-api` => **167/167**;
- public registry => **99 unique public Actions**;
- public manifest/invocation bridge => validated;
- `pnpm test:phase9-regression` => **9/9** at the Prompt Compile checkpoint;
- production build => successful at the Prompt Compile checkpoint and again after the public-contract checkpoint;
- Variables Expert UI migration => previously validated by Actions tests, build, and manual Create/Edit/Enabled/Duplicate/Delete/Blueprint regression.

The final exact-ID guard adds one Actions API test, so the final expected total is **168**.

## Branch-to-main scope audit

The branch is additive by design: the majority of application changes are new `app/actions/*`, `app/domain/*`, draft/read helpers, docs, and tests.

Existing production files modified relative to `main` are narrowly scoped:

### `app/pages/create.vue`

Purpose: extract the canonical Draft contract/helpers while preserving browser persistence/import/export ownership in the page.

Observed change:

- inline `PromptDraftSnapshot`, `PromptDraftRecord`, `PromptDraftCollection`, and `ModulePanelState` contracts moved to `app/modules/promptDraft.types.ts`;
- inline reset/apply/clone/output-format normalization moved to `app/utils/promptDraftState.ts`;
- localStorage, autosave, import/export/share, active-draft selection, and page UI remain page-owned;
- the persisted version remains `version: 1`;
- no Actions execution reads/writes localStorage.

This is the intended canonical-draft extraction, not a persistence rewrite.

### `app/components/modules/variables/VariablesField.vue`

Purpose: the only intentionally completed Expert UI mutation migration in this branch.

Observed change:

- Create/Update/Duplicate/Delete and Blueprint insertion call the canonical Variables domain service;
- existing modal/presentation behavior remains UI-owned;
- runtime system-variable key conflicts are passed explicitly to the domain service;
- migration was previously accepted with **107/107 + build + manual UI regression**.

No broader Expert UI migration is required for this branch.

### `app/utils/compilePrompt.ts` / `compilePromptCore.ts`

Purpose: expose the existing final compiler through a headless path without creating a second compiler.

Observed change:

- core formatting algorithm remains canonical;
- Vue runtime synchronization was extracted out of core;
- pure wrapper-level Scene/Layout, variable-ownership, and Scene-alias behavior moved to `compilePromptPure.ts`;
- current Expert UI keeps a runtime adapter in `compilePrompt.ts`;
- `prompt.compile` uses the same pure path.

Accepted compiler evidence: **161/161 Actions + phase9 9/9 + successful build**. The phase9 guard proves the core differs from the historical compiler only by the intentional headless extraction.

### `package.json`

Only test command coverage is extended. No runtime dependency was added for the Actions API.

## Public contract audit

Contract: `prompt-draft.actions.v1`.

Public surface:

- **99 public Action IDs**;
- `effect: read | mutation` metadata;
- JSON-safe discovery manifest;
- JSON-Schema-compatible export of the repository-owned input schema subset;
- model-owned request is only `{ actionId, input }`;
- Draft, module registry, `ActionEnvironment`, and `ActionIdFactory` remain trusted-host-owned context;
- malformed envelopes reject with `public_action_request_invalid`;
- unknown actions retain `action_not_found`;
- underlying Action atomic failure semantics are preserved.

Provider-specific OpenAI/Gemini/MCP/REST adapters are intentionally not part of this branch. They should adapt the neutral contract later.

## Public ID compatibility freeze

`scripts/actions-public-ids.test.ts` now pins the exact v1 set of all 99 public Action IDs.

Compatibility policy:

- rename/removal/semantic repurposing of an existing v1 ID is breaking and requires an explicit compatibility/version decision;
- adding a new public Action requires an explicit fixture/docs review rather than silently changing discovery;
- registry ordering is not frozen; identity is;
- internal helpers remain free to evolve unless promoted to the public registry.

## Stable-reference audit

The branch consistently keeps stable IDs as canonical identity.

Confirmed architecture across Scene, Layout, semantic assignment scopes, Color/Material, Pose/Expression, Hair, and Outfit:

- no name/token/label fuzzy retargeting of missing stable references;
- new missing/unavailable references reject where required;
- exact persisted orphan references survive only where the owning domain explicitly permits recovery/removal;
- cross-domain repair requires an explicit specialized operation.

No universal arbitrary object/path patch Action exists.

## Deferred work — explicitly non-blocking

The following are intentionally outside merge readiness for this branch:

- `module.reset` until generic/specialized Clear semantics are canonicalized;
- batch/transaction execution until a concrete orchestration consumer requires it;
- dry-run semantics together with batch design;
- Wizard UI;
- provider-specific OpenAI/Gemini/MCP adapters;
- additional Expert UI migrations;
- third-party schema validation while the repository-owned schema subset remains sufficient.

These are deferred scope, not incomplete implementation of the current contract.

## Final validation gate

After pulling the final audit commits, run:

1. `pnpm test:actions-api` — expected **168/168**;
2. `pnpm test:reference-catalog` — must pass;
3. `pnpm test:phase8-ux` — must pass;
4. `pnpm test:phase9-regression` — expected **9/9**;
5. `pnpm build` — must succeed.

If all five are green, no known blocker remains for declaring `refactor/actions-api` merge-ready.

## Merge rule

This audit does **not** move or modify `main`.

After final validation, merge/update of `main` remains an explicit user decision.
