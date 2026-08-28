import type { PublicActionInvocation } from "../actions/public";
import type { ActionIssue } from "../actions/types";
import type {
  PromptVariable,
  SemanticTargetRef,
} from "../modules/types";
import type {
  PromptMode,
  ReferenceUsage,
  TransformationStrength,
} from "../utils/compilePromptCore";
import { normalizeSemanticTarget } from "../utils/semanticTargets";
import {
  formatWizardEntityLabelList,
  getWizardEntityDisplayLabel,
  normalizeWizardEntityAnswers,
  wizardEntityToPromptVariable,
  type WizardEntityAnswer,
} from "./entities";
import type {
  WizardActionHostContext,
  WizardSession,
} from "./session";
import {
  executeWizardAction,
  replaceWizardDerived,
  setWizardDefaultAnswer,
} from "./session";

export type PortraitIntent = "professional" | "cinematic" | "fashion" | "fantasy";
export type PortraitExpressionIntent = "natural" | "confident" | "warm" | "serious";
export type PortraitHairIntent = "keep_reference" | "natural" | "polished" | "editorial";
export type PortraitOutfitIntent = "keep_reference" | "professional" | "fashion" | "fantasy";
export type PortraitFramingIntent = "headshot" | "head_shoulders" | "half_body" | "full_body";
export type PortraitPoseIntent = "natural" | "formal" | "dynamic";
export type PortraitEnvironmentType = "studio" | "outdoor" | "abstract";
export type PortraitLightingIntent = "soft" | "dramatic" | "moody" | "clean";

export type PortraitWizardDerived = {
  subjectTarget: SemanticTargetRef;
  subjectTargets: SemanticTargetRef[];
  subjectToken: string;
  subjectTokens: string[];
  subjectVariables: PromptVariable[];
  portraitIntent: PortraitIntent;
  promptIdea: string;
  promptMode: PromptMode;
  aspectRatio: string;
  referenceUsage: ReferenceUsage;
  transformationStrength: TransformationStrength;
  expressionIntent?: PortraitExpressionIntent;
  hairIntent?: PortraitHairIntent;
  outfitIntent?: PortraitOutfitIntent;
  framingIntent: PortraitFramingIntent;
  framingShotSize: string;
  poseIntent?: PortraitPoseIntent;
  posePresetId?: string;
  environmentType: PortraitEnvironmentType;
  backgroundPresetId: string;
  environmentDetails: string;
  lightingIntent: PortraitLightingIntent;
  lightingPresetId: string;
};

export type PortraitWizardMappingResult =
  | {
      ok: true;
      session: WizardSession;
      derived: PortraitWizardDerived;
      actions: PublicActionInvocation[];
    }
  | {
      ok: false;
      session: WizardSession;
      derived?: PortraitWizardDerived;
      actions: PublicActionInvocation[];
      issues: ActionIssue[];
    };

const PORTRAIT_INTENTS = new Set<PortraitIntent>([
  "professional",
  "cinematic",
  "fashion",
  "fantasy",
]);
const EXPRESSION_INTENTS = new Set<PortraitExpressionIntent>([
  "natural",
  "confident",
  "warm",
  "serious",
]);
const HAIR_INTENTS = new Set<PortraitHairIntent>([
  "keep_reference",
  "natural",
  "polished",
  "editorial",
]);
const OUTFIT_INTENTS = new Set<PortraitOutfitIntent>([
  "keep_reference",
  "professional",
  "fashion",
  "fantasy",
]);
const FRAMING_INTENTS = new Set<PortraitFramingIntent>([
  "headshot",
  "head_shoulders",
  "half_body",
  "full_body",
]);
const POSE_INTENTS = new Set<PortraitPoseIntent>([
  "natural",
  "formal",
  "dynamic",
]);
const ENVIRONMENT_TYPES = new Set<PortraitEnvironmentType>([
  "studio",
  "outdoor",
  "abstract",
]);
const LIGHTING_INTENTS = new Set<PortraitLightingIntent>([
  "soft",
  "dramatic",
  "moody",
  "clean",
]);
const REFERENCE_USAGE = new Set<ReferenceUsage>(["strict", "balanced", "loose"]);
const TRANSFORMATION_STRENGTH = new Set<TransformationStrength>([
  "subtle",
  "balanced",
  "strong",
  "extreme",
]);

