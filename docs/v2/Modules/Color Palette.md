# Color Palette

[← Modules](./Modules.md)

## How this module thinks

Color Palette is a **color assignment system**. It does not merely say “use blue and orange.” A palette can be applied to semantic targets so the system can distinguish the colors of a jacket, background, title group, product, or other targetable entity.

## Palette options

### General / Balanced

- Black-and-White Monochrome
- Neutral Grayscale
- Soft Pastel
- Warm Earthy
- Cool Muted

### Cinematic

- Teal and Orange
- Desaturated Cinematic
- Moody Blue-Gray
- Golden Sunset

### Neon / Stylized

- Neon Purple and Yellow
- Cyber Blue and Magenta
- Electric Green and Black
- Vivid Pop

### Luxury / Elegant

- Gold and Black
- Ivory and Champagne
- Emerald and Gold
- Deep Burgundy

### Nature

- Forest Green and Earth Tones
- Ocean Blue
- Desert Sand
- Autumn Foliage

### Candy / Playful

- Candy Pastel
- Toy-Like Primary Colors
- Bubblegum Pink
- Rainbow Playful

Each catalog palette carries actual color swatches as well as semantic color language.

## Palette Assignments

An assignment can combine a palette with:

- semantic **Targets**
- color values/swatches
- exclusions or **Exceptions** where supported by the assignment editor

This makes it possible to say, effectively, “apply this palette to the outfit, except the metal buckle,” without making the whole image inherit the same colors.

## Field-level Custom

The palette catalog itself does not use the newer freeform `Custom` entry pattern. For colors outside the catalog, use the assignment’s editable color controls/variables and Extra Details rather than forcing a preset to do a job it was not designed for.

## Extra Details

Use for palette relationships such as “the accent red should appear only in tiny details” or “background colors remain one stop darker than the subject palette.”

## Full Custom Override

Available.

## Recipes

### One red accent in a neutral product scene

**Use:**
- Assignment 1 → Neutral Grayscale → background + secondary objects
- Assignment 2 → custom red color value → product accent target only
- Extra Details → “red occupies less than 10% of visible area”

**Why it works:** color hierarchy is built from scoped assignments instead of a global “mostly grayscale with red” sentence.

### Different palettes for two characters

**Use:**
- Character A → Warm Earthy
- Character B → Cool Muted
- Background → Neutral Grayscale

**Why it works:** target-aware assignments keep the two identities visually distinct.

### Brand color as a reusable variable

**Use:**
- Variables → define `brandBlue` as a Color variable
- Color Palette → use the variable inside the relevant assignment
- Typography / product details → reuse the same value where supported

**Why it works:** the brand color becomes a reusable semantic asset rather than three manually typed approximations.

---

**Next:** [Typography →](./Typography.md)