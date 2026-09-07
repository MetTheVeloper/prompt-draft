# Color Palette module

Module key: `colorPalette`
Source: `app/modules/colorPalette.module.ts`

## Real fields

### `paletteAssignments`
Structured `colorAssignments` editor. Each rule assigns one or more color swatches/palettes to semantic targets, with optional exceptions. Do not invent target ids; targets must come from actual semantic entities/modules/variables.

Current built-in palette ids:

- General / Balanced: `monochrome_black_and_white`, `grayscale_neutral_palette`, `soft_pastel_palette`, `warm_earthy_palette`, `cool_muted_palette`.
- Cinematic: `teal_and_orange_palette`, `desaturated_cinematic_palette`, `moody_blue_gray_palette`, `golden_sunset_palette`.
- Neon / Stylized: `neon_purple_and_yellow`, `cyber_blue_and_magenta`, `electric_green_and_black`, `vivid_pop_palette`.
- Luxury / Elegant: `gold_and_black_luxury_palette`, `ivory_and_champagne_palette`, `emerald_and_gold_palette`, `deep_burgundy_luxury_palette`.
- Nature: `forest_green_and_earth_tones`, `ocean_blue_palette`, `desert_sand_palette`, `autumn_foliage_palette`.
- Candy / Playful: `candy_pastel_palette`, `toy_like_primary_colors`, `bubblegum_pink_palette`, `rainbow_playful_palette`.

Each built-in also carries exact hex swatches in source. Read `colorPaletteAssignmentsOptions` on `main` when exact colors matter.

### `extraDetails`
Additive color details.

### `customText`
Global override (`isOverride: true`), discouraged.

## Custom policy

The assignment editor can represent literal colors and variable-backed swatches through the shared color-assignment contract. Prefer a precise custom/literal swatch inside the structured assignment when the desired palette is not built in. Do not replace the whole Color Palette module with `customText` just to use a color not present in presets.