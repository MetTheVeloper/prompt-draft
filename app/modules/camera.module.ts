import type {
  ModuleFieldOption,
  ModulePreset,
  ModuleValues,
  PromptKeyModule,
} from "./types";

type CameraOptionConfig = {
  category?: string;
  categoryLabelKey?: string;
  compatibility?: ModuleFieldOption["compatibility"];
};

function option(
  value: string,
  promptText: string,
  tags: string[] = [],
  config: CameraOptionConfig = {},
): ModuleFieldOption {
  return { value, promptText, tags, ...config };
}

const captureCategories = {
  genericDigital: "modules.camera.fields.captureSystem.categories.genericDigital",
  genericFilm: "modules.camera.fields.captureSystem.categories.genericFilm",
  integrated: "modules.camera.fields.captureSystem.categories.integrated",
  analogModels: "modules.camera.fields.captureSystem.categories.analogModels",
  digitalModels: "modules.camera.fields.captureSystem.categories.digitalModels",
} as const;

const responseMismatchWarning =
  "modules.camera.fields.captureResponse.compatibilityWarnings.systemMismatch";
const lensMismatchWarning =
  "modules.camera.fields.lensProfile.compatibilityWarnings.systemMismatch";

const captureSystemOptions: ModuleFieldOption[] = [
  option("digital_full_frame", "full-frame digital camera capture system", ["camera", "digital", "full-frame"], { category: "genericDigital", categoryLabelKey: captureCategories.genericDigital }),
  option("digital_aps_c", "APS-C digital camera capture system", ["camera", "digital", "aps-c"], { category: "genericDigital", categoryLabelKey: captureCategories.genericDigital }),
  option("digital_medium_format", "medium-format digital camera capture system", ["camera", "digital", "medium-format"], { category: "genericDigital", categoryLabelKey: captureCategories.genericDigital }),
  option("digital_cinema", "digital cinema camera capture system", ["camera", "digital", "cinema"], { category: "genericDigital", categoryLabelKey: captureCategories.genericDigital }),

  option("film_35mm", "35mm film camera capture system", ["camera", "film", "35mm"], { category: "genericFilm", categoryLabelKey: captureCategories.genericFilm }),
  option("film_medium_format", "medium-format film camera capture system", ["camera", "film", "medium-format"], { category: "genericFilm", categoryLabelKey: captureCategories.genericFilm }),
  option("instant_film", "instant-film camera capture system", ["camera", "film", "instant"], { category: "genericFilm", categoryLabelKey: captureCategories.genericFilm }),

  option("smartphone", "smartphone camera capture system", ["camera", "digital", "integrated"], { category: "integrated", categoryLabelKey: captureCategories.integrated }),
  option("webcam", "webcam capture system", ["camera", "digital", "integrated"], { category: "integrated", categoryLabelKey: captureCategories.integrated }),
  option("security_camera", "security-camera capture system", ["camera", "digital", "fixed"], { category: "integrated", categoryLabelKey: captureCategories.integrated }),
  option("action_camera", "action-camera capture system", ["camera", "digital", "integrated"], { category: "integrated", categoryLabelKey: captureCategories.integrated }),
  option("aerial_drone", "aerial-drone camera capture system", ["camera", "digital", "integrated"], { category: "integrated", categoryLabelKey: captureCategories.integrated }),

  option("polaroid_sx70", "Polaroid SX-70 instant-film camera capture system", ["camera", "film", "instant", "integral-instant-lens"], { category: "analogModels", categoryLabelKey: captureCategories.analogModels }),
  option("kodak_disposable", "Kodak disposable 35mm film camera capture system", ["camera", "film", "35mm", "fixed-lens", "simple-fixed-lens"], { category: "analogModels", categoryLabelKey: captureCategories.analogModels }),
  option("canon_ae1", "Canon AE-1 35mm film camera capture system", ["camera", "film", "35mm", "interchangeable-lens"], { category: "analogModels", categoryLabelKey: captureCategories.analogModels }),
  option("nikon_f3", "Nikon F3 35mm film camera capture system", ["camera", "film", "35mm", "interchangeable-lens"], { category: "analogModels", categoryLabelKey: captureCategories.analogModels }),
  option("pentax_k1000", "Pentax K1000 35mm film camera capture system", ["camera", "film", "35mm", "interchangeable-lens"], { category: "analogModels", categoryLabelKey: captureCategories.analogModels }),
  option("leica_m6", "Leica M6 35mm rangefinder camera capture system", ["camera", "film", "35mm", "rangefinder", "interchangeable-lens"], { category: "analogModels", categoryLabelKey: captureCategories.analogModels }),
  option("hasselblad_500c", "Hasselblad 500C/M medium-format film camera capture system", ["camera", "film", "medium-format", "interchangeable-lens"], { category: "analogModels", categoryLabelKey: captureCategories.analogModels }),
  option("rolleiflex", "Rolleiflex medium-format twin-lens-reflex camera capture system", ["camera", "film", "medium-format", "twin-lens"], { category: "analogModels", categoryLabelKey: captureCategories.analogModels }),
  option("contax_t2", "Contax T2 compact 35mm film camera capture system", ["camera", "film", "35mm", "fixed-lens", "fixed-38mm"], { category: "analogModels", categoryLabelKey: captureCategories.analogModels }),
  option("lomography", "Lomography compact film-camera capture system", ["camera", "film", "experimental", "simple-fixed-lens"], { category: "analogModels", categoryLabelKey: captureCategories.analogModels }),

  option("canon_eos_r5", "Canon EOS R5 full-frame digital camera capture system", ["camera", "digital", "full-frame", "interchangeable-lens"], { category: "digitalModels", categoryLabelKey: captureCategories.digitalModels }),
  option("nikon_z8", "Nikon Z8 full-frame digital camera capture system", ["camera", "digital", "full-frame", "interchangeable-lens"], { category: "digitalModels", categoryLabelKey: captureCategories.digitalModels }),
  option("sony_a7r_iv", "Sony A7R IV full-frame digital camera capture system", ["camera", "digital", "full-frame", "interchangeable-lens"], { category: "digitalModels", categoryLabelKey: captureCategories.digitalModels }),
  option("sony_a7s_iii", "Sony A7S III full-frame digital camera capture system", ["camera", "digital", "full-frame", "interchangeable-lens"], { category: "digitalModels", categoryLabelKey: captureCategories.digitalModels }),
  option("fujifilm_x100v", "Fujifilm X100V APS-C fixed-lens digital camera capture system", ["camera", "digital", "aps-c", "fixed-lens", "fixed-23mm"], { category: "digitalModels", categoryLabelKey: captureCategories.digitalModels }),
  option("fujifilm_gfx_100s", "Fujifilm GFX 100S medium-format digital camera capture system", ["camera", "digital", "medium-format", "interchangeable-lens"], { category: "digitalModels", categoryLabelKey: captureCategories.digitalModels }),
  option("leica_q2", "Leica Q2 full-frame fixed-lens digital camera capture system", ["camera", "digital", "full-frame", "fixed-lens", "fixed-28mm"], { category: "digitalModels", categoryLabelKey: captureCategories.digitalModels }),
  option("leica_sl2", "Leica SL2 full-frame digital camera capture system", ["camera", "digital", "full-frame", "interchangeable-lens"], { category: "digitalModels", categoryLabelKey: captureCategories.digitalModels }),
  option("hasselblad_x2d", "Hasselblad X2D medium-format digital camera capture system", ["camera", "digital", "medium-format", "interchangeable-lens"], { category: "digitalModels", categoryLabelKey: captureCategories.digitalModels }),
  option("red_komodo", "RED Komodo digital cinema camera capture system", ["camera", "digital", "cinema", "interchangeable-lens"], { category: "digitalModels", categoryLabelKey: captureCategories.digitalModels }),
  option("arri_alexa", "ARRI Alexa digital cinema camera capture system", ["camera", "digital", "cinema", "interchangeable-lens"], { category: "digitalModels", categoryLabelKey: captureCategories.digitalModels }),
  option("blackmagic_pocket", "Blackmagic Pocket Cinema Camera capture system", ["camera", "digital", "cinema", "interchangeable-lens"], { category: "digitalModels", categoryLabelKey: captureCategories.digitalModels }),
];

