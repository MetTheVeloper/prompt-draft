# Lighting module

Module key: `lighting`
Sources: `app/modules/lighting.freeform.ts`, `app/modules/lighting.module.ts`

## Real structured fields

### `lightSources`
Structured multi-light editor. Each light supports:

- `role`: `key`, `fill`, `rim`, `accent`, `background`, `practical`, `environment`.
- `sourceType`: `area_light`, `point_light`, `daylight`, `direct_sun`, `overcast_sky`, `window`, `studio`, `softbox`, `spotlight`, `direct_flash`, `streetlight`, `candle`, `fire`, `screen`, `fluorescent`, `neon`, `stage`.
- `direction`: `omnidirectional`, `front`, `camera_left`, `camera_right`, `three_quarter_left`, `three_quarter_right`, `back`, `back_left`, `back_right`, `top`, `below`.
- `quality`: `very_soft`, `soft`, `balanced`, `hard`, `very_hard`.
- `intensity`: `dim`, `low`, `balanced`, `bright`, `intense`.
- `color`: `neutral`, `warm`, `cool`, `amber`, `blue`, `red`, `magenta`, `cyan`, `green`, `purple`, `pastel`, `custom`.
- `customColor`: companion custom color value when `color=custom`.
- `features`: `patterned_shadows`, `volumetric_beams`, `halo_backlight`, `silhouette_emphasis`.

### `ambientLevel`
`none`, `minimal`, `low`, `balanced`, `bright`.

### `overallContrast`
`low`, `balanced`, `high`, `extreme`.

### `extraDetails`
Additive lighting detail.

### `customText`
Global override, discouraged.

## Presets

The current module contains many lighting presets such as `soft_diffused`, `natural_window`, `overcast_daylight`, `golden_hour`, studio/high-key/low-key/chiaroscuro/noir and other setups. Read the exact `lightingPresets` object on `main` before recommending a preset id.

## Custom policy

For an unavailable light color, prefer the structured `color=custom` + `customColor` path. The registered `lighting.freeform.ts` wrapper may expose additional freeform behavior; inspect it before claiming field-level custom on other controls. Do not jump to `customText`.