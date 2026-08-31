import type { PromptDraftState } from "../modules/promptDraft.types";
import type {
  ModuleValues,
  PromptKeyModule,
  PromptVariable,
} from "../modules/types";
import { getModuleEntityConfig } from "../modules/entityContracts";
import { compileBackgroundModule } from "../utils/compileBackground";
import { compileCameraModule } from "../utils/compileCamera";
import { compileEffectsModule } from "../utils/compileEffects";
import { compileExpressionModule } from "../utils/compileExpression";
import { compileFormModule } from "../utils/compileForm";
import { compileLightingModule } from "../utils/compileLighting";
import {
  compileModule,
  createDefaultModuleValues,
} from "../utils/compileModules";
import { compilePoseModule } from "../utils/compilePose";
import type {
  ModuleOutputMap,
  ModuleOutputValue,
  PromptOutputFormat,
} from "../utils/compilePromptCore";
import {
  compilePromptOutputPure,
  type UserVariableOwnership,
} from "../utils/compilePromptPure";
import { compileSceneModule, type SceneCompileIssue } from "../utils/compileScene";
import {
  compileSceneResourceModule,
  type SceneResourceScalarCompiler,
} from "../utils/compileSceneResource";
import { compileTextureModule } from "../utils/compileTexture";
import { getSceneEntities } from "../utils/scene";
import { resolveTypographyTextVariableReferences } from "../utils/typography";
import {
  validatePromptSettings,
  type PromptValidationIssue,
} from "../utils/promptValidation";

export type PromptReadValidation = {
  valid: boolean;
  hasErrors: boolean;
  issues: PromptValidationIssue[];
  outputs: ModuleOutputMap;
};

export type PromptReadCompile = {
  format: PromptOutputFormat;
  output: string;
};

type PromptReadBuild = {
  modules: PromptKeyModule[];
  moduleValues: Record<string, ModuleValues>;
  outputs: ModuleOutputMap;
  moduleIssues: PromptValidationIssue[];
};

function cloneValue<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function activeModules(
  draft: PromptDraftState,
  modules: readonly PromptKeyModule[],
) {
  const selectedKeys = new Set(draft.selectedModuleKeys);
  return modules.filter((module) => selectedKeys.has(module.key));
}

function valuesForModule(draft: PromptDraftState, module: PromptKeyModule) {
  return {
    ...createDefaultModuleValues(module),
    ...cloneValue(draft.moduleValues[module.key] || {}),
  } as ModuleValues;
}

function effectiveModuleValues(
  draft: PromptDraftState,
  modules: readonly PromptKeyModule[],
) {
  return Object.fromEntries(
    modules.map((module) => [module.key, valuesForModule(draft, module)]),
  );
}

function overrideFieldId(module: PromptKeyModule) {
  return (
    module.compile?.overrideField ||
    Object.values(module.fields).find((field) => field.isOverride)?.id ||
    ""
  );
}

function customOverride(
  draft: PromptDraftState,
  module: PromptKeyModule,
  values: ModuleValues,
) {
  if (!draft.modulePanelStates[module.key]?.isCustomMode) return null;
  const fieldId = overrideFieldId(module);
  if (!fieldId) return null;
  const value = values[fieldId];
  return typeof value === "string" ? value.trim() : "";
}

function compileBaseLikeModule(
  draft: PromptDraftState,
  module: PromptKeyModule,
  values: ModuleValues,
  options: { replaceSource?: boolean } = {},
): ModuleOutputValue {
  const override = customOverride(draft, module, values);
  if (override !== null) return override;

  const fieldId = overrideFieldId(module);
  const effectiveValues = fieldId ? { ...values, [fieldId]: "" } : values;

  if (module.key === "pose") {
    return compilePoseModule(module, effectiveValues, {
      replaceSource: options.replaceSource,
    });
  }

  if (module.key === "expression") {
    return compileExpressionModule(module, effectiveValues, {
      replaceSource: options.replaceSource,
    });
  }

  return compileModule(module, effectiveValues);
}

