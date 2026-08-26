import type { ModuleValues, PromptKeyModule, TypographyTextBlock, TypographyTextGroup } from "../modules/types";
import {
  createTypographyGroup,
  createTypographyText,
  deleteTypographyGroup,
  deleteTypographyText,
  moveTypographyGroup,
  moveTypographyText,
  updateTypographyGroup,
  updateTypographyText,
  type TypographyGroupPatch,
  type TypographyTextPatch,
} from "../domain/typography";
import type { DomainIssue } from "../domain/types";
import { ActionRegistry } from "./registry";
import type { ActionContext, ActionDefinition, ActionIssue } from "./types";

function actionIssues(issues: DomainIssue[]): ActionIssue[] {
  return issues.map((issue) => ({ ...issue }));
}

function resolveTypographyModule(context: ActionContext): PromptKeyModule | null {
  return context.modules.find((module) => module.key === "typography") || null;
}

function moduleNotFound(context: ActionContext) {
  return {
    ok: false as const,
    draft: context.draft,
    issues: [{ code: "module_not_found", details: { moduleKey: "typography" } }],
  };
}

type TypographyData = {
  moduleValues: ModuleValues;
  groups: TypographyTextGroup[];
  group?: TypographyTextGroup;
  text?: TypographyTextBlock;
};

function normalizeResult(
  context: ActionContext,
  result: ReturnType<typeof createTypographyGroup>,
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
      groups: result.value.groups,
      group: result.value.group,
      text: result.value.text,
    },
  };
}

const groupPatchProperties = {
  groupPurpose: { type: "string" as const },
  customGroupPurpose: { type: "string" as const },
  positionSource: {
    type: "string" as const,
    enum: ["preset", "layout_region", "custom"] as const,
  },
  positionPreset: { type: "string" as const },
  layoutRegionId: { type: "string" as const },
  customPositionDescription: { type: "string" as const },
  direction: { type: "string" as const, enum: ["row", "column"] as const },
  writingDirection: {
    type: "string" as const,
    enum: ["", "ltr", "rtl", "vertical_ttb", "vertical_btt"] as const,
  },
  alignment: {
    type: "string" as const,
    enum: ["start", "center", "end", "justify"] as const,
  },
  distribution: {
    type: "string" as const,
    enum: ["compact", "balanced", "spaced", "scattered"] as const,
  },
  additionalDescription: { type: "string" as const },
};

const textPatchProperties = {
  text: { type: "string" as const },
  purpose: { type: "string" as const },
  customPurpose: { type: "string" as const },
  fontStyle: { type: "string" as const },
  customFontStyle: { type: "string" as const },
  fontSize: { type: "string" as const },
  customFontSize: { type: "string" as const },
  fontWeight: { type: "string" as const },
  customFontWeight: { type: "string" as const },
  additionalDescription: { type: "string" as const },
};

export const typographyGroupCreateAction: ActionDefinition<
  TypographyGroupPatch,
  TypographyData
> = {
  id: "typography.group.create",
  description: "Create a Typography text group with stable identity and a structural group token derived from that identity.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: groupPatchProperties,
  },
  execute: (context, input) => {
    const module = resolveTypographyModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      createTypographyGroup(
        context.draft,
        module,
        input,
        context.idFactory?.typographyGroup,
      ),
    );
  },
};

export const typographyGroupUpdateAction: ActionDefinition<
  { groupId: string } & TypographyGroupPatch,
  TypographyData
> = {
  id: "typography.group.update",
  description: "Update one exact Typography group while preserving its stable ID, structural token, and contained text identities.",
  inputSchema: {
    type: "object",
    required: ["groupId"],
    additionalProperties: false,
    properties: {
      groupId: { type: "string", minLength: 1 },
      ...groupPatchProperties,
    },
  },
  execute: (context, input) => {
    const module = resolveTypographyModule(context);
    if (!module) return moduleNotFound(context);
    const { groupId, ...patch } = input;
    return normalizeResult(
      context,
      updateTypographyGroup(context.draft, module, groupId, patch),
    );
  },
};

export const typographyGroupDeleteAction: ActionDefinition<
  { groupId: string },
  TypographyData
