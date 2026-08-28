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
};

export type WizardVariablePickerQuestionDefinition = WizardQuestionBase & {
  type: "variablePicker";
};

export type WizardQuestionDefinition =
  | WizardSingleChoiceQuestionDefinition
  | WizardTextQuestionDefinition
  | WizardVariablePickerQuestionDefinition;

export type WizardStepDefinition = {
  id: string;
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
  steps: readonly WizardStepDefinition[];
};

function assertNonEmpty(value: string, label: string) {
  if (!value.trim()) {
    throw new Error(`${label} must be non-empty.`);
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

  const stepIds = new Set<string>();
  const questionIds = new Set<string>();

  for (const step of definition.steps) {
    assertNonEmpty(step.id, "Wizard step id");
    assertNonEmpty(step.title, `Wizard step "${step.id}" title`);

    if (stepIds.has(step.id)) {
      throw new Error(`Duplicate Wizard step id: ${step.id}`);
    }
    stepIds.add(step.id);

    for (const question of step.questions) {
      assertNonEmpty(question.id, `Wizard question id in step "${step.id}"`);
      assertNonEmpty(question.title, `Wizard question "${question.id}" title`);

      if (questionIds.has(question.id)) {
        throw new Error(`Duplicate Wizard question id: ${question.id}`);
      }
      questionIds.add(question.id);

      if (question.type === "singleChoice") {
        if (!question.options.length) {
          throw new Error(
            `Wizard singleChoice question "${question.id}" requires options.`,
          );
        }

        const optionValues = new Set<string>();
        for (const option of question.options) {
          assertNonEmpty(
            option.value,
            `Wizard question "${question.id}" option value`,
          );
          assertNonEmpty(
            option.label,
            `Wizard question "${question.id}" option label`,
          );

          if (optionValues.has(option.value)) {
            throw new Error(
              `Duplicate option value "${option.value}" in Wizard question "${question.id}".`,
            );
          }
          optionValues.add(option.value);
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
  }
}

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
