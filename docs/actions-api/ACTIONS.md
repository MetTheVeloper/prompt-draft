# Actions API Registry

Canonical inventory of public Actions API operations on `refactor/actions-api`.

Public contract: `prompt-draft.actions.v1`

Current public Action count: **99**

Status values:

- `planned` — accepted scope, not implemented/validated for this branch;
- `foundation` — internal runtime/support primitive, not a public domain mutation;
- `implemented` — public Action exists and its real-checkout Actions API checkpoint passed;
- `migrated` — public Action exists and the current Expert UI uses the same canonical domain service.

Once an Action is `implemented`, its ID is a compatibility surface. The exact v1 public ID set is pinned by `scripts/actions-public-ids.test.ts`.

## Foundation

| Action / primitive | Status | Notes |
|---|---|---|
| Action registry discovery | foundation | `get`, `has`, `list` |
| Single action execution | foundation | atomic success/failure; caller-draft isolation |
| Input schema validation | foundation | repository-owned schema subset |
| Deterministic ID injection | foundation | `ActionIdFactory` |
| Explicit runtime facts | foundation | `ActionEnvironment` |
| Semantic assignment scope service | foundation | exact identity; no fuzzy retargeting |
| Capability-scoped semantic sources | foundation | color/material dynamic refs |
| Subject assignment target resolver | foundation | shared by Pose/Expression/Hair/Outfit |
| Public manifest / invocation bridge | foundation | `prompt-draft.actions.v1`; 99 public Actions |
| Batch execution | planned | deferred until a real orchestration consumer requires it |
| Dry run | planned | deferred with batch design |

## Draft / modules

| Action ID | Status | Intent |
|---|---|---|
| `module.activate` | implemented | Activate registered module; initialize only missing state. |
| `module.deactivate` | implemented | Deactivate non-destructively. |
| `module.field.set` | implemented | Set one simple schema-backed field; structured fields reject. |
| `module.preset.apply` | implemented | Apply one registered preset with canonical sidecar rules. |
| `module.customMode.set` | implemented | Toggle module Custom Override where supported. |
| `module.reset` | planned | Deferred until generic/specialized Clear semantics are canonicalized. |

## Variables

| Action ID | Status |
|---|---|
| `variable.create` | migrated |
| `variable.update` | migrated |
| `variable.duplicate` | migrated |
| `variable.delete` | migrated |
| `variable.setEnabled` | implemented |

Variables are the only intentionally completed Expert UI migration in this branch. Accepted migration checkpoint: **107/107 + build + manual Create/Edit/Enabled/Duplicate/Delete/Blueprint regression**.

## Generic named module entities

| Action ID | Status |
|---|---|
| `moduleEntity.create` | implemented |
| `moduleEntity.update` | implemented |
| `moduleEntity.duplicate` | implemented |
| `moduleEntity.delete` | implemented |
| `moduleEntity.setEnabled` | implemented |
| `moduleEntity.setInheritance` | implemented |
| `moduleEntity.field.set` | implemented |
| `moduleEntity.field.clear` | implemented |
| `moduleEntity.preset.apply` | implemented |

No public arbitrary entity payload/path patch exists.

## Typography

| Action ID | Status |
|---|---|
| `typography.group.create` | implemented |
| `typography.group.update` | implemented |
| `typography.group.delete` | implemented |
| `typography.group.move` | implemented |
| `typography.text.create` | implemented |
| `typography.text.update` | implemented |
| `typography.text.delete` | implemented |
| `typography.text.move` | implemented |

## Scene

| Action ID | Status |
|---|---|
| `scene.create` | implemented |
| `scene.update` | implemented |
| `scene.duplicate` | implemented |
| `scene.delete` | implemented |
| `scene.setEnabled` | implemented |
| `scene.component.attach` | implemented |
| `scene.component.detach` | implemented |
| `scene.component.replace` | implemented |

Scene component refs use exact `moduleKey + entityId`; missing refs are explicitly detachable/replaceable and never fuzzy-recovered.

## Layout

| Action ID | Status |
|---|---|
| `layout.region.create` | implemented |
| `layout.region.update` | implemented |
| `layout.region.duplicate` | implemented |
| `layout.region.delete` | implemented |
| `layout.region.move` | implemented |
| `layout.grid.update` | implemented |
| `layout.region.assignScene` | implemented |
| `layout.region.clearScene` | implemented |

Region/Scene binding uses exact stable Scene identity. Generic Region update cannot directly patch `contentRef`.

## Color Palette

| Action ID | Status |
|---|---|
| `colorPalette.assignment.create` | implemented |
| `colorPalette.assignment.delete` | implemented |
| `colorPalette.assignment.scope.set` | implemented |
| `colorPalette.assignment.applyPreset` | implemented |
| `colorPalette.swatch.add` | implemented |
| `colorPalette.swatch.setLiteral` | implemented |
| `colorPalette.swatch.setVariable` | implemented |
| `colorPalette.swatch.delete` | implemented |

Exact stable assignment/swatch IDs; exact semantic refs; preset replaces colors while preserving scope; variable swatches bind only exact enabled user Color variables.

## Texture / Material

| Action ID | Status |
|---|---|
| `texture.assignment.create` | implemented |
| `texture.assignment.delete` | implemented |
| `texture.assignment.scope.set` | implemented |
| `texture.assignment.applyPreset` | implemented |
| `texture.assignment.property.set` | implemented |
| `texture.assignment.conditions.set` | implemented |

