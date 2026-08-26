import type {
  ActionInputSchema,
  ActionIssue,
  ActionValueSchema,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function childPath(path: string, key: string | number) {
  if (typeof key === "number") return `${path}[${key}]`;
  return path ? `${path}.${key}` : key;
}

function invalidTypeIssue(path: string, expected: string): ActionIssue {
  return {
    code: "action_input_invalid_type",
    path,
    details: { expected },
  };
}

function validateValue(
  value: unknown,
  schema: ActionValueSchema,
  path: string,
): ActionIssue[] {
  if (schema.type === "unknown") return [];

  if (schema.type === "string") {
    if (typeof value !== "string") {
      return [invalidTypeIssue(path, "string")];
    }

    const issues: ActionIssue[] = [];

    if (schema.minLength !== undefined && value.length < schema.minLength) {
      issues.push({
        code: "action_input_string_too_short",
        path,
        details: { minLength: schema.minLength },
      });
    }

    if (schema.enum && !schema.enum.includes(value)) {
      issues.push({
        code: "action_input_invalid_enum",
        path,
        details: { allowed: [...schema.enum] },
      });
    }

    return issues;
  }

  if (schema.type === "number") {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return [invalidTypeIssue(path, "number")];
    }

    const issues: ActionIssue[] = [];

    if (schema.min !== undefined && value < schema.min) {
      issues.push({
        code: "action_input_number_too_small",
        path,
        details: { min: schema.min },
      });
    }

    if (schema.max !== undefined && value > schema.max) {
      issues.push({
        code: "action_input_number_too_large",
        path,
        details: { max: schema.max },
      });
    }

    return issues;
  }

  if (schema.type === "boolean") {
    return typeof value === "boolean"
      ? []
      : [invalidTypeIssue(path, "boolean")];
  }

  if (schema.type === "array") {
    if (!Array.isArray(value)) {
      return [invalidTypeIssue(path, "array")];
    }

    const issues: ActionIssue[] = [];

    if (schema.minItems !== undefined && value.length < schema.minItems) {
      issues.push({
        code: "action_input_array_too_short",
        path,
        details: { minItems: schema.minItems },
      });
    }

    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      issues.push({
        code: "action_input_array_too_long",
        path,
        details: { maxItems: schema.maxItems },
      });
    }

    value.forEach((item, index) => {
      issues.push(...validateValue(item, schema.items, childPath(path, index)));
    });

    return issues;
  }

  if (!isRecord(value)) {
    return [invalidTypeIssue(path, "object")];
  }

  const issues: ActionIssue[] = [];
  const properties = schema.properties || {};
  const required = new Set(schema.required || []);

  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) {
      issues.push({
        code: "action_input_required",
        path: childPath(path, key),
      });
    }
  }

  for (const [key, childValue] of Object.entries(value)) {
    const childSchema = properties[key];

    if (!childSchema) {
      if (schema.additionalProperties === false) {
        issues.push({
          code: "action_input_unknown_property",
          path: childPath(path, key),
        });
      }
      continue;
    }

    issues.push(...validateValue(childValue, childSchema, childPath(path, key)));
  }

  return issues;
}

export function validateActionInput(
  input: unknown,
  schema?: ActionInputSchema,
): ActionIssue[] {
  if (!schema) return [];
  return validateValue(input, schema, "input");
}
