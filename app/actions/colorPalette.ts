import type {
  ColorPaletteRule,
  ColorPaletteSwatch,
  ModuleValues,
  PromptKeyModule,
  SemanticTargetRef,
} from "../modules/types";
import {
  addPromptColorSwatch,
  applyPromptColorAssignmentPreset,
  createPromptColorAssignment,
  deletePromptColorAssignment,
  deletePromptColorSwatch,
  setPromptColorAssignmentScope,
  setPromptColorSwatchLiteral,
  setPromptColorSwatchVariable,
} from "../domain/colorPalette";
import type { DomainIssue } from "../domain/types";
import { ActionRegistry } from "./registry";
import type { ActionContext, ActionDefinition, ActionIssue } from "./types";

function actionIssues(issues: DomainIssue[]): ActionIssue[] {
  return issues.map((issue) => ({ ...issue }));
}

function resolveModule(context: ActionContext): PromptKeyModule | null {
  return context.modules.find((module) => module.key === "colorPalette") || null;
}

function moduleNotFound(context: ActionContext) {
  return {
    ok: false as const,
    draft: context.draft,
    issues: [
      { code: "module_not_found", details: { moduleKey: "colorPalette" } },
    ],
  };
}

type ColorPaletteData = {
  moduleValues: ModuleValues;
  assignments: ColorPaletteRule[];
  assignment?: ColorPaletteRule;
  swatch?: ColorPaletteSwatch;
};

function normalizeResult(
  context: ActionContext,
  result: ReturnType<typeof createPromptColorAssignment>,
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
      swatch: result.value.swatch,
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

export const colorPaletteAssignmentCreateAction: ActionDefinition<
  Record<string, never>,
  ColorPaletteData
> = {
  id: "colorPalette.assignment.create",
  description: "Create an empty color assignment with a new stable ID and canonical Overall target scope.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
  },
  execute: (context) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      createPromptColorAssignment(context.draft, module, {
        createAssignmentId: context.idFactory?.colorAssignment,
      }),
    );
  },
};

export const colorPaletteAssignmentDeleteAction: ActionDefinition<
  { assignmentId: string },
  ColorPaletteData
> = {
  id: "colorPalette.assignment.delete",
  description: "Delete one exact color assignment by stable ID.",
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
      deletePromptColorAssignment(context.draft, module, input.assignmentId),
    );
  },
};

export const colorPaletteAssignmentScopeSetAction: ActionDefinition<
  {
    assignmentId: string;
    targets?: SemanticTargetRef[];
    exceptions?: SemanticTargetRef[];
  },
  ColorPaletteData
> = {
  id: "colorPalette.assignment.scope.set",
  description: "Set the target and/or exception scope of one exact color assignment using canonical semantic-reference rules.",
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
      setPromptColorAssignmentScope(
        context.draft,
        module,
        assignmentId,
        {
          ...(targets !== undefined ? { targets } : {}),
          ...(exceptions !== undefined ? { exceptions } : {}),
        },
        {
          semanticSources: context.environment?.semanticTargetSources?.color,
        },
      ),
    );
  },
};

export const colorPaletteAssignmentApplyPresetAction: ActionDefinition<
  { assignmentId: string; presetId: string },
  ColorPaletteData
> = {
  id: "colorPalette.assignment.applyPreset",
  description: "Apply or clear a Color Palette preset on one exact assignment while preserving its semantic scope.",
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
      applyPromptColorAssignmentPreset(
        context.draft,
        module,
        input.assignmentId,
        input.presetId,
        { createSwatchId: context.idFactory?.colorSwatch },
      ),
    );
  },
};

export const colorPaletteSwatchAddAction: ActionDefinition<
  { assignmentId: string; value?: string },
  ColorPaletteData
> = {
  id: "colorPalette.swatch.add",
  description: "Append one literal swatch to an exact assignment and detach any active palette preset.",
  inputSchema: {
    type: "object",
    required: ["assignmentId"],
    additionalProperties: false,
    properties: {
      assignmentId: { type: "string", minLength: 1 },
      value: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      addPromptColorSwatch(
        context.draft,
        module,
        input.assignmentId,
        input.value ?? "#000000",
        { createSwatchId: context.idFactory?.colorSwatch },
      ),
    );
  },
};

export const colorPaletteSwatchSetLiteralAction: ActionDefinition<
  { assignmentId: string; swatchId: string; value: string },
  ColorPaletteData
> = {
  id: "colorPalette.swatch.setLiteral",
  description: "Set one exact swatch to a literal authored color value and detach any active palette preset.",
  inputSchema: {
    type: "object",
    required: ["assignmentId", "swatchId", "value"],
    additionalProperties: false,
    properties: {
      assignmentId: { type: "string", minLength: 1 },
      swatchId: { type: "string", minLength: 1 },
      value: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      setPromptColorSwatchLiteral(
        context.draft,
        module,
        input.assignmentId,
        input.swatchId,
        input.value,
      ),
    );
  },
};

export const colorPaletteSwatchSetVariableAction: ActionDefinition<
  { assignmentId: string; swatchId: string; variableId: string },
  ColorPaletteData
> = {
  id: "colorPalette.swatch.setVariable",
  description: "Bind one exact swatch to one exact enabled user Color variable and cache its current token/label metadata.",
  inputSchema: {
    type: "object",
    required: ["assignmentId", "swatchId", "variableId"],
    additionalProperties: false,
    properties: {
      assignmentId: { type: "string", minLength: 1 },
      swatchId: { type: "string", minLength: 1 },
      variableId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      setPromptColorSwatchVariable(
        context.draft,
        module,
        input.assignmentId,
        input.swatchId,
        input.variableId,
      ),
    );
  },
};

export const colorPaletteSwatchDeleteAction: ActionDefinition<
  { assignmentId: string; swatchId: string },
  ColorPaletteData
> = {
  id: "colorPalette.swatch.delete",
  description: "Delete one exact swatch by stable ID and detach any active palette preset.",
  inputSchema: {
    type: "object",
    required: ["assignmentId", "swatchId"],
    additionalProperties: false,
    properties: {
      assignmentId: { type: "string", minLength: 1 },
      swatchId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      deletePromptColorSwatch(
        context.draft,
        module,
        input.assignmentId,
        input.swatchId,
      ),
    );
  },
};

export const colorPaletteActions = [
  colorPaletteAssignmentCreateAction,
  colorPaletteAssignmentDeleteAction,
  colorPaletteAssignmentScopeSetAction,
  colorPaletteAssignmentApplyPresetAction,
  colorPaletteSwatchAddAction,
  colorPaletteSwatchSetLiteralAction,
  colorPaletteSwatchSetVariableAction,
  colorPaletteSwatchDeleteAction,
] as const;

export function registerColorPaletteActions(registry: ActionRegistry) {
  colorPaletteActions.forEach((action) => registry.register(action as any));
  return registry;
}
