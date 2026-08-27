import type {
  OutfitItem,
  OutfitItemCategory,
  OutfitItemRelation,
  OutfitItemRelationType,
  OutfitPropertyState,
  OutfitSet,
  PromptReferenceRef,
} from "../modules/outfit.types";
import type { ModuleValues, PromptKeyModule, SemanticTargetRef } from "../modules/types";
import {
  applyPromptOutfitSetPreset,
  createPromptOutfitItem,
  createPromptOutfitRelation,
  createPromptOutfitSet,
  deletePromptOutfitItem,
  deletePromptOutfitRelation,
  deletePromptOutfitSet,
  duplicatePromptOutfitItem,
  duplicatePromptOutfitSet,
  setPromptOutfitItemProperty,
  setPromptOutfitItemSource,
  updatePromptOutfitItem,
  updatePromptOutfitRelation,
  updatePromptOutfitSet,
  type OutfitItemCreateChoice,
  type OutfitItemUpdatePatch,
  type OutfitRelationUpdatePatch,
  type OutfitSetUpdatePatch,
} from "../domain/outfitSets";
import type { DomainIssue } from "../domain/types";
import { ActionRegistry } from "./registry";
import type { ActionContext, ActionDefinition, ActionIssue } from "./types";

function actionIssues(issues: DomainIssue[]): ActionIssue[] {
  return issues.map((issue) => ({ ...issue }));
}

function resolveModule(context: ActionContext): PromptKeyModule | null {
  return context.modules.find((module) => module.key === "outfit") || null;
}

function moduleNotFound(context: ActionContext) {
  return {
    ok: false as const,
    draft: context.draft,
    issues: [{ code: "module_not_found", details: { moduleKey: "outfit" } }],
  };
}

type OutfitActionData = {
  moduleValues: ModuleValues;
  sets: OutfitSet[];
  set?: OutfitSet;
  item?: OutfitItem;
  relation?: OutfitItemRelation;
};

function normalizeResult(
  context: ActionContext,
  result: ReturnType<typeof createPromptOutfitSet>,
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
      sets: result.value.sets,
      set: result.value.set,
      item: result.value.item,
      relation: result.value.relation,
    },
  };
}

const semanticTargetSchema = {
  type: "object" as const,
  required: ["kind", "value"] as const,
  additionalProperties: false,
  properties: {
    kind: {
      type: "string" as const,
      enum: [
        "builtin",
        "module_output",
        "user_variable",
        "system_variable",
        "typography_group",
        "typography_text",
        "custom",
      ] as const,
    },
    value: { type: "string" as const, minLength: 1 },
    variableId: { type: "string" as const },
    entityId: { type: "string" as const },
    moduleKey: { type: "string" as const },
    token: { type: "string" as const },
    label: { type: "string" as const },
    parentLabel: { type: "string" as const },
  },
};

const referenceSchema = {
  type: "object" as const,
  required: ["token"] as const,
  additionalProperties: false,
  properties: {
    variableId: { type: "string" as const },
    token: { type: "string" as const, minLength: 1 },
    label: { type: "string" as const },
    source: { type: "string" as const, enum: ["user", "system"] as const },
  },
};

const propertyStateSchema = {
  type: "object" as const,
  required: ["mode"] as const,
  additionalProperties: false,
  properties: {
    mode: {
      type: "string" as const,
      enum: ["inherit", "option", "custom", "reference", "absent"] as const,
    },
    value: { type: "unknown" as const },
    reference: referenceSchema,
  },
};

const OUTFIT_CATEGORIES = [
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
] as const satisfies readonly OutfitItemCategory[];

const RELATION_TYPES = [
  "over",
  "under",
  "tucked_into",
  "layered_with",
] as const satisfies readonly OutfitItemRelationType[];

function options(context: ActionContext) {
  return {
    createSetId: context.idFactory?.outfitSet,
    createItemId: context.idFactory?.outfitItem,
    createRelationId: context.idFactory?.outfitRelation,
    subjectSources: context.environment?.subjectAssignmentTargets,
    referenceSources: context.environment?.outfitReferenceSources,
  };
}

export const outfitSetCreateAction: ActionDefinition<Record<string, never>, OutfitActionData> = {
  id: "outfit.set.create",
  description: "Create an empty Outfit Set with stable identity and the first explicit available subject target when supplied.",
  inputSchema: { type: "object", additionalProperties: false },
  execute: (context) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(context, createPromptOutfitSet(context.draft, module, options(context)));
  },
};

export const outfitSetUpdateAction: ActionDefinition<
  { setId: string; name?: string; key?: string; targets?: SemanticTargetRef[]; additionalDetails?: string },
  OutfitActionData
