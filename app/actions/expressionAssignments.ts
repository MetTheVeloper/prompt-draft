import type {
  ExpressionAssignment,
  ModuleValues,
  PromptKeyModule,
  SemanticTargetRef,
} from "../modules/types";
import {
  applyPromptExpressionAssignmentPreset,
  createPromptExpressionAssignment,
  deletePromptExpressionAssignment,
  updatePromptExpressionAssignment,
  type ExpressionAssignmentPatch,
} from "../domain/expressionAssignments";
import type { DomainIssue } from "../domain/types";
import { ActionRegistry } from "./registry";
import type { ActionContext, ActionDefinition, ActionIssue } from "./types";

function actionIssues(issues: DomainIssue[]): ActionIssue[] {
  return issues.map((issue) => ({ ...issue }));
}

function resolveModule(context: ActionContext): PromptKeyModule | null {
  return context.modules.find((module) => module.key === "expression") || null;
}

function moduleNotFound(context: ActionContext) {
  return {
    ok: false as const,
    draft: context.draft,
    issues: [
      { code: "module_not_found", details: { moduleKey: "expression" } },
    ],
  };
}

type ExpressionAssignmentData = {
  moduleValues: ModuleValues;
  assignments: ExpressionAssignment[];
  assignment?: ExpressionAssignment;
};

function normalizeResult(
  context: ActionContext,
  result: ReturnType<typeof createPromptExpressionAssignment>,
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
  coreExpression: { type: "string" as const },
  intensity: { type: "string" as const },
  eyeState: { type: "string" as const },
  browState: { type: "string" as const },
  mouthState: { type: "string" as const },
  additionalDetails: { type: "string" as const },
  targets: { type: "array" as const, items: semanticTargetSchema },
};

export const expressionAssignmentCreateAction: ActionDefinition<
  Record<string, never>,
  ExpressionAssignmentData
> = {
  id: "expression.assignment.create",
  description:
    "Create an empty Expression assignment with a new stable ID and the first explicit available subject target when provided.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
  },
  execute: (context) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      createPromptExpressionAssignment(context.draft, module, {
        createAssignmentId: context.idFactory?.expressionAssignment,
        subjectSources: context.environment?.subjectAssignmentTargets,
      }),
    );
  },
};

export const expressionAssignmentUpdateAction: ActionDefinition<
  { assignmentId: string } & ExpressionAssignmentPatch,
  ExpressionAssignmentData
> = {
  id: "expression.assignment.update",
  description:
    "Update the explicit Expression payload and/or exact subject targets for one stable assignment. Payload edits detach the active preset; target-only edits do not.",
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
      updatePromptExpressionAssignment(
        context.draft,
        module,
        assignmentId,
        patch,
        {
          subjectSources: context.environment?.subjectAssignmentTargets,
        },
      ),
    );
  },
};

export const expressionAssignmentDeleteAction: ActionDefinition<
  { assignmentId: string },
  ExpressionAssignmentData
> = {
  id: "expression.assignment.delete",
  description: "Delete one exact Expression assignment by stable ID.",
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
      deletePromptExpressionAssignment(
        context.draft,
        module,
        input.assignmentId,
      ),
    );
  },
};

export const expressionAssignmentApplyPresetAction: ActionDefinition<
  { assignmentId: string; presetId: string },
  ExpressionAssignmentData
> = {
  id: "expression.assignment.applyPreset",
  description:
    "Apply or clear one Expression preset while preserving exact subject targets and authored additional details.",
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
      applyPromptExpressionAssignmentPreset(
        context.draft,
        module,
        input.assignmentId,
        input.presetId,
      ),
    );
  },
};

export const expressionAssignmentActions = [
  expressionAssignmentCreateAction,
  expressionAssignmentUpdateAction,
  expressionAssignmentDeleteAction,
  expressionAssignmentApplyPresetAction,
] as const;

export function registerExpressionAssignmentActions(registry: ActionRegistry) {
  expressionAssignmentActions.forEach((action) => registry.register(action as any));
  return registry;
}
