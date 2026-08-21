import type {
  HairComponentStarter,
  HairComponentTypeDefinition,
  HairPresetRecipe,
  HairPropertyDefinition,
} from "./hair.types";

function option(value: string, promptText?: string) {
  return { value, promptText: promptText || value.replace(/_/g, " ") };
}

function state(value: string) {
  return { mode: "option" as const, value };
}

export const hairPropertyDefinitions: Record<string, HairPropertyDefinition> = {
  length: {
    id: "length",
    label: "Length",
    nature: "intrinsic",
    options: [
      option("shaved", "shaved"),
      option("buzz", "buzz-length"),
      option("very_short", "very short"),
      option("short", "short"),
      option("chin_length", "chin-length"),
      option("shoulder_length", "shoulder-length"),
      option("mid_back", "mid-back length"),
      option("waist_length", "waist-length"),
      option("hip_length", "hip-length"),
      option("very_long", "very long"),
    ],
    allowCustom: true,
    allowReference: true,
    compilePlacement: "modifier",
    order: 10,
  },

  cutStyle: {
    id: "cutStyle",
    label: "Cut / Base Shape",
    nature: "intrinsic",
    options: [
      option("natural", "natural-cut"),
      option("blunt", "blunt-cut"),
      option("layered", "layered"),
      option("bob", "bob-cut"),
      option("lob", "long-bob"),
      option("pixie", "pixie-cut"),
      option("shag", "shag-cut"),
      option("wolf", "wolf-cut"),
      option("mullet", "mullet-cut"),
      option("undercut", "undercut"),
      option("fade", "fade-cut"),
      option("taper", "tapered-cut"),
      option("mohawk", "mohawk"),
      option("pompadour", "pompadour"),
    ],
    allowCustom: true,
    allowReference: true,
    compilePlacement: "modifier",
    order: 20,
  },

  curlPattern: {
    id: "curlPattern",
    label: "Curl Pattern",
    nature: "intrinsic",
    options: [
      option("straight", "straight"),
      option("loose_waves", "loosely waved"),
      option("wavy", "wavy"),
      option("curly", "curly"),
      option("tight_curls", "tightly curled"),
      option("coily", "coily"),
    ],
    allowCustom: true,
    allowReference: true,
    compilePlacement: "modifier",
    order: 30,
  },

  volume: {
    id: "volume",
    label: "Volume",
    nature: "intrinsic",
    options: [
      option("flat", "flat volume"),
      option("low", "low volume"),
      option("natural", "natural volume"),
      option("full", "full volume"),
      option("voluminous", "voluminous"),
      option("extreme", "extreme volume"),
    ],
    allowCustom: true,
    allowReference: true,
    compilePlacement: "detail",
    order: 40,
  },

  parting: {
    id: "parting",
    label: "Parting",
    nature: "intrinsic",
    options: [
      option("center", "center part"),
      option("side", "side part"),
      option("deep_side", "deep side part"),
      option("off_center", "off-center part"),
      option("zigzag", "zigzag part"),
      option("no_visible_part", "no visible part"),
    ],
    allowCustom: true,
    allowReference: true,
    compilePlacement: "detail",
    order: 50,
  },

  silhouette: {
    id: "silhouette",
    label: "Hair Silhouette",
    nature: "intrinsic",
    options: [
      option("compact", "compact silhouette"),
      option("rounded", "rounded silhouette"),
      option("elongated", "elongated silhouette"),
      option("wide", "wide silhouette"),
      option("top_heavy", "top-heavy silhouette"),
      option("asymmetric", "asymmetric silhouette"),
      option("sculptural", "sculptural hair silhouette"),
    ],
    allowCustom: true,
    allowReference: true,
    compilePlacement: "detail",
    order: 60,
  },

  stylingState: {
    id: "stylingState",
    label: "Styling State",
    nature: "intrinsic",
    options: [
      option("natural", "naturally styled"),
      option("sleek", "sleekly styled"),
      option("messy", "messy styling"),
      option("tousled", "tousled styling"),
      option("windblown", "windblown styling"),
      option("wet_styled", "wet-styled grouping"),
      option("sculpted", "sculpted styling"),
    ],
    allowCustom: true,
    allowReference: true,
    compilePlacement: "detail",
    order: 70,
  },

  bangsStyle: {
    id: "bangsStyle",
    label: "Bangs Style",
    nature: "intrinsic",
    options: [
      option("blunt", "blunt"),
      option("wispy", "wispy"),
      option("curtain", "curtain"),
      option("side_swept", "side-swept"),
      option("micro", "micro"),
      option("bottleneck", "bottleneck"),
      option("curly", "curly"),
      option("choppy", "choppy"),
    ],
    allowCustom: true,
    compilePlacement: "modifier",
    order: 100,
  },

  placement: {
    id: "placement",
    label: "Placement",
    nature: "intrinsic",
    options: [
      option("high", "high"),
      option("mid", "mid-height"),
      option("low", "low"),
      option("side", "side-positioned"),
      option("crown", "at the crown"),
      option("back", "at the back"),
      option("nape", "at the nape"),
      option("temple", "at the temple"),
    ],
    allowCustom: true,
    compilePlacement: "modifier",
    order: 110,
  },

  count: {
    id: "count",
    label: "Count / Repetition",
    nature: "intrinsic",
    options: [
      option("single", "single"),
      option("twin", "twin"),
      option("double", "double"),
      option("multiple", "multiple"),
    ],
    allowCustom: true,
    compilePlacement: "modifier",
    order: 120,
  },

  tension: {
    id: "tension",
    label: "Tension",
    nature: "intrinsic",
    options: [
      option("tight", "tightly gathered"),
      option("controlled", "controlled"),
      option("relaxed", "relaxed"),
      option("loose", "loosely gathered"),
    ],
    allowCustom: true,
    compilePlacement: "detail",
    order: 130,
  },

  bunStyle: {
    id: "bunStyle",
    label: "Bun Construction",
    nature: "intrinsic",
    options: [
      option("classic", "classic"),
      option("top_knot", "top-knot"),
      option("chignon", "chignon"),
      option("messy", "messy"),
      option("sleek", "sleek"),
      option("braided", "braided"),
      option("space_bun", "space-bun"),
    ],
    allowCustom: true,
    compilePlacement: "modifier",
    order: 140,
  },

  braidType: {
    id: "braidType",
    label: "Braid Type",
    nature: "intrinsic",
    options: [
      option("classic", "classic"),
      option("french", "French"),
      option("dutch", "Dutch"),
      option("fishtail", "fishtail"),
      option("rope", "rope"),
      option("box", "box"),
      option("cornrow", "cornrow"),
      option("waterfall", "waterfall"),
    ],
    allowCustom: true,
    compilePlacement: "modifier",
    order: 150,
  },

  thickness: {
    id: "thickness",
    label: "Thickness",
    nature: "intrinsic",
    options: [
      option("fine", "fine"),
      option("medium", "medium-thickness"),
      option("thick", "thick"),
      option("chunky", "chunky"),
    ],
    allowCustom: true,
    compilePlacement: "modifier",
    order: 160,
  },

  twistType: {
    id: "twistType",
    label: "Twist Type",
    nature: "intrinsic",
    options: [
      option("two_strand", "two-strand"),
      option("rope", "rope"),
      option("flat", "flat"),
      option("spring", "spring"),
    ],
    allowCustom: true,
    compilePlacement: "modifier",
    order: 170,
  },

  strandLength: {
    id: "strandLength",
    label: "Strand Length",
    nature: "intrinsic",
    options: [
      option("short", "short"),
      option("cheek", "cheek-length"),
      option("jaw", "jaw-length"),
      option("shoulder", "shoulder-length"),
      option("long", "long"),
    ],
    allowCustom: true,
    compilePlacement: "modifier",
    order: 180,
  },

  shavedPlacement: {
    id: "shavedPlacement",
    label: "Shaved Placement",
    nature: "intrinsic",
    options: [
      option("one_side", "one-side"),
      option("both_sides", "both-side"),
      option("temples", "temple"),
      option("nape", "nape"),
      option("partial", "partial"),
    ],
    allowCustom: true,
    compilePlacement: "modifier",
    order: 190,
  },

  shavedDesign: {
    id: "shavedDesign",
    label: "Shaved Design",
    nature: "optional",
    options: [
      option("clean", "clean"),
      option("line", "line-design"),
      option("geometric", "geometric-design"),
      option("patterned", "patterned"),
    ],
    allowCustom: true,
    allowAbsent: true,
    absentPromptText: "without a shaved design",
    compilePlacement: "detail",
    order: 200,
  },

  accessoryType: {
    id: "accessoryType",
    label: "Hair Accessory Type",
    nature: "intrinsic",
    options: [
      option("hair_tie", "hair tie"),
      option("scrunchie", "scrunchie"),
      option("clip", "hair clip"),
      option("pin", "hair pin"),
      option("barrette", "barrette"),
      option("ribbon", "ribbon"),
      option("beads", "hair beads"),
      option("cuffs", "hair cuffs"),
      option("comb", "decorative hair comb"),
      option("flower", "flower ornament"),
    ],
    allowCustom: true,
    compilePlacement: "modifier",
    order: 210,
  },

  accessoryArrangement: {
    id: "accessoryArrangement",
    label: "Accessory Arrangement",
    nature: "intrinsic",
    options: [
      option("single", "single"),
      option("paired", "paired"),
      option("multiple", "multiple"),
      option("scattered", "scattered"),
      option("integrated", "integrated into the hairstyle"),
    ],
    allowCustom: true,
    compilePlacement: "detail",
    order: 220,
  },
};