> = {
  id: "outfit.set.update",
  description: "Update exact Outfit Set metadata, targets, or authored details without patching nested item/relation structure.",
  inputSchema: {
    type: "object",
    required: ["setId"],
    additionalProperties: false,
    properties: {
      setId: { type: "string", minLength: 1 },
      name: { type: "string" },
      key: { type: "string" },
      targets: { type: "array", items: semanticTargetSchema },
      additionalDetails: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    const { setId, ...patch } = input;
    return normalizeResult(
      context,
      updatePromptOutfitSet(
        context.draft,
        module,
        setId,
        patch as OutfitSetUpdatePatch,
        options(context),
      ),
    );
  },
};

export const outfitSetDuplicateAction: ActionDefinition<{ setId: string }, OutfitActionData> = {
  id: "outfit.set.duplicate",
  description: "Duplicate one exact Outfit Set with fresh set/item/relation IDs and remapped known relation endpoints.",
  inputSchema: {
    type: "object",
    required: ["setId"],
    additionalProperties: false,
    properties: { setId: { type: "string", minLength: 1 } },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      duplicatePromptOutfitSet(context.draft, module, input.setId, options(context)),
    );
  },
};

export const outfitSetDeleteAction: ActionDefinition<{ setId: string }, OutfitActionData> = {
  id: "outfit.set.delete",
  description: "Delete one exact Outfit Set by stable ID without retargeting external references.",
  inputSchema: {
    type: "object",
    required: ["setId"],
    additionalProperties: false,
    properties: { setId: { type: "string", minLength: 1 } },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(context, deletePromptOutfitSet(context.draft, module, input.setId));
  },
};

export const outfitSetApplyPresetAction: ActionDefinition<
  { setId: string; presetId: string },
  OutfitActionData
> = {
  id: "outfit.set.applyPreset",
  description: "Apply or clear one Outfit recipe while preserving set targets/details and rebuilding preset-owned items/relations with fresh IDs.",
  inputSchema: {
    type: "object",
    required: ["setId", "presetId"],
    additionalProperties: false,
    properties: {
      setId: { type: "string", minLength: 1 },
      presetId: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      applyPromptOutfitSetPreset(
        context.draft,
        module,
        input.setId,
        input.presetId,
        options(context),
      ),
    );
  },
};

export const outfitItemCreateAction: ActionDefinition<
  { setId: string; choiceKind: "type" | "starter" | "custom"; type?: string; starterId?: string },
  OutfitActionData
