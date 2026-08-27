# Actions API Registry

Canonical inventory of public Actions API operations on `refactor/actions-api`.

Status values:

- `planned` — accepted/public scope, implementation not yet validated in the real checkout;
- `foundation` — internal runtime/support primitive;
- `implemented` — public action exists and its Actions API checkpoint passed;
- `migrated` — public action exists and the current Expert UI uses the same canonical domain service.

Once an action is `implemented`, its ID is a compatibility surface.

## Foundation

| Action / primitive | Status | Notes |
|---|---|---|
| Action registry discovery | foundation | `get`, `has`, `list` |
| Single action execution | foundation | atomic success/failure; caller draft isolation |
| Input schema validation | foundation | repository-owned schema subset |
| Deterministic ID injection | foundation | `ActionIdFactory` |
| Explicit runtime facts | foundation | `ActionEnvironment` |
| Semantic assignment scope service | foundation | exact identity; no fuzzy retargeting |
| Capability-scoped semantic sources | foundation | color/material dynamic refs |
| Subject assignment target resolver | foundation | shared by Pose/Expression/Hair/Outfit |
| Batch execution | planned | deferred until a real multi-step consumer requires it |
| Dry run | planned | deferred with batch design |

## Draft / modules

| Action ID | Status | Intent |
|---|---|---|
| `module.activate` | implemented | Activate registered module; initialize only missing state. |
| `module.deactivate` | implemented | Deactivate non-destructively. |
| `module.field.set` | implemented | Set one simple schema-backed field; structured fields reject. |
| `module.preset.apply` | implemented | Apply one registered preset with canonical sidecar rules. |
| `module.customMode.set` | implemented | Toggle module Custom Override where supported. |
| `module.reset` | planned | Deferred until Clear/reset semantics are canonicalized. |

## Variables

| Action ID | Status | Intent |
|---|---|---|
| `variable.create` | migrated | Create user variable with stable ID and canonical unique key. |
| `variable.update` | migrated | Update exact variable while preserving stable ID. |
| `variable.duplicate` | migrated | Duplicate adjacent with fresh ID/key. |
| `variable.delete` | migrated | Delete exact stable variable; references are not retargeted. |
| `variable.setEnabled` | implemented | Toggle exact variable. |

Variables were the first Expert UI migration. Real checkout validation: **107/107 + build + manual Create/Edit/Enabled/Duplicate/Delete/Blueprint regression**. The UI still changes Enabled through general update, so `variable.setEnabled` remains `implemented` rather than `migrated`.

## Generic named module entities

| Action ID | Status | Intent |
|---|---|---|
| `moduleEntity.create` | implemented | Create named configuration with stable ID and unique key. |
| `moduleEntity.update` | implemented | Update metadata without changing identity. |
| `moduleEntity.duplicate` | implemented | Duplicate with deep-copied payload and fresh identity. |
| `moduleEntity.delete` | implemented | Delete exact entity; external refs remain missing. |
| `moduleEntity.setEnabled` | implemented | Toggle exact entity availability. |
| `moduleEntity.setInheritance` | implemented | Toggle global inheritance where capability permits. |
| `moduleEntity.field.set` | implemented | Set one simple local payload override. |
| `moduleEntity.field.clear` | implemented | Remove one local override/sidecar. |
| `moduleEntity.preset.apply` | implemented | Apply eligible preset fields to one entity payload. |

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

Group/Text mutation identity is exact stable ID; structural tokens remain presentation/reference metadata.

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

Region/Scene binding uses exact stable Scene identity. Generic region update cannot directly patch `contentRef`.

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

Exact stable assignment/swatch IDs; exact semantic refs; preset replaces colors while preserving scope; variable swatches bind only exact enabled user Color variables. No broad assignment patch action.

## Texture / Material

| Action ID | Status |
|---|---|
| `texture.assignment.create` | implemented |
| `texture.assignment.delete` | implemented |
| `texture.assignment.scope.set` | implemented |
| `texture.assignment.applyPreset` | implemented |
| `texture.assignment.property.set` | implemented |
| `texture.assignment.conditions.set` | implemented |

Exact assignment identity and exact semantic scope; authored freeform values remain authored; property/condition edits detach preset. No broad assignment patch action.