const digitalResponseCompatibility: ModuleFieldOption["compatibility"] = {
  preferredTags: ["digital"],
  discouragedTags: ["film"],
  warningKey: responseMismatchWarning,
};

const captureResponseOptions: ModuleFieldOption[] = [
  option("neutral_digital", "neutral digital camera sensor capture response", ["camera", "digital", "neutral"], { compatibility: digitalResponseCompatibility }),
  option("high_resolution_digital", "high-resolution digital camera sensor response with fine microdetail", ["camera", "digital", "high-resolution"], { compatibility: digitalResponseCompatibility }),
  option("low_light_digital", "high-sensitivity digital camera sensor response with restrained noise and preserved low-tone detail", ["camera", "digital", "high-sensitivity"], { compatibility: digitalResponseCompatibility }),
  option("xtrans_digital", "Fujifilm X-Trans digital camera sensor color and tonal response", ["camera", "digital", "x-trans"], { compatibility: digitalResponseCompatibility }),
  option("medium_format_digital", "medium-format digital camera sensor response with smooth tonal gradation", ["camera", "digital", "medium-format"], {
    compatibility: {
      preferredTags: ["medium-format"],
      supportedTags: ["digital"],
      discouragedTags: ["film", "full-frame", "aps-c", "cinema", "integrated"],
      warningKey: responseMismatchWarning,
    },
  }),
  option("cinema_digital", "digital cinema camera sensor response with broad tonal latitude and smooth bright-tone roll-off", ["camera", "digital", "cinema"], { compatibility: digitalResponseCompatibility }),
  option("film_35mm", "35mm film camera capture response with organic grain and gradual tonal roll-off", ["camera", "film", "35mm", "grain"], {
    compatibility: {
      preferredTags: ["35mm"],
      supportedTags: ["film"],
      discouragedTags: ["digital", "instant", "medium-format"],
      warningKey: responseMismatchWarning,
    },
  }),
  option("consumer_film", "consumer 35mm film camera capture response with visible grain and limited tonal latitude", ["camera", "film", "35mm", "grain"], {
    compatibility: {
      preferredTags: ["35mm"],
      supportedTags: ["film"],
      discouragedTags: ["digital", "instant", "medium-format"],
      warningKey: responseMismatchWarning,
    },
  }),
  option("medium_format_film", "medium-format film camera capture response with fine grain and smooth tonal gradation", ["camera", "film", "medium-format", "grain"], {
    compatibility: {
      preferredTags: ["medium-format"],
      supportedTags: ["film"],
      discouragedTags: ["digital", "instant", "35mm"],
      warningKey: responseMismatchWarning,
    },
  }),
  option("instant_film", "instant-film camera capture response with limited dynamic range and soft tonal transitions", ["camera", "film", "instant"], {
    compatibility: {
      preferredTags: ["instant"],
      supportedTags: ["film"],
      discouragedTags: ["digital", "35mm", "medium-format"],
      warningKey: responseMismatchWarning,
    },
  }),
  option("experimental_film", "experimental film camera capture response with irregular color and grain behavior", ["camera", "film", "experimental", "grain"], {
    compatibility: {
      supportedTags: ["film"],
      discouragedTags: ["digital"],
      warningKey: responseMismatchWarning,
    },
  }),
  option("compressed_digital", "compressed digital camera capture response with reduced tonal latitude and visible processing", ["camera", "digital", "compressed"], {
    compatibility: {
      preferredTags: ["integrated", "fixed"],
      supportedTags: ["digital"],
      discouragedTags: ["film"],
      warningKey: responseMismatchWarning,
    },
  }),
];

