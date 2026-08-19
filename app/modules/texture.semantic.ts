import type {
  MaterialAssignment,
  ModuleFieldOption,
  PromptKeyModule,
} from "./types";
import { TextureModule as LegacyTextureModule } from "./texture.module";

/**
 * The legacy module contains a large, useful material catalog. Stage 11 keeps
 * that catalog while replacing the old global field architecture around it.
 * The legacy module is not registered after this refactor; it acts only as the
 * temporary catalog source until the catalog is extracted to its own file.
 */
const materialOptions = LegacyTextureModule.fields.material.options || [];
const legacyConditionOptions = LegacyTextureModule.fields.imperfections.options || [];

function option(
  value: string,
  promptText: string,
  tags: string[] = [],
  compatibility?: ModuleFieldOption["compatibility"],
): ModuleFieldOption {
  return {
    value,
    promptText,
    tags,
    compatibility,
  };
}

const finishOptions: ModuleFieldOption[] = [
  option("matte", "matte finish", ["matte", "non-reflective"], {
    preferredTags: ["paper", "fabric", "clay", "ceramic", "wood", "rubber", "plastic", "matte-friendly"],
    supportedTags: ["metal", "glass", "stone", "leather"],
  }),
  option("satin", "satin finish", ["satin", "soft-sheen"], {
    preferredTags: ["fabric", "silk", "wood", "plastic", "resin", "metal", "satin-friendly"],
    supportedTags: ["ceramic", "leather", "paper"],
  }),
  option("semi_gloss", "semi-gloss finish", ["semi-gloss", "reflective"], {
    preferredTags: ["plastic", "resin", "ceramic", "metal", "wood", "leather"],
    supportedTags: ["glass", "paper", "rubber"],
    discouragedTags: ["fabric", "porous"],
    warningKey: "modules.texture.warnings.finish_semi_gloss",
  }),
  option("glossy", "glossy finish", ["glossy", "reflective"], {
    preferredTags: ["glass", "ceramic", "plastic", "vinyl", "resin", "metal", "gloss-friendly"],
    supportedTags: ["wood", "paper", "leather", "rubber"],
    discouragedTags: ["fabric", "porous", "rough"],
    warningKey: "modules.texture.warnings.finish_glossy",
  }),
  option("high_gloss", "high-gloss finish", ["high-gloss", "reflective"], {
    preferredTags: ["glass", "metal", "ceramic", "resin", "plastic", "gloss-friendly"],
    supportedTags: ["wood", "paper"],
    discouragedTags: ["fabric", "porous", "organic"],
    warningKey: "modules.texture.warnings.finish_high_gloss",
  }),
  option("mirror", "mirror-like polished finish", ["mirror-like", "polished", "reflective"], {
    preferredTags: ["metal", "glass", "chrome", "mirror-friendly", "polish-friendly"],
    supportedTags: ["ceramic", "resin", "plastic", "stone"],
    discouragedTags: ["fabric", "paper", "rubber", "porous"],
    warningKey: "modules.texture.warnings.finish_mirror",
  }),
];

