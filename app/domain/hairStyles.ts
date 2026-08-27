import type { PromptDraftState } from "../modules/promptDraft.types";
import type { ModuleValues, PromptKeyModule, SemanticTargetRef } from "../modules/types";
import type {
  HairComponent,
  HairComponentType,
  HairPropertyState,
  HairReferenceRef,
  HairStyle,
  HairStyleSource,
} from "../modules/hair.types";
import {
  hairBasePropertyIds,
  hairComponentStarterMap,
  hairComponentTypeMap,
  hairPresetRecipes,
  hairPropertyDefinitions,
} from "../modules/hair.catalog";
import { normalizeHairStyles } from "../utils/compileHair";
import {
  createUniqueHairEntityKey,
} from "../utils/hairVariables";
import { createDefaultModuleValues } from "../utils/compileModules";
import {
  firstAvailableSubjectAssignmentTarget,
  setSubjectAssignmentTargets,
} from "./subjectAssignmentTargets";
import {
  domainFailure,
  domainSuccess,
  type DomainResult,
} from "./types";

export type HairReferenceCatalogSource = {
  reference: HairReferenceRef;
  disabled?: boolean;
};

export type HairStyleMutationOptions = {
  createStyleId?: () => string;
  createComponentId?: () => string;
  subjectSources?: readonly import("../utils/semanticReferenceCatalog").SemanticReferenceCatalogSource[];
  referenceSources?: readonly HairReferenceCatalogSource[];
};

export type HairStyleUpdatePatch = {
  name?: string;
  key?: string;
  targets?: SemanticTargetRef[];
  additionalDetails?: string;
};

export type HairComponentUpdatePatch = {
  name?: string;
  key?: string;
  type?: HairComponentType;
  customType?: string;
  additionalDetails?: string;
};

export type HairComponentCreateChoice =
  | { kind: "type"; type: HairComponentType }
  | { kind: "starter"; starterId: string }
  | { kind: "custom" };