const lensProfileOptions: ModuleFieldOption[] = [
  option("macro", "macro-lens optics with close-focus capability", ["camera", "lens", "macro"]),
  option("fisheye", "fisheye lens optics with pronounced barrel distortion and curved field rendering", ["camera", "lens", "fisheye", "distortion"]),
  option("ultra_wide", "ultra-wide-angle lens optics with strong perspective expansion", ["camera", "lens", "ultra-wide"]),
  option("wide_angle", "wide-angle lens optics with expanded field of view", ["camera", "lens", "wide-angle"]),
  option("standard", "standard-lens optics with natural perspective", ["camera", "lens", "standard"]),
  option("short_telephoto", "short-telephoto lens optics with mild perspective compression", ["camera", "lens", "short-telephoto"]),
  option("telephoto", "telephoto lens optics with strong perspective compression", ["camera", "lens", "telephoto"]),
  option("fixed_23mm_wide", "fixed 23mm wide-normal lens optics", ["camera", "lens", "fixed", "23mm"], {
    compatibility: {
      preferredTags: ["fixed-23mm"],
      discouragedTags: ["interchangeable-lens", "fixed-28mm", "fixed-38mm", "integral-instant-lens", "twin-lens", "simple-fixed-lens"],
      warningKey: lensMismatchWarning,
    },
  }),
  option("fixed_28mm_wide", "fixed 28mm wide-angle lens optics", ["camera", "lens", "fixed", "28mm"], {
    compatibility: {
      preferredTags: ["fixed-28mm"],
      discouragedTags: ["interchangeable-lens", "fixed-23mm", "fixed-38mm", "integral-instant-lens", "twin-lens", "simple-fixed-lens"],
      warningKey: lensMismatchWarning,
    },
  }),
  option("fixed_38mm", "fixed 38mm lens optics with a mildly wide field of view", ["camera", "lens", "fixed", "38mm"], {
    compatibility: {
      preferredTags: ["fixed-38mm"],
      discouragedTags: ["interchangeable-lens", "fixed-23mm", "fixed-28mm", "integral-instant-lens", "twin-lens", "simple-fixed-lens"],
      warningKey: lensMismatchWarning,
    },
  }),
  option("simple_fixed_wide", "simple fixed wide-angle lens optics with visible optical imperfections", ["camera", "lens", "fixed", "simple"], {
    compatibility: {
      preferredTags: ["simple-fixed-lens"],
      discouragedTags: ["interchangeable-lens", "fixed-23mm", "fixed-28mm", "fixed-38mm", "integral-instant-lens", "twin-lens"],
      warningKey: lensMismatchWarning,
    },
  }),
  option("integral_instant_lens", "integral instant-camera lens optics with moderate softness and simple optical rendering", ["camera", "lens", "instant", "fixed"], {
    compatibility: {
      preferredTags: ["integral-instant-lens", "instant"],
      discouragedTags: ["digital", "35mm", "medium-format"],
      warningKey: lensMismatchWarning,
    },
  }),
  option("twin_lens_medium_format", "medium-format twin-lens-reflex optical character", ["camera", "lens", "medium-format", "twin-lens"], {
    compatibility: {
      preferredTags: ["twin-lens"],
      discouragedTags: ["digital", "35mm", "instant", "interchangeable-lens", "fixed-23mm", "fixed-28mm", "fixed-38mm", "simple-fixed-lens"],
      warningKey: lensMismatchWarning,
    },
  }),
];

