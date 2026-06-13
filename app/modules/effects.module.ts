import type { PromptKeyModule } from "./types";

const effectOptions = [
  // 1. Photographic Effects
  { value: "film_grain", category: "photographic", categoryLabel: "Photographic Effects", promptText: "film grain effect, subtle texture and visual noise", tags: ["effect", "photographic"] },
  { value: "subtle_vignette", category: "photographic", categoryLabel: "Photographic Effects", promptText: "subtle vignette, gradual darkening around edges", tags: ["effect", "photographic"] },
  { value: "lens_flare", category: "photographic", categoryLabel: "Photographic Effects", promptText: "lens flare effect, controlled highlight streaks", tags: ["effect", "photographic"] },
  { value: "chromatic_aberration", category: "photographic", categoryLabel: "Photographic Effects", promptText: "chromatic aberration, subtle color shift at edges", tags: ["effect", "photographic"] },
  { value: "shallow_bloom", category: "photographic", categoryLabel: "Photographic Effects", promptText: "shallow bloom effect, soft highlight glow", tags: ["effect", "photographic"] },
  { value: "soft_focus", category: "photographic", categoryLabel: "Photographic Effects", promptText: "soft focus, slight blurring for a dreamy look", tags: ["effect", "photographic"] },
  { value: "motion_blur", category: "photographic", categoryLabel: "Photographic Effects", promptText: "motion blur effect, directional streaks indicating movement", tags: ["effect", "photographic"] },
  { value: "depth_haze", category: "photographic", categoryLabel: "Photographic Effects", promptText: "depth haze effect, subtle atmospheric fade for distance", tags: ["effect", "photographic"] },

  // 2. Film / Analog Effects
  { value: "analog_film_grain", category: "film_analog", categoryLabel: "Film / Analog Effects", promptText: "analog film grain, nostalgic texture and noise", tags: ["effect", "film"] },
  { value: "vintage_film_look", category: "film_analog", categoryLabel: "Film / Analog Effects", promptText: "vintage film look, muted color and aged texture", tags: ["effect", "film"] },
  { value: "35mm_film_effect", category: "film_analog", categoryLabel: "Film / Analog Effects", promptText: "35mm film effect, classic cinematic grain and color", tags: ["effect", "film"] },
  { value: "vhs_tape_effect", category: "film_analog", categoryLabel: "Film / Analog Effects", promptText: "VHS tape effect, low resolution retro aesthetic", tags: ["effect", "film"] },
  { value: "light_leak_effect", category: "film_analog", categoryLabel: "Film / Analog Effects", promptText: "light leak effect, colorful accidental illumination", tags: ["effect", "film"] },
  { value: "dust_and_scratches", category: "film_analog", categoryLabel: "Film / Analog Effects", promptText: "dust and scratches overlay for aged film feel", tags: ["effect", "film"] },

  // 3. Digital / Glitch Effects
  { value: "glitch_distortion", category: "digital_glitch", categoryLabel: "Digital / Glitch Effects", promptText: "glitch distortion, erratic visual digital artifacts", tags: ["effect", "digital"] },
  { value: "rgb_split_effect", category: "digital_glitch", categoryLabel: "Digital / Glitch Effects", promptText: "RGB split effect, chromatic color displacement", tags: ["effect", "digital"] },
  { value: "datamosh_artifact", category: "digital_glitch", categoryLabel: "Digital / Glitch Effects", promptText: "datamosh artifact effect, pixel displacement and motion", tags: ["effect", "digital"] },
  { value: "pixel_sorting", category: "digital_glitch", categoryLabel: "Digital / Glitch Effects", promptText: "pixel sorting effect, stretched pixel patterns", tags: ["effect", "digital"] },
  { value: "scanline_effect", category: "digital_glitch", categoryLabel: "Digital / Glitch Effects", promptText: "scanline effect, horizontal line texture overlay", tags: ["effect", "digital"] },
  { value: "digital_noise", category: "digital_glitch", categoryLabel: "Digital / Glitch Effects", promptText: "digital noise overlay, subtle pixel-level randomness", tags: ["effect", "digital"] },
  { value: "screen_distortion", category: "digital_glitch", categoryLabel: "Digital / Glitch Effects", promptText: "screen distortion, visual misalignment or bending", tags: ["effect", "digital"] },
  { value: "lowres_artifact", category: "digital_glitch", categoryLabel: "Digital / Glitch Effects", promptText: "low-resolution digital artifact, pixelated aesthetic", tags: ["effect", "digital"] },

  // 4. Print / Poster Effects
  { value: "halftone_effect", category: "print_poster", categoryLabel: "Print / Poster Effects", promptText: "halftone dot pattern overlay for poster style", tags: ["effect", "print"] },
  { value: "risograph_misregistration", category: "print_poster", categoryLabel: "Print / Poster Effects", promptText: "risograph misregistration style, slight color offset", tags: ["effect", "print"] },
  { value: "screen_print_texture", category: "print_poster", categoryLabel: "Print / Poster Effects", promptText: "screen print texture overlay, graphic poster feel", tags: ["effect", "print"] },
  { value: "comic_dot_shading", category: "print_poster", categoryLabel: "Print / Poster Effects", promptText: "comic dot shading for graphic effect", tags: ["effect", "print"] },

  // 5. Light / Glow Effects
  { value: "bloom_glow", category: "light_glow", categoryLabel: "Light / Glow Effects", promptText: "bloom glow, soft luminous highlights", tags: ["effect", "light"] },
  { value: "neon_glow", category: "light_glow", categoryLabel: "Light / Glow Effects", promptText: "neon glow effect, colored illumination", tags: ["effect", "light"] },
  { value: "soft_halo", category: "light_glow", categoryLabel: "Light / Glow Effects", promptText: "soft halo effect, gentle surrounding light", tags: ["effect", "light"] },
  { value: "sparkle_highlights", category: "light_glow", categoryLabel: "Light / Glow Effects", promptText: "sparkle highlights, shiny particle effect", tags: ["effect", "light"] },

  // 6. Motion / Energy Effects
  { value: "speed_lines", category: "motion_energy", categoryLabel: "Motion / Energy Effects", promptText: "speed lines for dynamic motion", tags: ["effect", "motion"] },
  { value: "motion_trails", category: "motion_energy", categoryLabel: "Motion / Energy Effects", promptText: "motion trails behind moving objects", tags: ["effect", "motion"] },
  { value: "energy_aura", category: "motion_energy", categoryLabel: "Motion / Energy Effects", promptText: "energy aura surrounding subject", tags: ["effect", "motion"] },

  // 7. Atmospheric Effects
  { value: "fog_overlay", category: "atmospheric", categoryLabel: "Atmospheric Effects", promptText: "fog overlay, subtle atmospheric haze", tags: ["effect", "atmosphere"] },
  { value: "misty_glow", category: "atmospheric", categoryLabel: "Atmospheric Effects", promptText: "misty soft glow, dreamlike atmosphere", tags: ["effect", "atmosphere"] },
  { value: "dust_particles", category: "atmospheric", categoryLabel: "Atmospheric Effects", promptText: "floating dust particles, adding environmental realism", tags: ["effect", "atmosphere"] },
  { value: "rain_droplets", category: "atmospheric", categoryLabel: "Atmospheric Effects", promptText: "rain droplets effect, wet surface interaction", tags: ["effect", "atmosphere"] },

  // 8. Surreal / Magical Effects
  { value: "magical_particles", category: "surreal_magical", categoryLabel: "Surreal / Magical Effects", promptText: "magical particles floating around subject", tags: ["effect", "magical"] },
  { value: "floating_sparkles", category: "surreal_magical", categoryLabel: "Surreal / Magical Effects", promptText: "floating sparkles for fantasy feel", tags: ["effect", "magical"] },
  { value: "ethereal_aura", category: "surreal_magical", categoryLabel: "Surreal / Magical Effects", promptText: "ethereal aura surrounding subject", tags: ["effect", "magical"] },

  // 9. UI / Graphic Overlay Effects
  { value: "hud_overlay", category: "ui_graphic", categoryLabel: "UI / Graphic Overlay Effects", promptText: "HUD overlay or interface graphics", tags: ["effect", "ui"] },
  { value: "comic_speech_bubble", category: "ui_graphic", categoryLabel: "UI / Graphic Overlay Effects", promptText: "comic speech bubble style overlay", tags: ["effect", "ui"] },

  // 10. Quality Degradation Effects
  { value: "low_quality", category: "quality_degradation", categoryLabel: "Quality Degradation Effects", promptText: "intentional low quality, pixelation or artifacts", tags: ["effect", "quality"] },
  { value: "jpeg_artifacts", category: "quality_degradation", categoryLabel: "Quality Degradation Effects", promptText: "JPEG compression artifacts, retro degraded look", tags: ["effect", "quality"] },
  { value: "pixelated_image", category: "quality_degradation", categoryLabel: "Quality Degradation Effects", promptText: "pixelated image effect, low-res style", tags: ["effect", "quality"] },
];

