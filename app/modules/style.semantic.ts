import type { ModuleFieldOption, PromptKeyModule } from "./types";
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

// Stage 1 semantic cleanup.
//
// The legacy field id `preset` is intentionally preserved for saved-draft / JSON
// compatibility. Semantically, this field now acts as an aesthetic anchor only.
// Module presets remain recipes that populate fields; each field is responsible
// only for its own prompt signal.
const aestheticPromptText: PromptTextOverrides = {
  "3d_cartoon": "stylized 3D cartoon aesthetic",
  anime_cover: "anime illustration aesthetic",
  cinematic_realism: "cinematic realism aesthetic",
  clay_sculpture: "claymation-inspired handcrafted clay aesthetic",
  vinyl_toy: "vinyl toy aesthetic",
  geometric_editorial: "geometric illustration aesthetic",
  primitive_cut_paper: "primitive cut-paper aesthetic",
  retro_comic: "retro comic-book aesthetic",
  fashion_caricature_sketch: "expressive caricature sketch aesthetic",
  angular_animation: "angular 2D animation aesthetic",
  childlike_drawing: "naive childlike drawing aesthetic",
  low_poly_3d: "low-poly 3D aesthetic",
  watercolor_editorial: "watercolor illustration aesthetic",
  crafted_paper_collage: "crafted paper collage aesthetic",
  low_poly_character: "low-poly geometric aesthetic",
  pixel_art_game_character: "pixel-art aesthetic",
  risograph_poster_art: "risograph print aesthetic",
  ink_character_sketch: "expressive ink sketch aesthetic",
  cinematic_cgi_character: "cinematic CGI aesthetic",
  studio_photo_realism: "photorealistic photography aesthetic",
  papier_mache_character: "papier-mâché handcrafted aesthetic",
  plush_toy_character: "plush textile aesthetic",
  woodcut_editorial: "woodcut print aesthetic",
  marker_concept_art: "marker illustration aesthetic",
};

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
  abstract: "abstract stylization with substantially simplified or deconstructed forms",
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

export const StyleModule = {
  ...BaseStyleModule,
  fields: {
    ...BaseStyleModule.fields,
    preset: {
      ...BaseStyleModule.fields.preset,
      options: applyPromptTextOverrides(
        BaseStyleModule.fields.preset.options,
        aestheticPromptText,
      ),
    },
    medium: {
      ...BaseStyleModule.fields.medium,
      options: applyPromptTextOverrides(
        BaseStyleModule.fields.medium.options,
        mediumPromptText,
      ),
    },
    stylizationLevel: {
      ...BaseStyleModule.fields.stylizationLevel,
      options: applyPromptTextOverrides(
        BaseStyleModule.fields.stylizationLevel.options,
        stylizationPromptText,
      ),
    },
    shapeLanguage: {
      ...BaseStyleModule.fields.shapeLanguage,
      options: applyPromptTextOverrides(
        BaseStyleModule.fields.shapeLanguage.options,
        shapePromptText,
      ),
    },
    visualTreatment: {
      ...BaseStyleModule.fields.visualTreatment,
      options: applyPromptTextOverrides(
        BaseStyleModule.fields.visualTreatment.options,
        treatmentPromptText,
      ),
    },
    finish: {
      ...BaseStyleModule.fields.finish,
      options: applyPromptTextOverrides(
        BaseStyleModule.fields.finish.options,
        finishPromptText,
      ),
    },
  },
} satisfies PromptKeyModule;
