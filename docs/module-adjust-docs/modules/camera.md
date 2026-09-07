# Camera module

Module key: `camera`
Source: `app/modules/camera.module.ts`

## Real fields

### `captureSystem`
Camera/capture system selector. Current options include generic digital/film systems, integrated systems, and named analog/digital camera models. The inventory is categorized in `captureSystemOptions`; use its exact current `value` strings only.

### `captureResponse`
Sensor/film/capture-response selector. Exact current inventory is `captureResponseOptions`. Compatibility metadata relates response choices to `captureSystem` tags; respect mismatch warnings.

### `lensProfile`
Lens/optics selector. Exact current inventory is `lensProfileOptions`, including general optical profiles and fixed-lens profiles tied to compatible camera systems. Respect lens/system compatibility hints.

### `focusDepth`
Current built-ins are defined by `focusDepthOptions` (including depth-of-field/focus behavior values such as shallow/deep/fixed-focus/critical-focus variants). Read the exact current array before selecting a persisted value.

### `captureBehavior`
Current built-ins are defined by `captureBehaviorOptions`, including stable/tripod, handheld, stabilized, fixed-mounted and other current capture behavior choices. Use exact source values.

### `extraDetails`
Additive camera detail.

### `customText`
Global/module override (`isOverride: true`), discouraged.

## Presets and compatibility

Camera contains preset recipes and compatibility metadata. Before recommending a named camera, response, or lens combination, read the current arrays/presets in `camera.module.ts`. Do not pair a fixed-lens profile with an incompatible system just because the creative description sounds plausible.

## Custom policy

Do not assume every Camera select supports Custom by field. The current source is authoritative for `customInput`/freeform support. When a desired technical nuance is absent from built-ins and no field-level custom path exists, prefer `extraDetails` before the global override.