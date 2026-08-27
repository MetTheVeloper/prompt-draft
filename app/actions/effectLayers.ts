import type {
  EffectLayer,
  ModuleValues,
  PromptKeyModule,
} from "../modules/types";
import {
  createPromptEffectLayer,
  deletePromptEffectLayer,
  updatePromptEffectLayer,
  type EffectLayerPatch,
} from "../domain/effectLayers";
import type { DomainIssue } from "../domain/types";
import { ActionRegistry } from "./registry";
import type { ActionContext, ActionDefinition, ActionIssue } from "./types";

function actionIssues(issues: DomainIssue[]): ActionIssue[] {
  return issues.map((issue) => ({ ...issue }));
}

function resolveModule(context: ActionContext): PromptKeyModule | null {
  return context.modules.find((module) => module.key === "effects") || null;
}

function moduleNotFound(context: ActionContext) {
  return {
    ok: false as const,
    draft: context.draft,
    issues: [{ code: "module_not_found", details: { moduleKey: "effects" } }],
  };
}

type EffectLayerData = {
  moduleValues: ModuleValues;
  layers: EffectLayer[];
  layer?: EffectLayer;
};

function normalizeResult(
  context: ActionContext,
  result: ReturnType<typeof createPromptEffectLayer>,
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
      layers: result.value.layers,
      layer: result.value.layer,
    },
  };
}

type EffectLayerUpdateInput = EffectLayerPatch & {
  layerId: string;
};

export const effectsLayerCreateAction: ActionDefinition<
  Record<string, never>,
  EffectLayerData
> = {
  id: "effects.layer.create",
  description: "Create an empty Effects layer with a new stable ID while respecting the configured layer limit.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
  },
  execute: (context) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);

    return normalizeResult(
      context,
      createPromptEffectLayer(context.draft, module, {
        createLayerId: context.idFactory?.effectLayer,
      }),
    );
  },
};

export const effectsLayerUpdateAction: ActionDefinition<
  EffectLayerUpdateInput,
  EffectLayerData
> = {
  id: "effects.layer.update",
  description: "Update one exact Effects layer by stable ID with catalog validation and canonical custom-effect transitions.",
  inputSchema: {
    type: "object",
    required: ["layerId"],
    additionalProperties: false,
    properties: {
      layerId: { type: "string", minLength: 1 },
      effectType: { type: "string" },
      customEffect: { type: "string" },
      intensity: { type: "string" },
      details: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);

    const { layerId, ...patch } = input;
    return normalizeResult(
      context,
      updatePromptEffectLayer(
        context.draft,
        module,
        layerId,
        patch,
      ),
    );
  },
};

export const effectsLayerDeleteAction: ActionDefinition<
  { layerId: string },
  EffectLayerData
> = {
  id: "effects.layer.delete",
  description: "Delete one exact Effects layer by stable ID without index/type retargeting.",
  inputSchema: {
    type: "object",
    required: ["layerId"],
    additionalProperties: false,
    properties: {
      layerId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);

    return normalizeResult(
      context,
      deletePromptEffectLayer(context.draft, module, input.layerId),
    );
  },
};

export const effectsLayerActions = [
  effectsLayerCreateAction,
  effectsLayerUpdateAction,
  effectsLayerDeleteAction,
] as const;

export function registerEffectsLayerActions(registry: ActionRegistry) {
  registry.register(effectsLayerCreateAction);
  registry.register(effectsLayerUpdateAction);
  registry.register(effectsLayerDeleteAction);
  return registry;
}
