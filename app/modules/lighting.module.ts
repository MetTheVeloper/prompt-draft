import type { PromptKeyModule } from "./types";

const lightingStyleOptions = [
  // Soft / Natural Lighting
  {
    value: "soft_diffused_light",
    category: "soft_natural",
    categoryLabel: "Soft / Natural Lighting",
    promptText:
      "the lighting must be soft and evenly diffused. Gentle shadows, smooth transitions, low harshness, flattering subject visibility, and a calm natural atmosphere with no aggressive contrast.",
    tags: ["soft", "natural", "diffused"],
  },
  {
    value: "natural_window_light",
    category: "soft_natural",
    categoryLabel: "Soft / Natural Lighting",
    promptText:
      "the lighting must feel like soft light coming from a nearby window. Directional but gentle illumination, realistic shadow falloff, natural skin or surface rendering, and an intimate indoor mood.",
    tags: ["soft", "natural", "window", "indoor"],
  },
  {
    value: "overcast_daylight",
    category: "soft_natural",
    categoryLabel: "Soft / Natural Lighting",
    promptText:
      "the lighting must resemble cloudy outdoor daylight. Even illumination, very soft shadows, muted contrast, broad ambient light, and a realistic calm environment with natural tonal balance.",
    tags: ["soft", "natural", "daylight", "cloudy"],
  },
  {
    value: "gentle_ambient_light",
    category: "soft_natural",
    categoryLabel: "Soft / Natural Lighting",
    promptText:
      "the lighting must be mostly ambient and low-contrast. Soft overall visibility, subtle depth, minimal harsh shadow, and a quiet balanced look that keeps the scene clean and readable.",
    tags: ["soft", "ambient", "low-contrast"],
  },
  {
    value: "warm_natural_light",
    category: "soft_natural",
    categoryLabel: "Soft / Natural Lighting",
    promptText:
      "the lighting must feel naturally warm and pleasant. Soft golden tone, gentle highlights, comfortable shadows, and an inviting atmosphere without becoming overly dramatic.",
    tags: ["warm", "natural", "soft", "golden"],
  },
  {
    value: "cool_natural_light",
    category: "soft_natural",
    categoryLabel: "Soft / Natural Lighting",
    promptText:
      "the lighting must feel naturally cool and calm. Slight blue-toned illumination, soft shadow behavior, clean visibility, and a fresh quiet atmosphere.",
    tags: ["cool", "natural", "soft", "blue"],
  },

  // Studio Lighting
  {
    value: "clean_studio_lighting",
    category: "studio",
    categoryLabel: "Studio Lighting",
    promptText:
      "the lighting must feel professional and controlled. Balanced key light, clean subject visibility, soft shadow management, and a polished studio look suitable for portraits, products, or commercial visuals.",
    tags: ["studio", "professional", "controlled"],
  },
  {
    value: "beauty_lighting",
    category: "studio",
    categoryLabel: "Studio Lighting",
    promptText:
      "the lighting must be flattering and polished. Smooth facial illumination, soft highlights, reduced harsh shadows, refined skin or surface rendering, and a clean premium portrait feel.",
    tags: ["studio", "beauty", "polished", "portrait"],
  },
  {
    value: "softbox_lighting",
    category: "studio",
    categoryLabel: "Studio Lighting",
    promptText:
      "the lighting must resemble a large softbox setup. Broad soft highlights, gentle shadow edges, controlled reflections, and a professional commercial studio atmosphere.",
    tags: ["studio", "softbox", "commercial", "soft"],
  },
  {
    value: "rim_lit_studio_setup",
    category: "studio",
    categoryLabel: "Studio Lighting",
    promptText:
      "the lighting must include clear rim light around the subject edges. Separate the subject from the background, enhance silhouette readability, and maintain a controlled polished studio mood.",
    tags: ["studio", "rim-light", "silhouette", "controlled"],
  },
  {
    value: "high_key_studio_lighting",
    category: "studio",
    categoryLabel: "Studio Lighting",
    promptText:
      "the lighting must be bright, clean, and high-key. Minimal shadows, strong overall brightness, smooth white or light-toned atmosphere, and a fresh commercial presentation.",
    tags: ["studio", "high-key", "bright", "clean"],
  },
  {
    value: "low_key_studio_lighting",
    category: "studio",
    categoryLabel: "Studio Lighting",
    promptText:
      "the lighting must be dark, selective, and low-key. Strong shadow areas, controlled highlights, dramatic subject separation, and a refined moody studio atmosphere.",
    tags: ["studio", "low-key", "dark", "moody"],
  },

  // Cinematic Lighting
  {
    value: "dramatic_cinematic_lighting",
    category: "cinematic",
    categoryLabel: "Cinematic Lighting",
    promptText:
      "the lighting must feel cinematic and emotionally charged. Strong directionality, controlled contrast, deep shadows, selective highlights, and a film-like atmosphere with clear visual storytelling.",
    tags: ["cinematic", "dramatic", "storytelling", "contrast"],
  },
  {
    value: "moody_side_lighting",
    category: "cinematic",
    categoryLabel: "Cinematic Lighting",
    promptText:
      "the lighting must come strongly from one side. Create visible facial or body depth, strong light-shadow separation, dramatic mood, and a more intense cinematic presence.",
    tags: ["cinematic", "side-light", "moody", "dramatic"],
  },
  {
    value: "backlit_silhouette",
    category: "cinematic",
    categoryLabel: "Cinematic Lighting",
    promptText:
      "the lighting must come from behind the subject. Create strong edge glow, partial silhouette, atmospheric separation, and a dramatic cinematic outline with reduced front detail if appropriate.",
    tags: ["cinematic", "backlit", "silhouette", "atmospheric"],
  },
  {
    value: "chiaroscuro_lighting",
    category: "cinematic",
    categoryLabel: "Cinematic Lighting",
    promptText:
      "the lighting must use strong contrast between light and shadow. Sculpt the subject with deep dark areas, bright focused illumination, and a classical dramatic visual structure.",
    tags: ["cinematic", "chiaroscuro", "contrast", "classical"],
  },
  {
    value: "spotlight_lighting",
    category: "cinematic",
    categoryLabel: "Cinematic Lighting",
    promptText:
      "the lighting must isolate the subject with focused illumination. Keep surrounding areas darker or less important, create stage-like emphasis, and make the main subject visually dominant.",
    tags: ["cinematic", "spotlight", "focused", "stage-like"],
  },
  {
    value: "film_noir_lighting",
    category: "cinematic",
    categoryLabel: "Cinematic Lighting",
    promptText:
      "the lighting must feel dark, graphic, and mysterious. Hard directional light, deep shadows, strong contrast patterns, and a moody cinematic atmosphere.",
    tags: ["cinematic", "film-noir", "mysterious", "graphic"],
  },
  {
    value: "golden_hour_cinematic_light",
    category: "cinematic",
    categoryLabel: "Cinematic Lighting",
    promptText:
      "the lighting must feel like cinematic golden hour. Warm low-angle light, soft long shadows, glowing highlights, and a rich emotional atmosphere with natural depth.",
    tags: ["cinematic", "golden-hour", "warm", "emotional"],
  },

  // Hard / Graphic Lighting
  {
    value: "hard_direct_light",
    category: "hard_graphic",
    categoryLabel: "Hard / Graphic Lighting",
    promptText:
      "the lighting must be sharp and direct. Strong shadow edges, bold highlight areas, high shape definition, and a more intense graphic visual result.",
    tags: ["hard", "direct", "graphic", "sharp"],
  },
  {
    value: "harsh_flash_lighting",
    category: "hard_graphic",
    categoryLabel: "Hard / Graphic Lighting",
    promptText:
      "the lighting must resemble direct camera flash. Bright frontal illumination, crisp shadows, strong subject pop, and a raw spontaneous photographic feeling.",
    tags: ["hard", "flash", "camera", "photographic"],
  },
  {
    value: "strong_shadow_pattern",
    category: "hard_graphic",
    categoryLabel: "Hard / Graphic Lighting",
    promptText:
      "the lighting must create visible shadow patterns across the scene. Use graphic shadow shapes, window-blind effects, foliage shadows, or structured light breaks to add visual rhythm.",
    tags: ["hard", "graphic", "shadow-pattern", "rhythm"],
  },
  {
    value: "high_contrast_graphic_lighting",
    category: "hard_graphic",
    categoryLabel: "Hard / Graphic Lighting",
    promptText:
      "the lighting must prioritize bold contrast and readability. Strong separation between light and dark, simplified tonal structure, and a poster-like graphic impact.",
    tags: ["hard", "graphic", "high-contrast", "poster-like"],
  },
  {
    value: "top_hard_light",
    category: "hard_graphic",
    categoryLabel: "Hard / Graphic Lighting",
    promptText:
      "the lighting must come strongly from above. Create downward shadows, sculptural facial or object definition, and a dramatic overhead-lit visual effect.",
    tags: ["hard", "top-light", "overhead", "sculptural"],
  },
  {
    value: "underlighting",
    category: "hard_graphic",
    categoryLabel: "Hard / Graphic Lighting",
    promptText:
      "the lighting must come from below the subject. Create an unusual dramatic effect, exaggerated facial shadows, theatrical tension, and a surreal or mysterious mood.",
    tags: ["hard", "underlighting", "theatrical", "surreal"],
  },

  // Color / Mood Lighting
  {
    value: "warm_cinematic_glow",
    category: "color_mood",
    categoryLabel: "Color / Mood Lighting",
    promptText:
      "the lighting must use warm glowing illumination. Golden or amber highlights, soft atmospheric warmth, emotional richness, and a cinematic inviting mood.",
    tags: ["color", "warm", "glow", "cinematic"],
  },
  {
    value: "cool_blue_mood_light",
    category: "color_mood",
    categoryLabel: "Color / Mood Lighting",
    promptText:
      "the lighting must use cool blue-toned illumination. Calm or mysterious atmosphere, clean shadow depth, modern cinematic mood, and a slightly detached emotional tone.",
    tags: ["color", "cool", "blue", "mood"],
  },
  {
    value: "neon_color_lighting",
    category: "color_mood",
    categoryLabel: "Color / Mood Lighting",
    promptText:
      "the lighting must include vivid neon illumination. Colored highlights, glowing edges, reflective color spill, and a stylized energetic atmosphere with modern visual impact.",
    tags: ["color", "neon", "stylized", "energetic"],
  },
  {
    value: "dual_tone_lighting",
    category: "color_mood",
    categoryLabel: "Color / Mood Lighting",
    promptText:
      "the lighting must use two distinct color directions. Contrasting warm and cool lights, colored rim or side light, strong visual separation, and a cinematic stylized color balance.",
    tags: ["color", "dual-tone", "warm-cool", "cinematic"],
  },
  {
    value: "pastel_lighting",
    category: "color_mood",
    categoryLabel: "Color / Mood Lighting",
    promptText:
      "the lighting must feel soft and pastel-colored. Gentle colored illumination, low harshness, smooth transitions, and a dreamy delicate visual mood.",
    tags: ["color", "pastel", "soft", "dreamy"],
  },
  {
    value: "monochromatic_lighting",
    category: "color_mood",
    categoryLabel: "Color / Mood Lighting",
    promptText:
      "the lighting must use a single dominant color mood. Keep the scene unified through one lighting color, with controlled contrast and a strong stylized atmosphere.",
    tags: ["color", "monochromatic", "stylized", "unified"],
  },
  {
    value: "iridescent_lighting",
    category: "color_mood",
    categoryLabel: "Color / Mood Lighting",
    promptText:
      "the lighting must create shifting colorful highlights. Subtle rainbow-like reflections, luminous color variation, and a glossy futuristic or magical surface presence.",
    tags: ["color", "iridescent", "futuristic", "magical"],
  },

  // Atmospheric Lighting
  {
    value: "hazy_volumetric_light",
    category: "atmospheric",
    categoryLabel: "Atmospheric Lighting",
    promptText:
      "the lighting must include visible atmosphere. Light beams, haze, smoke, mist, or dust particles should make the scene feel deep, cinematic, and spatially rich.",
    tags: ["atmospheric", "volumetric", "haze", "cinematic"],
  },
  {
    value: "misty_soft_glow",
    category: "atmospheric",
    categoryLabel: "Atmospheric Lighting",
    promptText:
      "the lighting must pass through mist or fog. Softened contrast, glowing highlights, reduced sharpness, and a dreamlike atmospheric mood.",
    tags: ["atmospheric", "mist", "fog", "dreamlike"],
  },
  {
    value: "dusty_light_rays",
    category: "atmospheric",
    categoryLabel: "Atmospheric Lighting",
    promptText:
      "the lighting must reveal floating dust or particles. Directional beams, visible air texture, warm or cinematic depth, and a realistic tactile atmosphere.",
    tags: ["atmospheric", "dust", "light-rays", "depth"],
  },
  {
    value: "rainy_reflective_lighting",
    category: "atmospheric",
    categoryLabel: "Atmospheric Lighting",
    promptText:
      "the lighting must interact with wet surfaces. Soft reflections, scattered highlights, glossy ground or background response, and a moody weather-driven atmosphere.",
    tags: ["atmospheric", "rainy", "reflective", "moody"],
  },
  {
    value: "smoky_stage_light",
    category: "atmospheric",
    categoryLabel: "Atmospheric Lighting",
    promptText:
      "the lighting must feel like stage lighting through smoke. Visible beams, dramatic directionality, strong subject separation, and theatrical atmosphere.",
    tags: ["atmospheric", "smoke", "stage", "theatrical"],
  },
  {
    value: "bloom_heavy_glow",
    category: "atmospheric",
    categoryLabel: "Atmospheric Lighting",
    promptText:
      "the lighting must include visible glow and bloom around bright areas. Soft luminous edges, dreamy highlight diffusion, and a more stylized polished atmosphere.",
    tags: ["atmospheric", "bloom", "glow", "stylized"],
  },

  // Subject Separation Lighting
  {
    value: "rim_light",
    category: "subject_separation",
    categoryLabel: "Subject Separation Lighting",
    promptText:
      "the lighting must create a clear rim around the subject. Highlight the outer edges, separate the subject from the background, and improve silhouette readability.",
    tags: ["separation", "rim-light", "silhouette", "subject"],
  },
  {
    value: "edge_highlight",
    category: "subject_separation",
    categoryLabel: "Subject Separation Lighting",
    promptText:
      "the lighting must emphasize thin highlights along key contours. Use controlled edge lighting on hair, shoulders, body outline, or object borders to add definition and depth.",
    tags: ["separation", "edge-light", "contours", "definition"],
  },
  {
    value: "background_separation_light",
    category: "subject_separation",
    categoryLabel: "Subject Separation Lighting",
    promptText:
      "the lighting must separate the subject from the background through tonal contrast. Use brighter or darker background lighting, subtle halo effects, or controlled depth lighting.",
    tags: ["separation", "background", "contrast", "depth"],
  },
  {
    value: "halo_backlight",
    category: "subject_separation",
    categoryLabel: "Subject Separation Lighting",
    promptText:
      "the lighting must create a soft halo around the subject. Use backlighting or background glow to make the subject feel iconic, elevated, or visually important.",
    tags: ["separation", "halo", "backlight", "iconic"],
  },
  {
    value: "silhouette_emphasis",
    category: "subject_separation",
    categoryLabel: "Subject Separation Lighting",
    promptText:
      "the lighting must prioritize the subject's outline. Reduce internal detail if needed, strengthen edge contrast, and create a bold readable silhouette against the background.",
    tags: ["separation", "silhouette", "outline", "bold"],
  },
  {
    value: "subject_focused_light",
    category: "subject_separation",
    categoryLabel: "Subject Separation Lighting",
    promptText:
      "the lighting must guide attention directly to the subject. Keep the main figure brighter or more clearly illuminated than the surroundings while maintaining natural visual balance.",
    tags: ["separation", "subject-focused", "attention", "balance"],
  },

  // Practical / Environmental Lighting
  {
    value: "streetlight_illumination",
    category: "practical_environmental",
    categoryLabel: "Practical / Environmental Lighting",
    promptText:
      "the lighting must feel like it comes from streetlights. Localized pools of light, urban shadows, warm or cool night atmosphere, and realistic environmental falloff.",
    tags: ["practical", "streetlight", "urban", "night"],
  },
  {
    value: "candlelight_glow",
    category: "practical_environmental",
    categoryLabel: "Practical / Environmental Lighting",
    promptText:
      "the lighting must resemble candlelight. Soft flickering warmth, intimate low-light mood, gentle orange highlights, and deep surrounding shadows.",
    tags: ["practical", "candlelight", "warm", "intimate"],
  },
  {
    value: "screen_light",
    category: "practical_environmental",
    categoryLabel: "Practical / Environmental Lighting",
    promptText:
      "the lighting must appear to come from a digital screen. Cool frontal glow, soft facial illumination, subtle color cast, and a modern intimate low-light environment.",
    tags: ["practical", "screen", "digital", "cool"],
  },
  {
    value: "firelight",
    category: "practical_environmental",
    categoryLabel: "Practical / Environmental Lighting",
    promptText:
      "the lighting must resemble fire illumination. Warm unstable highlights, deep shifting shadows, dramatic contrast, and a natural primal atmosphere.",
    tags: ["practical", "firelight", "warm", "dramatic"],
  },
  {
    value: "fluorescent_indoor_light",
    category: "practical_environmental",
    categoryLabel: "Practical / Environmental Lighting",
    promptText:
      "the lighting must feel like fluorescent interior lighting. Even overhead illumination, slightly cool or clinical tone, practical indoor realism, and minimal decorative drama.",
    tags: ["practical", "fluorescent", "indoor", "clinical"],
  },
  {
    value: "stage_lighting",
    category: "practical_environmental",
    categoryLabel: "Practical / Environmental Lighting",
    promptText:
      "the lighting must feel like a controlled performance setup. Strong directional beams, colored or focused lights, theatrical contrast, and a live-show atmosphere.",
    tags: ["practical", "stage", "performance", "theatrical"],
  },

  // Stylized / Artistic Lighting
  {
    value: "anime_style_dramatic_lighting",
    category: "stylized_artistic",
    categoryLabel: "Stylized / Artistic Lighting",
    promptText:
      "the lighting must follow stylized anime-inspired drama. Clean highlight shapes, simplified shadow blocks, strong emotional contrast, and visually designed light behavior rather than pure realism.",
    tags: ["stylized", "anime", "dramatic", "illustrative"],
  },
  {
    value: "comic_book_lighting",
    category: "stylized_artistic",
    categoryLabel: "Stylized / Artistic Lighting",
    promptText:
      "the lighting must feel bold and graphic. Strong shadow shapes, clear highlight zones, high contrast, and simplified dramatic lighting suitable for illustrated or poster-like imagery.",
    tags: ["stylized", "comic-book", "graphic", "high-contrast"],
  },
  {
    value: "painterly_lighting",
    category: "stylized_artistic",
    categoryLabel: "Stylized / Artistic Lighting",
    promptText:
      "the lighting must feel artistically painted. Soft expressive transitions, visible light mood, controlled color temperature, and a handcrafted visual interpretation of illumination.",
    tags: ["stylized", "painterly", "artistic", "handcrafted"],
  },
  {
    value: "toy_render_lighting",
    category: "stylized_artistic",
    categoryLabel: "Stylized / Artistic Lighting",
    promptText:
      "the lighting must make the subject feel like a polished collectible object. Clean studio reflections, soft highlights, readable material response, and playful product-style illumination.",
    tags: ["stylized", "toy", "render", "collectible"],
  },
  {
    value: "claymation_lighting",
    category: "stylized_artistic",
    categoryLabel: "Stylized / Artistic Lighting",
    promptText:
      "the lighting must feel like a handmade stop-motion scene. Soft practical shadows, small-scale studio illumination, tactile surface response, and crafted miniature atmosphere.",
    tags: ["stylized", "claymation", "stop-motion", "miniature"],
  },
  {
    value: "surreal_dream_lighting",
    category: "stylized_artistic",
    categoryLabel: "Stylized / Artistic Lighting",
    promptText:
      "the lighting must feel unreal and poetic. Unnatural glow direction, soft impossible illumination, floating highlights, and a dreamlike emotional atmosphere.",
    tags: ["stylized", "surreal", "dream", "poetic"],
  },
];

export const LightingModule: PromptKeyModule = {
  key: "lighting",
  icon: "lamp",

  groups: {
    core: {
      id: "core",
      order: 10,
      defaultOpen: true,
    },
    advanced: {
      id: "advanced",
      order: 20,
      defaultOpen: false,
    },
    override: {
      id: "override",
      order: 30,
      defaultOpen: false,
    },
  },

  fields: {
    lightingStyle: {
      id: "lightingStyle",
      type: "select",
      default: "",
      group: "core",
      order: 10,
      options: lightingStyleOptions,
      ui: {
        component: "select",
        optionLayout: "categorized",
        searchable: true,
        clearable: true,
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

  compile: {
    separator: ", ",
    removeDuplicates: true,
    ignoreEmpty: true,
    overrideField: "customText",
  },
};
