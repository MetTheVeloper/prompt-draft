# Hair

[← Modules](./Modules.md)

## How this module thinks

Hair is a small **hairstyle designer**, not a single style dropdown. A hairstyle has base properties, optional components such as bangs or braids, and semantic identity that other modules can target with color or material.

A hairstyle can also be **Defined** directly or **Reference-based** when you want to borrow hair from a named reference while still adding hints.

## Base hair properties

The base properties below support **Custom** values. They also support **Reference** where the designer exposes reference inheritance.

### Length — **Custom + Reference supported**

- Shaved
- Buzz
- Very Short
- Short
- Chin Length
- Shoulder Length
- Mid-Back
- Waist Length
- Hip Length
- Very Long

### Cut / Base Shape — **Custom + Reference supported**

- Natural
- Blunt
- Layered
- Bob
- Lob
- Pixie
- Shag
- Wolf Cut
- Mullet
- Undercut
- Fade
- Taper
- Mohawk
- Pompadour

### Curl Pattern — **Custom + Reference supported**

- Straight
- Loose Waves
- Wavy
- Curly
- Tight Curls
- Coily

### Volume — **Custom + Reference supported**

- Flat
- Low
- Natural
- Full
- Voluminous
- Extreme

### Parting — **Custom + Reference supported**

- Center
- Side
- Deep Side
- Off-Center
- Zigzag
- No Visible Part

### Hair Silhouette — **Custom + Reference supported**

- Compact
- Rounded
- Elongated
- Wide
- Top-Heavy
- Asymmetric
- Sculptural

### Styling State — **Custom + Reference supported**

- Natural
- Controlled
- Sleek
- Messy
- Tousled
- Windblown
- Wet-Styled
- Sculpted

## Hair components

### Component Type

- Bangs / Fringe
- Ponytail
- Bun / Updo
- Braid
- Twist
- Locs
- Face-Framing Strands
- Shaved Section
- Hair Accessory
- Custom Hair Component

The property dropdowns shown inside a component depend on its type.

### Bangs Style — **Custom supported**

- Blunt
- Wispy
- Curtain
- Side-Swept
- Micro
- Bottleneck
- Curly
- Choppy

### Placement — **Custom supported**

- High
- Mid
- Low
- Side
- Crown
- Back
- Nape
- Temple

### Count / Repetition — **Custom supported**

- Single
- Twin
- Double
- Multiple

### Tension — **Custom supported**

- Tight
- Controlled
- Relaxed
- Loose

### Bun Construction — **Custom supported**

- Classic
- Top Knot
- Chignon
- Messy
- Sleek
- Braided
- Space Bun

### Braid Type — **Custom supported**

- Classic
- French
- Dutch
- Fishtail
- Rope
- Box
- Cornrow
- Waterfall

### Thickness — **Custom supported**

- Fine
- Medium
- Thick
- Chunky

### Twist Type — **Custom supported**

- Two-Strand
- Rope
- Flat
- Spring

### Strand Length — **Custom supported**

- Short
- Cheek
- Jaw
- Shoulder
- Long

### Shaved Placement — **Custom supported**

- One Side
- Both Sides
- Temples
- Nape
- Partial

### Shaved Design — **Custom + Absent supported**

- Clean
- Line
- Geometric
- Patterned
- Absent / no shaved design

### Hair Accessory Type — **Custom supported**

- Hair Tie
- Scrunchie
- Clip
- Pin
- Barrette
- Ribbon
- Beads
- Cuffs
- Decorative Comb
- Flower

### Accessory Arrangement — **Custom supported**

- Single
- Paired
- Multiple
- Scattered
- Integrated into the hairstyle

## Component starters

The designer also provides quick starters such as Curtain Bangs, Wispy Bangs, High/Low Ponytail, Messy Bun, Space Buns, Fishtail Braid, Box Braids, and Cornrows. A starter only creates a structured component; you can continue editing it.

## Targets and downstream wiring

Hair styles/components expose semantic targets with **Color** and **Material** capabilities. That means another module can say “make the braid silver” or “assign translucent resin to the hair accessory” without applying the same property to the whole character.

## Additional Details

Available for the hairstyle and individual components where appropriate.

## Full Custom Override

Available at module level.

## Recipes

### Reference hair, redesigned accessory

**Goal:** preserve the hairstyle from an input reference but replace the accessory.

**Use:**
- Hair source → Reference
- Reference → selected image/reference variable
- Add Hair Accessory component
- Accessory Type → Custom: “wide translucent acrylic crescent clip”
- Placement → Back
- Material → target the accessory with clear acrylic/resin

**Why it works:** the reference owns the hairstyle while the new component remains independently editable and targetable.

### Sculptural braided character

**Use:**
- Length → Waist Length
- Curl Pattern → Custom: “tight structured wave at the roots”
- Silhouette → Sculptural
- Add Braid → Dutch
- Count → Multiple
- Thickness → Chunky
- Tension → Controlled
- Additional Details → “braids fan outward into a radial crown”

**Why it works:** preset properties establish believable hair grammar before the custom silhouette pushes it into art direction.

### Two-material hair design

**Use:**
- Base hair → Sleek + sculpted
- Add Bangs and Hair Accessory as separate components
- Texture → assign satin-like material to base hair, polished metal to accessory
- Color Palette → assign different scoped colors to accessory vs. hair

**Why it works:** Hair produces semantic parts other modules can address instead of treating “hair” as one global blob.

---

**Next:** [Outfit →](./Outfit.md)