function referencedEntityIds(
  moduleKey: string,
  modules: readonly PromptKeyModule[],
  moduleValues: Record<string, ModuleValues>,
) {
  const sceneActive = modules.some((module) => module.key === "scene");
  const layoutActive = modules.some((module) => module.key === "layout");
  if (!sceneActive || !layoutActive) return [];

  const seen = new Set<string>();
  return getSceneEntities(moduleValues.scene || {})
    .filter((scene) => scene.enabled !== false)
    .flatMap((scene) => scene.components)
    .filter((ref) => ref.moduleKey === moduleKey)
    .map((ref) => ref.entityId)
    .filter((entityId) => {
      if (!entityId || seen.has(entityId)) return false;
      seen.add(entityId);
      return true;
    });
}

function sceneResourceCompiler(
  moduleKey: string,
): SceneResourceScalarCompiler | undefined {
  if (moduleKey === "background") return compileBackgroundModule;
  if (moduleKey === "effects") return compileEffectsModule;
  if (moduleKey === "lighting") return compileLightingModule;
  if (moduleKey === "texture") return compileTextureModule;
  return undefined;
}

function compileSceneResourceLikeModule(
  draft: PromptDraftState,
  module: PromptKeyModule,
  values: ModuleValues,
  modules: readonly PromptKeyModule[],
  moduleValues: Record<string, ModuleValues>,
) {
  const config = getModuleEntityConfig(module);
  return compileSceneResourceModule(module, values, {
    customMode: Boolean(draft.modulePanelStates[module.key]?.isCustomMode),
    referencedEntityIds: referencedEntityIds(
      module.key,
      modules,
      moduleValues,
    ),
    compileValues: sceneResourceCompiler(module.key),
    preserveEntitiesInCustomMode:
      config?.preserveEntitiesInCustomMode === true,
  });
}

function mapSceneIssue(issue: SceneCompileIssue): PromptValidationIssue {
  return {
    id: issue.id,
    code:
      issue.kind === "component_cardinality"
        ? "scene_component_cardinality_conflict"
        : "scene_missing_component_reference",
    level: "warning",
    moduleKey: "scene",
  };
}

function customOverrideIssue(
  draft: PromptDraftState,
  module: PromptKeyModule,
  values: ModuleValues,
): PromptValidationIssue | null {
  if (!draft.modulePanelStates[module.key]?.isCustomMode) return null;
  const fieldId = overrideFieldId(module);
  if (!fieldId) return null;
  const value = values[fieldId];
  if (typeof value === "string" && value.trim()) return null;

  return {
    id: `${module.key}:custom_override_empty`,
    code: "custom_override_empty",
    level: "error",
    moduleKey: module.key,
  };
}

function isPromptVariable(value: unknown): value is PromptVariable {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const variable = value as Partial<PromptVariable>;
  return (
    typeof variable.id === "string" &&
    typeof variable.key === "string" &&
    typeof variable.value === "string" &&
    typeof variable.enabled === "boolean"
  );
}

function resolveTypographyVariableLinks(
  modules: readonly PromptKeyModule[],
  moduleValues: Record<string, ModuleValues>,
) {
  const typographyActive = modules.some((module) => module.key === "typography");
  const variablesActive = modules.some((module) => module.key === "variables");

  if (!typographyActive || !variablesActive) return;

  const typographyValues = moduleValues.typography;
  const rawVariables = moduleValues.variables?.variables;

  if (!typographyValues || !Array.isArray(rawVariables)) return;

  const variables = rawVariables.filter(isPromptVariable);
  typographyValues.textGroups = resolveTypographyTextVariableReferences(
    typographyValues.textGroups,
    variables,
  );
}

function variableOwnership(
  modules: readonly PromptKeyModule[],
  moduleValues: Record<string, ModuleValues>,
): UserVariableOwnership {
  if (!modules.some((module) => module.key === "variables")) {
    return { hasSubject: false, hasReference: false };
  }

  const rawVariables = moduleValues.variables?.variables;
  const variables = Array.isArray(rawVariables)
    ? rawVariables.filter(isPromptVariable)
    : [];
  const enabledVariables = variables.filter((variable) => {
    return (
      variable.enabled !== false &&
      Boolean(variable.key.trim()) &&
      Boolean(variable.value.trim())
    );
  });

  return {
    hasSubject: enabledVariables.some((variable) => variable.type === "subject"),
    hasReference: enabledVariables.some((variable) => variable.type === "reference"),
  };
}

