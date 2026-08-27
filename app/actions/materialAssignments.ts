import type {
  MaterialAssignment,
  ModuleValues,
  PromptKeyModule,
  SemanticTargetRef,
} from "../modules/types";
import {
  applyPromptMaterialAssignmentPreset,
  createPromptMaterialAssignment,
  deletePromptMaterialAssignment,
  setPromptMaterialAssignmentConditions,
  setPromptMaterialAssignmentProperty,
  setPromptMaterialAssignmentScope,
  type MaterialAssignmentProperty,
} from "../domain/materialAssignments";
import type { DomainIssue } from "../domain/types";
import { ActionRegistry } from "./registry";
import type { ActionContext, ActionDefinition, ActionIssue } from "./types";

function actionIssues(issues: DomainIssue[]): ActionIssue[] {
  return issues.map((issue) => ({ ...issue }));
}

function resolveModule(context: ActionContext): PromptKeyModule | null {
  return context.modules.find((module) => module.key === "texture") || null;
}

function moduleNotFound(context: ActionContext) {
  return {
    ok: false as const,
    draft: context.draft,
    issues: [{ code: "module_not_found", details: { moduleKey: "texture" } }],
  };
}

type MaterialAssignmentData = {
  moduleValues: ModuleValues;
  assignments: MaterialAssignment[];
  assignment?: MaterialAssignment;
};

function normalizeResult(
  context: ActionContext,
  result: ReturnType<typeof createPromptMaterialAssignment>,
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

const MATERIAL_PROPERTIES = [
  "material",
  "finish",
  "surfaceTexture",
  "opticalCharacter",
  "textureProminence",
] as const satisfies readonly MaterialAssignmentProperty[];

export const textureAssignmentCreateAction: ActionDefinition<
  Record<string, never>,
  MaterialAssignmentData
> = {
  id: "texture.assignment.create",
  description: "Create an empty material assignment with a new stable ID and canonical All Surfaces scope.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
  },
  execute: (context) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      createPromptMaterialAssignment(context.draft, module, {
        createAssignmentId: context.idFactory?.materialAssignment,
      }),
    );
  },
};

export const textureAssignmentDeleteAction: ActionDefinition<
  { assignmentId: string },
  MaterialAssignmentData
> = {
  id: "texture.assignment.delete",
  description: "Delete one exact material assignment by stable ID.",
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
      deletePromptMaterialAssignment(
        context.draft,
        module,
        input.assignmentId,
      ),
    );
  },
};

export const textureAssignmentScopeSetAction: ActionDefinition<
  {
    assignmentId: string;
    targets?: SemanticTargetRef[];
    exceptions?: SemanticTargetRef[];
  },
  MaterialAssignmentData
> = {
  id: "texture.assignment.scope.set",
  description: "Set target and/or exception scope for one exact material assignment using canonical material semantic-reference rules.",
  inputSchema: {
    type: "object",
    required: ["assignmentId"],
    additionalProperties: false,
    properties: {
      assignmentId: { type: "string", minLength: 1 },
      targets: { type: "array", items: semanticTargetSchema },
      exceptions: { type: "array", items: semanticTargetSchema },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    const { assignmentId, targets, exceptions } = input;
    return normalizeResult(
      context,
      setPromptMaterialAssignmentScope(
        context.draft,
        module,
        assignmentId,
        {
          ...(targets !== undefined ? { targets } : {}),
          ...(exceptions !== undefined ? { exceptions } : {}),
        },
        {
          semanticSources: context.environment?.semanticTargetSources?.material,
        },
      ),
    );
  },
};

export const textureAssignmentApplyPresetAction: ActionDefinition<
  { assignmentId: string; presetId: string },
  MaterialAssignmentData
> = {
  id: "texture.assignment.applyPreset",
  description: "Apply or clear one Texture material preset while preserving the assignment's exact semantic scope.",
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
      applyPromptMaterialAssignmentPreset(
        context.draft,
        module,
        input.assignmentId,
        input.presetId,
      ),
    );
  },
};

export const textureAssignmentPropertySetAction: ActionDefinition<
  {
    assignmentId: string;
    property: MaterialAssignmentProperty;
    value: string;
  },
  MaterialAssignmentData
> = {
  id: "texture.assignment.property.set",
  description: "Set one authored material property on an exact assignment and detach any active material preset. Catalog and freeform values are both preserved.",
  inputSchema: {
    type: "object",
    required: ["assignmentId", "property", "value"],
    additionalProperties: false,
    properties: {
      assignmentId: { type: "string", minLength: 1 },
      property: { type: "string", enum: MATERIAL_PROPERTIES },
      value: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      setPromptMaterialAssignmentProperty(
        context.draft,
        module,
        input.assignmentId,
        input.property,
        input.value,
      ),
    );
  },
};

export const textureAssignmentConditionsSetAction: ActionDefinition<
  { assignmentId: string; conditions: string[] },
  MaterialAssignmentData
> = {
  id: "texture.assignment.conditions.set",
  description: "Replace authored surface conditions on one exact material assignment and detach any active material preset.",
  inputSchema: {
    type: "object",
    required: ["assignmentId", "conditions"],
    additionalProperties: false,
    properties: {
      assignmentId: { type: "string", minLength: 1 },
      conditions: { type: "array", items: { type: "string" } },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      setPromptMaterialAssignmentConditions(
        context.draft,
        module,
        input.assignmentId,
        input.conditions,
      ),
    );
  },
};

export const textureAssignmentActions = [
  textureAssignmentCreateAction,
  textureAssignmentDeleteAction,
  textureAssignmentScopeSetAction,
  textureAssignmentApplyPresetAction,
  textureAssignmentPropertySetAction,
  textureAssignmentConditionsSetAction,
] as const;

export function registerTextureAssignmentActions(registry: ActionRegistry) {
  textureAssignmentActions.forEach((action) => registry.register(action as any));
  return registry;
}
