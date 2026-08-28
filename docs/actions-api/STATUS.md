# Actions API Status

## Current checkpoint

Phase: **PHASE 10 — ACCEPTED / VALIDATED**

Working branch: `feature/wizard`

Phase 10 base: `9922ce22b7b15a45ed1f1eac2cf502fdd8d57640`

Phase 10 implementation commit:

- `1e3bd96a9119210805eebc3db7ae00008502a110` — `feat(actions): add prompt settings and output mutations`

Validation date: **2026-08-28**

Public contract: `prompt-draft.actions.v1`

Current public surface: **101 Actions**

## Accepted Phase 10 gate

Phase 10 has now passed the full real-checkout acceptance gate:

| Gate | Accepted result |
|---|---:|
| Actions API | **176/176** |
| Wizard | **9/9** |
| Reference catalog | **15/15** |
| Phase 8 UX | **5/5** |
| Phase 9 compiler | **9/9** |
| Production build | **successful** |
| Public Actions | **101** |

This supersedes the earlier Phase 10 validation-pending checkpoint.

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

That baseline remains historical evidence. Phase 10 is an additive accepted extension.

## Why Phase 10 exists

Wizard source inspection found that `PromptDraftState` includes two persisted areas that were not publicly mutable through the Actions API:

- `promptSettings` — canonical persisted data behind Prompt Setup;
- `outputFormat` — canonical persisted selection behind Output.

Leaving those fields outside Actions would have forced Wizard orchestration either to avoid legitimate Setup/Output behavior or mutate `PromptDraftState` directly. Phase 10 closes that architectural gap.

## Phase 10 implementation

### Domain layer

`app/domain/promptSettings.ts` provides:

- `updatePromptSettings(...)`;
- `setPromptOutputFormat(...)`.

Both operate on cloned canonical Draft state and return structured domain results. Prompt Settings mutation explicitly assigns only known fields; it is not a generic path/object patch mechanism.

### Public Actions

#### `prompt.settings.update`

Closed typed aggregate mutation covering:

- `mode`;
- `idea`;
- `subject`;
- `subjectType`;
- canonical `aspectRatio`;
- `globalRules`;
- partial nested image-to-image settings and preserve toggles.

Accepted semantics:

- nested image-to-image input partial-merges;
- intentional empty authored strings are valid;
- empty known patch is rejected;
- unknown properties/invalid enums are schema-rejected;
- caller Draft remains unchanged on failure;
- cross-field completeness remains the responsibility of canonical `prompt.validate`.

#### `prompt.outputFormat.set`

Persists exactly one of:

- `modular`;
- `natural`;
- `json`.

`prompt.compile` consumes the persisted selection when no read-only format override is supplied.

### Existing Setup module selection

The Setup module selector is already covered by:

- `module.activate`;
- `module.deactivate`.

No duplicate Setup-specific module mutation was added.

## Public contract extension

The accepted public registry is now **101 Actions**.

New exact v1 IDs:

- `prompt.settings.update`;
- `prompt.outputFormat.set`.

`scripts/actions-public-ids.test.ts` pins the exact 101-action compatibility set.

The contract remains `prompt-draft.actions.v1`: this was an additive reviewed extension with no existing Action removed, renamed, or semantically repurposed.

## Accepted Phase 10 test coverage

`scripts/actions-prompt-settings.test.ts` contributes **8 focused cases** covering:

1. complete Setup aggregate mutation + caller isolation;
2. nested image-to-image partial merge;
3. intentional empty-string reset semantics;
4. empty patch rejection;
5. invalid enum/unknown property rejection;
6. persisted Output mutation;
7. invalid Output rejection;
8. downstream `prompt.validate` / `prompt.compile` consumption.

The full accepted Actions suite now contains **176 passing tests**.

## Expert UI migration status

No Expert UI rewrite/migration was performed for Phase 10.

Setup and Output continue using their existing Vue `v-model` paths. The Actions/domain layer is now the accepted canonical headless mutation capability for Wizard/agent/orchestration consumers and any future UI migration that proves useful.

Variables remain the only intentionally completed broad Expert UI mutation migration from the original Actions refactor.

## Regression guardrails

Continue preserving:

- stable-ID/reference semantics in structured domains;
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
- third-party schema validator.

## Immediate next step

**Phase 10 is complete.**

Resume Wizard development by inspecting the exact Portrait-targeted module fields, presets, references, and specialized Action inputs. Then implement only the smallest deterministic derived-rule layer required by those mappings, followed by the first Portrait Action Planner/Mapper strictly through public Actions.
