# Stage 10 — Color Palette Semantics

Status: **Implementation ready for validation**

## Goal

Refactor Color Palette without discarding its useful original model: define a palette and assign it to semantic parts of the image.

The new contract is:

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
│       └── Custom Target
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

## Reference safety

Dynamic targets store stable reference metadata (`variableId` or `entityId`) plus their token/label snapshot.

If the referenced entity disappears, the rule is preserved and the target appears as a disabled Missing Reference option. User intent is never silently deleted.

Typography targets compile with both a human label and structural token, for example:

```text
typography text "Title" ({text_title})
```

This keeps Natural output understandable even though Typography's natural serializer does not normally print structural tokens.

## Multi-target rules

A single palette can target multiple entities.

`Overall Image` is exclusive only inside the same rule. A later, more specific rule may intentionally override the overall palette for one target.

Exact duplicate targets across multiple rules produce an advisory warning but are not blocked.

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

## Validation checklist

Before closing Stage 10, test at least:

1. preset → Overall Image
2. preset → Outfit + Accent Elements
3. custom literal palette → Background
4. mixed literal + Color Variable palette
5. palette → user Subject variable
6. palette → user Object variable
7. palette → Typography Group
8. palette → individual Typography Text
9. broad Typography palette + specific Text override
10. deleted/missing referenced target remains visible as Missing
11. duplicate exact target shows warning without blocking
12. Modular and Natural outputs preserve palette ↔ target relationships
13. `pnpm generate` succeeds

## Files introduced/changed

- `app/modules/colorPalette.module.ts`
- `app/modules/types.ts`
- `app/components/modules/panel/ColorAssignmentsField.vue`
- `app/utils/compileColorPalette.ts`
- `app/utils/compileModules.ts`
- `app/utils/optimizeNaturalPrompt.ts`
- `scripts/i18n-patches/en.color-palette-semantics.ts`
- `scripts/i18n-patches/fa.semantic-refactor.todo.ts`

Stage 10 stays open until the validation checklist is exercised with real Modular/Natural output.
