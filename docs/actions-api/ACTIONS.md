# Actions API Registry

This file is the canonical inventory of public Actions API operations.

Status values:

- `planned` — accepted scope, not yet validated as a public action;
- `foundation` — runtime/support primitive, not normally called by product consumers;
- `implemented` — action exists with isolated tests and has passed the Actions API suite;
- `migrated` — action exists and the current Expert UI uses the same canonical service.

Once an action is marked `implemented`, its ID is a compatibility surface. Renaming/removing it requires an explicit compatibility decision.

## Foundation

| Action / primitive | Status | Notes |
|---|---|---|
| Action registry discovery | foundation | `get`, `has`, `list` |
| Single action execution | foundation | atomic success/failure result |
| Input schema validation | foundation | small repository-owned schema |
| Deterministic test ID injection | foundation | domain-specific factory injection |
| Explicit runtime environment | foundation | ambient facts are passed through `ActionContext.environment` |
| Batch execution | planned | deferred until Wizard use-cases justify it |
| Dry run | planned | deferred with batch design |

## Draft / modules

| Action ID | Status | Intent |
|---|---|---|
| `module.activate` | planned | Activate a registered module; preserve existing inactive state or initialize missing defaults/panel state. |
| `module.deactivate` | planned | Deactivate non-destructively; preserve stored values/panel state. |
| `module.field.set` | planned | Set a simple schema-backed field; structured field types reject. |
| `module.preset.apply` | planned | Overlay a registered preset using canonical field/custom-sidecar semantics. |
| `module.customMode.set` | planned | Enable/disable module-level Custom Override where an override field exists. |
| `module.reset` | planned | Deferred until generic/specialized Clear semantics are explicitly canonicalized. |

The first five module actions have source implementations and tests on the current Phase 2 branch, but remain `planned` here until the updated suite passes in the real project checkout.

## Variables

| Action ID | Status | Intent |
|---|---|---|
| `variable.create` | implemented | Create a user variable with canonical unique key and stable ID. |
| `variable.update` | implemented | Update key/value/type/description/enabled while preserving stable variable ID. |
| `variable.duplicate` | implemented | Duplicate with a new ID/key and adjacent placement. |
| `variable.delete` | implemented | Remove one exact stable variable; references are not silently retargeted. |
| `variable.setEnabled` | implemented | Enable/disable one exact user variable. |

Validation checkpoint: `pnpm test:actions-api` passed **18/18** on 2026-08-27 with the Foundation + Variables suites.

## Generic named module entities

| Action ID | Status | Intent |
|---|---|---|
| `moduleEntity.create` | planned | Create a named configuration for an entity-capable module. |
| `moduleEntity.update` | planned | Update name/key/payload through canonical normalization. |
| `moduleEntity.duplicate` | planned | Duplicate with a new stable ID and unique editable key. |
| `moduleEntity.delete` | planned | Remove entity; external stable refs become missing, never retargeted. |
| `moduleEntity.setEnabled` | planned | Toggle availability without changing identity. |
| `moduleEntity.setInheritance` | planned | Toggle global inheritance where capability allows it. |
| `moduleEntity.field.set` | planned | Set a simple payload field with schema/custom-sidecar rules. |
| `moduleEntity.preset.apply` | planned | Apply an eligible module preset to entity payload. |

## Typography

| Action ID | Status | Intent |
|---|---|---|
| `typography.group.create` | planned | Create a text group with stable ID. |
| `typography.group.update` | planned | Update group metadata/layout options. |
| `typography.group.delete` | planned | Delete a group and contained blocks. |
| `typography.group.move` | planned | Reorder a group. |
| `typography.text.create` | planned | Add a stable text block to a group. |
| `typography.text.update` | planned | Update text block fields. |
| `typography.text.delete` | planned | Remove a text block. |
| `typography.text.move` | planned | Reorder/move text within supported group semantics. |

## Scene

| Action ID | Status | Intent |
|---|---|---|
| `scene.create` | planned | Create a Scene with stable ID and unique semantic key. |
| `scene.update` | planned | Update Scene metadata/description while preserving stable ID. |
| `scene.duplicate` | planned | Duplicate with new stable ID/key and copied explicit references. |
| `scene.delete` | planned | Delete Scene; Layout refs become missing until explicitly repaired/removed. |
| `scene.setEnabled` | planned | Toggle Scene availability. |
| `scene.component.attach` | planned | Attach an eligible module entity respecting module cardinality. |
| `scene.component.detach` | planned | Remove one exact stable module-entity reference. |
| `scene.component.replace` | planned | Explicitly replace a stable component reference. |

## Layout