const surfaceTextureOptions: ModuleFieldOption[] = [
  option("smooth", "smooth surface texture", ["smooth", "clean"], {
    preferredTags: ["plastic", "vinyl", "metal", "glass", "ceramic", "resin", "smooth-friendly"],
    supportedTags: ["wood", "stone", "paper", "leather", "clay", "rubber"],
  }),
  option("brushed", "brushed directional surface texture", ["brushed", "directional"], {
    preferredTags: ["metal", "brushed-friendly"],
    supportedTags: ["wood", "plastic"],
    discouragedTags: ["fabric", "glass", "rubber", "paper"],
    warningKey: "modules.texture.warnings.surface_brushed",
  }),
  option("rough", "rough tactile surface texture", ["rough", "tactile"], {
    preferredTags: ["wood", "stone", "clay", "paper", "rough-friendly"],
    supportedTags: ["metal", "plastic", "ceramic", "rubber"],
    discouragedTags: ["glass", "silk", "velvet"],
    warningKey: "modules.texture.warnings.surface_rough",
  }),
  option("porous", "porous surface texture", ["porous", "tactile"], {
    preferredTags: ["clay", "ceramic", "stone", "paper", "wood", "porous"],
    supportedTags: ["rubber", "organic"],
    discouragedTags: ["glass", "metal"],
    warningKey: "modules.texture.warnings.surface_porous",
  }),
  option("grainy", "fine grain surface texture", ["grainy", "fine-grain"], {
    preferredTags: ["wood", "clay", "stone", "paper", "organic", "grainable"],
    supportedTags: ["ceramic", "plastic", "resin"],
    discouragedTags: ["glass", "chrome"],
    warningKey: "modules.texture.warnings.surface_grainy",
  }),
  option("fibrous", "fibrous surface texture", ["fibrous", "tactile"], {
    preferredTags: ["fabric", "paper", "wood", "organic", "fibrous"],
    supportedTags: ["leather"],
    discouragedTags: ["metal", "glass", "ceramic"],
    warningKey: "modules.texture.warnings.surface_fibrous",
  }),
  option("woven", "woven surface texture", ["woven", "textile"], {
    preferredTags: ["fabric", "textile", "woven"],
    supportedTags: ["paper"],
    discouragedTags: ["metal", "glass", "stone", "ceramic", "plastic"],
    warningKey: "modules.texture.warnings.surface_woven",
  }),
  option("hammered", "hammered uneven surface texture", ["hammered", "uneven"], {
    preferredTags: ["metal"],
    supportedTags: ["clay", "ceramic", "plastic"],
    discouragedTags: ["fabric", "paper", "glass"],
    warningKey: "modules.texture.warnings.surface_hammered",
  }),
  option("ridged", "ridged linear surface texture", ["ridged", "linear"], {
    preferredTags: ["metal", "plastic", "rubber", "wood", "ceramic"],
    supportedTags: ["glass", "stone"],
    discouragedTags: ["paper", "silk"],
    warningKey: "modules.texture.warnings.surface_ridged",
  }),
  option("brush_marks", "visible brush-mark surface texture", ["brush-marks", "painted", "handmade"], {
    preferredTags: ["painted-friendly", "canvas", "paper", "wood", "clay", "ceramic", "handmade-friendly"],
    supportedTags: ["plastic", "metal", "resin", "stone"],
    discouragedTags: ["glass", "crystal", "fabric", "rubber"],
    warningKey: "modules.texture.warnings.surface_brush_marks",
  }),
  option("coarse", "coarse surface texture", ["coarse", "rough", "tactile"], {
    preferredTags: ["stone", "clay", "wood", "concrete", "paper", "organic", "rough-friendly"],
    supportedTags: ["metal", "plastic", "ceramic", "rubber"],
    discouragedTags: ["glass", "crystal", "silk", "velvet", "smooth-friendly"],
    warningKey: "modules.texture.warnings.surface_coarse",
  }),
];

const opticalCharacterOptions: ModuleFieldOption[] = [
  option("opaque", "opaque material behavior", ["opaque"], {
    preferredTags: ["opaque", "wood", "metal", "stone", "fabric", "leather", "paper", "ceramic"],
    supportedTags: ["plastic", "resin", "rubber", "clay", "organic"],
    discouragedTags: ["transparent"],
    warningKey: "modules.texture.warnings.optical_opaque",
  }),
  option("translucent", "translucent light-passing material behavior", ["translucent", "light-passing"], {
    preferredTags: ["glass", "crystal", "resin", "plastic", "translucent", "translucent-friendly", "wax", "shell"],
    supportedTags: ["paper", "ceramic"],
    discouragedTags: ["metal", "wood", "stone", "fabric", "opaque"],
    warningKey: "modules.texture.warnings.optical_translucent",
  }),
  option("transparent", "transparent material behavior", ["transparent", "light-passing"], {
    preferredTags: ["glass", "crystal", "transparent", "transparent-friendly", "acrylic", "resin"],
    supportedTags: ["plastic"],
    discouragedTags: ["metal", "wood", "stone", "fabric", "paper", "leather", "opaque"],
    warningKey: "modules.texture.warnings.optical_transparent",
  }),
  option("frosted", "frosted diffused light-passing material behavior", ["frosted", "diffused", "translucent"], {
    preferredTags: ["glass", "crystal", "plastic", "resin", "translucent-friendly"],
    supportedTags: ["wax"],
    discouragedTags: ["wood", "fabric", "paper", "leather", "metal"],
    warningKey: "modules.texture.warnings.optical_frosted",
  }),
];

const textureProminenceOptions: ModuleFieldOption[] = [
  option("subtle", "subtle surface texture prominence", ["subtle", "surface-texture"]),
  option("visible", "clearly visible surface texture", ["visible", "surface-texture"]),
  option("pronounced", "pronounced surface texture", ["pronounced", "surface-texture"]),
];

const conditionPromptText: Record<string, string> = {
  clean: "clean surface condition",
  handmade: "handmade surface irregularities",
  scratches: "small surface scratches",
  cracks: "surface cracks",
  dents: "small dents and bumps",
  chips: "chipped edges or surface areas",
  dust: "light dust and dirt",
  weathered: "weathered surface condition",
  stains: "surface stains",
  fading: "faded surface coloration",
  wrinkles: "wrinkled or creased surface condition",
  peeling: "peeling or flaking surface areas",
  corrosion: "corroded or oxidized surface condition",
};

const conditionValues = Object.keys(conditionPromptText);
const conditionOptions: ModuleFieldOption[] = conditionValues.map((value) => {
  const legacy = legacyConditionOptions.find((option) => option.value === value);

  return {
    ...legacy,
    value,
    promptText: conditionPromptText[value],
  };
});

