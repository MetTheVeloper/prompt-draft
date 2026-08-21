# Stage 14 — Hair + Outfit Semantics

## Status

**Semantically closed.**

Hair and Outfit were redesigned from legacy global mega-select modules into subject-scoped hierarchical semantic systems, implemented on `refactor/prompt-semantics`, exercised through the real editor, cross-module Color/Material targeting, Modular/Natural prompt output, and representative real image-generation tests.

The user approved both modules for closure after the resulting images demonstrated correct subject-to-Hair/Outfit assignment and understandable child-entity targeting.

Deferred legacy migration remains tracked separately and does not keep Stage 14 open.

---

## Original product intent recovered during discovery

The original purpose of both modules was to replace or define visible subject details independently of the source/reference subject:

- Hair should let the user define the hairstyle that a selected subject should have.
- Outfit should let the user define what a selected subject should wear.

The legacy implementations predated user-defined subject variables and the later relational target infrastructure, so they were forced into one global subject assumption and large prose-heavy selects.

The refactor preserves the original product goal while adapting it to the current prompt graph: any system/user subject can receive its own Hair/Outfit entity, and those entities can themselves become targets for other semantic modules.

---

# Outfit

## Responsibility contract

Outfit defines the visible wearable composition and item-local structural/construction decisions worn by one or more selected subjects.

Outfit owns concepts such as:

```text
wearable set composition
wearable item identity
fit / cut / length
sleeves / neckline / collar / closure
bottom rise / leg shape / skirt silhouette / pleating / slit
footwear shape / heel / platform / shaft
pattern / graphic motif / embellishment when garment-local
wearable arrangement and explicit item relationships
```

Outfit does not own:

- garment color → Color Palette,
- fabric/material/finish/surface behavior → Texture / Material,
- global aesthetic/medium/editorial/anime/fantasy treatment → Style,
- unrelated held props merely because they accompany clothing,
- Hair-specific ornaments integrated into the hairstyle.

## Hierarchical schema

Outfit now uses:

```text
OutfitSets[]
├── stable internal id
├── human semantic key
├── display name
├── subject targets[]
├── optional starter preset
├── items[]
│   ├── stable internal id
│   ├── human semantic key
│   ├── canonical/custom wearable type
│   ├── defined/reference source
│   ├── dynamic structural properties
│   └── additional details
├── relations[]
└── additional details
```

Each Outfit Set is a semantic entity. Each wearable item is also a semantic entity.

The set owns the subject relationship and ensemble composition. Items own their local structural payload.

## Canonical types vs starters

A large discovery catalog no longer means every visible choice must become a canonical type.

Examples:

```text
Canonical: skirt
Starter: Mini Skirt → skirt + length=mini
Starter: Pleated Skirt → skirt + pleating=knife

Canonical: jeans
Starter: Skinny Jeans → jeans + legShape=skinny
```

This keeps the state compositional rather than rebuilding the old mega-select under a different UI.

Outfit presets are editable recipes that create item state; they are not prompt prose bundles.

## Defined vs reference baseline

Each wearable item supports a source baseline:

```text
defined
reference
```

Properties use neutral inheritance by default. `inherit` does not emit redundant prose.

With a defined source it means "leave this property to the selected item baseline." With a reference source it means "preserve this property from the referenced item baseline."

Explicit property values override the baseline. Explicit absence remains a different semantic state from inheritance.

This allows an image-to-image workflow to reuse a referenced garment while overriding only selected structural properties.

---

# Hair

## Responsibility contract

Hair defines the visible structural hairstyle and its hair-specific arrangement for one or more selected subjects.

Hair owns:

```text
length
cut / base shape
curl pattern
volume
parting
hair silhouette
structural styling state
bangs / fringe
ponytails
buns / updos
braids
twists
locs
face-framing strands
shaved sections
hair-specific integrated ornaments/accessories
```

Hair does not own:

- hair color / dye / highlights → Color Palette,
- material identity or surface rendering → Texture / Material,
- global aesthetic/medium → Style,
- hats/caps and ordinary wearable headwear → Outfit.

A critical boundary decision is that words such as `curly`, `wavy`, `coily`, `braided`, `bangs` and `ponytail` remain Hair structural semantics even though everyday language may call some of them "hair texture."

## Material targeting remains valid

Hair itself does not own material/surface properties, but a Hair Style or Hair Component may expose the `material` capability.

This is necessary for non-photoreal subjects such as:

```text
yarn hair on a toy
plastic molded hair
carved marble hair on a sculpture
metal hair
translucent crystal hair
```

The rule is:

> Hair owns structure. Texture / Material owns what that structure is materially made of and how its surface renders.

