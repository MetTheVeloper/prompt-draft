import type {
  ModuleFieldOption,
  ModulePreset,
  PromptKeyModule,
} from "./types";
import { StyleModule as BaseStyleModule } from "./style.module";

type PromptTextOverrides = Record<string, string>;

function applyPromptTextOverrides(
  options: ModuleFieldOption[] | undefined,
  overrides: PromptTextOverrides,
) {
  return (options || []).map((option) => ({
    ...option,
    promptText: overrides[option.value] ?? option.promptText,
  }));
}

const aestheticOptions: ModuleFieldOption[] = [
  { value: "3d_cartoon", promptText: "stylized 3D cartoon aesthetic", tags: ["3d", "cartoon"] },
  { value: "anime", promptText: "anime visual aesthetic", tags: ["anime", "illustration"] },
  { value: "cinematic_realism", promptText: "cinematic realism aesthetic", tags: ["cinematic", "realistic"] },
  { value: "claymation", promptText: "claymation aesthetic", tags: ["clay", "handcrafted"] },
  { value: "vinyl_toy", promptText: "vinyl toy aesthetic", tags: ["vinyl", "3d"] },
  { value: "geometric_illustration", promptText: "geometric illustration aesthetic", tags: ["geometric", "illustration"] },
  { value: "cut_paper", promptText: "cut-paper aesthetic", tags: ["paper", "cutout"] },
  { value: "retro_comic", promptText: "retro comic-book aesthetic", tags: ["comic", "retro"] },
  { value: "caricature_sketch", promptText: "expressive caricature sketch aesthetic", tags: ["caricature", "sketch"] },
  { value: "angular_animation", promptText: "angular 2D animation aesthetic", tags: ["angular", "animation"] },
  { value: "childlike_drawing", promptText: "naive childlike drawing aesthetic", tags: ["childlike", "drawing"] },
  { value: "low_poly", promptText: "low-poly geometric aesthetic", tags: ["low-poly", "3d", "geometric"] },
  { value: "watercolor_illustration", promptText: "watercolor illustration aesthetic", tags: ["watercolor", "illustration"] },
  { value: "paper_collage", promptText: "crafted paper collage aesthetic", tags: ["paper", "collage"] },
  { value: "pixel_art", promptText: "pixel-art aesthetic", tags: ["pixel-art", "digital"] },
  { value: "risograph", promptText: "risograph visual aesthetic", tags: ["risograph", "print"] },
  { value: "ink_sketch", promptText: "expressive ink sketch aesthetic", tags: ["ink", "sketch"] },
  { value: "cinematic_cgi", promptText: "cinematic CGI aesthetic", tags: ["cgi", "cinematic"] },
  { value: "photo_realism", promptText: "photorealistic visual aesthetic", tags: ["photo", "realistic"] },
  { value: "papier_mache", promptText: "papier-mâché handcrafted aesthetic", tags: ["papier-mache", "handcrafted"] },
  { value: "plush_textile", promptText: "plush textile aesthetic", tags: ["plush", "textile"] },
  { value: "woodcut", promptText: "woodcut visual aesthetic", tags: ["woodcut", "print"] },
  { value: "marker_illustration", promptText: "marker illustration aesthetic", tags: ["marker", "illustration"] },
  { value: "art_deco", promptText: "Art Deco aesthetic", tags: ["art-deco", "geometric"] },
  { value: "art_nouveau", promptText: "Art Nouveau aesthetic", tags: ["art-nouveau", "ornamental"] },
  { value: "bauhaus", promptText: "Bauhaus aesthetic", tags: ["bauhaus", "geometric"] },
  { value: "swiss_international", promptText: "Swiss International Style aesthetic", tags: ["swiss", "graphic"] },
  { value: "mid_century_modern", promptText: "mid-century modern aesthetic", tags: ["mid-century", "modern"] },
  { value: "constructivist", promptText: "Constructivist visual aesthetic", tags: ["constructivist", "graphic"] },
  { value: "memphis", promptText: "Memphis design aesthetic", tags: ["memphis", "geometric"] },
  { value: "retro_futurist", promptText: "retro-futurist aesthetic", tags: ["retro", "futurist"] },
  { value: "brutalist_graphic", promptText: "brutalist graphic aesthetic", tags: ["brutalist", "graphic"] },
  { value: "minimal_geometric", promptText: "minimal geometric aesthetic", tags: ["minimal", "geometric"] },
  { value: "pop_art", promptText: "Pop Art aesthetic", tags: ["pop-art", "graphic"] },
  { value: "op_art", promptText: "Op Art aesthetic", tags: ["op-art", "optical"] },
  { value: "psychedelic", promptText: "psychedelic visual aesthetic", tags: ["psychedelic", "stylized"] },
  { value: "surrealist", promptText: "surrealist aesthetic", tags: ["surrealist", "stylized"] },
  { value: "cubist", promptText: "Cubist aesthetic", tags: ["cubist", "geometric"] },
  { value: "expressionist", promptText: "Expressionist aesthetic", tags: ["expressionist", "expressive"] },
  { value: "impressionist", promptText: "Impressionist aesthetic", tags: ["impressionist", "painterly"] },
  { value: "fauvist", promptText: "Fauvist aesthetic", tags: ["fauvist", "painterly"] },
  { value: "pointillist", promptText: "Pointillist aesthetic", tags: ["pointillist", "painterly"] },
  { value: "ukiyo_e", promptText: "ukiyo-e aesthetic", tags: ["ukiyo-e", "print"] },
  { value: "folk_art", promptText: "folk-art aesthetic", tags: ["folk-art", "handcrafted"] },
  { value: "storybook", promptText: "storybook illustration aesthetic", tags: ["storybook", "illustration"] },
  { value: "gothic_illustration", promptText: "Gothic illustration aesthetic", tags: ["gothic", "illustration"] },
  { value: "vintage_scientific", promptText: "vintage scientific illustration aesthetic", tags: ["vintage", "illustration"] },
  { value: "screenprint_graphic", promptText: "screen-print graphic aesthetic", tags: ["screen-print", "graphic"] },
  { value: "linocut", promptText: "linocut visual aesthetic", tags: ["linocut", "print"] },
  { value: "etching", promptText: "etched print aesthetic", tags: ["etching", "print"] },
];

