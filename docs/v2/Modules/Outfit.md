# Outfit

[← Modules](./Modules.md)

## How this module thinks

Outfit is a **wearable-item designer**, not a single “fashion style” field. An Outfit Set can contain multiple garments and accessories, relationships between them, item-specific construction properties, references, and semantic targets that Color and Material can address later.

A shirt, skirt, boot, necklace, and coat do not need the same controls, so the editor changes the available property fields according to the selected item type.

## Outfit presets

- Casual
- Smart Casual
- Preppy
- Streetwear
- Formal Suit
- Winter Layered
- Evening

Presets build editable Outfit Sets from several items. They are starting recipes, not locked wardrobes.

## Item Type

### Tops

- T-Shirt
- Shirt
- Blouse
- Polo
- Tank Top
- Camisole
- Sweater
- Cardigan
- Sweatshirt
- Hoodie
- Vest
- Tunic
- Jersey

### Bottoms

- Trousers
- Jeans
- Shorts
- Skirt
- Leggings
- Joggers
- Sweatpants
- Skort

### One-Piece

- Dress
- Jumpsuit
- Romper
- Overalls
- Bodysuit

### Outerwear

- Jacket
- Blazer
- Coat
- Trench Coat
- Parka
- Puffer Jacket
- Bomber Jacket
- Cape
- Cloak
- Robe

### Legwear

- Socks
- Tights
- Stockings
- Leg Warmers

### Footwear

- Sneakers
- Boots
- Pumps
- Flats
- Loafers
- Oxford Shoes
- Sandals
- Mules
- Clogs
- Slippers

### Headwear

- Cap
- Hat
- Beanie
- Beret
- Visor

### Neckwear

- Scarf
- Tie
- Bow Tie
- Neckerchief

### Handwear / Waistwear

- Gloves
- Mittens
- Belt
- Waist Bag

### Eyewear

- Glasses
- Sunglasses
- Goggles

### Jewelry

- Necklace
- Earrings
- Bracelet
- Ring
- Anklet
- Brooch
- Choker

### Wearable Accessories

- Watch
- Backpack
- Crossbody Bag
- Shoulder Bag
- Harness
- Suspenders

### Specialty

- Kimono
- Sari
- Hanbok
- Qipao
- Abaya
- Thobe
- Kaftan
- Kilt
- Poncho

### Protective / Costume

- Armor
- Helmet
- Mask
- Apron

Custom item type/category data is also supported when the catalog does not cover the intended wearable.

## Item source

An item can be:

- **Defined** — built from Outfit controls.
- **Reference** — based on a selected reference variable/asset, with an optional item hint.

Individual properties can also inherit, use a catalog option, use a **Custom** value, use a **Reference**, or—when the property is optional—be explicitly absent.

## Item property dropdowns

Only relevant properties appear for each item profile.

### Fit — **Custom + Reference supported**

- Fitted
- Slim
- Regular
- Relaxed
- Loose
- Oversized
- Tailored
- Boxy
- Body-Hugging

### Length — **Custom + Reference supported**

**Upper:** Cropped, Waist, Hip, Longline, Tunic  
**Skirt:** Micro, Mini, Above Knee, Knee, Midi, Maxi, Floor  
**Trouser:** Short, Bermuda, Cropped, Ankle, Full, Floor  
**Dress:** Mini, Above Knee, Knee, Midi, Maxi, Floor  
**Outerwear:** Cropped, Waist, Hip, Mid-Thigh, Knee, Mid-Calf, Full

### Silhouette — **Custom + Reference supported**

**Upper:** Straight, Boxy, Tapered, Flared, Peplum  
**Skirt:** Pencil, A-Line, Straight, Circle, Tulip, Bubble, Mermaid, Tiered, Wrap  
**Dress:** Column, Sheath, A-Line, Fit-and-Flare, Empire, Ball Gown, Mermaid, Tent, Shift, Wrap  
**Outerwear:** Straight, Boxy, Tailored, Cocoon, Trapeze, Flared

### Sleeve Length — **Custom + Reference supported**

- Sleeveless
- Cap
- Short
- Elbow
- Three-Quarter
- Long
- Extra Long

### Sleeve Shape — **Custom + Reference supported**

- Fitted
- Straight
- Raglan
- Puff
- Balloon
- Bishop
- Bell
- Flutter
- Kimono
- Batwing

### Neckline — **Custom + Reference supported**

- Crew
- Round
- V-Neck
- Deep V
- Scoop
- Square
- Sweetheart
- Boat
- Halter
- Off-Shoulder
- One-Shoulder
- High Neck
- Turtleneck
- Mock Neck
- Plunging

### Collar — **Custom + Reference + Absent supported**

- Point
- Spread
- Button-Down
- Mandarin
- Peter Pan
- Polo
- Sailor
- Shawl
- Funnel
- Absent / collarless

### Closure — **Custom + Reference + Absent supported**

