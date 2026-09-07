# Outfit module

Module key: `outfit`
Sources: `app/modules/outfit.semantic.ts`, `app/modules/outfit.catalog.ts`, `app/modules/outfit.types.ts`, `app/modules/outfit.catalog.validation.ts`

## Real top-level fields

### `outfitSets`
Structured `outfitSets` designer/editor. Default: `[]`.

The complete selectable inventory and nested set/item schema are catalog-driven. Always inspect the current `outfit.catalog.ts` and `outfit.types.ts` before recommending concrete item/category/material/etc. values. Use exact persisted ids/values from code.

Outfit output is exposed as a semantic target with `color` and `material` capabilities, allowing valid Color Palette / Texture assignments to target real outfit entities.

### `customText`
Global/module override (`isOverride: true`). Discouraged.

## Custom policy

Use custom values only in nested Outfit fields that explicitly support them in the current catalog/types/editor. Prefer structured Outfit sets/items and field-level custom behavior over the global override.