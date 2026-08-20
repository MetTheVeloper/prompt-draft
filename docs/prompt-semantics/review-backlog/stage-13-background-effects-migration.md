# Stage 13 — Background / Effects legacy migration

## Status

Open — migration only. **Stage 13 is semantically closed and validated.** This item must not be interpreted as an open Background/Effects schema-design task.

## Problem

Older saved/imported drafts may still contain legacy fields such as:

```text
backgroundStyle
effectStyle
effectIntensity
```

Stage 13 replaced these with:

```text
Background semantic constructor fields
+
Effect Layers[] with per-layer intensity/details
```

Unknown legacy keys may remain persisted but no longer represent the authoritative semantic schema.

## Values requiring ownership-aware policy

Legacy Background and Effects catalogs frequently bundled concepts that now belong to different owners:

- blur / soft focus / depth-of-field / camera motion → Camera,
- neon illumination / lighting halo / lighting-native glow → Lighting,
- risograph / screen-print / medium-like halftone treatment → Style,
- depicted setting/environment/backdrop structure → Background,
- image-space overlays / signal artifacts / added grain / degradation / composited VFX → Effects.

Automatic migration must not preserve old prose by silently reintroducing these ownership violations.

## Exact concepts that can migrate later

Some legacy values have conservative destinations, for example:

- clean/studio/indoor/outdoor/natural/urban/architectural background concepts → Background presets/fields,
- backdrop material values → `backgroundMaterial`,
- background element values → `backgroundElements`,
- vignette / light leak / dust-and-scratch / glitch / RGB split / scanline / JPEG artifact values → individual Effect Layers,
- the old global `effectIntensity` may be copied to every migrated Effect Layer only when the legacy draft truly represented one shared intensity choice and user review confirms that behavior.

## Required follow-up

1. Define explicit legacy Background migration recipes for values with clean constructor equivalents.
2. Define explicit legacy Effects migration recipes that create individual Effect Layers.
3. Define discard/preservation policy for cross-module pollution rather than guessing new owners silently.
4. Run migration during both local-storage hydration and imported JSON hydration.
5. Remove stale legacy keys only after successful migration.
6. Test old Background/Effects drafts across save/export/import round trips.
7. Remove this backlog item after migration is verified.
