# Effects module

Module key: `effects`
Source: `app/modules/effects.module.ts`

## Real fields

### `effectLayers`
Structured effect-layer editor; maximum currently `8` layers.

Built-in `effectType` values:
- Post processing: `vignette`, `highlight_bloom`, `added_film_grain`, `synthetic_chromatic_fringing`.
- Analog damage: `light_leak_overlay`, `dust_scratches_overlay`, `film_burn_overlay`.
- Digital / signal: `glitch_displacement`, `rgb_channel_split`, `datamosh_artifacts`, `pixel_sorting`, `scanlines`, `digital_noise`, `vhs_signal_artifacts`, `signal_warping`.
- Degradation: `jpeg_compression`, `pixelation`, `color_banding`.
- Motion / graphic: `speed_lines`, `motion_trails`.
- Scene VFX: `floating_particles`, `magical_particles`, `sparkle_overlay`, `energy_aura`.
- Interface overlay: `hud_overlay`, `data_readout_overlay`.
- `custom`.

Each layer supports the real values `effectType`, `customEffect`, `intensity`, and `details`.

`intensity` built-ins: `subtle`, `restrained`, `balanced`, `strong`, `extreme`.

When `effectType=custom`, use `customEffect` as **Custom by field**. `details` is also additive per-layer free text.

### Presets
`subtle_post_finish`, `analog_damage`, `digital_glitch`, `vhs_signal`, `degraded_digital`, `motion_graphic`, `magical_vfx`, `hud_interface`.

### `extraDetails`
Additive module-level effect detail.

### `customText`
Global override (`isOverride: true`), discouraged.

## Recommendation rule

Prefer one or more precise effect layers. If the desired effect is missing, use a custom effect layer rather than the global override. Keep effect count minimal and intentional.