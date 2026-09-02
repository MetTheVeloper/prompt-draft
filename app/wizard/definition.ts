import type { WizardEntityKind } from "./entities";
import { portraitBackgroundOptionsQuestion } from "./portraitBackgroundOptions";
import { portraitPoseOptionsQuestion } from "./portraitPoseOptions";

export type WizardAnswerScalar = string | number | boolean | null;

export type WizardConditionOperator = "equals" | "notEquals";

export type WizardCondition = {
  answerId: string;
  operator: WizardConditionOperator;
  value: WizardAnswerScalar;
};

export type WizardQuestionOption = {
  value: string;
  label: string;
  description?: string;
  icon?: string;
};

type WizardQuestionBase = {
  id: string;
  title: string;
  description?: string;
  required?: boolean;
  defaultValue?: unknown;
  visibleWhen?: WizardCondition;
};

export type WizardSingleChoiceQuestionDefinition = WizardQuestionBase & {
  type: "singleChoice";
  options: readonly WizardQuestionOption[];
};

export type WizardTextQuestionDefinition = WizardQuestionBase & {
  type: "text";
  placeholder?: string;
  rows?: number;
};

export type WizardModalSingleChoiceFieldDefinition = {
  id: string;
  type: "singleChoice";
  title: string;
  description?: string;
  options: readonly WizardQuestionOption[];
};

export type WizardModalTextFieldDefinition = {
  id: string;
  type: "text";
  title: string;
  description?: string;
  placeholder?: string;
  rows?: number;
};

export type WizardModalFieldDefinition =
  | WizardModalSingleChoiceFieldDefinition
  | WizardModalTextFieldDefinition;

export type WizardModalOptionsQuestionDefinition = WizardQuestionBase & {
  type: "modalOptions";
  buttonLabel?: string;
  modalTitle?: string;
  fields: readonly WizardModalFieldDefinition[];
};

export type WizardSubjectOverridesQuestionDefinition = WizardQuestionBase & {
  type: "subjectOverrides";
  subjectsAnswerId: string;
  sharedIntentAnswerId: string;
  sharedOptionsAnswerId?: string;
  buttonLabel?: string;
  modalTitle?: string;
  intentTitle?: string;
  hideFieldsWhenIntent?: readonly string[];
};

export type WizardVariablePickerQuestionDefinition = WizardQuestionBase & {
  type: "variablePicker";
};

export type WizardEntityKindOption = {
  value: WizardEntityKind;
  label: string;
  icon?: string;
};

export type WizardEntityCollectionQuestionDefinition = WizardQuestionBase & {
  type: "entityCollection";
  allowedKinds: readonly WizardEntityKindOption[];
  min?: number;
  max?: number;
};

export type WizardQuestionDefinition =
  | WizardSingleChoiceQuestionDefinition
  | WizardTextQuestionDefinition
  | WizardModalOptionsQuestionDefinition
  | WizardSubjectOverridesQuestionDefinition
  | WizardVariablePickerQuestionDefinition
  | WizardEntityCollectionQuestionDefinition;

export type WizardStageDefinition = {
  id: string;
  title: string;
  shortTitle?: string;
};

export type WizardStepDefinition = {
  id: string;
  stageId?: string;
  title: string;
  description?: string;
  kind?: "questions" | "review";
  questions: readonly WizardQuestionDefinition[];
  visibleWhen?: WizardCondition;
};

export type WizardDefinition = {
  id: string;
  version: number;
  title: string;
  description?: string;
  stages?: readonly WizardStageDefinition[];
  steps: readonly WizardStepDefinition[];
};

