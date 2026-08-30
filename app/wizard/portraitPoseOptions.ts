import type { WizardModalOptionsQuestionDefinition } from "./definition";

export type PortraitPoseOptions = Partial<{
  stance: "standing" | "seated";
  posture: "relaxed" | "upright" | "tense";
  weightBalance: "even" | "shifted";
  gesture:
    | "hands_at_sides"
    | "hands_in_pockets"
    | "arms_crossed"
    | "hand_on_hip";
}>;

export const PORTRAIT_POSE_OPTION_KEYS = new Set([
  "stance",
  "posture",
  "weightBalance",
  "gesture",
]);

const STANCES = new Set<NonNullable<PortraitPoseOptions["stance"]>>([
  "standing",
  "seated",
]);
const POSTURES = new Set<NonNullable<PortraitPoseOptions["posture"]>>([
  "relaxed",
  "upright",
  "tense",
]);
const WEIGHT_BALANCES = new Set<
  NonNullable<PortraitPoseOptions["weightBalance"]>
>(["even", "shifted"]);
const GESTURES = new Set<NonNullable<PortraitPoseOptions["gesture"]>>([
  "hands_at_sides",
  "hands_in_pockets",
  "arms_crossed",
  "hand_on_hip",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function enumValue<T extends string>(value: unknown, allowed: ReadonlySet<T>) {
  return typeof value === "string" && allowed.has(value as T)
    ? (value as T)
    : undefined;
}

export function normalizePortraitPoseOptions(value: unknown): PortraitPoseOptions {
  if (!isRecord(value)) return {};

  return {
    stance: enumValue(value.stance, STANCES),
    posture: enumValue(value.posture, POSTURES),
    weightBalance: enumValue(value.weightBalance, WEIGHT_BALANCES),
    gesture: enumValue(value.gesture, GESTURES),
  };
}

export function portraitPoseOptionsPatch(value: unknown) {
  const options = normalizePortraitPoseOptions(value);
  return {
    ...(options.stance ? { basePosture: options.stance } : {}),
    ...(options.posture === "upright"
      ? { torsoPosture: "upright" }
      : options.posture
        ? { bodyTension: options.posture }
        : {}),
    ...(options.weightBalance
      ? { weightBalance: options.weightBalance }
      : {}),
    ...(options.gesture ? { gestures: [options.gesture] } : {}),
  };
}

export const portraitPoseOptionsQuestion = {
  id: "poseOptions",
  type: "modalOptions",
  title: "Pose details",
  buttonLabel: "More pose options",
  modalTitle: "Fine-tune pose",
  description:
    "Optional high-impact pose details. These refine the shared pose without exposing the full Expert controls.",
  visibleWhen: {
    answerId: "framingIntent",
    operator: "notEquals",
    value: "headshot",
  },
  fields: [
    {
      id: "stance",
      type: "singleChoice",
      title: "Stance",
      options: [
        { value: "standing", label: "Standing" },
        { value: "seated", label: "Seated" },
      ],
    },
    {
      id: "posture",
      type: "singleChoice",
      title: "Posture",
      options: [
        { value: "relaxed", label: "Relaxed" },
        { value: "upright", label: "Upright" },
        { value: "tense", label: "Tense" },
      ],
    },
    {
      id: "weightBalance",
      type: "singleChoice",
      title: "Weight balance",
      options: [
        { value: "even", label: "Evenly balanced" },
        { value: "shifted", label: "Weight shifted to one side" },
      ],
    },
    {
      id: "gesture",
      type: "singleChoice",
      title: "Arms and hands",
      options: [
        { value: "hands_at_sides", label: "Hands relaxed at sides" },
        { value: "hands_in_pockets", label: "Hands in pockets" },
        { value: "arms_crossed", label: "Arms crossed" },
        { value: "hand_on_hip", label: "One hand on hip" },
      ],
    },
  ],
} as const satisfies WizardModalOptionsQuestionDefinition;