> = {
  id: "typography.group.delete",
  description: "Delete one exact Typography group and the text blocks contained by that group.",
  inputSchema: {
    type: "object",
    required: ["groupId"],
    additionalProperties: false,
    properties: { groupId: { type: "string", minLength: 1 } },
  },
  execute: (context, input) => {
    const module = resolveTypographyModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      deleteTypographyGroup(context.draft, module, input.groupId),
    );
  },
};

export const typographyGroupMoveAction: ActionDefinition<
  { groupId: string; toIndex: number },
  TypographyData
> = {
  id: "typography.group.move",
  description: "Move one exact Typography group to an explicit collection index without changing stable identity.",
  inputSchema: {
    type: "object",
    required: ["groupId", "toIndex"],
    additionalProperties: false,
    properties: {
      groupId: { type: "string", minLength: 1 },
      toIndex: { type: "number", min: 0 },
    },
  },
  execute: (context, input) => {
    const module = resolveTypographyModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      moveTypographyGroup(context.draft, module, input.groupId, input.toIndex),
    );
  },
};

export const typographyTextCreateAction: ActionDefinition<
  { groupId: string; text: string } & Omit<TypographyTextPatch, "text">,
  TypographyData
> = {
  id: "typography.text.create",
  description: "Create a non-empty Typography text block in one exact group with a new stable ID and structural layer token.",
  inputSchema: {
    type: "object",
    required: ["groupId", "text"],
    additionalProperties: false,
    properties: {
      groupId: { type: "string", minLength: 1 },
      ...textPatchProperties,
    },
  },
  execute: (context, input) => {
    const module = resolveTypographyModule(context);
    if (!module) return moduleNotFound(context);
    const { groupId, ...patch } = input;
    return normalizeResult(
      context,
      createTypographyText(
        context.draft,
        module,
        groupId,
        patch,
        context.idFactory?.typographyText,
      ),
    );
  },
};

export const typographyTextUpdateAction: ActionDefinition<
  { groupId: string; textId: string } & TypographyTextPatch,
  TypographyData
> = {
  id: "typography.text.update",
  description: "Update one exact Typography text block while preserving stable ID and structural layer token.",
  inputSchema: {
    type: "object",
    required: ["groupId", "textId"],
    additionalProperties: false,
    properties: {
      groupId: { type: "string", minLength: 1 },
      textId: { type: "string", minLength: 1 },
      ...textPatchProperties,
    },
  },
  execute: (context, input) => {
    const module = resolveTypographyModule(context);
    if (!module) return moduleNotFound(context);
    const { groupId, textId, ...patch } = input;
    return normalizeResult(
      context,
      updateTypographyText(context.draft, module, groupId, textId, patch),
    );
  },
};

export const typographyTextDeleteAction: ActionDefinition<
  { groupId: string; textId: string },
  TypographyData
> = {
  id: "typography.text.delete",
  description: "Delete one exact Typography text block from one exact group.",
  inputSchema: {
    type: "object",
    required: ["groupId", "textId"],
    additionalProperties: false,
    properties: {
      groupId: { type: "string", minLength: 1 },
      textId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const module = resolveTypographyModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      deleteTypographyText(context.draft, module, input.groupId, input.textId),
    );
  },
};

export const typographyTextMoveAction: ActionDefinition<
  { groupId: string; textId: string; toIndex: number },
  TypographyData
> = {
  id: "typography.text.move",
  description: "Reorder one exact Typography text block inside its current group without changing identity.",
  inputSchema: {
    type: "object",
    required: ["groupId", "textId", "toIndex"],
    additionalProperties: false,
    properties: {
      groupId: { type: "string", minLength: 1 },
      textId: { type: "string", minLength: 1 },
      toIndex: { type: "number", min: 0 },
    },
  },
  execute: (context, input) => {
    const module = resolveTypographyModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      moveTypographyText(
        context.draft,
        module,
        input.groupId,
        input.textId,
        input.toIndex,
      ),
    );
  },
};

export const typographyActions = [
  typographyGroupCreateAction,
  typographyGroupUpdateAction,
  typographyGroupDeleteAction,
  typographyGroupMoveAction,
  typographyTextCreateAction,
  typographyTextUpdateAction,
  typographyTextDeleteAction,
  typographyTextMoveAction,
] as const;

export function registerTypographyActions(registry: ActionRegistry) {
  typographyActions.forEach((action) => registry.register(action as any));
  return registry;
}
