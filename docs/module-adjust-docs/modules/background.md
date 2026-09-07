# Background module

Module key: `background`
Source: `app/modules/background.module.ts`

## Real fields and current built-ins

### `backgroundConcept` — supports Custom by field
`clean_background`, `studio_background`, `indoor_environment`, `outdoor_environment`, `natural_environment`, `urban_environment`, `architectural_environment`, `material_background`, `abstract_background`, `graphic_background`, `pattern_background`, `mixed_media_background`, `transparent_background`, `custom`.

### `backgroundType` — supports Custom by field
`environment`, `studio`, `surface`, `abstract`, `graphic`, `pattern`, `mixed_media`, `transparent`, `custom`.

### `setting` — supports Custom by field
`indoor`, `outdoor`, `natural`, `urban`, `architectural`, `public`, `residential`, `commercial`, `industrial`, `sports`, `performance`, `futuristic`, `custom`.

### `spatialStructure` — supports Custom by field
`seamless`, `flat`, `open`, `layered`, `enclosed`, `expansive`, `horizon_based`, `framed`, `repeating`, `structured`, `asymmetrical`, `custom`.

### `backgroundMaterial` — supports Custom by field
`seamless_paper`, `paper`, `fabric`, `concrete`, `stone`, `wood`, `metal`, `glass`, `plaster`, `painted_wall`, `custom`.

### `detailDensity` — supports Custom by field
`minimal`, `restrained`, `balanced`, `detailed`, `dense`, `custom`.

### `backgroundElements` (multi-select) — supports Custom by field
`vegetation`, `architecture`, `furniture`, `crowd`, `signage`, `skyline`, `mountains`, `water`, `clouds`, `shelves`, `windows`, `machinery`, `arena_seating`, `horizon`, `contextual_props`, `custom`.

### `extraDetails`
Additive free textarea.

### `customText`
Global override (`isOverride: true`), discouraged.

## Presets

Current preset ids: `clean_background`, `studio_background`, `indoor_environment`, `outdoor_environment`, `natural_environment`, `urban_environment`, `architectural_environment`, `material_background`, `abstract_background`, `graphic_background`, `pattern_background`, `mixed_media_background`, `transparent_background`.

## Recommendation rule

This is a strong Custom-by-field module: all structured selector fields above declare `customInput`. When a desired background value is missing, use field-level custom on the narrowest relevant field instead of `customText`.