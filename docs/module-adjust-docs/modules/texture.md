# Texture module

Module key: `texture`
Sources: `app/modules/texture.freeform.ts`, `app/modules/texture.semantic.ts`, `app/modules/texture.catalog.ts`

## Real structured field

### `materialAssignments`
Structured material assignment editor. Each assignment can target one or more semantic entities and supports the real nested values:

- `material`: catalog-driven; exhaustive current values are `textureMaterialOptions` from `texture.catalog.ts`.
- `finish`: `matte`, `satin`, `semi_gloss`, `glossy`, `high_gloss`, `mirror`.
- `surfaceTexture`: `smooth`, `brushed`, `rough`, `porous`, `grainy`, `fibrous`, `woven`, `hammered`, `ridged`, `brush_marks`, `coarse`.
- `opticalCharacter`: `opaque`, `translucent`, `transparent`, `frosted`.
- `textureProminence`: `subtle`, `visible`, `pronounced`.
- `conditions`: `clean`, `handmade`, `scratches`, `cracks`, `dents`, `chips`, `dust`, `weathered`, `stains`, `fading`, `wrinkles`, `peeling`, `corrosion`.
- `targets`: real semantic target refs.
- `exceptions`: optional semantic target refs.

Current preset ids include `smooth_vinyl`, `handmade_clay`, `brushed_aluminum`, `polished_metal`, `clear_glass`, `frosted_glass`, `clean_porcelain`, `weathered_leather`, `woven_cotton`, `aged_wood`, `polished_marble`, `matte_rubber`.

Material/finish/texture/optical combinations carry compatibility metadata. Respect warnings and preferred/supported tags rather than selecting visually contradictory combinations without reason.

The registered `texture.freeform.ts` wrapper may add field-level freeform behavior. Read it plus the catalog before using a custom material value.

### Advanced/additive details and override

Read the current `fields` block in `texture.semantic.ts` for exact additive/override field ids. Any `isOverride` field is a global replacement and is discouraged.

## Recommendation rule

For concepts such as clay, ceramic, weathered stone, polished metal, etc., use a structured material assignment and target the real entity. Prefer built-in material/catalog values; when a needed material is absent and the registered wrapper exposes field custom, use Custom by field instead of a global override.