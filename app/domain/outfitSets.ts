import type { PromptDraftState } from "../modules/promptDraft.types";
import type { ModuleValues, PromptKeyModule, SemanticTargetRef } from "../modules/types";
import type {
  OutfitItem,
  OutfitItemCategory,
  OutfitItemRelation,
  OutfitItemRelationType,
  OutfitItemSource,
  OutfitPropertyBinding,
  OutfitPropertyState,
  OutfitSet,
  PromptReferenceRef,
} from "../modules/outfit.types";
import {
  getOutfitPropertyBindings,
  getOutfitPropertyOptions,
  outfitItemStarterMap,
  outfitItemTypeMap,
  outfitPresetRecipes,
  outfitPropertyDefinitions,
  outfitPropertyProfiles,
} from "../modules/outfit.catalog";
import { normalizeOutfitSets } from "../utils/compileOutfit";
import { createUniqueOutfitEntityKey } from "../utils/outfitVariables";
import { createDefaultModuleValues } from "../utils/compileModules";
import type { SemanticReferenceCatalogSource } from "../utils/semanticReferenceCatalog";
import {
  firstAvailableSubjectAssignmentTarget,
  setSubjectAssignmentTargets,
} from "./subjectAssignmentTargets";
import {
  domainFailure,
  domainSuccess,
  type DomainResult,
} from "./types";

export type OutfitReferenceCatalogSource = {
  reference: PromptReferenceRef;
  disabled?: boolean;
};

export type OutfitMutationOptions = {
  createSetId?: () => string;
  createItemId?: () => string;
  createRelationId?: () => string;
  subjectSources?: readonly SemanticReferenceCatalogSource[];
  referenceSources?: readonly OutfitReferenceCatalogSource[];
};

export type OutfitSetUpdatePatch = {
  name?: string;
  key?: string;
  targets?: SemanticTargetRef[];
  additionalDetails?: string;
};

export type OutfitItemUpdatePatch = {
  name?: string;
  key?: string;
  type?: string;
  customType?: string;
  customCategory?: OutfitItemCategory;
  additionalDetails?: string;
};

export type OutfitRelationUpdatePatch = {
  type?: OutfitItemRelationType;
  sourceItemId?: string;
  targetItemId?: string;
  details?: string;
};

export type OutfitItemCreateChoice =
  | { kind: "type"; type: string }
  | { kind: "starter"; starterId: string }
  | { kind: "custom" };

export type OutfitMutation = {
  draft: PromptDraftState;
  moduleValues: ModuleValues;
  sets: OutfitSet[];
  set?: OutfitSet;
  item?: OutfitItem;
  relation?: OutfitItemRelation;
};

const OUTFIT_RELATION_TYPES = new Set<OutfitItemRelationType>([
  "over",
  "under",
  "tucked_into",
  "layered_with",
]);

const OUTFIT_CATEGORIES = new Set<OutfitItemCategory>([
  "tops",
  "bottoms",
  "one_piece",
  "outerwear",
  "legwear",
  "footwear",
  "headwear",
  "neckwear",
  "handwear",
  "waistwear",
  "jewelry",
  "eyewear",
  "wearable_accessories",
  "specialty",
  "protective_costume",
  "custom",
]);

const CUSTOM_CATEGORY_PROFILE: Partial<Record<OutfitItemCategory, string>> = {
  tops: "top_basic",
  bottoms: "bottom_trouser",
  one_piece: "dress",
  outerwear: "outerwear",
  legwear: "legwear",
  footwear: "footwear",
  headwear: "accessory",
  neckwear: "accessory",
  handwear: "accessory",
  waistwear: "accessory",
  jewelry: "accessory",
  eyewear: "accessory",
  wearable_accessories: "accessory",
  specialty: "dress",
  protective_costume: "accessory",
};

