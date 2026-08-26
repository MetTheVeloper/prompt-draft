import type {
  PromptVariable,
  PromptVariableType,
} from "../modules/types";
import {
  createUniqueVariableKey,
  isReservedVariableKey,
  isValidVariableKey,
  normalizeVariableKey,
  variableKeyIdentity,
} from "../utils/promptVariables";
import {
  domainFailure,
  domainSuccess,
  type DomainResult,
} from "./types";

export const USER_PROMPT_VARIABLE_TYPES = [
  "text",
  "subject",
  "reference",
  "object",
  "color",
  "font",
  "custom",
] as const satisfies readonly PromptVariableType[];

export type UserPromptVariableType =
  (typeof USER_PROMPT_VARIABLE_TYPES)[number];

export type VariableMutationOptions = {
  blockedKeys?: readonly string[];
  createId?: () => string;
};

export type CreatePromptVariableInput = {
  key?: string;
  value?: string;
  description?: string;
  type?: UserPromptVariableType;
  enabled?: boolean;
};

export type UpdatePromptVariableInput = {
  key?: string;
  value?: string;
  description?: string;
  type?: UserPromptVariableType;
  enabled?: boolean;
};

export type PromptVariableMutation = {
  variables: PromptVariable[];
  variable: PromptVariable;
};

export type PromptVariableDeletion = {
  variables: PromptVariable[];
  removed: PromptVariable;
};