type MaterialPresetRecipe = Omit<MaterialAssignment, "id" | "targets"> & {
  id: string;
  category: string;
  categoryLabel: string;
};

const presetRecipes: MaterialPresetRecipe[] = [
  {
    id: "smooth_vinyl",
    category: "synthetic",
    categoryLabel: "Synthetic / Product",
    material: "vinyl",
    finish: "satin",
    surfaceTexture: "smooth",
    opticalCharacter: "opaque",
    textureProminence: "subtle",
    conditions: ["clean"],
  },
  {
    id: "handmade_clay",
    category: "organic",
    categoryLabel: "Organic / Handmade",
    material: "clay",
    finish: "matte",
    surfaceTexture: "porous",
    opticalCharacter: "opaque",
    textureProminence: "visible",
    conditions: ["handmade"],
  },
  {
    id: "brushed_aluminum",
    category: "metal",
    categoryLabel: "Metal",
    material: "aluminum",
    finish: "satin",
    surfaceTexture: "brushed",
    opticalCharacter: "opaque",
    textureProminence: "visible",
    conditions: ["clean"],
  },
  {
    id: "polished_metal",
    category: "metal",
    categoryLabel: "Metal",
    material: "metal",
    finish: "high_gloss",
    surfaceTexture: "smooth",
    opticalCharacter: "opaque",
    textureProminence: "subtle",
    conditions: ["clean"],
  },
  {
    id: "clear_glass",
    category: "glass",
    categoryLabel: "Glass / Crystal",
    material: "glass",
    finish: "glossy",
    surfaceTexture: "smooth",
    opticalCharacter: "transparent",
    textureProminence: "subtle",
    conditions: ["clean"],
  },
  {
    id: "frosted_glass",
    category: "glass",
    categoryLabel: "Glass / Crystal",
    material: "glass",
    finish: "matte",
    surfaceTexture: "smooth",
    opticalCharacter: "frosted",
    textureProminence: "subtle",
    conditions: ["clean"],
  },
  {
    id: "clean_porcelain",
    category: "ceramic",
    categoryLabel: "Clay / Ceramic",
    material: "porcelain",
    finish: "glossy",
    surfaceTexture: "smooth",
    opticalCharacter: "opaque",
    textureProminence: "subtle",
    conditions: ["clean"],
  },
  {
    id: "weathered_leather",
    category: "organic",
    categoryLabel: "Organic / Handmade",
    material: "leather",
    finish: "matte",
    surfaceTexture: "grainy",
    opticalCharacter: "opaque",
    textureProminence: "visible",
    conditions: ["weathered", "scratches"],
  },
  {
    id: "woven_cotton",
    category: "fabric",
    categoryLabel: "Fabric / Textile",
    material: "cotton",
    finish: "matte",
    surfaceTexture: "woven",
    opticalCharacter: "opaque",
    textureProminence: "visible",
    conditions: ["clean"],
  },
  {
    id: "aged_wood",
    category: "organic",
    categoryLabel: "Organic / Handmade",
    material: "oak",
    finish: "matte",
    surfaceTexture: "grainy",
    opticalCharacter: "opaque",
    textureProminence: "pronounced",
    conditions: ["weathered", "scratches"],
  },
  {
    id: "polished_marble",
    category: "stone",
    categoryLabel: "Stone / Mineral",
    material: "marble",
    finish: "high_gloss",
    surfaceTexture: "smooth",
    opticalCharacter: "opaque",
    textureProminence: "visible",
    conditions: ["clean"],
  },
  {
    id: "matte_rubber",
    category: "synthetic",
    categoryLabel: "Synthetic / Product",
    material: "rubber",
    finish: "matte",
    surfaceTexture: "smooth",
    opticalCharacter: "opaque",
    textureProminence: "subtle",
    conditions: ["clean"],
  },
];

const presetOptions: ModuleFieldOption[] = presetRecipes.map((preset) => ({
  value: preset.id,
  category: preset.category,
  categoryLabel: preset.categoryLabel,
  promptText: preset.id.replace(/_/g, " "),
}));

export const TextureModule: PromptKeyModule = {
  key: "texture",
  icon: "texture",
  groups: {
    assignments: { id: "assignments", order: 1, defaultOpen: true },
    advanced: { id: "advanced", order: 2, defaultOpen: false },
    override: { id: "override", order: 3, defaultOpen: false },
  },
  fields: {
    materialAssignments: {
      id: "materialAssignments",
      type: "materialAssignments",
      default: [],
      group: "assignments",
      order: 10,
      options: presetOptions,
      config: {
        materialOptions,
        finishOptions,
        surfaceTextureOptions,
        opticalCharacterOptions,
        textureProminenceOptions,
        conditionOptions,
        presetRecipes,
      },
      ui: {
        component: "materialAssignments",
        width: "full",
      },
    },
    extraDetails: {
      id: "extraDetails",
      type: "textarea",
      default: "",
      group: "advanced",
      order: 20,
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
  },
};
