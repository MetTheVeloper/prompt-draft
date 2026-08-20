import type {
  ModuleFieldOption,
  ModulePreset,
  PromptKeyModule,
} from "./types";

function option(
  value: string,
  promptText: string,
  tags: string[] = [],
): ModuleFieldOption {
  return {
    value,
    promptText,
    tags,
  };
}

const customOption = option("custom", "");

const backgroundConceptOptions: ModuleFieldOption[] = [
  option("clean_background", "clean background", ["clean", "minimal"]),
  option("studio_background", "studio background", ["studio"]),
  option("indoor_environment", "indoor environment background", ["environment", "indoor"]),
  option("outdoor_environment", "outdoor environment background", ["environment", "outdoor"]),
  option("natural_environment", "natural environment background", ["environment", "natural"]),
  option("urban_environment", "urban environment background", ["environment", "urban"]),
  option("architectural_environment", "architectural environment background", ["environment", "architecture"]),
  option("material_background", "material-based background", ["surface", "material"]),
  option("abstract_background", "abstract background", ["abstract"]),
  option("graphic_background", "graphic background", ["graphic"]),
  option("pattern_background", "pattern-based background", ["pattern"]),
  option("mixed_media_background", "mixed-media background", ["mixed-media"]),
  option("transparent_background", "transparent background", ["transparent"]),
  customOption,
];

const backgroundTypeOptions: ModuleFieldOption[] = [
  option("environment", "environmental backdrop", ["environment"]),
  option("studio", "studio backdrop", ["studio"]),
  option("surface", "surface-based backdrop", ["surface"]),
  option("abstract", "abstract backdrop", ["abstract"]),
  option("graphic", "graphic backdrop", ["graphic"]),
  option("pattern", "pattern-based backdrop", ["pattern"]),
  option("mixed_media", "mixed-media backdrop", ["mixed-media"]),
  option("transparent", "transparent backdrop", ["transparent"]),
  customOption,
];

const settingOptions: ModuleFieldOption[] = [
  option("indoor", "an indoor setting", ["indoor"]),
  option("outdoor", "an outdoor setting", ["outdoor"]),
  option("natural", "a natural setting", ["natural"]),
  option("urban", "an urban setting", ["urban"]),
  option("architectural", "an architecture-focused setting", ["architecture"]),
  option("public", "a public-space setting", ["public"]),
  option("residential", "a residential setting", ["residential"]),
  option("commercial", "a commercial setting", ["commercial"]),
  option("industrial", "an industrial setting", ["industrial"]),
  option("sports", "a sports setting", ["sports"]),
  option("performance", "a performance or stage setting", ["performance"]),
  option("futuristic", "a futuristic built environment", ["futuristic", "architecture"]),
  customOption,
];

const spatialStructureOptions: ModuleFieldOption[] = [
  option("seamless", "a seamless uninterrupted structure", ["seamless"]),
  option("flat", "a flat planar structure", ["flat"]),
  option("open", "an open spatial structure", ["open"]),
  option("layered", "a layered foreground-to-distance structure", ["layered"]),
  option("enclosed", "an enclosed spatial structure", ["enclosed"]),
  option("expansive", "an expansive spatial structure", ["expansive"]),
  option("horizon_based", "a horizon-based spatial structure", ["horizon"]),
  option("framed", "a framed spatial structure around the subject", ["framed"]),
  option("repeating", "a repeating spatial structure", ["repeating"]),
  option("structured", "a clearly structured spatial arrangement", ["structured"]),
  option("asymmetrical", "an asymmetrical spatial arrangement", ["asymmetrical"]),
  customOption,
];

