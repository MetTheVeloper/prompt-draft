import type { PromptKeyModule } from "./types";

const cameraOptions = [
  // 1. General
  {
    value: "macro_lens",
    category: "general",
    categoryLabel: "General",
    promptText: "macro lens look, detailed close-up capture",
    tags: ["camera", "general"],
  },
  {
    value: "fisheye_lens",
    category: "general",
    categoryLabel: "General",
    promptText: "fisheye lens distortion, wide circular perspective",
    tags: ["camera", "general"],
  },
  {
    value: "wide_angle_lens",
    category: "general",
    categoryLabel: "General",
    promptText: "wide-angle lens look, expansive field of view",
    tags: ["camera", "general"],
  },
  {
    value: "ultra_wide_angle",
    category: "general",
    categoryLabel: "General",
    promptText: "ultra wide-angle lens look, exaggerated perspective",
    tags: ["camera", "general"],
  },
  {
    value: "telephoto_compression",
    category: "general",
    categoryLabel: "General",
    promptText: "telephoto lens compression, shallow depth, focused subject",
    tags: ["camera", "general"],
  },
  {
    value: "portrait_lens",
    category: "general",
    categoryLabel: "General",
    promptText: "portrait lens look, flattering subject proportions",
    tags: ["camera", "general"],
  },
  {
    value: "shallow_dof",
    category: "general",
    categoryLabel: "General",
    promptText: "shallow depth-of-field, blurred background, focused subject",
    tags: ["camera", "general"],
  },
  {
    value: "deep_focus",
    category: "general",
    categoryLabel: "General",
    promptText: "deep focus camera look, everything in sharp focus",
    tags: ["camera", "general"],
  },
  {
    value: "documentary_camera",
    category: "general",
    categoryLabel: "General",
    promptText: "documentary style camera, realistic capture",
    tags: ["camera", "general"],
  },
  {
    value: "cinematic_camera",
    category: "general",
    categoryLabel: "General",
    promptText: "cinematic camera look, dramatic composition and feel",
    tags: ["camera", "general"],
  },
  {
    value: "handheld_camera",
    category: "general",
    categoryLabel: "General",
    promptText: "handheld camera feel, slight motion and realism",
    tags: ["camera", "general"],
  },
  {
    value: "security_camera",
    category: "general",
    categoryLabel: "General",
    promptText: "security camera perspective, top-down surveillance look",
    tags: ["camera", "general"],
  },
  {
    value: "webcam_camera",
    category: "general",
    categoryLabel: "General",
    promptText: "webcam camera look, frontal and casual",
    tags: ["camera", "general"],
  },
  {
    value: "smartphone_camera",
    category: "general",
    categoryLabel: "General",
    promptText: "smartphone camera look, casual snapshot style",
    tags: ["camera", "general"],
  },
  {
    value: "action_camera",
    category: "general",
    categoryLabel: "General",
    promptText: "action camera look, immersive and dynamic",
    tags: ["camera", "general"],
  },
  {
    value: "aerial_drone",
    category: "general",
    categoryLabel: "General",
    promptText: "aerial drone camera, top-down or sweeping perspective",
    tags: ["camera", "general"],
  },

  // 2. Analog Cameras
  {
    value: "polaroid_sx70",
    category: "analog",
    categoryLabel: "Analog Cameras",
    promptText:
      "Polaroid SX-70 instant camera look, nostalgic instant photo feel",
    tags: ["camera", "analog"],
  },
  {
    value: "kodak_disposable",
    category: "analog",
    categoryLabel: "Analog Cameras",
    promptText: "Kodak disposable camera look, casual retro style",
    tags: ["camera", "analog"],
  },
  {
    value: "canon_ae1",
    category: "analog",
    categoryLabel: "Analog Cameras",
    promptText: "Canon AE-1 film camera look, classic 35mm photo style",
    tags: ["camera", "analog"],
  },
  {
    value: "nikon_f3",
    category: "analog",
    categoryLabel: "Analog Cameras",
    promptText: "Nikon F3 film camera look, professional vintage photo style",
    tags: ["camera", "analog"],
  },
  {
    value: "pentax_k1000",
    category: "analog",
    categoryLabel: "Analog Cameras",
    promptText:
      "Pentax K1000 film camera look, classic student film camera style",
    tags: ["camera", "analog"],
  },
  {
    value: "leica_m6",
    category: "analog",
    categoryLabel: "Analog Cameras",
    promptText: "Leica M6 rangefinder look, crisp and refined film photography",
    tags: ["camera", "analog"],
  },
  {
    value: "hasselblad_500c",
    category: "analog",
    categoryLabel: "Analog Cameras",
    promptText:
      "Hasselblad 500C/M medium-format look, high-quality classic photography",
    tags: ["camera", "analog"],
  },
  {
    value: "rolleiflex",
    category: "analog",
    categoryLabel: "Analog Cameras",
    promptText:
      "Rolleiflex twin-lens reflex camera look, square medium-format aesthetic",
    tags: ["camera", "analog"],
  },
  {
    value: "contax_t2",
    category: "analog",
    categoryLabel: "Analog Cameras",
    promptText: "Contax T2 compact film camera look, stylish analog snapshot",
    tags: ["camera", "analog"],
  },
  {
    value: "lomography",
    category: "analog",
    categoryLabel: "Analog Cameras",
    promptText: "Lomography film camera look, experimental vintage style",
    tags: ["camera", "analog"],
  },

  // 3. Digital Cameras
  {
    value: "canon_eos_r5",
    category: "digital",
    categoryLabel: "Digital Cameras",
    promptText: "Canon EOS R5 digital camera look, high resolution DSLR style",
    tags: ["camera", "digital"],
  },
  {
    value: "nikon_z8",
    category: "digital",
    categoryLabel: "Digital Cameras",
    promptText:
      "Nikon Z8 digital camera look, modern full-frame mirrorless style",
    tags: ["camera", "digital"],
  },
  {
    value: "sony_a7r_iv",
    category: "digital",
    categoryLabel: "Digital Cameras",
    promptText:
      "Sony A7R IV digital camera look, high-detail mirrorless capture",
    tags: ["camera", "digital"],
  },
  {
    value: "sony_a7s_iii",
    category: "digital",
    categoryLabel: "Digital Cameras",
    promptText: "Sony A7S III low-light optimized digital camera look",
    tags: ["camera", "digital"],
  },
  {
    value: "fujifilm_x100v",
    category: "digital",
    categoryLabel: "Digital Cameras",
    promptText: "Fujifilm X100V digital camera look, compact premium style",
    tags: ["camera", "digital"],
  },
  {
    value: "fujifilm_gfx_100s",
    category: "digital",
    categoryLabel: "Digital Cameras",
    promptText: "Fujifilm GFX 100S medium-format digital look",
    tags: ["camera", "digital"],
  },
  {
    value: "leica_q2",
    category: "digital",
    categoryLabel: "Digital Cameras",
    promptText: "Leica Q2 digital camera look, full-frame compact aesthetic",
    tags: ["camera", "digital"],
  },
  {
    value: "leica_sl2",
    category: "digital",
    categoryLabel: "Digital Cameras",
    promptText: "Leica SL2 digital camera look, professional mirrorless style",
    tags: ["camera", "digital"],
  },
  {
    value: "hasselblad_x2d",
    category: "digital",
    categoryLabel: "Digital Cameras",
    promptText:
      "Hasselblad X2D medium-format digital look, ultra-high-res capture",
    tags: ["camera", "digital"],
  },
  {
    value: "red_komodo",
    category: "digital",
    categoryLabel: "Digital Cameras",
    promptText:
      "RED Komodo cinematic digital camera look, compact cinema camera style",
    tags: ["camera", "digital"],
  },
  {
    value: "arri_alexa",
    category: "digital",
    categoryLabel: "Digital Cameras",
    promptText:
      "ARRI Alexa digital cinema camera look, professional cinematic capture",
    tags: ["camera", "digital"],
  },
  {
    value: "blackmagic_pocket",
    category: "digital",
    categoryLabel: "Digital Cameras",
    promptText:
      "Blackmagic Pocket Cinema Camera look, portable cinema camera style",
    tags: ["camera", "digital"],
  },
];

export const CameraModule: PromptKeyModule = {
  key: "camera",
  icon: "camera",

  groups: {
    core: { id: "core", order: 10, defaultOpen: true },
    advanced: { id: "advanced", order: 20, defaultOpen: false },
    override: { id: "override", order: 30, defaultOpen: false },
  },

  fields: {
    cameraStyle: {
      id: "cameraStyle",
      type: "select",
      group: "core",
      order: 10,
      options: cameraOptions,
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
