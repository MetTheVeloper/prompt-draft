import type { PromptVariable } from "../modules/types";

export const VARIABLES_MODULE_KEY = "variables";

export const VARIABLE_TOKEN_PATTERN = /\{([a-z][a-zA-Z0-9_]*)\}/g;

export const RESERVED_VARIABLE_KEY_PATTERNS = [
  /^text_[a-zA-Z0-9_]*$/,
  /^text_group_[a-zA-Z0-9_]*$/,
];

export type PromptVariableIssueLevel = "error" | "warning";

export type PromptVariableIssueCode =
  | "variable_duplicate_key"
  | "variable_invalid_key"
  | "variable_empty_value"
  | "variable_reserved_key"
  | "undefined_variable_reference"
  | "unused_variable";

export type PromptVariableIssue = {
  id: string;
  code: PromptVariableIssueCode;
  level: PromptVariableIssueLevel;
  key?: string;
  token?: string;
};

export function normalizeVariableKey(input: string) {
  let key = (input || "").trim().toLowerCase();

  key = key.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  key = key.replace(/['"`]+/g, "");
  key = key.replace(/[^a-z0-9]+/g, "_");
  key = key.replace(/_+/g, "_").replace(/^_+|_+$/g, "");

  if (!key) key = "variable";
  if (/^[0-9]/.test(key)) key = `var_${key}`;

  return key;
}

export function isValidVariableKey(key: string) {
  return /^[a-z][a-zA-Z0-9_]*$/.test(key);
}

export function isReservedVariableKey(key: string) {
  return RESERVED_VARIABLE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function createUniqueVariableKey(input: string, existingKeys: string[]) {
  const baseKey = normalizeVariableKey(input);
  const existing = new Set(existingKeys.map((key) => normalizeVariableKey(key)));

  if (!existing.has(baseKey)) return baseKey;

  let index = 2;
  let nextKey = `${baseKey}_${index}`;

  while (existing.has(nextKey)) {
    index += 1;
    nextKey = `${baseKey}_${index}`;
  }

  return nextKey;
}

export function formatVariableToken(key: string) {
  return `{${normalizeVariableKey(key)}}`;
}

export function extractVariableReferences(text: string) {
  const references = new Set<string>();

  for (const match of text.matchAll(VARIABLE_TOKEN_PATTERN)) {
    const key = match[1]?.trim();

    if (key) references.add(key);
  }

  return [...references];
}

export function isPromptVariable(value: unknown): value is PromptVariable {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const variable = value as Partial<PromptVariable>;

  return typeof variable.key === "string" && typeof variable.value === "string";
}

export function getEnabledPromptVariables(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter(isPromptVariable).filter((variable) => {
    return variable.enabled !== false;
  });
}

function quoteVariableValue(value: string) {
  return `"${value.replace(/"/g, '\\"')}"`;
}

export function formatVariableDefinition(variable: PromptVariable) {
  const key = normalizeVariableKey(variable.key);
  const value = variable.value.trim();

  if (!value || !isValidVariableKey(key) || isReservedVariableKey(key)) {
    return "";
  }

  const formattedValue = variable.type === "text" ? quoteVariableValue(value) : value;

  return `${formatVariableToken(key)} = ${formattedValue}`;
}

export function formatPromptVariableDefinitions(value: unknown) {
  const variables = getEnabledPromptVariables(value);
  const usedKeys = new Set<string>();

  return variables
    .map((variable) => {
      const key = normalizeVariableKey(variable.key);

      if (usedKeys.has(key)) return "";
      usedKeys.add(key);

      return formatVariableDefinition({
        ...variable,
        key,
      });
    })
    .filter(Boolean)
    .join("\n");
}

export function parseVariableDefinitions(output: string) {
  const variables: Array<{ key: string; value: string }> = [];

  output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const match = line.match(/^\{([a-z][a-zA-Z0-9_]*)\}\s*=\s*(.*)$/);

      if (!match) return;

      const key = match[1];
      let value = match[2].trim();

      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/\\"/g, '"');
      }

      variables.push({ key, value });
    });

  return variables;
}

export function variableDefinitionsToRecord(output: string) {
  return parseVariableDefinitions(output).reduce<Record<string, string>>(
    (result, variable) => {
      result[variable.key] = variable.value;
      return result;
    },
    {},
  );
}

export function validatePromptVariables(
  value: unknown,
  textsToScan: string[] = [],
): PromptVariableIssue[] {
  const issues: PromptVariableIssue[] = [];
  const variables = getEnabledPromptVariables(value);
  const seenKeys = new Set<string>();
  const definedKeys = new Set<string>();

  variables.forEach((variable, index) => {
    const key = normalizeVariableKey(variable.key);
    const idPrefix = `variables:${index}:${key}`;

    if (!isValidVariableKey(key)) {
      issues.push({
        id: `${idPrefix}:invalid`,
        code: "variable_invalid_key",
        level: "error",
        key,
        token: formatVariableToken(key),
      });
      return;
    }

    if (isReservedVariableKey(key)) {
      issues.push({
        id: `${idPrefix}:reserved`,
        code: "variable_reserved_key",
        level: "error",
        key,
        token: formatVariableToken(key),
      });
      return;
    }

    if (!variable.value.trim()) {
      issues.push({
        id: `${idPrefix}:empty`,
        code: "variable_empty_value",
        level: "error",
        key,
        token: formatVariableToken(key),
      });
    }

    if (seenKeys.has(key)) {
      issues.push({
        id: `${idPrefix}:duplicate`,
        code: "variable_duplicate_key",
        level: "error",
        key,
        token: formatVariableToken(key),
      });
      return;
    }

    seenKeys.add(key);

    if (variable.value.trim()) {
      definedKeys.add(key);
    }
  });

  const references = new Set(
    textsToScan.flatMap((text) => extractVariableReferences(text)),
  );

  references.forEach((key) => {
    if (isReservedVariableKey(key)) return;

    if (!definedKeys.has(key)) {
      issues.push({
        id: `variables:reference:${key}:undefined`,
        code: "undefined_variable_reference",
        level: "warning",
        key,
        token: formatVariableToken(key),
      });
    }
  });

  definedKeys.forEach((key) => {
    if (!references.has(key)) {
      issues.push({
        id: `variables:reference:${key}:unused`,
        code: "unused_variable",
        level: "warning",
        key,
        token: formatVariableToken(key),
      });
    }
  });

  return issues;
}