Exact assignment identity and exact semantic scope; authored freeform values remain authored; property/condition edits detach preset.

## Pose

| Action ID | Status |
|---|---|
| `pose.assignment.create` | implemented |
| `pose.assignment.update` | implemented |
| `pose.assignment.delete` | implemented |
| `pose.assignment.applyPreset` | implemented |

Validation checkpoint: **97/97**.

## Expression

| Action ID | Status |
|---|---|
| `expression.assignment.create` | implemented |
| `expression.assignment.update` | implemented |
| `expression.assignment.delete` | implemented |
| `expression.assignment.applyPreset` | implemented |

Validation checkpoint: **105/105**.

## Lighting / Effects

| Action ID | Status |
|---|---|
| `lighting.source.create` | implemented |
| `lighting.source.update` | implemented |
| `lighting.source.delete` | implemented |
| `effects.layer.create` | implemented |
| `effects.layer.update` | implemented |
| `effects.layer.delete` | implemented |

Stable source/layer IDs, configured limits/catalog validation, canonical custom transitions, and preset detachment only on actual mismatch. Final checkpoint: **119/119 + build**.

## Hair

| Action ID | Status |
|---|---|
| `hair.style.create` | implemented |
| `hair.style.update` | implemented |
| `hair.style.duplicate` | implemented |
| `hair.style.delete` | implemented |
| `hair.style.setSource` | implemented |
| `hair.style.setProperty` | implemented |
| `hair.style.applyPreset` | implemented |
| `hair.component.create` | implemented |
| `hair.component.update` | implemented |
| `hair.component.setProperty` | implemented |
| `hair.component.duplicate` | implemented |
| `hair.component.delete` | implemented |

Exact Style/Component IDs; nested IDs remap on Style duplicate; exact subject/reference behavior; typed property catalogs remain domain-owned. Final checkpoint: **131/131**.

## Outfit

| Action ID | Status |
|---|---|
| `outfit.set.create` | implemented |
| `outfit.set.update` | implemented |
| `outfit.set.duplicate` | implemented |
| `outfit.set.delete` | implemented |
| `outfit.set.applyPreset` | implemented |
| `outfit.item.create` | implemented |
| `outfit.item.update` | implemented |
| `outfit.item.setSource` | implemented |
| `outfit.item.setProperty` | implemented |
| `outfit.item.duplicate` | implemented |
| `outfit.item.delete` | implemented |
| `outfit.relation.create` | implemented |
| `outfit.relation.update` | implemented |
| `outfit.relation.delete` | implemented |

Exact Set/Item/Relation ownership; duplication remaps only known exact relation endpoints; persisted orphan endpoints never fuzzy-repair. Final checkpoint: **147/147**.

## Prompt read operations

| Action ID | Status | Intent |
|---|---|---|
| `prompt.validate` | implemented | Rebuild canonical module outputs headlessly and run existing validation rules without mutating caller state. |
| `prompt.compile` | implemented | Compile canonical Draft headlessly in persisted or explicit `modular | natural | json` format. |

`prompt.validate`: **153/153**.

`prompt.compile`: **161/161 + phase9 compiler regression 9/9 + build**.

The compiler remains one canonical implementation: core formatting is pure, wrapper-level pure transformations live in `compilePromptPure.ts`, and the current Expert UI retains a runtime synchronization adapter in `compilePrompt.ts`.

## Public contract / export

Contract: `prompt-draft.actions.v1`.

Public contract checkpoint: **167/167 + successful build**.

Validated public boundary:

- exactly 99 unique public Actions assembled by one registry factory;
- JSON-safe deterministic manifest;
- JSON-Schema-compatible schema export;
- `effect: read | mutation` metadata;
- model-owned request limited to `{ actionId, input }`;
- trusted host owns Draft/modules/environment/ID factory;
- malformed envelope and unknown Action failures remain structured;
- Action atomic caller-draft semantics are preserved.

`scripts/actions-public-ids.test.ts` pins the exact v1 ID set and passed in the final **168/168** Actions gate.

## Final merge-readiness validation

Accepted final gate on 2026-08-27:

- `pnpm test:actions-api` => **168/168**;
- `pnpm test:reference-catalog` => **15/15**;
- `pnpm test:phase8-ux` => **5/5**;
- `pnpm test:phase9-regression` => **9/9**;
- `pnpm build` => **successful**.

The branch is **merge-ready**.

## Validation timeline

18 → 27 → 35 → 41 → 49 → 57 → 65 → 73 → 81 → 89 → 97 → 105 → 107 → 119 → 131 → 147 → 153 → 161 → 167 → **168 final validated**.

## Registration / compatibility rule

An Action becomes `implemented` only after:

1. canonical operation lives outside Vue components;
2. rejection/read semantics are structured;
3. isolated tests cover success and important invariants;
4. public ID/input/result contract is documented;
5. no second domain/compiler implementation is introduced;
6. the real checkout suite passes.

An Action becomes `migrated` only when the current Expert UI uses the same canonical domain service and regression behavior is checked.

For `prompt-draft.actions.v1`, existing public IDs cannot be renamed/removed/repurposed without an explicit compatibility/version decision. New public IDs require deliberate fixture/docs review.