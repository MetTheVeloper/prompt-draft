import type { PromptDraftState } from "../modules/promptDraft.types";
import type { ModuleValues, PromptKeyModule } from "../modules/types";
import {
  createModuleEntityId,
  getModuleEntities,
  getModuleEntityConfig,
  moduleSupportsEntities,
  setModuleEntities,
  type ModuleEntity,
  type ModuleEntityPayload,
} from "../modules/entityContracts";
import { createDefaultModuleValues } from "../utils/compileModules";
import {
  domainFailure,
  domainSuccess,
  type DomainResult,
} from "./types";

export type ModuleEntityLifecycleMutation = {
  draft: PromptDraftState;
  moduleValues: ModuleValues;
  entities: ModuleEntity<ModuleEntityPayload>[];
  entity?: ModuleEntity<ModuleEntityPayload>;
};

export type CreateModuleEntityInput = {
  name?: string;
  key?: string;
};

export type UpdateModuleEntityInput = {
  entityId: string;
  name?: string;
  key?: string;
};

function cloneValue<T>(value: T): T {
  if (value === undefined || value === null) return value;

  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function humanize(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function normalizeModuleEntityKey(value: string) {
  const parts = value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "entity";

  return parts
    .map((part, index) => {
      const normalized = part.replace(/[^a-zA-Z0-9]/g, "");
      if (!normalized) return "";
      if (index === 0) {
        return normalized.charAt(0).toLowerCase() + normalized.slice(1);
      }
      return normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join("");
}

export function uniqueModuleEntityKey(
  entities: readonly ModuleEntity<ModuleEntityPayload>[],
  base: string,
  ignoreEntityId = "",
) {
  const normalizedBase = normalizeModuleEntityKey(base);
  const used = new Set(
    entities
      .filter((entity) => entity.id !== ignoreEntityId)
      .map((entity) => entity.key.trim())
      .filter(Boolean),
  );

  if (!used.has(normalizedBase)) return normalizedBase;

  let suffix = 2;
  while (used.has(`${normalizedBase}${suffix}`)) suffix += 1;
  return `${normalizedBase}${suffix}`;
}

function currentModuleValues(
  draft: PromptDraftState,
  module: PromptKeyModule,
): ModuleValues {
  const existing = draft.moduleValues[module.key];
  return existing
    ? cloneValue(existing)
    : createDefaultModuleValues(module);
}

function validateLifecycleTarget(
  draft: PromptDraftState,
  module: PromptKeyModule,
): DomainResult<ModuleValues> {
  if (!draft.selectedModuleKeys.includes(module.key)) {
    return domainFailure({
      code: "module_not_active",
      details: { moduleKey: module.key },
    });
  }

  if (!moduleSupportsEntities(module)) {
    return domainFailure({
      code: "module_entities_unsupported",
      details: { moduleKey: module.key },
    });
  }

  return domainSuccess(currentModuleValues(draft, module));
}

function findEntityIndex(
  entities: readonly ModuleEntity<ModuleEntityPayload>[],
  entityId: string,
) {
  return entities.findIndex((entity) => entity.id === entityId);
}

function entityNotFound(moduleKey: string, entityId: string) {
  return domainFailure({
    code: "module_entity_not_found",
    path: "entityId",
    details: { moduleKey, entityId },
  });
}

function withEntities(
  draft: PromptDraftState,
  module: PromptKeyModule,
  moduleValues: ModuleValues,
  entities: ModuleEntity<ModuleEntityPayload>[],
  entity?: ModuleEntity<ModuleEntityPayload>,
): DomainResult<ModuleEntityLifecycleMutation> {
  const nextModuleValues = setModuleEntities(
    moduleValues,
    cloneValue(entities),
  );
  const nextDraft = cloneValue(draft);
  nextDraft.moduleValues = {
    ...nextDraft.moduleValues,
    [module.key]: cloneValue(nextModuleValues),
  };

  return domainSuccess({
    draft: nextDraft,
    moduleValues: cloneValue(nextModuleValues),
    entities: cloneValue(entities),
    entity: entity ? cloneValue(entity) : undefined,
  });
}

export function createPromptModuleEntity(
  draft: PromptDraftState,
  module: PromptKeyModule,
  input: CreateModuleEntityInput = {},
  idFactory?: (moduleKey: string) => string,
): DomainResult<ModuleEntityLifecycleMutation> {
  const target = validateLifecycleTarget(draft, module);
  if (!target.ok) return target;

  const moduleValues = target.value;
  const entities = getModuleEntities(moduleValues).map(cloneValue);
  const number = entities.length + 1;
  const defaultName = `${humanize(module.key)} ${number}`;
  const name = input.name ?? defaultName;
  const key = uniqueModuleEntityKey(
    entities,
    input.key ?? `${module.key}${number}`,
  );
  const id = String(
    idFactory?.(module.key) || createModuleEntityId(module.key),
  ).trim();

  if (!id) {
    return domainFailure({
      code: "module_entity_invalid_id",
      details: { moduleKey: module.key },
    });
  }

  if (entities.some((entity) => entity.id === id)) {
    return domainFailure({
      code: "module_entity_id_conflict",
      details: { moduleKey: module.key, entityId: id },
    });
  }

  const entity: ModuleEntity<ModuleEntityPayload> = {
    id,
    key,
    name,
    enabled: true,
    inheritGlobal: true,
    payload: {},
  };

  return withEntities(
    draft,
    module,
    moduleValues,
    [...entities, entity],
    entity,
  );
}

export function updatePromptModuleEntity(
  draft: PromptDraftState,
  module: PromptKeyModule,
  input: UpdateModuleEntityInput,
): DomainResult<ModuleEntityLifecycleMutation> {
  const target = validateLifecycleTarget(draft, module);
  if (!target.ok) return target;

  if (input.name === undefined && input.key === undefined) {
    return domainFailure({
      code: "module_entity_empty_update",
      details: { moduleKey: module.key, entityId: input.entityId },
    });
  }

  const moduleValues = target.value;
  const entities = getModuleEntities(moduleValues).map(cloneValue);
  const index = findEntityIndex(entities, input.entityId);
  if (index < 0) return entityNotFound(module.key, input.entityId);

  const source = entities[index];
  const entity: ModuleEntity<ModuleEntityPayload> = {
    ...source,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.key !== undefined
      ? {
          key: uniqueModuleEntityKey(
            entities,
            input.key,
            source.id,
          ),
        }
      : {}),
  };

  entities[index] = entity;
  return withEntities(draft, module, moduleValues, entities, entity);
}

export function duplicatePromptModuleEntity(
  draft: PromptDraftState,
  module: PromptKeyModule,
  entityId: string,
  idFactory?: (moduleKey: string) => string,
): DomainResult<ModuleEntityLifecycleMutation> {
  const target = validateLifecycleTarget(draft, module);
  if (!target.ok) return target;

  const moduleValues = target.value;
  const entities = getModuleEntities(moduleValues).map(cloneValue);
  const index = findEntityIndex(entities, entityId);
  if (index < 0) return entityNotFound(module.key, entityId);

  const source = entities[index];
  const id = String(
    idFactory?.(module.key) || createModuleEntityId(module.key),
  ).trim();

  if (!id) {
    return domainFailure({
      code: "module_entity_invalid_id",
      details: { moduleKey: module.key },
    });
  }

  if (entities.some((entity) => entity.id === id)) {
    return domainFailure({
      code: "module_entity_id_conflict",
      details: { moduleKey: module.key, entityId: id },
    });
  }

  const entity: ModuleEntity<ModuleEntityPayload> = {
    ...cloneValue(source),
    id,
    key: uniqueModuleEntityKey(
      entities,
      `${source.key || module.key}Copy`,
    ),
    name: `${source.name || humanize(module.key)} Copy`,
  };

  const nextEntities = [
    ...entities.slice(0, index + 1),
    entity,
    ...entities.slice(index + 1),
  ];

  return withEntities(draft, module, moduleValues, nextEntities, entity);
}

export function deletePromptModuleEntity(
  draft: PromptDraftState,
  module: PromptKeyModule,
  entityId: string,
): DomainResult<ModuleEntityLifecycleMutation> {
  const target = validateLifecycleTarget(draft, module);
  if (!target.ok) return target;

  const moduleValues = target.value;
  const entities = getModuleEntities(moduleValues).map(cloneValue);
  const index = findEntityIndex(entities, entityId);
  if (index < 0) return entityNotFound(module.key, entityId);

  return withEntities(
    draft,
    module,
    moduleValues,
    entities.filter((entity) => entity.id !== entityId),
  );
}

export function setPromptModuleEntityEnabled(
  draft: PromptDraftState,
  module: PromptKeyModule,
  entityId: string,
  enabled: boolean,
): DomainResult<ModuleEntityLifecycleMutation> {
  const target = validateLifecycleTarget(draft, module);
  if (!target.ok) return target;

  const moduleValues = target.value;
  const entities = getModuleEntities(moduleValues).map(cloneValue);
  const index = findEntityIndex(entities, entityId);
  if (index < 0) return entityNotFound(module.key, entityId);

  const entity = {
    ...entities[index],
    enabled,
  };
  entities[index] = entity;

  return withEntities(draft, module, moduleValues, entities, entity);
}

export function setPromptModuleEntityInheritance(
  draft: PromptDraftState,
  module: PromptKeyModule,
  entityId: string,
  inheritGlobal: boolean,
): DomainResult<ModuleEntityLifecycleMutation> {
  const target = validateLifecycleTarget(draft, module);
  if (!target.ok) return target;

  if (getModuleEntityConfig(module)?.allowGlobalInheritanceToggle !== true) {
    return domainFailure({
      code: "module_entity_inheritance_unsupported",
      details: { moduleKey: module.key },
    });
  }

  const moduleValues = target.value;
  const entities = getModuleEntities(moduleValues).map(cloneValue);
  const index = findEntityIndex(entities, entityId);
  if (index < 0) return entityNotFound(module.key, entityId);

  const entity = {
    ...entities[index],
    inheritGlobal,
  };
  entities[index] = entity;

  return withEntities(draft, module, moduleValues, entities, entity);
}