> = {
  id: "outfit.item.create",
  description: "Create one wearable item inside an exact Outfit Set from a catalog type, starter, or custom choice.",
  inputSchema: {
    type: "object",
    required: ["setId", "choiceKind"],
    additionalProperties: false,
    properties: {
      setId: { type: "string", minLength: 1 },
      choiceKind: { type: "string", enum: ["type", "starter", "custom"] },
      type: { type: "string", minLength: 1 },
      starterId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    const choice: OutfitItemCreateChoice = input.choiceKind === "custom"
      ? { kind: "custom" }
      : input.choiceKind === "starter"
        ? { kind: "starter", starterId: input.starterId || "" }
        : { kind: "type", type: input.type || "" };
    return normalizeResult(
      context,
      createPromptOutfitItem(context.draft, module, input.setId, choice, options(context)),
    );
  },
};

export const outfitItemUpdateAction: ActionDefinition<
  {
    setId: string;
    itemId: string;
    name?: string;
    key?: string;
    type?: string;
    customType?: string;
    customCategory?: OutfitItemCategory;
    additionalDetails?: string;
  },
  OutfitActionData
> = {
  id: "outfit.item.update",
  description: "Update exact wearable metadata/type while keeping source/properties behind specialized actions.",
  inputSchema: {
    type: "object",
    required: ["setId", "itemId"],
    additionalProperties: false,
    properties: {
      setId: { type: "string", minLength: 1 },
      itemId: { type: "string", minLength: 1 },
      name: { type: "string" },
      key: { type: "string" },
      type: { type: "string", minLength: 1 },
      customType: { type: "string" },
      customCategory: { type: "string", enum: OUTFIT_CATEGORIES },
      additionalDetails: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    const { setId, itemId, ...patch } = input;
    return normalizeResult(
      context,
      updatePromptOutfitItem(
        context.draft,
        module,
        setId,
        itemId,
        patch as OutfitItemUpdatePatch,
      ),
    );
  },
};

export const outfitItemSetSourceAction: ActionDefinition<
  { setId: string; itemId: string; mode: "defined" | "reference"; reference?: PromptReferenceRef; itemHint?: string },
  OutfitActionData
> = {
  id: "outfit.item.setSource",
  description: "Set an exact wearable to a defined or exact reference baseline without fuzzy reference recovery.",
  inputSchema: {
    type: "object",
    required: ["setId", "itemId", "mode"],
    additionalProperties: false,
    properties: {
      setId: { type: "string", minLength: 1 },
      itemId: { type: "string", minLength: 1 },
      mode: { type: "string", enum: ["defined", "reference"] },
      reference: referenceSchema,
      itemHint: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    const source = input.mode === "defined"
      ? { mode: "defined" as const }
      : {
          mode: "reference" as const,
          reference: input.reference || {
            token: "{reference}",
            label: "Reference",
            source: "system" as const,
          },
          ...(input.itemHint !== undefined ? { itemHint: input.itemHint } : {}),
        };
    return normalizeResult(
      context,
      setPromptOutfitItemSource(
        context.draft,
        module,
        input.setId,
        input.itemId,
        source,
        options(context),
      ),
    );
  },
};

export const outfitItemSetPropertyAction: ActionDefinition<
  { setId: string; itemId: string; propertyId: string; state: OutfitPropertyState },
  OutfitActionData
> = {
  id: "outfit.item.setProperty",
  description: "Set one property declared by the exact wearable type/profile and detach an active set preset.",
  inputSchema: {
    type: "object",
    required: ["setId", "itemId", "propertyId", "state"],
    additionalProperties: false,
    properties: {
      setId: { type: "string", minLength: 1 },
      itemId: { type: "string", minLength: 1 },
      propertyId: { type: "string", minLength: 1 },
      state: propertyStateSchema,
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      setPromptOutfitItemProperty(
        context.draft,
        module,
        input.setId,
        input.itemId,
        input.propertyId,
        input.state,
        options(context),
      ),
    );
  },
};

export const outfitItemDuplicateAction: ActionDefinition<
  { setId: string; itemId: string },
  OutfitActionData
> = {
  id: "outfit.item.duplicate",
  description: "Duplicate one exact wearable with a fresh stable item ID/key without copying relation edges.",
  inputSchema: {
    type: "object",
    required: ["setId", "itemId"],
    additionalProperties: false,
    properties: {
      setId: { type: "string", minLength: 1 },
      itemId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      duplicatePromptOutfitItem(
        context.draft,
        module,
        input.setId,
        input.itemId,
        options(context),
      ),
    );
  },
};

export const outfitItemDeleteAction: ActionDefinition<
  { setId: string; itemId: string },
  OutfitActionData
> = {
  id: "outfit.item.delete",
  description: "Delete one exact wearable and remove only relations connected to its stable item ID.",
  inputSchema: {
    type: "object",
    required: ["setId", "itemId"],
    additionalProperties: false,
    properties: {
      setId: { type: "string", minLength: 1 },
      itemId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      deletePromptOutfitItem(context.draft, module, input.setId, input.itemId),
    );
  },
};

export const outfitRelationCreateAction: ActionDefinition<
  {
    setId: string;
    type: OutfitItemRelationType;
    sourceItemId: string;
    targetItemId: string;
    details?: string;
  },
  OutfitActionData
> = {
  id: "outfit.relation.create",
  description: "Create a relation between exact item IDs that currently exist inside one Outfit Set.",
  inputSchema: {
    type: "object",
    required: ["setId", "type", "sourceItemId", "targetItemId"],
    additionalProperties: false,
    properties: {
      setId: { type: "string", minLength: 1 },
      type: { type: "string", enum: RELATION_TYPES },
      sourceItemId: { type: "string", minLength: 1 },
      targetItemId: { type: "string", minLength: 1 },
      details: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      createPromptOutfitRelation(
        context.draft,
        module,
        input.setId,
        input.type,
        input.sourceItemId,
        input.targetItemId,
        input.details || "",
        options(context),
      ),
    );
  },
};

export const outfitRelationUpdateAction: ActionDefinition<
  {
    setId: string;
    relationId: string;
    type?: OutfitItemRelationType;
    sourceItemId?: string;
    targetItemId?: string;
    details?: string;
  },
  OutfitActionData
> = {
  id: "outfit.relation.update",
  description: "Update one exact relation; changed endpoints must resolve to exact items while unchanged orphan endpoints may persist.",
  inputSchema: {
    type: "object",
    required: ["setId", "relationId"],
    additionalProperties: false,
    properties: {
      setId: { type: "string", minLength: 1 },
      relationId: { type: "string", minLength: 1 },
      type: { type: "string", enum: RELATION_TYPES },
      sourceItemId: { type: "string", minLength: 1 },
      targetItemId: { type: "string", minLength: 1 },
      details: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    const { setId, relationId, ...patch } = input;
    return normalizeResult(
      context,
      updatePromptOutfitRelation(
        context.draft,
        module,
        setId,
        relationId,
        patch as OutfitRelationUpdatePatch,
      ),
    );
  },
};

export const outfitRelationDeleteAction: ActionDefinition<
  { setId: string; relationId: string },
  OutfitActionData
> = {
  id: "outfit.relation.delete",
  description: "Delete one exact relation by stable relation ID, including an orphan relation.",
  inputSchema: {
    type: "object",
    required: ["setId", "relationId"],
    additionalProperties: false,
    properties: {
      setId: { type: "string", minLength: 1 },
      relationId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      deletePromptOutfitRelation(context.draft, module, input.setId, input.relationId),
    );
  },
};

export const outfitActions = [
  outfitSetCreateAction,
  outfitSetUpdateAction,
  outfitSetDuplicateAction,
  outfitSetDeleteAction,
  outfitSetApplyPresetAction,
  outfitItemCreateAction,
  outfitItemUpdateAction,
  outfitItemSetSourceAction,
  outfitItemSetPropertyAction,
  outfitItemDuplicateAction,
  outfitItemDeleteAction,
  outfitRelationCreateAction,
  outfitRelationUpdateAction,
  outfitRelationDeleteAction,
] as const;

export function registerOutfitActions(registry: ActionRegistry) {
  outfitActions.forEach((action) => registry.register(action));
  return registry;
}
