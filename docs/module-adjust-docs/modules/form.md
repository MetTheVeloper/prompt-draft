# Form module

Module key: `form`
Sources: `app/modules/form.freeform.ts`, `app/modules/form.semantic.ts`, `app/modules/freeformOptions.ts`

Form controls the subject's shape language, proportions and transformations. The built-in inventory is applicability-aware: some options are only valid/recommended for `person`, `animal`, `scene`, `typography`, etc.

## Real structured fields

Read the current `fields` block in `form.semantic.ts` before answering. Core concepts include `formLanguage`, `proportions`, and transformation-related structured fields, plus advanced/additive details and the module override.

The option arrays in `form.semantic.ts` are the exhaustive built-in source: `formLanguageOptions`, `proportionOptions`, transformation options, and any additional current field arrays. Preserve exact persisted `value` strings and respect `appliesTo` and compatibility metadata.

The registered module is `form.freeform.ts`, which may inject field-level freeform choices. A choice counts as Custom by field only when that wrapper/current field definition actually enables it.

## Recommendation rules

- Match the option to the actual subject type; do not recommend person-only proportions for an object or scene.
- Respect compatibility warnings between transformations and proportions.
- Prefer built-in values.
- If the needed shape concept is absent and the relevant field has a freeform option in the registered wrapper, use Custom by field.
- Use additive advanced details before considering a global override.
- `customText`, when present as `isOverride`, is a last resort and replaces structured Form output.

Because this module has a large and evolving option catalog, never rely on memory: inspect the exact current arrays on `main` for every recommendation.