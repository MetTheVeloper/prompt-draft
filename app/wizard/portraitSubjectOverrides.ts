import type { PublicActionInvocation } from "../actions/public";
import type { ActionIssue } from "../actions/types";
import type { PromptVariable, SemanticTargetRef } from "../modules/types";
import {
  executePortraitWizardMapping,
  type PortraitWizardMappingResult,
} from "./portrait";
import {
  normalizePortraitPoseOptions,
  PORTRAIT_POSE_OPTION_KEYS,
  portraitPoseOptionsPatch,
} from "./portraitPoseOptions";
import {
  executeWizardAction,
  type WizardActionHostContext,
  type WizardSession,
} from "./session";

export type WizardLookSubjectOverride = {
  intent?: string;
  options: Record<string, string>;
};

export type WizardLookSubjectOverrides = Record<string, WizardLookSubjectOverride>;

const EXPRESSION_INTENTS = new Set(["natural", "confident", "warm", "serious"]);
const HAIR_INTENTS = new Set(["keep_reference", "natural", "polished", "editorial"]);
const OUTFIT_INTENTS = new Set(["keep_reference", "professional", "fashion", "fantasy"]);
const POSE_INTENTS = new Set(["natural", "formal", "dynamic"]);

const EXPRESSION_OPTION_KEYS = new Set([
  "intensity",
  "eyeState",
  "browState",
  "mouthState",
]);
const HAIR_OPTION_KEYS = new Set(["length", "curlPattern", "volume", "parting"]);
const OUTFIT_OPTION_KEYS = new Set([
  "fitDirection",
  "accessoryDirection",
  "additionalDetails",
]);

const POSE_PRESET: Record<string, string> = {
  natural: "relaxed_standing",
  formal: "neutral_standing",
  dynamic: "action_ready",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function targetsOf(value: unknown): SemanticTargetRef[] {
  if (!isRecord(value) || !Array.isArray(value.targets)) return [];
  return value.targets as SemanticTargetRef[];
}

function entityId(value: unknown, key: "assignment" | "style" | "set" | "item") {
  if (!isRecord(value)) return "";
  const entity = value[key];
  return isRecord(entity) && typeof entity.id === "string" ? entity.id : "";
}

function normalizeOverrides(
  session: WizardSession,
  answerId: string,
  subjectIds: ReadonlySet<string>,
  intents: ReadonlySet<string>,
  optionKeys: ReadonlySet<string>,
): WizardLookSubjectOverrides {
  const raw = session.answers[answerId]?.value;
  if (!isRecord(raw)) return {};

  const result: WizardLookSubjectOverrides = {};
  for (const [subjectId, rawOverride] of Object.entries(raw)) {
    if (!subjectIds.has(subjectId) || !isRecord(rawOverride)) continue;

    const intentText = cleanText(rawOverride.intent);
    const intent = intentText && intents.has(intentText) ? intentText : undefined;
    const rawOptions = isRecord(rawOverride.options) ? rawOverride.options : {};
    const options: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawOptions)) {
      if (!optionKeys.has(key)) continue;
      const cleaned = cleanText(value);
      if (cleaned) options[key] = cleaned;
    }

    if (intent || Object.keys(options).length) {
      result[subjectId] = { ...(intent ? { intent } : {}), options };
    }
  }

  return result;
}

function targetForVariable(
  targets: readonly SemanticTargetRef[],
  variableId: string,
) {
  return targets.find((target) => target.variableId === variableId) || null;
}

function remainingSharedTargets(
  targets: readonly SemanticTargetRef[],
  overrideIds: ReadonlySet<string>,
) {
  return targets.filter(
    (target) => !target.variableId || !overrideIds.has(target.variableId),
  );
}

function firstArrayItem(draftValue: unknown, key: string) {
  if (!isRecord(draftValue)) return null;
  const list = draftValue[key];
  return Array.isArray(list) ? list[0] || null : null;
}

function subjectLabel(variables: readonly PromptVariable[], variableId: string) {
  const variable = variables.find((item) => item.id === variableId);
  return variable?.label || variable?.key || "Subject";
}

function expressionPayload(intent: string) {
  if (intent === "natural") return { presetId: "neutral_calm" } as const;
  if (intent === "warm") return { presetId: "warm_smile" } as const;
  if (intent === "serious") return { patch: { coreExpression: "serious" } } as const;
  return { patch: { additionalDetails: "confident expression" } } as const;
}