function promptVariableOwnership(
  readModel: PromptReadBuild,
): UserVariableOwnership {
  return variableOwnership(readModel.modules, readModel.moduleValues);
}

export function buildPromptReadModel(
  draft: PromptDraftState,
  availableModules: readonly PromptKeyModule[],
): PromptReadBuild {
  const modules = activeModules(draft, availableModules);
  const moduleValues = effectiveModuleValues(draft, modules);
  resolveTypographyVariableLinks(modules, moduleValues);
  const ownership = variableOwnership(modules, moduleValues);
  const replaceSource =
    draft.promptSettings.mode === "image_to_image" && !ownership.hasReference;
  const outputs: ModuleOutputMap = {};
  const moduleIssues: PromptValidationIssue[] = [];

  for (const module of modules) {
    const values = moduleValues[module.key] || {};
    const overrideIssue = customOverrideIssue(draft, module, values);
    if (overrideIssue) moduleIssues.push(overrideIssue);

    if (module.key === "scene") {
      const result = compileSceneModule(values, {
        modules: [...modules],
        moduleValues,
        layoutActive: modules.some((candidate) => candidate.key === "layout"),
      });
      outputs[module.key] = result.output;
      moduleIssues.push(...result.issues.map(mapSceneIssue));
      continue;
    }

    if (module.key === "form") {
      outputs[module.key] = compileFormModule(module, values, {
        customMode: Boolean(draft.modulePanelStates[module.key]?.isCustomMode),
        referencedEntityIds: referencedEntityIds(
          module.key,
          modules,
          moduleValues,
        ),
      });
      continue;
    }

    if (module.key === "camera") {
      outputs[module.key] = compileCameraModule(module, values, {
        customMode: Boolean(draft.modulePanelStates[module.key]?.isCustomMode),
        referencedEntityIds: referencedEntityIds(
          module.key,
          modules,
          moduleValues,
        ),
      });
      continue;
    }

    if (
      module.key === "framing" ||
      module.key === "style" ||
      module.key === "background" ||
      module.key === "effects" ||
      module.key === "lighting" ||
      module.key === "texture"
    ) {
      outputs[module.key] = compileSceneResourceLikeModule(
        draft,
        module,
        values,
        modules,
        moduleValues,
      );
      continue;
    }

    outputs[module.key] = compileBaseLikeModule(draft, module, values, {
      replaceSource,
    });
  }

  return {
    modules: [...modules],
    moduleValues,
    outputs,
    moduleIssues,
  };
}

export function validatePromptDraft(
  draft: PromptDraftState,
  availableModules: readonly PromptKeyModule[],
): PromptReadValidation {
  const readModel = buildPromptReadModel(draft, availableModules);
  const issues: PromptValidationIssue[] = [
    ...validatePromptSettings(draft.promptSettings, readModel.outputs),
    ...readModel.moduleIssues,
  ];

  if (!readModel.modules.length) {
    issues.unshift({
      id: "global:no_modules_selected",
      code: "no_modules_selected",
      level: "error",
    });
  }

  const hasErrors = issues.some((issue) => issue.level === "error");
  return {
    valid: !hasErrors,
    hasErrors,
    issues,
    outputs: readModel.outputs,
  };
}

export function compilePromptDraft(
  draft: PromptDraftState,
  availableModules: readonly PromptKeyModule[],
  format: PromptOutputFormat = draft.outputFormat,
): PromptReadCompile {
  const readModel = buildPromptReadModel(draft, availableModules);
  const result = compilePromptOutputPure(
    readModel.modules,
    readModel.outputs,
    draft.promptSettings,
    format,
    promptVariableOwnership(readModel),
  );

  return {
    format,
    output: result.output,
  };
}
