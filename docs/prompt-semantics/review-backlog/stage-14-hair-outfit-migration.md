# Stage 14 — Hair / Outfit legacy migration

## Status

Open — migration only. **Stage 14 Hair + Outfit is semantically closed and validated.** This item must not be interpreted as an open Hair/Outfit schema-design task.

## Problem

Older saved/imported drafts may still contain the legacy flat fields:

```text
Hair:
hairStyle
hairColor
hairTexture
extraDetails

Outfit:
outfitStyle
extraDetails
```

Stage 14 replaces those flat/global schemas with subject-scoped hierarchical entities:

```text
HairStyles[]
├── subject targets[]
├── source: defined | reference
├── base structural properties
└── components[]

OutfitSets[]
├── subject targets[]
└── items[]
```

HairStyle/OutfitSet entities and their child components/items have stable internal IDs plus human semantic keys. Color Palette and Texture / Material target these entities through capability-driven semantic references rather than Hair/Outfit owning color/material fields directly.

## Values requiring ownership-aware policy

Legacy Hair and Outfit catalogs bundled multiple owners into single options. Migration must not restore those collisions merely to preserve old prose.

### Hair

- hair color, dye, highlights, streaks → Color Palette,
- material/surface finish such as glossy, matte, silky, plastic, yarn, marble, glass, metal → Texture / Material,
- curl pattern, cut, length, parting, volume, silhouette, bangs, braids, buns, ponytails and structural styling → Hair,
- anime/editorial/fantasy/premium aesthetic language → Style when intentionally preserved,
- headwear such as hats/caps → Outfit rather than Hair,
- hair-specific clips, pins, ribbons, scrunchies, beads and similar integrated ornaments → Hair components.

The legacy `hairTexture` field is especially ambiguous: values such as straight/wavy/curly/coily are Hair structure, while glossy/matte/silky are surface/material semantics. It must not be migrated as one unchanged field.

### Outfit

- garment identity, construction, fit, cut, length, neckline, sleeves, pleating, footwear shape and wearable arrangement → Outfit,
- garment color → Color Palette,
- fabric/material/finish/surface behavior → Texture / Material,
- anime/cinematic/fantasy/luxury/premium aesthetic assumptions → Style when intentionally preserved,
- character-role bundles such as superhero/warrior/wizard/princess must be decomposed into actual wearable items and only clean structural semantics retained.

Legacy `outfitStyle` values often describe a whole archetype rather than a precise wearable set. Automatic migration must not invent garments that were not explicitly encoded.

## Exact concepts that can migrate later

Some legacy values have conservative destinations when represented as editable recipes rather than prose:

### Hair

- short / medium / long → Hair length,
- straight / wavy / curly / coily → Hair curl pattern,
- bob / pixie / shag / undercut / fade / mohawk / pompadour and similar clean cuts → Hair cut/base shape,
- ponytail / bun / braid / tied-back concepts → Hair components,
- windblown / messy / sleek / sculpted where semantically clean → Hair styling state,
- a clean legacy style may migrate to one hairstyle targeting system `{subject}`.

### Outfit

- casual / formal / sporty values may map to starter outfit recipes only where the legacy option had a clearly documented garment composition,
- explicit garment combinations such as hoodie + jeans can migrate to individual Outfit items,
- explicit dress/gown/robe/armor/space-suit-like garment identities can migrate to corresponding canonical/custom wearable items when the mapping is unambiguous,
- a clean legacy outfit may migrate to one Outfit Set targeting system `{subject}`.

## Global `extraDetails` policy

Both legacy modules stored one global `extraDetails` value. The new schemas can contain multiple subject-scoped hairstyles/sets and multiple child entities, so an old global text value has no universally safe recipient.

A migration may copy it to the single migrated hairstyle/set only when exactly one unambiguous system-subject entity is being created. Multi-subject or multi-entity cases should preserve the legacy text for user review rather than guessing a destination.

## Semantic-key migration

Runtime entity identity must remain based on stable internal IDs. Human semantic keys are prompt-facing paths and must be generated conservatively from migrated labels/types with uniqueness enforced:

```text
Hair global paths:
{hair_<styleKey>}
{hair_<styleKey>_<componentKey>}

Outfit global paths:
{outfit_<setKey>}
{outfit_<setKey>_<itemKey>}
```

Changing a semantic key after migration must not invalidate Color/Material assignments; persisted target identity should continue to use `entityId`.

## Required follow-up

1. Define explicit legacy Hair option → hairstyle/property/component migration recipes for clean mappings.
2. Define explicit legacy Outfit option → Outfit Set/item starter recipes for clean mappings.
3. Define an ownership-aware preservation/discard policy for polluted legacy wording rather than silently moving semantics across modules.
4. Define the legacy global `extraDetails` review policy for ambiguous multi-subject cases.
5. Run migration during both local-storage hydration and imported JSON hydration.
6. Ensure migrated entity IDs remain stable and generated semantic keys are unique.
7. Test Color Palette / Texture target persistence across rename, save, export and import.
8. Remove stale legacy keys only after successful migration.
9. Test old Hair/Outfit drafts across complete save/export/import round trips.
10. Remove this backlog item after migration is verified.
