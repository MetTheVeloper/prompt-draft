# Layout

[← Modules](./Modules.md)

## How this module thinks

Layout thinks in **regions and information architecture**, not camera crops. Framing asks how a subject is framed; Layout asks how the canvas is divided and what kind of content belongs where.

This makes Layout especially useful for posters, covers, banners, cards, social graphics, editorial pages, product sheets, and any image that needs multiple purposeful areas.

## Preset templates

- Full Bleed
- Split Vertical
- Split Horizontal
- Side Panel
- Bottom Panel
- Modular Grid
- Feature + Support
- Centered Stack
- Layered Overlap

A template gives you region geometry as a starting point. You can continue editing the regions afterward.

## Fields

### Layout Type

- Poster
- Banner
- Business Card
- Social Post
- Cover
- Editorial Page
- Collage
- Comic Page
- Product Sheet
- Presentation Slide
- Custom

**Custom:** yes. Use it when the artifact type itself is not in the catalog.

### Density

- Sparse
- Balanced
- Dense
- Maximal

Density describes how much visual/information content the overall layout should carry.

### Regions

The visual Region editor lets you define areas on the canvas. A region can be named and given a role/content relationship, creating semantic anchors that other systems—especially Typography—can use.

A region is more useful than saying “some text on the left” because it becomes a stable named part of the design.

### Extra Details

Adds structured-layout guidance that does not need its own field.

### Full Custom Override

Available. It replaces the generated Layout description.

## Layout vs. Framing

- **Layout:** “The left 35% is a title panel; the right 65% is the image area.”
- **Framing:** “The subject is shown three-quarter, slightly off-center, with safe margin around the silhouette.”

They can work together without doing the same job.

## Recipes

### Fashion campaign with title rail

**Goal:** a vertical fashion poster with image dominance and a narrow information column.

**Use:**
- Preset → Side Panel
- Layout Type → Poster
- Density → Sparse
- Rename main region → `hero image`
- Rename side region → `title and credits`
- Typography → target text group to the title region

**Why it works:** spatial responsibilities are explicit before typography and image content compete for room.

### Experimental album cover

**Goal:** three overlapping image fragments with text sitting above them.

**Use:**
- Preset → Layered Overlap
- Layout Type → Cover
- Density → Dense
- Edit region layers/positions
- Extra Details → “allow deliberate overlap and edge tension between image regions”

**Why it works:** the unusual composition stays structured without needing a full Layout override.

---

**Next:** [Style →](./Style.md)