export const hairBasePropertyIds = [
  "length",
  "cutStyle",
  "curlPattern",
  "volume",
  "parting",
  "silhouette",
  "stylingState",
];

export const hairComponentTypes: HairComponentTypeDefinition[] = [
  {
    value: "bangs",
    label: "Bangs / Fringe",
    promptText: "bangs",
    propertyIds: ["bangsStyle"],
    semanticCapabilities: ["color", "material"],
    tags: ["front", "fringe"],
  },
  {
    value: "ponytail",
    label: "Ponytail",
    promptText: "ponytail",
    propertyIds: ["placement", "count", "tension"],
    semanticCapabilities: ["color", "material"],
  },
  {
    value: "bun",
    label: "Bun / Updo",
    promptText: "bun",
    propertyIds: ["bunStyle", "placement", "count", "tension"],
    semanticCapabilities: ["color", "material"],
  },
  {
    value: "braid",
    label: "Braid",
    promptText: "braid",
    propertyIds: ["braidType", "placement", "count", "thickness", "tension"],
    semanticCapabilities: ["color", "material"],
  },
  {
    value: "twist",
    label: "Twist",
    promptText: "hair twist",
    propertyIds: ["twistType", "placement", "count", "thickness", "tension"],
    semanticCapabilities: ["color", "material"],
  },
  {
    value: "locs",
    label: "Locs",
    promptText: "locs",
    propertyIds: ["thickness", "count", "placement"],
    semanticCapabilities: ["color", "material"],
  },
  {
    value: "face_framing_strands",
    label: "Face-Framing Strands",
    promptText: "face-framing strands",
    propertyIds: ["strandLength", "count", "tension"],
    semanticCapabilities: ["color", "material"],
  },
  {
    value: "shaved_section",
    label: "Shaved Section",
    promptText: "shaved section",
    propertyIds: ["shavedPlacement", "shavedDesign"],
    semanticCapabilities: ["color", "material"],
  },
  {
    value: "hair_accessory",
    label: "Hair Accessory",
    promptText: "hair accessory",
    propertyIds: ["accessoryType", "placement", "accessoryArrangement"],
    semanticCapabilities: ["color", "material"],
    tags: ["hair-only", "ornament"],
  },
  {
    value: "custom",
    label: "Custom Hair Component",
    promptText: "custom hair component",
    propertyIds: [],
    semanticCapabilities: ["color", "material"],
  },
];

