import type {
  ModuleValues,
  PoseAssignment,
  PromptKeyModule,
  SemanticTargetRef,
} from "../modules/types";
import {
  applyPromptPoseAssignmentPreset,
  createPromptPoseAssignment,
  deletePromptPoseAssignment,
  updatePromptPoseAssignment,
  type PoseAssignmentPatch,
} from "../domain/poseAssignments";
import type { DomainIssue } from "../domain/types";
import { ActionRegistry } from "./registry";
import type { ActionContext, ActionDefinition, ActionIssue } from "./types";

function actionIssues(issues: DomainIssue[]): ActionIssue[] {
  return issues.map((issue) => ({ ...issue }));
}

function resolveModule(context: ActionContext): PromptKeyModule | null {
  return context.modules.find((module) => module.key === "pose") || null;
}

function moduleNotFound(context: ActionContext) {
  return {
    ok: false as const,
    draft: context.draft,
    issues: [{ code: "module_not_found", details: { moduleKey: "pose" } }],
  };
}

type PoseAssignmentData = {
  moduleValues: ModuleValues;
  assignments: PoseAssignment[];
  assignment?: PoseAssignment;
};

function normalizeResult(
  context: ActionContext,
  result: ReturnType<typeof createPromptPoseAssignment>,
) {
  if (!result.ok) {
    return {
      ok: false as const,
      draft: context.draft,
      issues: actionIssues(result.issues),
    };
  }

  return {
    ok: true as const,
    draft: result.value.draft,
    data: {
      moduleValues: result.value.moduleValues,
      assignments: result.value.assignments,
      assignment: result.value.assignment,
    },
  };
}

const semanticTargetSchema = {
  type: "object" as const,
  required: ["kind", "value"] as const,
  additionalProperties: false,
  properties: {
    kind: {
      type: "string" as const,
      enum: [
        "builtin",
        "module_output",
        "user_variable",
        "system_variable",
        "typography_group",
        "typography_text",
        "custom",
      ] as const,
    },
    value: { type: "string" as const, minLength: 1 },
    variableId: { type: "string" as const },
    entityId: { type: "string" as const },
    moduleKey: { type: "string" as const },
    token: { type: "string" as const },
    label: { type: "string" as const },
    parentLabel: { type: "string" as const },
  },
};

const updateProperties = {
  assignmentId: { type: "string" as const, minLength: 1 },
  basePosture: { type: "string" as const },
  torsoPosture: { type: "string" as const },
  weightBalance: { type: "string" as const },
  bodyTension: { type: "string" as const },
  locomotion: { type: "string" as const },
  gestures: { type: "array" as const, items: { type: "string" as const } },
  interactionDetails: { type: "string" as const },
  additionalDetails: { type: "string" as const },
  targets: { type: "array" as const, items: semanticTargetSchema },
};

export const poseAssignmentCreateAction: ActionDefinition<
  Record<string, never>,
  PoseAssignmentData
> = {
  id: "pose.assignment.create",
  description: "Create an empty Pose assignment with a new stable ID and the first explicit available subject target when provided.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
  },
  execute: (context) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      createPromptPoseAssignment(context.draft, module, {
        createAssignmentId: context.idFactory?.poseAssignment,
        subjectSources: context.environment?.subjectAssignmentTargets,
      }),
    );
  },
};

export const poseAssignmentUpdateAction: ActionDefinition<
  { assignmentId: string } & PoseAssignmentPatch,
  PoseAssignmentData
> = {
  id: "pose.assignment.update",
  description: "Update the explicit Pose payload and/or exact subject targets for one stable assignment. Payload edits detach the active preset; target-only edits do not.",
  inputSchema: {
    type: "object",
    required: ["assignmentId"],
    additionalProperties: false,
    properties: updateProperties,
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    const { assignmentId, ...patch } = input;
    return normalizeResult(
      context,
      updatePromptPoseAssignment(context.draft, module, assignmentId, patch, {
        subjectSources: context.environment?.subjectAssignmentTargets,
      }),
    );
  },
};

export const poseAssignmentDeleteAction: ActionDefinition<
  { assignmentId: string },
  PoseAssignmentData
> = {
  id: "pose.assignment.delete",
  description: "Delete one exact Pose assignment by stable ID.",
  inputSchema: {
    type: "object",
    required: ["assignmentId"],
    additionalProperties: false,
    properties: {
      assignmentId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      deletePromptPoseAssignment(context.draft, module, input.assignmentId),
    );
  },
};

export const poseAssignmentApplyPresetAction: ActionDefinition<
  { assignmentId: string; presetId: string },
  PoseAssignmentData
> = {
  id: "pose.assignment.applyPreset",
  description: "Apply or clear one Pose preset while preserving exact subject targets and authored additional details.",
  inputSchema: {
    type: "object",
    required: ["assignmentId", "presetId"],
    additionalProperties: false,
    properties: {
      assignmentId: { type: "string", minLength: 1 },
      presetId: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      applyPromptPoseAssignmentPreset(
        context.draft,
        module,
        input.assignmentId,
        input.presetId,
      ),
    );
  },
};

export const poseAssignmentActions = [
  poseAssignmentCreateAction,
  poseAssignmentUpdateAction,
  poseAssignmentDeleteAction,
  poseAssignmentApplyPresetAction,
] as const;

export function registerPoseAssignmentActions(registry: ActionRegistry) {
  poseAssignmentActions.forEach((action) => registry.register(action as any));
  return registry;
}
