# Actions API Registry

Canonical inventory/status for the public Prompt Draft Actions API.

Public contract: `prompt-draft.actions.v1`

Current public Action count: **101**

Current extension branch: `feature/wizard`

## Status values

- `planned` — accepted scope, not implemented;
- `foundation` — internal runtime/support primitive, not a public domain mutation;
- `implemented-pending` — production Action/domain implementation exists, but the new real-checkout gate has not yet passed;
- `implemented` — public Action exists and its relevant real-checkout Actions checkpoint passed;
- `migrated` — public Action exists and the current Expert UI uses the same canonical domain service.

The exact v1 public identity set is pinned by `scripts/actions-public-ids.test.ts`; this document groups the inventory by domain rather than duplicating that exact fixture line-for-line.

## Foundation

| Primitive | Status | Notes |
|---|---|---|
| Action registry discovery | foundation | `get`, `has`, `list` |
| Single Action execution | foundation | atomic success/failure; caller-Draft isolation |
| Input schema validation | foundation | repository-owned typed subset |
| Deterministic ID injection | foundation | `ActionIdFactory` |
| Explicit runtime facts | foundation | `ActionEnvironment` |
| Semantic assignment scope service | foundation | exact identity; no fuzzy retargeting |
| Public manifest / invocation bridge | foundation | `prompt-draft.actions.v1`; now 101 public Actions |
| Batch execution | planned | deferred until a real orchestration consumer requires it |
| Dry run | planned | deferred with batch design |

## Public inventory by domain

| Domain | Public Actions | Status |
|---|---:|---|
| Modules / presets / Custom Mode | 5 | implemented |
| Variables | 5 | 4 migrated + 1 implemented |
| ModuleEntity lifecycle + fields/presets | 9 | implemented |
| Typography | 8 | implemented |
| Scene | 8 | implemented |
| Layout | 8 | implemented |
| Color Palette | 8 | implemented |
| Texture / Material | 6 | implemented |
| Pose | 4 | implemented |
| Expression | 4 | implemented |
| Lighting | 3 | implemented |
| Effects | 3 | implemented |
| Hair | 12 | implemented |
| Outfit | 14 | implemented |
| Prompt Settings / Output | 2 | implemented-pending |
| Prompt read operations | 2 | implemented |
| **Total** | **101** | Phase 10 validation pending |

Stable-reference behavior and specialized-domain ownership remain unchanged from the accepted 2026-08-27 baseline.

## Draft / modules

Public IDs:

- `module.activate`
- `module.deactivate`
- `module.field.set`
- `module.preset.apply`
- `module.customMode.set`

`module.reset` remains planned until generic/specialized Clear semantics are canonicalized.

The Setup panel's module selector is already represented by `module.activate` / `module.deactivate`; Phase 10 does not duplicate it.

## Variables

Public IDs:

- `variable.create`
- `variable.update`
- `variable.duplicate`
- `variable.delete`
- `variable.setEnabled`

Variables remain the only intentionally completed broad Expert UI mutation migration. Accepted migration checkpoint: **107/107 + build + manual UI regression**.

## Structured module domains

The accepted baseline contains the existing explicit operations for:

- ModuleEntity lifecycle, fields and presets;
- Typography groups/text;
- Scene lifecycle and component attachment;
- Layout Regions/Grid/Scene bindings;
- Color Palette assignments/swatches;
- Texture/Material assignments;
- Pose assignments;
- Expression assignments;
- Lighting sources;
- Effect layers;
- Hair styles/components;
- Outfit sets/items/relations.

These domains intentionally retain specialized Actions where generic field mutation would lose schema, stable-reference, ownership, preset, or sidecar semantics. No arbitrary entity/object/path patch exists.

See `scripts/actions-public-ids.test.ts` for the exact ID set and the domain-specific tests under `scripts/actions-*.test.ts` for operation-level coverage.

## Phase 10 — Prompt Settings / Output

