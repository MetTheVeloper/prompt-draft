import type {
  EffectLayer,
  ModuleFieldOption,
  ModulePreset,
  ModuleValues,
  PromptKeyModule,
} from "./types";

function option(
  value: string,
  promptText: string,
  category: string,
  tags: string[] = [],
): ModuleFieldOption {
  return {
    value,
    promptText,
    category,
    categoryLabelKey: `modules.effects.fields.effectLayers.categories.${category}`,
    tags,
  };
}

const effectTypeOptions: ModuleFieldOption[] = [
  option("vignette", "vignette post-processing with gradual edge darkening", "post_processing", ["post", "vignette"]),
  option("highlight_bloom", "post-processing bloom around bright highlights", "post_processing", ["post", "bloom"]),
  option("added_film_grain", "added film-grain overlay independent of capture medium", "post_processing", ["post", "grain"]),
  option("synthetic_chromatic_fringing", "synthetic chromatic fringing at high-contrast edges", "post_processing", ["post", "chromatic"]),

  option("light_leak_overlay", "composited light-leak overlay", "analog_damage", ["analog", "overlay"]),
  option("dust_scratches_overlay", "dust-and-scratch film-damage overlay", "analog_damage", ["analog", "damage"]),
  option("film_burn_overlay", "film-burn transition artifact overlay", "analog_damage", ["analog", "damage"]),

  option("glitch_displacement", "digital glitch displacement", "digital_signal", ["digital", "glitch"]),
  option("rgb_channel_split", "RGB channel-split displacement", "digital_signal", ["digital", "rgb"]),
  option("datamosh_artifacts", "datamosh compression-displacement artifacts", "digital_signal", ["digital", "datamosh"]),
  option("pixel_sorting", "pixel-sorting distortion", "digital_signal", ["digital", "pixel"]),
  option("scanlines", "horizontal scanline overlay", "digital_signal", ["digital", "scanline"]),
  option("digital_noise", "added digital signal noise", "digital_signal", ["digital", "noise"]),
  option("vhs_signal_artifacts", "VHS signal-tracking artifacts", "digital_signal", ["digital", "vhs"]),
  option("signal_warping", "digital signal warping and frame misalignment", "digital_signal", ["digital", "warp"]),

  option("jpeg_compression", "JPEG compression artifacts", "degradation", ["degradation", "compression"]),
  option("pixelation", "intentional pixelation", "degradation", ["degradation", "pixel"]),
  option("color_banding", "visible color-banding artifacts", "degradation", ["degradation", "banding"]),

  option("speed_lines", "graphic speed-line overlay", "motion_graphic", ["motion", "graphic"]),
  option("motion_trails", "composited motion trails", "motion_graphic", ["motion", "trail"]),

  option("floating_particles", "composited floating-particle VFX", "scene_vfx", ["vfx", "particles"]),
  option("magical_particles", "composited magical-particle VFX", "scene_vfx", ["vfx", "magical"]),
  option("sparkle_overlay", "composited sparkle-highlight overlay", "scene_vfx", ["vfx", "sparkle"]),
  option("energy_aura", "composited energy-aura VFX around the subject", "scene_vfx", ["vfx", "aura"]),

  option("hud_overlay", "HUD interface overlay", "interface_overlay", ["overlay", "hud"]),
  option("data_readout_overlay", "data-readout interface graphics overlay", "interface_overlay", ["overlay", "interface"]),

  option("custom", "", "custom", ["custom"]),
];

const intensityOptions: ModuleFieldOption[] = [
  { value: "subtle", promptText: "subtle" },
  { value: "restrained", promptText: "restrained" },
  { value: "balanced", promptText: "balanced" },
  { value: "strong", promptText: "strong" },
  { value: "extreme", promptText: "extreme" },
];

function layer(
  id: string,
  effectType: string,
  intensity: string,
  details = "",
): EffectLayer {
  return {
    id,
    effectType,
    intensity,
    customEffect: "",
    details,
  };
}

function preset(
  id: string,
  order: number,
  effectLayers: EffectLayer[],
): ModulePreset {
  return {
    id,
    order,
    values: {
      effectLayers,
    },
  };
}

const presets: Record<string, ModulePreset> = {
  subtle_post_finish: preset("subtle_post_finish", 10, [
    layer("finish-vignette", "vignette", "subtle"),
    layer("finish-bloom", "highlight_bloom", "subtle"),
    layer("finish-grain", "added_film_grain", "restrained"),
  ]),
  analog_damage: preset("analog_damage", 20, [
    layer("analog-leak", "light_leak_overlay", "balanced"),
    layer("analog-damage", "dust_scratches_overlay", "balanced"),
  ]),
  digital_glitch: preset("digital_glitch", 30, [
    layer("glitch-main", "glitch_displacement", "strong"),
    layer("glitch-rgb", "rgb_channel_split", "balanced"),
    layer("glitch-scan", "scanlines", "subtle"),
  ]),
  vhs_signal: preset("vhs_signal", 40, [
    layer("vhs-track", "vhs_signal_artifacts", "strong"),
    layer("vhs-scan", "scanlines", "balanced"),
    layer("vhs-noise", "digital_noise", "balanced"),
  ]),
  degraded_digital: preset("degraded_digital", 50, [
    layer("degrade-jpeg", "jpeg_compression", "balanced"),
    layer("degrade-pixel", "pixelation", "restrained"),
  ]),
  motion_graphic: preset("motion_graphic", 60, [
    layer("motion-lines", "speed_lines", "strong"),
    layer("motion-trails", "motion_trails", "balanced"),
  ]),
  magical_vfx: preset("magical_vfx", 70, [
    layer("magic-particles", "magical_particles", "balanced"),
    layer("magic-sparkle", "sparkle_overlay", "restrained"),
    layer("magic-aura", "energy_aura", "balanced"),
  ]),
  hud_interface: preset("hud_interface", 80, [
    layer("hud-main", "hud_overlay", "balanced"),
    layer("hud-data", "data_readout_overlay", "restrained"),
  ]),
};

export const EffectsModule: PromptKeyModule = {
  key: "effects",
  icon: "auto_awesome",

  groups: {
    core: { id: "core", order: 10, defaultOpen: true },
    advanced: { id: "advanced", order: 20, defaultOpen: false },
    override: { id: "override", order: 30, defaultOpen: false },
  },

  presets,
  presetUi: {
    component: "select",
    group: "core",
    allowNone: true,
    resetOnNone: false,
  },

  fields: {
    effectLayers: {
      id: "effectLayers",
      type: "effectLayers",
      default: [],
      group: "core",
      order: 10,
      ui: {
        component: "effectLayers",
        width: "full",
      },
      config: {
        maxLayers: 8,
        effectTypeOptions,
        intensityOptions,
      },
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
    removeDuplicates: true,
    ignoreEmpty: true,
    overrideField: "customText",
    fieldOrder: ["effectLayers", "extraDetails"],
  },
};
