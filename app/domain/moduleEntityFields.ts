import type { PromptDraftState } from "../modules/promptDraft.types";
import type {
  ModuleFieldValue,
  ModuleValues,
  PromptKeyModule,
} from "../modules/types";
import {
  getModuleEntities,
  moduleSupportsEntities,
  setModuleEntities,
  type ModuleEntity,
  type ModuleEntityPayload,
} from "../modules/entityContracts";
import { getModulePresetValues } from "../utils/compileModules";
import {
  getModuleFieldCustomValueKey,
  isModuleFieldCustomSelection,
} from "../utils/moduleFieldValues";
import {
  applySimpleModuleFieldValue,
  clearSimpleModuleFieldValue,
} from "./moduleFields";
import {
  domainFailure,
  domainSuccess,
  type DomainResult,
} from "./types";

export type ModuleEntityFieldMutation = {
  draft: PromptDraftState;
  moduleValues: ModuleValues;
  entities: ModuleEntity<ModuleEntityPayload>[];
  entity: ModuleEntity<ModuleEntityPayload>;
};

export type SetPromptModuleEntityFieldInput = {
  entityId: string;
  fieldId: string;
  value: ModuleFieldValue;
  customText?: string;
};

function cloneValue<T>(value: T): T {
  if (value === undefined || value === null) return value;

  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function validateTarget(
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

  return domainSuccess(cloneValue(draft.moduleValues[module.key] || {}));
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

function resolveEditableField(module: PromptKeyModule, fieldId: string) {
  const field = module.fields[fieldId];

  if (!field) {
    return domainFailure({
      code: "module_field_not_found",
      path: "fieldId",
      details: { moduleKey: module.key, fieldId },
    });
  }

  if (field.isOverride) {
    return domainFailure({
      code: "module_entity_field_override_unsupported",
      path: "fieldId",
      details: { moduleKey: module.key, fieldId },
    });
  }

  return domainSuccess(field);
}

function withEntity(
  draft: PromptDraftState,
  module: PromptKeyModule,
  moduleValues: ModuleValues,
  entities: ModuleEntity<ModuleEntityPayload>[],
  index: number,
  entity: ModuleEntity<ModuleEntityPayload>,
): DomainResult<ModuleEntityFieldMutation> {
  const nextEntities = entities.map((item, entityIndex) =>
    entityIndex === index ? cloneValue(entity) : cloneValue(item),
  );
  const nextModuleValues = setModuleEntities(moduleValues, nextEntities);
  const nextDraft = cloneValue(draft);

  nextDraft.moduleValues = {
    ...nextDraft.moduleValues,
    [module.key]: cloneValue(nextModuleValues),
  };

  return domainSuccess({
    draft: nextDraft,
    moduleValues: cloneValue(nextModuleValues),
    entities: cloneValue(nextEntities),
    entity: cloneValue(entity),
  });
}

export function setPromptModuleEntityField(
  draft: PromptDraftState,
  module: PromptKeyModule,
  input: SetPromptModuleEntityFieldInput,
): DomainResult<ModuleEntityFieldMutation> {
  const target = validateTarget(draft, module);
  if (!target.ok) return target;

  const fieldResult = resolveEditableField(module, input.fieldId);
  if (!fieldResult.ok) return fieldResult;

  const moduleValues = target.value;
  const entities = getModuleEntities(moduleValues).map(cloneValue);
  const index = findEntityIndex(entities, input.entityId);
  if (index < 0) return entityNotFound(module.key, input.entityId);

  const entity = entities[index];
  const payloadResult = applySimpleModuleFieldValue(
    entity.payload as ModuleValues,
    fieldResult.value,
    {
      value: input.value,
      customText: input.customText,
    },
  );
  if (!payloadResult.ok) return payloadResult;

  const nextEntity: ModuleEntity<ModuleEntityPayload> = {
    ...entity,
    payload: cloneValue(payloadResult.value) as ModuleEntityPayload,
  };

  return withEntity(
    draft,
    module,
    moduleValues,
    entities,
    index,
    nextEntity,
  );
}

export function clearPromptModuleEntityField(
  draft: PromptDraftState,
  module: PromptKeyModule,
  entityId: string,
  fieldId: string,
): DomainResult<ModuleEntityFieldMutation> {
  const target = validateTarget(draft, module);
  if (!target.ok) return target;

  const fieldResult = resolveEditableField(module, fieldId);
  if (!fieldResult.ok) return fieldResult;

  const moduleValues = target.value;
  const entities = getModuleEntities(moduleValues).map(cloneValue);
  const index = findEntityIndex(entities, entityId);
  if (index < 0) return entityNotFound(module.key, entityId);

  const entity = entities[index];
  const payloadResult = clearSimpleModuleFieldValue(
    entity.payload as ModuleValues,
    fieldResult.value,
  );
  if (!payloadResult.ok) return payloadResult;

  const nextEntity: ModuleEntity<ModuleEntityPayload> = {
    ...entity,
    payload: cloneValue(payloadResult.value) as ModuleEntityPayload,
  };

  return withEntity(
    draft,
    module,
    moduleValues,
    entities,
    index,
    nextEntity,
  );
}

export function applyPromptModuleEntityPreset(
  draft: PromptDraftState,
  module: PromptKeyModule,
  entityId: string,
  presetId: string,
): DomainResult<ModuleEntityFieldMutation> {
  const target = validateTarget(draft, module);
  if (!target.ok) return target;

  if (!module.presets?.[presetId]) {
    return domainFailure({
      code: "module_preset_not_found",
      path: "presetId",
      details: { moduleKey: module.key, presetId },
    });
  }

  const moduleValues = target.value;
  const entities = getModuleEntities(moduleValues).map(cloneValue);
  const index = findEntityIndex(entities, entityId);
  if (index < 0) return entityNotFound(module.key, entityId);

  const entity = entities[index];
  let payload = cloneValue(entity.payload) as ModuleValues;

  for (const [fieldId, value] of Object.entries(
    getModulePresetValues(module, presetId),
  )) {
    const field = module.fields[fieldId];
    if (!field || field.isOverride) continue;

    const result = applySimpleModuleFieldValue(payload, field, {
      value: cloneValue(value),
    });
    if (!result.ok) return result;

    payload = result.value;

    // Match the existing entity editor: a non-custom preset selection removes
    // stale customInput text; a custom selection keeps/creates its sidecar.
    if (
      field.customInput &&
      !isModuleFieldCustomSelection(field, value)
    ) {
      delete payload[getModuleFieldCustomValueKey(field)];
    }
  }

  const nextEntity: ModuleEntity<ModuleEntityPayload> = {
    ...entity,
    payload: cloneValue(payload) as ModuleEntityPayload,
  };

  return withEntity(
    draft,
    module,
    moduleValues,
    entities,
    index,
    nextEntity,
  );
}