const mediumPromptText: PromptTextOverrides = {
  digital_illustration: "digital illustration",
  digital_painting: "digital painting",
  vector_illustration: "vector illustration",
  three_d_render: "3D render",
  cgi: "CGI rendering",
  photography: "photography",
};

const stylizationPromptText: PromptTextOverrides = {
  subtle: "subtle stylization with minimal transformation",
  controlled: "controlled stylization with moderate transformation",
  strong: "strong stylization with clearly transformed forms",
  extreme: "extreme stylization with radically transformed forms",
  abstract:
    "abstract stylization with substantially simplified or deconstructed forms",
};

const shapePromptText: PromptTextOverrides = {
  soft_rounded: "soft rounded forms with smooth contours",
  geometric: "geometric shape language with simplified structured forms",
  fluid: "fluid organic forms with graceful continuous curves",
  blocky: "block-built forms with simplified volumetric masses",
  elongated: "elongated forms with extended proportions and vertical emphasis",
  angular: "sharp angular forms with crisp edges",
};

const treatmentPromptText: PromptTextOverrides = {
  cel_shaded: "cel-shaded surfaces with crisp graphic separation",
  flat_graphic: "flat color fields, bold graphic silhouettes, minimal shading",
  ink_watercolor: "expressive ink lines and irregular watercolor washes",
  halftone_comic: "comic-book treatment with halftone shading and black outlines",
  hand_painted: "visible hand-painted surface variation and expressive brush marks",
  paper_cutout: "flat cut-paper construction with simple layered shapes",
  minimalist: "minimalist visual treatment with simple forms and restrained detail",
  textured: "rich surface texture with a tactile visual impression",
};

const finishPromptText: PromptTextOverrides = {
  clean: "clean, polished finish",
  premium: "refined, premium finish",
  handcrafted: "handcrafted finish with tactile variation",
  graphic: "bold graphic finish",
  rough: "rough, sketchy, imperfect finish",
  matte: "soft matte finish with minimal reflection",
  glossy: "high-gloss reflective finish",
};

const { preset: _legacyAestheticField, ...baseFields } = BaseStyleModule.fields;

