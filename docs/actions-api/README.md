# Prompt Draft Actions API

Status: Phase 1 — foundation and canonical draft boundary

Working branch: `refactor/actions-api`

Baseline: `main@3db3294ba738c09a04a8d1f79bdc430f2d7a8e83`

## Purpose

The Actions API is the canonical application/domain mutation layer for Prompt Draft. It exists so the current Expert UI, future guided/wizard experiences, templates, tests, and later AI-driven planners can perform the same operations through one implementation of each domain mutation.

The project is not an attempt to replace Prompt Draft's domain model with a generic object-patching API. Existing module schemas, stable identities, compilers, catalogs, and specialized domain models remain authoritative.

## Core rule

> There must be one canonical implementation of every domain mutation.

A Scene created from the Expert UI, a wizard, a template, or an AI action must ultimately pass through the same Scene domain service. Consumers may differ in presentation and orchestration, but not in mutation semantics.

## Target architecture

```text
Expert UI ---------┐
Wizard ------------┤
Templates ---------┤
AI planner --------┤
                   v
             Actions API
                   |
                   v
            Domain Services
                   |
                   v
        Canonical Draft State
                   |
     Normalizers / Resolvers /
      Validators / Compilers
```

Vue composables and components may adapt these services for reactive UI use, but domain services must not depend on component instances or modal/editor state.

## Architectural invariants

1. Stable IDs remain canonical persistence identity. Labels, names, tokens, and editable keys are presentation/reference metadata unless an existing domain contract explicitly says otherwise.
2. Missing stable references must never silently retarget by matching a token, name, or label.
3. Existing compiler behavior is preserved unless a separately documented bug is intentionally fixed.
4. Generic field actions are allowed for simple scalar/module fields. Structured domains keep explicit domain operations.
5. Actions validate and normalize inputs before mutating canonical state.
6. UI-only state such as expanded cards, open modals, pending picker choices, and transient drafts is not part of the Actions API domain contract.
7. Domain services are headless. They must be usable from tests without mounting Vue components.
8. Actions should be deterministic given the same canonical input state and explicit operation input, except for generated opaque IDs/timestamps where generation is part of the operation.
9. Cross-domain references are updated only by explicit domain rules. No consumer may directly rewrite another domain's persisted reference shape.
10. No new action should expose an unrestricted `object.patch`, `array.add`, or equivalent escape hatch over structured state.

## Documents

- [`AUDIT.md`](./AUDIT.md) — source audit and extraction map.
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — canonical draft/session boundary, domain services, action runtime, transactions, and discovery.
- [`ACTIONS.md`](./ACTIONS.md) — planned and implemented action registry.
- [`STATUS.md`](./STATUS.md) — current phase, checkpoints, completed work, next work, and validation gates.

## Delivery phases

### Phase 0 — Audit and scope

- [x] Audit the current read/resolve/compile architecture.
- [x] Identify UI-coupled mutation logic.
- [x] Define the one-canonical-mutation rule.
- [x] Create a dedicated branch and durable documentation set.

### Phase 1 — Canonical draft boundary and action primitives

- [ ] Extract reusable `PromptDraftState` / snapshot contracts from the create page.
- [ ] Introduce headless immutable draft helpers.
- [ ] Define `ActionDefinition`, `ActionContext`, `ActionResult`, error contracts, and registry discovery.
- [ ] Define action execution semantics without persistence/UI coupling.
- [ ] Add isolated tests for the action runtime and draft helpers.

### Phase 2 — Low-risk domain services

- [ ] Variables CRUD service.
- [ ] Simple module field/default/preset service.
- [ ] Generic named `ModuleEntity` lifecycle service.
- [ ] Typography group/text lifecycle service.
- [ ] Add action definitions that wrap these canonical services.

### Phase 3 — Relational domains

- [ ] Scene lifecycle and component reference service.
- [ ] Layout region lifecycle and Scene binding service.
- [ ] Semantic target query/resolution headless adapter.
- [ ] Color/Material/Pose/Expression assignment mutation services.

### Phase 4 — Specialized structured domains

- [ ] Lighting source lifecycle.
- [ ] Effects layer lifecycle.
- [ ] Hair style/component operations.
- [ ] Outfit set/item/relation operations.
- [ ] Preserve domain-specific ID remapping and cleanup rules.

### Phase 5 — Headless validation/compile surface

- [ ] Make draft validation callable without page/component state.
- [ ] Make prompt compilation callable from a canonical draft context.
- [ ] Preserve user-variable ownership and Scene/Layout behavior.

### Phase 6 — Transactions and orchestration

- [ ] Define batch execution semantics.
- [ ] Add atomic/dry-run support if validation confirms it is needed.
- [ ] Provide action discovery/schema metadata suitable for Wizard and later AI planner use.

### Phase 7 — Expert UI migration

- [ ] Migrate existing UI mutations incrementally to domain services.
- [ ] Remove duplicated component-owned mutation implementations.
- [ ] Keep current UX behavior stable.

### Phase 8 — Guided/Wizard consumer

- [ ] Build guided flows on top of the same Actions API.
- [ ] No Wizard-only domain mutation logic.

### Phase 9 — Regression and merge readiness

- [ ] Old draft import/export compatibility.
- [ ] Stable-reference regression suite.
- [ ] Prompt-output equivalence checks.
- [ ] Runtime mobile/desktop validation where affected.
- [ ] Source-of-truth finalization and merge review.

## Current execution rule

All Actions API work happens on `refactor/actions-api`. `main` is a baseline/reference branch and must not be moved or modified as part of this work without explicit approval.