**Garment:** Buttons, Zipper, Snap, Hook-and-Eye, Lace-Up, Tie, Wrap, Drawstring, Pullover, Single-Breasted, Double-Breasted  
**Footwear:** Lace-Up, Zipper, Buckle, Strap, Multiple Straps, Hook-and-Loop, Slip-On

### Hem Shape — **Custom + Reference supported**

- Straight
- Curved
- Rounded
- Asymmetric
- High-Low
- Scalloped
- Split

### Rise — **Custom + Reference supported**

- Low
- Mid
- High
- Ultra High

### Leg Shape — **Custom + Reference supported**

- Skinny
- Slim
- Straight
- Tapered
- Bootcut
- Flared
- Wide
- Barrel
- Palazzo

### Waist Construction — **Custom + Reference supported**

- Elastic
- Drawstring
- Paperbag
- Gathered
- Fitted
- Fold-Over
- Corset
- Wrap

### Pleating — **Custom + Reference + Absent supported**

- Knife
- Box
- Accordion
- Inverted
- Sunray
- Absent / no pleats

### Slit — **Custom + Reference + Absent supported**

- Front
- Back
- Side
- Double Side
- High
- Absent / no slit

### Pockets — multi-select, **Custom + Reference + Absent supported**

- Side
- Patch
- Welt
- Flap
- Cargo
- Kangaroo
- Chest
- Back
- Absent / no pockets

### Hood — **Custom + Reference + Absent supported**

- Fitted
- Oversized
- Detachable
- Absent / no hood

### Lapel — **Custom + Reference + Absent supported**

- Notch
- Peak
- Shawl
- Wide
- Narrow
- Absent / lapel-free

### Surface Pattern — **Custom + Reference + Absent supported**

- Striped
- Plaid
- Checkered
- Gingham
- Polka Dot
- Houndstooth
- Argyle
- Chevron
- Floral
- Geometric
- Paisley
- Camouflage
- Animal Print
- Abstract
- Absent / unpatterned

### Graphic / Motif — **Custom + Reference + Absent supported**

- Logo
- Emblem
- Text
- Character
- Illustration
- Symbol
- Patch
- Absent / no graphic

### Embellishments — multi-select, **Custom + Reference + Absent supported**

- Ruffles
- Frills
- Bows
- Ribbons
- Embroidery
- Sequins
- Beads
- Studs
- Spikes
- Fringe
- Tassels
- Patches
- Lace Trim
- Absent / none

### Toe Shape — **Custom + Reference supported**

- Round
- Almond
- Pointed
- Square
- Open
- Peep

### Heel Height — **Custom + Reference supported**

- Flat
- Low
- Mid
- High
- Very High

### Heel Shape — **Custom + Reference supported**

- Kitten
- Block
- Stiletto
- Wedge
- Cone
- Spool
- Platform

### Platform — **Custom + Reference + Absent supported**

- Low
- Medium
- High
- Absent / no platform sole

### Shaft Height — **Custom + Reference supported**

- Ankle
- Mid-Calf
- Knee
- Over-the-Knee
- Thigh

### Legwear Length — **Custom + Reference supported**

- No-Show
- Ankle
- Crew
- Mid-Calf
- Knee
- Over-the-Knee
- Thigh
- Full

### Accessory Scale — **Custom + Reference supported**

- Delicate
- Small
- Medium
- Large
- Oversized

### Accessory Arrangement — **Custom + Reference supported**

- Single
- Paired
- Layered
- Stacked
- Clustered

## Item relations

Outfit Sets can express relationships between items:

- Over
- Under
- Tucked Into
- Layered With

This is useful when “a shirt and a jacket” is not enough and the layering order matters.

## Targets and downstream wiring

Outfit items expose semantic Color/Material capabilities. Texture can target the boots without changing the trousers; Color Palette can assign a color to the jacket without making the whole character that color.

## Full Custom Override

Available at module level.

## Recipes

### Controlled streetwear, not generic “street fashion”

**Use:**
- Start → Streetwear preset
- Hoodie → Fit: Oversized
- Trousers → Fit: Loose; Pockets: Cargo
- Sneakers → Graphic: Custom “small reflective side insignia”
- Add Harness → Scale: Medium
- Relations → Harness over Hoodie

**Why it works:** the outfit is constructed from independently editable wearable parts.

### Reference dress with redesigned sleeves

**Use:**
- Dress source → Reference
- Sleeve Shape → Custom: “double-layer translucent lantern sleeves with a narrow cuff”
- Sleeve Length → Long
- Collar → Absent
- Additional Details → preserve the reference bodice construction

**Why it works:** reference inheritance handles the garment you already have while one scoped custom property changes only the part you intend.

### Material-mixed costume

**Use:**
- Outfit → Armor + Gloves + Boots + Cape
- Texture → target Armor with brushed aluminum; Gloves with matte leather; Cape with woven velvet
- Color Palette → assign independent colors to each target

**Why it works:** Outfit creates the semantic pieces; Material and Color finish them without global leakage.

---

**Next:** [Background →](./Background.md)