function cloneValue<T>(value: T): T {
  if (value === undefined || value === null) return value;
  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function randomId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function currentModuleValues(
  draft: PromptDraftState,
  module: PromptKeyModule,
): ModuleValues {
  return draft.moduleValues[module.key]
    ? cloneValue(draft.moduleValues[module.key])
    : createDefaultModuleValues(module);
}

function validateOutfitTarget(
  draft: PromptDraftState,
  module: PromptKeyModule,
): DomainResult<ModuleValues> {
  if (module.key !== "outfit") {
    return domainFailure({
      code: "outfit_module_invalid",
      details: { moduleKey: module.key },
    });
  }

  if (!draft.selectedModuleKeys.includes(module.key)) {
    return domainFailure({
      code: "module_not_active",
      details: { moduleKey: module.key },
    });
  }

  const field = module.fields.outfitSets;
  if (!field || field.type !== "outfitSets") {
    return domainFailure({
      code: "outfit_sets_field_missing",
      details: { moduleKey: module.key, fieldId: "outfitSets" },
    });
  }

  return domainSuccess(currentModuleValues(draft, module));
}

function validateStableIdentities(sets: readonly OutfitSet[]): DomainResult<true> {
  const setIds = new Set<string>();

  for (const set of sets) {
    const setId = String(set.id || "").trim();
    if (!setId || setIds.has(setId)) {
      return domainFailure({
        code: "outfit_set_identity_conflict",
        details: { setId },
      });
    }
    setIds.add(setId);

    const itemIds = new Set<string>();
    for (const item of set.items) {
      const itemId = String(item.id || "").trim();
      if (!itemId || itemIds.has(itemId)) {
        return domainFailure({
          code: "outfit_item_identity_conflict",
          details: { setId, itemId },
        });
      }
      itemIds.add(itemId);
    }

    const relationIds = new Set<string>();
    for (const relation of set.relations || []) {
      const relationId = String(relation.id || "").trim();
      if (!relationId || relationIds.has(relationId)) {
        return domainFailure({
          code: "outfit_relation_identity_conflict",
          details: { setId, relationId },
        });
      }
      relationIds.add(relationId);
    }
  }

  return domainSuccess(true);
}

function readSets(values: ModuleValues): DomainResult<OutfitSet[]> {
  const sets = normalizeOutfitSets(values.outfitSets);
  const identities = validateStableIdentities(sets);
  if (!identities.ok) return identities;
  return domainSuccess(sets);
}

function setIndexById(sets: readonly OutfitSet[], setId: string) {
  return sets.findIndex((set) => set.id === setId);
}

function itemIndexById(set: OutfitSet, itemId: string) {
  return set.items.findIndex((item) => item.id === itemId);
}

function relationIndexById(set: OutfitSet, relationId: string) {
  return (set.relations || []).findIndex((relation) => relation.id === relationId);
}

function setNotFound(setId: string) {
  return domainFailure({
    code: "outfit_set_not_found",
    path: "setId",
    details: { setId },
  });
}

function itemNotFound(setId: string, itemId: string) {
  return domainFailure({
    code: "outfit_item_not_found",
    path: "itemId",
    details: { setId, itemId },
  });
}

function relationNotFound(setId: string, relationId: string) {
  return domainFailure({
    code: "outfit_relation_not_found",
    path: "relationId",
    details: { setId, relationId },
  });
}

function withSets(
  draft: PromptDraftState,
  module: PromptKeyModule,
  values: ModuleValues,
  sets: readonly OutfitSet[],
  set?: OutfitSet,
  item?: OutfitItem,
  relation?: OutfitItemRelation,
): DomainResult<OutfitMutation> {
  const nextSets = cloneValue(sets);
  const nextModuleValues: ModuleValues = {
    ...cloneValue(values),
    outfitSets: nextSets,
  };
  const nextDraft = cloneValue(draft);
  nextDraft.moduleValues = {
    ...nextDraft.moduleValues,
    [module.key]: cloneValue(nextModuleValues),
  };

  return domainSuccess({
    draft: nextDraft,
    moduleValues: cloneValue(nextModuleValues),
    sets: cloneValue(nextSets),
    set: set ? cloneValue(set) : undefined,
    item: item ? cloneValue(item) : undefined,
    relation: relation ? cloneValue(relation) : undefined,
  });
}

function referenceIdentity(reference: PromptReferenceRef) {
  const variableId = String(reference.variableId || "").trim();
  if (variableId) return `${reference.source || "unknown"}:${variableId}`;
  return `token:${String(reference.token || "").trim()}`;
}

function normalizeReference(reference: PromptReferenceRef): PromptReferenceRef {
  return {
    ...(reference.variableId ? { variableId: String(reference.variableId) } : {}),
    token: String(reference.token || "").trim(),
    ...(reference.label !== undefined ? { label: String(reference.label) } : {}),
    ...(reference.source === "user" || reference.source === "system"
      ? { source: reference.source }
      : {}),
  };
}

function isMainReference(reference: PromptReferenceRef) {
  return String(reference.token || "").trim() === "{reference}" &&
    (!reference.variableId || reference.source === "system");
}

function resolveOutfitReference(
  requested: PromptReferenceRef,
  current: PromptReferenceRef | undefined,
  sources: readonly OutfitReferenceCatalogSource[] = [],
): DomainResult<PromptReferenceRef> {
  const normalized = normalizeReference(requested);
  if (!normalized.token) {
    return domainFailure({
      code: "outfit_reference_invalid",
      path: "reference.token",
    });
  }

  if (isMainReference(normalized)) {
    return domainSuccess({
      token: "{reference}",
      label: normalized.label || "Reference",
      source: "system",
    });
  }

  const identity = referenceIdentity(normalized);
  const source = sources.find(
    (candidate) => referenceIdentity(normalizeReference(candidate.reference)) === identity,
  );

  if (source && !source.disabled) {
    return domainSuccess(normalizeReference(source.reference));
  }

  if (current && referenceIdentity(normalizeReference(current)) === identity) {
    return domainSuccess(normalizeReference(current));
  }

  return domainFailure({
    code: source ? "outfit_reference_unavailable" : "outfit_reference_missing",
    path: "reference",
    details: { identity },
  });
}

function firstAvailableOutfitReference(
  sources: readonly OutfitReferenceCatalogSource[] = [],
): PromptReferenceRef {
  const source = sources.find((candidate) => candidate.disabled !== true);
  return source
    ? normalizeReference(source.reference)
    : { token: "{reference}", label: "Reference", source: "system" };
}

function itemPropertyBindings(item: OutfitItem): OutfitPropertyBinding[] {
  const definition = outfitItemTypeMap.get(item.type);
  if (definition) return getOutfitPropertyBindings(definition);
  if (item.type !== "custom") return [];
  const profileId = CUSTOM_CATEGORY_PROFILE[item.customCategory || "custom"];
  return profileId ? cloneValue(outfitPropertyProfiles[profileId]?.properties || []) : [];
}

function propertyBinding(item: OutfitItem, propertyId: string) {
  return itemPropertyBindings(item).find((binding) => binding.propertyId === propertyId);
}

function validatePropertyState(
  item: OutfitItem,
  propertyId: string,
  state: OutfitPropertyState,
  currentState: OutfitPropertyState | undefined,
  referenceSources: readonly OutfitReferenceCatalogSource[] = [],
): DomainResult<OutfitPropertyState> {
  const definition = outfitPropertyDefinitions[propertyId];
  const binding = propertyBinding(item, propertyId);

  if (!definition) {
    return domainFailure({
      code: "outfit_property_not_found",
      path: "propertyId",
      details: { propertyId },
    });
  }

  if (!binding) {
    return domainFailure({
      code: "outfit_item_property_unsupported",
      path: "propertyId",
      details: { itemId: item.id, propertyId },
    });
  }

  if (state.mode === "inherit") return domainSuccess({ mode: "inherit" });

  if (state.mode === "option") {
    const options = getOutfitPropertyOptions(propertyId, binding.optionSet);
    const allowed = new Set(options.map((option) => option.value));

    if (definition.control === "multiSelect") {
      const values = Array.isArray(state.value) ? state.value : [state.value];
      const normalized = values.map((value) => String(value || "")).filter(Boolean);
      const invalid = normalized.find((value) => !allowed.has(value));
      if (invalid) {
        return domainFailure({
          code: "outfit_property_invalid_option",
          path: "state.value",
          details: { propertyId, value: invalid, optionSet: binding.optionSet },
        });
      }
      return domainSuccess({ mode: "option", value: [...new Set(normalized)] });
    }

    if (Array.isArray(state.value)) {
      return domainFailure({
        code: "outfit_property_invalid_option_shape",
        path: "state.value",
        details: { propertyId, control: definition.control },
      });
    }

    const value = String(state.value || "");
    if (!value || !allowed.has(value)) {
      return domainFailure({
        code: "outfit_property_invalid_option",
        path: "state.value",
        details: { propertyId, value, optionSet: binding.optionSet },
      });
    }
    return domainSuccess({ mode: "option", value });
  }

  if (state.mode === "custom") {
    if (!definition.allowCustom) {
      return domainFailure({
        code: "outfit_property_custom_unsupported",
        path: "state.mode",
        details: { propertyId },
      });
    }
    return domainSuccess({ mode: "custom", value: String(state.value || "") });
  }

  if (state.mode === "absent") {
    return definition.allowAbsent
      ? domainSuccess({ mode: "absent" })
      : domainFailure({
          code: "outfit_property_absent_unsupported",
          path: "state.mode",
          details: { propertyId },
        });
  }

  if (state.mode === "reference") {
    if (!definition.allowReference) {
      return domainFailure({
        code: "outfit_property_reference_unsupported",
        path: "state.mode",
        details: { propertyId },
      });
    }

    if (!state.reference) return domainSuccess({ mode: "reference" });
    const currentReference =
      currentState?.mode === "reference" ? currentState.reference : undefined;
    const reference = resolveOutfitReference(
      state.reference,
      currentReference,
      referenceSources,
    );
    if (!reference.ok) return reference;
    return domainSuccess({ mode: "reference", reference: reference.value });
  }

  return domainFailure({
    code: "outfit_property_invalid_state",
    path: "state.mode",
    details: { propertyId },
  });
}

function itemFromChoice(
  choice: OutfitItemCreateChoice,
  existingKeys: Iterable<string>,
  createItemId: () => string,
): DomainResult<OutfitItem> {
  if (choice.kind === "custom") {
    return domainSuccess({
      id: createItemId(),
      key: createUniqueOutfitEntityKey("customWearable", existingKeys, "item"),
      name: "Custom Wearable",
      type: "custom",
      customType: "",
      customCategory: "custom",
      source: { mode: "defined" },
      properties: {},
      additionalDetails: "",
    });
  }

  if (choice.kind === "starter") {
    const starter = outfitItemStarterMap.get(choice.starterId);
    if (!starter) {
      return domainFailure({
        code: "outfit_item_starter_not_found",
        path: "starterId",
        details: { starterId: choice.starterId },
      });
    }
    return domainSuccess({
      id: createItemId(),
      key: createUniqueOutfitEntityKey(
        starter.item.customType || starter.item.type || starter.label,
        existingKeys,
        "item",
      ),
      name: starter.label,
      type: starter.item.type,
      ...(starter.item.customType !== undefined
        ? { customType: starter.item.customType }
        : {}),
      ...(starter.item.customCategory !== undefined
        ? { customCategory: starter.item.customCategory }
        : {}),
      source: { mode: "defined" },
      properties: cloneValue(starter.item.properties || {}),
      additionalDetails: "",
    });
  }

  const definition = outfitItemTypeMap.get(choice.type);
  if (!definition) {
    return domainFailure({
      code: "outfit_item_type_not_found",
      path: "type",
      details: { type: choice.type },
    });
  }

  return domainSuccess({
    id: createItemId(),
    key: createUniqueOutfitEntityKey(choice.type, existingKeys, "item"),
    name: definition.label,
    type: definition.value,
    source: { mode: "defined" },
    properties: {},
    additionalDetails: "",
  });
}

function validateRelationEndpoint(
  set: OutfitSet,
  itemId: string,
  path: "sourceItemId" | "targetItemId",
): DomainResult<true> {
  if (set.items.some((item) => item.id === itemId)) return domainSuccess(true);
  return domainFailure({
    code: "outfit_relation_endpoint_not_found",
    path,
    details: { setId: set.id, itemId },
  });
}

export function createPromptOutfitSet(
  draft: PromptDraftState,
  module: PromptKeyModule,
  options: OutfitMutationOptions = {},
): DomainResult<OutfitMutation> {
  const target = validateOutfitTarget(draft, module);
  if (!target.ok) return target;
  const setsResult = readSets(target.value);
  if (!setsResult.ok) return setsResult;
  const sets = setsResult.value;
  const index = sets.length + 1;
  const firstTarget = firstAvailableSubjectAssignmentTarget({
    sources: options.subjectSources,
  });
  const set: OutfitSet = {
    id: (options.createSetId || (() => randomId("outfit-set")))(),
    key: createUniqueOutfitEntityKey(
      `set${index}`,
      sets.map((candidate) => candidate.key),
      "set",
    ),
    name: `Outfit Set ${index}`,
    targets: firstTarget ? [firstTarget] : [],
    items: [],
    relations: [],
    additionalDetails: "",
  };

  if (sets.some((candidate) => candidate.id === set.id)) {
    return domainFailure({
      code: "outfit_set_identity_conflict",
      details: { setId: set.id },
    });
  }

  return withSets(draft, module, target.value, [...sets, set], set);
}

export function updatePromptOutfitSet(
  draft: PromptDraftState,
  module: PromptKeyModule,
  setId: string,
  patch: OutfitSetUpdatePatch,
  options: OutfitMutationOptions = {},
): DomainResult<OutfitMutation> {
  if (!Object.keys(patch).length) {
    return domainFailure({ code: "outfit_set_patch_empty", path: "setId" });
  }
  const target = validateOutfitTarget(draft, module);
  if (!target.ok) return target;
  const setsResult = readSets(target.value);
  if (!setsResult.ok) return setsResult;
  const sets = setsResult.value;
  const index = setIndexById(sets, setId);
  if (index < 0) return setNotFound(setId);
  const current = cloneValue(sets[index]);
  const next = cloneValue(current);

  if (patch.name !== undefined) next.name = String(patch.name);
  if (patch.key !== undefined) {
    next.key = createUniqueOutfitEntityKey(
      String(patch.key),
      sets.filter((_, itemIndex) => itemIndex !== index).map((candidate) => candidate.key),
      current.key || `set${index + 1}`,
    );
  }
  if (patch.targets !== undefined) {
    const targets = setSubjectAssignmentTargets(current.targets, patch.targets, {
      sources: options.subjectSources,
    });
    if (!targets.ok) return targets;
    next.targets = targets.value;
  }
  if (patch.additionalDetails !== undefined) {
    next.additionalDetails = String(patch.additionalDetails);
    next.presetId = undefined;
  }

  const updated = cloneValue(sets);
  updated[index] = next;
  return withSets(draft, module, target.value, updated, next);
}

export function deletePromptOutfitSet(
  draft: PromptDraftState,
  module: PromptKeyModule,
  setId: string,
): DomainResult<OutfitMutation> {
  const target = validateOutfitTarget(draft, module);
  if (!target.ok) return target;
  const setsResult = readSets(target.value);
  if (!setsResult.ok) return setsResult;
  const sets = setsResult.value;
  const index = setIndexById(sets, setId);
  if (index < 0) return setNotFound(setId);
  return withSets(
    draft,
    module,
    target.value,
    sets.filter((_, itemIndex) => itemIndex !== index),
    cloneValue(sets[index]),
  );
}

export function duplicatePromptOutfitSet(
  draft: PromptDraftState,
  module: PromptKeyModule,
  setId: string,
  options: OutfitMutationOptions = {},
): DomainResult<OutfitMutation> {
  const target = validateOutfitTarget(draft, module);
  if (!target.ok) return target;
  const setsResult = readSets(target.value);
  if (!setsResult.ok) return setsResult;
  const sets = setsResult.value;
  const index = setIndexById(sets, setId);
  if (index < 0) return setNotFound(setId);
  const source = sets[index];
  const createItemId = options.createItemId || (() => randomId("outfit-item"));
  const createRelationId = options.createRelationId || (() => randomId("outfit-relation"));
  const itemIdMap = new Map<string, string>();
  const itemIds = new Set<string>();
  const relationIds = new Set<string>();

  const items: OutfitItem[] = [];
  for (const item of source.items) {
    const id = createItemId();
    if (itemIds.has(id)) {
      return domainFailure({
        code: "outfit_item_identity_conflict",
        details: { setId, itemId: id },
      });
    }
    itemIds.add(id);
    itemIdMap.set(item.id, id);
    items.push({ ...cloneValue(item), id });
  }

  const relations: OutfitItemRelation[] = [];
  for (const relation of source.relations || []) {
    const id = createRelationId();
    if (relationIds.has(id)) {
      return domainFailure({
        code: "outfit_relation_identity_conflict",
        details: { setId, relationId: id },
      });
    }
    relationIds.add(id);
    relations.push({
      ...cloneValue(relation),
      id,
      sourceItemId: itemIdMap.get(relation.sourceItemId) || relation.sourceItemId,
      targetItemId: itemIdMap.get(relation.targetItemId) || relation.targetItemId,
    });
  }

  const duplicate: OutfitSet = {
    ...cloneValue(source),
    id: (options.createSetId || (() => randomId("outfit-set")))(),
    key: createUniqueOutfitEntityKey(
      `${source.key}Copy`,
      sets.map((candidate) => candidate.key),
      "set",
    ),
    name: `${source.name || "Outfit Set"} Copy`,
    presetId: undefined,
    items,
    relations,
  };

  if (sets.some((candidate) => candidate.id === duplicate.id)) {
    return domainFailure({
      code: "outfit_set_identity_conflict",
      details: { setId: duplicate.id },
    });
  }

  return withSets(
    draft,
    module,
    target.value,
    [...sets, duplicate],
    duplicate,
  );
}

export function applyPromptOutfitSetPreset(
  draft: PromptDraftState,
  module: PromptKeyModule,
  setId: string,
  presetId: string,
  options: OutfitMutationOptions = {},
): DomainResult<OutfitMutation> {
  const target = validateOutfitTarget(draft, module);
  if (!target.ok) return target;
  const setsResult = readSets(target.value);
  if (!setsResult.ok) return setsResult;
  const sets = setsResult.value;
  const index = setIndexById(sets, setId);
  if (index < 0) return setNotFound(setId);
  const current = sets[index];

  if (!presetId) {
    const next = { ...cloneValue(current), presetId: undefined };
    const updated = cloneValue(sets);
    updated[index] = next;
    return withSets(draft, module, target.value, updated, next);
  }

  const recipe = outfitPresetRecipes.find((preset) => preset.id === presetId);
  if (!recipe) {
    return domainFailure({
      code: "outfit_preset_not_found",
      path: "presetId",
      details: { presetId },
    });
  }

  const createItemId = options.createItemId || (() => randomId("outfit-item"));
  const createRelationId = options.createRelationId || (() => randomId("outfit-relation"));
  const keyToId = new Map<string, string>();
  const usedItemKeys = new Set<string>();
  const itemIds = new Set<string>();
  const relationIds = new Set<string>();
  const items: OutfitItem[] = [];

  for (const [itemIndex, recipeItem] of recipe.items.entries()) {
    const id = createItemId();
    if (itemIds.has(id)) {
      return domainFailure({
        code: "outfit_item_identity_conflict",
        details: { setId, itemId: id },
      });
    }
    itemIds.add(id);
    keyToId.set(recipeItem.key, id);
    const definition = outfitItemTypeMap.get(recipeItem.type);
    const key = createUniqueOutfitEntityKey(
      recipeItem.customType || recipeItem.type || recipeItem.key,
      usedItemKeys,
      `item${itemIndex + 1}`,
    );
    usedItemKeys.add(key);
    items.push({
      id,
      key,
      name: definition?.label || recipeItem.customType || recipeItem.type,
      type: recipeItem.type,
      ...(recipeItem.customType !== undefined
        ? { customType: recipeItem.customType }
        : {}),
      ...(recipeItem.customCategory !== undefined
        ? { customCategory: recipeItem.customCategory }
        : {}),
      source: { mode: "defined" },
      properties: cloneValue(recipeItem.properties || {}),
      additionalDetails: recipeItem.additionalDetails || "",
    });
  }

  const relations: OutfitItemRelation[] = [];
  for (const relationRecipe of recipe.relations || []) {
    const id = createRelationId();
    if (relationIds.has(id)) {
      return domainFailure({
        code: "outfit_relation_identity_conflict",
        details: { setId, relationId: id },
      });
    }
    relationIds.add(id);
    relations.push({
      id,
      type: relationRecipe.type,
      sourceItemId: keyToId.get(relationRecipe.sourceKey) || relationRecipe.sourceKey,
      targetItemId: keyToId.get(relationRecipe.targetKey) || relationRecipe.targetKey,
      ...(relationRecipe.details !== undefined
        ? { details: relationRecipe.details }
        : {}),
    });
  }

  const hasDefaultName = /^Outfit Set \d+$/i.test(current.name?.trim() || "");
  const nextName = hasDefaultName
    ? recipe.name || `${recipe.label} Set`
    : current.name?.trim() || recipe.name || recipe.label;
  const nextKey = hasDefaultName
    ? createUniqueOutfitEntityKey(
        nextName,
        sets.filter((_, itemIndex) => itemIndex !== index).map((candidate) => candidate.key),
        current.key,
      )
    : current.key;

  const next: OutfitSet = {
    ...cloneValue(current),
    presetId: recipe.id,
    name: nextName,
    key: nextKey,
    items,
    relations,
  };
  const updated = cloneValue(sets);
  updated[index] = next;
  return withSets(draft, module, target.value, updated, next);
}

export function createPromptOutfitItem(
  draft: PromptDraftState,
  module: PromptKeyModule,
  setId: string,
  choice: OutfitItemCreateChoice,
  options: OutfitMutationOptions = {},
): DomainResult<OutfitMutation> {
  const target = validateOutfitTarget(draft, module);
  if (!target.ok) return target;
  const setsResult = readSets(target.value);
  if (!setsResult.ok) return setsResult;
  const sets = setsResult.value;
  const setIndex = setIndexById(sets, setId);
  if (setIndex < 0) return setNotFound(setId);
  const currentSet = sets[setIndex];
  const item = itemFromChoice(
    choice,
    currentSet.items.map((candidate) => candidate.key),
    options.createItemId || (() => randomId("outfit-item")),
  );
  if (!item.ok) return item;
  if (currentSet.items.some((candidate) => candidate.id === item.value.id)) {
    return domainFailure({
      code: "outfit_item_identity_conflict",
      details: { setId, itemId: item.value.id },
    });
  }

  const nextSet: OutfitSet = {
    ...cloneValue(currentSet),
    presetId: undefined,
    items: [...cloneValue(currentSet.items), cloneValue(item.value)],
  };
  const updated = cloneValue(sets);
  updated[setIndex] = nextSet;
  return withSets(draft, module, target.value, updated, nextSet, item.value);
}

export function updatePromptOutfitItem(
  draft: PromptDraftState,
  module: PromptKeyModule,
  setId: string,
  itemId: string,
  patch: OutfitItemUpdatePatch,
): DomainResult<OutfitMutation> {
  if (!Object.keys(patch).length) {
    return domainFailure({ code: "outfit_item_patch_empty", path: "itemId" });
  }
  const target = validateOutfitTarget(draft, module);
  if (!target.ok) return target;
  const setsResult = readSets(target.value);
  if (!setsResult.ok) return setsResult;
  const sets = setsResult.value;
  const setIndex = setIndexById(sets, setId);
  if (setIndex < 0) return setNotFound(setId);
  const currentSet = sets[setIndex];
  const itemIndex = itemIndexById(currentSet, itemId);
  if (itemIndex < 0) return itemNotFound(setId, itemId);
  const current = currentSet.items[itemIndex];
  const next = cloneValue(current);

  if (patch.name !== undefined) next.name = String(patch.name);
  if (patch.key !== undefined) {
    next.key = createUniqueOutfitEntityKey(
      String(patch.key),
      currentSet.items
        .filter((_, index) => index !== itemIndex)
        .map((candidate) => candidate.key),
      current.key || `item${itemIndex + 1}`,
    );
  }
  if (patch.type !== undefined) {
    const type = String(patch.type || "custom");
    const definition = outfitItemTypeMap.get(type);
    if (!definition && type !== "custom") {
      return domainFailure({
        code: "outfit_item_type_not_found",
        path: "type",
        details: { type },
      });
    }
    next.type = type;
    next.name = definition?.label || (type === "custom" ? current.name : type);
    next.customType = type === "custom" ? current.customType || "" : undefined;
    next.customCategory = type === "custom" ? current.customCategory || "custom" : undefined;
    next.properties = {};
  }
  if (patch.customType !== undefined) {
    if (next.type !== "custom") {
      return domainFailure({
        code: "outfit_custom_type_unsupported",
        path: "customType",
        details: { itemId },
      });
    }
    next.customType = String(patch.customType);
  }
  if (patch.customCategory !== undefined) {
    if (next.type !== "custom") {
      return domainFailure({
        code: "outfit_custom_category_unsupported",
        path: "customCategory",
        details: { itemId },
      });
    }
    if (!OUTFIT_CATEGORIES.has(patch.customCategory)) {
      return domainFailure({
        code: "outfit_custom_category_invalid",
        path: "customCategory",
        details: { customCategory: patch.customCategory },
      });
    }
    next.customCategory = patch.customCategory;
    next.properties = {};
  }
  if (patch.additionalDetails !== undefined) {
    next.additionalDetails = String(patch.additionalDetails);
  }

  const nextSet: OutfitSet = {
    ...cloneValue(currentSet),
    presetId: undefined,
    items: currentSet.items.map((item, index) =>
      index === itemIndex ? cloneValue(next) : cloneValue(item),
    ),
  };
  const updated = cloneValue(sets);
  updated[setIndex] = nextSet;
  return withSets(draft, module, target.value, updated, nextSet, next);
}

export function setPromptOutfitItemSource(
  draft: PromptDraftState,
  module: PromptKeyModule,
  setId: string,
  itemId: string,
  source: OutfitItemSource,
  options: OutfitMutationOptions = {},
): DomainResult<OutfitMutation> {
  const target = validateOutfitTarget(draft, module);
  if (!target.ok) return target;
  const setsResult = readSets(target.value);
  if (!setsResult.ok) return setsResult;
  const sets = setsResult.value;
  const setIndex = setIndexById(sets, setId);
  if (setIndex < 0) return setNotFound(setId);
  const currentSet = sets[setIndex];
  const itemIndex = itemIndexById(currentSet, itemId);
  if (itemIndex < 0) return itemNotFound(setId, itemId);
  const current = currentSet.items[itemIndex];

  let nextSource: OutfitItemSource;
  if (source.mode === "defined") {
    nextSource = { mode: "defined" };
  } else {
    const requested = source.reference || firstAvailableOutfitReference(options.referenceSources);
    const currentReference =
      current.source.mode === "reference" ? current.source.reference : undefined;
    const reference = resolveOutfitReference(
      requested,
      currentReference,
      options.referenceSources,
    );
    if (!reference.ok) return reference;
    nextSource = {
      mode: "reference",
      reference: reference.value,
      ...(source.itemHint !== undefined
        ? { itemHint: String(source.itemHint) }
        : {}),
    };
  }

  const next = { ...cloneValue(current), source: nextSource };
  const nextSet: OutfitSet = {
    ...cloneValue(currentSet),
    presetId: undefined,
    items: currentSet.items.map((item, index) =>
      index === itemIndex ? cloneValue(next) : cloneValue(item),
    ),
  };
  const updated = cloneValue(sets);
  updated[setIndex] = nextSet;
  return withSets(draft, module, target.value, updated, nextSet, next);
}

export function setPromptOutfitItemProperty(
  draft: PromptDraftState,
  module: PromptKeyModule,
  setId: string,
  itemId: string,
  propertyId: string,
  state: OutfitPropertyState,
  options: OutfitMutationOptions = {},
): DomainResult<OutfitMutation> {
  const target = validateOutfitTarget(draft, module);
  if (!target.ok) return target;
  const setsResult = readSets(target.value);
  if (!setsResult.ok) return setsResult;
  const sets = setsResult.value;
  const setIndex = setIndexById(sets, setId);
  if (setIndex < 0) return setNotFound(setId);
  const currentSet = sets[setIndex];
  const itemIndex = itemIndexById(currentSet, itemId);
  if (itemIndex < 0) return itemNotFound(setId, itemId);
  const current = currentSet.items[itemIndex];
  const validated = validatePropertyState(
    current,
    propertyId,
    state,
    current.properties[propertyId],
    options.referenceSources,
  );
  if (!validated.ok) return validated;

  const next: OutfitItem = {
    ...cloneValue(current),
    properties: {
      ...cloneValue(current.properties),
      [propertyId]: cloneValue(validated.value),
    },
  };
  const nextSet: OutfitSet = {
    ...cloneValue(currentSet),
    presetId: undefined,
    items: currentSet.items.map((item, index) =>
      index === itemIndex ? cloneValue(next) : cloneValue(item),
    ),
  };
  const updated = cloneValue(sets);
  updated[setIndex] = nextSet;
  return withSets(draft, module, target.value, updated, nextSet, next);
}

export function duplicatePromptOutfitItem(
  draft: PromptDraftState,
  module: PromptKeyModule,
  setId: string,
  itemId: string,
  options: OutfitMutationOptions = {},
): DomainResult<OutfitMutation> {
  const target = validateOutfitTarget(draft, module);
  if (!target.ok) return target;
  const setsResult = readSets(target.value);
  if (!setsResult.ok) return setsResult;
  const sets = setsResult.value;
  const setIndex = setIndexById(sets, setId);
  if (setIndex < 0) return setNotFound(setId);
  const currentSet = sets[setIndex];
  const itemIndex = itemIndexById(currentSet, itemId);
  if (itemIndex < 0) return itemNotFound(setId, itemId);
  const source = currentSet.items[itemIndex];
  const duplicate: OutfitItem = {
    ...cloneValue(source),
    id: (options.createItemId || (() => randomId("outfit-item")))(),
    key: createUniqueOutfitEntityKey(
      source.key,
      currentSet.items.map((candidate) => candidate.key),
      "item",
    ),
    name: `${source.name || source.type} Copy`,
  };
  if (currentSet.items.some((candidate) => candidate.id === duplicate.id)) {
    return domainFailure({
      code: "outfit_item_identity_conflict",
      details: { setId, itemId: duplicate.id },
    });
  }

  const nextSet: OutfitSet = {
    ...cloneValue(currentSet),
    presetId: undefined,
    items: [...cloneValue(currentSet.items), duplicate],
  };
  const updated = cloneValue(sets);
  updated[setIndex] = nextSet;
  return withSets(draft, module, target.value, updated, nextSet, duplicate);
}

export function deletePromptOutfitItem(
  draft: PromptDraftState,
  module: PromptKeyModule,
  setId: string,
  itemId: string,
): DomainResult<OutfitMutation> {
  const target = validateOutfitTarget(draft, module);
  if (!target.ok) return target;
  const setsResult = readSets(target.value);
  if (!setsResult.ok) return setsResult;
  const sets = setsResult.value;
  const setIndex = setIndexById(sets, setId);
  if (setIndex < 0) return setNotFound(setId);
  const currentSet = sets[setIndex];
  const itemIndex = itemIndexById(currentSet, itemId);
  if (itemIndex < 0) return itemNotFound(setId, itemId);
  const removed = currentSet.items[itemIndex];
  const nextSet: OutfitSet = {
    ...cloneValue(currentSet),
    presetId: undefined,
    items: currentSet.items.filter((_, index) => index !== itemIndex),
    relations: (currentSet.relations || []).filter(
      (relation) =>
        relation.sourceItemId !== itemId && relation.targetItemId !== itemId,
    ),
  };
  const updated = cloneValue(sets);
  updated[setIndex] = nextSet;
  return withSets(draft, module, target.value, updated, nextSet, removed);
}

export function createPromptOutfitRelation(
  draft: PromptDraftState,
  module: PromptKeyModule,
  setId: string,
  type: OutfitItemRelationType,
  sourceItemId: string,
  targetItemId: string,
  details = "",
  options: OutfitMutationOptions = {},
): DomainResult<OutfitMutation> {
  if (!OUTFIT_RELATION_TYPES.has(type)) {
    return domainFailure({
      code: "outfit_relation_type_invalid",
      path: "type",
      details: { type },
    });
  }
  const target = validateOutfitTarget(draft, module);
  if (!target.ok) return target;
  const setsResult = readSets(target.value);
  if (!setsResult.ok) return setsResult;
  const sets = setsResult.value;
  const setIndex = setIndexById(sets, setId);
  if (setIndex < 0) return setNotFound(setId);
  const currentSet = sets[setIndex];
  const sourceCheck = validateRelationEndpoint(currentSet, sourceItemId, "sourceItemId");
  if (!sourceCheck.ok) return sourceCheck;
  const targetCheck = validateRelationEndpoint(currentSet, targetItemId, "targetItemId");
  if (!targetCheck.ok) return targetCheck;

  const relation: OutfitItemRelation = {
    id: (options.createRelationId || (() => randomId("outfit-relation")))(),
    type,
    sourceItemId,
    targetItemId,
    ...(details !== undefined ? { details: String(details) } : {}),
  };
  if ((currentSet.relations || []).some((candidate) => candidate.id === relation.id)) {
    return domainFailure({
      code: "outfit_relation_identity_conflict",
      details: { setId, relationId: relation.id },
    });
  }

  const nextSet: OutfitSet = {
    ...cloneValue(currentSet),
    presetId: undefined,
    relations: [...cloneValue(currentSet.relations || []), relation],
  };
  const updated = cloneValue(sets);
  updated[setIndex] = nextSet;
  return withSets(draft, module, target.value, updated, nextSet, undefined, relation);
}

export function updatePromptOutfitRelation(
  draft: PromptDraftState,
  module: PromptKeyModule,
  setId: string,
  relationId: string,
  patch: OutfitRelationUpdatePatch,
): DomainResult<OutfitMutation> {
  if (!Object.keys(patch).length) {
    return domainFailure({ code: "outfit_relation_patch_empty", path: "relationId" });
  }
  const target = validateOutfitTarget(draft, module);
  if (!target.ok) return target;
  const setsResult = readSets(target.value);
  if (!setsResult.ok) return setsResult;
  const sets = setsResult.value;
  const setIndex = setIndexById(sets, setId);
  if (setIndex < 0) return setNotFound(setId);
  const currentSet = sets[setIndex];
  const relationIndex = relationIndexById(currentSet, relationId);
  if (relationIndex < 0) return relationNotFound(setId, relationId);
  const current = (currentSet.relations || [])[relationIndex];
  const next = cloneValue(current);

  if (patch.type !== undefined) {
    if (!OUTFIT_RELATION_TYPES.has(patch.type)) {
      return domainFailure({
        code: "outfit_relation_type_invalid",
        path: "type",
        details: { type: patch.type },
      });
    }
    next.type = patch.type;
  }
  if (patch.sourceItemId !== undefined && patch.sourceItemId !== current.sourceItemId) {
    const endpoint = validateRelationEndpoint(currentSet, patch.sourceItemId, "sourceItemId");
    if (!endpoint.ok) return endpoint;
    next.sourceItemId = patch.sourceItemId;
  }
  if (patch.targetItemId !== undefined && patch.targetItemId !== current.targetItemId) {
    const endpoint = validateRelationEndpoint(currentSet, patch.targetItemId, "targetItemId");
    if (!endpoint.ok) return endpoint;
    next.targetItemId = patch.targetItemId;
  }
  if (patch.details !== undefined) next.details = String(patch.details);

  const relations = cloneValue(currentSet.relations || []);
  relations[relationIndex] = next;
  const nextSet: OutfitSet = {
    ...cloneValue(currentSet),
    presetId: undefined,
    relations,
  };
  const updated = cloneValue(sets);
  updated[setIndex] = nextSet;
  return withSets(draft, module, target.value, updated, nextSet, undefined, next);
}

export function deletePromptOutfitRelation(
  draft: PromptDraftState,
  module: PromptKeyModule,
  setId: string,
  relationId: string,
): DomainResult<OutfitMutation> {
  const target = validateOutfitTarget(draft, module);
  if (!target.ok) return target;
  const setsResult = readSets(target.value);
  if (!setsResult.ok) return setsResult;
  const sets = setsResult.value;
  const setIndex = setIndexById(sets, setId);
  if (setIndex < 0) return setNotFound(setId);
  const currentSet = sets[setIndex];
  const relationIndex = relationIndexById(currentSet, relationId);
  if (relationIndex < 0) return relationNotFound(setId, relationId);
  const removed = (currentSet.relations || [])[relationIndex];
  const nextSet: OutfitSet = {
    ...cloneValue(currentSet),
    presetId: undefined,
    relations: (currentSet.relations || []).filter((_, index) => index !== relationIndex),
  };
  const updated = cloneValue(sets);
  updated[setIndex] = nextSet;
  return withSets(draft, module, target.value, updated, nextSet, undefined, removed);
}