const backgroundMaterialOptions: ModuleFieldOption[] = [
  option("seamless_paper", "seamless paper", ["paper", "studio"]),
  option("paper", "paper", ["paper"]),
  option("fabric", "fabric", ["fabric", "textile"]),
  option("concrete", "concrete", ["concrete", "mineral"]),
  option("stone", "stone", ["stone", "mineral"]),
  option("wood", "wood", ["wood", "organic"]),
  option("metal", "metal", ["metal", "industrial"]),
  option("glass", "glass", ["glass"]),
  option("plaster", "plaster", ["plaster", "wall"]),
  option("painted_wall", "painted wall surface", ["wall", "painted"]),
  customOption,
];

const detailDensityOptions: ModuleFieldOption[] = [
  option("minimal", "minimal background detail", ["minimal"]),
  option("restrained", "restrained background detail", ["restrained"]),
  option("balanced", "balanced background detail", ["balanced"]),
  option("detailed", "detailed background information", ["detailed"]),
  option("dense", "dense background information", ["dense"]),
  customOption,
];

const backgroundElementOptions: ModuleFieldOption[] = [
  option("vegetation", "vegetation", ["natural"]),
  option("architecture", "architecture", ["architecture"]),
  option("furniture", "furniture", ["indoor"]),
  option("crowd", "distant people or crowd presence", ["public", "sports"]),
  option("signage", "signage", ["urban", "commercial"]),
  option("skyline", "skyline elements", ["urban"]),
  option("mountains", "mountain forms", ["natural"]),
  option("water", "water", ["natural"]),
  option("clouds", "clouds", ["outdoor"]),
  option("shelves", "shelving", ["indoor", "commercial"]),
  option("windows", "windows", ["indoor", "architecture"]),
  option("machinery", "machinery", ["industrial"]),
  option("arena_seating", "arena seating", ["sports"]),
  option("horizon", "a visible horizon", ["outdoor"]),
  option("contextual_props", "secondary contextual props", ["environment"]),
  customOption,
];

function preset(
  id: string,
  order: number,
  values: ModulePreset["values"],
): ModulePreset {
  return {
    id,
    order,
    values: {
      backgroundConcept: "",
      backgroundType: "",
      setting: "",
      spatialStructure: "",
      backgroundMaterial: "",
      detailDensity: "",
      backgroundElements: [],
      ...values,
    },
  };
}

const presets: Record<string, ModulePreset> = {
  clean_background: preset("clean_background", 10, {
    backgroundConcept: "clean_background",
    backgroundType: "surface",
    spatialStructure: "seamless",
    detailDensity: "minimal",
  }),
  studio_background: preset("studio_background", 20, {
    backgroundConcept: "studio_background",
    backgroundType: "studio",
    setting: "indoor",
    spatialStructure: "seamless",
    backgroundMaterial: "seamless_paper",
    detailDensity: "restrained",
  }),
  indoor_environment: preset("indoor_environment", 30, {
    backgroundConcept: "indoor_environment",
    backgroundType: "environment",
    setting: "indoor",
    spatialStructure: "layered",
    detailDensity: "balanced",
  }),
  outdoor_environment: preset("outdoor_environment", 40, {
    backgroundConcept: "outdoor_environment",
    backgroundType: "environment",
    setting: "outdoor",
    spatialStructure: "open",
    detailDensity: "balanced",
  }),
  natural_environment: preset("natural_environment", 50, {
    backgroundConcept: "natural_environment",
    backgroundType: "environment",
    setting: "natural",
    spatialStructure: "layered",
    detailDensity: "balanced",
    backgroundElements: ["vegetation"],
  }),
  urban_environment: preset("urban_environment", 60, {
    backgroundConcept: "urban_environment",
    backgroundType: "environment",
    setting: "urban",
    spatialStructure: "layered",
    detailDensity: "balanced",
    backgroundElements: ["architecture"],
  }),
  architectural_environment: preset("architectural_environment", 70, {
    backgroundConcept: "architectural_environment",
    backgroundType: "environment",
    setting: "architectural",
    spatialStructure: "structured",
    detailDensity: "balanced",
    backgroundElements: ["architecture"],
  }),
  material_background: preset("material_background", 80, {
    backgroundConcept: "material_background",
    backgroundType: "surface",
    spatialStructure: "flat",
    detailDensity: "restrained",
  }),
  abstract_background: preset("abstract_background", 90, {
    backgroundConcept: "abstract_background",
    backgroundType: "abstract",
    detailDensity: "balanced",
  }),
  graphic_background: preset("graphic_background", 100, {
    backgroundConcept: "graphic_background",
    backgroundType: "graphic",
    spatialStructure: "flat",
    detailDensity: "balanced",
  }),
  pattern_background: preset("pattern_background", 110, {
    backgroundConcept: "pattern_background",
    backgroundType: "pattern",
    spatialStructure: "repeating",
    detailDensity: "balanced",
  }),
  mixed_media_background: preset("mixed_media_background", 120, {
    backgroundConcept: "mixed_media_background",
    backgroundType: "mixed_media",
    spatialStructure: "layered",
    detailDensity: "balanced",
  }),
  transparent_background: preset("transparent_background", 130, {
    backgroundConcept: "transparent_background",
    backgroundType: "transparent",
    detailDensity: "minimal",
  }),
};

