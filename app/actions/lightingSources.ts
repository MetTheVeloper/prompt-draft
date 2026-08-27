import type {
  LightingSource,
  ModuleValues,
  PromptKeyModule,
} from "../modules/types";
import {
  createPromptLightingSource,
  deletePromptLightingSource,
  updatePromptLightingSource,
  type LightingSourcePatch,
} from "../domain/lightingSources";
import type { DomainIssue } from "../domain/types";
import { ActionRegistry } from "./registry";
import type { ActionContext, ActionDefinition, ActionIssue } from "./types";

function actionIssues(issues: DomainIssue[]): ActionIssue[] {
  return issues.map((issue) => ({ ...issue }));
}

function resolveModule(context: ActionContext): PromptKeyModule | null {
  return context.modules.find((module) => module.key === "lighting") || null;
}

function moduleNotFound(context: ActionContext) {
  return {
    ok: false as const,
    draft: context.draft,
    issues: [{ code: "module_not_found", details: { moduleKey: "lighting" } }],
  };
}

type LightingSourceData = {
  moduleValues: ModuleValues;
  sources: LightingSource[];
  source?: LightingSource;
};

function normalizeResult(
  context: ActionContext,
  result: ReturnType<typeof createPromptLightingSource>,
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
      sources: result.value.sources,
      source: result.value.source,
    },
  };
}

type LightingSourceUpdateInput = LightingSourcePatch & {
  sourceId: string;
};

export const lightingSourceCreateAction: ActionDefinition<
  Record<string, never>,
  LightingSourceData
> = {
  id: "lighting.source.create",
  description: "Create an empty Lighting source with a new stable ID while respecting the configured source limit.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
  },
  execute: (context) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);

    return normalizeResult(
      context,
      createPromptLightingSource(context.draft, module, {
        createSourceId: context.idFactory?.lightingSource,
      }),
    );
  },
};

export const lightingSourceUpdateAction: ActionDefinition<
  LightingSourceUpdateInput,
  LightingSourceData
> = {
  id: "lighting.source.update",
  description: "Update one exact Lighting source by stable ID with catalog validation and canonical custom-color transitions.",
  inputSchema: {
    type: "object",
    required: ["sourceId"],
    additionalProperties: false,
    properties: {
      sourceId: { type: "string", minLength: 1 },
      role: { type: "string" },
      sourceType: { type: "string" },
      direction: { type: "string" },
      quality: { type: "string" },
      intensity: { type: "string" },
      color: { type: "string" },
      customColor: { type: "string" },
      features: {
        type: "array",
        items: { type: "string" },
      },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);

    const { sourceId, ...patch } = input;
    return normalizeResult(
      context,
      updatePromptLightingSource(
        context.draft,
        module,
        sourceId,
        patch,
      ),
    );
  },
};

export const lightingSourceDeleteAction: ActionDefinition<
  { sourceId: string },
  LightingSourceData
> = {
  id: "lighting.source.delete",
  description: "Delete one exact Lighting source by stable ID without index/name retargeting.",
  inputSchema: {
    type: "object",
    required: ["sourceId"],
    additionalProperties: false,
    properties: {
      sourceId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);

    return normalizeResult(
      context,
      deletePromptLightingSource(context.draft, module, input.sourceId),
    );
  },
};

export const lightingSourceActions = [
  lightingSourceCreateAction,
  lightingSourceUpdateAction,
  lightingSourceDeleteAction,
] as const;

export function registerLightingSourceActions(registry: ActionRegistry) {
  registry.register(lightingSourceCreateAction);
  registry.register(lightingSourceUpdateAction);
  registry.register(lightingSourceDeleteAction);
  return registry;
}
