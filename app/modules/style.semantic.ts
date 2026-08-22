import type {
  ModuleFieldOption,
  ModulePreset,
  ModuleValues,
  PromptKeyModule,
} from "./types";

function mediumOption(
  value: string,
  category: string,
  categoryLabel: string,
  promptText: string,
  tags: string[],
): ModuleFieldOption {
  return { value, category, categoryLabel, promptText, tags };
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
  { value: "photo_realism", promptText: "photorealistic aesthetic", tags: ["photo", "realistic"] },
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

const mediumOptions: ModuleFieldOption[] = [
  mediumOption("digital_illustration", "digital_cg", "Digital / CG", "digital illustration", ["digital", "illustration"]),
  mediumOption("digital_painting", "digital_cg", "Digital / CG", "digital painting", ["digital", "painting"]),
  mediumOption("vector_illustration", "digital_cg", "Digital / CG", "vector illustration", ["vector", "illustration"]),
  mediumOption("three_d_render", "digital_cg", "Digital / CG", "3D render", ["3d", "render"]),
  mediumOption("cgi", "digital_cg", "Digital / CG", "CGI rendering", ["cgi", "render"]),
  mediumOption("low_poly_render", "digital_cg", "Digital / CG", "low-poly 3D render", ["low-poly", "3d"]),
  mediumOption("pixel_art_digital", "digital_cg", "Digital / CG", "digital pixel art", ["pixel-art", "digital"]),

  mediumOption("pencil_drawing", "drawing", "Drawing", "pencil drawing", ["pencil", "drawing"]),
  mediumOption("colored_pencil_drawing", "drawing", "Drawing", "colored pencil drawing", ["colored-pencil", "drawing"]),
  mediumOption("charcoal_drawing", "drawing", "Drawing", "charcoal drawing", ["charcoal", "drawing"]),
  mediumOption("ink_drawing", "drawing", "Drawing", "ink drawing", ["ink", "drawing"]),
  mediumOption("pen_and_ink", "drawing", "Drawing", "pen-and-ink illustration", ["pen", "ink"]),
  mediumOption("marker_render", "drawing", "Drawing", "marker rendering", ["marker", "drawing"]),
  mediumOption("pastel_drawing", "drawing", "Drawing", "pastel drawing", ["pastel", "drawing"]),

  mediumOption("watercolor_painting", "painting", "Painting", "watercolor painting", ["watercolor", "painting"]),
  mediumOption("gouache_painting", "painting", "Painting", "gouache painting", ["gouache", "painting"]),
  mediumOption("oil_painting", "painting", "Painting", "oil painting", ["oil", "painting"]),
  mediumOption("acrylic_painting", "painting", "Painting", "acrylic painting", ["acrylic", "painting"]),
  mediumOption("ink_and_wash", "painting", "Painting", "ink-and-wash painting", ["ink", "wash", "painting"]),

  mediumOption("screen_print", "printmaking", "Printmaking", "screen print", ["screen-print", "printmaking"]),
  mediumOption("risograph_print", "printmaking", "Printmaking", "risograph print", ["risograph", "printmaking"]),
  mediumOption("linocut_print", "printmaking", "Printmaking", "linocut print", ["linocut", "printmaking"]),
  mediumOption("woodcut_print", "printmaking", "Printmaking", "woodcut print", ["woodcut", "printmaking"]),
  mediumOption("woodblock_print", "printmaking", "Printmaking", "woodblock print", ["woodblock", "printmaking"]),
  mediumOption("etching_print", "printmaking", "Printmaking", "etched print", ["etching", "printmaking"]),

  mediumOption("photography", "photography", "Photography", "photography", ["photo", "realistic"]),
  mediumOption("photomontage", "photography", "Photography", "photomontage", ["photo", "montage"]),

  mediumOption("paper_cutout", "paper_craft", "Paper / Craft", "paper cutout artwork", ["paper", "cutout"]),
  mediumOption("paper_collage", "paper_craft", "Paper / Craft", "paper collage", ["paper", "collage"]),
  mediumOption("mixed_media_collage", "paper_craft", "Paper / Craft", "mixed-media collage", ["mixed-media", "collage"]),
  mediumOption("paper_craft", "paper_craft", "Paper / Craft", "handmade paper craft", ["paper", "craft"]),
  mediumOption("origami_art", "paper_craft", "Paper / Craft", "origami paper art", ["origami", "paper"]),

  mediumOption("clay_modeling", "sculpture_object", "Sculpture / Object", "hand-modeled clay", ["clay", "handmade"]),
  mediumOption("ceramic_art", "sculpture_object", "Sculpture / Object", "ceramic artwork", ["ceramic", "handmade"]),
  mediumOption("plasticine_modeling", "sculpture_object", "Sculpture / Object", "hand-modeled plasticine", ["plasticine", "handmade"]),
  mediumOption("papier_mache_craft", "sculpture_object", "Sculpture / Object", "papier-mâché craft", ["papier-mache", "handmade"]),
  mediumOption("handmade_model", "sculpture_object", "Sculpture / Object", "handmade model", ["model", "handmade"]),

  mediumOption("textile_craft", "textile_handmade", "Textile / Handmade", "textile craft", ["textile", "handmade"]),
  mediumOption("felt_craft", "textile_handmade", "Textile / Handmade", "felt craft", ["felt", "handmade"]),
  mediumOption("plush_textile_craft", "textile_handmade", "Textile / Handmade", "plush textile craft", ["plush", "textile"]),
  mediumOption("stitched_textile_art", "textile_handmade", "Textile / Handmade", "stitched textile artwork", ["stitched", "textile"]),
];

const stylizationLevelOptions: ModuleFieldOption[] = [
  { value: "subtle", promptText: "subtle stylization with minimal transformation", tags: ["subtle"] },
  { value: "controlled", promptText: "controlled stylization with moderate transformation", tags: ["controlled"] },
  { value: "strong", promptText: "strong stylization with clearly transformed forms", tags: ["strong", "exaggerated"] },
  { value: "extreme", promptText: "extreme stylization with radically transformed forms", tags: ["extreme", "exaggerated"] },
  { value: "abstract", promptText: "abstract stylization with substantially simplified or deconstructed forms", tags: ["abstract", "stylized"] },
];

const lineworkOptions: ModuleFieldOption[] = [
  { value: "clean_fine", promptText: "clean fine linework", tags: ["clean", "fine"] },
  { value: "clean_contour", promptText: "clean contour linework with controlled edges", tags: ["contour", "clean"] },
  { value: "bold_contour", promptText: "bold contour linework", tags: ["bold", "contour"] },
  { value: "expressive_ink", promptText: "expressive variable-width ink linework", tags: ["ink", "expressive"] },
  { value: "loose_sketch", promptText: "loose sketch linework", tags: ["loose", "sketch"] },
  { value: "calligraphic", promptText: "fluid calligraphic linework", tags: ["calligraphic", "fluid"] },
  { value: "technical", promptText: "precise technical linework", tags: ["technical", "precise"] },
  { value: "engraved_hatch", promptText: "fine engraved hatch linework", tags: ["engraved", "hatch"] },
  { value: "relief_cut", promptText: "bold relief-cut linework", tags: ["relief", "print"] },
];

const treatmentOptions: ModuleFieldOption[] = [
  { value: "cel_shaded", promptText: "cel-shaded rendering with clear tonal separation", tags: ["cel-shaded", "graphic"] },
  { value: "flat_graphic", promptText: "flat graphic rendering with restrained tonal variation", tags: ["flat", "graphic"] },
  { value: "ink_watercolor", promptText: "transparent watercolor washes with ink accents", tags: ["ink", "watercolor"] },
  { value: "halftone_comic", promptText: "halftone tonal treatment", tags: ["halftone", "comic"] },
  { value: "painterly", promptText: "painterly rendering with visible brushwork", tags: ["painterly", "brush"] },
  { value: "paper_cutout", promptText: "layered cut-paper treatment with clearly separated shapes", tags: ["paper", "cutout"] },
  { value: "layered_collage", promptText: "layered collage assembly with overlapping fragments", tags: ["collage", "layered"] },
  { value: "soft_blended", promptText: "softly blended tonal transitions", tags: ["soft", "blended"] },
  { value: "stippled", promptText: "stippled tonal treatment built from fine dots", tags: ["stippled", "dots"] },
];

const detailLevelOptions: ModuleFieldOption[] = [
  { value: "minimal", promptText: "minimal visual detail", tags: ["minimal"] },
  { value: "simplified", promptText: "simplified detail with reduced visual complexity", tags: ["simplified"] },
  { value: "balanced", promptText: "balanced level of visual detail", tags: ["balanced"] },
  { value: "intricate", promptText: "intricate fine detail", tags: ["intricate", "fine"] },
  { value: "dense", promptText: "dense layered visual detail", tags: ["dense", "layered"] },
];

const finishOptions: ModuleFieldOption[] = [
  { value: "clean", promptText: "clean, polished finish", tags: ["clean", "polished"] },
  { value: "refined", promptText: "refined finish with precise surface control", tags: ["refined", "precise"] },
  { value: "handcrafted", promptText: "handcrafted finish with tactile variation", tags: ["handcrafted", "handmade"] },
  { value: "rough", promptText: "rough, imperfect finish", tags: ["rough", "imperfect"] },
  { value: "matte", promptText: "matte finish with minimal reflection", tags: ["matte"] },
  { value: "satin", promptText: "satin finish with a soft restrained sheen", tags: ["satin"] },
  { value: "glossy", promptText: "high-gloss reflective finish", tags: ["glossy", "reflective"] },
];

const STYLE_PRESET_DEFAULTS: ModuleValues = {
  aesthetic: "",
  medium: "",
  stylizationLevel: "",
  linework: "",
  visualTreatment: "",
  detailLevel: "",
  finish: "",
};

function stylePreset(
  id: string,
  order: number,
  values: Partial<ModuleValues>,
): ModulePreset {
  return {
    id,
    order,
    values: {
      ...STYLE_PRESET_DEFAULTS,
      ...values,
    },
  };
}

const presets: Record<string, ModulePreset> = {
  soft_3d_cartoon: stylePreset("soft_3d_cartoon", 10, {
    aesthetic: "3d_cartoon",
    medium: "three_d_render",
    visualTreatment: "cel_shaded",
  }),
  premium_vinyl: stylePreset("premium_vinyl", 20, {
    aesthetic: "vinyl_toy",
    medium: "three_d_render",
    finish: "refined",
  }),
  handmade_clay: stylePreset("handmade_clay", 30, {
    aesthetic: "claymation",
    medium: "clay_modeling",
    finish: "handcrafted",
  }),
  cinematic_realism: stylePreset("cinematic_realism", 40, {
    aesthetic: "cinematic_realism",
    medium: "photography",
  }),
  geometric_flat: stylePreset("geometric_flat", 50, {
    aesthetic: "geometric_illustration",
    medium: "vector_illustration",
    visualTreatment: "flat_graphic",
  }),
  retro_comic_pop: stylePreset("retro_comic_pop", 60, {
    aesthetic: "retro_comic",
    medium: "digital_illustration",
    linework: "bold_contour",
    visualTreatment: "halftone_comic",
  }),
  expressive_caricature_ink: stylePreset("expressive_caricature_ink", 70, {
    aesthetic: "caricature_sketch",
    medium: "ink_drawing",
    linework: "expressive_ink",
  }),
  handmade_cut_paper: stylePreset("handmade_cut_paper", 80, {
    aesthetic: "cut_paper",
    medium: "paper_cutout",
    finish: "handcrafted",
  }),
  angular_2d: stylePreset("angular_2d", 90, {
    aesthetic: "angular_animation",
    medium: "digital_illustration",
    visualTreatment: "flat_graphic",
  }),
  naive_childlike: stylePreset("naive_childlike", 100, {
    aesthetic: "childlike_drawing",
    medium: "colored_pencil_drawing",
    linework: "loose_sketch",
    detailLevel: "simplified",
  }),
  watercolor_ink: stylePreset("watercolor_ink", 110, {
    aesthetic: "watercolor_illustration",
    medium: "watercolor_painting",
    linework: "expressive_ink",
  }),
  crafted_paper_collage: stylePreset("crafted_paper_collage", 120, {
    aesthetic: "paper_collage",
    medium: "paper_collage",
    visualTreatment: "layered_collage",
    finish: "handcrafted",
  }),
  low_poly: stylePreset("low_poly", 130, {
    aesthetic: "low_poly",
    medium: "low_poly_render",
  }),
  pixel_art: stylePreset("pixel_art", 140, {
    aesthetic: "pixel_art",
    medium: "pixel_art_digital",
  }),
  risograph_graphic: stylePreset("risograph_graphic", 150, {
    aesthetic: "risograph",
    medium: "risograph_print",
  }),
  expressive_ink_sketch: stylePreset("expressive_ink_sketch", 160, {
    aesthetic: "ink_sketch",
    medium: "ink_drawing",
    linework: "loose_sketch",
  }),
  cinematic_cgi: stylePreset("cinematic_cgi", 170, {
    aesthetic: "cinematic_cgi",
    medium: "cgi",
  }),
  photo_realism: stylePreset("photo_realism", 180, {
    aesthetic: "photo_realism",
    medium: "photography",
  }),
  papier_mache: stylePreset("papier_mache", 190, {
    aesthetic: "papier_mache",
    medium: "papier_mache_craft",
    finish: "handcrafted",
  }),
  plush_textile: stylePreset("plush_textile", 200, {
    aesthetic: "plush_textile",
    medium: "plush_textile_craft",
    finish: "handcrafted",
  }),
  woodcut_graphic: stylePreset("woodcut_graphic", 210, {
    aesthetic: "woodcut",
    medium: "woodcut_print",
    linework: "relief_cut",
  }),
  marker_illustration: stylePreset("marker_illustration", 220, {
    aesthetic: "marker_illustration",
    medium: "marker_render",
  }),
  art_deco_graphic: stylePreset("art_deco_graphic", 230, {
    aesthetic: "art_deco",
    medium: "vector_illustration",
  }),
  bauhaus_graphic: stylePreset("bauhaus_graphic", 240, {
    aesthetic: "bauhaus",
    medium: "vector_illustration",
    visualTreatment: "flat_graphic",
  }),
  mid_century_graphic: stylePreset("mid_century_graphic", 250, {
    aesthetic: "mid_century_modern",
    medium: "digital_illustration",
    visualTreatment: "flat_graphic",
  }),
  storybook_watercolor: stylePreset("storybook_watercolor", 260, {
    aesthetic: "storybook",
    medium: "watercolor_painting",
  }),
  ukiyo_e_print: stylePreset("ukiyo_e_print", 270, {
    aesthetic: "ukiyo_e",
    medium: "woodblock_print",
    linework: "clean_contour",
  }),
};

export const StyleModule = {
  key: "style",
  icon: "auto_fix_high",
  groups: {
    core: { id: "core", order: 10, defaultOpen: false },
    modifiers: { id: "modifiers", order: 20, defaultOpen: true },
    advanced: { id: "advanced", order: 30, defaultOpen: false },
    override: { id: "override", order: 40, defaultOpen: false },
  },
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
    medium: {
      id: "medium",
      type: "select",
      default: "",
      group: "core",
      order: 20,
      options: mediumOptions,
      ui: {
        component: "select",
        optionLayout: "categorized",
        clearable: true,
        width: "full",
      },
    },
    stylizationLevel: {
      id: "stylizationLevel",
      type: "select",
      default: "",
      group: "modifiers",
      order: 10,
      options: stylizationLevelOptions,
      ui: {
        component: "segmented",
        clearable: true,
        width: "half",
      },
    },
    linework: {
      id: "linework",
      type: "select",
      default: "",
      group: "modifiers",
      order: 20,
      options: lineworkOptions,
      ui: {
        component: "select",
        clearable: true,
        width: "half",
      },
    },
    visualTreatment: {
      id: "visualTreatment",
      type: "select",
      default: "",
      group: "modifiers",
      order: 30,
      options: treatmentOptions,
      ui: {
        component: "select",
        clearable: true,
        width: "half",
      },
    },
    detailLevel: {
      id: "detailLevel",
      type: "select",
      default: "",
      group: "modifiers",
      order: 40,
      options: detailLevelOptions,
      ui: {
        component: "select",
        clearable: true,
        width: "half",
      },
    },
    finish: {
      id: "finish",
      type: "select",
      default: "",
      group: "modifiers",
      order: 50,
      options: finishOptions,
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
  presets,
  presetUi: {
    component: "select",
    group: "core",
    order: 0,
    allowNone: true,
    resetOnNone: true,
  },
  compile: {
    separator: ", ",
    removeDuplicates: true,
    ignoreEmpty: true,
    overrideField: "customText",
    fieldOrder: [
      "aesthetic",
      "medium",
      "stylizationLevel",
      "linework",
      "visualTreatment",
      "detailLevel",
      "finish",
      "extraDetails",
    ],
  },
} satisfies PromptKeyModule;
