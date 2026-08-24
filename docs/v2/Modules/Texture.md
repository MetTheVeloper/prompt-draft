# Texture / Material

[← Modules](./Modules.md)

## How this module thinks

Texture is the **material assignment and surface-behavior system**. It answers questions such as:

- What is this target made from?
- How is the surface finished?
- Is it smooth, woven, brushed, rough, or porous?
- Does light pass through it?
- How visible should surface texture be?
- Is it clean, handmade, scratched, weathered, cracked, or corroded?

Most importantly, Material Assignments can be **targeted**. The jacket can be leather while the boots are chrome and the hair accessory is acrylic—without making the entire image “metallic.”

## Material presets

- Smooth Vinyl
- Handmade Clay
- Brushed Aluminum
- Polished Metal
- Clear Glass
- Frosted Glass
- Clean Porcelain
- Weathered Leather
- Woven Cotton
- Aged Wood
- Polished Marble
- Matte Rubber

## Fields inside a Material Assignment

### Material — **Custom supported**

**Vinyl / Plastic**
- Plastic
- Vinyl
- PVC
- Acrylic Plastic
- Resin
- Silicone

**Clay / Ceramic**
- Clay
- Terracotta
- Porcelain
- Stoneware
- Earthenware

**Metal**
- Metal
- Steel
- Stainless Steel
- Iron
- Aluminum
- Copper
- Brass
- Bronze
- Silver
- Gold
- Titanium
- Chrome

**Wood**
- Oak
- Walnut
- Maple
- Pine
- Birch
- Cedar
- Mahogany
- Bamboo

**Stone / Mineral**
- Marble
- Granite
- Limestone
- Sandstone
- Slate
- Concrete

**Glass / Crystal**
- Glass
- Crystal
- Quartz

**Fabric / Textile**
- Cotton
- Linen
- Silk
- Velvet
- Wool
- Denim
- Felt
- Canvas
- Plush
- Lace

**Leather / Hide**
- Leather
- Suede
- Faux Leather

**Paper / Cardboard**
- Paper
- Cardboard
- Kraft Paper
- Parchment

**Rubber**
- Rubber
- Latex
- Neoprene

**Organic / Natural**
- Bone
- Ivory-Like Material
- Shell
- Coral
- Wax

- Custom

### Finish — **Custom supported**

- Matte
- Satin
- Semi-Gloss
- Glossy
- High Gloss
- Mirror-Like Polished
- Custom

### Surface Texture — **Custom supported**

- Smooth
- Brushed
- Rough
- Porous
- Grainy
- Fibrous
- Woven
- Hammered
- Ridged
- Visible Brush Marks
- Coarse
- Custom

### Optical Character — **Custom supported**

- Opaque
- Translucent
- Transparent
- Frosted
- Custom

### Texture Prominence

- Subtle
- Visible
- Pronounced

No field-level Custom entry. Choose the closest prominence and describe unusual behavior in assignment details.

### Conditions — multi-select, **Custom supported**

- Clean
- Handmade
- Scratches
- Cracks
- Dents
- Chips
- Dust
- Weathered
- Stains
- Fading
- Wrinkles
- Peeling
- Corrosion
- Custom

### Additional Details

For assignment-specific material behavior outside the catalog.

### Targets

Choose which semantic subject/entity receives this material assignment.

### Exceptions

Where the assignment editor exposes exclusions, use them to keep a broad target from affecting a specific sub-part.

## Compatibility hints

Texture understands common material relationships and can hint when combinations are unusual:

- woven texture on glass
- mirror finish on fabric
- transparent optical behavior on opaque stone
- corrosion on non-metal materials

These are **hints, not creative police**. If the idea is deliberately surreal, the combination can still be useful.

## Image-reference conflict

If Image Reference Settings says **Preserve Materials** while Texture changes those materials, validation can surface the contradiction.

## Full Custom Override

Available at module level.

## Recipes

### Porcelain person with metallic hair accessory

**Assignment 1**
- Target → person/body
- Material → Porcelain
- Finish → Glossy
- Surface → Smooth
- Optical → Opaque
- Condition → Clean

**Assignment 2**
- Target → hair accessory
- Material → Chrome
- Finish → Mirror
- Surface → Smooth

**Why it works:** one character can contain several material systems because assignments are scoped.

### Handmade cardboard city

**Use:**
- Target → scene/environment
- Material → Cardboard
- Finish → Matte
- Surface → Fibrous
- Prominence → Visible
- Conditions → Handmade + Creases via Custom condition/detail
- Extra → “visible cut edges, glue seams, and slight layer misalignment”

**Why it works:** catalog values establish material plausibility while a custom condition/detail supplies the handcrafted signature.

### Impossible translucent stone

**Use:**
- Material → Marble
- Finish → Satin
- Optical Character → Custom: “milky translucent stone that glows through thin edges”
- Surface → Smooth
- Prominence → Subtle

**Why it works:** instead of replacing the module, one deliberately impossible optical axis bends the material logic while the remaining material description stays coherent.

---

**Back to:** [Modules](./Modules.md)