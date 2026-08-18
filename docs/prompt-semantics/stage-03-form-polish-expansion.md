# Prompt Semantics Refactor — Stage 03: Form Polish & Expansion

## Goal

Harden the Form module after the first Style/Form boundary tests. This stage focuses on cleaner semantic output, richer combinability, and lightweight compatibility guidance without taking creative control away from the user.

## Operational checklist

1. Rewrite noisy or over-directive Form prompt text.
2. Remove context/purpose wording that does not belong to Form.
3. Add compatibility guidance between Proportions and Transformation.
4. Expand universal Form Language and Transformation vocabulary.
5. Expand subject-aware controls for Person, Typography, Scene / Environment, and Animal.
6. Preserve incompatible selections when Subject Type changes; warn instead of deleting.
7. Keep all new options optional. Subject Type only changes UI availability and never injects prompt text by itself.

## Compatibility rule

Compatibility is advisory, not restrictive.

The first compatibility axis is:

`Proportions -> Transformation`

Examples:

- compact / short-limbed proportions + Alien Elongation => warning
- elongated / long-limbed proportions + Squashed Compact Anatomy => warning
- compact / stocky animal proportions + Serpentine Elongation => warning

The transformation remains selectable and continues to compile. The warning exists only to tell the user that the result may become a hybrid or less predictable form.

## Prompt-text cleanup

The stage removes unnecessary explanatory wording from several transformations.

Examples:

- `twisted form transformation with rotational flow` -> `twisted form with rotational curvature`
- `extreme transformation intensity` -> `extreme form transformation`
- Facial Exaggeration no longer prescribes cheeks/jaw as mandatory sub-decisions.
- Alien Elongation no longer repeats multiple versions of the same elongation signal.
- Radical Silhouette focuses on mass redistribution rather than verbose anatomical explanation.

Legacy context-heavy IDs such as `fashion_elongated`, `fashion_caricature`, `compact_mascot`, and `personality_asymmetry` are not preserved in the new Form vocabulary. Draft/version migration is responsible for legacy schemas.

## Universal expansion

### Form Language

Added reusable structural languages including:

- Ribbon-Like
- Crystalline
- Layered
- Cellular
- Radial

### Proportions

Added reusable proportional controls including:

- Graduated Scale
- Nested Scale

### Transformation

Added reusable transformations including:

- Pinch
- Bulge
- Ripple
- Spiral
- Perforate
- Interweave

## Person expansion

### Proportions

Person-specific proportional controls now include patterns such as:

- Slender Elongated
- Compact / Short Limb
- Long Torso / Short Legs
- Short Torso / Long Legs
- Broad Shoulders / Narrow Hips
- Narrow Shoulders / Wide Hips
- Oversized Hands / Feet

Existing useful Person controls such as Chibi, Oversized Head, and Long Limbs / Narrow Torso remain.

### Transformation

Person transformations were cleaned and expanded. The vocabulary covers:

- caricature and facial exaggeration
- elastic / rubber-hose anatomy
- constructed / segmented anatomy
- creature / hybrid shifts
- grotesque and uncanny anatomy
- Pinched Torso
- Limb Taper

## Typography expansion

Typography-specific Form Language options include:

- Modular Letterforms
- Ribbon Letterforms
- Inflated Letterforms
- Interlocking Letterforms

Typography-specific Proportions include:

- Condensed Letterforms
- Expanded Letterforms
- Tall / Narrow Letterforms
- Squat / Wide Letterforms
- Variable Letterform Scale

Typography-specific Transformations include:

- Arc-Bent Letterforms
- Wave Letterforms
- Inflated Letterforms
- Pinched Letterforms
- Folded Letterforms
- Interlocking Letterforms
- Fragmented Letterforms
- Twisted Letterforms

These controls affect letterform geometry only. Typography content, hierarchy, placement, font choice, and text accuracy remain owned by the Typography module.

## Scene / Environment expansion

Scene-specific Form Language options include:

- Terraced Environment
- Stratified Environment
- Eroded Environment
- Dendritic Environment

Scene-specific Proportions include:

- Towering Masses
- Low / Spreading Masses
- Narrow / Vertical Forms
- Broad / Horizontal Forms
- Environmental Scale Gradient

Scene-specific Transformations include:

- Terrain Fold
- Sweeping Environmental Warp
- Floating Land Masses
- Strata Shift
- Crystalline Growth
- Erosion Cut
- Gravity Droop
- Inverted Landform

These describe physical environmental form rather than camera framing or scene composition.

## Animal expansion

Animal-specific Form Language options include:

- Streamlined Animal
- Segmented Animal
- Armored Animal
- Serpentine Animal

Animal-specific Proportions include:

- Long Body / Short Limbs
- Long-Legged
- Compact / Stocky
- Large Head / Small Body
- Long Neck
- Tapered Body

Animal-specific Transformations include:

- Serpentine Elongation
- Multi-Limb
- Armored Segmentation
- Spine Growth
- Limb Reduction
- Appendage Expansion

Insectoid Anatomy and Creature Hybrid remain shared between Person and Animal and use a neutral `Creature / Hybrid Anatomy` category label.

## Recommended validation matrix

### Person

Try a coherent combination:

- Form Language: Faceted / Planar
- Proportions: Slender Elongated
- Transformation: Alien Elongation
- Strength: Strong

Then create an intentional conflict:

- Proportions: Compact / Short Limb
- Transformation: Alien Elongation

The second combination should remain valid but display a compatibility warning.

### Typography

Try:

- Form Language: Modular Letterforms
- Proportions: Tall / Narrow Letterforms
- Transformation: Wave Letterforms
- Strength: Moderate

The output must contain no person/anatomy wording.

### Scene / Environment

Try:

- Form Language: Stratified Environment
- Proportions: Towering Masses
- Transformation: Strata Shift
- Strength: Strong

The output must describe physical environmental form without camera/framing instructions.

### Animal

Try:

- Form Language: Serpentine Animal
- Proportions: Long Body / Short Limbs
- Transformation: Serpentine Elongation
- Strength: Strong

Then test:

- Proportions: Compact / Stocky
- Transformation: Serpentine Elongation

The latter should display a compatibility warning while preserving the selection.

## Translation workflow

English flat keys for this stage live in:

`scripts/i18n-patches/en.form-semantics.ts`

Apply them with the existing merge script and `--overwrite`. Other locale files are intentionally untouched during this refactor stage.
