import type {
  LightingSource,
  ModuleFieldOption,
  ModulePreset,
  ModuleValues,
  PromptKeyModule,
} from "./types";

function option(
  value: string,
  promptText: string,
  tags: string[] = [],
): ModuleFieldOption {
  return { value, promptText, tags };
}

const roleOptions: ModuleFieldOption[] = [
  option("key", "key light", ["lighting", "role", "key"]),
  option("fill", "fill light", ["lighting", "role", "fill"]),
  option("rim", "rim light", ["lighting", "role", "rim", "separation"]),
  option("accent", "accent light", ["lighting", "role", "accent"]),
  option("background", "background light", ["lighting", "role", "background"]),
  option("practical", "practical light", ["lighting", "role", "practical"]),
  option("environment", "environment light", ["lighting", "role", "environment"]),
];

const sourceTypeOptions: ModuleFieldOption[] = [
  option("area_light", "broad area-light source", ["lighting", "source", "area"]),
  option("point_light", "compact point-light source", ["lighting", "source", "point"]),
  option("daylight", "natural daylight source", ["lighting", "source", "daylight"]),
  option("direct_sun", "direct sunlight source", ["lighting", "source", "sun"]),
  option("overcast_sky", "broad overcast-sky illumination", ["lighting", "source", "overcast"]),
  option("window", "window-light source", ["lighting", "source", "window"]),
  option("studio", "controlled studio-light source", ["lighting", "source", "studio"]),
  option("softbox", "large softbox light source", ["lighting", "source", "softbox"]),
  option("spotlight", "focused spotlight source", ["lighting", "source", "spotlight"]),
  option("direct_flash", "direct flash source", ["lighting", "source", "flash"]),
  option("streetlight", "streetlight source", ["lighting", "source", "streetlight"]),
  option("candle", "candlelight source", ["lighting", "source", "candle"]),
  option("fire", "firelight source", ["lighting", "source", "fire"]),
  option("screen", "digital-screen light source", ["lighting", "source", "screen"]),
  option("fluorescent", "fluorescent interior light source", ["lighting", "source", "fluorescent"]),
  option("neon", "neon light source", ["lighting", "source", "neon"]),
  option("stage", "stage-light source", ["lighting", "source", "stage"]),
];

const directionOptions: ModuleFieldOption[] = [
  option("omnidirectional", "from broadly surrounding directions", ["lighting", "direction", "ambient"]),
  option("front", "from the camera-front direction", ["lighting", "direction", "front"]),
  option("camera_left", "from camera-left", ["lighting", "direction", "left"]),
  option("camera_right", "from camera-right", ["lighting", "direction", "right"]),
  option("three_quarter_left", "from camera-left at a three-quarter lighting angle", ["lighting", "direction", "three-quarter", "left"]),
  option("three_quarter_right", "from camera-right at a three-quarter lighting angle", ["lighting", "direction", "three-quarter", "right"]),
  option("back", "from behind the subject", ["lighting", "direction", "back"]),
  option("back_left", "from behind and camera-left", ["lighting", "direction", "back", "left"]),
  option("back_right", "from behind and camera-right", ["lighting", "direction", "back", "right"]),
  option("top", "from above", ["lighting", "direction", "top"]),
  option("below", "from below", ["lighting", "direction", "below"]),
];

const qualityOptions: ModuleFieldOption[] = [
  option("very_soft", "very soft diffused", ["lighting", "quality", "very-soft"]),
  option("soft", "soft", ["lighting", "quality", "soft"]),
  option("balanced", "moderately defined", ["lighting", "quality", "balanced"]),
  option("hard", "hard directional", ["lighting", "quality", "hard"]),
  option("very_hard", "very hard crisp", ["lighting", "quality", "very-hard"]),
];

const intensityOptions: ModuleFieldOption[] = [
  option("dim", "dim", ["lighting", "intensity", "dim"]),
  option("low", "low", ["lighting", "intensity", "low"]),
  option("balanced", "balanced", ["lighting", "intensity", "balanced"]),
  option("bright", "bright", ["lighting", "intensity", "bright"]),
  option("intense", "intense", ["lighting", "intensity", "intense"]),
];

