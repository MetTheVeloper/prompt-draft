# Typography

[← Modules](./Modules.md)

## How this module thinks

Typography is an **information-design system**. It organizes text into groups, gives each group a purpose and position, then defines individual text blocks with their own role, font direction, size, weight, and descriptive details.

It is designed for posters, covers, ads, product sheets, title cards, and other images where text is part of the composition—not a last-minute caption.

## Text Group fields

### Group Purpose — **Custom supported**

- Poster Header
- Poster Footer
- Product Information
- Event Information
- Music Cover Information
- Advertising Copy
- Badge / Label Cluster
- Side Caption
- Typographic Background
- Credits Area
- Custom

### Position Preset — **Custom supported**

- Top
- Top Left
- Top Center
- Top Right
- Center Left
- Center
- Center Right
- Bottom Left
- Bottom Center
- Bottom Right
- Bottom
- Left Side
- Right Side
- Custom

A group can also relate to a Layout region, allowing the spatial plan from Layout to become a semantic placement rather than duplicated prose.

### Group Direction

- Row
- Column

### Writing Direction

- Left-to-Right
- Right-to-Left
- Vertical Top-to-Bottom
- Vertical Bottom-to-Top

### Alignment

- Start
- Center
- End
- Justify

### Distribution

- Compact
- Balanced
- Spaced
- Scattered

## Individual Text fields

### Text Purpose — **Custom supported**

- Main Title
- Subtitle
- Slogan
- Artist Name
- Brand Name
- Product Name
- Price
- Discount
- Date
- Time
- Location
- Caption
- Warning Label
- Badge Text
- Footer Note
- Credits
- Call to Action
- Custom

### Font Style — **Custom supported**

- Clean Sans
- Bold Display
- Elegant Serif
- Condensed Poster
- Handwritten
- Gothic Blackletter
- Monospaced
- Graffiti
- Retro Script
- Minimal Editorial
- Custom

### Font Size — **Custom supported**

- Tiny
- Small
- Medium
- Large
- Huge
- Hero
- Custom

### Font Weight — **Custom supported**

- Light 300
- Regular 400
- Medium 500
- Semibold 600
- Bold 700
- Extra-Bold 800
- Heavy / Black 900
- Custom

Each Custom path has a dedicated description field, so “Custom” is not merely a label—it is a scoped place to describe the exact typographic behavior.

### Additional Description

Use for information that belongs to a specific text item, such as letter spacing, distortion, outline treatment, or a relationship to nearby imagery.

## Text Accuracy

- **Flexible** — exact lettering is not essential; the model may interpret typography more loosely.
- **Readable** — typography should be clear and intentionally legible.
- **Exact** — render the written text exactly, with correct spelling and no extra letters.

Text accuracy is a global typography instruction for the module.

## Extra Details

For module-wide typography behavior.

## Full Custom Override

Available.

## Recipes

### Poster title wired to a Layout region

**Use:**
- Layout → create `top-title` region
- Typography Group → Purpose: Poster Header; Position: layout region `top-title`
- Text → Purpose: Main Title
- Font → Condensed Poster
- Size → Hero
- Weight → Black
- Accuracy → Exact

**Why it works:** spatial layout and typography share the same semantic region instead of independently guessing “top.”

### Persian editorial composition

**Use:**
- Writing Direction → RTL
- Group Direction → Column
- Alignment → Start
- Font Style → Custom: “contemporary Persian display lettering with sharp geometric terminals”
- Size → Huge
- Accuracy → Exact

**Why it works:** language direction, composition, and font character remain separate controls.

### Typography as a physical image element

**Use:**
- Typography → define exact title content
- Form → subject type Typography; choose Inflated Letterforms + Type Fold/Inflate
- Texture → target typographic entity with chrome or translucent resin

**Why it works:** Typography owns the text; Form owns its geometry; Texture owns its physical surface.

---

**Next:** [Effects →](./Effects.md)