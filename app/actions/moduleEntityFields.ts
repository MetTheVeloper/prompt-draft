import type { PromptKeyModule } from "../modules/types";
import type {
  ModuleEntity,
  ModuleEntityPayload,
} from "../modules/entityContracts";
import {
  applyPromptModuleEntityPreset,
  clearPromptModuleEntityField,
  setPromptModuleEntityField,
} from "../domain/moduleEntityFields";
import type { DomainIssue } from "../domain/types";
import { ActionRegistry } from "./registry";
import type {
  ActionContext,
  ActionDefinition,
  ActionIssue,
} from "./types";

function actionIssues(issues: DomainIssue[]): ActionIssue[] {
  return issues.map((issue) => ({ ...issue }));
}

function resolveModule(
  context: ActionContext,
  moduleKey: string,
): PromptKeyModule | null {
  return context.modules.find((module) => module.key === moduleKey) || null;
}

function moduleNotFound(context: ActionContext, moduleKey: string) {
  return {
    ok: false as const,
    draft: context.draft,
    issues: [
      {
        code: "module_not_found",
        path: "moduleKey",
        details: { moduleKey },
      },
    ],
  };
}

function normalizeResult(
  context: ActionContext,
  result: ReturnType<typeof setPromptModuleEntityField>,
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
      entities: result.value.entities,
      entity: result.value.entity,
    },
  };
}

type EntityFieldData = {
  moduleValues: Record<string, unknown>;
  entities: ModuleEntity<ModuleEntityPayload>[];
  entity: ModuleEntity<ModuleEntityPayload>;
};

type EntityFieldSetInput = {
  moduleKey: string;
  entityId: string;
  fieldId: string;
  value: unknown;
  customText?: string;
};

type EntityFieldClearInput = {
  moduleKey: string;
  entityId: string;
  fieldId: string;
};

type EntityPresetApplyInput = {
  moduleKey: string;
  entityId: string;
  presetId: string;
};

const baseProperties = {
  moduleKey: { type: "string" as const, minLength: 1 },
  entityId: { type: "string" as const, minLength: 1 },
};

export const moduleEntityFieldSetAction: ActionDefinition<
  EntityFieldSetInput,
  EntityFieldData
> = {
  id: "moduleEntity.field.set",
  description:
    "Set one simple schema-backed local field override on an exact named module configuration.",
  inputSchema: {
    type: "object",
    required: ["moduleKey", "entityId", "fieldId", "value"],
    additionalProperties: false,
    properties: {
      ...baseProperties,
      fieldId: { type: "string", minLength: 1 },
      value: { type: "unknown" },
      customText: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context, input.moduleKey);
    if (!module) return moduleNotFound(context, input.moduleKey);

    return normalizeResult(
      context,
      setPromptModuleEntityField(context.draft, module, {
        entityId: input.entityId,
        fieldId: input.fieldId,
        value: input.value as never,
        customText: input.customText,
      }),
    );
  },
};

export const moduleEntityFieldClearAction: ActionDefinition<
  EntityFieldClearInput,
  EntityFieldData
> = {
  id: "moduleEntity.field.clear",
  description:
    "Remove one local simple-field override and its customInput sidecar so inheritance/unset semantics resume.",
  inputSchema: {
    type: "object",
    required: ["moduleKey", "entityId", "fieldId"],
    additionalProperties: false,
    properties: {
      ...baseProperties,
      fieldId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context, input.moduleKey);
    if (!module) return moduleNotFound(context, input.moduleKey);

    return normalizeResult(
      context,
      clearPromptModuleEntityField(
        context.draft,
        module,
        input.entityId,
        input.fieldId,
      ),
    );
  },
};

export const moduleEntityPresetApplyAction: ActionDefinition<
  EntityPresetApplyInput,
  EntityFieldData
> = {
  id: "moduleEntity.preset.apply",
  description:
    "Overlay one registered module preset onto an exact named configuration using entity-local payload semantics.",
  inputSchema: {
    type: "object",
    required: ["moduleKey", "entityId", "presetId"],
    additionalProperties: false,
    properties: {
      ...baseProperties,
      presetId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context, input.moduleKey);
    if (!module) return moduleNotFound(context, input.moduleKey);

    return normalizeResult(
      context,
      applyPromptModuleEntityPreset(
        context.draft,
        module,
        input.entityId,
        input.presetId,
      ),
    );
  },
};

export const moduleEntityFieldActions = [
  moduleEntityFieldSetAction,
  moduleEntityFieldClearAction,
  moduleEntityPresetApplyAction,
] as const;

export function registerModuleEntityFieldActions(registry: ActionRegistry) {
  moduleEntityFieldActions.forEach((action) => registry.register(action as any));
  return registry;
}