const focusDepthOptions: ModuleFieldOption[] = [
  option("shallow", "shallow depth of field", ["camera", "focus", "shallow"]),
  option("moderate", "moderate depth of field", ["camera", "focus", "moderate"]),
  option("deep", "deep depth of field", ["camera", "focus", "deep"]),
  option("fixed_focus_deep", "fixed-focus camera behavior with broadly deep depth of field", ["camera", "focus", "fixed-focus", "deep"]),
  option("critical_focus", "precise critical-focus camera rendering", ["camera", "focus", "critical"]),
];

const captureBehaviorOptions: ModuleFieldOption[] = [
  option("tripod_stable", "stable tripod-mounted camera capture", ["camera", "capture", "stable", "tripod"]),
  option("handheld_subtle", "subtle handheld camera instability with restrained micro-shake", ["camera", "capture", "handheld", "subtle"]),
  option("handheld_active", "active handheld camera capture with visible recording instability", ["camera", "capture", "handheld", "active"]),
  option("stabilized", "stabilized camera capture with reduced micro-shake", ["camera", "capture", "stabilized"]),
  option("fixed_mounted", "fixed mounted-camera capture", ["camera", "capture", "fixed"]),
];

function cameraPreset(
  id: string,
  order: number,
  values: Partial<ModuleValues>,
): ModulePreset {
  return {
    id,
    order,
    values: {
      captureSystem: "",
      captureResponse: "",
      lensProfile: "",
      focusDepth: "",
      captureBehavior: "",
      ...values,
    },
  };
}

