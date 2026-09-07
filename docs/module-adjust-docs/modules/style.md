# Style module

Module key: `style`
Sources: `app/modules/style.freeform.ts`, `app/modules/style.semantic.ts`, `app/modules/freeformOptions.ts`

## Real fields

`aesthetic`, `medium`, `stylizationLevel`, `linework`, `visualTreatment`, `detailLevel`, `finish`, `extraDetails`, `customText`.

The exact built-in values, categories, prompt meanings, tags, presets, and defaults are defined in `style.semantic.ts`. The registered module is wrapped by `style.freeform.ts`.

## Field-level custom support

The registered wrapper explicitly adds a freeform option to:
- `aesthetic`
- `medium` (categorized under Custom)
- `linework`
- `visualTreatment`
- `finish`

Therefore, when an intended style value is missing from built-ins, **Custom by field is strongly preferred** on one of those fields where semantically appropriate. Do not claim field-level custom for `stylizationLevel` or `detailLevel` unless current `main` adds it.

Examples of built-in `stylizationLevel` values currently include `subtle`, `controlled`, `strong`, `extreme`, `abstract`. Built-in aesthetic and medium inventories are intentionally large; always read the current arrays in `style.semantic.ts` before selecting a persisted value.

### `extraDetails`
Additive free text for a detail that does not deserve replacement of structured Style output.

### `customText`
Global/module override. **Do not recommend by default.**

## Recommendation rule

For a request such as an ancient clay sculpture photographed as a real object, inspect `aesthetic` and `medium` built-ins first (for example photography/photorealistic semantics), then use field custom only for the missing concept. Do not collapse the whole request into `customText`.