# Variables module

Module key: `variables`
Source: `app/modules/variables.module.ts`

Use this module only when the idea needs reusable/user-defined prompt variables. It is not a visual styling module.

## Real fields

### `variables`
- Type: structured `variables` editor
- Default: `[]`
- Built-in variable types:
  - `text`
  - `subject`
  - `reference`
  - `object`
  - `color`
  - `font`
  - `custom`
- Reserved patterns that must not be treated as normal user variables: `text_*`, `text_group_*`, `layout_region_*`, `tg_*`, `tt_*`.
- `supportVariables` is currently `false` in this editor config.

There is no module-wide override field in the registered Variables module.

## Recommendation rules

Use the persisted type values above exactly. Do not invent a variable type. A `custom` variable type is valid when none of the built-in semantic types fits, but do not confuse that with a module global override.

Before answering, verify `app/modules/variables.module.ts` on `main` in case the inventory changed.