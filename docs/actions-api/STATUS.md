# Actions API Status

## Current checkpoint

Phase: **PHASE 10 — IMPLEMENTED, VALIDATION PENDING**

Working branch: `feature/wizard`

Phase 10 base: `9922ce22b7b15a45ed1f1eac2cf502fdd8d57640`

Phase 10 implementation commit:

- `1e3bd96a9119210805eebc3db7ae00008502a110` — `feat(actions): add prompt settings and output mutations`

Last source audit: **2026-08-28**

Public contract: `prompt-draft.actions.v1`

Current public surface: **101 Actions**

## Accepted baseline before Phase 10

The Actions API baseline merged before Wizard development was fully validated on 2026-08-27:

| Gate | Accepted result |
|---|---:|
| Actions API | 168/168 |
| Reference catalog | 15/15 |
| Phase 8 UX | 5/5 |
| Phase 9 compiler | 9/9 |
| Production build | successful |
| Public Actions | 99 |

That accepted baseline remains historical evidence. Phase 10 is an additive extension and must pass a new gate before its two Actions are promoted from implementation-pending to validated.

## Why Phase 10 exists

Wizard source inspection found that `PromptDraftState` includes two persisted areas that were not publicly mutable through the Actions API:

- `promptSettings` — the canonical persisted data behind the Prompt Setup panel;
- `outputFormat` — the canonical persisted selection behind the Output panel.

Leaving those fields outside Actions would force a Wizard to either avoid legitimate Setup/Output behavior or mutate `PromptDraftState` directly, violating the canonical-mutation architecture.

The decision is therefore to close this gap before beginning the Portrait Action Mapper.

## Phase 10 implementation

### Domain layer

New: `app/domain/promptSettings.ts`

Provides:

- `updatePromptSettings(...)`;
- `setPromptOutputFormat(...)`.

Both operate on cloned canonical Draft state and return structured domain results.

`updatePromptSettings(...)` is deliberately explicit: it assigns only known Prompt Settings fields and known nested image-to-image fields. It is not a generic object spread/path patch escape hatch.

### Public Actions

New: `app/actions/promptSettings.ts`

#### `prompt.settings.update`

Closed typed aggregate mutation covering:

- `mode`;
- `idea`;
- `subject`;
- `subjectType`;
- canonical `aspectRatio` values;
- `globalRules`;
- partial nested `imageToImage` settings:
  - reference usage;
  - transformation strength;
  - all existing preserve toggles.

Important behavior:

- nested image-to-image patch is partial-merge;
- intentional empty authored strings are valid;
- empty known patch is rejected;
- unknown properties/invalid enums are rejected before execution;
- caller Draft remains unchanged on failure;
- cross-field completeness is intentionally left to canonical `prompt.validate` so intermediate editor/Wizard state remains possible.

#### `prompt.outputFormat.set`

Persists exactly one of:

- `modular`;
- `natural`;
- `json`.

`prompt.compile` already reads `draft.outputFormat` when no explicit read-only format override is supplied, so no second compile behavior was introduced.

### Existing Setup module selection

The Setup panel also visually contains the module selector, but that state already has canonical Actions:

- `module.activate`;
- `module.deactivate`.

No duplicate Setup-specific module mutation was added.

## Public contract extension

The public registry grows from **99 → 101** Actions.

New exact v1 IDs:

- `prompt.settings.update`;
- `prompt.outputFormat.set`.

`scripts/actions-public-ids.test.ts` has been deliberately updated to pin 101 exact v1 IDs.

The contract remains `prompt-draft.actions.v1` because this is an additive reviewed extension: no existing ID was removed, renamed, or semantically repurposed.

## Test changes

New: `scripts/actions-prompt-settings.test.ts` — **8 focused cases** covering:

1. full canonical Setup aggregate update + caller isolation;
2. nested image-to-image partial merge;
3. intentional empty-string reset semantics;
4. empty patch rejection;
5. invalid enum/unknown property rejection;
6. persisted Output mutation;
7. invalid Output rejection;
8. downstream `prompt.validate` / `prompt.compile` consumption of Action-mutated state.

Also updated:

- public registry/manifest tests for 101 Actions;
- exact v1 Action-ID fixture for 101 IDs;
- `pnpm test:actions-api` to include the new suite.

Expected full Actions suite count after the additive tests: **176**.

This count is not yet accepted validation evidence; it is the expected gate size until run in the real checkout.

## Validation performed in current tool environment

Passed:

- TypeScript parser/transpile syntax checks for all new/modified Phase 10 TypeScript files;
- `package.json` JSON parse;
- post-commit diff inspection;
- branch fast-forward to the Phase 10 implementation commit.

Not available in the current connector/runtime:

- repository-installed `pnpm`/`tsx` workspace execution;
- full Nuxt production build.

Therefore Phase 10 must remain **validation pending**.

## Required acceptance gate

Run in the real checkout, in this order:

1. `pnpm test:actions-api` — expected **176/176** if no regression exists;
2. `pnpm test:wizard`;
3. `pnpm test:reference-catalog`;
4. `pnpm test:phase8-ux`;
5. `pnpm test:phase9-regression`;
6. `pnpm build`.

If any command fails, fix the canonical Actions/domain implementation before continuing the Portrait mapper.

If all commands pass, record the results here and mark the Phase 10 Setup/Output Actions `implemented`/validated.

## Historical validation timeline

Accepted pre-Phase-10 Actions milestones:

18 → 27 → 35 → 41 → 49 → 57 → 65 → 73 → 81 → 89 → 97 → 105 → 107 → 119 → 131 → 147 → 153 → 161 → 167 → **168 validated**.

Phase 10 candidate gate: **176 expected / pending**.

## Expert UI migration status

No Expert UI rewrite/migration was performed for Phase 10.

The current Setup and Output components continue to use their existing Vue `v-model` paths. The Actions/domain layer now exists as the canonical headless mutation capability for Wizard/agent/orchestration consumers and future UI migration if justified.

Variables remain the only intentionally completed broad Expert UI mutation migration from the original Actions refactor.

## Regression guardrails

Phase 10 must preserve:

- stable-ID/reference semantics in all existing structured domains;
- draft import/export compatibility;
- existing compiler output semantics;
- existing Expert UI behavior;
- atomic caller-Draft failure semantics;
- one canonical validator/compiler path;
- no arbitrary Draft/path mutation API;
- exact reviewed `prompt-draft.actions.v1` identity set.

## Intentionally deferred / non-blocking

- `module.reset` until Clear semantics are canonicalized;
- batch/transaction API;
- dry-run semantics;
- provider-specific adapters;
- broad Expert UI migrations;
- third-party schema validator;
- further Wizard mapper/UI work until the Phase 10 acceptance gate is green.

## Immediate next step

**Do not expand Wizard orchestration yet.**

First run the Phase 10 acceptance gate above. Once green, the Actions API can be treated as complete for the first Portrait Wizard and work resumes with exact Portrait module/preset/field inspection, deterministic derived rules, then the Portrait Action Mapper.
