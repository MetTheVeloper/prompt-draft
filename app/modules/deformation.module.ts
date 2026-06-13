import type { PromptKeyModule } from "./types";

const deformationStyleOptions = [
  // Caricature Deformation
  {
    value: "grotesque_humorous_exaggeration",
    category: "caricature",
    categoryLabel: "Caricature Deformation",
    promptText:
      "all deformation must follow grotesque humorous character distortion aesthetics. Strongly exaggerated anatomy, intentionally awkward proportions, expressive facial exaggeration, theatrical body language, humorous visual energy with a satirical personality-driven feel.",
    tags: ["caricature", "grotesque", "humorous", "exaggeration"],
  },
  {
    value: "fashion_caricature_distortion",
    category: "caricature",
    categoryLabel: "Caricature Deformation",
    promptText:
      "all deformation must follow exaggerated fashion caricature aesthetics. Elongated limbs, dramatic facial planes, stylized body proportions, awkward elegant posture, runway-like attitude, and bold editorial character presence.",
    tags: ["caricature", "fashion", "editorial", "elongated"],
  },
  {
    value: "comedic_face_heavy_exaggeration",
    category: "caricature",
    categoryLabel: "Caricature Deformation",
    promptText:
      "all deformation must emphasize the face as the main distortion area. Enlarged facial features, expressive mouth and eyes, stretched cheeks or jawline, compressed or enlarged head proportions, while keeping the body secondary and readable.",
    tags: ["caricature", "face", "comedic", "exaggeration"],
  },
  {
    value: "awkward_personality_distortion",
    category: "caricature",
    categoryLabel: "Caricature Deformation",
    promptText:
      "all deformation must amplify the subject's personality through posture and proportions. Uneven body balance, unusual stance, exaggerated gesture language, expressive asymmetry, and playful character-focused distortion.",
    tags: ["caricature", "personality", "gesture", "asymmetry"],
  },

  // Elastic Deformation
  {
    value: "rubber_hose_body_stretch",
    category: "elastic",
    categoryLabel: "Elastic Deformation",
    promptText:
      "all deformation must follow rubber-hose elasticity aesthetics. Flexible noodle-like limbs, rounded bendable anatomy, soft jointless curves, playful body stretch, and bouncy animated movement energy.",
    tags: ["elastic", "rubber-hose", "stretch", "cartoon"],
  },
  {
    value: "spring_loaded_anatomy",
    category: "elastic",
    categoryLabel: "Elastic Deformation",
    promptText:
      "all deformation must look like the body is stretched by elastic tension. Extended limbs, compressed torso, springy posture, curved motion arcs, and energetic rebound-like proportions.",
    tags: ["elastic", "spring", "tension", "motion"],
  },
  {
    value: "soft_bendable_figure",
    category: "elastic",
    categoryLabel: "Elastic Deformation",
    promptText:
      "all deformation must create a soft flexible body structure. Smooth curved anatomy, relaxed stretched limbs, gentle warped proportions, and a lightweight playful pose with no harsh angles.",
    tags: ["elastic", "soft", "bendable", "curved"],
  },
  {
    value: "extreme_limb_flexibility",
    category: "elastic",
    categoryLabel: "Elastic Deformation",
    promptText:
      "all deformation must focus on exaggerated flexible limbs. Arms and legs can bend beyond natural limits, with elongated smooth curves, loose expressive gestures, and dynamic elastic silhouette behavior.",
    tags: ["elastic", "limbs", "flexibility", "dynamic"],
  },

  // Liquid Deformation
  {
    value: "liquid_stretch_distortion",
    category: "liquid",
    categoryLabel: "Liquid Deformation",
    promptText:
      "all deformation must follow liquid-stretch aesthetics. Flowing elongated anatomy, warped fluid proportions, smeared facial structure, graceful unstable posture, and surreal motion-driven energy.",
    tags: ["liquid", "stretch", "flowing", "surreal"],
  },
  {
    value: "melting_body_collapse",
    category: "liquid",
    categoryLabel: "Liquid Deformation",
    promptText:
      "all deformation must look like the body is slowly melting downward. Drooping anatomy, sagging facial forms, softened collapsing proportions, heavy gravity pull, and surreal material-driven deformation.",
    tags: ["liquid", "melting", "collapse", "gravity"],
  },
  {
    value: "fluid_smear_transformation",
    category: "liquid",
    categoryLabel: "Liquid Deformation",
    promptText:
      "all deformation must create a smeared fluid impression. Stretched facial elements, trailing body shapes, softened edges, flowing directional distortion, and painterly motion-like instability.",
    tags: ["liquid", "smear", "fluid", "directional"],
  },
  {
    value: "soft_warped_anatomy",
    category: "liquid",
    categoryLabel: "Liquid Deformation",
    promptText:
      "all deformation must follow smooth organic warping. Curved distorted proportions, softened facial structure, unstable body alignment, and flowing transitions between body parts without sharp breaks.",
    tags: ["liquid", "warped", "organic", "smooth"],
  },

  // Inflated Deformation
  {
    value: "balloon_like_anatomy",
    category: "inflated",
    categoryLabel: "Inflated Deformation",
    promptText:
      "all deformation must follow inflated balloon-body aesthetics. Rounded swollen anatomy, puffed limbs, expanded torso or head volume, smooth stretched surface tension, and buoyant playful posture.",
    tags: ["inflated", "balloon", "rounded", "puffed"],
  },
  {
    value: "overstuffed_soft_proportions",
    category: "inflated",
    categoryLabel: "Inflated Deformation",
    promptText:
      "all deformation must create an overfilled soft-body effect. Thick rounded limbs, compressed joints, puffy facial volume, dense cushion-like proportions, and a heavy but cute sculptural presence.",
    tags: ["inflated", "soft-body", "puffy", "cushion"],
  },
  {
    value: "floating_inflated_figure",
    category: "inflated",
    categoryLabel: "Inflated Deformation",
    promptText:
      "all deformation must suggest the body is light and air-filled. Expanded rounded forms, lifted posture, soft inflated silhouette, gentle floating balance, and playful weightless energy.",
    tags: ["inflated", "floating", "weightless", "rounded"],
  },
  {
    value: "swollen_facial_structure",
    category: "inflated",
    categoryLabel: "Inflated Deformation",
    promptText:
      "all deformation must focus on puffed facial proportions. Rounded cheeks, inflated jaw or forehead volume, softened features, compressed expression, and smooth balloon-like facial construction.",
    tags: ["inflated", "face", "swollen", "balloon"],
  },

  // Compressed Deformation
  {
    value: "squashed_compact_anatomy",
    category: "compressed",
    categoryLabel: "Compressed Deformation",
    promptText:
      "all deformation must follow squashed compact-body aesthetics. Shortened proportions, compressed torso, reduced limb length, dense body mass, and a grounded low-center-of-gravity posture.",
    tags: ["compressed", "squashed", "compact", "dense"],
  },
  {
    value: "flattened_body_distortion",
    category: "compressed",
    categoryLabel: "Compressed Deformation",
    promptText:
      "all deformation must make the figure appear pressed or flattened. Wide compressed forms, flattened facial planes, squeezed limbs, reduced depth, and graphic pressure-driven body deformation.",
    tags: ["compressed", "flattened", "pressed", "graphic"],
  },
  {
    value: "squeezed_facial_features",
    category: "compressed",
    categoryLabel: "Compressed Deformation",
    promptText:
      "all deformation must focus on facial compression. Narrowed or pushed-together features, squashed cheeks, shortened face height, tense compact expression, and distorted but readable identity structure.",
    tags: ["compressed", "face", "squeezed", "identity"],
  },
  {
    value: "heavy_downward_compression",
    category: "compressed",
    categoryLabel: "Compressed Deformation",
    promptText:
      "all deformation must look affected by strong vertical pressure. Compressed spine, lowered posture, shortened limbs, flattened head or torso volume, and dense weight-driven visual energy.",
    tags: ["compressed", "vertical", "pressure", "heavy"],
  },

  // Geometric Deformation
  {
    value: "angular_faceted_anatomy",
    category: "geometric",
    categoryLabel: "Geometric Deformation",
    promptText:
      "all deformation must follow angular faceted aesthetics. Body and face are rebuilt with sharp planes, polygonal structure, simplified hard edges, rigid proportions, and sculptural graphic clarity.",
    tags: ["geometric", "angular", "faceted", "polygonal"],
  },
  {
    value: "cuboid_block_deformation",
    category: "geometric",
    categoryLabel: "Geometric Deformation",
    promptText:
      "all deformation must use block-based volumetric construction. Squared limbs, cuboid torso, simplified blocky head shape, rigid posture, and toy-like architectural body proportions.",
    tags: ["geometric", "cuboid", "blocky", "volumetric"],
  },
  {
    value: "triangular_silhouette_distortion",
    category: "geometric",
    categoryLabel: "Geometric Deformation",
    promptText:
      "all deformation must emphasize triangular and tapered proportions. Sharp shoulders, narrow waist or limbs, pointed facial structure, angular stance, and high-contrast geometric silhouette design.",
    tags: ["geometric", "triangular", "tapered", "silhouette"],
  },
  {
    value: "fractured_plane_structure",
    category: "geometric",
    categoryLabel: "Geometric Deformation",
    promptText:
      "all deformation must look like the figure is divided into shifted geometric planes. Broken facial surfaces, offset body segments, sharp transitions, and abstract editorial structure while preserving subject readability.",
    tags: ["geometric", "fractured", "planes", "abstract"],
  },

  // Organic Deformation
  {
    value: "asymmetric_natural_growth",
    category: "organic",
    categoryLabel: "Organic Deformation",
    promptText:
      "all deformation must follow organic growth aesthetics. Uneven body proportions, naturally irregular curves, subtle asymmetry, grown rather than constructed forms, and living sculptural deformation.",
    tags: ["organic", "growth", "asymmetric", "natural"],
  },
  {
    value: "twisted_organic_anatomy",
    category: "organic",
    categoryLabel: "Organic Deformation",
    promptText:
      "all deformation must create a twisting biological form. Rotated torso, curved limbs, spiraling posture, uneven body flow, and natural plant-like or muscle-like movement through the silhouette.",
    tags: ["organic", "twisted", "biological", "spiral"],
  },
  {
    value: "soft_biomorphic_distortion",
    category: "organic",
    categoryLabel: "Organic Deformation",
    promptText:
      "all deformation must use biomorphic shapes. Rounded uneven forms, soft body bulges, natural flowing curves, irregular facial structure, and a living handcrafted organic feel.",
    tags: ["organic", "biomorphic", "rounded", "handcrafted"],
  },
  {
    value: "root_like_body_flow",
    category: "organic",
    categoryLabel: "Organic Deformation",
    promptText:
      "all deformation must suggest branching or root-like body movement. Elongated flowing limbs, uneven extensions, organic curves, and a grounded natural growth-based posture.",
    tags: ["organic", "root-like", "branching", "flow"],
  },

  // Insectoid / Creature Deformation
  {
    value: "insectoid_segmented_anatomy",
    category: "insectoid_creature",
    categoryLabel: "Insectoid / Creature Deformation",
    promptText:
      "all deformation must follow insectoid body aesthetics. Thin segmented limbs, narrow torso, sharp jointed posture, elongated facial structure, and strange elegant nonhuman proportions.",
    tags: ["insectoid", "segmented", "nonhuman", "creature"],
  },
  {
    value: "alien_elongated_structure",
    category: "insectoid_creature",
    categoryLabel: "Insectoid / Creature Deformation",
    promptText:
      "all deformation must create an alien-like body silhouette. Extended limbs, narrow head or face, unfamiliar anatomy balance, tense posture, and otherworldly graceful visual energy.",
    tags: ["alien", "elongated", "otherworldly", "silhouette"],
  },
  {
    value: "creature_hybrid_distortion",
    category: "insectoid_creature",
    categoryLabel: "Insectoid / Creature Deformation",
    promptText:
      "all deformation must subtly shift the subject toward creature-like anatomy. Nonhuman proportions, altered limb balance, unusual facial structure, predatory or curious posture, and hybrid fantasy character energy.",
    tags: ["creature", "hybrid", "fantasy", "nonhuman"],
  },
  {
    value: "exoskeleton_body_logic",
    category: "insectoid_creature",
    categoryLabel: "Insectoid / Creature Deformation",
    promptText:
      "all deformation must follow exoskeleton-inspired construction. Rigid segmented body sections, angular joints, thin limbs, protective shell-like volume, and tense insect-like movement behavior.",
    tags: ["exoskeleton", "segmented", "shell", "insect-like"],
  },

  // Puppet / Doll Deformation
  {
    value: "marionette_jointed_body",
    category: "puppet_doll",
    categoryLabel: "Puppet / Doll Deformation",
    promptText:
      "all deformation must follow marionette puppet aesthetics. Jointed limbs, suspended awkward posture, exaggerated head-to-body ratio, carved theatrical face, and controlled performance-like body language.",
    tags: ["puppet", "marionette", "jointed", "theatrical"],
  },
  {
    value: "wooden_doll_distortion",
    category: "puppet_doll",
    categoryLabel: "Puppet / Doll Deformation",
    promptText:
      "all deformation must make the subject feel like a stylized wooden doll. Rigid body sections, simplified carved forms, stiff limbs, artificial posture, and handcrafted toy-like visual presence.",
    tags: ["doll", "wooden", "carved", "toy-like"],
  },
  {
    value: "porcelain_doll_proportions",
    category: "puppet_doll",
    categoryLabel: "Puppet / Doll Deformation",
    promptText:
      "all deformation must follow delicate doll-like proportions. Enlarged head, simplified smooth face, compact body, stiff elegant pose, and fragile artificial character energy.",
    tags: ["doll", "porcelain", "delicate", "fragile"],
  },
  {
    value: "mannequin_body_structure",
    category: "puppet_doll",
    categoryLabel: "Puppet / Doll Deformation",
    promptText:
      "all deformation must create a mannequin-like figure. Smooth simplified anatomy, reduced natural details, neutral artificial posture, elongated display-body proportions, and fashion display visual behavior.",
    tags: ["mannequin", "display", "simplified", "fashion"],
  },

  // Sculptural Deformation
  {
    value: "clay_built_body_distortion",
    category: "sculptural",
    categoryLabel: "Sculptural Deformation",
    promptText:
      "all deformation must follow handmade clay sculpture aesthetics. Soft sculpted anatomy, visible volumetric exaggeration, uneven handcrafted proportions, tactile body forms, and static sculptural posture.",
    tags: ["sculptural", "clay", "handmade", "tactile"],
  },
  {
    value: "chiseled_stone_like_planes",
    category: "sculptural",
    categoryLabel: "Sculptural Deformation",
    promptText:
      "all deformation must look carved from solid mass. Strong facial planes, simplified hard anatomy, heavy sculptural proportions, stable posture, and monument-like physical presence.",
    tags: ["sculptural", "stone", "chiseled", "monumental"],
  },
  {
    value: "miniature_handmade_model",
    category: "sculptural",
    categoryLabel: "Sculptural Deformation",
    promptText:
      "all deformation must resemble a handmade miniature character model. Simplified exaggerated proportions, tactile surface character, sculpted facial forms, compact physical presence, and crafted object-like readability.",
    tags: ["sculptural", "miniature", "model", "crafted"],
  },
  {
    value: "abstract_statue_deformation",
    category: "sculptural",
    categoryLabel: "Sculptural Deformation",
    promptText:
      "all deformation must follow abstract figurative sculpture aesthetics. Reduced anatomical accuracy, bold simplified volumes, expressive static pose, distorted facial planes, and gallery-like artistic presence.",
    tags: ["sculptural", "abstract", "statue", "gallery"],
  },

  // Material-Driven Deformation
  {
    value: "wax_droop_distortion",
    category: "material_driven",
    categoryLabel: "Material-Driven Deformation",
    promptText:
      "all deformation must behave like softened wax. Sagging features, drooping limbs, melting edges, gravity-driven collapse, and glossy unstable material-based body deformation.",
    tags: ["material", "wax", "droop", "melting"],
  },
  {
    value: "latex_stretch_distortion",
    category: "material_driven",
    categoryLabel: "Material-Driven Deformation",
    promptText:
      "all deformation must behave like flexible latex rubber. Stretched smooth anatomy, tight surface tension, elastic facial pull, glossy curved forms, and sleek synthetic deformation energy.",
    tags: ["material", "latex", "stretch", "rubber"],
  },
  {
    value: "fabric_fold_deformation",
    category: "material_driven",
    categoryLabel: "Material-Driven Deformation",
    promptText:
      "all deformation must behave like soft folded fabric. Collapsed body volume, visible folds, sagging flexible structure, compressed facial softness, and cloth-like physical instability.",
    tags: ["material", "fabric", "fold", "cloth"],
  },
  {
    value: "warped_wood_volume",
    category: "material_driven",
    categoryLabel: "Material-Driven Deformation",
    promptText:
      "all deformation must behave like bent carved wood. Twisted rigid forms, stretched grain-following anatomy, curved solid limbs, carved facial distortion, and handcrafted material-driven structure.",
    tags: ["material", "wood", "warped", "carved"],
  },

  // Fashion Editorial Deformation
  {
    value: "runway_elongation",
    category: "fashion_editorial",
    categoryLabel: "Fashion Editorial Deformation",
    promptText:
      "all deformation must follow high-fashion runway exaggeration. Very long limbs, slim stretched torso, elegant unnatural posture, refined facial structure, and dramatic editorial silhouette.",
    tags: ["fashion", "runway", "elongation", "editorial"],
  },
  {
    value: "luxury_sculptural_body",
    category: "fashion_editorial",
    categoryLabel: "Fashion Editorial Deformation",
    promptText:
      "all deformation must create a premium sculptural fashion figure. Controlled body exaggeration, polished elongated proportions, elegant angular pose, clean dramatic silhouette, and luxury visual authority.",
    tags: ["fashion", "luxury", "sculptural", "polished"],
  },
  {
    value: "avant_garde_pose_distortion",
    category: "fashion_editorial",
    categoryLabel: "Fashion Editorial Deformation",
    promptText:
      "all deformation must follow avant-garde editorial styling. Unusual body angles, theatrical posture, elongated neck or limbs, stylized facial attitude, and experimental fashion-magazine energy.",
    tags: ["fashion", "avant-garde", "pose", "editorial"],
  },
  {
    value: "dramatic_silhouette_exaggeration",
    category: "fashion_editorial",
    categoryLabel: "Fashion Editorial Deformation",
    promptText:
      "all deformation must prioritize an iconic fashion silhouette. Enlarged shoulders or hips, narrowed waist, stretched vertical proportions, controlled imbalance, and bold graphic body presence.",
    tags: ["fashion", "silhouette", "dramatic", "graphic"],
  },

  // Grotesque Deformation
  {
    value: "absurd_misshapen_anatomy",
    category: "grotesque",
    categoryLabel: "Grotesque Deformation",
    promptText:
      "all deformation must follow absurd grotesque distortion aesthetics. Irregular body proportions, intentionally strange anatomy, uneven facial structure, awkward physical balance, and unsettling humorous visual energy.",
    tags: ["grotesque", "absurd", "misshapen", "unsettling"],
  },
  {
    value: "asymmetrical_body_imbalance",
    category: "grotesque",
    categoryLabel: "Grotesque Deformation",
    promptText:
      "all deformation must emphasize asymmetry. One side of the body may feel stretched, heavier, smaller, or displaced, with uneven facial balance and unstable expressive posture.",
    tags: ["grotesque", "asymmetry", "imbalance", "unstable"],
  },
  {
    value: "strange_theatrical_distortion",
    category: "grotesque",
    categoryLabel: "Grotesque Deformation",
    promptText:
      "all deformation must create a theatrical grotesque figure. Distorted dramatic face, unnatural limb rhythm, exaggerated body imbalance, expressive awkward stance, and bizarre stage-like visual energy.",
    tags: ["grotesque", "theatrical", "dramatic", "bizarre"],
  },
  {
    value: "distorted_elegance",
    category: "grotesque",
    categoryLabel: "Grotesque Deformation",
    promptText:
      "all deformation must combine elegance with visual discomfort. Long graceful proportions, subtly wrong anatomy, strange facial exaggeration, refined but awkward posture, and unsettling high-art character presence.",
    tags: ["grotesque", "elegance", "awkward", "high-art"],
  },

  // Cute / Chibi Deformation
  {
    value: "oversized_head_tiny_body",
    category: "cute_chibi",
    categoryLabel: "Cute / Chibi Deformation",
    promptText:
      "all deformation must follow cute chibi proportions. Very large head, tiny simplified body, short rounded limbs, soft facial features, and adorable compact character energy.",
    tags: ["cute", "chibi", "big-head", "tiny-body"],
  },
  {
    value: "soft_rounded_mascot_body",
    category: "cute_chibi",
    categoryLabel: "Cute / Chibi Deformation",
    promptText:
      "all deformation must create a mascot-like body. Rounded simplified anatomy, stubby limbs, friendly facial proportions, smooth soft volume, and playful approachable character design.",
    tags: ["cute", "mascot", "rounded", "friendly"],
  },
  {
    value: "baby_like_proportion_shift",
    category: "cute_chibi",
    categoryLabel: "Cute / Chibi Deformation",
    promptText:
      "all deformation must follow baby-like visual proportions. Large eyes or head, small torso, short limbs, softened cheeks, innocent posture, and gentle cute emotional tone.",
    tags: ["cute", "baby-like", "innocent", "soft"],
  },
  {
    value: "compact_toy_cuteness",
    category: "cute_chibi",
    categoryLabel: "Cute / Chibi Deformation",
    promptText:
      "all deformation must create a small collectible cute figure. Simplified body mass, rounded head, tiny limbs, clean readable facial features, and charming toy-like proportions.",
    tags: ["cute", "toy", "collectible", "compact"],
  },

  // Brutalist Deformation
  {
    value: "heavy_block_anatomy",
    category: "brutalist",
    categoryLabel: "Brutalist Deformation",
    promptText:
      "all deformation must follow heavy brutalist form language. Massive blocky body volumes, thick limbs, reduced facial detail, rigid posture, and raw architectural weight.",
    tags: ["brutalist", "blocky", "massive", "architectural"],
  },
  {
    value: "harsh_angular_compression",
    category: "brutalist",
    categoryLabel: "Brutalist Deformation",
    promptText:
      "all deformation must use harsh compressed geometry. Sharp edges, dense body mass, flattened planes, rough structural proportions, and aggressive graphic physicality.",
    tags: ["brutalist", "angular", "compressed", "aggressive"],
  },
  {
    value: "monumental_rough_figure",
    category: "brutalist",
    categoryLabel: "Brutalist Deformation",
    promptText:
      "all deformation must make the subject feel monumental and heavy. Oversized rigid body parts, simplified carved face, thick grounded stance, and raw sculptural dominance.",
    tags: ["brutalist", "monumental", "heavy", "rough"],
  },
  {
    value: "primitive_block_distortion",
    category: "brutalist",
    categoryLabel: "Brutalist Deformation",
    promptText:
      "all deformation must follow primitive block-built aesthetics. Crude simplified anatomy, heavy rectangular forms, uneven proportions, and intentionally rough handmade visual character.",
    tags: ["brutalist", "primitive", "block", "rough"],
  },

  // Paper / Cutout Deformation
  {
    value: "layered_paper_body",
    category: "paper_cutout",
    categoryLabel: "Paper / Cutout Deformation",
    promptText:
      "all deformation must follow layered paper-cut construction. Flattened body parts, stacked silhouette shapes, simplified facial elements, visible layer logic, and handmade graphic collage energy.",
    tags: ["paper", "cutout", "layered", "collage"],
  },
  {
    value: "flat_graphic_figure",
    category: "paper_cutout",
    categoryLabel: "Paper / Cutout Deformation",
    promptText:
      "all deformation must reduce the subject into flat graphic shapes. Minimal depth, simplified anatomy, clean cutout edges, stiff posture, and poster-like readable silhouette.",
    tags: ["paper", "flat", "graphic", "poster-like"],
  },
  {
    value: "torn_collage_distortion",
    category: "paper_cutout",
    categoryLabel: "Paper / Cutout Deformation",
    promptText:
      "all deformation must look assembled from torn collage pieces. Misaligned body sections, rough cut edges, displaced facial shapes, layered paper fragments, and expressive handmade imperfection.",
    tags: ["paper", "collage", "torn", "handmade"],
  },
  {
    value: "puppet_cutout_pose",
    category: "paper_cutout",
    categoryLabel: "Paper / Cutout Deformation",
    promptText:
      "all deformation must resemble a paper puppet figure. Separated flat limbs, hinged-looking joints, theatrical stiff posture, simplified face, and playful crafted stage-like composition.",
    tags: ["paper", "puppet", "cutout", "stage-like"],
  },

  // Motion-Driven Deformation
  {
    value: "speed_smear_body",
    category: "motion_driven",
    categoryLabel: "Motion-Driven Deformation",
    promptText:
      "all deformation must follow motion-smear aesthetics. Body parts stretch along the movement direction, limbs blur into elongated shapes, facial features trail slightly, and the pose feels fast and kinetic.",
    tags: ["motion", "speed", "smear", "kinetic"],
  },
  {
    value: "impact_squash_and_stretch",
    category: "motion_driven",
    categoryLabel: "Motion-Driven Deformation",
    promptText:
      "all deformation must show impact-driven squash and stretch. Compressed body mass, stretched limbs, exaggerated reaction pose, distorted facial pressure, and animated force-based energy.",
    tags: ["motion", "impact", "squash", "stretch"],
  },
  {
    value: "wind_pulled_anatomy",
    category: "motion_driven",
    categoryLabel: "Motion-Driven Deformation",
    promptText:
      "all deformation must look pulled by strong wind or motion force. Hair, limbs, clothing, and body shapes stretch in one direction, with flowing posture and directional kinetic tension.",
    tags: ["motion", "wind", "directional", "flowing"],
  },
  {
    value: "action_arc_distortion",
    category: "motion_driven",
    categoryLabel: "Motion-Driven Deformation",
    promptText:
      "all deformation must follow a clear dynamic action arc. Curved body flow, extended gesture lines, exaggerated motion posture, and readable animated movement through the full silhouette.",
    tags: ["motion", "action-arc", "dynamic", "gesture"],
  },

  // Surreal Deformation
  {
    value: "impossible_body_geometry",
    category: "surreal",
    categoryLabel: "Surreal Deformation",
    promptText:
      "all deformation must follow impossible surreal anatomy. Body parts may bend, loop, or connect in physically impossible ways while staying visually readable and dreamlike.",
    tags: ["surreal", "impossible", "geometry", "dreamlike"],
  },
  {
    value: "gravity_defying_figure",
    category: "surreal",
    categoryLabel: "Surreal Deformation",
    promptText:
      "all deformation must ignore normal gravity. Floating limbs, lifted posture, displaced body balance, surreal spatial orientation, and dreamlike suspended energy.",
    tags: ["surreal", "gravity-defying", "floating", "suspended"],
  },
  {
    value: "abstract_human_hybrid",
    category: "surreal",
    categoryLabel: "Surreal Deformation",
    promptText:
      "all deformation must transform the figure into a semi-abstract human form. Recognizable subject structure remains, but anatomy becomes symbolic, unusual, fragmented, and artistically dreamlike.",
    tags: ["surreal", "abstract", "hybrid", "fragmented"],
  },
  {
    value: "dreamlike_proportion_shift",
    category: "surreal",
    categoryLabel: "Surreal Deformation",
    promptText:
      "all deformation must create dreamlike unnatural proportions. Enlarged or reduced body areas, warped facial structure, soft impossible balance, and surreal poetic visual behavior.",
    tags: ["surreal", "dreamlike", "proportion", "poetic"],
  },

  // Minimal Deformation
  {
    value: "subtle_body_elongation",
    category: "minimal",
    categoryLabel: "Minimal Deformation",
    promptText:
      "all deformation must stay controlled and minimal. Slightly elongated limbs or neck, refined posture improvement, gentle facial adjustment, and realistic readability with low distortion strength.",
    tags: ["minimal", "subtle", "elongation", "controlled"],
  },
  {
    value: "restrained_facial_stylization",
    category: "minimal",
    categoryLabel: "Minimal Deformation",
    promptText:
      "all deformation must focus on light facial transformation. Mild feature simplification, subtle proportion correction, controlled expression change, and identity-safe stylized deformation.",
    tags: ["minimal", "facial", "restrained", "identity-safe"],
  },
  {
    value: "gentle_posture_redesign",
    category: "minimal",
    categoryLabel: "Minimal Deformation",
    promptText:
      "all deformation must subtly improve body posture. Cleaner stance, slightly adjusted limb angles, mild silhouette refinement, and natural-looking controlled transformation.",
    tags: ["minimal", "posture", "gentle", "refinement"],
  },
  {
    value: "low_intensity_proportion_shift",
    category: "minimal",
    categoryLabel: "Minimal Deformation",
    promptText:
      "all deformation must apply a small proportion change only. Minor head, limb, or torso adjustment, balanced anatomy, preserved recognizability, and soft stylized refinement.",
    tags: ["minimal", "proportion", "low-intensity", "recognizable"],
  },

  // Extreme Stylized Deformation
  {
    value: "full_abstraction_distortion",
    category: "extreme_stylized",
    categoryLabel: "Extreme Stylized Deformation",
    promptText:
      "all deformation must allow extreme artistic abstraction. Anatomy may become highly simplified, stretched, fragmented, or symbolic, with strong visual identity and minimal realism.",
    tags: ["extreme", "abstraction", "symbolic", "artistic"],
  },
  {
    value: "wild_expressive_anatomy",
    category: "extreme_stylized",
    categoryLabel: "Extreme Stylized Deformation",
    promptText:
      "all deformation must use wild expressive body distortion. Dramatically altered proportions, exaggerated facial structure, intense gesture language, and bold experimental character energy.",
    tags: ["extreme", "expressive", "dramatic", "experimental"],
  },
  {
    value: "radical_silhouette_transformation",
    category: "extreme_stylized",
    categoryLabel: "Extreme Stylized Deformation",
    promptText:
      "all deformation must prioritize a completely transformed silhouette. Body shape may become highly elongated, compressed, widened, or abstracted while keeping the subject visually central.",
    tags: ["extreme", "silhouette", "radical", "abstracted"],
  },
  {
    value: "experimental_art_deformation",
    category: "extreme_stylized",
    categoryLabel: "Extreme Stylized Deformation",
    promptText:
      "all deformation must follow experimental art-driven distortion. Unconventional anatomy, unusual pose logic, expressive form breakdown, and visually bold non-realistic transformation behavior.",
    tags: ["extreme", "experimental", "art-driven", "non-realistic"],
  },
];

export const DeformationModule: PromptKeyModule = {
  key: "deformation",
  icon: "forward-item",

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
    deformationStyle: {
      id: "deformationStyle",
      type: "select",
      default: "",
      group: "core",
      order: 10,
      options: deformationStyleOptions,
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