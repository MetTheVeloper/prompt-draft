# Prompt Draft Actions API

Status: **Phase 10 implemented — validation pending**

Working branch for the Phase 10 extension: `feature/wizard`

Public contract: `prompt-draft.actions.v1`

Public Action surface: **101 Actions**

## Purpose

The Actions API is the canonical application/domain operation layer for Prompt Draft. Expert UI adapters, Wizards, templates, tests, and external agent/model hosts should reuse the same domain services rather than implement mutation semantics independently.

The project is deliberately **not** a generic JSON/path patch API. Existing schemas, stable identities, catalogs, specialized domains, validators, and compilers remain authoritative.

## Core architecture

```text
Expert UI / Wizard / Templates / Agent Host
                    |
             Public/Actions API
                    |
              Domain Services
                    |
          Canonical PromptDraftState
                    |
       Normalizers / Resolvers / Validators
                    |
              Pure Compiler Path
```

Vue components/composables may adapt canonical services for reactive UI behavior, but domain services and public Action execution remain headless.

## Architectural invariants

1. Stable IDs are canonical persistence identity.
2. Missing stable references never silently retarget by token/name/label.
3. Generic field Actions are limited to simple schema/scalar fields.
4. Structured domains keep explicit operations where required.
5. No unrestricted public object/path patch escape hatch exists.
6. Runtime-only facts are passed explicitly through `ActionEnvironment`.
7. Generated IDs are injected through `ActionIdFactory` where deterministic testing is required.
8. Failed Action execution returns the original caller Draft.
9. Current compiler/validator behavior is reused through canonical pure paths.
10. Provider-specific OpenAI/Gemini/MCP behavior stays outside domain/action implementations.
11. Setup state and Output selection are canonical Draft state and are mutable only through typed domain/Action operations when consumed through the Actions API.

## Validated baseline

The pre-Phase-10 Actions API baseline was fully validated on 2026-08-27:

```text
Actions API:       168 / 168
Reference catalog:  15 / 15
Phase 8 UX:           5 / 5
Phase 9 compiler:     9 / 9
Production build:   successful
Public Actions:      99
```

That accepted baseline includes Modules, Variables, ModuleEntity, Typography, Scene, Layout, Color Palette, Texture/Material, Pose, Expression, Lighting/Effects, Hair, Outfit, `prompt.validate`, `prompt.compile`, and the provider-neutral public invocation contract.

## Phase 10 — Prompt Settings & Output mutations

Implemented on 2026-08-28 in commit `1e3bd96a9119210805eebc3db7ae00008502a110`:

- `prompt.settings.update`
  - closed typed partial update of the canonical `PromptSettings` aggregate;
  - covers `mode`, `idea`, `subject`, `subjectType`, `aspectRatio`, `globalRules`;
  - covers partial nested `imageToImage` updates for reference usage, transformation strength, and all preserve toggles;
  - supports intentional empty strings used by current Setup reset/edit semantics;
  - does not expose arbitrary Draft/path mutation.
- `prompt.outputFormat.set`
  - persists `modular | natural | json` into `PromptDraftState.outputFormat`;
  - `prompt.compile` consumes that persisted value when no read-only format override is supplied.

The Setup module selector is already represented by existing `module.activate` / `module.deactivate`; Phase 10 therefore closes the remaining persisted Setup/Output mutation gap without duplicating module behavior.

Cross-field prompt validity remains the responsibility of canonical `prompt.validate`, matching the current editor's ability to hold intermediate incomplete state.

The public surface is now **101 Actions**. The exact v1 set remains pinned by `scripts/actions-public-ids.test.ts`.

Phase 10 adds eight focused Actions tests. Expected full Actions test total after the additive extension is **176**, pending execution in the real checkout.

## Public contract

`app/actions/public.ts` exposes:

- `createPublicActionRegistry()`;
- `exportPublicActionManifest()`;
- `invokePublicAction()`;
- JSON-Schema-compatible discovery data;
- `effect: read | mutation` metadata;
- strict separation between model-owned `{ actionId, input }` and trusted host-owned `ActionContext`.

The contract remains `prompt-draft.actions.v1`: the two new IDs are an explicitly reviewed additive extension, not a rename/removal/semantic repurpose of an existing ID.

## Current validation gate

Run in the real checkout before declaring Phase 10 accepted:

```text
pnpm test:actions-api
pnpm test:wizard
pnpm test:reference-catalog
pnpm test:phase8-ux
pnpm test:phase9-regression
pnpm build
```

The current tool environment has only completed TypeScript parser/transpile syntax checks for the new/modified Phase 10 TypeScript files; those checks passed. Do not treat Phase 10 as fully validated until the commands above pass in the repository workspace.

## Documents

- [`AUDIT.md`](./AUDIT.md) — original source audit and extraction map.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — architectural contracts and runtime model.
- [`ACTIONS.md`](./ACTIONS.md) — canonical public Action inventory/status.
- [`PUBLIC-CONTRACT.md`](./PUBLIC-CONTRACT.md) — provider-neutral discovery/invocation contract.
- [`STATUS.md`](./STATUS.md) — current operational checkpoint and validation state.
- [`FINAL-AUDIT.md`](./FINAL-AUDIT.md) — accepted pre-Phase-10 branch audit and validation evidence.

## Intentionally deferred

- `module.reset` until generic/specialized Clear semantics are canonicalized;
- batch/transaction and dry-run semantics;
- provider-specific OpenAI/Gemini/MCP adapters;
- broad Expert UI migrations;
- third-party schema validator;
- Wizard UI/runtime work beyond the already recorded Wizard foundation, until the Phase 10 gate is green.