const colorOptions: ModuleFieldOption[] = [
  option("neutral", "neutral-color illumination", ["lighting", "color", "neutral"]),
  option("warm", "warm illumination", ["lighting", "color", "warm"]),
  option("cool", "cool illumination", ["lighting", "color", "cool"]),
  option("amber", "golden-amber illumination", ["lighting", "color", "amber"]),
  option("blue", "blue illumination", ["lighting", "color", "blue"]),
  option("red", "red illumination", ["lighting", "color", "red"]),
  option("magenta", "magenta illumination", ["lighting", "color", "magenta"]),
  option("cyan", "cyan illumination", ["lighting", "color", "cyan"]),
  option("green", "green illumination", ["lighting", "color", "green"]),
  option("purple", "purple illumination", ["lighting", "color", "purple"]),
  option("pastel", "soft pastel-colored illumination", ["lighting", "color", "pastel"]),
  option("custom", "custom-color illumination", ["lighting", "color", "custom"]),
];

const featureOptions: ModuleFieldOption[] = [
  option("patterned_shadows", "structured patterned shadows", ["lighting", "feature", "shadow-pattern"]),
  option("volumetric_beams", "visible volumetric light beams", ["lighting", "feature", "volumetric"]),
  option("halo_backlight", "a controlled backlight halo around subject edges", ["lighting", "feature", "halo", "backlight"]),
  option("silhouette_emphasis", "strong silhouette emphasis through illumination", ["lighting", "feature", "silhouette"]),
];

const ambientLevelOptions: ModuleFieldOption[] = [
  option("none", "no additional ambient fill", ["lighting", "ambient", "none"]),
  option("minimal", "minimal ambient fill", ["lighting", "ambient", "minimal"]),
  option("low", "low ambient illumination", ["lighting", "ambient", "low"]),
  option("balanced", "balanced ambient illumination", ["lighting", "ambient", "balanced"]),
  option("bright", "bright ambient illumination", ["lighting", "ambient", "bright"]),
];

const contrastOptions: ModuleFieldOption[] = [
  option("low", "low overall light-shadow contrast", ["lighting", "contrast", "low"]),
  option("balanced", "balanced overall light-shadow contrast", ["lighting", "contrast", "balanced"]),
  option("high", "high overall light-shadow contrast", ["lighting", "contrast", "high"]),
  option("extreme", "extreme overall light-shadow contrast", ["lighting", "contrast", "extreme"]),
];

function light(
  id: string,
  values: Omit<LightingSource, "id">,
): LightingSource {
  return {
    id,
    role: "",
    sourceType: "",
    direction: "",
    quality: "",
    intensity: "",
    color: "",
    customColor: "",
    features: [],
    ...values,
  };
}

function lightingPreset(
  id: string,
  order: number,
  values: Partial<ModuleValues>,
): ModulePreset {
  return {
    id,
    order,
    values: {
      lightSources: [],
      ambientLevel: "",
      overallContrast: "",
      ...values,
    },
  };
}

