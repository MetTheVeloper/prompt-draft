import type {
  ModuleFieldOption,
  PoseAssignment,
  PromptKeyModule,
} from "./types";

function option(value: string, promptText: string): ModuleFieldOption {
  return { value, promptText };
}

const basePostureOptions = [
  option("standing", "standing"),
  option("seated", "seated"),
  option("kneeling", "kneeling"),
  option("crouching", "crouching"),
  option("reclining", "reclining"),
  option("lying", "lying down"),
];

const torsoPostureOptions = [
  option("upright", "upright torso"),
  option("leaning_forward", "leaning forward"),
  option("leaning_backward", "leaning backward"),
  option("leaning_sideways", "leaning sideways"),
  option("hunched", "hunched torso"),
  option("twisted", "twisted torso"),
  option("arched", "arched torso"),
];

const weightBalanceOptions = [
  option("even", "evenly balanced weight"),
  option("shifted", "weight shifted to one side"),
  option("single_side_support", "supported mainly on one side"),
  option("off_balance", "intentionally off-balance"),
];

const bodyTensionOptions = [
  option("relaxed", "relaxed body tension"),
  option("engaged", "engaged body tension"),
  option("tense", "tense body posture"),
  option("rigid", "rigid body posture"),
  option("loose", "loose body posture"),
];

const locomotionOptions = [
  option("walking", "walking"),
  option("running", "running"),
  option("jumping", "jumping"),
];

const gestureOptions = [
  option("arms_crossed", "arms crossed"),
  option("hands_at_sides", "hands relaxed at the sides"),
  option("hand_on_hip", "one hand on the hip"),
  option("hands_in_pockets", "hands in pockets"),
  option("open_arms", "open arms"),
  option("pointing", "pointing gesture"),
  option("reaching", "reaching gesture"),
  option("raised_arms", "raised arms"),
  option("hands_on_knees", "hands on knees"),
  option("hands_clasped", "hands clasped together"),
];

type PosePresetRecipe = Omit<PoseAssignment, "id" | "targets"> & {
  id: string;
  category: string;
  categoryLabel: string;
};

function posePreset(
  recipe: Pick<PosePresetRecipe, "id" | "category" | "categoryLabel"> &
    Partial<Omit<PosePresetRecipe, "id" | "category" | "categoryLabel">>,
): PosePresetRecipe {
  return {
    basePosture: "",
    torsoPosture: "",
    weightBalance: "",
    bodyTension: "",
    locomotion: "",
    gestures: [],
    interactionDetails: "",
    ...recipe,
  };
}

const presetRecipes: PosePresetRecipe[] = [
  posePreset({
    id: "neutral_standing",
    category: "standing",
    categoryLabel: "Standing",
    basePosture: "standing",
    torsoPosture: "upright",
    weightBalance: "even",
    bodyTension: "relaxed",
    gestures: ["hands_at_sides"],
  }),
  posePreset({
    id: "relaxed_standing",
    category: "standing",
    categoryLabel: "Standing",
    basePosture: "standing",
    weightBalance: "shifted",
    bodyTension: "relaxed",
  }),
  posePreset({
    id: "arms_crossed_standing",
    category: "standing",
    categoryLabel: "Standing",
    basePosture: "standing",
    torsoPosture: "upright",
    gestures: ["arms_crossed"],
  }),
  posePreset({
    id: "hand_on_hip",
    category: "standing",
    categoryLabel: "Standing",
    basePosture: "standing",
    weightBalance: "shifted",
    gestures: ["hand_on_hip"],
  }),
  posePreset({
    id: "relaxed_seated",
    category: "seated",
    categoryLabel: "Seated",
    basePosture: "seated",
    bodyTension: "relaxed",
  }),
  posePreset({
    id: "forward_seated",
    category: "seated",
    categoryLabel: "Seated",
    basePosture: "seated",
    torsoPosture: "leaning_forward",
    gestures: ["hands_on_knees"],
  }),
  posePreset({
    id: "walking",
    category: "motion",
    categoryLabel: "Motion",
    basePosture: "standing",
    bodyTension: "engaged",
    locomotion: "walking",
  }),
  posePreset({
    id: "running",
    category: "motion",
    categoryLabel: "Motion",
    basePosture: "standing",
    bodyTension: "engaged",
    locomotion: "running",
  }),
  posePreset({
    id: "action_ready",
    category: "dynamic",
    categoryLabel: "Dynamic",
    basePosture: "standing",
    weightBalance: "even",
    bodyTension: "tense",
  }),
];

const presetOptions: ModuleFieldOption[] = presetRecipes.map((preset) => ({
  value: preset.id,
  category: preset.category,
  categoryLabel: preset.categoryLabel,
}));

export const PoseModule: PromptKeyModule = {
  key: "pose",
  icon: "manage_accounts",
  groups: {
    assignments: { id: "assignments", order: 1, defaultOpen: true },
    override: { id: "override", order: 2, defaultOpen: false },
  },
  fields: {
    poseAssignments: {
      id: "poseAssignments",
      type: "poseAssignments",
      default: [],
      group: "assignments",
      order: 10,
      options: presetOptions,
      config: {
        presetRecipes,
        basePostureOptions,
        torsoPostureOptions,
        weightBalanceOptions,
        bodyTensionOptions,
        locomotionOptions,
        gestureOptions,
      },
      ui: {
        component: "poseAssignments",
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
    overrideField: "customText",
    ignoreEmpty: true,
  },
};