const PORTRAIT_ASPECT_RATIO_MAP: Record<string, string> = {
  "1:1": "common_square",
  "4:5": "common_portrait_4_5",
  "3:4": "common_portrait_3_4",
  "9:16": "common_vertical_9_16",
  "16:9": "common_widescreen_16_9",
};

const FRAMING_SHOT_SIZE: Record<PortraitFramingIntent, string> = {
  headshot: "close_up",
  head_shoulders: "head_and_shoulders",
  half_body: "medium_subject",
  full_body: "full_subject",
};

const POSE_PRESET: Record<PortraitPoseIntent, string> = {
  natural: "relaxed_standing",
  formal: "neutral_standing",
  dynamic: "action_ready",
};

const BACKGROUND_PRESET: Record<PortraitEnvironmentType, string> = {
  studio: "studio_background",
  outdoor: "outdoor_environment",
  abstract: "abstract_background",
};

const LIGHTING_PRESET: Record<PortraitLightingIntent, string> = {
  soft: "soft_diffused",
  dramatic: "low_key",
  moody: "moody_side",
  clean: "clean_studio",
};

const ENVIRONMENT_DETAIL_ANSWER: Record<PortraitEnvironmentType, string> = {
  studio: "studioDirection",
  outdoor: "outdoorSetting",
  abstract: "abstractDirection",
};

const SUBJECT_ORDINALS = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function answerValue(session: WizardSession, answerId: string) {
  return session.answers[answerId]?.value;
}

function enumAnswer<T extends string>(
  session: WizardSession,
  answerId: string,
  allowed: ReadonlySet<T>,
): T | null {
  const value = answerValue(session, answerId);
  return typeof value === "string" && allowed.has(value as T)
    ? (value as T)
    : null;
}

function issue(code: string, answerId?: string): ActionIssue {
  return {
    code,
    ...(answerId ? { path: `answers.${answerId}` } : {}),
  };
}

function variableToken(variable: PromptVariable) {
  return `{${variable.key}}`;
}

function joinSubjectTokens(tokens: string[]) {
  if (!tokens.length) return "{person}";
  if (tokens.length === 1) return tokens[0];
  if (tokens.length === 2) return `${tokens[0]} and ${tokens[1]}`;
  return `${tokens.slice(0, -1).join(", ")}, and ${tokens[tokens.length - 1]}`;
}

function subjectOrdinal(index: number) {
  return SUBJECT_ORDINALS[index] || `${index + 1}th`;
}

function portraitEntityVariableValue(
  entity: WizardEntityAnswer,
  index: number,
  total: number,
  mode: PromptMode,
) {
  if (mode === "image_to_image") {
    return total > 1
      ? `${subjectOrdinal(index)} person in {reference}`
      : "person in {reference}";
  }

  const explicitLabel = cleanText(entity.label);
  if (explicitLabel) return `a person named ${getWizardEntityDisplayLabel(entity)}`;
  return total > 1 ? `${subjectOrdinal(index)} person` : "a person";
}

export function buildPortraitDraftTitle(
  entities: readonly WizardEntityAnswer[],
) {
  const subjectNames = formatWizardEntityLabelList(entities);
  return subjectNames ? `Portrait of ${subjectNames}` : "Portrait Wizard Prompt";
}

export function normalizePortraitSubjectReference(
  value: unknown,
): SemanticTargetRef | null {
  const semanticTarget = normalizeSemanticTarget(value);
  if (
    semanticTarget &&
    (semanticTarget.kind === "user_variable" ||
      semanticTarget.kind === "system_variable") &&
    cleanText(semanticTarget.value)
  ) {
    return semanticTarget;
  }

  if (!isRecord(value)) return null;

  const variable = value as Partial<PromptVariable>;
  if (
    typeof variable.id !== "string" ||
    !variable.id.trim() ||
    typeof variable.key !== "string" ||
    !variable.key.trim()
  ) {
    return null;
  }

  if (variable.source === "module") return null;

  const source = variable.source === "system" ? "system_variable" : "user_variable";
  const token = variableToken(variable as PromptVariable);

  return {
    kind: source,
    value: token,
    variableId: variable.id,
    token,
    label: cleanText(variable.label) || variable.key,
  };
}