const lightingPresets: Record<string, ModulePreset> = {
  soft_diffused: lightingPreset("soft_diffused", 100, {
    lightSources: [
      light("soft-key", {
        role: "key",
        sourceType: "area_light",
        direction: "front",
        quality: "very_soft",
        intensity: "balanced",
        color: "neutral",
      }),
    ],
    ambientLevel: "balanced",
    overallContrast: "low",
  }),

  natural_window: lightingPreset("natural_window", 110, {
    lightSources: [
      light("window-key", {
        role: "key",
        sourceType: "window",
        quality: "soft",
        intensity: "balanced",
        color: "neutral",
      }),
    ],
    ambientLevel: "low",
    overallContrast: "balanced",
  }),

  overcast_daylight: lightingPreset("overcast_daylight", 120, {
    lightSources: [
      light("overcast-environment", {
        role: "environment",
        sourceType: "overcast_sky",
        direction: "omnidirectional",
        quality: "very_soft",
        intensity: "bright",
        color: "neutral",
      }),
    ],
    ambientLevel: "bright",
    overallContrast: "low",
  }),

  golden_hour: lightingPreset("golden_hour", 130, {
    lightSources: [
      light("golden-key", {
        role: "key",
        sourceType: "direct_sun",
        quality: "soft",
        intensity: "bright",
        color: "amber",
      }),
    ],
    ambientLevel: "low",
    overallContrast: "balanced",
  }),

  clean_studio: lightingPreset("clean_studio", 200, {
    lightSources: [
      light("studio-key", {
        role: "key",
        sourceType: "softbox",
        direction: "three_quarter_left",
        quality: "soft",
        intensity: "bright",
        color: "neutral",
      }),
      light("studio-fill", {
        role: "fill",
        sourceType: "area_light",
        direction: "camera_right",
        quality: "very_soft",
        intensity: "low",
        color: "neutral",
      }),
    ],
    ambientLevel: "low",
    overallContrast: "balanced",
  }),

  beauty_studio: lightingPreset("beauty_studio", 210, {
    lightSources: [
      light("beauty-key", {
        role: "key",
        sourceType: "softbox",
        direction: "front",
        quality: "very_soft",
        intensity: "bright",
        color: "neutral",
      }),
      light("beauty-fill", {
        role: "fill",
        sourceType: "area_light",
        direction: "front",
        quality: "very_soft",
        intensity: "balanced",
        color: "neutral",
      }),
    ],
    ambientLevel: "balanced",
    overallContrast: "low",
  }),

  softbox_studio: lightingPreset("softbox_studio", 220, {
    lightSources: [
      light("softbox-key", {
        role: "key",
        sourceType: "softbox",
        direction: "three_quarter_left",
        quality: "soft",
        intensity: "balanced",
        color: "neutral",
      }),
    ],
    ambientLevel: "low",
    overallContrast: "balanced",
  }),

  high_key: lightingPreset("high_key", 230, {
    lightSources: [
      light("high-key-main", {
        role: "key",
        sourceType: "softbox",
        direction: "front",
        quality: "very_soft",
        intensity: "bright",
        color: "neutral",
      }),
      light("high-key-fill", {
        role: "fill",
        sourceType: "area_light",
        direction: "camera_right",
        quality: "very_soft",
        intensity: "bright",
        color: "neutral",
      }),
      light("high-key-background", {
        role: "background",
        sourceType: "area_light",
        direction: "back",
        quality: "soft",
        intensity: "bright",
        color: "neutral",
      }),
    ],
    ambientLevel: "bright",
    overallContrast: "low",
  }),

  low_key: lightingPreset("low_key", 240, {
    lightSources: [
      light("low-key-main", {
        role: "key",
        sourceType: "spotlight",
        direction: "camera_left",
        quality: "hard",
        intensity: "balanced",
        color: "neutral",
      }),
    ],
    ambientLevel: "minimal",
    overallContrast: "high",
  }),

  chiaroscuro: lightingPreset("chiaroscuro", 250, {
    lightSources: [
      light("chiaroscuro-key", {
        role: "key",
        sourceType: "spotlight",
        direction: "camera_left",
        quality: "hard",
        intensity: "bright",
        color: "neutral",
      }),
    ],
    ambientLevel: "minimal",
    overallContrast: "extreme",
  }),

  moody_side: lightingPreset("moody_side", 260, {
    lightSources: [
      light("side-key", {
        role: "key",
        sourceType: "studio",
        direction: "camera_left",
        quality: "hard",
        intensity: "balanced",
        color: "neutral",
      }),
    ],
    ambientLevel: "low",
    overallContrast: "high",
  }),

  backlit_silhouette: lightingPreset("backlit_silhouette", 270, {
    lightSources: [
      light("silhouette-rim", {
        role: "rim",
        sourceType: "studio",
        direction: "back",
        quality: "hard",
        intensity: "bright",
        color: "neutral",
        features: ["silhouette_emphasis"],
      }),
    ],
    ambientLevel: "minimal",
    overallContrast: "high",
  }),

  spotlight: lightingPreset("spotlight", 280, {
    lightSources: [
      light("spotlight-key", {
        role: "key",
        sourceType: "spotlight",
        direction: "front",
        quality: "hard",
        intensity: "bright",
        color: "neutral",
      }),
    ],
    ambientLevel: "low",
    overallContrast: "high",
  }),

  film_noir: lightingPreset("film_noir", 290, {
    lightSources: [
      light("noir-key", {
        role: "key",
        sourceType: "spotlight",
        direction: "camera_left",
        quality: "very_hard",
        intensity: "bright",
        color: "neutral",
        features: ["patterned_shadows"],
      }),
    ],
    ambientLevel: "minimal",
    overallContrast: "extreme",
  }),

  hard_direct: lightingPreset("hard_direct", 300, {
    lightSources: [
      light("hard-key", {
        role: "key",
        sourceType: "point_light",
        direction: "front",
        quality: "hard",
        intensity: "bright",
        color: "neutral",
      }),
    ],
    ambientLevel: "low",
    overallContrast: "high",
  }),

  direct_flash: lightingPreset("direct_flash", 310, {
    lightSources: [
      light("flash-key", {
        role: "key",
        sourceType: "direct_flash",
        direction: "front",
        quality: "very_hard",
        intensity: "intense",
        color: "neutral",
      }),
    ],
    ambientLevel: "low",
    overallContrast: "high",
  }),

  top_hard: lightingPreset("top_hard", 320, {
    lightSources: [
      light("top-key", {
        role: "key",
        sourceType: "studio",
        direction: "top",
        quality: "hard",
        intensity: "bright",
        color: "neutral",
      }),
    ],
    ambientLevel: "low",
    overallContrast: "high",
  }),

  underlight: lightingPreset("underlight", 330, {
    lightSources: [
      light("under-key", {
        role: "key",
        sourceType: "point_light",
        direction: "below",
        quality: "hard",
        intensity: "balanced",
        color: "neutral",
      }),
    ],
    ambientLevel: "low",
    overallContrast: "high",
  }),

  warm_cool_split: lightingPreset("warm_cool_split", 400, {
    lightSources: [
      light("warm-side", {
        role: "accent",
        sourceType: "studio",
        direction: "camera_left",
        quality: "soft",
        intensity: "balanced",
        color: "amber",
      }),
      light("cool-side", {
        role: "accent",
        sourceType: "studio",
        direction: "camera_right",
        quality: "soft",
        intensity: "balanced",
        color: "blue",
      }),
    ],
    ambientLevel: "low",
    overallContrast: "high",
  }),

  blue_red_split: lightingPreset("blue_red_split", 410, {
    lightSources: [
      light("red-left", {
        role: "accent",
        sourceType: "studio",
        direction: "camera_left",
        quality: "soft",
        intensity: "balanced",
        color: "red",
      }),
      light("blue-right", {
        role: "accent",
        sourceType: "studio",
        direction: "camera_right",
        quality: "soft",
        intensity: "balanced",
        color: "blue",
      }),
    ],
    ambientLevel: "low",
    overallContrast: "high",
  }),

  neon_split: lightingPreset("neon_split", 420, {
    lightSources: [
      light("neon-magenta", {
        role: "accent",
        sourceType: "neon",
        direction: "camera_left",
        quality: "hard",
        intensity: "bright",
        color: "magenta",
      }),
      light("neon-cyan", {
        role: "accent",
        sourceType: "neon",
        direction: "camera_right",
        quality: "hard",
        intensity: "bright",
        color: "cyan",
      }),
    ],
    ambientLevel: "low",
    overallContrast: "high",
  }),

  pastel_soft: lightingPreset("pastel_soft", 430, {
    lightSources: [
      light("pastel-key", {
        role: "key",
        sourceType: "area_light",
        direction: "front",
        quality: "very_soft",
        intensity: "balanced",
        color: "pastel",
      }),
    ],
    ambientLevel: "balanced",
    overallContrast: "low",
  }),

  volumetric_spotlight: lightingPreset("volumetric_spotlight", 500, {
    lightSources: [
      light("volumetric-key", {
        role: "key",
        sourceType: "spotlight",
        direction: "back_left",
        quality: "hard",
        intensity: "bright",
        color: "neutral",
        features: ["volumetric_beams"],
      }),
    ],
    ambientLevel: "low",
    overallContrast: "high",
  }),

  rim_separation: lightingPreset("rim_separation", 510, {
    lightSources: [
      light("separation-key", {
        role: "key",
        sourceType: "softbox",
        direction: "three_quarter_left",
        quality: "soft",
        intensity: "balanced",
        color: "neutral",
      }),
      light("separation-rim", {
        role: "rim",
        sourceType: "studio",
        direction: "back_right",
        quality: "hard",
        intensity: "balanced",
        color: "neutral",
      }),
    ],
    ambientLevel: "low",
    overallContrast: "balanced",
  }),

  streetlight_night: lightingPreset("streetlight_night", 600, {
    lightSources: [
      light("street-practical", {
        role: "practical",
        sourceType: "streetlight",
        direction: "top",
        quality: "hard",
        intensity: "low",
        color: "amber",
      }),
    ],
    ambientLevel: "minimal",
    overallContrast: "high",
  }),

  candlelight: lightingPreset("candlelight", 610, {
    lightSources: [
      light("candle-practical", {
        role: "practical",
        sourceType: "candle",
        direction: "camera_left",
        quality: "soft",
        intensity: "low",
        color: "amber",
      }),
    ],
    ambientLevel: "minimal",
    overallContrast: "high",
  }),

  screen_light: lightingPreset("screen_light", 620, {
    lightSources: [
      light("screen-practical", {
        role: "practical",
        sourceType: "screen",
        direction: "front",
        quality: "soft",
        intensity: "low",
        color: "blue",
      }),
    ],
    ambientLevel: "minimal",
    overallContrast: "balanced",
  }),

  firelight: lightingPreset("firelight", 630, {
    lightSources: [
      light("fire-practical", {
        role: "practical",
        sourceType: "fire",
        direction: "camera_left",
        quality: "soft",
        intensity: "low",
        color: "amber",
      }),
    ],
    ambientLevel: "minimal",
    overallContrast: "high",
  }),

  fluorescent_interior: lightingPreset("fluorescent_interior", 640, {
    lightSources: [
      light("fluorescent-environment", {
        role: "environment",
        sourceType: "fluorescent",
        direction: "top",
        quality: "hard",
        intensity: "balanced",
        color: "cool",
      }),
    ],
    ambientLevel: "balanced",
    overallContrast: "balanced",
  }),

  stage_lighting: lightingPreset("stage_lighting", 650, {
    lightSources: [
      light("stage-key", {
        role: "key",
        sourceType: "stage",
        direction: "front",
        quality: "hard",
        intensity: "bright",
        color: "neutral",
      }),
      light("stage-accent", {
        role: "accent",
        sourceType: "stage",
        direction: "camera_right",
        quality: "hard",
        intensity: "balanced",
        color: "magenta",
      }),
    ],
    ambientLevel: "low",
    overallContrast: "high",
  }),

  warm_key_cool_rim: lightingPreset("warm_key_cool_rim", 700, {
    lightSources: [
      light("warm-key", {
        role: "key",
        sourceType: "softbox",
        direction: "three_quarter_left",
        quality: "soft",
        intensity: "balanced",
        color: "warm",
      }),
      light("cool-rim", {
        role: "rim",
        sourceType: "studio",
        direction: "back_right",
        quality: "hard",
        intensity: "balanced",
        color: "blue",
      }),
    ],
    ambientLevel: "low",
    overallContrast: "balanced",
  }),
};

