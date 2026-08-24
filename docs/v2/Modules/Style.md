# Style

[← Modules](./Modules.md)

## How this module thinks

Style decides **what visual language the image speaks**. It does not decide the physical material of every object, the camera lens, or the lighting rig. Instead it defines the aesthetic family, medium, line behavior, rendering treatment, level of stylization, detail, and finish.

A useful analogy: Style is the art director. Texture is the material artist; Camera is the photographer; Lighting is the gaffer.

## Presets

- Soft 3D Cartoon
- Premium Vinyl
- Handmade Clay
- Cinematic Realism
- Geometric Flat
- Retro Comic Pop
- Expressive Caricature Ink
- Handmade Cut Paper
- Angular 2D
- Naive Childlike
- Watercolor Ink
- Crafted Paper Collage
- Low Poly
- Pixel Art
- Risograph Graphic
- Expressive Ink Sketch
- Cinematic CGI
- Photo Realism
- Papier-Mâché
- Plush Textile
- Woodcut Graphic
- Marker Illustration
- Art Deco Graphic
- Bauhaus Graphic
- Mid-Century Graphic
- Storybook Watercolor
- Ukiyo-e Print

Presets are editable starting recipes, not locked modes.

## Fields and options

### Aesthetic — **Custom supported**

- 3D Cartoon
- Anime
- Cinematic Realism
- Claymation
- Vinyl Toy
- Geometric Illustration
- Cut Paper
- Retro Comic
- Caricature Sketch
- Angular 2D Animation
- Childlike Drawing
- Low Poly
- Watercolor Illustration
- Paper Collage
- Pixel Art
- Risograph
- Ink Sketch
- Cinematic CGI
- Photo Realism
- Papier-Mâché
- Plush Textile
- Woodcut
- Marker Illustration
- Art Deco
- Art Nouveau
- Bauhaus
- Swiss International Style
- Mid-Century Modern
- Constructivist
- Memphis
- Retro Futurist
- Brutalist Graphic
- Minimal Geometric
- Pop Art
- Op Art
- Psychedelic
- Surrealist
- Cubist
- Expressionist
- Impressionist
- Fauvist
- Pointillist
- Ukiyo-e
- Folk Art
- Storybook
- Gothic Illustration
- Vintage Scientific Illustration
- Screen-Print Graphic
- Linocut
- Etching
- Custom

### Medium — **Custom supported**

**Digital / CG**
- Digital Illustration
- Digital Painting
- Vector Illustration
- 3D Render
- CGI
- Low-Poly 3D Render
- Digital Pixel Art

**Drawing**
- Pencil Drawing
- Colored Pencil Drawing
- Charcoal Drawing
- Ink Drawing
- Pen and Ink
- Marker Render
- Pastel Drawing

**Painting**
- Watercolor Painting
- Gouache Painting
- Oil Painting
- Acrylic Painting
- Ink and Wash

**Printmaking**
- Screen Print
- Risograph Print
- Linocut Print
- Woodcut Print
- Woodblock Print
- Etching Print

**Photography**
- Photography
- Photomontage

**Paper / Craft**
- Paper Cutout
- Paper Collage
- Mixed-Media Collage
- Paper Craft
- Origami Art

**Sculpture / Object**
- Clay Modeling
- Ceramic Art
- Plasticine Modeling
- Papier-Mâché Craft
- Handmade Model

**Textile / Handmade**
- Textile Craft
- Felt Craft
- Plush Textile Craft
- Stitched Textile Art

- Custom

### Stylization Level

- Subtle
- Controlled
- Strong
- Extreme
- Abstract

No field-level Custom entry. Use the nearest intensity and refine another axis/Extra Details if needed.

### Linework — **Custom supported**

- Clean Fine
- Clean Contour
- Bold Contour
- Expressive Ink
- Loose Sketch
- Calligraphic
- Technical
- Engraved Hatch
- Relief Cut
- Custom

### Visual Treatment — **Custom supported**

- Cel Shaded
- Flat Graphic
- Ink + Watercolor
- Halftone Comic
- Painterly
- Paper Cutout
- Layered Collage
- Soft Blended
- Stippled
- Custom

### Detail Level

- Minimal
- Simplified
- Balanced
- Intricate
- Dense

### Finish — **Custom supported**

- Clean
- Refined
- Handcrafted
- Rough
- Matte
- Satin
- Glossy
- Custom

### Extra Details

Use for style-specific nuance that does not belong to one axis.

### Full Custom Override

Available. It replaces the entire generated Style description. Prefer field-level Custom when only Aesthetic, Medium, Linework, Visual Treatment, or Finish needs an uncommon value.

## Recipes

### Scientific illustration printed on translucent film

**Goal:** something that feels like a vintage anatomy plate, but printed with a modern physical process.

**Use:**
- Aesthetic → Vintage Scientific Illustration
- Medium → **Custom:** “UV-printed translucent acetate with slight registration drift”
- Linework → Engraved Hatch
- Detail Level → Intricate
- Finish → **Custom:** “slightly imperfect exhibition-print finish”

**Why it works:** the catalog establishes a stable visual family while two custom axes introduce the uncommon production method without replacing the whole module.

### Soft toy photography without losing photographic language

**Use:**
- Aesthetic → Plush Textile
- Medium → Photography
- Stylization → Controlled
- Finish → Handcrafted
- Texture module → assign actual plush/felt material separately

**Why it works:** Style says “how the image looks”; Texture says “what the object is made from.”

### Brutalist children’s book

**Use:**
- Aesthetic → Brutalist Graphic
- Medium → Gouache Painting
- Linework → Custom: “awkward thick dry-brush contour lines”
- Visual Treatment → Flat Graphic
- Detail → Simplified

**Why it works:** seemingly contradictory presets become a deliberate new language when each axis has a clear job.

---

**Next:** [Form →](./Form.md)