export type HairStyleMutation = {
  draft: PromptDraftState;
  moduleValues: ModuleValues;
  styles: HairStyle[];
  style?: HairStyle;
  component?: HairComponent;
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

function validateHairTarget(
  draft: PromptDraftState,
  module: PromptKeyModule,
): DomainResult<ModuleValues> {
  if (module.key !== "hair") {
    return domainFailure({
      code: "hair_module_invalid",
      details: { moduleKey: module.key },
    });
  }

  if (!draft.selectedModuleKeys.includes(module.key)) {
    return domainFailure({
      code: "module_not_active",
      details: { moduleKey: module.key },
    });
  }

  const field = module.fields.hairStyles;
  if (!field || field.type !== "hairStyles") {
    return domainFailure({
      code: "hair_styles_field_missing",
      details: { moduleKey: module.key, fieldId: "hairStyles" },
    });
  }

  return domainSuccess(currentModuleValues(draft, module));
}

function validateStableIdentities(styles: readonly HairStyle[]): DomainResult<true> {
  const styleIds = new Set<string>();

  for (const style of styles) {
    const styleId = String(style.id || "").trim();
    if (!styleId || styleIds.has(styleId)) {
      return domainFailure({
        code: "hair_style_identity_conflict",
        details: { styleId },
      });
    }
    styleIds.add(styleId);

    const componentIds = new Set<string>();
    for (const component of style.components) {
      const componentId = String(component.id || "").trim();
      if (!componentId || componentIds.has(componentId)) {
        return domainFailure({
          code: "hair_component_identity_conflict",
          details: { styleId, componentId },
        });
      }
      componentIds.add(componentId);
    }
  }

  return domainSuccess(true);
}

function readStyles(values: ModuleValues): DomainResult<HairStyle[]> {
  const styles = normalizeHairStyles(values.hairStyles);
  const identities = validateStableIdentities(styles);
  if (!identities.ok) return identities;
  return domainSuccess(styles);
}

function styleIndexById(styles: readonly HairStyle[], styleId: string) {
  return styles.findIndex((style) => style.id === styleId);
}

function componentIndexById(style: HairStyle, componentId: string) {
  return style.components.findIndex((component) => component.id === componentId);
}

function styleNotFound(styleId: string) {
  return domainFailure({
    code: "hair_style_not_found",
    path: "styleId",
    details: { styleId },
  });
}

function componentNotFound(styleId: string, componentId: string) {
  return domainFailure({
    code: "hair_component_not_found",
    path: "componentId",
    details: { styleId, componentId },
  });
}

function withStyles(
  draft: PromptDraftState,
  module: PromptKeyModule,
  values: ModuleValues,
  styles: readonly HairStyle[],
  style?: HairStyle,
  component?: HairComponent,
): DomainResult<HairStyleMutation> {
  const nextStyles = cloneValue(styles);
  const nextModuleValues: ModuleValues = {
    ...cloneValue(values),
    hairStyles: nextStyles,
  };
  const nextDraft = cloneValue(draft);
  nextDraft.moduleValues = {
    ...nextDraft.moduleValues,
    [module.key]: cloneValue(nextModuleValues),
  };

  return domainSuccess({
    draft: nextDraft,
    moduleValues: cloneValue(nextModuleValues),
    styles: cloneValue(nextStyles),
    style: style ? cloneValue(style) : undefined,
    component: component ? cloneValue(component) : undefined,
  });
}

function referenceIdentity(reference: HairReferenceRef) {
  const variableId = String(reference.variableId || "").trim();
  if (variableId) return `${reference.source || "unknown"}:${variableId}`;
  return `token:${String(reference.token || "").trim()}`;
}

function normalizeReference(reference: HairReferenceRef): HairReferenceRef {
  return {
    ...(reference.variableId ? { variableId: String(reference.variableId) } : {}),
    token: String(reference.token || "").trim(),
    ...(reference.label !== undefined ? { label: String(reference.label) } : {}),
    ...(reference.source === "user" || reference.source === "system"
      ? { source: reference.source }
      : {}),
  };
}

function isMainReference(reference: HairReferenceRef) {
  return String(reference.token || "").trim() === "{reference}" &&
    (!reference.variableId || reference.source === "system");
}

function resolveHairReference(
  requested: HairReferenceRef,
  current: HairReferenceRef | undefined,
  sources: readonly HairReferenceCatalogSource[] = [],
): DomainResult<HairReferenceRef> {
  const normalized = normalizeReference(requested);
  if (!normalized.token) {
    return domainFailure({
      code: "hair_reference_invalid",
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
    code: source
      ? "hair_reference_unavailable"
      : "hair_reference_missing",
    path: "reference",
    details: { identity },
  });
}

function validatePropertyState(
  propertyId: string,
  state: HairPropertyState,
  currentState: HairPropertyState | undefined,
  referenceSources: readonly HairReferenceCatalogSource[] = [],
): DomainResult<HairPropertyState> {
  const definition = hairPropertyDefinitions[propertyId];
  if (!definition) {
    return domainFailure({
      code: "hair_property_not_found",
      path: "propertyId",
      details: { propertyId },
    });
  }

  if (state.mode === "inherit") return domainSuccess({ mode: "inherit" });

  if (state.mode === "option") {
    if (!definition.options.some((option) => option.value === state.value)) {
      return domainFailure({
        code: "hair_property_invalid_option",
        path: "state.value",
        details: { propertyId, value: state.value },
      });
    }
    return domainSuccess({ mode: "option", value: state.value });
  }

  if (state.mode === "custom") {
    if (!definition.allowCustom) {
      return domainFailure({
        code: "hair_property_custom_unsupported",
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
          code: "hair_property_absent_unsupported",
          path: "state.mode",
          details: { propertyId },
        });
  }

  if (state.mode === "reference") {
    if (!definition.allowReference) {
      return domainFailure({
        code: "hair_property_reference_unsupported",
        path: "state.mode",
        details: { propertyId },
      });
    }

    if (!state.reference) return domainSuccess({ mode: "reference" });
    const currentReference =
      currentState?.mode === "reference" ? currentState.reference : undefined;
    const reference = resolveHairReference(
      state.reference,
      currentReference,
      referenceSources,
    );
    if (!reference.ok) return reference;
    return domainSuccess({ mode: "reference", reference: reference.value });
  }

  return domainFailure({
    code: "hair_property_invalid_state",
    path: "state.mode",
    details: { propertyId },
  });
}

function componentFromChoice(
  choice: HairComponentCreateChoice,
  existingKeys: Iterable<string>,
  createComponentId: () => string,
): DomainResult<HairComponent> {
  if (choice.kind === "custom") {
    return domainSuccess({
      id: createComponentId(),
      key: createUniqueHairEntityKey("customComponent", existingKeys, "component"),
      name: "Custom Hair Component",
      type: "custom",
      customType: "",
      properties: {},
      additionalDetails: "",
    });
  }

  if (choice.kind === "starter") {
    const starter = hairComponentStarterMap.get(choice.starterId);
    if (!starter) {
      return domainFailure({
        code: "hair_component_starter_not_found",
        path: "starterId",
        details: { starterId: choice.starterId },
      });
    }
    return domainSuccess({
      id: createComponentId(),
      key: createUniqueHairEntityKey(
        starter.type || starter.label,
        existingKeys,
        "component",
      ),
      name: starter.label,
      type: starter.type,
      properties: cloneValue(starter.properties || {}),
      additionalDetails: "",
    });
  }

  const definition = hairComponentTypeMap.get(choice.type);
  if (!definition) {
    return domainFailure({
      code: "hair_component_type_not_found",
      path: "type",
      details: { type: choice.type },
    });
  }
  return domainSuccess({
    id: createComponentId(),
    key: createUniqueHairEntityKey(choice.type, existingKeys, "component"),
    name: definition.label,
    type: choice.type,
    ...(choice.type === "custom" ? { customType: "" } : {}),
    properties: {},
    additionalDetails: "",
  });
}

export function createPromptHairStyle(
  draft: PromptDraftState,
  module: PromptKeyModule,
  options: HairStyleMutationOptions = {},
): DomainResult<HairStyleMutation> {
  const target = validateHairTarget(draft, module);
  if (!target.ok) return target;
  const stylesResult = readStyles(target.value);
  if (!stylesResult.ok) return stylesResult;
  const styles = stylesResult.value;
  const index = styles.length + 1;
  const style: HairStyle = {
    id: (options.createStyleId || (() => randomId("hair-style")))(),
    key: createUniqueHairEntityKey(
      `style${index}`,
      styles.map((candidate) => candidate.key),
      "style",
    ),
    name: `Hairstyle ${index}`,
    targets: firstAvailableSubjectAssignmentTarget({
      sources: options.subjectSources,
    })
      ? [firstAvailableSubjectAssignmentTarget({ sources: options.subjectSources })!]
      : [],
    source: { mode: "defined" },
    properties: {},
    components: [],
    additionalDetails: "",
  };

  if (styles.some((candidate) => candidate.id === style.id)) {
    return domainFailure({
      code: "hair_style_identity_conflict",
      details: { styleId: style.id },
    });
  }

  return withStyles(draft, module, target.value, [...styles, style], style);
}

export function updatePromptHairStyle(
  draft: PromptDraftState,
  module: PromptKeyModule,
  styleId: string,
  patch: HairStyleUpdatePatch,
  options: HairStyleMutationOptions = {},
): DomainResult<HairStyleMutation> {
  const target = validateHairTarget(draft, module);
  if (!target.ok) return target;
  const stylesResult = readStyles(target.value);
  if (!stylesResult.ok) return stylesResult;
  const styles = stylesResult.value;
  const index = styleIndexById(styles, styleId);
  if (index < 0) return styleNotFound(styleId);

  const current = cloneValue(styles[index]);
  const next = cloneValue(current);

  if (patch.name !== undefined) next.name = String(patch.name);
  if (patch.additionalDetails !== undefined) {
    next.additionalDetails = String(patch.additionalDetails);
  }
  if (patch.key !== undefined) {
    next.key = createUniqueHairEntityKey(
      String(patch.key),
      styles.filter((_, itemIndex) => itemIndex !== index).map((style) => style.key),
      current.key || `style${index + 1}`,
    );
  }
  if (patch.targets !== undefined) {
    const targets = setSubjectAssignmentTargets(
      current.targets,
      patch.targets,
      { sources: options.subjectSources },
    );
    if (!targets.ok) return targets;
    next.targets = targets.value;
  }

  const updated = cloneValue(styles);
  updated[index] = next;
  return withStyles(draft, module, target.value, updated, next);
}

export function deletePromptHairStyle(
  draft: PromptDraftState,
  module: PromptKeyModule,
  styleId: string,
): DomainResult<HairStyleMutation> {
  const target = validateHairTarget(draft, module);
  if (!target.ok) return target;
  const stylesResult = readStyles(target.value);
  if (!stylesResult.ok) return stylesResult;
  const styles = stylesResult.value;
  const index = styleIndexById(styles, styleId);
  if (index < 0) return styleNotFound(styleId);
  return withStyles(
    draft,
    module,
    target.value,
    styles.filter((_, itemIndex) => itemIndex !== index),
    cloneValue(styles[index]),
  );
}

export function duplicatePromptHairStyle(
  draft: PromptDraftState,
  module: PromptKeyModule,
  styleId: string,
  options: HairStyleMutationOptions = {},
): DomainResult<HairStyleMutation> {
  const target = validateHairTarget(draft, module);
  if (!target.ok) return target;
  const stylesResult = readStyles(target.value);
  if (!stylesResult.ok) return stylesResult;
  const styles = stylesResult.value;
  const index = styleIndexById(styles, styleId);
  if (index < 0) return styleNotFound(styleId);
  const source = styles[index];
  const createComponentId = options.createComponentId || (() => randomId("hair-component"));
  const duplicate: HairStyle = {
    ...cloneValue(source),
    id: (options.createStyleId || (() => randomId("hair-style")))(),
    key: createUniqueHairEntityKey(
      `${source.key}Copy`,
      styles.map((style) => style.key),
      "style",
    ),
    name: `${source.name || "Hairstyle"} Copy`,
    presetId: undefined,
    components: source.components.map((component) => ({
      ...cloneValue(component),
      id: createComponentId(),
    })),
  };

  if (styles.some((style) => style.id === duplicate.id)) {
    return domainFailure({
      code: "hair_style_identity_conflict",
      details: { styleId: duplicate.id },
    });
  }
  const componentIds = new Set<string>();
  for (const component of duplicate.components) {
    if (componentIds.has(component.id)) {
      return domainFailure({
        code: "hair_component_identity_conflict",
        details: { styleId: duplicate.id, componentId: component.id },
      });
    }
    componentIds.add(component.id);
  }

  return withStyles(
    draft,
    module,
    target.value,
    [...styles, duplicate],
    duplicate,
  );
}

export function setPromptHairStyleSource(
  draft: PromptDraftState,
  module: PromptKeyModule,
  styleId: string,
  source: HairStyleSource,
  options: HairStyleMutationOptions = {},
): DomainResult<HairStyleMutation> {
  const target = validateHairTarget(draft, module);
  if (!target.ok) return target;
  const stylesResult = readStyles(target.value);
  if (!stylesResult.ok) return stylesResult;
  const styles = stylesResult.value;
  const index = styleIndexById(styles, styleId);
  if (index < 0) return styleNotFound(styleId);
  const current = styles[index];

  let nextSource: HairStyleSource;
  if (source.mode === "defined") {
    nextSource = { mode: "defined" };
  } else {
    const currentReference =
      current.source.mode === "reference" ? current.source.reference : undefined;
    const reference = resolveHairReference(
      source.reference,
      currentReference,
      options.referenceSources,
    );
    if (!reference.ok) return reference;
    nextSource = {
      mode: "reference",
      reference: reference.value,
      ...(source.hairHint !== undefined
        ? { hairHint: String(source.hairHint) }
        : {}),
    };
  }

  const next = { ...cloneValue(current), source: nextSource };
  const updated = cloneValue(styles);
  updated[index] = next;
  return withStyles(draft, module, target.value, updated, next);
}

export function setPromptHairStyleProperty(
  draft: PromptDraftState,
  module: PromptKeyModule,
  styleId: string,
  propertyId: string,
  state: HairPropertyState,
  options: HairStyleMutationOptions = {},
): DomainResult<HairStyleMutation> {
  if (!hairBasePropertyIds.includes(propertyId)) {
    return domainFailure({
      code: "hair_style_property_unsupported",
      path: "propertyId",
      details: { propertyId },
    });
  }
  const target = validateHairTarget(draft, module);
  if (!target.ok) return target;
  const stylesResult = readStyles(target.value);
  if (!stylesResult.ok) return stylesResult;
  const styles = stylesResult.value;
  const index = styleIndexById(styles, styleId);
  if (index < 0) return styleNotFound(styleId);
  const current = styles[index];
  const validated = validatePropertyState(
    propertyId,
    state,
    current.properties[propertyId],
    options.referenceSources,
  );
  if (!validated.ok) return validated;

  const next: HairStyle = {
    ...cloneValue(current),
    presetId: undefined,
    properties: {
      ...cloneValue(current.properties),
      [propertyId]: cloneValue(validated.value),
    },
  };
  const updated = cloneValue(styles);
  updated[index] = next;
  return withStyles(draft, module, target.value, updated, next);
}

export function applyPromptHairStylePreset(
  draft: PromptDraftState,
  module: PromptKeyModule,
  styleId: string,
  presetId: string,
  options: HairStyleMutationOptions = {},
): DomainResult<HairStyleMutation> {
  const target = validateHairTarget(draft, module);
  if (!target.ok) return target;
  const stylesResult = readStyles(target.value);
  if (!stylesResult.ok) return stylesResult;
  const styles = stylesResult.value;
  const index = styleIndexById(styles, styleId);
  if (index < 0) return styleNotFound(styleId);
  const current = styles[index];

  if (!presetId) {
    const next = { ...cloneValue(current), presetId: undefined };
    const updated = cloneValue(styles);
    updated[index] = next;
    return withStyles(draft, module, target.value, updated, next);
  }

  const recipe = hairPresetRecipes.find((preset) => preset.id === presetId);
  if (!recipe) {
    return domainFailure({
      code: "hair_preset_not_found",
      path: "presetId",
      details: { presetId },
    });
  }

  const createComponentId = options.createComponentId || (() => randomId("hair-component"));
  const usedComponentKeys = new Set<string>();
  const componentIds = new Set<string>();
  const components: HairComponent[] = [];

  for (const [componentIndex, recipeComponent] of (recipe.components || []).entries()) {
    const definition = hairComponentTypeMap.get(recipeComponent.type);
    const key = createUniqueHairEntityKey(
      recipeComponent.key || recipeComponent.type,
      usedComponentKeys,
      `component${componentIndex + 1}`,
    );
    usedComponentKeys.add(key);
    const component: HairComponent = {
      id: createComponentId(),
      key,
      name:
        recipeComponent.name ||
        definition?.label ||
        recipeComponent.customType ||
        recipeComponent.type,
      type: recipeComponent.type,
      ...(recipeComponent.customType !== undefined
        ? { customType: recipeComponent.customType }
        : {}),
      properties: cloneValue(recipeComponent.properties || {}),
      additionalDetails: recipeComponent.additionalDetails || "",
    };
    if (componentIds.has(component.id)) {
      return domainFailure({
        code: "hair_component_identity_conflict",
        details: { styleId, componentId: component.id },
      });
    }
    componentIds.add(component.id);
    components.push(component);
  }

  const hasDefaultName = /^Hairstyle \d+$/i.test(current.name?.trim() || "");
  const nextName = hasDefaultName
    ? recipe.name || recipe.label
    : current.name?.trim() || recipe.name || recipe.label;
  const nextKey = hasDefaultName
    ? createUniqueHairEntityKey(
        nextName,
        styles.filter((_, itemIndex) => itemIndex !== index).map((style) => style.key),
        current.key,
      )
    : current.key;

  const next: HairStyle = {
    ...cloneValue(current),
    presetId: recipe.id,
    name: nextName,
    key: nextKey,
    properties: cloneValue(recipe.properties || {}),
    components,
    additionalDetails: recipe.additionalDetails || current.additionalDetails || "",
  };
  const updated = cloneValue(styles);
  updated[index] = next;
  return withStyles(draft, module, target.value, updated, next);
}

export function createPromptHairComponent(
  draft: PromptDraftState,
  module: PromptKeyModule,
  styleId: string,
  choice: HairComponentCreateChoice,
  options: HairStyleMutationOptions = {},
): DomainResult<HairStyleMutation> {
  const target = validateHairTarget(draft, module);
  if (!target.ok) return target;
  const stylesResult = readStyles(target.value);
  if (!stylesResult.ok) return stylesResult;
  const styles = stylesResult.value;
  const styleIndex = styleIndexById(styles, styleId);
  if (styleIndex < 0) return styleNotFound(styleId);
  const style = styles[styleIndex];
  const componentResult = componentFromChoice(
    choice,
    style.components.map((component) => component.key),
    options.createComponentId || (() => randomId("hair-component")),
  );
  if (!componentResult.ok) return componentResult;
  const component = componentResult.value;
  if (style.components.some((candidate) => candidate.id === component.id)) {
    return domainFailure({
      code: "hair_component_identity_conflict",
      details: { styleId, componentId: component.id },
    });
  }

  const next: HairStyle = {
    ...cloneValue(style),
    presetId: undefined,
    components: [...cloneValue(style.components), component],
  };
  const updated = cloneValue(styles);
  updated[styleIndex] = next;
  return withStyles(draft, module, target.value, updated, next, component);
}

export function updatePromptHairComponent(
  draft: PromptDraftState,
  module: PromptKeyModule,
  styleId: string,
  componentId: string,
  patch: HairComponentUpdatePatch,
): DomainResult<HairStyleMutation> {
  const target = validateHairTarget(draft, module);
  if (!target.ok) return target;
  const stylesResult = readStyles(target.value);
  if (!stylesResult.ok) return stylesResult;
  const styles = stylesResult.value;
  const styleIndex = styleIndexById(styles, styleId);
  if (styleIndex < 0) return styleNotFound(styleId);
  const style = styles[styleIndex];
  const componentIndex = componentIndexById(style, componentId);
  if (componentIndex < 0) return componentNotFound(styleId, componentId);
  const current = style.components[componentIndex];
  let next = cloneValue(current);

  if (patch.type !== undefined) {
    const definition = hairComponentTypeMap.get(patch.type);
    if (!definition) {
      return domainFailure({
        code: "hair_component_type_not_found",
        path: "type",
        details: { type: patch.type },
      });
    }
    next = {
      ...next,
      type: patch.type,
      name: definition.label,
      customType: patch.type === "custom" ? current.customType || "" : undefined,
      properties: {},
    };
  }

  if (patch.name !== undefined) next.name = String(patch.name);
  if (patch.additionalDetails !== undefined) {
    next.additionalDetails = String(patch.additionalDetails);
  }
  if (patch.key !== undefined) {
    next.key = createUniqueHairEntityKey(
      String(patch.key),
      style.components
        .filter((_, itemIndex) => itemIndex !== componentIndex)
        .map((component) => component.key),
      current.key || `component${componentIndex + 1}`,
    );
  }
  if (patch.customType !== undefined) {
    if (next.type !== "custom") {
      return domainFailure({
        code: "hair_component_custom_type_inactive",
        path: "customType",
        details: { componentId },
      });
    }
    next.customType = String(patch.customType);
  }

  const nextComponents = cloneValue(style.components);
  nextComponents[componentIndex] = next;
  const nextStyle: HairStyle = {
    ...cloneValue(style),
    presetId: undefined,
    components: nextComponents,
  };
  const updated = cloneValue(styles);
  updated[styleIndex] = nextStyle;
  return withStyles(draft, module, target.value, updated, nextStyle, next);
}

export function setPromptHairComponentProperty(
  draft: PromptDraftState,
  module: PromptKeyModule,
  styleId: string,
  componentId: string,
  propertyId: string,
  state: HairPropertyState,
  options: HairStyleMutationOptions = {},
): DomainResult<HairStyleMutation> {
  const target = validateHairTarget(draft, module);
  if (!target.ok) return target;
  const stylesResult = readStyles(target.value);
  if (!stylesResult.ok) return stylesResult;
  const styles = stylesResult.value;
  const styleIndex = styleIndexById(styles, styleId);
  if (styleIndex < 0) return styleNotFound(styleId);
  const style = styles[styleIndex];
  const componentIndex = componentIndexById(style, componentId);
  if (componentIndex < 0) return componentNotFound(styleId, componentId);
  const current = style.components[componentIndex];
  const definition = hairComponentTypeMap.get(current.type);
  if (!definition?.propertyIds.includes(propertyId)) {
    return domainFailure({
      code: "hair_component_property_unsupported",
      path: "propertyId",
      details: { componentId, propertyId, type: current.type },
    });
  }
  const validated = validatePropertyState(
    propertyId,
    state,
    current.properties[propertyId],
    options.referenceSources,
  );
  if (!validated.ok) return validated;

  const nextComponent: HairComponent = {
    ...cloneValue(current),
    properties: {
      ...cloneValue(current.properties),
      [propertyId]: cloneValue(validated.value),
    },
  };
  const nextComponents = cloneValue(style.components);
  nextComponents[componentIndex] = nextComponent;
  const nextStyle: HairStyle = {
    ...cloneValue(style),
    presetId: undefined,
    components: nextComponents,
  };
  const updated = cloneValue(styles);
  updated[styleIndex] = nextStyle;
  return withStyles(
    draft,
    module,
    target.value,
    updated,
    nextStyle,
    nextComponent,
  );
}

export function duplicatePromptHairComponent(
  draft: PromptDraftState,
  module: PromptKeyModule,
  styleId: string,
  componentId: string,
  options: HairStyleMutationOptions = {},
): DomainResult<HairStyleMutation> {
  const target = validateHairTarget(draft, module);
  if (!target.ok) return target;
  const stylesResult = readStyles(target.value);
  if (!stylesResult.ok) return stylesResult;
  const styles = stylesResult.value;
  const styleIndex = styleIndexById(styles, styleId);
  if (styleIndex < 0) return styleNotFound(styleId);
  const style = styles[styleIndex];
  const componentIndex = componentIndexById(style, componentId);
  if (componentIndex < 0) return componentNotFound(styleId, componentId);
  const source = style.components[componentIndex];
  const duplicate: HairComponent = {
    ...cloneValue(source),
    id: (options.createComponentId || (() => randomId("hair-component")))(),
    key: createUniqueHairEntityKey(
      source.key,
      style.components.map((component) => component.key),
      "component",
    ),
    name: `${source.name || source.type} Copy`,
  };
  if (style.components.some((component) => component.id === duplicate.id)) {
    return domainFailure({
      code: "hair_component_identity_conflict",
      details: { styleId, componentId: duplicate.id },
    });
  }
  const nextStyle: HairStyle = {
    ...cloneValue(style),
    presetId: undefined,
    components: [...cloneValue(style.components), duplicate],
  };
  const updated = cloneValue(styles);
  updated[styleIndex] = nextStyle;
  return withStyles(draft, module, target.value, updated, nextStyle, duplicate);
}

export function deletePromptHairComponent(
  draft: PromptDraftState,
  module: PromptKeyModule,
  styleId: string,
  componentId: string,
): DomainResult<HairStyleMutation> {
  const target = validateHairTarget(draft, module);
  if (!target.ok) return target;
  const stylesResult = readStyles(target.value);
  if (!stylesResult.ok) return stylesResult;
  const styles = stylesResult.value;
  const styleIndex = styleIndexById(styles, styleId);
  if (styleIndex < 0) return styleNotFound(styleId);
  const style = styles[styleIndex];
  const componentIndex = componentIndexById(style, componentId);
  if (componentIndex < 0) return componentNotFound(styleId, componentId);
  const removed = cloneValue(style.components[componentIndex]);
  const nextStyle: HairStyle = {
    ...cloneValue(style),
    presetId: undefined,
    components: style.components.filter((_, index) => index !== componentIndex),
  };
  const updated = cloneValue(styles);
  updated[styleIndex] = nextStyle;
  return withStyles(draft, module, target.value, updated, nextStyle, removed);
}
