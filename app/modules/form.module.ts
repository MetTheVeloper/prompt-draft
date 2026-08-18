import type {
  ModuleFieldOption,
  ModuleSubjectType,
  PromptKeyModule,
} from "./types";

function option(
  value: string,
  promptText: string,
  tags: string[] = [],
  config: {
    category?: string;
    categoryLabelKey?: string;
    appliesTo?: Array<ModuleSubjectType | "*">;
  } = {},
): ModuleFieldOption {
  return {
    value,
    promptText,
    tags,
    ...config,
  };
}

const formLanguageOptions: ModuleFieldOption[] = [
  option(
    "soft_rounded",
    "soft rounded form language with smooth contours",
    ["soft", "rounded"],
  ),
  option(
    "geometric",
    "geometric form language with simplified structural shapes",
    ["geometric", "structured"],
  ),
  option(
    "fluid_organic",
    "fluid organic form language with continuous curves",
    ["fluid", "organic"],
  ),
  option(
    "blocky",
    "blocky form language with simplified squared geometry",
    ["blocky", "squared"],
  ),
  option(
    "angular",
    "angular form language with sharp directional edges",
    ["angular", "sharp"],
  ),
  option(
    "irregular",
    "irregular asymmetric form language with uneven contours",
    ["irregular", "asymmetric"],
  ),
  option(
    "faceted",
    "faceted planar form language with distinct angular breaks",
    ["faceted", "planar"],
  ),
  option(
    "biomorphic",
    "biomorphic form language with soft irregular organic masses",
    ["biomorphic", "organic"],
  ),
  option(
    "monolithic",
    "monolithic form language built from large unified masses",
    ["monolithic", "massive"],
  ),
  option(
    "branching",
    "branching form language with extending interconnected forms",
    ["branching", "organic"],
  ),
];

const proportionOptions: ModuleFieldOption[] = [
  option(
    "balanced",
    "balanced proportions with even visual mass distribution",
    ["balanced"],
    {
      category: "general",
      categoryLabelKey: "modules.form.fields.proportions.categories.general",
    },
  ),
  option(
    "elongated",
    "elongated proportions with extended vertical emphasis",
    ["elongated"],
    {
      category: "general",
      categoryLabelKey: "modules.form.fields.proportions.categories.general",
    },
  ),
  option(
    "compact",
    "compact proportions with shortened overall form",
    ["compact"],
    {
      category: "general",
      categoryLabelKey: "modules.form.fields.proportions.categories.general",
    },
  ),
  option(
    "wide",
    "wide proportions with expanded horizontal mass",
    ["wide"],
    {
      category: "general",
      categoryLabelKey: "modules.form.fields.proportions.categories.general",
    },
  ),
  option(
    "tapered",
    "tapered proportions with progressively narrowing forms",
    ["tapered"],
    {
      category: "general",
      categoryLabelKey: "modules.form.fields.proportions.categories.general",
    },
  ),
  option(
    "top_heavy",
    "top-heavy proportions with greater visual mass in the upper form",
    ["top-heavy"],
    {
      category: "general",
      categoryLabelKey: "modules.form.fields.proportions.categories.general",
    },
  ),
  option(
    "bottom_heavy",
    "bottom-heavy proportions with greater visual mass in the lower form",
    ["bottom-heavy"],
    {
      category: "general",
      categoryLabelKey: "modules.form.fields.proportions.categories.general",
    },
  ),
  option(
    "asymmetric",
    "asymmetric proportions with deliberately uneven mass distribution",
    ["asymmetric"],
    {
      category: "general",
      categoryLabelKey: "modules.form.fields.proportions.categories.general",
    },
  ),
  option(
    "oversized_elements",
    "selectively oversized proportions with emphasized major elements",
    ["oversized"],
    {
      category: "general",
      categoryLabelKey: "modules.form.fields.proportions.categories.general",
    },
  ),

  option(
    "chibi",
    "chibi proportions with an oversized head, compact body, and short simplified limbs",
    ["person", "chibi", "compact"],
    {
      category: "person",
      categoryLabelKey: "modules.form.fields.proportions.categories.person",
      appliesTo: ["person"],
    },
  ),
  option(
    "fashion_elongated",
    "fashion-elongated proportions with long limbs, a narrow torso, and extended vertical balance",
    ["person", "fashion", "elongated"],
    {
      category: "person",
      categoryLabelKey: "modules.form.fields.proportions.categories.person",
      appliesTo: ["person"],
    },
  ),
  option(
    "oversized_head",
    "an oversized head-to-body ratio with a compact supporting body",
    ["person", "head", "oversized"],
    {
      category: "person",
      categoryLabelKey: "modules.form.fields.proportions.categories.person",
      appliesTo: ["person"],
    },
  ),
  option(
    "compact_mascot",
    "compact mascot-like proportions with rounded body mass and short limbs",
    ["person", "mascot", "compact"],
    {
      category: "person",
      categoryLabelKey: "modules.form.fields.proportions.categories.person",
      appliesTo: ["person"],
    },
  ),
  option(
    "long_limb_narrow_torso",
    "long-limbed proportions with a narrow torso and extended body rhythm",
    ["person", "long-limbed", "narrow"],
    {
      category: "person",
      categoryLabelKey: "modules.form.fields.proportions.categories.person",
      appliesTo: ["person"],
    },
  ),
];