export const BackgroundModule: PromptKeyModule = {
  key: "background",
  icon: "image",

  groups: {
    core: { id: "core", order: 10, defaultOpen: true },
    construction: { id: "construction", order: 20, defaultOpen: true },
    content: { id: "content", order: 30, defaultOpen: true },
    advanced: { id: "advanced", order: 40, defaultOpen: false },
    override: { id: "override", order: 50, defaultOpen: false },
  },

  fields: {
    backgroundConcept: {
      id: "backgroundConcept",
      type: "select",
      default: "",
      group: "core",
      order: 10,
      options: backgroundConceptOptions,
      customInput: {},
      ui: {
        component: "select",
        clearable: true,
        searchable: true,
        width: "half",
      },
    },
    backgroundType: {
      id: "backgroundType",
      type: "select",
      default: "",
      group: "core",
      order: 20,
      options: backgroundTypeOptions,
      customInput: {},
      ui: {
        component: "select",
        clearable: true,
        width: "half",
      },
    },
    setting: {
      id: "setting",
      type: "select",
      default: "",
      group: "core",
      order: 30,
      options: settingOptions,
      customInput: {},
      ui: {
        component: "select",
        clearable: true,
        searchable: true,
        width: "half",
      },
    },
    spatialStructure: {
      id: "spatialStructure",
      type: "select",
      default: "",
      group: "construction",
      order: 10,
      options: spatialStructureOptions,
      customInput: {},
      ui: {
        component: "select",
        clearable: true,
        width: "half",
      },
    },
    backgroundMaterial: {
      id: "backgroundMaterial",
      type: "select",
      default: "",
      group: "construction",
      order: 20,
      options: backgroundMaterialOptions,
      customInput: {},
      ui: {
        component: "select",
        clearable: true,
        searchable: true,
        width: "half",
      },
    },
    detailDensity: {
      id: "detailDensity",
      type: "select",
      default: "",
      group: "construction",
      order: 30,
      options: detailDensityOptions,
      customInput: {},
      ui: {
        component: "select",
        clearable: true,
        width: "half",
      },
    },
    backgroundElements: {
      id: "backgroundElements",
      type: "multiSelect",
      default: [],
      group: "content",
      order: 10,
      options: backgroundElementOptions,
      customInput: {},
      ui: {
        component: "multiSelect",
        clearable: true,
        searchable: true,
        width: "full",
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

  presets,
  presetUi: {
    component: "select",
    group: "core",
    allowNone: true,
    resetOnNone: false,
  },

  compile: {
    removeDuplicates: true,
    ignoreEmpty: true,
    overrideField: "customText",
    fieldOrder: [
      "backgroundConcept",
      "backgroundType",
      "setting",
      "spatialStructure",
      "backgroundMaterial",
      "detailDensity",
      "backgroundElements",
      "extraDetails",
    ],
  },
};