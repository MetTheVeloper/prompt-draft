import type { ModuleFieldOption } from "./types";

type MaterialCategory =
  | "vinyl_plastic"
  | "clay_ceramic"
  | "metal"
  | "wood"
  | "stone_mineral"
  | "glass_crystal"
  | "fabric_textile"
  | "leather_hide"
  | "paper_cardboard"
  | "rubber"
  | "organic_natural";

const categoryLabels: Record<MaterialCategory, string> = {
  vinyl_plastic: "Vinyl / Plastic",
  clay_ceramic: "Clay / Ceramic",
  metal: "Metal",
  wood: "Wood",
  stone_mineral: "Stone / Mineral",
  glass_crystal: "Glass / Crystal",
  fabric_textile: "Fabric / Textile",
  leather_hide: "Leather / Hide",
  paper_cardboard: "Paper / Cardboard",
  rubber: "Rubber",
  organic_natural: "Organic / Natural",
};

function material(
  value: string,
  category: MaterialCategory,
  promptText: string,
  tags: string,
): ModuleFieldOption {
  return {
    value,
    category,
    categoryLabel: categoryLabels[category],
    categoryLabelKey: `modules.texture.categories.${category}`,
    promptText,
    tags: tags.split(" "),
  };
}

export const textureMaterialOptions: ModuleFieldOption[] = [
  material("plastic", "vinyl_plastic", "plastic material", "plastic synthetic rigid opaque smooth-friendly gloss-friendly"),
  material("vinyl", "vinyl_plastic", "vinyl material", "vinyl plastic synthetic rigid opaque smooth-friendly toy-friendly"),
  material("pvc", "vinyl_plastic", "PVC plastic material", "pvc plastic synthetic rigid opaque smooth-friendly industrial"),
  material("acrylic_plastic", "vinyl_plastic", "acrylic plastic material", "acrylic plastic synthetic rigid transparent-friendly translucent-friendly gloss-friendly"),
  material("resin", "vinyl_plastic", "resin material", "resin plastic synthetic rigid transparent-friendly translucent-friendly gloss-friendly sculptural"),
  material("silicone", "vinyl_plastic", "silicone material", "silicone synthetic soft flexible rubbery matte-friendly translucent-friendly"),

  material("clay", "clay_ceramic", "clay material", "clay earth organic rigid opaque porous grainable handmade-friendly"),
  material("terracotta", "clay_ceramic", "terracotta clay material", "terracotta clay ceramic earth rigid opaque porous grainable handmade-friendly"),
  material("porcelain", "clay_ceramic", "porcelain ceramic material", "porcelain ceramic rigid opaque fragile smooth-friendly gloss-friendly"),
  material("stoneware", "clay_ceramic", "stoneware ceramic material", "stoneware ceramic clay rigid opaque porous grainable handmade-friendly"),
  material("earthenware", "clay_ceramic", "earthenware ceramic material", "earthenware ceramic clay earth rigid opaque porous grainable handmade-friendly"),

  material("metal", "metal", "metal material", "metal rigid opaque reflective industrial scratch-friendly corrosion-friendly"),
  material("steel", "metal", "steel material", "steel metal rigid opaque reflective industrial scratch-friendly corrosion-friendly"),
  material("stainless_steel", "metal", "stainless steel material", "stainless-steel metal rigid opaque reflective industrial scratch-friendly clean-friendly"),
  material("iron", "metal", "iron material", "iron metal rigid opaque industrial scratch-friendly corrosion-friendly rust-friendly"),
  material("aluminum", "metal", "aluminum material", "aluminum metal rigid opaque reflective industrial scratch-friendly brushed-friendly"),
  material("copper", "metal", "copper material", "copper metal rigid opaque reflective oxidation-friendly patina-friendly corrosion-friendly"),
  material("brass", "metal", "brass material", "brass metal rigid opaque reflective oxidation-friendly patina-friendly aged-friendly"),
  material("bronze", "metal", "bronze material", "bronze metal rigid opaque reflective oxidation-friendly patina-friendly aged-friendly"),
  material("silver", "metal", "silver material", "silver metal rigid opaque reflective gloss-friendly scratch-friendly"),
  material("gold", "metal", "gold material", "gold metal rigid opaque reflective gloss-friendly luxury-friendly"),
  material("titanium", "metal", "titanium material", "titanium metal rigid opaque reflective industrial scratch-friendly"),
  material("chrome", "metal", "chrome material", "chrome metal rigid opaque mirror-friendly gloss-friendly reflective"),

  material("oak", "wood", "oak wood material", "oak wood organic rigid opaque grainable porous carvable"),
  material("walnut", "wood", "walnut wood material", "walnut wood organic rigid opaque grainable porous carvable"),
  material("maple", "wood", "maple wood material", "maple wood organic rigid opaque grainable smooth-friendly carvable"),
  material("pine", "wood", "pine wood material", "pine wood organic rigid opaque grainable soft-wood carvable"),
  material("birch", "wood", "birch wood material", "birch wood organic rigid opaque grainable smooth-friendly carvable"),
  material("cedar", "wood", "cedar wood material", "cedar wood organic rigid opaque grainable porous carvable"),
  material("mahogany", "wood", "mahogany wood material", "mahogany wood organic rigid opaque grainable polish-friendly luxury-friendly"),
  material("bamboo", "wood", "bamboo material", "bamboo wood organic rigid opaque fibrous grainable natural"),

  material("marble", "stone_mineral", "marble stone material", "marble stone mineral rigid opaque polish-friendly vein-friendly luxury-friendly"),
  material("granite", "stone_mineral", "granite stone material", "granite stone mineral rigid opaque grainable speckled-friendly polish-friendly"),
  material("limestone", "stone_mineral", "limestone material", "limestone stone mineral rigid opaque porous grainable weathered-friendly"),
  material("sandstone", "stone_mineral", "sandstone material", "sandstone stone mineral rigid opaque porous grainable rough-friendly"),
  material("slate", "stone_mineral", "slate stone material", "slate stone mineral rigid opaque layered matte-friendly engrave-friendly"),
  material("concrete", "stone_mineral", "concrete material", "concrete stone mineral industrial rigid opaque porous grainable weathered-friendly"),

  material("glass", "glass_crystal", "glass material", "glass rigid fragile transparent reflective smooth-friendly gloss-friendly"),
  material("crystal", "glass_crystal", "crystal material", "crystal glass rigid fragile transparent reflective gloss-friendly faceted-friendly"),
  material("quartz", "glass_crystal", "quartz crystal material", "quartz crystal mineral rigid fragile translucent grainable faceted-friendly"),

  material("cotton", "fabric_textile", "cotton fabric material", "cotton fabric textile soft flexible woven matte-friendly wrinkle-friendly"),
  material("linen", "fabric_textile", "linen fabric material", "linen fabric textile soft flexible woven fibrous wrinkle-friendly"),
  material("silk", "fabric_textile", "silk fabric material", "silk fabric textile soft flexible smooth-friendly satin-friendly gloss-friendly"),
  material("velvet", "fabric_textile", "velvet fabric material", "velvet fabric textile soft flexible velvety-friendly matte-friendly luxury-friendly"),
  material("wool", "fabric_textile", "wool fabric material", "wool fabric textile soft flexible fibrous woven matte-friendly"),
  material("denim", "fabric_textile", "denim fabric material", "denim fabric textile soft flexible woven rough-friendly worn-friendly"),
  material("felt", "fabric_textile", "felt fabric material", "felt fabric textile soft flexible fibrous matte-friendly"),
  material("canvas", "fabric_textile", "canvas fabric material", "canvas fabric textile soft flexible woven painted-friendly rough-friendly"),
  material("plush", "fabric_textile", "plush fabric material", "plush fabric textile soft flexible toy-friendly fibrous velvety-friendly"),
  material("lace", "fabric_textile", "lace fabric material", "lace fabric textile soft flexible woven delicate pattern-friendly"),

  material("leather", "leather_hide", "leather material", "leather organic soft flexible opaque wrinkle-friendly scratch-friendly worn-friendly"),
  material("suede", "leather_hide", "suede leather material", "suede leather organic soft flexible opaque velvety-friendly matte-friendly"),
  material("faux_leather", "leather_hide", "faux leather material", "faux-leather leather synthetic soft flexible opaque gloss-friendly wrinkle-friendly"),

  material("paper", "paper_cardboard", "paper material", "paper organic thin flexible opaque matte-friendly fibrous wrinkle-friendly"),
  material("cardboard", "paper_cardboard", "cardboard material", "cardboard paper organic rigid opaque fibrous matte-friendly layered"),
  material("kraft_paper", "paper_cardboard", "kraft paper material", "kraft paper organic thin flexible opaque fibrous matte-friendly handmade-friendly"),
  material("parchment", "paper_cardboard", "parchment paper material", "parchment paper organic thin flexible translucent-friendly aged-friendly wrinkle-friendly"),

  material("rubber", "rubber", "rubber material", "rubber synthetic soft flexible opaque matte-friendly rubbery"),
  material("latex", "rubber", "latex rubber material", "latex rubber synthetic soft flexible opaque gloss-friendly stretchy"),
  material("neoprene", "rubber", "neoprene rubber material", "neoprene rubber synthetic soft flexible opaque matte-friendly industrial"),

  material("bone", "organic_natural", "bone material", "bone organic rigid opaque smooth-friendly aged-friendly carvable"),
  material("ivory", "organic_natural", "ivory-like material", "ivory organic rigid opaque smooth-friendly carvable aged-friendly"),
  material("shell", "organic_natural", "shell material", "shell organic rigid fragile opaque pearl-friendly smooth-friendly"),
  material("coral", "organic_natural", "coral material", "coral organic rigid porous opaque grainable natural"),
  material("wax", "organic_natural", "wax material", "wax organic soft translucent-friendly smooth-friendly waxy sculptural"),
];