function createVariableId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `variable_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function cloneVariable(variable: PromptVariable): PromptVariable {
  return JSON.parse(JSON.stringify(variable)) as PromptVariable;
}

function cloneVariables(variables: readonly PromptVariable[]) {
  return variables.map(cloneVariable);
}

function variableIndexById(
  variables: readonly PromptVariable[],
  variableId: string,
) {
  return variables.findIndex((variable) => variable.id === variableId);
}

function existingUserKeys(
  variables: readonly PromptVariable[],
  exceptVariableId?: string,
) {
  return variables
    .filter((variable) => variable.id !== exceptVariableId)
    .map((variable) => normalizeVariableKey(variable.key))
    .filter(Boolean);
}

function hasBlockedKey(
  key: string,
  blockedKeys: readonly string[],
) {
  const identity = variableKeyIdentity(key);

  return blockedKeys.some((blockedKey) => {
    return variableKeyIdentity(blockedKey) === identity;
  });
}

function resolveVariableKey(
  requestedKey: string | undefined,
  variables: readonly PromptVariable[],
  options: VariableMutationOptions,
  exceptVariableId?: string,
): DomainResult<string> {
  const normalized = normalizeVariableKey(requestedKey || "variable");

  if (!isValidVariableKey(normalized)) {
    return domainFailure({
      code: "variable_invalid_key",
      path: "key",
      details: { key: normalized },
    });
  }

  if (isReservedVariableKey(normalized)) {
    return domainFailure({
      code: "variable_reserved_key",
      path: "key",
      details: { key: normalized },
    });
  }

  if (hasBlockedKey(normalized, options.blockedKeys || [])) {
    return domainFailure({
      code: "variable_system_key_conflict",
      path: "key",
      details: { key: normalized },
    });
  }

  const key = createUniqueVariableKey(
    normalized,
    existingUserKeys(variables, exceptVariableId),
  );

  return domainSuccess(key);
}

function isUserPromptVariableType(
  value: unknown,
): value is UserPromptVariableType {
  return USER_PROMPT_VARIABLE_TYPES.includes(value as UserPromptVariableType);
}

function resolveVariableType(
  value: unknown,
  fallback: UserPromptVariableType = "text",
): DomainResult<UserPromptVariableType> {
  if (value === undefined || value === null || value === "") {
    return domainSuccess(fallback);
  }

  if (!isUserPromptVariableType(value)) {
    return domainFailure({
      code: "variable_invalid_type",
      path: "type",
      details: { type: value },
    });
  }

  return domainSuccess(value);
}

export function createPromptVariable(
  variables: readonly PromptVariable[],
  input: CreatePromptVariableInput = {},
  options: VariableMutationOptions = {},
): DomainResult<PromptVariableMutation> {
  const keyResult = resolveVariableKey(input.key, variables, options);
  if (!keyResult.ok) return keyResult;

  const typeResult = resolveVariableType(input.type);
  if (!typeResult.ok) return typeResult;

  const variable: PromptVariable = {
    id: (options.createId || createVariableId)(),
    key: keyResult.value,
    value: input.value || "",
    description: input.description || "",
    type: typeResult.value,
    enabled: input.enabled !== false,
  };

  return domainSuccess({
    variables: [...cloneVariables(variables), variable],
    variable: cloneVariable(variable),
  });
}

export function updatePromptVariable(
  variables: readonly PromptVariable[],
  variableId: string,
  input: UpdatePromptVariableInput,
  options: VariableMutationOptions = {},
): DomainResult<PromptVariableMutation> {
  const index = variableIndexById(variables, variableId);

  if (index < 0) {
    return domainFailure({
      code: "variable_not_found",
      details: { variableId },
    });
  }

  const current = variables[index];
  const keyResult = resolveVariableKey(
    input.key === undefined ? current.key : input.key,
    variables,
    options,
    variableId,
  );
  if (!keyResult.ok) return keyResult;

  const typeResult = resolveVariableType(
    input.type === undefined ? current.type : input.type,
    "text",
  );
  if (!typeResult.ok) return typeResult;

  const variable: PromptVariable = {
    ...cloneVariable(current),
    id: current.id,
    key: keyResult.value,
    value: input.value === undefined ? current.value : input.value,
    description:
      input.description === undefined
        ? current.description || ""
        : input.description,
    type: typeResult.value,
    enabled: input.enabled === undefined
      ? current.enabled !== false
      : input.enabled,
  };

  const next = cloneVariables(variables);
  next[index] = variable;

  return domainSuccess({
    variables: next,
    variable: cloneVariable(variable),
  });
}

export function duplicatePromptVariable(
  variables: readonly PromptVariable[],
  variableId: string,
  options: VariableMutationOptions = {},
): DomainResult<PromptVariableMutation> {
  const index = variableIndexById(variables, variableId);

  if (index < 0) {
    return domainFailure({
      code: "variable_not_found",
      details: { variableId },
    });
  }

  const source = variables[index];
  const keyResult = resolveVariableKey(source.key, variables, options);
  if (!keyResult.ok) return keyResult;

  const variable: PromptVariable = {
    ...cloneVariable(source),
    id: (options.createId || createVariableId)(),
    key: keyResult.value,
  };

  const next = cloneVariables(variables);
  next.splice(index + 1, 0, variable);

  return domainSuccess({
    variables: next,
    variable: cloneVariable(variable),
  });
}

export function deletePromptVariable(
  variables: readonly PromptVariable[],
  variableId: string,
): DomainResult<PromptVariableDeletion> {
  const index = variableIndexById(variables, variableId);

  if (index < 0) {
    return domainFailure({
      code: "variable_not_found",
      details: { variableId },
    });
  }

  const removed = cloneVariable(variables[index]);

  return domainSuccess({
    variables: cloneVariables(variables).filter(
      (variable) => variable.id !== variableId,
    ),
    removed,
  });
}

export function setPromptVariableEnabled(
  variables: readonly PromptVariable[],
  variableId: string,
  enabled: boolean,
): DomainResult<PromptVariableMutation> {
  const index = variableIndexById(variables, variableId);

  if (index < 0) {
    return domainFailure({
      code: "variable_not_found",
      details: { variableId },
    });
  }

  const next = cloneVariables(variables);
  next[index] = {
    ...next[index],
    enabled,
  };

  return domainSuccess({
    variables: next,
    variable: cloneVariable(next[index]),
  });
}