export const LightingModule = {
  key: "lighting",
  icon: "lightbulb",

  groups: {
    sources: { id: "sources", order: 10, defaultOpen: true },
    global: { id: "global", order: 20, defaultOpen: true },
    advanced: { id: "advanced", order: 30, defaultOpen: false },
    override: { id: "override", order: 40, defaultOpen: false },
  },

  presets: lightingPresets,
  presetUi: {
    component: "select",
    group: "sources",
    order: 5,
    allowNone: true,
    resetOnNone: true,
  },

  fields: {
    lightSources: {
      id: "lightSources",
      type: "lightSources",
      default: [],
      group: "sources",
      order: 10,
      config: {
        maxSources: 3,
        roleOptions,
        sourceTypeOptions,
        directionOptions,
        qualityOptions,
        intensityOptions,
        colorOptions,
        featureOptions,
      },
      ui: {
        component: "lightSources",
        width: "full",
      },
    },

    ambientLevel: {
      id: "ambientLevel",
      type: "select",
      default: "",
      group: "global",
      order: 10,
      options: ambientLevelOptions,
      ui: {
        component: "select",
        searchable: true,
        clearable: true,
        width: "half",
      },
    },

    overallContrast: {
      id: "overallContrast",
      type: "select",
      default: "",
      group: "global",
      order: 20,
      options: contrastOptions,
      ui: {
        component: "select",
        searchable: true,
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
    fieldOrder: ["lightSources", "ambientLevel", "overallContrast", "extraDetails"],
    separator: ", ",
    removeDuplicates: true,
    ignoreEmpty: true,
    overrideField: "customText",
  },
} satisfies PromptKeyModule;