function condition(
  value: string,
  tags: string,
  compatibility?: ModuleFieldOption["compatibility"],
): ModuleFieldOption {
  return {
    value,
    promptText: value,
    tags: tags.split(" "),
    compatibility,
  };
}

export const textureConditionMetadata: ModuleFieldOption[] = [
  condition("clean", "clean pristine flawless", {
    preferredTags: ["plastic", "vinyl", "glass", "ceramic", "metal", "resin", "rubber", "smooth-friendly", "clean-friendly"],
    supportedTags: ["wood", "paper", "fabric", "leather", "stone", "clay", "organic"],
  }),
  condition("handmade", "handmade artisanal imperfect", {
    preferredTags: ["clay", "ceramic", "wood", "paper", "fabric", "leather", "stone", "organic", "handmade-friendly", "carvable"],
    supportedTags: ["plastic", "resin", "metal", "rubber"],
  }),
  condition("scratches", "scratches worn surface-marks", {
    preferredTags: ["metal", "plastic", "glass", "wood", "leather", "resin", "scratch-friendly"],
    supportedTags: ["ceramic", "stone", "rubber", "bone", "ivory"],
    discouragedTags: ["fabric", "paper", "soft", "woven"],
    warningKey: "modules.texture.warnings.imperfection_scratches",
  }),
  condition("cracks", "cracks aged surface-breaks", {
    preferredTags: ["clay", "ceramic", "stone", "wood", "concrete", "bone", "painted-friendly", "fragile"],
    supportedTags: ["glass", "plastic", "resin", "paper"],
    discouragedTags: ["fabric", "rubber", "metal", "soft", "flexible"],
    warningKey: "modules.texture.warnings.imperfection_cracks",
  }),
  condition("dents", "dents bumps imperfect", {
    preferredTags: ["metal", "plastic", "rubber", "leather", "clay", "soft", "flexible"],
    supportedTags: ["wood", "stone", "ceramic", "resin"],
    discouragedTags: ["glass", "crystal", "paper", "fabric"],
    warningKey: "modules.texture.warnings.imperfection_dents",
  }),
  condition("chips", "chips chipped imperfect", {
    preferredTags: ["ceramic", "clay", "stone", "wood", "concrete", "glass", "painted-friendly", "fragile"],
    supportedTags: ["metal", "plastic", "resin", "bone"],
    discouragedTags: ["fabric", "rubber", "paper", "soft", "flexible"],
    warningKey: "modules.texture.warnings.imperfection_chips",
  }),
  condition("dust", "dust dirt aged", {
    preferredTags: ["wood", "stone", "clay", "ceramic", "paper", "fabric", "leather", "metal", "plastic", "organic"],
    supportedTags: ["glass", "rubber", "resin"],
  }),
  condition("weathered", "weathered aged worn", {
    preferredTags: ["wood", "stone", "metal", "concrete", "leather", "paper", "clay", "ceramic", "organic", "weathered-friendly", "aged-friendly"],
    supportedTags: ["plastic", "rubber", "fabric", "glass"],
  }),
  condition("stains", "stains uneven-color aged", {
    preferredTags: ["fabric", "paper", "wood", "leather", "stone", "clay", "ceramic", "concrete", "porous"],
    supportedTags: ["plastic", "rubber", "metal", "resin"],
    discouragedTags: ["glass", "crystal", "chrome", "clean-friendly"],
    warningKey: "modules.texture.warnings.imperfection_stains",
  }),
  condition("fading", "fading faded aged-color", {
    preferredTags: ["fabric", "paper", "leather", "wood", "plastic", "painted-friendly", "aged-friendly"],
    supportedTags: ["metal", "rubber", "stone", "ceramic"],
    discouragedTags: ["glass", "crystal", "chrome"],
    warningKey: "modules.texture.warnings.imperfection_fading",
  }),
  condition("wrinkles", "wrinkles creases folds", {
    preferredTags: ["fabric", "leather", "paper", "rubber", "soft", "flexible", "wrinkle-friendly"],
    supportedTags: ["organic", "wax"],
    discouragedTags: ["metal", "glass", "stone", "ceramic", "wood", "rigid"],
    warningKey: "modules.texture.warnings.imperfection_wrinkles",
  }),
  condition("peeling", "peeling flaking weathered", {
    preferredTags: ["painted-friendly", "wood", "metal", "paper", "wall-like", "aged-friendly", "weathered-friendly"],
    supportedTags: ["clay", "ceramic", "plastic", "leather", "concrete"],
    discouragedTags: ["glass", "fabric", "rubber", "crystal"],
    warningKey: "modules.texture.warnings.imperfection_peeling",
  }),
  condition("corrosion", "corrosion rust oxidized", {
    preferredTags: ["metal", "iron", "steel", "copper", "brass", "bronze", "corrosion-friendly", "oxidation-friendly", "rust-friendly", "patina-friendly"],
    supportedTags: ["industrial"],
    discouragedTags: ["wood", "fabric", "paper", "glass", "ceramic", "clay", "rubber", "plastic", "organic", "leather", "stone"],
    warningKey: "modules.texture.warnings.imperfection_corrosion",
  }),
];