const cameraPresets: Record<string, ModulePreset> = {
  polaroid_sx70: cameraPreset("polaroid_sx70", 100, {
    captureSystem: "polaroid_sx70",
    captureResponse: "instant_film",
    lensProfile: "integral_instant_lens",
    focusDepth: "moderate",
  }),
  kodak_disposable: cameraPreset("kodak_disposable", 110, {
    captureSystem: "kodak_disposable",
    captureResponse: "consumer_film",
    lensProfile: "simple_fixed_wide",
    focusDepth: "fixed_focus_deep",
  }),
  canon_ae1: cameraPreset("canon_ae1", 120, { captureSystem: "canon_ae1", captureResponse: "film_35mm" }),
  nikon_f3: cameraPreset("nikon_f3", 130, { captureSystem: "nikon_f3", captureResponse: "film_35mm" }),
  pentax_k1000: cameraPreset("pentax_k1000", 140, { captureSystem: "pentax_k1000", captureResponse: "film_35mm" }),
  leica_m6: cameraPreset("leica_m6", 150, { captureSystem: "leica_m6", captureResponse: "film_35mm" }),
  hasselblad_500c: cameraPreset("hasselblad_500c", 160, { captureSystem: "hasselblad_500c", captureResponse: "medium_format_film" }),
  rolleiflex: cameraPreset("rolleiflex", 170, {
    captureSystem: "rolleiflex",
    captureResponse: "medium_format_film",
    lensProfile: "twin_lens_medium_format",
    focusDepth: "moderate",
  }),
  contax_t2: cameraPreset("contax_t2", 180, {
    captureSystem: "contax_t2",
    captureResponse: "film_35mm",
    lensProfile: "fixed_38mm",
    focusDepth: "moderate",
  }),
  lomography: cameraPreset("lomography", 190, {
    captureSystem: "lomography",
    captureResponse: "experimental_film",
    lensProfile: "simple_fixed_wide",
  }),

  canon_eos_r5: cameraPreset("canon_eos_r5", 200, { captureSystem: "canon_eos_r5", captureResponse: "high_resolution_digital" }),
  nikon_z8: cameraPreset("nikon_z8", 210, { captureSystem: "nikon_z8", captureResponse: "neutral_digital" }),
  sony_a7r_iv: cameraPreset("sony_a7r_iv", 220, { captureSystem: "sony_a7r_iv", captureResponse: "high_resolution_digital" }),
  sony_a7s_iii: cameraPreset("sony_a7s_iii", 230, { captureSystem: "sony_a7s_iii", captureResponse: "low_light_digital" }),
  fujifilm_x100v: cameraPreset("fujifilm_x100v", 240, {
    captureSystem: "fujifilm_x100v",
    captureResponse: "xtrans_digital",
    lensProfile: "fixed_23mm_wide",
  }),
  fujifilm_gfx_100s: cameraPreset("fujifilm_gfx_100s", 250, { captureSystem: "fujifilm_gfx_100s", captureResponse: "medium_format_digital" }),
  leica_q2: cameraPreset("leica_q2", 260, {
    captureSystem: "leica_q2",
    captureResponse: "neutral_digital",
    lensProfile: "fixed_28mm_wide",
  }),
  leica_sl2: cameraPreset("leica_sl2", 270, { captureSystem: "leica_sl2", captureResponse: "neutral_digital" }),
  hasselblad_x2d: cameraPreset("hasselblad_x2d", 280, { captureSystem: "hasselblad_x2d", captureResponse: "medium_format_digital" }),
  red_komodo: cameraPreset("red_komodo", 290, { captureSystem: "red_komodo", captureResponse: "cinema_digital" }),
  arri_alexa: cameraPreset("arri_alexa", 300, { captureSystem: "arri_alexa", captureResponse: "cinema_digital" }),
  blackmagic_pocket: cameraPreset("blackmagic_pocket", 310, { captureSystem: "blackmagic_pocket", captureResponse: "cinema_digital" }),
};

