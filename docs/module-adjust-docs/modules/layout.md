# Layout module

Module key: `layout`
Sources: `app/modules/layout.module.ts`, `app/modules/layout.templates.ts`, `app/modules/layout.types.ts`

## Real fields

### `layoutType`
Built-in values: `poster`, `banner`, `business_card`, `social_post`, `cover`, `editorial_page`, `collage`, `comic_page`, `product_sheet`, `presentation_slide`, `custom`.

Important: `custom` is a built-in selector value, but the current field does **not** declare `customInput`. Do not pretend there is a field-level custom companion text input unless current code adds one.

### `density`
Built-in values: `sparse`, `balanced`, `dense`, `maximal`.

### `regions`
Structured `layoutRegions` editor. Default grid is the application `DEFAULT_LAYOUT_GRID_SIZE` with an empty region list. For exact region schema and template-created regions, read `layout.types.ts`, `layout.templates.ts`, and the current layout editor implementation.

### `extraDetails`
Free textarea for additive layout details. This is not a global override and is the preferred place for extra layout-specific constraints that do not map to a built-in structured choice.

### `customText`
Module-wide override (`isOverride: true`). **Discouraged.** It replaces the normal generated layout output and should be a last resort.

## Presets

Presets come from `layoutTemplates` in `app/modules/layout.templates.ts`; always read that file for the exact current preset ids and region payloads before recommending one.

## Recommendation rules

Prefer structured `layoutType`, `density`, and `regions`. Use `extraDetails` for a precise missing detail. Do not use `customText` merely because the user described a custom composition.