export const hairComponentTypeMap = new Map(
  hairComponentTypes.map((item) => [item.value, item]),
);

export const hairComponentStarters: HairComponentStarter[] = [
  {
    id: "curtain_bangs",
    label: "Curtain Bangs",
    type: "bangs",
    properties: { bangsStyle: state("curtain") },
  },
  {
    id: "wispy_bangs",
    label: "Wispy Bangs",
    type: "bangs",
    properties: { bangsStyle: state("wispy") },
  },
  {
    id: "high_ponytail",
    label: "High Ponytail",
    type: "ponytail",
    properties: { placement: state("high"), count: state("single") },
  },
  {
    id: "low_ponytail",
    label: "Low Ponytail",
    type: "ponytail",
    properties: { placement: state("low"), count: state("single") },
  },
  {
    id: "messy_bun",
    label: "Messy Bun",
    type: "bun",
    properties: { bunStyle: state("messy"), placement: state("high") },
  },
  {
    id: "space_buns",
    label: "Space Buns",
    type: "bun",
    properties: { bunStyle: state("space_bun"), count: state("twin"), placement: state("high") },
  },
  {
    id: "fishtail_braid",
    label: "Fishtail Braid",
    type: "braid",
    properties: { braidType: state("fishtail"), count: state("single") },
  },
  {
    id: "box_braids",
    label: "Box Braids",
    type: "braid",
    properties: { braidType: state("box"), count: state("multiple") },
  },
  {
    id: "cornrows",
    label: "Cornrows",
    type: "braid",
    properties: { braidType: state("cornrow"), count: state("multiple") },
  },
  {
    id: "face_framing",
    label: "Face-Framing Strands",
    type: "face_framing_strands",
    properties: { strandLength: state("jaw"), count: state("twin") },
  },
  {
    id: "hair_ribbon",
    label: "Hair Ribbon",
    type: "hair_accessory",
    properties: { accessoryType: state("ribbon"), accessoryArrangement: state("single") },
  },
  {
    id: "braid_beads",
    label: "Braid Beads",
    type: "hair_accessory",
    properties: { accessoryType: state("beads"), accessoryArrangement: state("integrated") },
  },
];

