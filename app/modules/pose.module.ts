import type { PromptKeyModule } from "./types";

const poseStyleOptions = [
  // Neutral / Basic Pose
  {
    value: "standing_neutral_pose",
    category: "neutral_basic",
    categoryLabel: "Neutral / Basic Pose",
    promptText:
      "the pose must be neutral and straightforward. The subject should stand in a balanced natural stance with calm body alignment, clear readability, and no exaggerated action or dramatic gesture.",
    tags: ["pose", "neutral", "standing", "balanced"],
  },
  {
    value: "relaxed_standing_pose",
    category: "neutral_basic",
    categoryLabel: "Neutral / Basic Pose",
    promptText:
      "the pose must feel relaxed and natural. Use a comfortable standing posture, soft body tension, casual balance, and an easy everyday presence with clean readable body language.",
    tags: ["pose", "relaxed", "standing", "natural"],
  },
  {
    value: "confident_upright_pose",
    category: "neutral_basic",
    categoryLabel: "Neutral / Basic Pose",
    promptText:
      "the pose must feel confident and upright. Keep the spine lifted, the body well balanced, the stance stable, and the overall posture self-assured without becoming overly theatrical.",
    tags: ["pose", "confident", "upright", "stable"],
  },
  {
    value: "symmetrical_formal_pose",
    category: "neutral_basic",
    categoryLabel: "Neutral / Basic Pose",
    promptText:
      "the pose must be formal and symmetrical. Keep the body evenly balanced, the stance composed, the posture tidy, and the overall figure visually controlled and structured.",
    tags: ["pose", "formal", "symmetrical", "structured"],
  },
  {
    value: "casual_weight_shift_pose",
    category: "neutral_basic",
    categoryLabel: "Neutral / Basic Pose",
    promptText:
      "the pose must include a casual weight shift. Let the subject rest more weight on one leg, create a natural asymmetry in the hips and shoulders, and maintain a relaxed but visually appealing stance.",
    tags: ["pose", "casual", "weight-shift", "asymmetrical"],
  },
  {
    value: "hands_at_sides_pose",
    category: "neutral_basic",
    categoryLabel: "Neutral / Basic Pose",
    promptText:
      "the pose must keep the arms simple and relaxed at the sides. Maintain a straightforward readable silhouette, calm posture, and minimal gesture complexity.",
    tags: ["pose", "hands", "simple", "readable"],
  },

  // Editorial / Fashion Pose
  {
    value: "fashion_editorial_stance",
    category: "editorial_fashion",
    categoryLabel: "Editorial / Fashion Pose",
    promptText:
      "the pose must feel like a fashion editorial stance. Use elegant posture, refined body angles, confident presentation, intentional asymmetry, and a visually designed high-style presence.",
    tags: ["pose", "fashion", "editorial", "elegant"],
  },
  {
    value: "runway_inspired_pose",
    category: "editorial_fashion",
    categoryLabel: "Editorial / Fashion Pose",
    promptText:
      "the pose must feel inspired by runway presentation. Use elongated posture, poised body alignment, controlled elegance, and a stylish fashion-forward attitude.",
    tags: ["pose", "runway", "fashion", "poised"],
  },
  {
    value: "hand_on_hip_pose",
    category: "editorial_fashion",
    categoryLabel: "Editorial / Fashion Pose",
    promptText:
      "the pose must include a hand-on-hip stance. Use confident posture, clear waist and shoulder structure, readable silhouette shaping, and a polished fashion-oriented presence.",
    tags: ["pose", "fashion", "hand-on-hip", "confident"],
  },
  {
    value: "elongated_elegant_pose",
    category: "editorial_fashion",
    categoryLabel: "Editorial / Fashion Pose",
    promptText:
      "the pose must feel elongated and elegant. Stretch the posture vertically, refine the line of the neck and limbs, and create a graceful editorial silhouette with controlled sophistication.",
    tags: ["pose", "elongated", "elegant", "editorial"],
  },
  {
    value: "dramatic_asymmetrical_fashion_pose",
    category: "editorial_fashion",
    categoryLabel: "Editorial / Fashion Pose",
    promptText:
      "the pose must use dramatic asymmetry in a fashion-oriented way. Tilt the hips or shoulders, create a bold silhouette, and maintain a striking editorial body language with deliberate imbalance.",
    tags: ["pose", "fashion", "dramatic", "asymmetrical"],
  },
  {
    value: "over_the_shoulder_pose",
    category: "editorial_fashion",
    categoryLabel: "Editorial / Fashion Pose",
    promptText:
      "the pose must feel like an over-the-shoulder fashion pose. Keep the body direction slightly turned, maintain elegant upper-body twist, and create a stylish poised attitude with clear subject presence.",
    tags: ["pose", "fashion", "turned", "stylish"],
  },

  // Seated / Resting Pose
  {
    value: "seated_upright_pose",
    category: "seated_resting",
    categoryLabel: "Seated / Resting Pose",
    promptText:
      "the pose must place the subject in an upright seated position. Keep the posture composed, the torso readable, and the seated body structured with a clear calm presence.",
    tags: ["pose", "seated", "upright", "composed"],
  },
  {
    value: "relaxed_seated_pose",
    category: "seated_resting",
    categoryLabel: "Seated / Resting Pose",
    promptText:
      "the pose must feel comfortably seated and relaxed. Use softer body tension, natural limb placement, and an easy posture that feels informal but visually readable.",
    tags: ["pose", "seated", "relaxed", "natural"],
  },
  {
    value: "leaning_seated_pose",
    category: "seated_resting",
    categoryLabel: "Seated / Resting Pose",
    promptText:
      "the pose must include a seated lean. Let the subject lean slightly into one side, a chair, or a support surface while keeping the overall body readable and visually intentional.",
    tags: ["pose", "seated", "leaning", "asymmetrical"],
  },
  {
    value: "crouching_pose",
    category: "seated_resting",
    categoryLabel: "Seated / Resting Pose",
    promptText:
      "the pose must be crouching or low to the ground. Keep the body compact, balanced, and visually clear, with strong readability in the legs, torso, and gesture flow.",
    tags: ["pose", "crouching", "low", "compact"],
  },
  {
    value: "kneeling_pose",
    category: "seated_resting",
    categoryLabel: "Seated / Resting Pose",
    promptText:
      "the pose must place the subject in a kneeling posture. Maintain clean body structure, readable limb placement, and a grounded pose that can feel calm, humble, dramatic, or composed depending on context.",
    tags: ["pose", "kneeling", "grounded", "structured"],
  },
  {
    value: "reclining_pose",
    category: "seated_resting",
    categoryLabel: "Seated / Resting Pose",
    promptText:
      "the pose must feel reclined or laid back. Use relaxed support-based body positioning, stretched or partially supported limbs, and a calm visually arranged posture.",
    tags: ["pose", "reclining", "relaxed", "laid-back"],
  },

  // Dynamic / Action Pose
  {
    value: "walking_motion_pose",
    category: "dynamic_action",
    categoryLabel: "Dynamic / Action Pose",
    promptText:
      "the pose must suggest walking motion. Use natural forward body flow, alternating limb rhythm, grounded movement, and a believable sense of motion through the stance.",
    tags: ["pose", "walking", "motion", "dynamic"],
  },
  {
    value: "running_action_pose",
    category: "dynamic_action",
    categoryLabel: "Dynamic / Action Pose",
    promptText:
      "the pose must feel like active running. Use strong directional body energy, extended limbs, dynamic posture, and a clear action-oriented movement silhouette.",
    tags: ["pose", "running", "action", "dynamic"],
  },
  {
    value: "jumping_pose",
    category: "dynamic_action",
    categoryLabel: "Dynamic / Action Pose",
    promptText:
      "the pose must capture a jumping action. Show lifted body energy, suspended motion, expressive limb spread or compression, and a strong airborne sense of action.",
    tags: ["pose", "jumping", "airborne", "dynamic"],
  },
  {
    value: "turning_in_motion_pose",
    category: "dynamic_action",
    categoryLabel: "Dynamic / Action Pose",
    promptText:
      "the pose must suggest turning or twisting in motion. Use rotational body flow, directional energy, and an active silhouette that feels caught mid-movement.",
    tags: ["pose", "turning", "twisting", "motion"],
  },
  {
    value: "reaching_pose",
    category: "dynamic_action",
    categoryLabel: "Dynamic / Action Pose",
    promptText:
      "the pose must include a reaching action. Extend the arm or body toward something, create directional movement, and preserve strong visual flow through the full figure.",
    tags: ["pose", "reaching", "extension", "directional"],
  },
  {
    value: "action_ready_stance",
    category: "dynamic_action",
    categoryLabel: "Dynamic / Action Pose",
    promptText:
      "the pose must feel prepared for action. Use alert body tension, clear readiness in the limbs, stable footing, and a dynamic pre-movement stance.",
    tags: ["pose", "action-ready", "tense", "athletic"],
  },

  // Gesture / Hand-Based Pose
  {
    value: "arms_crossed_pose",
    category: "gesture_hand_based",
    categoryLabel: "Gesture / Hand-Based Pose",
    promptText:
      "the pose must include crossed arms. Use closed but confident body language, clear upper-body structure, and a readable self-contained stance.",
    tags: ["pose", "arms-crossed", "confident", "gesture"],
  },
  {
    value: "open_arm_welcoming_pose",
    category: "gesture_hand_based",
    categoryLabel: "Gesture / Hand-Based Pose",
    promptText:
      "the pose must feel open and welcoming. Use open arms or open upper-body gesture, relaxed posture, and inviting readable body language.",
    tags: ["pose", "open-arms", "welcoming", "gesture"],
  },
  {
    value: "hands_in_pockets_pose",
    category: "gesture_hand_based",
    categoryLabel: "Gesture / Hand-Based Pose",
    promptText:
      "the pose must place the hands in the pockets or partially in the pockets. Use relaxed casual body language, stable posture, and a cool understated attitude.",
    tags: ["pose", "hands-in-pockets", "casual", "cool"],
  },
  {
    value: "pointing_gesture_pose",
    category: "gesture_hand_based",
    categoryLabel: "Gesture / Hand-Based Pose",
    promptText:
      "the pose must include a pointing gesture. Make the gesture readable, directional, and clearly connected to the subject’s body language or communicative intent.",
    tags: ["pose", "pointing", "gesture", "directional"],
  },
  {
    value: "playful_hand_gesture_pose",
    category: "gesture_hand_based",
    categoryLabel: "Gesture / Hand-Based Pose",
    promptText:
      "the pose must include a playful hand gesture. Keep the body language lively, expressive, and approachable with a light energetic sense of personality.",
    tags: ["pose", "playful", "hand-gesture", "expressive"],
  },
  {
    value: "expressive_hand_pose",
    category: "gesture_hand_based",
    categoryLabel: "Gesture / Hand-Based Pose",
    promptText:
      "the pose must emphasize expressive hands. Keep the gestures readable and intentional, with hands playing a major role in the visual storytelling of the pose.",
    tags: ["pose", "hands", "expressive", "storytelling"],
  },

  // Sports / Athletic Pose
  {
    value: "athlete_ready_stance",
    category: "sports_athletic",
    categoryLabel: "Sports / Athletic Pose",
    promptText:
      "the pose must feel athletic and ready. Use balanced lower-body support, active posture, visible readiness, and a competitive physical presence.",
    tags: ["pose", "athletic", "ready", "sports"],
  },
  {
    value: "celebration_pose",
    category: "sports_athletic",
    categoryLabel: "Sports / Athletic Pose",
    promptText:
      "the pose must capture a celebratory moment. Use raised arms, victorious body energy, emotional release, and a clearly readable triumphant stance.",
    tags: ["pose", "celebration", "victory", "sports"],
  },
  {
    value: "mid_performance_pose",
    category: "sports_athletic",
    categoryLabel: "Sports / Athletic Pose",
    promptText:
      "the pose must feel captured mid-performance. Preserve action clarity, energetic body mechanics, and a sense of focused athletic execution.",
    tags: ["pose", "performance", "sports", "action"],
  },
  {
    value: "training_action_pose",
    category: "sports_athletic",
    categoryLabel: "Sports / Athletic Pose",
    promptText:
      "the pose must feel like active training or practice. Use controlled athletic movement, functional posture, and a focused physically engaged body stance.",
    tags: ["pose", "training", "athletic", "practice"],
  },
  {
    value: "power_stance_pose",
    category: "sports_athletic",
    categoryLabel: "Sports / Athletic Pose",
    promptText:
      "the pose must feel powerful and grounded. Use strong lower-body support, open chest, clear physical confidence, and a sturdy commanding athletic posture.",
    tags: ["pose", "power", "grounded", "strong"],
  },
  {
    value: "sport_specific_action_pose",
    category: "sports_athletic",
    categoryLabel: "Sports / Athletic Pose",
    promptText:
      "the pose must feel specific to an athletic action. Use sport-like body mechanics, directional movement, active limbs, and a believable competition-oriented posture.",
    tags: ["pose", "sport-specific", "action", "competition"],
  },

  // Character / Emotional Pose
  {
    value: "heroic_pose",
    category: "character_emotional",
    categoryLabel: "Character / Emotional Pose",
    promptText:
      "the pose must feel heroic and elevated. Use proud posture, stable footing, lifted chest, and a strong larger-than-life body language with clear confidence.",
    tags: ["pose", "heroic", "proud", "confident"],
  },
  {
    value: "shy_inward_pose",
    category: "character_emotional",
    categoryLabel: "Character / Emotional Pose",
    promptText:
      "the pose must feel shy or inward. Use smaller body language, softer posture, partial self-protection, and a gentle reserved physical presence.",
    tags: ["pose", "shy", "reserved", "soft"],
  },
  {
    value: "awkward_off_balance_pose",
    category: "character_emotional",
    categoryLabel: "Character / Emotional Pose",
    promptText:
      "the pose must feel awkward or slightly off-balance. Use unusual stance rhythm, asymmetrical body placement, and a characterful imperfect posture with personality.",
    tags: ["pose", "awkward", "off-balance", "character"],
  },
  {
    value: "mysterious_guarded_pose",
    category: "character_emotional",
    categoryLabel: "Character / Emotional Pose",
    promptText:
      "the pose must feel mysterious and guarded. Use restrained body openness, controlled posture, subtle tension, and a composed but unreadable physical attitude.",
    tags: ["pose", "mysterious", "guarded", "restrained"],
  },
  {
    value: "playful_character_pose",
    category: "character_emotional",
    categoryLabel: "Character / Emotional Pose",
    promptText:
      "the pose must feel playful and full of personality. Use lively gesture, expressive body rhythm, and an energetic approachable sense of character.",
    tags: ["pose", "playful", "character", "energetic"],
  },
  {
    value: "contemplative_pose",
    category: "character_emotional",
    categoryLabel: "Character / Emotional Pose",
    promptText:
      "the pose must feel contemplative or reflective. Use quieter gesture language, still posture, inward focus, and a thoughtful body presence.",
    tags: ["pose", "contemplative", "reflective", "quiet"],
  },

  // Interaction / Object Pose
  {
    value: "holding_object_pose",
    category: "interaction_object",
    categoryLabel: "Interaction / Object Pose",
    promptText:
      "the pose must include the subject holding an object or prop. Keep the interaction clear, the hand placement readable, and the overall body language naturally connected to the held item.",
    tags: ["pose", "object", "holding", "interaction"],
  },
  {
    value: "presenting_object_pose",
    category: "interaction_object",
    categoryLabel: "Interaction / Object Pose",
    promptText:
      "the pose must feel like the subject is presenting or showcasing something. Use open gesture language, clear arm direction, and a readable display-oriented stance.",
    tags: ["pose", "presenting", "showcase", "gesture"],
  },
  {
    value: "leaning_on_surface_pose",
    category: "interaction_object",
    categoryLabel: "Interaction / Object Pose",
    promptText:
      "the pose must include the subject leaning on a surface or support. Use natural weight transfer, clear body contact, and a relaxed but intentionally arranged posture.",
    tags: ["pose", "leaning", "surface", "support"],
  },
  {
    value: "interacting_with_environment_pose",
    category: "interaction_object",
    categoryLabel: "Interaction / Object Pose",
    promptText:
      "the pose must connect the subject to the surrounding environment. Use believable interaction with nearby space or objects, clear body orientation, and natural contextual body language.",
    tags: ["pose", "environment", "interaction", "context"],
  },
  {
    value: "looking_at_object_pose",
    category: "interaction_object",
    categoryLabel: "Interaction / Object Pose",
    promptText:
      "the pose must include clear attention toward an object or focal element. Align the body and gesture flow so the interaction reads naturally and supports the visual narrative.",
    tags: ["pose", "object", "attention", "narrative"],
  },
  {
    value: "phone_or_device_interaction_pose",
    category: "interaction_object",
    categoryLabel: "Interaction / Object Pose",
    promptText:
      "the pose must include interaction with a phone, screen, or handheld device. Keep the gesture readable, the hand placement believable, and the body language connected to the device-focused action.",
    tags: ["pose", "device", "phone", "interaction"],
  },
];

export const PoseModule: PromptKeyModule = {
  key: "pose",
  icon: "user-edit",

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
    poseStyle: {
      id: "poseStyle",
      type: "select",
      default: "",
      group: "core",
      order: 10,
      options: poseStyleOptions,
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