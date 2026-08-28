import { colorPaletteActions } from "./colorPalette";
import { effectsLayerActions } from "./effectLayers";
import { expressionAssignmentActions } from "./expressionAssignments";
import { hairActions } from "./hairStyles";
import { layoutActions } from "./layouts";
import { lightingSourceActions } from "./lightingSources";
import { textureAssignmentActions } from "./materialAssignments";
import { moduleActions } from "./modules";
import { moduleEntityActions } from "./moduleEntities";
import { moduleEntityFieldActions } from "./moduleEntityFields";
import { outfitActions } from "./outfitSets";
import { poseAssignmentActions } from "./poseAssignments";
import { promptReadActions } from "./promptRead";
import { promptSettingsActions } from "./promptSettings";
import { ActionRegistry } from "./registry";
import { sceneActions } from "./scenes";
import { typographyActions } from "./typography";
import type {
  ActionContext,
  ActionDefinition,
  ActionExecutionResult,
  ActionInputSchema,
  ActionIssue,
  ActionValueSchema,
} from "./types";
import { variableActions } from "./variables";

export const PUBLIC_ACTION_CONTRACT = "prompt-draft.actions.v1" as const;

export type PublicJsonSchema = {
  type?: "string" | "number" | "boolean" | "array" | "object";
  enum?: readonly string[];
  minLength?: number;
  minimum?: number;
  maximum?: number;
  items?: PublicJsonSchema;
  minItems?: number;
  maxItems?: number;
  properties?: Record<string, PublicJsonSchema>;
  required?: readonly string[];
  additionalProperties?: boolean;
};

export type PublicActionEffect = "read" | "mutation";

export type PublicActionDescriptor = {
  id: string;
  description: string;
  effect: PublicActionEffect;
  inputSchema: PublicJsonSchema;
};

export type PublicActionManifest = {
  contract: typeof PUBLIC_ACTION_CONTRACT;
  actions: PublicActionDescriptor[];
};

export type PublicActionInvocation = {
  actionId: string;
  input?: unknown;
};

export type PublicActionResult<TData = unknown> = ActionExecutionResult<TData>;

const publicActionGroups = [
  moduleActions,
  variableActions,
  moduleEntityActions,
  moduleEntityFieldActions,
  typographyActions,
  sceneActions,
  layoutActions,
  colorPaletteActions,
  textureAssignmentActions,
  poseAssignmentActions,
  expressionAssignmentActions,
  lightingSourceActions,
  effectsLayerActions,
  hairActions,
  outfitActions,
  promptSettingsActions,
  promptReadActions,
] as const;

const publicReadActionIds = new Set(["prompt.validate", "prompt.compile"]);

export const PUBLIC_ACTION_DEFINITIONS: readonly ActionDefinition<any, any>[] =
  publicActionGroups.flatMap((group) => [...group]);

function cloneStrings(values: readonly string[] | undefined) {
  return values ? [...values] : undefined;
}

export function getPublicActionEffect(actionId: string): PublicActionEffect {
  return publicReadActionIds.has(actionId) ? "read" : "mutation";
}

export function toPublicJsonSchema(
  schema: ActionValueSchema,
): PublicJsonSchema {
  if (schema.type === "unknown") return {};

  if (schema.type === "string") {
    return {
      type: "string",
      ...(schema.enum ? { enum: [...schema.enum] } : {}),
      ...(schema.minLength !== undefined
        ? { minLength: schema.minLength }
        : {}),
    };
  }

  if (schema.type === "number") {
    return {
      type: "number",
      ...(schema.min !== undefined ? { minimum: schema.min } : {}),
      ...(schema.max !== undefined ? { maximum: schema.max } : {}),
    };
  }

  if (schema.type === "boolean") return { type: "boolean" };

  if (schema.type === "array") {
    return {
      type: "array",
      items: toPublicJsonSchema(schema.items),
      ...(schema.minItems !== undefined ? { minItems: schema.minItems } : {}),
      ...(schema.maxItems !== undefined ? { maxItems: schema.maxItems } : {}),
    };
  }

  const properties = schema.properties
    ? Object.fromEntries(
        Object.entries(schema.properties).map(([key, value]) => [
          key,
          toPublicJsonSchema(value),
        ]),
      )
    : undefined;

  return {
    type: "object",
    ...(properties ? { properties } : {}),
    ...(schema.required ? { required: cloneStrings(schema.required) } : {}),
    ...(schema.additionalProperties !== undefined
      ? { additionalProperties: schema.additionalProperties }
      : {}),
  };
}

function publicInputSchema(schema?: ActionInputSchema): PublicJsonSchema {
  return schema
    ? toPublicJsonSchema(schema)
    : {
        type: "object",
        properties: {},
        additionalProperties: false,
      };
}

export function createPublicActionRegistry() {
  const registry = new ActionRegistry();
  PUBLIC_ACTION_DEFINITIONS.forEach((definition) => registry.register(definition));
  return registry;
}

export function exportPublicActionManifest(
  registry = createPublicActionRegistry(),
): PublicActionManifest {
  return {
    contract: PUBLIC_ACTION_CONTRACT,
    actions: registry.list().map((descriptor) => ({
      id: descriptor.id,
      description: descriptor.description,
      effect: getPublicActionEffect(descriptor.id),
      inputSchema: publicInputSchema(descriptor.inputSchema),
    })),
  };
}

function invocationIssue(
  code: string,
  details?: Record<string, unknown>,
): ActionIssue {
  return { code, details };
}

function invalidInvocation(
  context: ActionContext,
  details?: Record<string, unknown>,
): ActionExecutionResult<never> {
  return {
    ok: false,
    draft: context.draft,
    issues: [invocationIssue("public_action_request_invalid", details)],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function invokePublicAction<TData = unknown>(
  request: unknown,
  context: ActionContext,
  registry = createPublicActionRegistry(),
): Promise<ActionExecutionResult<TData>> {
  if (!isRecord(request)) {
    return invalidInvocation(context, { reason: "request_must_be_object" });
  }

  const unknownKeys = Object.keys(request).filter(
    (key) => key !== "actionId" && key !== "input",
  );
  if (unknownKeys.length) {
    return invalidInvocation(context, {
      reason: "request_contains_host_owned_fields",
      unknownKeys,
    });
  }

  if (typeof request.actionId !== "string" || !request.actionId.trim()) {
    return invalidInvocation(context, { reason: "action_id_required" });
  }

  return registry.execute<TData>(
    request.actionId,
    context,
    request.input === undefined ? {} : request.input,
  );
}