function assertNonEmpty(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} must be non-empty.`);
  }
}

function assertQuestionOptions(
  options: readonly WizardQuestionOption[],
  label: string,
) {
  if (!options.length) {
    throw new Error(`${label} requires options.`);
  }

  const optionValues = new Set<string>();
  for (const option of options) {
    assertNonEmpty(option.value, `${label} option value`);
    assertNonEmpty(option.label, `${label} option label`);
    if (optionValues.has(option.value)) {
      throw new Error(`Duplicate option value "${option.value}" in ${label}.`);
    }
    optionValues.add(option.value);
  }
}

export function assertWizardDefinition(definition: WizardDefinition) {
  assertNonEmpty(definition.id, "Wizard id");
  assertNonEmpty(definition.title, "Wizard title");

  if (!Number.isInteger(definition.version) || definition.version < 1) {
    throw new Error("Wizard version must be a positive integer.");
  }

  if (!definition.steps.length) {
    throw new Error("Wizard definition must contain at least one step.");
  }

  const stageIds = new Set<string>();
  for (const stage of definition.stages || []) {
    assertNonEmpty(stage.id, "Wizard stage id");
    assertNonEmpty(stage.title, `Wizard stage "${stage.id}" title`);
    if (stageIds.has(stage.id)) {
      throw new Error(`Duplicate Wizard stage id: ${stage.id}`);
    }
    stageIds.add(stage.id);
  }

  const stepIds = new Set<string>();
  const questionIds = new Set<string>();
  const questionsById = new Map<string, WizardQuestionDefinition>();

  for (const step of definition.steps) {
    assertNonEmpty(step.id, "Wizard step id");
    assertNonEmpty(step.title, `Wizard step "${step.id}" title`);

    if (stepIds.has(step.id)) {
      throw new Error(`Duplicate Wizard step id: ${step.id}`);
    }
    stepIds.add(step.id);

    if (definition.stages?.length) {
      if (!step.stageId) {
        throw new Error(`Wizard step "${step.id}" must reference a stage.`);
      }
      if (!stageIds.has(step.stageId)) {
        throw new Error(
          `Wizard step "${step.id}" references unknown stage: ${step.stageId}`,
        );
      }
    }

    for (const question of step.questions) {
      assertNonEmpty(question.id, `Wizard question id in step "${step.id}"`);
      assertNonEmpty(question.title, `Wizard question "${question.id}" title`);

      if (questionIds.has(question.id)) {
        throw new Error(`Duplicate Wizard question id: ${question.id}`);
      }
      questionIds.add(question.id);
      questionsById.set(question.id, question);

      if (question.type === "singleChoice") {
        assertQuestionOptions(
          question.options,
          `Wizard singleChoice question "${question.id}"`,
        );
      }

      if (question.type === "modalOptions") {
        if (!question.fields.length) {
          throw new Error(
            `Wizard modalOptions question "${question.id}" requires fields.`,
          );
        }

        const fieldIds = new Set<string>();
        for (const field of question.fields) {
          assertNonEmpty(
            field.id,
            `Wizard modalOptions question "${question.id}" field id`,
          );
          assertNonEmpty(
            field.title,
            `Wizard modalOptions question "${question.id}" field "${field.id}" title`,
          );
          if (fieldIds.has(field.id)) {
            throw new Error(
              `Duplicate modal field id "${field.id}" in Wizard question "${question.id}".`,
            );
          }
          fieldIds.add(field.id);

          if (field.type === "singleChoice") {
            assertQuestionOptions(
              field.options,
              `Wizard modal field "${question.id}.${field.id}"`,
            );
          }
        }
      }

      if (question.type === "subjectOverrides") {
        assertNonEmpty(
          question.subjectsAnswerId,
          `Wizard subjectOverrides question "${question.id}" subjectsAnswerId`,
        );
        assertNonEmpty(
          question.sharedIntentAnswerId,
          `Wizard subjectOverrides question "${question.id}" sharedIntentAnswerId`,
        );
        if (question.sharedOptionsAnswerId) {
          assertNonEmpty(
            question.sharedOptionsAnswerId,
            `Wizard subjectOverrides question "${question.id}" sharedOptionsAnswerId`,
          );
        }
      }

      if (question.type === "entityCollection") {
        if (!question.allowedKinds.length) {
          throw new Error(
            `Wizard entityCollection question "${question.id}" requires allowedKinds.`,
          );
        }
        if ((question.min || 0) < 0 || (question.max || 1) < (question.min || 0)) {
          throw new Error(
            `Wizard entityCollection question "${question.id}" has invalid min/max.`,
          );
        }
      }
    }
  }

  for (const step of definition.steps) {
    const conditions = [
      step.visibleWhen,
      ...step.questions.map((question) => question.visibleWhen),
    ].filter((condition): condition is WizardCondition => Boolean(condition));

    for (const condition of conditions) {
      if (!questionIds.has(condition.answerId)) {
        throw new Error(
          `Wizard condition references unknown answer id: ${condition.answerId}`,
        );
      }
    }

    for (const question of step.questions) {
      if (question.type !== "subjectOverrides") continue;
      const subjectsQuestion = questionsById.get(question.subjectsAnswerId);
      const intentQuestion = questionsById.get(question.sharedIntentAnswerId);
      const optionsQuestion = question.sharedOptionsAnswerId
        ? questionsById.get(question.sharedOptionsAnswerId)
        : undefined;

      if (subjectsQuestion?.type !== "entityCollection") {
        throw new Error(
          `Wizard subjectOverrides question "${question.id}" must reference an entityCollection subjects question.`,
        );
      }
      if (intentQuestion?.type !== "singleChoice") {
        throw new Error(
          `Wizard subjectOverrides question "${question.id}" must reference a singleChoice shared intent question.`,
        );
      }
      if (
        question.sharedOptionsAnswerId &&
        optionsQuestion?.type !== "modalOptions"
      ) {
        throw new Error(
          `Wizard subjectOverrides question "${question.id}" must reference a modalOptions shared options question.`,
        );
      }
    }
  }
}

/**
 * Accepted Portrait v1 definition kept intact for backend regression coverage.
 * New presentation work uses Portrait v2 below.
 */
export const portraitWizardV1Definition = {
  id: "portrait",
  version: 1,
  title: "Portrait",
  description:
    "Guided portrait setup that captures semantic user intent before canonical Actions implement it.",
  steps: [
    {
      id: "subject",
      title: "Subject",
      questions: [
        {
          id: "subjectReference",
          type: "variablePicker",
          title: "Portrait subject",
          description:
            "Select the stable Subject variable/reference that identifies the portrait subject.",
          required: true,
        },
      ],
    },
    {
      id: "intent",
      title: "Portrait intent",
      questions: [
        {
          id: "portraitIntent",
          type: "singleChoice",
          title: "Portrait type",
          required: true,
          defaultValue: "professional",
          options: [
            { value: "professional", label: "Professional" },
            { value: "cinematic", label: "Cinematic" },
            { value: "fashion", label: "Fashion" },
            { value: "fantasy", label: "Fantasy" },
          ],
        },
      ],
    },
    {
      id: "appearance",
      title: "Appearance",
      questions: [
        {
          id: "expressionIntent",
          type: "singleChoice",
          title: "Expression",
          options: [
            { value: "natural", label: "Natural" },
            { value: "confident", label: "Confident" },
            { value: "warm", label: "Warm" },
            { value: "serious", label: "Serious" },
          ],
        },
        {
          id: "hairIntent",
          type: "singleChoice",
          title: "Hair direction",
          options: [
            { value: "keep_reference", label: "Keep reference" },
            { value: "natural", label: "Natural" },
            { value: "polished", label: "Polished" },
            { value: "editorial", label: "Editorial" },
          ],
        },
        {
          id: "outfitIntent",
          type: "singleChoice",
          title: "Outfit direction",
          options: [
            { value: "keep_reference", label: "Keep reference" },
            { value: "professional", label: "Professional" },
            { value: "fashion", label: "Fashion" },
            { value: "fantasy", label: "Fantasy" },
          ],
        },
      ],
    },
    {
      id: "composition",
      title: "Composition",
      questions: [
        {
          id: "framingIntent",
          type: "singleChoice",
          title: "Framing",
          required: true,
          defaultValue: "head_shoulders",
          options: [
            { value: "headshot", label: "Headshot" },
            { value: "head_shoulders", label: "Head and shoulders" },
            { value: "half_body", label: "Half body" },
            { value: "full_body", label: "Full body" },
          ],
        },
        {
          id: "poseIntent",
          type: "singleChoice",
          title: "Pose direction",
          visibleWhen: {
            answerId: "framingIntent",
            operator: "notEquals",
            value: "headshot",
          },
          options: [
            { value: "natural", label: "Natural" },
            { value: "formal", label: "Formal" },
            { value: "dynamic", label: "Dynamic" },
          ],
        },
      ],
    },
    {
      id: "environment",
      title: "Environment",
      questions: [
        {
          id: "environmentType",
          type: "singleChoice",
          title: "Environment type",
          required: true,
          defaultValue: "studio",
          options: [
            { value: "studio", label: "Studio" },
            { value: "outdoor", label: "Outdoor" },
            { value: "abstract", label: "Abstract" },
          ],
        },
        {
          id: "studioDirection",
          type: "text",
          title: "Studio direction",
          visibleWhen: {
            answerId: "environmentType",
            operator: "equals",
            value: "studio",
          },
        },
        {
          id: "outdoorSetting",
          type: "text",
          title: "Outdoor setting",
          visibleWhen: {
            answerId: "environmentType",
            operator: "equals",
            value: "outdoor",
          },
        },
        {
          id: "abstractDirection",
          type: "text",
          title: "Abstract direction",
          visibleWhen: {
            answerId: "environmentType",
            operator: "equals",
            value: "abstract",
          },
        },
      ],
    },
    {
      id: "lighting",
      title: "Lighting & mood",
      questions: [
        {
          id: "lightingIntent",
          type: "singleChoice",
          title: "Lighting mood",
          required: true,
          defaultValue: "soft",
          options: [
            { value: "soft", label: "Soft" },
            { value: "dramatic", label: "Dramatic" },
            { value: "moody", label: "Moody" },
            { value: "clean", label: "Clean" },
          ],
        },
      ],
    },
    {
      id: "review",
      kind: "review",
      title: "Review",
      questions: [],
    },
  ],
} as const satisfies WizardDefinition;

export const portraitWizardV2Definition = {
  id: "portrait",
  version: 2,
  title: "Portrait Wizard",
  description: "Build a portrait prompt through a focused, independent guided flow.",
  stages: [
    { id: "start", title: "Start" },
    { id: "subjects", title: "Subjects" },
    { id: "portrait", title: "Portrait" },
    { id: "appearance", title: "Appearance", shortTitle: "Look" },
    { id: "composition", title: "Composition" },
    { id: "scene", title: "Scene" },
    { id: "final", title: "Final settings", shortTitle: "Final" },
    { id: "review", title: "Review" },
  ],
  steps: [
    {
      id: "start",
      stageId: "start",
      title: "Choose your starting point",
      description: "Tell the Wizard whether this portrait starts from an image or from text.",
      questions: [
        {
          id: "creationMode",
          type: "singleChoice",
          title: "How do you want to create it?",
          required: true,
          options: [
            {
              value: "from_image",
              label: "Start from an image",
              description: "Use an input image as the visual reference.",
              icon: "image",
            },
            {
              value: "from_description",
              label: "Start from a description",
              description: "Create the image from text only.",
              icon: "notes",
            },
          ],
        },
      ],
    },
    {
      id: "subjects",
      stageId: "subjects",
      title: "Who should appear in the portrait?",
      description:
        "Add the people you want to control as distinct subjects. Names are optional but make later choices easier to understand.",
      questions: [
        {
          id: "subjects",
          type: "entityCollection",
          title: "Portrait subjects",
          required: true,
          min: 1,
          max: 4,
          allowedKinds: [{ value: "person", label: "Person", icon: "person" }],
        },
      ],
    },
    {
      id: "intent",
      stageId: "portrait",
      title: "What kind of portrait are you making?",
      questions: [
        {
          id: "portraitIntent",
          type: "singleChoice",
          title: "Portrait direction",
          required: true,
          defaultValue: "professional",
          options: [
            { value: "professional", label: "Professional" },
            { value: "cinematic", label: "Cinematic" },
            { value: "fashion", label: "Fashion" },
            { value: "fantasy", label: "Fantasy" },
          ],
        },
      ],
    },
    {
      id: "appearance",
      stageId: "appearance",
      title: "Shape the appearance",
      questions: [
        {
          id: "expressionIntent",
          type: "singleChoice",
          title: "Expression",
          options: [
            { value: "natural", label: "Natural" },
            { value: "confident", label: "Confident" },
            { value: "warm", label: "Warm" },
            { value: "serious", label: "Serious" },
          ],
        },
        {
          id: "expressionOptions",
          type: "modalOptions",
          title: "Expression details",
          buttonLabel: "More expression options",
          modalTitle: "Fine-tune expression",
          description: "Optional details. These refine the selected expression for all portrait subjects.",
          fields: [
            {
              id: "intensity",
              type: "singleChoice",
              title: "Intensity",
              options: [
                { value: "subtle", label: "Subtle" },
                { value: "moderate", label: "Moderate" },
                { value: "pronounced", label: "Pronounced" },
                { value: "exaggerated", label: "Exaggerated" },
              ],
            },
            {
              id: "eyeState",
              type: "singleChoice",
              title: "Eyes",
              options: [
                { value: "relaxed", label: "Relaxed" },
                { value: "soft", label: "Soft" },
                { value: "narrowed", label: "Narrowed" },
                { value: "wide", label: "Wide" },
                { value: "squinting", label: "Squinting" },
                { value: "closed", label: "Closed" },
              ],
            },
            {
              id: "browState",
              type: "singleChoice",
              title: "Brows",
              options: [
                { value: "relaxed", label: "Relaxed" },
                { value: "raised", label: "Raised" },
                { value: "furrowed", label: "Furrowed" },
                { value: "lowered", label: "Lowered" },
              ],
            },
            {
              id: "mouthState",
              type: "singleChoice",
              title: "Mouth",
              options: [
                { value: "neutral", label: "Neutral" },
                { value: "slight_smile", label: "Slight smile" },
                { value: "smile", label: "Smile" },
                { value: "broad_smile", label: "Broad smile" },
                { value: "smirk", label: "Smirk" },
                { value: "frown", label: "Frown" },
                { value: "open", label: "Open" },
                { value: "gritted_teeth", label: "Gritted teeth" },
                { value: "pursed_lips", label: "Pursed lips" },
              ],
            },
          ],
        },
        {
          id: "expressionSubjectOverrides",
          type: "subjectOverrides",
          title: "Expression per subject",
          description: "Keep the shared expression for everyone, or customize only the people who should differ.",
          buttonLabel: "Customize expression per subject",
          modalTitle: "Expression by subject",
          intentTitle: "Expression",
          subjectsAnswerId: "subjects",
          sharedIntentAnswerId: "expressionIntent",
          sharedOptionsAnswerId: "expressionOptions",
        },
        {
          id: "hairIntent",
          type: "singleChoice",
          title: "Hair direction",
          options: [
            { value: "keep_reference", label: "Keep reference" },
            { value: "natural", label: "Natural" },
            { value: "polished", label: "Polished" },
            { value: "editorial", label: "Editorial" },
          ],
        },
        {
          id: "hairOptions",
          type: "modalOptions",
          title: "Hair details",
          buttonLabel: "More hair options",
          modalTitle: "Fine-tune hair",
          description: "Optional structured hair details. They apply to the shared portrait hair direction.",
          fields: [
            {
              id: "length",
              type: "singleChoice",
              title: "Length",
              options: [
                { value: "shaved", label: "Shaved" },
                { value: "very_short", label: "Very short" },
                { value: "short", label: "Short" },
                { value: "chin_length", label: "Chin length" },
                { value: "shoulder_length", label: "Shoulder length" },
                { value: "mid_back", label: "Mid-back" },
                { value: "waist_length", label: "Waist length" },
                { value: "very_long", label: "Very long" },
              ],
            },
            {
              id: "curlPattern",
              type: "singleChoice",
              title: "Texture / curl pattern",
              options: [
                { value: "straight", label: "Straight" },
                { value: "loose_waves", label: "Loose waves" },
                { value: "wavy", label: "Wavy" },
                { value: "curly", label: "Curly" },
                { value: "tight_curls", label: "Tight curls" },
                { value: "coily", label: "Coily" },
              ],
            },
            {
              id: "volume",
              type: "singleChoice",
              title: "Volume",
              options: [
                { value: "flat", label: "Flat" },
                { value: "low", label: "Low" },
                { value: "natural", label: "Natural" },
                { value: "full", label: "Full" },
                { value: "voluminous", label: "Voluminous" },
                { value: "extreme", label: "Extreme" },
              ],
            },
            {
              id: "parting",
              type: "singleChoice",
              title: "Parting",
              options: [
                { value: "center", label: "Center" },
                { value: "side", label: "Side" },
                { value: "deep_side", label: "Deep side" },
                { value: "off_center", label: "Off-center" },
                { value: "zigzag", label: "Zigzag" },
                { value: "no_visible_part", label: "No visible part" },
              ],
            },
          ],
        },
        {
          id: "hairSubjectOverrides",
          type: "subjectOverrides",
          title: "Hair per subject",
          description: "Keep the shared hair direction for everyone, or customize individual people.",
          buttonLabel: "Customize hair per subject",
          modalTitle: "Hair by subject",
          intentTitle: "Hair direction",
          subjectsAnswerId: "subjects",
          sharedIntentAnswerId: "hairIntent",
          sharedOptionsAnswerId: "hairOptions",
        },
        {
          id: "outfitIntent",
          type: "singleChoice",
          title: "Outfit direction",
          options: [
            { value: "keep_reference", label: "Keep reference" },
            { value: "professional", label: "Professional" },
            { value: "fashion", label: "Fashion" },
            { value: "fantasy", label: "Fantasy" },
          ],
        },
        {
          id: "outfitOptions",
          type: "modalOptions",
          title: "Outfit details",
          buttonLabel: "More outfit options",
          modalTitle: "Fine-tune outfit",
          description: "Optional outfit notes. Keep-reference outfits stay untouched and hide these controls.",
          visibleWhen: {
            answerId: "outfitIntent",
            operator: "notEquals",
            value: "keep_reference",
          },
          fields: [
            {
              id: "fitDirection",
              type: "singleChoice",
              title: "Fit direction",
              options: [
                { value: "tailored", label: "Tailored" },
                { value: "fitted", label: "Fitted" },
                { value: "relaxed", label: "Relaxed" },
                { value: "oversized", label: "Oversized" },
              ],
            },
            {
              id: "accessoryDirection",
              type: "singleChoice",
              title: "Accessories",
              options: [
                { value: "minimal", label: "Minimal" },
                { value: "understated", label: "Understated" },
                { value: "statement", label: "Statement" },
              ],
            },
            {
              id: "additionalDetails",
              type: "text",
              title: "Additional outfit details",
              description: "Add a short detail only when the quick direction is not specific enough.",
              placeholder: "e.g. layered styling, structured shoulders, monochrome look...",
              rows: 3,
            },
          ],
        },
        {
          id: "outfitSubjectOverrides",
          type: "subjectOverrides",
          title: "Outfit per subject",
          description: "Keep the shared outfit for everyone, or assign a different direction to individual people.",
          buttonLabel: "Customize outfit per subject",
          modalTitle: "Outfit by subject",
          intentTitle: "Outfit direction",
          subjectsAnswerId: "subjects",
          sharedIntentAnswerId: "outfitIntent",
          sharedOptionsAnswerId: "outfitOptions",
          hideFieldsWhenIntent: ["keep_reference"],
        },
      ],
    },
    {
      id: "composition",
      stageId: "composition",
      title: "Set the composition",
      questions: [
        {
          id: "framingIntent",
          type: "singleChoice",
          title: "Framing",
          required: true,
          defaultValue: "head_shoulders",
          options: [
            { value: "headshot", label: "Headshot" },
            { value: "head_shoulders", label: "Head and shoulders" },
            { value: "half_body", label: "Half body" },
            { value: "full_body", label: "Full body" },
          ],
        },
        {
          id: "poseIntent",
          type: "singleChoice",
          title: "Pose direction",
          visibleWhen: {
            answerId: "framingIntent",
            operator: "notEquals",
            value: "headshot",
          },
          options: [
            { value: "natural", label: "Natural" },
            { value: "formal", label: "Formal" },
            { value: "dynamic", label: "Dynamic" },
          ],
        },
        portraitPoseOptionsQuestion,
        {
          id: "poseSubjectOverrides",
          type: "subjectOverrides",
          title: "Pose per subject",
          description:
            "Keep the shared pose for everyone, or customize pose details for individual people.",
          buttonLabel: "Customize pose per subject",
          modalTitle: "Pose by subject",
          intentTitle: "Pose direction",
          subjectsAnswerId: "subjects",
          sharedIntentAnswerId: "poseIntent",
          sharedOptionsAnswerId: "poseOptions",
          visibleWhen: {
            answerId: "framingIntent",
            operator: "notEquals",
            value: "headshot",
          },
        },
      ],
    },
    {
      id: "environment",
      stageId: "scene",
      title: "Choose the environment",
      questions: [
        {
          id: "environmentType",
          type: "singleChoice",
          title: "Environment type",
          required: true,
          defaultValue: "studio",
          options: [
            { value: "studio", label: "Studio" },
            { value: "outdoor", label: "Outdoor" },
            { value: "abstract", label: "Abstract" },
          ],
        },
        {
          id: "studioDirection",
          type: "text",
          title: "Studio direction",
          placeholder: "Optional studio details...",
          visibleWhen: {
            answerId: "environmentType",
            operator: "equals",
            value: "studio",
          },
        },
        {
          id: "outdoorSetting",
          type: "text",
          title: "Outdoor setting",
          placeholder: "Describe the outdoor setting...",
          visibleWhen: {
            answerId: "environmentType",
            operator: "equals",
            value: "outdoor",
          },
        },
        {
          id: "abstractDirection",
          type: "text",
          title: "Abstract direction",
          placeholder: "Describe the abstract background...",
          visibleWhen: {
            answerId: "environmentType",
            operator: "equals",
            value: "abstract",
          },
        },
        portraitBackgroundOptionsQuestion,
      ],
    },
    {
      id: "lighting",
      stageId: "scene",
      title: "Choose the lighting",
      questions: [
        {
          id: "lightingIntent",
          type: "singleChoice",
          title: "Lighting mood",
          required: true,
          defaultValue: "soft",
          options: [
            { value: "soft", label: "Soft" },
            { value: "dramatic", label: "Dramatic" },
            { value: "moody", label: "Moody" },
            { value: "clean", label: "Clean" },
          ],
        },
      ],
    },
    {
      id: "final-settings",
      stageId: "final",
      title: "Final output settings",
      description: "Review the generated portrait idea and finish the technical choices.",
      questions: [
        {
          id: "idea",
          type: "text",
          title: "Generated idea",
          description:
            "The Wizard built this from your portrait type and subjects. Edit it only if you want to change the core scene intent.",
          placeholder: "The Wizard will generate a portrait idea from your choices...",
          rows: 3,
        },
        {
          id: "aspectRatio",
          type: "singleChoice",
          title: "Aspect ratio",
          required: true,
          defaultValue: "4:5",
          options: [
            { value: "1:1", label: "Square · 1:1" },
            { value: "4:5", label: "Portrait · 4:5" },
            { value: "5:4", label: "Landscape · 5:4" },
            { value: "3:4", label: "Portrait · 3:4" },
            { value: "4:3", label: "Landscape · 4:3" },
            { value: "9:16", label: "Vertical · 9:16" },
            { value: "16:9", label: "Landscape · 16:9" },
          ],
        },
        {
          id: "referenceUsage",
          type: "singleChoice",
          title: "How closely should the result follow the reference?",
          defaultValue: "balanced",
          visibleWhen: {
            answerId: "creationMode",
            operator: "equals",
            value: "from_image",
          },
          options: [
            { value: "strict", label: "Stay close" },
            { value: "balanced", label: "Balanced" },
            { value: "loose", label: "Use it loosely" },
          ],
        },
        {
          id: "transformationStrength",
          type: "singleChoice",
          title: "How strong should the transformation be?",
          defaultValue: "balanced",
          visibleWhen: {
            answerId: "creationMode",
            operator: "equals",
            value: "from_image",
          },
          options: [
            { value: "subtle", label: "Subtle" },
            { value: "balanced", label: "Balanced" },
            { value: "strong", label: "Strong" },
            { value: "extreme", label: "Extreme" },
          ],
        },
      ],
    },
    {
      id: "review",
      stageId: "review",
      kind: "review",
      title: "Review your portrait",
      questions: [],
    },
  ],
} as const satisfies WizardDefinition;
