export default {
  "modules.camera.description":
    "Control how an otherwise unchanged realistic scene is recorded: capture system, image response, lens behavior, focus/depth behavior, and physical capture behavior. Framing, viewpoint, composition, lighting, pose, and visual style remain independent.",

  "modules.camera.groups.capture.title": "Capture System",
  "modules.camera.groups.capture.description":
    "Choose the camera or recording system and its image-response character without changing framing or lighting.",
  "modules.camera.groups.optics.title": "Optics & Focus",
  "modules.camera.groups.optics.description":
    "Control lens behavior and depth-of-field independently from the selected camera body or device.",
  "modules.camera.groups.behavior.title": "Capture Behavior",
  "modules.camera.groups.behavior.description":
    "Describe physical camera handling or recording stability without changing subject placement or composition.",
  "modules.camera.groups.advanced.title": "Advanced Details",
  "modules.camera.groups.advanced.description":
    "Add optional camera-specific instructions not covered by the structured controls.",
  "modules.camera.groups.override.title": "Custom Override",
  "modules.camera.groups.override.description":
    "Replace the generated camera output with your own camera instruction.",

  "modules.camera.fields.captureSystem.label": "Capture System",
  "modules.camera.fields.captureSystem.description":
    "Choose the recording system or specific camera body. This defines the capture platform, not angle, framing, composition, or lighting.",
  "modules.camera.fields.captureSystem.placeholder": "Select capture system",
  "modules.camera.fields.captureSystem.categories.genericDigital": "Generic Digital",
  "modules.camera.fields.captureSystem.categories.genericFilm": "Generic Film",
  "modules.camera.fields.captureSystem.categories.integrated": "Integrated / Fixed Systems",
  "modules.camera.fields.captureSystem.categories.analogModels": "Analog Camera Models",
  "modules.camera.fields.captureSystem.categories.digitalModels": "Digital Camera Models",

  "modules.camera.fields.captureResponse.label": "Capture Response",
  "modules.camera.fields.captureResponse.description":
    "Control sensor or film response such as tonal roll-off, grain/noise character, dynamic-range behavior, and image-response character without changing scene lighting.",
  "modules.camera.fields.captureResponse.placeholder": "Select capture response",

  "modules.camera.fields.lensProfile.label": "Lens Profile",
  "modules.camera.fields.lensProfile.description":
    "Choose optical field-of-view, compression, and distortion behavior. This does not control shot size or viewpoint.",
  "modules.camera.fields.lensProfile.placeholder": "Select lens profile",

  "modules.camera.fields.focusDepth.label": "Focus & Depth",
  "modules.camera.fields.focusDepth.description":
    "Choose the depth-of-field behavior independently from lens profile and framing.",
  "modules.camera.fields.focusDepth.placeholder": "Select focus and depth behavior",

  "modules.camera.fields.captureBehavior.label": "Capture Behavior",
  "modules.camera.fields.captureBehavior.description":
    "Choose physical recording behavior such as tripod stability or subtle handheld instability without forcing composition or motion effects.",
  "modules.camera.fields.captureBehavior.placeholder": "Select capture behavior",

  "modules.camera.fields.extraDetails.label": "Extra Camera Details",
  "modules.camera.fields.extraDetails.description":
    "Add only camera/capture-specific instructions that are not already expressed by the controls above.",
  "modules.camera.fields.extraDetails.placeholder": "Add optional camera details...",

  "modules.camera.fields.customText.label": "Custom Camera Text",
  "modules.camera.fields.customText.description":
    "Write your own camera instruction and replace the generated Camera output.",
  "modules.camera.fields.customText.placeholder": "Write your custom camera text...",

  "modules.camera.presets.polaroid_sx70.label": "Polaroid SX-70",
  "modules.camera.presets.kodak_disposable.label": "Kodak Disposable",
  "modules.camera.presets.canon_ae1.label": "Canon AE-1",
  "modules.camera.presets.nikon_f3.label": "Nikon F3",
  "modules.camera.presets.pentax_k1000.label": "Pentax K1000",
  "modules.camera.presets.leica_m6.label": "Leica M6",
  "modules.camera.presets.hasselblad_500c.label": "Hasselblad 500C/M",
  "modules.camera.presets.rolleiflex.label": "Rolleiflex",
  "modules.camera.presets.contax_t2.label": "Contax T2",
  "modules.camera.presets.lomography.label": "Lomography Camera",
  "modules.camera.presets.canon_eos_r5.label": "Canon EOS R5",
  "modules.camera.presets.nikon_z8.label": "Nikon Z8",
  "modules.camera.presets.sony_a7r_iv.label": "Sony A7R IV",
  "modules.camera.presets.sony_a7s_iii.label": "Sony A7S III",
  "modules.camera.presets.fujifilm_x100v.label": "Fujifilm X100V",
  "modules.camera.presets.fujifilm_gfx_100s.label": "Fujifilm GFX 100S",
  "modules.camera.presets.leica_q2.label": "Leica Q2",
  "modules.camera.presets.leica_sl2.label": "Leica SL2",
  "modules.camera.presets.hasselblad_x2d.label": "Hasselblad X2D",
  "modules.camera.presets.red_komodo.label": "RED Komodo",
  "modules.camera.presets.arri_alexa.label": "ARRI Alexa",
  "modules.camera.presets.blackmagic_pocket.label": "Blackmagic Pocket Cinema Camera",

  "modules.camera.presets.polaroid_sx70.description": "Instant-film capture recipe with the SX-70 system's integral optical and response character.",
  "modules.camera.presets.kodak_disposable.description": "Simple fixed-lens consumer 35mm film capture recipe.",
  "modules.camera.presets.canon_ae1.description": "Canon AE-1 35mm film-body recipe; lens and focus remain independently editable.",
  "modules.camera.presets.nikon_f3.description": "Nikon F3 35mm film-body recipe; lens and focus remain independently editable.",
  "modules.camera.presets.pentax_k1000.description": "Pentax K1000 35mm film-body recipe; lens and focus remain independently editable.",
  "modules.camera.presets.leica_m6.description": "Leica M6 35mm rangefinder-body recipe; lens and focus remain independently editable.",
  "modules.camera.presets.hasselblad_500c.description": "Hasselblad 500C/M medium-format film capture recipe.",
  "modules.camera.presets.rolleiflex.description": "Rolleiflex medium-format twin-lens-reflex capture recipe with fixed-system optical character.",
  "modules.camera.presets.contax_t2.description": "Contax T2 compact 35mm film capture recipe with its fixed-lens optical character.",
  "modules.camera.presets.lomography.description": "Experimental compact-film capture recipe without imposing viewpoint or composition.",
  "modules.camera.presets.canon_eos_r5.description": "Canon EOS R5 full-frame digital capture recipe; lens and focus remain independently editable.",
  "modules.camera.presets.nikon_z8.description": "Nikon Z8 full-frame digital capture recipe; lens and focus remain independently editable.",
  "modules.camera.presets.sony_a7r_iv.description": "Sony A7R IV high-resolution full-frame digital capture recipe.",
  "modules.camera.presets.sony_a7s_iii.description": "Sony A7S III high-sensitivity full-frame digital capture recipe without forcing low-light scene lighting.",
  "modules.camera.presets.fujifilm_x100v.description": "Fujifilm X100V APS-C fixed-lens capture recipe with integrated optical character.",
  "modules.camera.presets.fujifilm_gfx_100s.description": "Fujifilm GFX 100S medium-format digital capture recipe; lens and focus remain independently editable.",
  "modules.camera.presets.leica_q2.description": "Leica Q2 full-frame fixed-lens capture recipe with integrated 28mm-class optics.",
  "modules.camera.presets.leica_sl2.description": "Leica SL2 full-frame digital capture recipe; lens and focus remain independently editable.",
  "modules.camera.presets.hasselblad_x2d.description": "Hasselblad X2D medium-format digital capture recipe; lens and focus remain independently editable.",
  "modules.camera.presets.red_komodo.description": "RED Komodo digital-cinema capture recipe without cinematic composition or lighting assumptions.",
  "modules.camera.presets.arri_alexa.description": "ARRI Alexa digital-cinema capture recipe focused on capture response rather than cinematic styling.",
  "modules.camera.presets.blackmagic_pocket.description": "Blackmagic Pocket Cinema Camera digital-cinema capture recipe without composition assumptions.",
} as const;