## Pose

| Action ID | Status |
|---|---|
| `pose.assignment.create` | implemented |
| `pose.assignment.update` | implemented |
| `pose.assignment.delete` | implemented |
| `pose.assignment.applyPreset` | implemented |

Uses the shared exact subject-target resolver. Payload edits detach preset; target-only edits preserve it. Exact persisted orphans can survive/remove; new missing/unavailable refs reject. Validation checkpoint: **97/97**.

## Expression

| Action ID | Status |
|---|---|
| `expression.assignment.create` | implemented |
| `expression.assignment.update` | implemented |
| `expression.assignment.delete` | implemented |
| `expression.assignment.applyPreset` | implemented |

Same exact target primitive as Pose, domain-owned payload/preset semantics. Validation checkpoint: **105/105**.

## Lighting / Effects

| Action ID | Status |
|---|---|
| `lighting.source.create` | implemented |
| `lighting.source.update` | implemented |
| `lighting.source.delete` | implemented |
| `effects.layer.create` | implemented |
| `effects.layer.update` | implemented |
| `effects.layer.delete` | implemented |

Stable source/layer IDs, configured limits/catalog validation, canonical custom transitions, preset detachment only on actual mismatch. Effects preset equality is object-key-order-insensitive. Final checkpoint: **119/119 + build**.

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

Exact Style/Component IDs; nested IDs remap on Style duplicate; exact subject/reference behavior; property catalogs are domain-validated; no broad nested patch. Validation checkpoint: **131/131**.

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

Exact Set/Item/Relation ownership. Set duplicate remaps only known relation endpoints through exact old-ID → new-ID mapping; pre-existing orphan endpoints remain orphaned. Item delete removes only exact connected relations. Relation update validates only changed endpoints so an unchanged orphan can survive and later be explicitly repaired/deleted. Final checkpoint: **147/147**.

## Prompt read operations

| Action ID | Status | Intent |
|---|---|---|
| `prompt.validate` | implemented | Rebuild canonical module outputs headlessly and run existing validation rules without mutating the Draft. |
| `prompt.compile` | planned | Compile canonical Draft headlessly in persisted or explicit `modular | natural | json` format. Implementation is present; awaiting the 161-test/compiler/build checkpoint. |

`prompt.validate` passed the real checkout at **153/153** on 2026-08-27 and is promoted to `implemented`.

`prompt.compile` uses the same `app/domain/promptRead.ts` output builder validated by `prompt.validate`. Final prompt compilation is not duplicated:

- `app/utils/compilePromptCore.ts` is now the existing formatting/compiler algorithm made pure by removing only Vue runtime synchronization and exporting the existing system-variable builder;
- `app/utils/compilePromptPure.ts` owns the previously wrapper-level pure transformations: automatic Scene/Layout rule, typed user Subject/Reference ownership, system-variable filtering, and Scene presentation aliases;
- `app/utils/compilePrompt.ts` is now only the Expert UI runtime adapter that reads Vue variable ownership and synchronizes system variables/subject context around the pure result;
- `prompt.compile` derives typed user variable ownership from the active canonical Variables module and calls the same pure final adapter;
- explicit `format` overrides the persisted output format for that read only;
- compile remains read-only and does not fail merely because the Draft has validation warnings/errors, matching current UI behavior.

Eight compile regression tests are included in `scripts/actions-prompt-compile.test.ts`; expected Actions API total: **161 tests**. Because compiler ownership changed intentionally, validation also requires `pnpm test:phase9-regression` and `pnpm build`.

## Validation timeline

18 → 27 → 35 → 41 → 49 → 57 → 65 → 73 → 81 → 89 → 97 → 105 → 107 → 119 → 131 → 147 → **153 validated**; **161 pending**.

## Registration rule

An action becomes `implemented` only after:

1. canonical operation lives outside Vue components;
2. rejection/read semantics are structured;
3. isolated tests cover success and important invariants;
4. public ID/input/result contract is documented;
5. no second domain/compiler implementation is introduced;
6. the real checkout suite passes.

An action becomes `migrated` only when the current Expert UI uses the same canonical service and regression behavior is checked.