const intensityOptions = [
  { value: "subtle", promptText: "subtle effect intensity, very soft impact" },
  { value: "balanced", promptText: "balanced effect intensity, moderate impact" },
  { value: "strong", promptText: "strong effect intensity, highly visible impact" },
  { value: "extreme", promptText: "extreme effect intensity, dramatic stylization" },
];

export const EffectsModule: PromptKeyModule = {
  key: "effects",
  icon: "magic-star",

  groups: {
    core: { id: "core", order: 10, defaultOpen: true },
    advanced: { id: "advanced", order: 20, defaultOpen: false },
    override: { id: "override", order: 30, defaultOpen: false },
  },

  fields: {
    effectStyle: {
      id: "effectStyle",
      type: "multiSelect",
      group: "core",
      order: 10,
      options: effectOptions,
      ui: {
        component: "multiSelect",
        optionLayout: "categorized",
        searchable: true,
        clearable: true,
        width: "full",
      },
    },
    effectIntensity: {
      id: "effectIntensity",
      type: "select",
      group: "core",
      order: 20,
      options: intensityOptions,
      ui: {
        component: "select",
        width: "full",
      },
    },
    extraDetails: {
      id: "extraDetails",
      type: "textarea",
      group: "advanced",
      order: 10,
      ui: { component: "textarea", rows: 3, width: "full" },
    },
    customText: {
      id: "customText",
      type: "textarea",
      group: "override",
      order: 10,
      isOverride: true,
      ui: { component: "textarea", rows: 4, width: "full" },
    },
  },

  compile: {
    separator: ", ",
    removeDuplicates: true,
    ignoreEmpty: true,
    overrideField: "customText",
  },
};