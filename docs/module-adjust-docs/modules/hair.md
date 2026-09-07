# Hair module

Module key: `hair`
Sources: `app/modules/hair.semantic.ts`, `app/modules/hair.catalog.ts`, `app/modules/hair.types.ts`, `app/modules/hair.catalog.validation.ts`

## Real top-level fields

### `hairStyles`
Structured `hairStyles` designer/editor. Default: `[]`.

The complete selectable inventory and nested designer schema are catalog-driven. **Before recommending any Hair value, read the current `hair.catalog.ts` and `hair.types.ts` on `main`.** Persist only catalog ids/values and nested properties that actually exist there. Do not turn catalog display names into invented persisted values.

Hair output is exposed as a semantic target and currently supports `color` and `material` capabilities, so Color Palette and Texture assignments may target real Hair entities when those entities exist.

### `customText`
Global/module override (`isOverride: true`). Discouraged.

## Custom policy

Use custom values inside the Hair designer only where the current catalog/types/editor explicitly support them. Catalog absence alone is not permission to invent a field. Prefer structured Hair data and field/editor-level custom capability over `customText`.