function resolvePromptMode(session: WizardSession): PromptMode {
  if (session.wizardVersion === 1) return session.workingDraft.promptSettings.mode;
  return answerValue(session, "creationMode") === "from_description"
    ? "text_to_image"
    : "image_to_image";
}

function resolvePortraitSubjects(session: WizardSession) {
  if (session.wizardVersion === 1) {
    const value = answerValue(session, "subjectReference");
    const target = normalizePortraitSubjectReference(value);
    const variable = isRecord(value) ? (value as PromptVariable) : null;
    return {
      targets: target ? [target] : [],
      variables: target && variable ? [variable] : [],
    };
  }

  const entities = normalizeWizardEntityAnswers(answerValue(session, "subjects"));
  const mode = resolvePromptMode(session);
  const variables = entities.map((entity, index) =>
    wizardEntityToPromptVariable(entity, {
      value: portraitEntityVariableValue(entity, index, entities.length, mode),
      description: `${getWizardEntityDisplayLabel(entity)} portrait subject`,
    }),
  );
  const targets = variables
    .map((variable) => normalizePortraitSubjectReference(variable))
    .filter((target): target is SemanticTargetRef => Boolean(target));

  return { targets, variables };
}

function fallbackPortraitIdea(
  intent: PortraitIntent,
  tokens: string[],
) {
  const subjectPhrase = joinSubjectTokens(tokens);
  return tokens.length > 1
    ? `A ${intent} portrait of ${subjectPhrase} together, with the following settings`
    : `A ${intent} portrait of ${subjectPhrase} with the following settings`;
}

export function applyPortraitWizardRules(session: WizardSession): WizardSession {
  const portraitIntent = enumAnswer(session, "portraitIntent", PORTRAIT_INTENTS);
  if (!portraitIntent) return session;

  let nextSession = setWizardDefaultAnswer(
    session,
    "lightingIntent",
    portraitIntent === "cinematic" ? "dramatic" : "soft",
  );

  if (session.wizardVersion === 2) {
    const subjects = resolvePortraitSubjects(nextSession);
    const subjectTokens = subjects.targets.map((target) =>
      cleanText(target.token || target.value),
    );

    if (subjectTokens.length) {
      nextSession = setWizardDefaultAnswer(
        nextSession,
        "idea",
        fallbackPortraitIdea(portraitIntent, subjectTokens),
      );
    }
  }

  return nextSession;
}

