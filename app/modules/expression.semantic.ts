import type {
  ExpressionAssignment,
  ModuleFieldOption,
  PromptKeyModule,
} from "./types";

function option(value: string, promptText: string): ModuleFieldOption {
  return { value, promptText };
}

const coreExpressionOptions = [
  option("neutral", "neutral expression"),
  option("happy", "happy expression"),
  option("joyful", "joyful expression"),
  option("serious", "serious expression"),
  option("determined", "determined expression"),
  option("angry", "angry expression"),
  option("sad", "sad expression"),
  option("melancholic", "melancholic expression"),
  option("fearful", "fearful expression"),
  option("surprised", "surprised expression"),
  option("confused", "confused expression"),
  option("disgusted", "disgusted expression"),
  option("smug", "smug expression"),
  option("curious", "curious expression"),
  option("sleepy", "sleepy expression"),
];

const intensityOptions = [
  option("subtle", "subtle intensity"),
  option("moderate", "moderate intensity"),
  option("pronounced", "pronounced intensity"),
  option("exaggerated", "exaggerated intensity"),
];

const eyeStateOptions = [
  option("relaxed", "relaxed eyes"),
  option("soft", "soft eyes"),
  option("narrowed", "narrowed eyes"),
  option("wide", "wide eyes"),
  option("squinting", "squinting eyes"),
  option("closed", "closed eyes"),
];

const browStateOptions = [
  option("relaxed", "relaxed brows"),
  option("raised", "raised brows"),
  option("furrowed", "furrowed brows"),
  option("lowered", "lowered brows"),
];

const mouthStateOptions = [
  option("neutral", "neutral mouth"),
  option("slight_smile", "slight smile"),
  option("smile", "smile"),
  option("broad_smile", "broad smile"),
  option("smirk", "smirk"),
  option("frown", "frown"),
  option("open", "open mouth"),
  option("gritted_teeth", "gritted teeth"),
  option("pursed_lips", "pursed lips"),
];

type ExpressionPresetRecipe = Omit<ExpressionAssignment, "id" | "targets"> & {
  id: string;
  category: string;
  categoryLabel: string;
};

function expressionPreset(
  recipe: Pick<ExpressionPresetRecipe, "id" | "category" | "categoryLabel"> &
    Partial<Omit<ExpressionPresetRecipe, "id" | "category" | "categoryLabel">>,
): ExpressionPresetRecipe {
  return {
    coreExpression: "",
    intensity: "",
    eyeState: "",
    browState: "",
    mouthState: "",
    ...recipe,
  };
}

const presetRecipes: ExpressionPresetRecipe[] = [
  expressionPreset({
    id: "neutral_calm",
    category: "neutral",
    categoryLabel: "Neutral",
    coreExpression: "neutral",
    intensity: "subtle",
    eyeState: "relaxed",
    browState: "relaxed",
    mouthState: "neutral",
  }),
  expressionPreset({
    id: "gentle_smile",
    category: "positive",
    categoryLabel: "Positive",
    coreExpression: "happy",
    intensity: "subtle",
    eyeState: "relaxed",
    mouthState: "slight_smile",
  }),
  expressionPreset({
    id: "warm_smile",
    category: "positive",
    categoryLabel: "Positive",
    coreExpression: "happy",
    intensity: "moderate",
    eyeState: "soft",
    mouthState: "smile",
  }),
  expressionPreset({
    id: "joyful",
    category: "positive",
    categoryLabel: "Positive",
    coreExpression: "joyful",
    intensity: "pronounced",
    eyeState: "soft",
    mouthState: "broad_smile",
  }),
  expressionPreset({
    id: "determined",
    category: "serious",
    categoryLabel: "Serious",
    coreExpression: "determined",
    intensity: "moderate",
    eyeState: "narrowed",
    browState: "furrowed",
  }),
  expressionPreset({
    id: "furious",
    category: "negative",
    categoryLabel: "Negative",
    coreExpression: "angry",
    intensity: "pronounced",
    eyeState: "narrowed",
    browState: "furrowed",
    mouthState: "gritted_teeth",
  }),
  expressionPreset({
    id: "sad_soft",
    category: "negative",
    categoryLabel: "Negative",
    coreExpression: "sad",
    intensity: "subtle",
    eyeState: "soft",
    mouthState: "frown",
  }),
  expressionPreset({
    id: "shocked",
    category: "reaction",
    categoryLabel: "Reaction",
    coreExpression: "surprised",
    intensity: "pronounced",
    eyeState: "wide",
    browState: "raised",
    mouthState: "open",
  }),
  expressionPreset({
    id: "sleepy",
    category: "neutral",
    categoryLabel: "Neutral",
    coreExpression: "sleepy",
    intensity: "subtle",
    eyeState: "relaxed",
    browState: "relaxed",
    mouthState: "neutral",
  }),
];

const presetOptions: ModuleFieldOption[] = presetRecipes.map((preset) => ({
  value: preset.id,
  category: preset.category,
  categoryLabel: preset.categoryLabel,
}));

export const ExpressionModule: PromptKeyModule = {
  key: "expression",
  icon: "sentiment_satisfied",
  groups: {
    assignments: { id: "assignments", order: 1, defaultOpen: true },
    override: { id: "override", order: 2, defaultOpen: false },
  },
  fields: {
    expressionAssignments: {
      id: "expressionAssignments",
      type: "expressionAssignments",
      default: [],
      group: "assignments",
      order: 10,
      options: presetOptions,
      config: {
        presetRecipes,
        coreExpressionOptions,
        intensityOptions,
        eyeStateOptions,
        browStateOptions,
        mouthStateOptions,
      },
      ui: {
        component: "expressionAssignments",
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