const presets: Record<string, ModulePreset> = {
  soft_3d_cartoon: {
    id: "soft_3d_cartoon",
    order: 10,
    values: {
      aesthetic: "3d_cartoon",
      medium: "three_d_render",
      stylizationLevel: "strong",
      shapeLanguage: "soft_rounded",
      visualTreatment: "cel_shaded",
      finish: "clean",
    },
  },
  premium_vinyl: {
    id: "premium_vinyl",
    order: 20,
    values: {
      aesthetic: "vinyl_toy",
      medium: "three_d_render",
      stylizationLevel: "controlled",
      shapeLanguage: "soft_rounded",
      visualTreatment: "",
      finish: "premium",
    },
  },
  handmade_clay: {
    id: "handmade_clay",
    order: 30,
    values: {
      aesthetic: "claymation",
      medium: "clay_sculpture",
      stylizationLevel: "controlled",
      shapeLanguage: "fluid",
      visualTreatment: "hand_painted",
      finish: "handcrafted",
    },
  },
  cinematic_realism: {
    id: "cinematic_realism",
    order: 40,
    values: {
      aesthetic: "cinematic_realism",
      medium: "photography",
      stylizationLevel: "subtle",
      shapeLanguage: "",
      visualTreatment: "",
      finish: "clean",
    },
  },
  geometric_flat: {
    id: "geometric_flat",
    order: 50,
    values: {
      aesthetic: "geometric_illustration",
      medium: "vector_illustration",
      stylizationLevel: "strong",
      shapeLanguage: "geometric",
      visualTreatment: "flat_graphic",
      finish: "graphic",
    },
  },
  retro_comic_pop: {
    id: "retro_comic_pop",
    order: 60,
    values: {
      aesthetic: "retro_comic",
      medium: "digital_illustration",
      stylizationLevel: "strong",
      shapeLanguage: "geometric",
      visualTreatment: "halftone_comic",
      finish: "graphic",
    },
  },
  expressive_caricature_ink: {
    id: "expressive_caricature_ink",
    order: 70,
    values: {
      aesthetic: "caricature_sketch",
      medium: "ink_drawing",
      stylizationLevel: "extreme",
      shapeLanguage: "fluid",
      visualTreatment: "ink_watercolor",
      finish: "rough",
    },
  },
  primitive_cut_paper: {
    id: "primitive_cut_paper",
    order: 80,
    values: {
      aesthetic: "cut_paper",
      medium: "paper_cutout",
      stylizationLevel: "strong",
      shapeLanguage: "geometric",
      visualTreatment: "paper_cutout",
      finish: "handcrafted",
    },
  },
  angular_2d: {
    id: "angular_2d",
    order: 90,
    values: {
      aesthetic: "angular_animation",
      medium: "digital_illustration",
      stylizationLevel: "strong",
      shapeLanguage: "angular",
      visualTreatment: "flat_graphic",
      finish: "graphic",
    },
  },
  naive_childlike: {
    id: "naive_childlike",
    order: 100,
    values: {
      aesthetic: "childlike_drawing",
      medium: "colored_pencil_drawing",
      stylizationLevel: "strong",
      shapeLanguage: "",
      visualTreatment: "hand_painted",
      finish: "rough",
    },
  },
  watercolor_ink: {
    id: "watercolor_ink",
    order: 110,
    values: {
      aesthetic: "watercolor_illustration",
      medium: "watercolor_painting",
      stylizationLevel: "controlled",
      shapeLanguage: "fluid",
      visualTreatment: "ink_watercolor",
      finish: "handcrafted",
    },
  },
  crafted_paper_collage: {
    id: "crafted_paper_collage",
    order: 120,
    values: {
      aesthetic: "paper_collage",
      medium: "paper_collage",
      stylizationLevel: "controlled",
      shapeLanguage: "blocky",
      visualTreatment: "paper_cutout",
      finish: "handcrafted",
    },
  },
  low_poly: {
    id: "low_poly",
    order: 130,
    values: {
      aesthetic: "low_poly",
      medium: "low_poly_render",
      stylizationLevel: "strong",
      shapeLanguage: "geometric",
      visualTreatment: "minimalist",
      finish: "clean",
    },
  },
  pixel_art: {
    id: "pixel_art",
    order: 140,
    values: {
      aesthetic: "pixel_art",
      medium: "pixel_art_digital",
      stylizationLevel: "strong",
      shapeLanguage: "blocky",
      visualTreatment: "minimalist",
      finish: "graphic",
    },
  },
  risograph_graphic: {
    id: "risograph_graphic",
    order: 150,
    values: {
      aesthetic: "risograph",
      medium: "risograph_print",
      stylizationLevel: "controlled",
      shapeLanguage: "geometric",
      visualTreatment: "flat_graphic",
      finish: "graphic",
    },
  },
  expressive_ink_sketch: {
    id: "expressive_ink_sketch",
    order: 160,
    values: {
      aesthetic: "ink_sketch",
      medium: "ink_drawing",
      stylizationLevel: "controlled",
      shapeLanguage: "fluid",
      visualTreatment: "ink_watercolor",
      finish: "rough",
    },
  },
  cinematic_cgi: {
    id: "cinematic_cgi",
    order: 170,
    values: {
      aesthetic: "cinematic_cgi",
      medium: "cgi",
      stylizationLevel: "controlled",
      shapeLanguage: "soft_rounded",
      visualTreatment: "hand_painted",
      finish: "premium",
    },
  },
  photo_realism: {
    id: "photo_realism",
    order: 180,
    values: {
      aesthetic: "photo_realism",
      medium: "photography",
      stylizationLevel: "subtle",
      shapeLanguage: "",
      visualTreatment: "",
      finish: "clean",
    },
  },
  papier_mache: {
    id: "papier_mache",
    order: 190,
    values: {
      aesthetic: "papier_mache",
      medium: "paper_mache_sculpture",
      stylizationLevel: "strong",
      shapeLanguage: "angular",
      visualTreatment: "minimalist",
      finish: "handcrafted",
    },
  },
  plush_textile: {
    id: "plush_textile",
    order: 200,
    values: {
      aesthetic: "plush_textile",
      medium: "plush_toy",
      stylizationLevel: "strong",
      shapeLanguage: "soft_rounded",
      visualTreatment: "minimalist",
      finish: "handcrafted",
    },
  },
  woodcut_graphic: {
    id: "woodcut_graphic",
    order: 210,
    values: {
      aesthetic: "woodcut",
      medium: "woodcut_print",
      stylizationLevel: "strong",
      shapeLanguage: "angular",
      visualTreatment: "flat_graphic",
      finish: "rough",
    },
  },
  marker_illustration: {
    id: "marker_illustration",
    order: 220,
    values: {
      aesthetic: "marker_illustration",
      medium: "marker_render",
      stylizationLevel: "controlled",
      shapeLanguage: "geometric",
      visualTreatment: "hand_painted",
      finish: "clean",
    },
  },
  art_deco_graphic: {
    id: "art_deco_graphic",
    order: 230,
    values: {
      aesthetic: "art_deco",
      medium: "vector_illustration",
      stylizationLevel: "controlled",
      shapeLanguage: "geometric",
      visualTreatment: "flat_graphic",
      finish: "premium",
    },
  },
  bauhaus_graphic: {
    id: "bauhaus_graphic",
    order: 240,
    values: {
      aesthetic: "bauhaus",
      medium: "vector_illustration",
      stylizationLevel: "strong",
      shapeLanguage: "geometric",
      visualTreatment: "flat_graphic",
      finish: "graphic",
    },
  },
  mid_century_graphic: {
    id: "mid_century_graphic",
    order: 250,
    values: {
      aesthetic: "mid_century_modern",
      medium: "digital_illustration",
      stylizationLevel: "controlled",
      shapeLanguage: "geometric",
      visualTreatment: "flat_graphic",
      finish: "clean",
    },
  },
  storybook_watercolor: {
    id: "storybook_watercolor",
    order: 260,
    values: {
      aesthetic: "storybook",
      medium: "watercolor_painting",
      stylizationLevel: "controlled",
      shapeLanguage: "soft_rounded",
      visualTreatment: "hand_painted",
      finish: "handcrafted",
    },
  },
  ukiyo_e_print: {
    id: "ukiyo_e_print",
    order: 270,
    values: {
      aesthetic: "ukiyo_e",
      medium: "ink_and_wash",
      stylizationLevel: "controlled",
      shapeLanguage: "fluid",
      visualTreatment: "",
      finish: "clean",
    },
  },
};