export const hairComponentStarterMap = new Map(
  hairComponentStarters.map((item) => [item.id, item]),
);

export const hairPresetRecipes: HairPresetRecipe[] = [
  {
    id: "natural_waves",
    label: "Natural Waves",
    category: "everyday",
    categoryLabel: "Everyday",
    name: "Natural Waves",
    properties: {
      length: state("shoulder_length"),
      curlPattern: state("wavy"),
      volume: state("natural"),
      stylingState: state("natural"),
    },
  },
  {
    id: "long_layers",
    label: "Long Layers",
    category: "everyday",
    categoryLabel: "Everyday",
    name: "Long Layers",
    properties: {
      length: state("mid_back"),
      cutStyle: state("layered"),
      curlPattern: state("loose_waves"),
      volume: state("natural"),
    },
    components: [
      { key: "faceFraming", type: "face_framing_strands", properties: { strandLength: state("jaw"), count: state("twin") } },
    ],
  },
  {
    id: "sleek_bob",
    label: "Sleek Bob",
    category: "cuts",
    categoryLabel: "Cuts",
    name: "Sleek Bob",
    properties: {
      length: state("chin_length"),
      cutStyle: state("bob"),
      curlPattern: state("straight"),
      stylingState: state("sleek"),
      silhouette: state("compact"),
    },
  },
  {
    id: "pixie_cut",
    label: "Pixie Cut",
    category: "cuts",
    categoryLabel: "Cuts",
    name: "Pixie Cut",
    properties: {
      length: state("very_short"),
      cutStyle: state("pixie"),
      silhouette: state("compact"),
    },
  },
  {
    id: "curly_volume",
    label: "Curly Volume",
    category: "texture_shape",
    categoryLabel: "Curl / Shape",
    name: "Curly Volume",
    properties: {
      length: state("shoulder_length"),
      curlPattern: state("curly"),
      volume: state("voluminous"),
      silhouette: state("rounded"),
    },
  },
  {
    id: "coily_round",
    label: "Coily Rounded Shape",
    category: "texture_shape",
    categoryLabel: "Curl / Shape",
    name: "Coily Rounded Shape",
    properties: {
      length: state("short"),
      curlPattern: state("coily"),
      volume: state("full"),
      silhouette: state("rounded"),
    },
  },
  {
    id: "high_ponytail",
    label: "High Ponytail",
    category: "tied",
    categoryLabel: "Tied / Updo",
    name: "High Ponytail",
    properties: {
      length: state("mid_back"),
      stylingState: state("sleek"),
    },
    components: [
      { key: "ponytail", type: "ponytail", properties: { placement: state("high"), count: state("single"), tension: state("controlled") } },
    ],
  },
  {
    id: "messy_bun",
    label: "Messy Bun",
    category: "tied",
    categoryLabel: "Tied / Updo",
    name: "Messy Bun",
    properties: {
      stylingState: state("messy"),
      volume: state("full"),
    },
    components: [
      { key: "bun", type: "bun", properties: { bunStyle: state("messy"), placement: state("high"), tension: state("loose") } },
      { key: "faceFraming", type: "face_framing_strands", properties: { strandLength: state("jaw"), count: state("twin") } },
    ],
  },
  {
    id: "space_buns",
    label: "Space Buns",
    category: "tied",
    categoryLabel: "Tied / Updo",
    name: "Space Buns",
    properties: { stylingState: state("controlled") },
    components: [
      { key: "buns", type: "bun", properties: { bunStyle: state("space_bun"), placement: state("high"), count: state("twin") } },
    ],
  },
  {
    id: "braided_updo",
    label: "Braided Updo",
    category: "braided",
    categoryLabel: "Braided / Structured",
    name: "Braided Updo",
    properties: { stylingState: state("controlled"), volume: state("full") },
    components: [
      { key: "braid", type: "braid", properties: { braidType: state("dutch"), placement: state("crown"), count: state("single") } },
      { key: "bun", type: "bun", properties: { bunStyle: state("classic"), placement: state("back") } },
    ],
  },
  {
    id: "box_braids",
    label: "Box Braids",
    category: "braided",
    categoryLabel: "Braided / Structured",
    name: "Box Braids",
    properties: { length: state("mid_back"), volume: state("full") },
    components: [
      { key: "braids", type: "braid", properties: { braidType: state("box"), count: state("multiple"), thickness: state("medium") } },
    ],
  },
  {
    id: "locs",
    label: "Locs",
    category: "braided",
    categoryLabel: "Braided / Structured",
    name: "Locs",
    properties: { length: state("shoulder_length"), volume: state("natural") },
    components: [
      { key: "locs", type: "locs", properties: { thickness: state("medium"), count: state("multiple") } },
    ],
  },
  {
    id: "classic_pompadour",
    label: "Classic Pompadour",
    category: "sculpted",
    categoryLabel: "Sculpted / Alternative",
    name: "Classic Pompadour",
    properties: {
      length: state("short"),
      cutStyle: state("pompadour"),
      volume: state("voluminous"),
      silhouette: state("top_heavy"),
      stylingState: state("sculpted"),
    },
  },
  {
    id: "undercut",
    label: "Undercut",
    category: "sculpted",
    categoryLabel: "Sculpted / Alternative",
    name: "Undercut",
    properties: {
      length: state("short"),
      cutStyle: state("undercut"),
      stylingState: state("controlled"),
    },
    components: [
      { key: "shavedSide", type: "shaved_section", properties: { shavedPlacement: state("both_sides"), shavedDesign: state("clean") } },
    ],
  },
  {
    id: "mohawk",
    label: "Mohawk",
    category: "sculpted",
    categoryLabel: "Sculpted / Alternative",
    name: "Mohawk",
    properties: {
      cutStyle: state("mohawk"),
      silhouette: state("top_heavy"),
      stylingState: state("sculpted"),
    },
    components: [
      { key: "shavedSides", type: "shaved_section", properties: { shavedPlacement: state("both_sides") } },
    ],
  },
];

export const hairPresetRecipeMap = new Map(
  hairPresetRecipes.map((item) => [item.id, item]),
);
