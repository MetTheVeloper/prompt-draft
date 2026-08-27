import type {
  HairComponent,
  HairComponentType,
  HairPropertyState,
  HairReferenceRef,
  HairStyle,
  HairStyleSource,
} from "../modules/hair.types";
import type { ModuleValues, PromptKeyModule, SemanticTargetRef } from "../modules/types";
import {
  applyPromptHairStylePreset,
  createPromptHairComponent,
  createPromptHairStyle,
  deletePromptHairComponent,
  deletePromptHairStyle,
  duplicatePromptHairComponent,
  duplicatePromptHairStyle,
  setPromptHairComponentProperty,
  setPromptHairStyleProperty,
  setPromptHairStyleSource,
  updatePromptHairComponent,
  updatePromptHairStyle,
  type HairComponentCreateChoice,
  type HairComponentUpdatePatch,
  type HairStyleUpdatePatch,
} from "../domain/hairStyles";
import type { DomainIssue } from "../domain/types";
import { ActionRegistry } from "./registry";
import type { ActionContext, ActionDefinition, ActionIssue } from "./types";

function actionIssues(issues: DomainIssue[]): ActionIssue[] {
  return issues.map((issue) => ({ ...issue }));
}

function resolveModule(context: ActionContext): PromptKeyModule | null {
  return context.modules.find((module) => module.key === "hair") || null;
}

function moduleNotFound(context: ActionContext) {
  return {
    ok: false as const,
    draft: context.draft,
    issues: [{ code: "module_not_found", details: { moduleKey: "hair" } }],
  };
}

type HairActionData = {
  moduleValues: ModuleValues;
  styles: HairStyle[];
  style?: HairStyle;
  component?: HairComponent;
};

function normalizeResult(
  context: ActionContext,
  result: ReturnType<typeof createPromptHairStyle>,
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
      styles: result.value.styles,
      style: result.value.style,
      component: result.value.component,
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

const hairReferenceSchema = {
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
    value: { type: "string" as const },
    reference: hairReferenceSchema,
  },
};

const HAIR_COMPONENT_TYPES = [
  "bangs",
  "ponytail",
  "bun",
  "braid",
  "twist",
  "locs",
  "face_framing_strands",
  "shaved_section",
  "hair_accessory",
  "custom",
] as const satisfies readonly HairComponentType[];

function options(context: ActionContext) {
  return {
    createStyleId: context.idFactory?.hairStyle,
    createComponentId: context.idFactory?.hairComponent,
    subjectSources: context.environment?.subjectAssignmentTargets,
    referenceSources: context.environment?.hairReferenceSources,
  };
}

export const hairStyleCreateAction: ActionDefinition<Record<string, never>, HairActionData> = {
  id: "hair.style.create",
  description: "Create an empty hairstyle with stable identity and the first explicit available subject target when supplied.",
  inputSchema: { type: "object", additionalProperties: false },
  execute: (context) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(context, createPromptHairStyle(context.draft, module, options(context)));
  },
};

export const hairStyleUpdateAction: ActionDefinition<
  { styleId: string; name?: string; key?: string; targets?: SemanticTargetRef[]; additionalDetails?: string },
  HairActionData