const transformationOptions: ModuleFieldOption[] = [
  option(
    "stretch",
    "stretched form transformation",
    ["stretch", "elastic"],
    {
      category: "elastic",
      categoryLabelKey: "modules.form.fields.transformation.categories.elastic",
    },
  ),
  option(
    "squash",
    "squashed form transformation",
    ["squash", "elastic"],
    {
      category: "elastic",
      categoryLabelKey: "modules.form.fields.transformation.categories.elastic",
    },
  ),
  option(
    "elastic_bend",
    "soft elastic bending with continuous flexible form transitions",
    ["elastic", "bend"],
    {
      category: "elastic",
      categoryLabelKey: "modules.form.fields.transformation.categories.elastic",
    },
  ),

  option(
    "compress",
    "compressed form transformation",
    ["compressed", "volume"],
    {
      category: "volume",
      categoryLabelKey: "modules.form.fields.transformation.categories.volume",
    },
  ),
  option(
    "inflate",
    "inflated form transformation with expanded rounded volume",
    ["inflated", "volume"],
    {
      category: "volume",
      categoryLabelKey: "modules.form.fields.transformation.categories.volume",
    },
  ),
  option(
    "flatten",
    "flattened planar form transformation with reduced depth",
    ["flattened", "planar"],
    {
      category: "volume",
      categoryLabelKey: "modules.form.fields.transformation.categories.volume",
    },
  ),

  option(
    "twist",
    "twisted form transformation with rotational flow",
    ["twist", "warp"],
    {
      category: "warp",
      categoryLabelKey: "modules.form.fields.transformation.categories.warp",
    },
  ),
  option(
    "warp",
    "warped form transformation with smoothly displaced structure",
    ["warp", "distort"],
    {
      category: "warp",
      categoryLabelKey: "modules.form.fields.transformation.categories.warp",
    },
  ),
  option(
    "melt",
    "melting form transformation with downward drooping collapse",
    ["melt", "droop"],
    {
      category: "warp",
      categoryLabelKey: "modules.form.fields.transformation.categories.warp",
    },
  ),
  option(
    "fold",
    "folded form transformation with bending planar sections",
    ["fold", "bend"],
    {
      category: "warp",
      categoryLabelKey: "modules.form.fields.transformation.categories.warp",
    },
  ),

  option(
    "fragment",
    "fragmented form transformation with separated structural pieces",
    ["fragment", "structural"],
    {
      category: "structural",
      categoryLabelKey: "modules.form.fields.transformation.categories.structural",
    },
  ),
  option(
    "offset_segments",
    "offset segmented form transformation with displaced connected sections",
    ["segmented", "offset"],
    {
      category: "structural",
      categoryLabelKey: "modules.form.fields.transformation.categories.structural",
    },
  ),
  option(
    "fractured_planes",
    "fractured-plane transformation with shifted angular sections",
    ["fractured", "planes"],
    {
      category: "structural",
      categoryLabelKey: "modules.form.fields.transformation.categories.structural",
    },
  ),

  option(
    "directional_smear",
    "directional smeared form transformation with trailing stretched shapes",
    ["smear", "directional"],
    {
      category: "surreal",
      categoryLabelKey: "modules.form.fields.transformation.categories.surreal",
    },
  ),
  option(
    "impossible_geometry",
    "physically impossible form geometry with readable impossible connections",
    ["impossible", "surreal"],
    {
      category: "surreal",
      categoryLabelKey: "modules.form.fields.transformation.categories.surreal",
    },
  ),
  option(
    "biomorphic_growth",
    "biomorphic growth transformation with uneven organic extensions",
    ["biomorphic", "growth"],
    {
      category: "surreal",
      categoryLabelKey: "modules.form.fields.transformation.categories.surreal",
    },
  ),

  option(
    "grotesque_caricature",
    "grotesque humorous anatomical exaggeration with intentionally awkward proportions and expressive facial distortion",
    ["person", "caricature", "grotesque"],
    {
      category: "person_caricature",
      categoryLabelKey: "modules.form.fields.transformation.categories.personCaricature",
      appliesTo: ["person"],
    },
  ),
  option(
    "fashion_caricature",
    "fashion-caricature anatomy with elongated limbs, dramatic facial planes, and stylized body balance",
    ["person", "caricature", "fashion"],
    {
      category: "person_caricature",
      categoryLabelKey: "modules.form.fields.transformation.categories.personCaricature",
      appliesTo: ["person"],
    },
  ),
  option(
    "facial_exaggeration",
    "facial-focused exaggeration with enlarged features, stretched cheeks or jaw, and altered head proportions",
    ["person", "face", "exaggeration"],
    {
      category: "person_caricature",
      categoryLabelKey: "modules.form.fields.transformation.categories.personCaricature",
      appliesTo: ["person"],
    },
  ),
  option(
    "personality_asymmetry",
    "personality-driven anatomical asymmetry with uneven balance, unusual stance, and exaggerated proportional rhythm",
    ["person", "asymmetry", "caricature"],
    {
      category: "person_caricature",
      categoryLabelKey: "modules.form.fields.transformation.categories.personCaricature",
      appliesTo: ["person"],
    },
  ),

  option(
    "rubber_hose_anatomy",
    "rubber-hose anatomy with flexible jointless limbs and rounded elastic bends",
    ["person", "rubber-hose", "elastic"],
    {
      category: "person_elastic",
      categoryLabelKey: "modules.form.fields.transformation.categories.personElastic",
      appliesTo: ["person"],
    },
  ),
  option(
    "spring_loaded_anatomy",
    "spring-loaded anatomy with extended limbs, compressed body sections, and visible elastic tension",
    ["person", "spring", "elastic"],
    {
      category: "person_elastic",
      categoryLabelKey: "modules.form.fields.transformation.categories.personElastic",
      appliesTo: ["person"],
    },
  ),
  option(
    "balloon_anatomy",
    "inflated balloon-like anatomy with swollen rounded volumes and puffed limbs",
    ["person", "inflated", "balloon"],
    {
      category: "person_elastic",
      categoryLabelKey: "modules.form.fields.transformation.categories.personElastic",
      appliesTo: ["person"],
    },
  ),
  option(
    "squashed_compact_anatomy",
    "squashed compact anatomy with shortened proportions and compressed body mass",
    ["person", "squashed", "compact"],
    {
      category: "person_elastic",
      categoryLabelKey: "modules.form.fields.transformation.categories.personElastic",
      appliesTo: ["person"],
    },
  ),

  option(
    "marionette_anatomy",
    "marionette-like anatomy with clearly jointed limbs, segmented body construction, and suspended awkward proportions",
    ["person", "marionette", "jointed"],
    {
      category: "person_constructed",
      categoryLabelKey: "modules.form.fields.transformation.categories.personConstructed",
      appliesTo: ["person"],
    },
  ),
  option(
    "mannequin_anatomy",
    "mannequin-like simplified anatomy with artificial proportions and rigid body segmentation",
    ["person", "mannequin", "segmented"],
    {
      category: "person_constructed",
      categoryLabelKey: "modules.form.fields.transformation.categories.personConstructed",
      appliesTo: ["person"],
    },
  ),
  option(
    "cuboid_anatomy",
    "cuboid anatomy with squared limbs, block-based body sections, and rigid structural proportions",
    ["person", "cuboid", "blocky"],
    {
      category: "person_constructed",
      categoryLabelKey: "modules.form.fields.transformation.categories.personConstructed",
      appliesTo: ["person"],
    },
  ),
  option(
    "faceted_anatomy",
    "faceted anatomy rebuilt from sharp planes and simplified polygonal body structure",
    ["person", "faceted", "polygonal"],
    {
      category: "person_constructed",
      categoryLabelKey: "modules.form.fields.transformation.categories.personConstructed",
      appliesTo: ["person"],
    },
  ),

  option(
    "insectoid_anatomy",
    "insectoid anatomical transformation with thin segmented limbs, sharp joints, and nonhuman proportion balance",
    ["person", "animal", "insectoid", "segmented"],
    {
      category: "person_creature",
      categoryLabelKey: "modules.form.fields.transformation.categories.personCreature",
      appliesTo: ["person", "animal"],
    },
  ),
  option(
    "creature_hybrid",
    "creature-like anatomical transformation with nonhuman proportion balance and altered limb structure",
    ["person", "animal", "creature", "hybrid"],
    {
      category: "person_creature",
      categoryLabelKey: "modules.form.fields.transformation.categories.personCreature",
      appliesTo: ["person", "animal"],
    },
  ),
  option(
    "alien_elongation",
    "alien-like anatomical elongation with unfamiliar body balance and extended nonhuman proportions",
    ["person", "alien", "elongated"],
    {
      category: "person_creature",
      categoryLabelKey: "modules.form.fields.transformation.categories.personCreature",
      appliesTo: ["person"],
    },
  ),

  option(
    "grotesque_misshapen",
    "grotesque misshapen anatomy with irregular proportions, intentional asymmetry, and unstable physical balance",
    ["person", "grotesque", "misshapen"],
    {
      category: "person_grotesque",
      categoryLabelKey: "modules.form.fields.transformation.categories.personGrotesque",
      appliesTo: ["person"],
    },
  ),
  option(
    "distorted_elegance",
    "elegant but subtly uncanny anatomy with long proportions and controlled imbalance",
    ["person", "grotesque", "elegant"],
    {
      category: "person_grotesque",
      categoryLabelKey: "modules.form.fields.transformation.categories.personGrotesque",
      appliesTo: ["person"],
    },
  ),
  option(
    "radical_silhouette",
    "radical anatomical silhouette transformation with strongly altered body width, length, and mass distribution",
    ["person", "silhouette", "radical"],
    {
      category: "person_grotesque",
      categoryLabelKey: "modules.form.fields.transformation.categories.personGrotesque",
      appliesTo: ["person"],
    },
  ),
];

