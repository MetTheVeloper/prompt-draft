# Prompt Draft Actions API

Status: **MERGE-READY**

Working branch: `refactor/actions-api`

Baseline: `main@3db3294ba738c09a04a8d1f79bdc430f2d7a8e83`

Public contract: `prompt-draft.actions.v1`

Public Action surface: **99 Actions**

## Purpose

The Actions API is the canonical application/domain operation layer for Prompt Draft. Expert UI adapters, future guided flows, templates, tests, and external agent/model hosts should reuse the same domain services rather than implement mutation semantics independently.

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
4. Scene, Layout, Color/Material, Pose/Expression, Hair, Outfit, Typography, Lighting, and Effects keep explicit domain operations where required.
5. No unrestricted public object/path patch escape hatch exists.
6. Runtime-only facts are passed explicitly through `ActionEnvironment`.
7. Generated IDs are injected through `ActionIdFactory` where deterministic testing is required.
8. Failed Action execution returns the original caller Draft.
9. Current compiler behavior is reused through one canonical pure path; there is no second Actions-only compiler.
10. Provider-specific OpenAI/Gemini/MCP behavior stays outside domain/action implementations.

## Validated boundaries

Completed and validated:

- canonical `PromptDraftState` boundary;
- Action registry, discovery, input validation, atomic execution;
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
- `prompt.validate`;
- `prompt.compile`;
- provider-neutral public manifest/invocation contract;
- exact v1 public Action-ID compatibility freeze.

The only intentionally completed Expert UI migration in this branch is Variables CRUD/Blueprint insertion.

## Public contract

`app/actions/public.ts` exposes:

- `createPublicActionRegistry()`;
- `exportPublicActionManifest()`;
- `invokePublicAction()`;
- JSON-Schema-compatible discovery data;
- `effect: read | mutation` metadata;
- strict separation between model-owned `{ actionId, input }` and trusted host-owned `ActionContext`.

The exact v1 public Action-ID set is pinned by `scripts/actions-public-ids.test.ts`.

## Final validation

The complete merge-readiness gate passed on 2026-08-27:

```text
Actions API:       168 / 168
Reference catalog:  15 / 15
Phase 8 UX:           5 / 5
Phase 9 compiler:     9 / 9
Production build:   successful
```

No known Actions API blocker remains.

## Documents

- [`AUDIT.md`](./AUDIT.md) — original source audit and extraction map.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — architectural contracts and runtime model.
- [`ACTIONS.md`](./ACTIONS.md) — canonical public Action inventory/status.
- [`PUBLIC-CONTRACT.md`](./PUBLIC-CONTRACT.md) — provider-neutral discovery/invocation contract.
- [`STATUS.md`](./STATUS.md) — accepted checkpoints and merge-ready status.
- [`FINAL-AUDIT.md`](./FINAL-AUDIT.md) — branch-to-main scope audit and final validation evidence.

## Intentionally deferred

Non-blocking for this branch:

- `module.reset` until Clear/reset semantics are canonicalized;
- batch/transaction and dry-run semantics;
- Wizard UI;
- provider-specific OpenAI/Gemini/MCP adapters;
- additional Expert UI migrations;
- third-party schema validator.

## Main branch rule

`refactor/actions-api` is merge-ready. Updating `main` is an explicit integration operation and should be performed deliberately after pulling the final branch documentation commits.