export const CameraModule = {
  key: "camera",
  icon: "camera",

  groups: {
    capture: { id: "capture", order: 10, defaultOpen: true },
    optics: { id: "optics", order: 20, defaultOpen: true },
    behavior: { id: "behavior", order: 30, defaultOpen: false },
    advanced: { id: "advanced", order: 40, defaultOpen: false },
    override: { id: "override", order: 50, defaultOpen: false },
  },

  presets: cameraPresets,
  presetUi: {
    component: "select",
    group: "capture",
    order: 5,
    allowNone: true,
    resetOnNone: true,
  },

  fields: {
    captureSystem: {
      id: "captureSystem",
      type: "select",
      default: "",
      group: "capture",
      order: 10,
      options: captureSystemOptions,
      ui: {
        component: "select",
        optionLayout: "categorized",
        searchable: true,
        clearable: true,
        width: "full",
      },
    },
    captureResponse: {
      id: "captureResponse",
      type: "select",
      default: "",
      group: "capture",
      order: 20,
      options: captureResponseOptions,
      ui: {
        component: "select",
        searchable: true,
        clearable: true,
        width: "full",
        compatibility: {
          dependsOn: "captureSystem",
          mode: "sort-and-hint",
        },
      },
    },
    lensProfile: {
      id: "lensProfile",
      type: "select",
      default: "",
      group: "optics",
      order: 10,
      options: lensProfileOptions,
      ui: {
        component: "select",
        searchable: true,
        clearable: true,
        width: "half",
        compatibility: {
          dependsOn: "captureSystem",
          mode: "sort-and-hint",
        },
      },
    },
    focusDepth: {
      id: "focusDepth",
      type: "select",
      default: "",
      group: "optics",
      order: 20,
      options: focusDepthOptions,
      ui: { component: "select", searchable: true, clearable: true, width: "half" },
    },
    captureBehavior: {
      id: "captureBehavior",
      type: "select",
      default: "",
      group: "behavior",
      order: 10,
      options: captureBehaviorOptions,
      ui: { component: "select", searchable: true, clearable: true, width: "full" },
    },
    extraDetails: {
      id: "extraDetails",
      type: "textarea",
      default: "",
      group: "advanced",
      order: 10,
      ui: { component: "textarea", rows: 3, width: "full" },
    },
    customText: {
      id: "customText",
      type: "textarea",
      default: "",
      group: "override",
      order: 10,
      isOverride: true,
      ui: { component: "textarea", rows: 4, width: "full" },
    },
  },

  compile: {
    fieldOrder: [
      "captureSystem",
      "captureResponse",
      "lensProfile",
      "focusDepth",
      "captureBehavior",
      "extraDetails",
    ],
    separator: ", ",
    removeDuplicates: true,
    ignoreEmpty: true,
    overrideField: "customText",
  },
} satisfies PromptKeyModule;