const transformationStrengthOptions: ModuleFieldOption[] = [
  option("subtle", "subtle transformation intensity", ["subtle"]),
  option("moderate", "moderate transformation intensity", ["moderate"]),
  option("strong", "strong transformation intensity", ["strong"]),
  option("extreme", "extreme transformation intensity", ["extreme"]),
];

export const FormModule: PromptKeyModule = {
  key: "form",
  icon: "transform",

  groups: {
    core: {
      id: "core",
      order: 10,
      defaultOpen: true,
    },
    transformation: {
      id: "transformation",
      order: 20,
      defaultOpen: true,
    },
    advanced: {
      id: "advanced",
      order: 30,
      defaultOpen: false,
    },
    override: {
      id: "override",
      order: 40,
      defaultOpen: false,
    },
  },

  fields: {
    formLanguage: {
      id: "formLanguage",
      type: "select",
      default: "",
      group: "core",
      order: 10,
      options: formLanguageOptions,
      ui: {
        component: "select",
        searchable: true,
        clearable: true,
        width: "half",
      },
    },

    proportions: {
      id: "proportions",
      type: "select",
      default: "",
      group: "core",
      order: 20,
      options: proportionOptions,
      ui: {
        component: "select",
        optionLayout: "categorized",
        searchable: true,
        clearable: true,
        width: "half",
      },
    },

    transformation: {
      id: "transformation",
      type: "select",
      default: "",
      group: "transformation",
      order: 10,
      options: transformationOptions,
      ui: {
        component: "select",
        optionLayout: "categorized",
        searchable: true,
        clearable: true,
        width: "full",
      },
    },

    transformationStrength: {
      id: "transformationStrength",
      type: "select",
      default: "",
      group: "transformation",
      order: 20,
      options: transformationStrengthOptions,
      ui: {
        component: "select",
        clearable: true,
        width: "half",
      },
    },

    extraDetails: {
      id: "extraDetails",
      type: "textarea",
      default: "",
      group: "advanced",
      order: 10,
      ui: {
        component: "textarea",
        rows: 3,
        width: "full",
      },
    },

    customText: {
      id: "customText",
      type: "textarea",
      default: "",
      group: "override",
      order: 10,
      isOverride: true,
      ui: {
        component: "textarea",
        rows: 4,
        width: "full",
      },
    },
  },

  compile: {
    separator: ", ",
    removeDuplicates: true,
    ignoreEmpty: true,
    overrideField: "customText",
    fieldOrder: [
      "formLanguage",
      "proportions",
      "transformation",
      "transformationStrength",
      "extraDetails",
    ],
  },
};