This boundary avoids conflating curl/cut/arrangement with material/surface semantics while preserving creative non-human use cases.

## Hierarchical schema

Hair now uses:

```text
HairStyles[]
├── stable internal id
├── human semantic key
├── display name
├── subject targets[]
├── defined/reference baseline
├── base structural properties
├── components[]
│   ├── stable internal id
│   ├── human semantic key
│   ├── component type/custom type
│   ├── component-local properties
│   └── additional details
└── additional details
```

A hairstyle may stand on base structure alone; components are added only when they represent real independent sub-structure.

Presets provide editable starter state for common hairstyles such as natural waves, layered cuts, pixie/bob styles, buns, ponytails, braids, locs and sculpted alternatives.

---

# Shared Hair / Outfit prompt-graph architecture

## Stable identity vs human semantic keys

The stage deliberately separates persistence identity from prompt-facing paths.

Internal IDs remain machine-stable and are used by persisted semantic target identity.

Human semantic keys are readable lowerCamelCase path segments and are uniqueness-constrained:

- Outfit Set keys are unique within Outfit.
- Outfit Item keys are unique within their owning Set.
- Hair Style keys are unique within Hair.
- Hair Component keys are unique within their owning Style.

Changing a key updates prompt-facing tokens without changing the entity's stable `entityId`, so Color/Material assignments remain attached across rename.

## Global reference paths

Outside the owning module, entities use globally unique paths:

```text
{outfit_eveningSet}
{outfit_eveningSet_dress}

{hair_curlyUpdo}
{hair_curlyUpdo_bangs}
```

The underscore represents hierarchy boundaries while each semantic-key segment remains lowerCamelCase.

## Local scoped aliases

Inside the module definition, the hierarchy already provides scope, so long global paths are unnecessary.

Example:

```text
{outfit} =
• {subject}: wear {evening}
• {evening}:
  ◦ dress: dress
  ◦ {necklace}: large necklace
```

The external Texture assignment can still use:

```text
{outfit_evening_necklace}
```

Hair follows the same strategy:

```text
{hair} =
• {subject}: style hair as {curlyUpdo}
• {curlyUpdo}:
  ◦ base: shoulder-length curly hair
  ◦ {bangs}: curtain bangs
```

External Color/Material references remain globally scoped.

## Selective alias emission

Not every possible entity token is rendered inside the module definition.

If an item/component is not referenced by another prompt-graph node, it remains plain human text.

If an external module references it, the final prompt assembly promotes it to a local braced alias.

This keeps the prompt readable while preserving explicit graph relationships only where they are needed.

## Capability-driven targets

Outfit Sets/items and Hair Styles/components expose semantic capabilities through the shared module-variable catalog.

Color Palette asks for `color`; Texture / Material asks for `material`.

Those consumer modules do not hard-code Hair/Outfit implementation details. Stable `entityId` remains the semantic identity while the global token is prompt-facing metadata.

---

# Compiler and Natural-output behavior

Hair and Outfit have dedicated compilers rather than falling through the generic flat field compiler.

Their output preserves:

```text
subject → parent entity
parent entity → child entities
child structural payload
```

Both use the project's standard bullet hierarchy:

```text
• parent/application level
◦ child level
```

The final prompt assembler scans external module/settings references and performs selective local-alias promotion before rendering the final prompt.

A Natural-output duplication defect discovered during Outfit testing was fixed at the assembly layer: a linked protected module definition must not also be appended a second time as a generic Natural protected block.

That fix became the shared precedent for Hair as well.

---

# Editor architecture

The specialized designers live in dedicated module components rather than accumulating logic in the generic/base panel.

Outfit and Hair are routed through specialized panels while the shared editor remains a rendering/orchestration shell.

Catalog/state/compiler concerns are separated:

```text
types                  → serializable contracts
catalog                → semantic taxonomy / property knowledge
catalog validation     → internal consistency checks
specialized components → editor UX
compiler               → prompt semantics
variable catalog       → targetable graph entities
final assembler        → selective aliases / Natural graph preservation
```

This separation allows catalogs to grow without turning the persisted state schema or generic Base UI into module-specific monoliths.

---

# Translation

Hair uses module-scoped English/Persian locale fragments registered through `i18n/i18n.config.ts`, following the major-module translation pattern established by Background and Effects.

The semantic description explicitly tells users that Hair owns hairstyle structure while Color Palette and Texture / Material own color/material rendering.

---

# Validation evidence

## Outfit

Outfit passed interactive editor tests including:

- creation of multiple Outfit Sets,
- subject assignment,
- presets and manual edits,
- dynamic item-specific property editors,
- custom wearable items,
- global and item-level Color/Texture targeting,
- stable target identity after semantic-key changes,
- selective set/item alias rendering,
- standardized nested bullets,
- Modular output,
- Natural output without duplicate Outfit blocks.

Representative real-image tests included:

1. one referenced subject with a constructed Casual outfit, per-item Color Palette assignments and per-item Texture / Material assignments;
2. two referenced people receiving two different Outfit Sets with multiple item-level and whole-set Color Palette targets.

Both Modular and Natural prompts produced coherent images in which the intended subject-to-outfit mapping and major color/item relationships were recognizable. Modular output was consistently the more deterministic/precise representation, while Natural remained semantically usable.

## Hair

Hair passed interactive architecture/output validation and a representative two-subject real image-generation test.

The test used two user subject variables with independent hairstyles:

- one subject received a custom/preset-derived hairstyle containing loc-like components and a dedicated multi-color Hair Style target,
- the second subject received a Pixie Cut with a dedicated bright yellow Hair Style color assignment,
- Hair and Outfit assignments coexisted in the same prompt without subject ownership collapsing,
- Pose and Expression also targeted the two subjects independently.

The generated image clearly represented two different subjects, two distinct hairstyles, and the bright yellow pixie color while preserving the intended Hair/Outfit subject separation.

A stray unrelated Hair Color target in the test prompt did not invalidate the core architecture; it simply had no relevant matching hairstyle in the shown Hair definition and was treated as test noise rather than a Hair semantic defect.

The user accepted the Hair implementation for closure without requiring another generation test.

---

# Cross-module boundary audit

Canonical ownership after Stage 14:

```text
Hair structure / hairstyle composition     → Hair
Wearable structure / outfit composition    → Outfit
Hair/garment color                         → Color Palette
Hair/garment material + surface rendering  → Texture / Material
Global medium/aesthetic                    → Style
Broad structural/form language             → Form
Subject body action/posture                 → Pose
Subject facial affect                      → Expression
```

Hair and Outfit are subject-scoped recipients, not broad target catalogs. Color/Material have broad recipient policies and may target the Hair/Outfit entities exposed through capabilities.

Headwear remains Outfit-owned; ornaments structurally integrated into hair remain Hair-owned.

---

# Reusable lessons established by Stage 14

1. **Hierarchical semantic entities are justified when both a whole and selected children need independent external targeting.**
2. **Stable persistence identity and human prompt identity must be separate.** `entityId` should survive key/label changes.
3. **Global token paths and local aliases solve different problems.** Use global paths for unambiguous cross-module references and short aliases inside an owning scope.
4. **Selective token emission reduces prompt noise.** Do not expose every possible implementation token when only a subset participates in the prompt graph.
5. **Large UX catalogs should be compositional.** Canonical types + starter property recipes are preferable to hundreds of baked semantic types.
6. **`inherit` is not `none`.** Inheritance can be neutral; explicit absence is a semantic decision.
7. **Reference baseline belongs at the entity level when many properties can inherit from the same source.** Per-property overrides can remain explicit.
8. **Capability-driven targeting scales to nested entities.** Child entities may expose Color/Material without consumer modules knowing their implementation.
9. **Ownership must follow the semantic axis, not the object category.** Hair can be made of marble or yarn without Hair owning material; Outfit can be red without Outfit owning color.
10. **Natural duplication is an assembly problem when a linked structured definition is already present.** Do not solve it by weakening the module's structured output.

---

# Legacy migration

Legacy Hair/Outfit migration is intentionally deferred and documented in:

```text
docs/prompt-semantics/review-backlog/stage-14-hair-outfit-migration.md
```

Important examples:

```text
hairColor        → Color Palette ownership
hairTexture      → split between Hair structure and Texture / Material
outfitStyle      → may require decomposition into actual wearable entities
legacy mega-options → may contain Style/Color/Material/role assumptions
```

Migration must be conservative and ownership-aware. It must not reintroduce polluted prose merely to preserve legacy text.

This migration backlog does not keep Hair or Outfit semantically open.

---

# Closure rule

Do not reopen Hair or Outfit for:

- ordinary image-model variance,
- minor wording preferences,
- desire for additional catalog breadth alone,
- deferred legacy migration,
- cosmetic UI polish that does not alter semantics.

Reopen only when later evidence reveals:

- a concrete ownership defect,
- a reproducible compiler/state failure,
- broken stable target identity,
- ambiguous/colliding semantic paths,
- loss or duplication of the prompt graph,
- a real missing structural axis that cannot be represented compositionally.

With those exceptions, **Stage 14 Hair + Outfit is closed.**
