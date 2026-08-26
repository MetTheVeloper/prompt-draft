import type { PromptKeyModule } from "../modules/types";
import type { ModuleEntity, ModuleEntityPayload } from "../modules/entityContracts";
import {
  createPromptModuleEntity,
  deletePromptModuleEntity,
  duplicatePromptModuleEntity,
  setPromptModuleEntityEnabled,
  setPromptModuleEntityInheritance,
  updatePromptModuleEntity,
} from "../domain/moduleEntities";
import type { DomainIssue } from "../domain/types";
import { ActionRegistry } from "./registry";
import type { ActionContext, ActionDefinition, ActionIssue } from "./types";

function actionIssues(issues: DomainIssue[]): ActionIssue[] {
  return issues.map((issue) => ({ ...issue }));
}

function resolveModule(context: ActionContext, moduleKey: string): PromptKeyModule | null {
  return context.modules.find((module) => module.key === moduleKey) || null;
}

function moduleNotFound(context: ActionContext, moduleKey: string) {
  return {
    ok: false as const,
    draft: context.draft,
    issues: [{ code: "module_not_found", path: "moduleKey", details: { moduleKey } }],
  };
}

function normalizeResult(
  context: ActionContext,
  result: ReturnType<typeof createPromptModuleEntity>,
) {
  if (!result.ok) {
    return { ok: false as const, draft: context.draft, issues: actionIssues(result.issues) };
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

type EntityData = {
  moduleValues: Record<string, unknown>;
  entities: ModuleEntity<ModuleEntityPayload>[];
  entity?: ModuleEntity<ModuleEntityPayload>;
};

type ModuleEntityIdInput = { moduleKey: string; entityId: string };

const baseProperties = {
  moduleKey: { type: "string" as const, minLength: 1 },
  entityId: { type: "string" as const, minLength: 1 },
};

export const moduleEntityCreateAction: ActionDefinition<
  { moduleKey: string; name?: string; key?: string },
  EntityData
> = {
  id: "moduleEntity.create",
  description: "Create a named configuration with a new stable identity and canonical unique key.",
  inputSchema: {
    type: "object",
    required: ["moduleKey"],
    additionalProperties: false,
    properties: {
      moduleKey: { type: "string", minLength: 1 },
      name: { type: "string" },
      key: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context, input.moduleKey);
    if (!module) return moduleNotFound(context, input.moduleKey);
    return normalizeResult(
      context,
      createPromptModuleEntity(context.draft, module, input, context.idFactory?.moduleEntity),
    );
  },
};

export const moduleEntityUpdateAction: ActionDefinition<
  ModuleEntityIdInput & { name?: string; key?: string },
  EntityData
> = {
  id: "moduleEntity.update",
  description: "Update editable module-entity metadata while preserving stable identity.",
  inputSchema: {
    type: "object",
    required: ["moduleKey", "entityId"],
    additionalProperties: false,
    properties: {
      ...baseProperties,
      name: { type: "string" },
      key: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context, input.moduleKey);
    if (!module) return moduleNotFound(context, input.moduleKey);
    return normalizeResult(context, updatePromptModuleEntity(context.draft, module, input));
  },
};

export const moduleEntityDuplicateAction: ActionDefinition<ModuleEntityIdInput, EntityData> = {
  id: "moduleEntity.duplicate",
  description: "Duplicate one exact module entity adjacent to its source with a new stable ID and unique key.",
  inputSchema: {
    type: "object",
    required: ["moduleKey", "entityId"],
    additionalProperties: false,
    properties: baseProperties,
  },
  execute: (context, input) => {
    const module = resolveModule(context, input.moduleKey);
    if (!module) return moduleNotFound(context, input.moduleKey);
    return normalizeResult(
      context,
      duplicatePromptModuleEntity(context.draft, module, input.entityId, context.idFactory?.moduleEntity),
    );
  },
};

export const moduleEntityDeleteAction: ActionDefinition<ModuleEntityIdInput, EntityData> = {
  id: "moduleEntity.delete",
  description: "Delete one exact stable module entity without rewriting external references.",
  inputSchema: {
    type: "object",
    required: ["moduleKey", "entityId"],
    additionalProperties: false,
    properties: baseProperties,
  },
  execute: (context, input) => {
    const module = resolveModule(context, input.moduleKey);
    if (!module) return moduleNotFound(context, input.moduleKey);
    return normalizeResult(context, deletePromptModuleEntity(context.draft, module, input.entityId));
  },
};

export const moduleEntitySetEnabledAction: ActionDefinition<
  ModuleEntityIdInput & { enabled: boolean },
  EntityData
> = {
  id: "moduleEntity.setEnabled",
  description: "Enable or disable one exact module entity without changing its identity.",
  inputSchema: {
    type: "object",
    required: ["moduleKey", "entityId", "enabled"],
    additionalProperties: false,
    properties: { ...baseProperties, enabled: { type: "boolean" } },
  },
  execute: (context, input) => {
    const module = resolveModule(context, input.moduleKey);
    if (!module) return moduleNotFound(context, input.moduleKey);
    return normalizeResult(
      context,
      setPromptModuleEntityEnabled(context.draft, module, input.entityId, input.enabled),
    );
  },
};

export const moduleEntitySetInheritanceAction: ActionDefinition<
  ModuleEntityIdInput & { inheritGlobal: boolean },
  EntityData
> = {
  id: "moduleEntity.setInheritance",
  description: "Set global inheritance for one exact module entity where the module capability allows it.",
  inputSchema: {
    type: "object",
    required: ["moduleKey", "entityId", "inheritGlobal"],
    additionalProperties: false,
    properties: { ...baseProperties, inheritGlobal: { type: "boolean" } },
  },
  execute: (context, input) => {
    const module = resolveModule(context, input.moduleKey);
    if (!module) return moduleNotFound(context, input.moduleKey);
    return normalizeResult(
      context,
      setPromptModuleEntityInheritance(context.draft, module, input.entityId, input.inheritGlobal),
    );
  },
};

export const moduleEntityActions = [
  moduleEntityCreateAction,
  moduleEntityUpdateAction,
  moduleEntityDuplicateAction,
  moduleEntityDeleteAction,
  moduleEntitySetEnabledAction,
  moduleEntitySetInheritanceAction,
] as const;

export function registerModuleEntityActions(registry: ActionRegistry) {
  moduleEntityActions.forEach((action) => registry.register(action as any));
  return registry;
}