| Action ID | Status | Intent |
|---|---|---|
| `layout.region.create` | planned | Create a normalized region. |
| `layout.region.update` | planned | Update region geometry/metadata with clamping. |
| `layout.region.duplicate` | planned | Duplicate with new stable ID and existing binding semantics. |
| `layout.region.delete` | planned | Delete region. |
| `layout.region.move` | planned | Reorder/layer movement. |
| `layout.grid.update` | planned | Update normalized grid dimensions. |
| `layout.region.assignScene` | planned | Bind an exact stable Scene ref and compatible token metadata. |
| `layout.region.clearScene` | planned | Explicitly clear stable Scene binding. |

## Color / Material scopes

| Action ID | Status | Intent |
|---|---|---|
| `colorPalette.assignment.create` | planned | Create color assignment. |
| `colorPalette.assignment.update` | planned | Update colors/scope/preset according to domain rules. |
| `colorPalette.assignment.delete` | planned | Delete assignment. |
| `texture.assignment.create` | planned | Create material assignment. |
| `texture.assignment.update` | planned | Update material payload/scope. |
| `texture.assignment.delete` | planned | Delete material assignment. |
| `assignment.targets.set` | planned | Shared canonical target selection helper where domain-compatible. |
| `assignment.exceptions.set` | planned | Shared canonical exception selection helper. |

Shared assignment actions must not erase domain-specific assignment payload semantics.

## Pose / Expression

| Action ID | Status | Intent |
|---|---|---|
| `pose.assignment.create` | planned | Create pose assignment with canonical default target policy. |
| `pose.assignment.update` | planned | Update pose payload and detach preset when required. |
| `pose.assignment.delete` | planned | Delete pose assignment. |
| `pose.assignment.applyPreset` | planned | Apply pose preset while preserving target scope. |
| `expression.assignment.create` | planned | Create expression assignment. |
| `expression.assignment.update` | planned | Update expression payload and detach preset when required. |
| `expression.assignment.delete` | planned | Delete expression assignment. |
| `expression.assignment.applyPreset` | planned | Apply expression preset while preserving target scope. |

## Lighting / Effects

| Action ID | Status | Intent |
|---|---|---|
| `lighting.source.create` | planned | Create source respecting max-source constraints. |
| `lighting.source.update` | planned | Update source including custom-color transition rules. |
| `lighting.source.delete` | planned | Delete source. |
| `effects.layer.create` | planned | Create effect layer respecting max-layer constraints. |
| `effects.layer.update` | planned | Update layer including custom-effect transition rules. |
| `effects.layer.delete` | planned | Delete layer. |

## Hair

| Action ID | Status | Intent |
|---|---|---|
| `hair.style.create` | planned | Create style with stable ID/key. |
| `hair.style.update` | planned | Update style metadata/targets/details. |
| `hair.style.duplicate` | planned | Duplicate style and nested components with new IDs. |
| `hair.style.delete` | planned | Delete style. |
| `hair.style.setSource` | planned | Set defined/reference source using canonical reference rules. |
| `hair.style.setProperty` | planned | Update typed property state. |
| `hair.component.create` | planned | Create component from type/starter/custom choice. |
| `hair.component.update` | planned | Update component. |
| `hair.component.duplicate` | planned | Duplicate component with new stable ID/key. |
| `hair.component.delete` | planned | Delete component. |

## Outfit

| Action ID | Status | Intent |
|---|---|---|
| `outfit.set.create` | planned | Create outfit set with stable ID/key. |
| `outfit.set.update` | planned | Update set metadata/targets/details. |
| `outfit.set.duplicate` | planned | Duplicate set and remap all nested IDs/relation endpoints. |
| `outfit.set.delete` | planned | Delete set. |
| `outfit.item.create` | planned | Create wearable item from type/starter/custom choice. |
| `outfit.item.update` | planned | Update item with unique key rules. |
| `outfit.item.duplicate` | planned | Duplicate item with new stable ID/key. |
| `outfit.item.delete` | planned | Delete item and remove connected relations. |
| `outfit.relation.create` | planned | Create relation between valid item IDs. |
| `outfit.relation.update` | planned | Update relation while validating endpoints. |
| `outfit.relation.delete` | planned | Delete relation. |

## Prompt read operations

These are action-like public capabilities but do not mutate state.

| Action ID | Status | Intent |
|---|---|---|
| `prompt.validate` | planned | Headless validation from canonical draft context. |
| `prompt.compile` | planned | Headless compile from canonical draft context and output format. |

## Registration rule

An action may be marked `implemented` only when:

1. its domain mutation is implemented outside Vue components;
2. expected rejection returns structured issues rather than relying on UI behavior;
3. isolated tests cover success and important invariant failures;
4. its ID/input/result shape is documented here;
5. it does not introduce a second implementation of an existing mutation;
6. the corresponding Actions API suite passes in the real project checkout.

An action may be marked `migrated` only after the existing Expert UI path uses the same canonical domain service and regression behavior is checked.
