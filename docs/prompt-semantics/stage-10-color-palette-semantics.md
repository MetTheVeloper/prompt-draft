# Stage 10 — Color Palette Semantics

Status: **Semantically closed**

## Goal

Refactor Color Palette without discarding its useful original model: define a palette and assign it to semantic parts of the image.

The final contract is:

> Color Palette defines editable base-color palettes and assigns those palettes to semantic targets. It does not own illumination color, material/surface appearance, scene content, or visual style.

## Final schema

```text
Color Palette
├── Palette Rules[]
│   ├── Preset → populates editable swatches
│   ├── Colors[]
│   │   ├── Literal Color
│   │   └── User Color Variable
│   └── Apply To[]
│       ├── Built-in Targets
│       ├── Typography Groups
│       ├── Typography Texts
│       ├── User Subject Variables
│       ├── User Object Variables
│       └── Custom Targets[]
├── Extra Details
└── Custom Override
```

## Semantic boundaries

### Color Palette owns

- base colors and color sets
- reusable palette recipes
- assignment of a palette to one or more semantic targets
- broad-to-specific palette overrides

### Color Palette does not own

- illumination color or light casts → Lighting
- material, finish, reflectivity, surface structure → Texture
- scene/background content → Background
- artistic medium or rendering style → Style

The old `lighting` palette target is removed from the new target catalog. Legacy drafts preserve that old intent as a custom legacy target instead of silently deleting it.

## Preset contract

Palette presets are state recipes, not prose bundles.

Selecting a preset populates real editable swatches. Editing, adding, removing, or replacing a swatch detaches the active preset while preserving the resulting colors.

Preset categories such as Cinematic or Luxury are discovery metadata only. Their compiled semantics are color-only.

## Color sources

Each palette swatch is one of:

- literal color value
- enabled user variable with `type: color`

This allows mixed palettes such as:

```text
{brand_primary} / #F6E7D1 / {brand_accent}
```

A Color variable remains a single color value. No new Palette variable type is introduced in this stage.

## Dynamic targets

Built-in targets:

- Overall Image
- Background
- Main Subject
- Outfit
- Hair
- Typography
- Accent Elements

Dynamic targets appear only when semantically colorable entities are available:

- Typography module `text_group` variables
- Typography module `text` variables
- enabled user variables with `type: subject`
- enabled user variables with `type: object`

Layout regions are intentionally not color targets because a region is a spatial container, not an unambiguous colorable entity.

Custom targets are created outside the target selector and stored as explicit rule targets. More than one custom target may coexist in the same palette rule.

## Reference safety

Dynamic targets store stable reference metadata (`variableId` or `entityId`) plus their token/label snapshot.

If the referenced entity disappears, the rule is preserved and the target appears as a disabled Missing Reference item. User intent is never silently deleted.

Typography targets use a human-readable entity label in the selector while retaining the structural token as reference metadata and description.

## Multi-target rules

A single palette can target multiple entities.

`Overall Image` is exclusive only inside the same rule. A later, more specific rule may intentionally override the overall palette for one target.

Exact duplicate targets across multiple rules produce an advisory warning but are not blocked.

## Shared multi-select component

Stage 10 exposed a reusable product-level UI need: native HTML multi-select controls were no longer adequate for grouped semantic references, mobile-friendly selection, persistent menu state, or rich item descriptions.

A shared `el-multi-select` component was introduced on top of the existing `useMenu()` / dropdown infrastructure.

It now supports:

- click-to-toggle selection without Ctrl/Cmd,
- grouped items,
- descriptions,
- disabled/missing items,
- active/check state,
- clear behavior,
- exclusive values such as `Overall`,
- keeping the menu open while toggling multiple selections.

All generic `field.type === "multiSelect"` rendering in `base.vue` now uses the shared component. Lighting Features and Color Palette targets were migrated to it as well.

The old review-backlog item for native multi-select UI was removed after validation.

## Compile contract

Each rule is compiled as a self-contained relational clause:

```text
teal-and-orange palette (#0F6B78 / #2D8C91 / #D9792B / #F2B36D) assigned to the outfit and accent elements
```

Multiple rules are separated with semicolons so colors and targets remain linked through the Natural pipeline.

Rules are compiled broad-to-specific:

1. Overall
2. built-in scoped targets
3. dynamic/custom targets

The Natural optimizer has a dedicated Color group so a palette aimed at Background or Outfit cannot be misclassified into those modules' semantic budgets.

## Legacy migration

The editor automatically normalizes old `paletteAssignments` records:

```text
mode + preset/colors + usage
```

into:

```text
presetId + colors[] + targets[]
```

Old preset-only assignments receive the new concrete preset swatches.

## Validation results

The user exercised the Stage 10 validation matrix in the real editor and reported successful behavior across the full test pack.

Confirmed cases include:

1. generic multi-select click/toggle behavior
2. `Overall` exclusivity
3. Typography Group/Text dynamic targets
4. user `subject` and `object` variable targets
5. mixed literal + Color Variable palettes
6. preset → editable swatches / detach behavior
7. multiple Custom Targets
8. Missing Reference preservation
9. duplicate exact-target warning without blocking
10. Lighting Features regression after shared multi-select migration
11. generic `base.vue` multi-select migration
12. shared multi-select reopen/toggle/clear behavior
13. Modular/Natural palette ↔ target relationship preservation

Representative verified output:

```text
custom color palette (#d92626 / #f5dbdb) assigned to user target "hero" ({hero});
forest green-and-earth palette (#213B2B / #496342 / #6F5A3A / #9A7B55 / #C4B08A) assigned to user target "car" ({car})
```

Natural output preserved both palette/target relationships while Typography and user variables remained independent semantic blocks.

## Files introduced/changed

- `app/modules/colorPalette.module.ts`
- `app/modules/types.ts`
- `app/components/modules/panel/ColorAssignmentsField.vue`
- `app/components/el/multi-select.vue`
- `app/components/modules/panel/base.vue`
- `app/components/modules/lighting/LightSourcesField.vue`
- `app/utils/compileColorPalette.ts`
- `app/utils/compileModules.ts`
- `app/utils/optimizeNaturalPrompt.ts`
- `scripts/i18n-patches/en.color-palette-semantics.ts`
- `scripts/i18n-patches/fa.semantic-refactor.todo.ts`

## Closure

Stage 10 is semantically closed after real UI, reference, compiler, Modular/Natural, and shared multi-select validation.

Reopen Color Palette only if later Texture/cross-module testing reveals a concrete semantic conflict rather than for theoretical micro-polishing.