> = {
  id: "hair.style.update",
  description: "Update exact hairstyle metadata, semantic targets, or authored details without patching source/properties/components.",
  inputSchema: {
    type: "object",
    required: ["styleId"],
    additionalProperties: false,
    properties: {
      styleId: { type: "string", minLength: 1 },
      name: { type: "string" },
      key: { type: "string" },
      targets: { type: "array", items: semanticTargetSchema },
      additionalDetails: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    const { styleId, ...patch } = input;
    return normalizeResult(
      context,
      updatePromptHairStyle(context.draft, module, styleId, patch as HairStyleUpdatePatch, options(context)),
    );
  },
};

export const hairStyleDuplicateAction: ActionDefinition<{ styleId: string }, HairActionData> = {
  id: "hair.style.duplicate",
  description: "Duplicate one exact hairstyle with a new stable style ID/key and remapped nested component IDs.",
  inputSchema: {
    type: "object",
    required: ["styleId"],
    additionalProperties: false,
    properties: { styleId: { type: "string", minLength: 1 } },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(context, duplicatePromptHairStyle(context.draft, module, input.styleId, options(context)));
  },
};

export const hairStyleDeleteAction: ActionDefinition<{ styleId: string }, HairActionData> = {
  id: "hair.style.delete",
  description: "Delete one exact hairstyle by stable ID without retargeting external references.",
  inputSchema: {
    type: "object",
    required: ["styleId"],
    additionalProperties: false,
    properties: { styleId: { type: "string", minLength: 1 } },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(context, deletePromptHairStyle(context.draft, module, input.styleId));
  },
};

export const hairStyleSetSourceAction: ActionDefinition<
  { styleId: string; source: HairStyleSource },
  HairActionData
> = {
  id: "hair.style.setSource",
  description: "Set one hairstyle to defined or exact-reference source mode using explicit runtime reference sources.",
  inputSchema: {
    type: "object",
    required: ["styleId", "source"],
    additionalProperties: false,
    properties: {
      styleId: { type: "string", minLength: 1 },
      source: {
        type: "object",
        required: ["mode"],
        additionalProperties: false,
        properties: {
          mode: { type: "string", enum: ["defined", "reference"] },
          reference: hairReferenceSchema,
          hairHint: { type: "string" },
        },
      },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(context, setPromptHairStyleSource(context.draft, module, input.styleId, input.source, options(context)));
  },
};

export const hairStyleSetPropertyAction: ActionDefinition<
  { styleId: string; propertyId: string; state: HairPropertyState },
  HairActionData
> = {
  id: "hair.style.setProperty",
  description: "Set one typed base-hair property state on an exact hairstyle and detach its active preset.",
  inputSchema: {
    type: "object",
    required: ["styleId", "propertyId", "state"],
    additionalProperties: false,
    properties: {
      styleId: { type: "string", minLength: 1 },
      propertyId: { type: "string", minLength: 1 },
      state: propertyStateSchema,
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(context, setPromptHairStyleProperty(context.draft, module, input.styleId, input.propertyId, input.state, options(context)));
  },
};

export const hairStyleApplyPresetAction: ActionDefinition<
  { styleId: string; presetId: string },
  HairActionData
> = {
  id: "hair.style.applyPreset",
  description: "Apply or clear one Hair recipe while preserving source/targets and allocating fresh component identities.",
  inputSchema: {
    type: "object",
    required: ["styleId", "presetId"],
    additionalProperties: false,
    properties: {
      styleId: { type: "string", minLength: 1 },
      presetId: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(context, applyPromptHairStylePreset(context.draft, module, input.styleId, input.presetId, options(context)));
  },
};

export const hairComponentCreateAction: ActionDefinition<
  { styleId: string; choice: HairComponentCreateChoice },
  HairActionData
> = {
  id: "hair.component.create",
  description: "Create one Hair component from an exact catalog type, starter recipe, or custom choice.",
  inputSchema: {
    type: "object",
    required: ["styleId", "choice"],
    additionalProperties: false,
    properties: {
      styleId: { type: "string", minLength: 1 },
      choice: {
        type: "object",
        required: ["kind"],
        additionalProperties: false,
        properties: {
          kind: { type: "string", enum: ["type", "starter", "custom"] },
          type: { type: "string", enum: HAIR_COMPONENT_TYPES },
          starterId: { type: "string" },
        },
      },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(context, createPromptHairComponent(context.draft, module, input.styleId, input.choice, options(context)));
  },
};

export const hairComponentUpdateAction: ActionDefinition<
  { styleId: string; componentId: string; name?: string; key?: string; type?: HairComponentType; customType?: string; additionalDetails?: string },
  HairActionData
> = {
  id: "hair.component.update",
  description: "Update exact Hair component metadata/type; type changes reset component properties like the Expert UI.",
  inputSchema: {
    type: "object",
    required: ["styleId", "componentId"],
    additionalProperties: false,
    properties: {
      styleId: { type: "string", minLength: 1 },
      componentId: { type: "string", minLength: 1 },
      name: { type: "string" },
      key: { type: "string" },
      type: { type: "string", enum: HAIR_COMPONENT_TYPES },
      customType: { type: "string" },
      additionalDetails: { type: "string" },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    const { styleId, componentId, ...patch } = input;
    return normalizeResult(context, updatePromptHairComponent(context.draft, module, styleId, componentId, patch as HairComponentUpdatePatch));
  },
};

export const hairComponentSetPropertyAction: ActionDefinition<
  { styleId: string; componentId: string; propertyId: string; state: HairPropertyState },
  HairActionData
> = {
  id: "hair.component.setProperty",
  description: "Set one typed property declared by an exact Hair component type and detach the owning style preset.",
  inputSchema: {
    type: "object",
    required: ["styleId", "componentId", "propertyId", "state"],
    additionalProperties: false,
    properties: {
      styleId: { type: "string", minLength: 1 },
      componentId: { type: "string", minLength: 1 },
      propertyId: { type: "string", minLength: 1 },
      state: propertyStateSchema,
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(context, setPromptHairComponentProperty(context.draft, module, input.styleId, input.componentId, input.propertyId, input.state, options(context)));
  },
};

export const hairComponentDuplicateAction: ActionDefinition<
  { styleId: string; componentId: string },
  HairActionData
> = {
  id: "hair.component.duplicate",
  description: "Duplicate one exact Hair component with a new stable ID and unique sibling key.",
  inputSchema: {
    type: "object",
    required: ["styleId", "componentId"],
    additionalProperties: false,
    properties: {
      styleId: { type: "string", minLength: 1 },
      componentId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(context, duplicatePromptHairComponent(context.draft, module, input.styleId, input.componentId, options(context)));
  },
};

export const hairComponentDeleteAction: ActionDefinition<
  { styleId: string; componentId: string },
  HairActionData
> = {
  id: "hair.component.delete",
  description: "Delete one exact Hair component from its exact owning hairstyle.",
  inputSchema: {
    type: "object",
    required: ["styleId", "componentId"],
    additionalProperties: false,
    properties: {
      styleId: { type: "string", minLength: 1 },
      componentId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const module = resolveModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(context, deletePromptHairComponent(context.draft, module, input.styleId, input.componentId));
  },
};

export const hairActions = [
  hairStyleCreateAction,
  hairStyleUpdateAction,
  hairStyleDuplicateAction,
  hairStyleDeleteAction,
  hairStyleSetSourceAction,
  hairStyleSetPropertyAction,
  hairStyleApplyPresetAction,
  hairComponentCreateAction,
  hairComponentUpdateAction,
  hairComponentSetPropertyAction,
  hairComponentDuplicateAction,
  hairComponentDeleteAction,
] as const;

export function registerHairActions(registry: ActionRegistry) {
  hairActions.forEach((action) => registry.register(action));
  return registry;
}
