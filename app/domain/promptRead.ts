import type { PromptDraftState } from "../modules/promptDraft.types";
import type { ModuleValues, PromptKeyModule } from "../modules/types";
import { getModuleEntityConfig } from "../modules/entityContracts";
import { compileBackgroundModule } from "../utils/compileBackground";
import { compileCameraModule } from "../utils/compileCamera";
import { compileEffectsModule } from "../utils/compileEffects";
import { compileFormModule } from "../utils/compileForm";
import { compileLightingModule } from "../utils/compileLighting";
import {
  compileModule,
  createDefaultModuleValues,
} from "../utils/compileModules";
import type { ModuleOutputMap, ModuleOutputValue } from "../utils/compilePromptCore";
import { compileSceneModule, type SceneCompileIssue } from "../utils/compileScene";
import {
  compileSceneResourceModule,
  type SceneResourceScalarCompiler,
} from "../utils/compileSceneResource";
import { compileTextureModule } from "../utils/compileTexture";
import { getSceneEntities } from "../utils/scene";
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
): ModuleOutputValue {
  const override = customOverride(draft, module, values);
  if (override !== null) return override;

  const fieldId = overrideFieldId(module);
  return compileModule(
    module,
    fieldId ? { ...values, [fieldId]: "" } : values,
  );
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

export function buildPromptReadModel(
  draft: PromptDraftState,
  availableModules: readonly PromptKeyModule[],
): PromptReadBuild {
  const modules = activeModules(draft, availableModules);
  const moduleValues = effectiveModuleValues(draft, modules);
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

    outputs[module.key] = compileBaseLikeModule(draft, module, values);
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