export const StyleModule = {
  ...BaseStyleModule,
  fields: {
    aesthetic: {
      id: "aesthetic",
      type: "select",
      default: "",
      group: "core",
      order: 10,
      options: aestheticOptions,
      ui: {
        component: "select",
        searchable: true,
        clearable: true,
        width: "full",
      },
    },
    ...baseFields,
    medium: {
      ...baseFields.medium,
      order: 20,
      options: applyPromptTextOverrides(
        baseFields.medium.options,
        mediumPromptText,
      ),
    },
    stylizationLevel: {
      ...baseFields.stylizationLevel,
      options: applyPromptTextOverrides(
        baseFields.stylizationLevel.options,
        stylizationPromptText,
      ),
    },
    shapeLanguage: {
      ...baseFields.shapeLanguage,
      options: applyPromptTextOverrides(
        baseFields.shapeLanguage.options,
        shapePromptText,
      ),
    },
    visualTreatment: {
      ...baseFields.visualTreatment,
      options: applyPromptTextOverrides(
        baseFields.visualTreatment.options,
        treatmentPromptText,
      ),
    },
    finish: {
      ...baseFields.finish,
      options: applyPromptTextOverrides(
        baseFields.finish.options,
        finishPromptText,
      ),
    },
  },
  presets,
  presetUi: {
    component: "select",
    group: "core",
    order: 0,
    allowNone: true,
    resetOnNone: true,
  },
  compile: {
    ...BaseStyleModule.compile,
    fieldOrder: [
      "aesthetic",
      "medium",
      "stylizationLevel",
      "shapeLanguage",
      "visualTreatment",
      "finish",
      "extraDetails",
    ],
  },
} satisfies PromptKeyModule;