function hairProperty(intent: string) {
  if (intent === "natural") return { mode: "option", value: "natural" } as const;
  if (intent === "polished") return { mode: "option", value: "controlled" } as const;
  return { mode: "custom", value: "editorial styling" } as const;
}

function outfitCustomType(intent?: string) {
  if (intent === "professional") return "professional attire";
  if (intent === "fashion") return "fashion-forward attire";
  if (intent === "fantasy") return "fantasy attire";
  return "portrait attire";
}

function outfitDetails(options: Record<string, string>) {
  const parts: string[] = [];
  if (options.fitDirection) parts.push(`${options.fitDirection} fit`);
  if (options.accessoryDirection) {
    parts.push(`${options.accessoryDirection} accessories`);
  }
  if (options.additionalDetails) parts.push(options.additionalDetails);
  return parts.join("; ");
}

const MAIN_REFERENCE = {
  token: "{reference}",
  label: "Reference",
  source: "system",
} as const;

export async function executePortraitWizardMappingWithSubjectOverrides(
  session: WizardSession,
  hostContext: WizardActionHostContext,
): Promise<PortraitWizardMappingResult> {
  const base = await executePortraitWizardMapping(session, hostContext);
  if (!base.ok || session.wizardVersion !== 2) return base;

  const subjectIds = new Set(base.derived.subjectVariables.map((variable) => variable.id));
  const expressionOverrides = normalizeOverrides(
    session,
    "expressionSubjectOverrides",
    subjectIds,
    EXPRESSION_INTENTS,
    EXPRESSION_OPTION_KEYS,
  );
  const hairOverrides = normalizeOverrides(
    session,
    "hairSubjectOverrides",
    subjectIds,
    HAIR_INTENTS,
    HAIR_OPTION_KEYS,
  );
  const outfitOverrides = normalizeOverrides(
    session,
    "outfitSubjectOverrides",
    subjectIds,
    OUTFIT_INTENTS,
    OUTFIT_OPTION_KEYS,
  );
  const poseOverrides = base.derived.framingIntent === "headshot"
    ? {}
    : normalizeOverrides(
        session,
        "poseSubjectOverrides",
        subjectIds,
        POSE_INTENTS,
        PORTRAIT_POSE_OPTION_KEYS,
      );
  const sharedPoseOptions = base.derived.framingIntent === "headshot"
    ? {}
    : normalizePortraitPoseOptions(session.answers.poseOptions?.value);
  const sharedPosePatch = portraitPoseOptionsPatch(sharedPoseOptions);

  if (
    !Object.keys(expressionOverrides).length &&
    !Object.keys(hairOverrides).length &&
    !Object.keys(outfitOverrides).length &&
    !Object.keys(poseOverrides).length &&
    !Object.keys(sharedPosePatch).length
  ) {
    return base;
  }

  let currentSession = base.session;
  const actions: PublicActionInvocation[] = [...base.actions];

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
      session,
      derived: base.derived,
      actions,
      issues,
    };
  }

  async function retargetOrDeleteShared(
    moduleKey: "expression" | "hair" | "outfit" | "pose",
    overrideIds: ReadonlySet<string>,
  ) {
    if (!overrideIds.size) return { ok: true as const };
    const values = currentSession.workingDraft.moduleValues[moduleKey];
    const shared = moduleKey === "expression"
      ? firstArrayItem(values, "expressionAssignments")
      : moduleKey === "hair"
        ? firstArrayItem(values, "hairStyles")
        : moduleKey === "outfit"
          ? firstArrayItem(values, "outfitSets")
          : firstArrayItem(values, "poseAssignments");
    if (!shared || !isRecord(shared) || typeof shared.id !== "string") {
      return { ok: true as const };
    }

    const targets = remainingSharedTargets(targetsOf(shared), overrideIds);
    if (targets.length) {
      return moduleKey === "expression"
        ? run({
            actionId: "expression.assignment.update",
            input: { assignmentId: shared.id, targets },
          })
        : moduleKey === "hair"
          ? run({
              actionId: "hair.style.update",
              input: { styleId: shared.id, targets },
            })
          : moduleKey === "outfit"
            ? run({
                actionId: "outfit.set.update",
                input: { setId: shared.id, targets },
              })
            : run({
                actionId: "pose.assignment.update",
                input: { assignmentId: shared.id, targets },
              });
    }

    return moduleKey === "expression"
      ? run({
          actionId: "expression.assignment.delete",
          input: { assignmentId: shared.id },
        })
      : moduleKey === "hair"
        ? run({ actionId: "hair.style.delete", input: { styleId: shared.id } })
        : moduleKey === "outfit"
          ? run({ actionId: "outfit.set.delete", input: { setId: shared.id } })
          : run({
              actionId: "pose.assignment.delete",
              input: { assignmentId: shared.id },
            });
  }

  if (Object.keys(sharedPosePatch).length) {
    let result = await run({ actionId: "module.activate", input: { moduleKey: "pose" } });
    if (!result.ok) return failure(result.issues);

    let sharedPose = firstArrayItem(
      currentSession.workingDraft.moduleValues.pose,
      "poseAssignments",
    );
    if (!sharedPose || !isRecord(sharedPose) || typeof sharedPose.id !== "string") {
      result = await run({ actionId: "pose.assignment.create", input: {} });
      if (!result.ok) return failure(result.issues);
      const assignmentId = entityId(result.data, "assignment");
      if (!assignmentId) {
        return failure([{ code: "portrait_pose_assignment_id_missing" }]);
      }
      result = await run({
        actionId: "pose.assignment.update",
        input: { assignmentId, targets: base.derived.subjectTargets },
      });
      if (!result.ok) return failure(result.issues);
      sharedPose = firstArrayItem(
        currentSession.workingDraft.moduleValues.pose,
        "poseAssignments",
      );
    }

    if (sharedPose && isRecord(sharedPose) && typeof sharedPose.id === "string") {
      result = await run({
        actionId: "pose.assignment.update",
        input: { assignmentId: sharedPose.id, ...sharedPosePatch },
      });
      if (!result.ok) return failure(result.issues);
    }
  }

  if (Object.keys(expressionOverrides).length) {
    let result = await run({ actionId: "module.activate", input: { moduleKey: "expression" } });
    if (!result.ok) return failure(result.issues);
    result = await retargetOrDeleteShared(
      "expression",
      new Set(Object.keys(expressionOverrides)),
    );
    if (!result.ok) return failure(result.issues);

    for (const [subjectId, override] of Object.entries(expressionOverrides)) {
      const target = targetForVariable(base.derived.subjectTargets, subjectId);
      if (!target) continue;

      result = await run({ actionId: "expression.assignment.create", input: {} });
      if (!result.ok) return failure(result.issues);
      const assignmentId = entityId(result.data, "assignment");
      if (!assignmentId) {
        return failure([{ code: "portrait_expression_override_assignment_id_missing" }]);
      }

      result = await run({
        actionId: "expression.assignment.update",
        input: { assignmentId, targets: [target] },
      });
      if (!result.ok) return failure(result.issues);

      if (override.intent) {
        const payload = expressionPayload(override.intent);
        result = "presetId" in payload
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

      if (Object.keys(override.options).length) {
        result = await run({
          actionId: "expression.assignment.update",
          input: { assignmentId, ...override.options },
        });
        if (!result.ok) return failure(result.issues);
      }
    }
  }

  if (Object.keys(hairOverrides).length) {
    let result = await run({ actionId: "module.activate", input: { moduleKey: "hair" } });
    if (!result.ok) return failure(result.issues);
    result = await retargetOrDeleteShared("hair", new Set(Object.keys(hairOverrides)));
    if (!result.ok) return failure(result.issues);

    for (const [subjectId, override] of Object.entries(hairOverrides)) {
      const target = targetForVariable(base.derived.subjectTargets, subjectId);
      if (!target) continue;
      const label = subjectLabel(base.derived.subjectVariables, subjectId);

      result = await run({ actionId: "hair.style.create", input: {} });
      if (!result.ok) return failure(result.issues);
      const styleId = entityId(result.data, "style");
      if (!styleId) return failure([{ code: "portrait_hair_override_style_id_missing" }]);

      result = await run({
        actionId: "hair.style.update",
        input: { styleId, name: `${label} Hair`, targets: [target] },
      });
      if (!result.ok) return failure(result.issues);

      if (override.intent === "keep_reference") {
        result = await run({
          actionId: "hair.style.setSource",
          input: {
            styleId,
            source: { mode: "reference", reference: MAIN_REFERENCE },
          },
        });
        if (!result.ok) return failure(result.issues);
      } else if (override.intent) {
        result = await run({
          actionId: "hair.style.setProperty",
          input: {
            styleId,
            propertyId: "stylingState",
            state: hairProperty(override.intent),
          },
        });
        if (!result.ok) return failure(result.issues);
      }

      for (const [propertyId, value] of Object.entries(override.options)) {
        result = await run({
          actionId: "hair.style.setProperty",
          input: {
            styleId,
            propertyId,
            state: { mode: "option", value },
          },
        });
        if (!result.ok) return failure(result.issues);
      }
    }
  }

  if (Object.keys(outfitOverrides).length) {
    let result = await run({ actionId: "module.activate", input: { moduleKey: "outfit" } });
    if (!result.ok) return failure(result.issues);
    result = await retargetOrDeleteShared("outfit", new Set(Object.keys(outfitOverrides)));
    if (!result.ok) return failure(result.issues);

    for (const [subjectId, override] of Object.entries(outfitOverrides)) {
      if (override.intent === "keep_reference") continue;
      const target = targetForVariable(base.derived.subjectTargets, subjectId);
      if (!target) continue;
      const details = outfitDetails(override.options);
      if (!override.intent && !details) continue;
      const label = subjectLabel(base.derived.subjectVariables, subjectId);

      result = await run({ actionId: "outfit.set.create", input: {} });
      if (!result.ok) return failure(result.issues);
      const setId = entityId(result.data, "set");
      if (!setId) return failure([{ code: "portrait_outfit_override_set_id_missing" }]);

      result = await run({
        actionId: "outfit.set.update",
        input: { setId, name: `${label} Outfit`, targets: [target] },
      });
      if (!result.ok) return failure(result.issues);

      result = await run({
        actionId: "outfit.item.create",
        input: { setId, choiceKind: "custom" },
      });
      if (!result.ok) return failure(result.issues);
      const itemId = entityId(result.data, "item");
      if (!itemId) return failure([{ code: "portrait_outfit_override_item_id_missing" }]);

      result = await run({
        actionId: "outfit.item.update",
        input: {
          setId,
          itemId,
          customType: outfitCustomType(override.intent),
          customCategory: "custom",
          ...(details ? { additionalDetails: details } : {}),
        },
      });
      if (!result.ok) return failure(result.issues);
    }
  }

  if (Object.keys(poseOverrides).length) {
    let result = await run({ actionId: "module.activate", input: { moduleKey: "pose" } });
    if (!result.ok) return failure(result.issues);
    result = await retargetOrDeleteShared("pose", new Set(Object.keys(poseOverrides)));
    if (!result.ok) return failure(result.issues);

    for (const [subjectId, override] of Object.entries(poseOverrides)) {
      if (!override.intent && !Object.keys(override.options).length) continue;
      const target = targetForVariable(base.derived.subjectTargets, subjectId);
      if (!target) continue;

      result = await run({ actionId: "pose.assignment.create", input: {} });
      if (!result.ok) return failure(result.issues);
      const assignmentId = entityId(result.data, "assignment");
      if (!assignmentId) {
        return failure([{ code: "portrait_pose_override_assignment_id_missing" }]);
      }

      result = await run({
        actionId: "pose.assignment.update",
        input: { assignmentId, targets: [target] },
      });
      if (!result.ok) return failure(result.issues);

      if (override.intent) {
        const presetId = POSE_PRESET[override.intent];
        if (presetId) {
          result = await run({
            actionId: "pose.assignment.applyPreset",
            input: { assignmentId, presetId },
          });
          if (!result.ok) return failure(result.issues);
        }
      }

      const posePatch = portraitPoseOptionsPatch(override.options);
      if (Object.keys(posePatch).length) {
        result = await run({
          actionId: "pose.assignment.update",
          input: { assignmentId, ...posePatch },
        });
        if (!result.ok) return failure(result.issues);
      }
    }
  }

  return {
    ok: true,
    session: currentSession,
    derived: base.derived,
    actions,
  };
}