export function derivePortraitWizardState(
  session: WizardSession,
):
  | { ok: true; value: PortraitWizardDerived }
  | { ok: false; issues: ActionIssue[] } {
  if (
    session.wizardId !== "portrait" ||
    (session.wizardVersion !== 1 && session.wizardVersion !== 2)
  ) {
    return { ok: false, issues: [issue("portrait_wizard_session_mismatch")] };
  }

  const issues: ActionIssue[] = [];
  const subjects = resolvePortraitSubjects(session);
  const subjectTargets = subjects.targets;
  const subjectTarget = subjectTargets[0] || null;
  const subjectTokens = subjectTargets.map((target) =>
    cleanText(target.token || target.value),
  );
  const portraitIntent = enumAnswer(
    session,
    "portraitIntent",
    PORTRAIT_INTENTS,
  );
  const framingIntent = enumAnswer(
    session,
    "framingIntent",
    FRAMING_INTENTS,
  );
  const environmentType = enumAnswer(
    session,
    "environmentType",
    ENVIRONMENT_TYPES,
  );
  const lightingIntent = enumAnswer(
    session,
    "lightingIntent",
    LIGHTING_INTENTS,
  );

  if (!subjectTarget) {
    issues.push(
      issue(
        "portrait_subject_reference_required",
        session.wizardVersion === 1 ? "subjectReference" : "subjects",
      ),
    );
  }
  if (!portraitIntent) issues.push(issue("portrait_intent_required", "portraitIntent"));
  if (!framingIntent) issues.push(issue("portrait_framing_required", "framingIntent"));
  if (!environmentType) issues.push(issue("portrait_environment_required", "environmentType"));
  if (!lightingIntent) issues.push(issue("portrait_lighting_required", "lightingIntent"));
  if (session.wizardVersion === 2 && !answerValue(session, "creationMode")) {
    issues.push(issue("portrait_creation_mode_required", "creationMode"));
  }

  if (
    issues.length ||
    !subjectTarget ||
    !portraitIntent ||
    !framingIntent ||
    !environmentType ||
    !lightingIntent
  ) {
    return { ok: false, issues };
  }

  const expressionIntent =
    enumAnswer(session, "expressionIntent", EXPRESSION_INTENTS) || undefined;
  const hairIntent = enumAnswer(session, "hairIntent", HAIR_INTENTS) || undefined;
  const outfitIntent =
    enumAnswer(session, "outfitIntent", OUTFIT_INTENTS) || undefined;
  const poseIntent =
    framingIntent === "headshot"
      ? undefined
      : enumAnswer(session, "poseIntent", POSE_INTENTS) || undefined;
  const detailAnswerId = ENVIRONMENT_DETAIL_ANSWER[environmentType];
  const environmentDetails = cleanText(answerValue(session, detailAnswerId));
  const userIdea = cleanText(answerValue(session, "idea"));
  const promptIdea = session.wizardVersion === 1
    ? `${portraitIntent} portrait`
    : userIdea || fallbackPortraitIdea(portraitIntent, subjectTokens);
  const promptMode = resolvePromptMode(session);
  const aspectRatioAnswer = cleanText(answerValue(session, "aspectRatio"));
  const aspectRatio = session.wizardVersion === 2
    ? PORTRAIT_ASPECT_RATIO_MAP[aspectRatioAnswer] || session.workingDraft.promptSettings.aspectRatio
    : session.workingDraft.promptSettings.aspectRatio;
  const referenceUsage =
    enumAnswer(session, "referenceUsage", REFERENCE_USAGE) ||
    session.workingDraft.promptSettings.imageToImage.referenceUsage;
  const transformationStrength =
    enumAnswer(session, "transformationStrength", TRANSFORMATION_STRENGTH) ||
    session.workingDraft.promptSettings.imageToImage.transformationStrength;

  return {
    ok: true,
    value: {
      subjectTarget,
      subjectTargets,
      subjectToken: subjectTokens.join(", "),
      subjectTokens,
      subjectVariables: subjects.variables,
      portraitIntent,
      promptIdea,
      promptMode,
      aspectRatio,
      referenceUsage,
      transformationStrength,
      expressionIntent,
      hairIntent,
      outfitIntent,
      framingIntent,
      framingShotSize: FRAMING_SHOT_SIZE[framingIntent],
      poseIntent,
      posePresetId: poseIntent ? POSE_PRESET[poseIntent] : undefined,
      environmentType,
      backgroundPresetId: BACKGROUND_PRESET[environmentType],
      environmentDetails,
      lightingIntent,
      lightingPresetId: LIGHTING_PRESET[lightingIntent],
    },
  };
}

function recordData(value: unknown) {
  return isRecord(value) ? value : {};
}

function entityId(data: unknown, key: "assignment" | "style" | "set" | "item") {
  const entity = recordData(data)[key];
  return isRecord(entity) && typeof entity.id === "string" && entity.id.trim()
    ? entity.id
    : "";
}

function expressionPayload(intent: PortraitExpressionIntent) {
  if (intent === "natural") return { presetId: "neutral_calm" } as const;
  if (intent === "warm") return { presetId: "warm_smile" } as const;
  if (intent === "serious") {
    return { patch: { coreExpression: "serious" } } as const;
  }
  return { patch: { additionalDetails: "confident expression" } } as const;
}

function hairProperty(intent: Exclude<PortraitHairIntent, "keep_reference">) {
  if (intent === "natural") return { mode: "option", value: "natural" } as const;
  if (intent === "polished") return { mode: "option", value: "controlled" } as const;
  return { mode: "custom", value: "editorial styling" } as const;
}

