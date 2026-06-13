import type { PromptKeyModule } from "./types";

const framingStyleOptions = [
  // Shot Size / Crop
  {
    value: "extreme_close_up",
    category: "shot_size_crop",
    categoryLabel: "Shot Size / Crop",
    promptText:
      "the framing must use an extreme close-up composition. Only a very tight portion of the subject should be visible, focusing on facial details, expression, texture, or a specific important feature with intense visual intimacy.",
    tags: ["framing", "close-up", "extreme", "detail"],
  },
  {
    value: "close_up",
    category: "shot_size_crop",
    categoryLabel: "Shot Size / Crop",
    promptText:
      "the framing must use a close-up composition. The subject’s face or main upper detail should dominate the frame, with minimal surrounding space and strong focus on expression, identity, and emotional readability.",
    tags: ["framing", "close-up", "portrait", "face"],
  },
  {
    value: "head_and_shoulders",
    category: "shot_size_crop",
    categoryLabel: "Shot Size / Crop",
    promptText:
      "the framing must show the subject from the head to the shoulders. Keep the face clearly visible, include enough upper-body context, and maintain a clean portrait-oriented composition.",
    tags: ["framing", "portrait", "head", "shoulders"],
  },
  {
    value: "bust_shot",
    category: "shot_size_crop",
    categoryLabel: "Shot Size / Crop",
    promptText:
      "the framing must show the subject from the head to the upper chest. The face, neck, shoulders, and part of the torso should be visible, creating a balanced portrait frame with professional visual clarity.",
    tags: ["framing", "bust", "portrait", "upper-body"],
  },
  {
    value: "medium_shot",
    category: "shot_size_crop",
    categoryLabel: "Shot Size / Crop",
    promptText:
      "the framing must show the subject from roughly the waist up. Preserve the upper body, gestures, outfit details, and enough surrounding space to make the subject feel grounded in the composition.",
    tags: ["framing", "medium-shot", "waist-up", "upper-body"],
  },
  {
    value: "three_quarter_shot",
    category: "shot_size_crop",
    categoryLabel: "Shot Size / Crop",
    promptText:
      "the framing must show the subject from roughly the knees or thighs up. Include body posture, outfit structure, hand placement, and environmental context while keeping the subject dominant.",
    tags: ["framing", "three-quarter", "body", "context"],
  },
  {
    value: "full_body",
    category: "shot_size_crop",
    categoryLabel: "Shot Size / Crop",
    promptText:
      "the framing must show the full body from head to toe. Preserve the complete silhouette, posture, feet, clothing, and important body details without cropping any part of the subject.",
    tags: ["framing", "full-body", "silhouette", "subject"],
  },
  {
    value: "wide_full_body_frame",
    category: "shot_size_crop",
    categoryLabel: "Shot Size / Crop",
    promptText:
      "the framing must show the full body with additional surrounding space. Keep the subject fully visible, centered or intentionally placed, with extra safe margins for design, editing, or layout flexibility.",
    tags: ["framing", "full-body", "wide", "safe-space"],
  },

  // Subject Placement
  {
    value: "centered_composition",
    category: "subject_placement",
    categoryLabel: "Subject Placement",
    promptText:
      "the framing must place the subject clearly in the center of the image. Maintain balanced negative space around the subject and create a stable, direct, easy-to-read composition.",
    tags: ["framing", "centered", "balanced", "stable"],
  },
  {
    value: "off_center_composition",
    category: "subject_placement",
    categoryLabel: "Subject Placement",
    promptText:
      "the framing must place the subject away from the exact center. Use intentional negative space, asymmetrical balance, and a more editorial or cinematic layout while keeping the subject visually important.",
    tags: ["framing", "off-center", "editorial", "cinematic"],
  },
  {
    value: "rule_of_thirds_placement",
    category: "subject_placement",
    categoryLabel: "Subject Placement",
    promptText:
      "the framing must follow rule-of-thirds composition. Position the subject or main focal point along a third-line or intersection area to create natural visual balance and a more dynamic frame.",
    tags: ["framing", "rule-of-thirds", "dynamic", "balance"],
  },
  {
    value: "lower_frame_placement",
    category: "subject_placement",
    categoryLabel: "Subject Placement",
    promptText:
      "the framing must place the subject slightly lower in the composition. Leave extra visual space above the subject for atmosphere, text placement, scale, or dramatic environmental presence.",
    tags: ["framing", "lower-frame", "space-above", "layout"],
  },
  {
    value: "upper_frame_placement",
    category: "subject_placement",
    categoryLabel: "Subject Placement",
    promptText:
      "the framing must place the subject slightly higher in the composition. Keep the lower area open for foreground, design elements, shadow, reflection, or grounding space.",
    tags: ["framing", "upper-frame", "foreground", "layout"],
  },
  {
    value: "edge_weighted_composition",
    category: "subject_placement",
    categoryLabel: "Subject Placement",
    promptText:
      "the framing must place the subject close to one side of the frame. Create strong asymmetry, intentional visual tension, and a modern editorial layout with clear directional space.",
    tags: ["framing", "edge", "asymmetry", "editorial"],
  },
  {
    value: "negative_space_composition",
    category: "subject_placement",
    categoryLabel: "Subject Placement",
    promptText:
      "the framing must include large clean negative space around the subject. Keep the subject readable but allow the empty area to become an intentional part of the design.",
    tags: ["framing", "negative-space", "clean", "design"],
  },
  {
    value: "poster_safe_composition",
    category: "subject_placement",
    categoryLabel: "Subject Placement",
    promptText:
      "the framing must preserve enough empty space around the subject for future text or graphic layout. Avoid tight cropping, keep the subject readable, and leave clean design-friendly margins.",
    tags: ["framing", "poster", "layout", "safe-space"],
  },

  // Perspective / Angle
  {
    value: "eye_level_angle",
    category: "perspective_angle",
    categoryLabel: "Perspective / Angle",
    promptText:
      "the framing must use an eye-level perspective. Keep the camera aligned naturally with the subject, creating a direct, balanced, neutral, and realistic point of view.",
    tags: ["framing", "eye-level", "neutral", "realistic"],
  },
  {
    value: "low_angle_view",
    category: "perspective_angle",
    categoryLabel: "Perspective / Angle",
    promptText:
      "the framing must use a low-angle perspective. Position the camera below the subject to make the figure feel larger, stronger, more heroic, dominant, or visually powerful.",
    tags: ["framing", "low-angle", "heroic", "powerful"],
  },
  {
    value: "high_angle_view",
    category: "perspective_angle",
    categoryLabel: "Perspective / Angle",
    promptText:
      "the framing must use a high-angle perspective. Position the camera above the subject to create vulnerability, stylization, overview, or a softer observational feeling.",
    tags: ["framing", "high-angle", "overview", "stylized"],
  },
  {
    value: "top_down_view",
    category: "perspective_angle",
    categoryLabel: "Perspective / Angle",
    promptText:
      "the framing must use a top-down perspective. The subject or scene should be viewed from directly above, emphasizing graphic layout, shape clarity, and spatial arrangement.",
    tags: ["framing", "top-down", "graphic", "layout"],
  },
  {
    value: "worms_eye_view",
    category: "perspective_angle",
    categoryLabel: "Perspective / Angle",
    promptText:
      "the framing must use an extreme low-angle perspective from near ground level. Make the subject or objects feel monumental, dramatic, exaggerated, and visually towering.",
    tags: ["framing", "worms-eye", "monumental", "dramatic"],
  },
  {
    value: "birds_eye_view",
    category: "perspective_angle",
    categoryLabel: "Perspective / Angle",
    promptText:
      "the framing must use an elevated overhead perspective. Show the subject or environment from above with strong spatial clarity, layout awareness, and graphic composition.",
    tags: ["framing", "birds-eye", "overhead", "graphic"],
  },
  {
    value: "three_quarter_angle",
    category: "perspective_angle",
    categoryLabel: "Perspective / Angle",
    promptText:
      "the framing must use a three-quarter view. Show the subject slightly turned from the front, revealing depth, facial structure, body volume, and a more dimensional composition.",
    tags: ["framing", "three-quarter", "depth", "dimensional"],
  },
  {
    value: "profile_view",
    category: "perspective_angle",
    categoryLabel: "Perspective / Angle",
    promptText:
      "the framing must use a side-profile composition. The subject should be shown from the side, emphasizing silhouette, nose, jawline, posture, and clean directional shape.",
    tags: ["framing", "profile", "side-view", "silhouette"],
  },
  {
    value: "frontal_view",
    category: "perspective_angle",
    categoryLabel: "Perspective / Angle",
    promptText:
      "the framing must use a direct frontal composition. Face the subject toward the camera with clear symmetry, strong identity readability, and straightforward visual communication.",
    tags: ["framing", "frontal", "symmetry", "identity"],
  },

  // Composition Style
  {
    value: "symmetrical_composition",
    category: "composition_style",
    categoryLabel: "Composition Style",
    promptText:
      "the framing must use a symmetrical layout. Balance the subject and surrounding elements evenly on both sides, creating a stable, iconic, formal, and visually controlled image.",
    tags: ["framing", "symmetrical", "formal", "controlled"],
  },
  {
    value: "asymmetrical_composition",
    category: "composition_style",
    categoryLabel: "Composition Style",
    promptText:
      "the framing must use asymmetrical balance. Place the subject and background elements unevenly but intentionally, creating visual rhythm, tension, and editorial sophistication.",
    tags: ["framing", "asymmetrical", "editorial", "rhythm"],
  },
  {
    value: "cinematic_composition",
    category: "composition_style",
    categoryLabel: "Composition Style",
    promptText:
      "the framing must feel cinematic and story-driven. Use layered depth, intentional subject placement, strong foreground-background relationship, and a frame that feels like a film still.",
    tags: ["framing", "cinematic", "story", "depth"],
  },
  {
    value: "editorial_composition",
    category: "composition_style",
    categoryLabel: "Composition Style",
    promptText:
      "the framing must feel like a fashion or magazine editorial. Use refined spacing, intentional cropping, elegant subject placement, and a visually designed layout with strong style awareness.",
    tags: ["framing", "editorial", "fashion", "layout"],
  },
  {
    value: "graphic_composition",
    category: "composition_style",
    categoryLabel: "Composition Style",
    promptText:
      "the framing must prioritize bold visual readability. Use clear shape relationships, strong silhouette placement, simplified spatial structure, and design-oriented visual balance.",
    tags: ["framing", "graphic", "readability", "design"],
  },
  {
    value: "dynamic_diagonal_composition",
    category: "composition_style",
    categoryLabel: "Composition Style",
    promptText:
      "the framing must use diagonal energy. Arrange the subject, pose, or scene direction along diagonal lines to create motion, tension, and a more active composition.",
    tags: ["framing", "diagonal", "dynamic", "motion"],
  },
  {
    value: "layered_depth_composition",
    category: "composition_style",
    categoryLabel: "Composition Style",
    promptText:
      "the framing must include clear foreground, midground, and background layers. Create spatial depth, visual separation, and a more immersive composition around the subject.",
    tags: ["framing", "layered", "depth", "immersive"],
  },
  {
    value: "isolated_subject_composition",
    category: "composition_style",
    categoryLabel: "Composition Style",
    promptText:
      "the framing must isolate the subject from distractions. Keep the subject clearly separated, reduce competing elements, and make the main figure the unquestionable focal point.",
    tags: ["framing", "isolated", "subject", "focus"],
  },

  // Cropping Rules
  {
    value: "no_crop_safe_frame",
    category: "cropping_rules",
    categoryLabel: "Cropping Rules",
    promptText:
      "the framing must avoid cropping important subject details. Keep the full intended subject area visible, preserve hands, head, feet, clothing edges, and maintain safe margins around the silhouette.",
    tags: ["framing", "safe-frame", "no-crop", "silhouette"],
  },
  {
    value: "tight_intentional_crop",
    category: "cropping_rules",
    categoryLabel: "Cropping Rules",
    promptText:
      "the framing must use a deliberately tight crop. Cut into the surrounding space or secondary body areas intentionally while preserving the main expressive focal point and strong composition.",
    tags: ["framing", "tight-crop", "intentional", "composition"],
  },
  {
    value: "face_safe_crop",
    category: "cropping_rules",
    categoryLabel: "Cropping Rules",
    promptText:
      "the framing must never cut through important facial features. Keep the eyes, mouth, nose, jawline, and head shape readable while allowing surrounding areas to be cropped if needed.",
    tags: ["framing", "face-safe", "crop", "portrait"],
  },
  {
    value: "hands_safe_crop",
    category: "cropping_rules",
    categoryLabel: "Cropping Rules",
    promptText:
      "the framing must preserve the subject’s hands when they are visually important. Avoid cutting fingers, gestures, props, or hand-body interactions, and keep enough space around the hands.",
    tags: ["framing", "hands-safe", "crop", "gesture"],
  },
  {
    value: "silhouette_safe_crop",
    category: "cropping_rules",
    categoryLabel: "Cropping Rules",
    promptText:
      "the framing must preserve the complete readable silhouette. Avoid cutting major body contours, accessories, hair shape, or key outline details needed for recognition and design clarity.",
    tags: ["framing", "silhouette-safe", "crop", "recognition"],
  },
  {
    value: "asset_safe_margin",
    category: "cropping_rules",
    categoryLabel: "Cropping Rules",
    promptText:
      "the framing must include extra safe space around the subject. Keep the subject centered or well-positioned with production-friendly margins suitable for editing, cutout, layout, or UI use.",
    tags: ["framing", "asset-safe", "margin", "layout"],
  },

  // Camera Distance / Lens Feel
  {
    value: "intimate_portrait_distance",
    category: "camera_distance_lens_feel",
    categoryLabel: "Camera Distance / Lens Feel",
    promptText:
      "the framing must feel close and personal. Use a near-camera composition that emphasizes expression, identity, facial detail, and emotional connection without feeling distorted.",
    tags: ["framing", "portrait", "intimate", "close"],
  },
  {
    value: "natural_portrait_distance",
    category: "camera_distance_lens_feel",
    categoryLabel: "Camera Distance / Lens Feel",
    promptText:
      "the framing must feel natural and realistic. Use comfortable camera distance, balanced proportions, and a familiar portrait perspective with no extreme lens exaggeration.",
    tags: ["framing", "portrait", "natural", "balanced"],
  },
  {
    value: "telephoto_compressed_frame",
    category: "camera_distance_lens_feel",
    categoryLabel: "Camera Distance / Lens Feel",
    promptText:
      "the framing must feel captured with a longer lens. Compress background depth, isolate the subject, reduce perspective distortion, and create a polished professional portrait look.",
    tags: ["framing", "telephoto", "compressed", "portrait"],
  },
  {
    value: "wide_angle_environmental_frame",
    category: "camera_distance_lens_feel",
    categoryLabel: "Camera Distance / Lens Feel",
    promptText:
      "the framing must feel wider and more environmental. Include more surrounding space, stronger perspective depth, and visible context while keeping the subject readable.",
    tags: ["framing", "wide-angle", "environmental", "context"],
  },
  {
    value: "dramatic_wide_angle_frame",
    category: "camera_distance_lens_feel",
    categoryLabel: "Camera Distance / Lens Feel",
    promptText:
      "the framing must use a dramatic wide-angle feel. Exaggerate perspective, make nearby forms feel larger, stretch spatial depth, and create a bold dynamic composition.",
    tags: ["framing", "wide-angle", "dramatic", "dynamic"],
  },
  {
    value: "distant_observational_frame",
    category: "camera_distance_lens_feel",
    categoryLabel: "Camera Distance / Lens Feel",
    promptText:
      "the framing must feel captured from farther away. Show the subject within more surrounding context, with a documentary, cinematic, or natural observational quality.",
    tags: ["framing", "distant", "observational", "context"],
  },

  // Format / Layout Intent
  {
    value: "social_portrait_framing",
    category: "format_layout_intent",
    categoryLabel: "Format / Layout Intent",
    promptText:
      "the framing must be optimized for vertical social media portraits. Keep the subject clear, centered or strongly placed, with readable face and body presence inside a vertical layout.",
    tags: ["framing", "social", "portrait", "vertical"],
  },
  {
    value: "thumbnail_framing",
    category: "format_layout_intent",
    categoryLabel: "Format / Layout Intent",
    promptText:
      "the framing must be optimized for small-size readability. Use bold subject placement, clear facial visibility, strong silhouette, and simple composition that remains recognizable at thumbnail scale.",
    tags: ["framing", "thumbnail", "readability", "small-scale"],
  },
  {
    value: "poster_framing",
    category: "format_layout_intent",
    categoryLabel: "Format / Layout Intent",
    promptText:
      "the framing must support poster or key art use. Preserve strong subject hierarchy, allow space for text or design elements, and create a visually iconic composition.",
    tags: ["framing", "poster", "key-art", "layout"],
  },
  {
    value: "product_style_framing",
    category: "format_layout_intent",
    categoryLabel: "Format / Layout Intent",
    promptText:
      "the framing must present the subject like a clean product or asset. Use controlled spacing, clear edges, balanced placement, and a polished presentation-focused layout.",
    tags: ["framing", "product", "asset", "clean"],
  },
  {
    value: "cinematic_widescreen_framing",
    category: "format_layout_intent",
    categoryLabel: "Format / Layout Intent",
    promptText:
      "the framing must feel suitable for a widescreen cinematic image. Use horizontal space, layered environment, subject placement with breathing room, and film-like compositional balance.",
    tags: ["framing", "cinematic", "widescreen", "horizontal"],
  },
  {
    value: "square_icon_framing",
    category: "format_layout_intent",
    categoryLabel: "Format / Layout Intent",
    promptText:
      "the framing must work inside a square format. Keep the subject centered or balanced, preserve important details, and ensure the image remains readable as an icon, avatar, or tile.",
    tags: ["framing", "square", "icon", "avatar"],
  },
];

export const FramingModule: PromptKeyModule = {
  key: "framing",
  icon: "crop",

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
    framingStyle: {
      id: "framingStyle",
      type: "select",
      default: "",
      group: "core",
      order: 10,
      options: framingStyleOptions,
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