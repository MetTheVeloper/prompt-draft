import type {
  WizardModalFieldDefinition,
  WizardQuestionDefinition,
  WizardQuestionOption,
} from "./definition";
import type { WizardEntityAnswer } from "./entities";

export type PortraitLivingUiLocalizer = {
  t: (key: string, params?: Record<string, string | number>) => string;
  te?: (key: string) => boolean;
};

const VALUE_GROUP_BY_ANSWER_ID: Record<string, string> = {
  creationMode: "creationMode",
  portraitIntent: "portrait",
  expressionIntent: "expression",
  hairIntent: "hair",
  outfitIntent: "outfit",
  framingIntent: "framing",
  poseIntent: "pose",
  environmentType: "environment",
  lightingIntent: "lighting",
  referenceUsage: "referenceUsage",
  transformationStrength: "transformationStrength",
};

function translatedOrFallback(
  localizer: PortraitLivingUiLocalizer,
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
) {
  if (localizer.te && !localizer.te(key)) return fallback;
  const translated = localizer.t(key, params);
  return translated && translated !== key ? translated : fallback;
}

export function localizePortraitLivingValue(
  localizer: PortraitLivingUiLocalizer,
  answerId: string,
  value: unknown,
  fallback?: string,
) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return fallback || "";
  const group = VALUE_GROUP_BY_ANSWER_ID[answerId];
  const readable = fallback || raw.replaceAll("_", " ");
  if (!group) return readable;
  return translatedOrFallback(
    localizer,
    `wizard.living.values.${group}.${raw}`,
    readable,
  );
}

export function localizePortraitLivingDomain(
  localizer: PortraitLivingUiLocalizer,
  domain: string,
) {
  return translatedOrFallback(
    localizer,
    `wizard.living.values.domains.${domain}`,
    domain.replaceAll("_", " "),
  );
}

export function getPortraitLivingSubjectDisplayLabel(
  localizer: PortraitLivingUiLocalizer,
  subject: WizardEntityAnswer,
  index: number,
  total: number,
) {
  const explicit = subject.label.trim();
  if (explicit) return explicit;
  return total > 1
    ? translatedOrFallback(
        localizer,
        "wizard.living.subjects.fallbackNumbered",
        `Person ${index + 1}`,
        { number: index + 1 },
      )
    : translatedOrFallback(
        localizer,
        "wizard.living.subjects.fallbackSingle",
        "Person",
      );
}

function questionText(
  localizer: PortraitLivingUiLocalizer,
  questionId: string,
  suffix: string,
  fallback?: string,
) {
  if (!fallback) return fallback;
  return translatedOrFallback(
    localizer,
    `wizard.living.questionLabels.${questionId}.${suffix}`,
    fallback,
  );
}

function localizeOption(
  localizer: PortraitLivingUiLocalizer,
  questionId: string,
  option: WizardQuestionOption,
): WizardQuestionOption {
  return {
    ...option,
    label: translatedOrFallback(
      localizer,
      `wizard.living.questionLabels.${questionId}.options.${option.value}.label`,
      option.label,
    ),
    ...(option.description
      ? {
          description: translatedOrFallback(
            localizer,
            `wizard.living.questionLabels.${questionId}.options.${option.value}.description`,
            option.description,
          ),
        }
      : {}),
  };
}

function localizeField(
  localizer: PortraitLivingUiLocalizer,
  questionId: string,
  field: WizardModalFieldDefinition,
): WizardModalFieldDefinition {
  const base = `wizard.living.questionLabels.${questionId}.fields.${field.id}`;
  if (field.type === "singleChoice") {
    return {
      ...field,
      title: translatedOrFallback(localizer, `${base}.title`, field.title),
      ...(field.description
        ? { description: translatedOrFallback(localizer, `${base}.description`, field.description) }
        : {}),
      options: field.options.map((option) => ({
        ...option,
        label: translatedOrFallback(
          localizer,
          `${base}.options.${option.value}.label`,
          option.label,
        ),
        ...(option.description
          ? {
              description: translatedOrFallback(
                localizer,
                `${base}.options.${option.value}.description`,
                option.description,
              ),
            }
          : {}),
      })),
    };
  }

  return {
    ...field,
    title: translatedOrFallback(localizer, `${base}.title`, field.title),
    ...(field.description
      ? { description: translatedOrFallback(localizer, `${base}.description`, field.description) }
      : {}),
    ...(field.placeholder
      ? { placeholder: translatedOrFallback(localizer, `${base}.placeholder`, field.placeholder) }
      : {}),
  };
}

export function localizePortraitLivingQuestion<T extends WizardQuestionDefinition>(
  question: T,
  localizer: PortraitLivingUiLocalizer,
): T {
  const common = {
    ...question,
    title: questionText(localizer, question.id, "title", question.title) || question.title,
    ...(question.description
      ? { description: questionText(localizer, question.id, "description", question.description) }
      : {}),
  };

  if (question.type === "singleChoice") {
    return {
      ...common,
      options: question.options.map((option) =>
        localizeOption(localizer, question.id, option),
      ),
    } as T;
  }

  if (question.type === "modalOptions") {
    return {
      ...common,
      ...(question.buttonLabel
        ? { buttonLabel: questionText(localizer, question.id, "buttonLabel", question.buttonLabel) }
        : {}),
      ...(question.modalTitle
        ? { modalTitle: questionText(localizer, question.id, "modalTitle", question.modalTitle) }
        : {}),
      fields: question.fields.map((field) =>
        localizeField(localizer, question.id, field),
      ),
    } as T;
  }

  if (question.type === "text") {
    return {
      ...common,
      ...(question.placeholder
        ? { placeholder: questionText(localizer, question.id, "placeholder", question.placeholder) }
        : {}),
    } as T;
  }

  if (question.type === "subjectOverrides") {
    return {
      ...common,
      ...(question.buttonLabel
        ? { buttonLabel: questionText(localizer, question.id, "buttonLabel", question.buttonLabel) }
        : {}),
      ...(question.modalTitle
        ? { modalTitle: questionText(localizer, question.id, "modalTitle", question.modalTitle) }
        : {}),
      ...(question.intentTitle
        ? { intentTitle: questionText(localizer, question.id, "intentTitle", question.intentTitle) }
        : {}),
    } as T;
  }

  return common as T;
}
