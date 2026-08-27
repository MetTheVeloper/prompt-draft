# Prompt Draft Actions API

Status: **Final readiness validation**

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

## Current validated boundaries

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
- provider-neutral public manifest/invocation contract.

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

## Validation state

Accepted checkpoints include:

- Prompt Compile: **161/161 + phase9 9/9 + build**;
- Public Contract: **167/167 + build**.

The exact public-ID compatibility guard adds one final Actions API test, so the final expected Actions total is **168**.

## Documents

- [`AUDIT.md`](./AUDIT.md) — original source audit and extraction map.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — architectural contracts and runtime model.
- [`ACTIONS.md`](./ACTIONS.md) — canonical public Action inventory/status.
- [`PUBLIC-CONTRACT.md`](./PUBLIC-CONTRACT.md) — provider-neutral discovery/invocation contract.
- [`STATUS.md`](./STATUS.md) — accepted checkpoints and remaining gate.
- [`FINAL-AUDIT.md`](./FINAL-AUDIT.md) — branch-to-main scope audit and merge-readiness checklist.

## Intentionally deferred

Non-blocking for this branch:

- `module.reset` until Clear/reset semantics are canonicalized;
- batch/transaction and dry-run semantics;
- Wizard UI;
- provider-specific OpenAI/Gemini/MCP adapters;
- additional Expert UI migrations;
- third-party schema validator.

## Final readiness gate

After pulling the final audit commits:

```bash
pnpm test:actions-api
pnpm test:reference-catalog
pnpm test:phase8-ux
pnpm test:phase9-regression
pnpm build
```

Expected Actions total: **168/168**.
Expected phase9 compiler regression: **9/9**.

When the complete final gate is green, the branch is merge-ready from the Actions API scope perspective.

## Main branch rule

All work remains on `refactor/actions-api`. Do not move/update `main` without explicit user approval.