function outfitCustomType(intent: Exclude<PortraitOutfitIntent, "keep_reference">) {
  if (intent === "professional") return "professional attire";
  if (intent === "fashion") return "fashion-forward attire";
  return "fantasy attire";
}

function portraitImageToImagePatch(derived: PortraitWizardDerived) {
  return {
    referenceUsage: derived.referenceUsage,
    transformationStrength: derived.transformationStrength,
    preserveMainSubject: false,
    preserveIdentity: false,
    preservePose: false,
    preserveOutfit: false,
    preserveComposition: false,
    preserveColors: false,
    preserveMaterials: false,
    preserveLighting: false,
  };
}

const MAIN_REFERENCE = {
  token: "{reference}",
  label: "Reference",
  source: "system",
} as const;

export async function executePortraitWizardMapping(
  session: WizardSession,
  hostContext: WizardActionHostContext,
): Promise<PortraitWizardMappingResult> {
  const ruledSession = applyPortraitWizardRules(session);
  const derivedResult = derivePortraitWizardState(ruledSession);
  if (!derivedResult.ok) {
    return {
      ok: false,
      session: ruledSession,
      actions: [],
      issues: derivedResult.issues,
    };
  }

  const derived = derivedResult.value;
  const baselineSession = replaceWizardDerived(ruledSession, derived);
  let currentSession = baselineSession;
  const actions: PublicActionInvocation[] = [];

  async function run<TData = unknown>(request: PublicActionInvocation) {
    actions.push(request);
    const execution = await executeWizardAction<TData>(
      currentSession,
      request,
      hostContext,
    );
    if (execution.result.ok) currentSession = execution.session;
    return execution.result;
  }

  function failure(issues: ActionIssue[]): PortraitWizardMappingResult {
    return {
      ok: false,
      session: baselineSession,
      derived,
      actions,
      issues,
    };
  }

  let result;

  if (session.wizardVersion === 2) {
    for (const variable of derived.subjectVariables) {
      result = await run({
        actionId: "variable.create",
        input: {
          key: variable.key,
          value: variable.value,
          description: variable.description,
          type: variable.type,
          enabled: true,
        },
      });
      if (!result.ok) return failure(result.issues);
    }
  }

  result = await run({
    actionId: "prompt.settings.update",
    input: {
      mode: derived.promptMode,
      idea: derived.promptIdea,
      subject: derived.subjectToken,
      subjectType: "person",
      aspectRatio: derived.aspectRatio,
      imageToImage: portraitImageToImagePatch(derived),
    },
  });
  if (!result.ok) return failure(result.issues);

  if (derived.expressionIntent) {
    result = await run({
      actionId: "module.activate",
      input: { moduleKey: "expression" },
    });
    if (!result.ok) return failure(result.issues);

    result = await run({ actionId: "expression.assignment.create", input: {} });
    if (!result.ok) return failure(result.issues);
    const assignmentId = entityId(result.data, "assignment");
    if (!assignmentId) {
      return failure([issue("portrait_expression_assignment_id_missing")]);
    }

    result = await run({
      actionId: "expression.assignment.update",
      input: { assignmentId, targets: derived.subjectTargets },
    });
    if (!result.ok) return failure(result.issues);

    const payload = expressionPayload(derived.expressionIntent);
    result =
      "presetId" in payload
        ? await run({
            actionId: "expression.assignment.applyPreset",
            input: { assignmentId, presetId: payload.presetId },
          })
        : await run({
            actionId: "expression.assignment.update",
            input: { assignmentId, ...payload.patch },
          });
    if (!result.ok) return failure(result.issues);
  }

  if (derived.hairIntent) {
    result = await run({
      actionId: "module.activate",
      input: { moduleKey: "hair" },
    });
    if (!result.ok) return failure(result.issues);

    result = await run({ actionId: "hair.style.create", input: {} });
    if (!result.ok) return failure(result.issues);
    const styleId = entityId(result.data, "style");
    if (!styleId) return failure([issue("portrait_hair_style_id_missing")]);

    result = await run({
      actionId: "hair.style.update",
      input: {
        styleId,
        name: "Portrait Hair",
        targets: derived.subjectTargets,
      },
    });
    if (!result.ok) return failure(result.issues);

    if (derived.hairIntent === "keep_reference") {
      result = await run({
        actionId: "hair.style.setSource",
        input: {
          styleId,
          source: { mode: "reference", reference: MAIN_REFERENCE },
        },
      });
    } else {
      result = await run({
        actionId: "hair.style.setProperty",
        input: {
          styleId,
          propertyId: "stylingState",
          state: hairProperty(derived.hairIntent),
        },
      });
    }
    if (!result.ok) return failure(result.issues);
  }

  if (derived.outfitIntent && derived.outfitIntent !== "keep_reference") {
    result = await run({
      actionId: "module.activate",
      input: { moduleKey: "outfit" },
    });
    if (!result.ok) return failure(result.issues);

    result = await run({ actionId: "outfit.set.create", input: {} });
    if (!result.ok) return failure(result.issues);
    const setId = entityId(result.data, "set");
    if (!setId) return failure([issue("portrait_outfit_set_id_missing")]);

    result = await run({
      actionId: "outfit.set.update",
      input: {
        setId,
        name: "Portrait Outfit",
        targets: derived.subjectTargets,
      },
    });
    if (!result.ok) return failure(result.issues);

    result = await run({
      actionId: "outfit.item.create",
      input: { setId, choiceKind: "custom" },
    });
    if (!result.ok) return failure(result.issues);
    const itemId = entityId(result.data, "item");
    if (!itemId) return failure([issue("portrait_outfit_item_id_missing")]);

    result = await run({
      actionId: "outfit.item.update",
      input: {
        setId,
        itemId,
        customType: outfitCustomType(derived.outfitIntent),
        customCategory: "custom",
      },
    });
    if (!result.ok) return failure(result.issues);
  }

  result = await run({
    actionId: "module.activate",
    input: { moduleKey: "framing" },
  });
  if (!result.ok) return failure(result.issues);
  result = await run({
    actionId: "module.field.set",
    input: {
      moduleKey: "framing",
      fieldId: "shotSize",
      value: derived.framingShotSize,
    },
  });
  if (!result.ok) return failure(result.issues);

  if (derived.posePresetId) {
    result = await run({
      actionId: "module.activate",
      input: { moduleKey: "pose" },
    });
    if (!result.ok) return failure(result.issues);

    result = await run({ actionId: "pose.assignment.create", input: {} });
    if (!result.ok) return failure(result.issues);
    const assignmentId = entityId(result.data, "assignment");
    if (!assignmentId) {
      return failure([issue("portrait_pose_assignment_id_missing")]);
    }

    result = await run({
      actionId: "pose.assignment.update",
      input: { assignmentId, targets: derived.subjectTargets },
    });
    if (!result.ok) return failure(result.issues);

    result = await run({
      actionId: "pose.assignment.applyPreset",
      input: { assignmentId, presetId: derived.posePresetId },
    });
    if (!result.ok) return failure(result.issues);
  }

  result = await run({
    actionId: "module.activate",
    input: { moduleKey: "background" },
  });
  if (!result.ok) return failure(result.issues);
  result = await run({
    actionId: "module.preset.apply",
    input: { moduleKey: "background", presetId: derived.backgroundPresetId },
  });
  if (!result.ok) return failure(result.issues);
  if (derived.environmentDetails) {
    result = await run({
      actionId: "module.field.set",
      input: {
        moduleKey: "background",
        fieldId: "extraDetails",
        value: derived.environmentDetails,
      },
    });
    if (!result.ok) return failure(result.issues);
  }

  result = await run({
    actionId: "module.activate",
    input: { moduleKey: "lighting" },
  });
  if (!result.ok) return failure(result.issues);
  result = await run({
    actionId: "module.preset.apply",
    input: { moduleKey: "lighting", presetId: derived.lightingPresetId },
  });
  if (!result.ok) return failure(result.issues);

  return {
    ok: true,
    session: currentSession,
    derived,
    actions,
  };
}
