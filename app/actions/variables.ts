import type { PromptVariable } from "../modules/types";
import type { PromptDraftState } from "../modules/promptDraft.types";
import {
  createPromptVariable,
  deletePromptVariable,
  duplicatePromptVariable,
  setPromptVariableEnabled,
  updatePromptVariable,
  USER_PROMPT_VARIABLE_TYPES,
  type CreatePromptVariableInput,
  type UpdatePromptVariableInput,
} from "../domain/variables";
import type { DomainIssue } from "../domain/types";
import type {
  ActionContext,
  ActionDefinition,
  ActionIssue,
} from "./types";
import { ActionRegistry } from "./registry";

const VARIABLES_MODULE_KEY = "variables";
const VARIABLES_FIELD_KEY = "variables";

function cloneVariables(value: unknown): PromptVariable[] {
  if (!Array.isArray(value)) return [];

  return JSON.parse(JSON.stringify(value)) as PromptVariable[];
}

function getDraftVariables(draft: PromptDraftState) {
  return cloneVariables(
    draft.moduleValues[VARIABLES_MODULE_KEY]?.[VARIABLES_FIELD_KEY],
  );
}

function withDraftVariables(
  draft: PromptDraftState,
  variables: PromptVariable[],
  activateModule = false,
): PromptDraftState {
  const selectedModuleKeys = activateModule &&
    !draft.selectedModuleKeys.includes(VARIABLES_MODULE_KEY)
    ? [VARIABLES_MODULE_KEY, ...draft.selectedModuleKeys]
    : [...draft.selectedModuleKeys];

  return {
    ...draft,
    selectedModuleKeys,
    moduleValues: {
      ...draft.moduleValues,
      [VARIABLES_MODULE_KEY]: {
        ...(draft.moduleValues[VARIABLES_MODULE_KEY] || {}),
        [VARIABLES_FIELD_KEY]: cloneVariables(variables),
      },
    },
  };
}

function actionIssues(issues: DomainIssue[]): ActionIssue[] {
  return issues.map((issue) => ({ ...issue }));
}

function variableOptions(context: ActionContext) {
  return {
    blockedKeys: context.environment?.activeSystemVariableKeys || [],
    createId: context.idFactory?.variable,
  };
}

type VariableCreateActionInput = CreatePromptVariableInput;

type VariableUpdateActionInput = UpdatePromptVariableInput & {
  variableId: string;
};

type VariableIdActionInput = {
  variableId: string;
};

type VariableEnabledActionInput = VariableIdActionInput & {
  enabled: boolean;
};

const editableProperties = {
  key: { type: "string" as const },
  value: { type: "string" as const },
  description: { type: "string" as const },
  type: {
    type: "string" as const,
    enum: [...USER_PROMPT_VARIABLE_TYPES],
  },
  enabled: { type: "boolean" as const },
};

export const variableCreateAction: ActionDefinition<
  VariableCreateActionInput,
  { variable: PromptVariable }
> = {
  id: "variable.create",
  description: "Create a user prompt variable with canonical key and ID rules.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: editableProperties,
  },
  execute: (context, input) => {
    const result = createPromptVariable(
      getDraftVariables(context.draft),
      input,
      variableOptions(context),
    );

    if (!result.ok) {
      return {
        ok: false,
        draft: context.draft,
        issues: actionIssues(result.issues),
      };
    }

    return {
      ok: true,
      draft: withDraftVariables(
        context.draft,
        result.value.variables,
        true,
      ),
      data: {
        variable: result.value.variable,
      },
    };
  },
};

export const variableUpdateAction: ActionDefinition<
  VariableUpdateActionInput,
  { variable: PromptVariable }
> = {
  id: "variable.update",
  description: "Update a user prompt variable while preserving its stable ID.",
  inputSchema: {
    type: "object",
    required: ["variableId"],
    additionalProperties: false,
    properties: {
      variableId: { type: "string", minLength: 1 },
      ...editableProperties,
    },
  },
  execute: (context, input) => {
    const { variableId, ...patch } = input;
    const result = updatePromptVariable(
      getDraftVariables(context.draft),
      variableId,
      patch,
      variableOptions(context),
    );

    if (!result.ok) {
      return {
        ok: false,
        draft: context.draft,
        issues: actionIssues(result.issues),
      };
    }

    return {
      ok: true,
      draft: withDraftVariables(context.draft, result.value.variables),
      data: {
        variable: result.value.variable,
      },
    };
  },
};

export const variableDuplicateAction: ActionDefinition<
  VariableIdActionInput,
  { variable: PromptVariable }
> = {
  id: "variable.duplicate",
  description: "Duplicate a user prompt variable with a new stable ID and unique key.",
  inputSchema: {
    type: "object",
    required: ["variableId"],
    additionalProperties: false,
    properties: {
      variableId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const result = duplicatePromptVariable(
      getDraftVariables(context.draft),
      input.variableId,
      variableOptions(context),
    );

    if (!result.ok) {
      return {
        ok: false,
        draft: context.draft,
        issues: actionIssues(result.issues),
      };
    }

    return {
      ok: true,
      draft: withDraftVariables(context.draft, result.value.variables),
      data: {
        variable: result.value.variable,
      },
    };
  },
};

export const variableDeleteAction: ActionDefinition<
  VariableIdActionInput,
  { removed: PromptVariable }
> = {
  id: "variable.delete",
  description: "Delete one exact user prompt variable without retargeting references.",
  inputSchema: {
    type: "object",
    required: ["variableId"],
    additionalProperties: false,
    properties: {
      variableId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const result = deletePromptVariable(
      getDraftVariables(context.draft),
      input.variableId,
    );

    if (!result.ok) {
      return {
        ok: false,
        draft: context.draft,
        issues: actionIssues(result.issues),
      };
    }

    return {
      ok: true,
      draft: withDraftVariables(context.draft, result.value.variables),
      data: {
        removed: result.value.removed,
      },
    };
  },
};

export const variableSetEnabledAction: ActionDefinition<
  VariableEnabledActionInput,
  { variable: PromptVariable }
> = {
  id: "variable.setEnabled",
  description: "Enable or disable one exact user prompt variable.",
  inputSchema: {
    type: "object",
    required: ["variableId", "enabled"],
    additionalProperties: false,
    properties: {
      variableId: { type: "string", minLength: 1 },
      enabled: { type: "boolean" },
    },
  },
  execute: (context, input) => {
    const result = setPromptVariableEnabled(
      getDraftVariables(context.draft),
      input.variableId,
      input.enabled,
    );

    if (!result.ok) {
      return {
        ok: false,
        draft: context.draft,
        issues: actionIssues(result.issues),
      };
    }

    return {
      ok: true,
      draft: withDraftVariables(context.draft, result.value.variables),
      data: {
        variable: result.value.variable,
      },
    };
  },
};

export const variableActions = [
  variableCreateAction,
  variableUpdateAction,
  variableDuplicateAction,
  variableDeleteAction,
  variableSetEnabledAction,
] as const;

export function registerVariableActions(registry: ActionRegistry) {
  variableActions.forEach((action) => registry.register(action as ActionDefinition));
  return registry;
}