Implementation commit: `1e3bd96a9119210805eebc3db7ae00008502a110`.

| Action ID | Status | Intent |
|---|---|---|
| `prompt.settings.update` | implemented-pending | Closed typed partial update of canonical Setup/`PromptSettings`, including nested image-to-image settings. |
| `prompt.outputFormat.set` | implemented-pending | Persist canonical `modular | natural | json` Output selection. |

### `prompt.settings.update`

Covers the actual persisted Prompt Settings fields used by `PromptSetupPanel`:

- `mode`;
- `idea`;
- `subject`;
- `subjectType`;
- `aspectRatio` from the canonical aspect-ratio catalog;
- `globalRules`;
- nested `imageToImage`:
  - `referenceUsage`;
  - `transformationStrength`;
  - `preserveMainSubject`;
  - `preserveIdentity`;
  - `preservePose`;
  - `preserveOutfit`;
  - `preserveComposition`;
  - `preserveColors`;
  - `preserveMaterials`;
  - `preserveLighting`.

Properties are explicitly assigned by the domain implementation and the public schema is closed. This is an aggregate typed mutation, not a generic path patch.

Nested image-to-image updates are partial merges. Intentional empty strings remain valid for authored text fields so existing Setup edit/reset semantics are representable.

An empty update is rejected. Cross-field completeness remains a `prompt.validate` concern, matching the Expert editor's ability to hold intermediate state.

### `prompt.outputFormat.set`

Persists `PromptDraftState.outputFormat`. `prompt.compile` consumes the persisted value unless its optional read-only `format` override is provided.

## Prompt read operations

| Action ID | Status | Intent |
|---|---|---|
| `prompt.validate` | implemented | Rebuild canonical module outputs and run existing validation semantics without caller mutation. |
| `prompt.compile` | implemented | Compile the canonical Draft headlessly in persisted or explicitly overridden format. |

Accepted pre-Phase-10 checkpoints:

- `prompt.validate`: **153/153**;
- `prompt.compile`: **161/161 + phase9 9/9 + build**.

## Public contract / export

Contract: `prompt-draft.actions.v1`.

The accepted 2026-08-27 public baseline was 99 Actions and passed the final **168/168** Actions gate.

Phase 10 deliberately expands the v1 exact-ID fixture to **101 Actions**. Keeping v1 is intentional because the extension is additive and reviewed; no existing ID/semantics are broken.

Current public boundary still guarantees:

- one canonical registry factory;
- deterministic JSON-safe manifest;
- JSON-Schema-compatible schema export;
- explicit `read | mutation` effect metadata;
- consumer-owned request limited to `{ actionId, input }`;
- trusted host ownership of Draft/modules/environment/ID factory;
- structured malformed-envelope/unknown-Action failures;
- atomic caller-Draft semantics.

## Validation history

Accepted pre-Phase-10 timeline:

18 → 27 → 35 → 41 → 49 → 57 → 65 → 73 → 81 → 89 → 97 → 105 → 107 → 119 → 131 → 147 → 153 → 161 → 167 → **168 validated**.

Phase 10 adds **8 focused tests**, so the expected full Actions suite is now **176 tests**. This is an expected count only until the real checkout runs the gate.

Current validation state:

- TypeScript parser/transpile syntax checks for Phase 10 files: **passed**;
- `pnpm test:actions-api`: **pending**;
- reference/UX/compiler regressions: **pending rerun**;
- production build: **pending rerun**.

## Registration / compatibility rule

An Action becomes `implemented` only after:

1. canonical operation lives outside Vue components;
2. rejection/read semantics are structured;
3. isolated tests cover success and important invariants;
4. public ID/input/result contract is documented;
5. no second domain/compiler implementation is introduced;
6. the real checkout suite passes.

For `prompt-draft.actions.v1`, existing IDs cannot be renamed/removed/repurposed without an explicit compatibility/version decision. New public IDs require deliberate fixture/docs review; Phase 10 follows that rule.
