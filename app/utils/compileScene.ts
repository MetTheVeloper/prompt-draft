import type {
  ModuleOutputValue,
} from "./compilePrompt";
import type {
  ModuleValues,
  PromptKeyModule,
  PromptVariable,
} from "../modules/types";
import type {
  ModuleEntity,
  ModuleEntityPayload,
  TargetedModuleEntity,
} from "../modules/entityContracts";
import type {
  SceneComponentRef,
  SceneContentRef,
  SceneEntity,
} from "../modules/scene.types";
import {
  getModuleEntities,
  getModuleEntitySceneSelection,
  isSceneExposableModule,
  moduleEntityRefIdentity,
  resolveModuleEntityValues,
} from "../modules/entityContracts";
import {
  getSceneEntities,
  getSceneVariableToken,
} from "./scene";
import { compileModule } from "./compileModules";
import { compileFormEntityConfiguration } from "./compileForm";
import { normalizeSemanticTargets } from "./semanticTargets";

export type SceneCompileIssueKind =
  | "missing_content"
  | "missing_component"
  | "component_cardinality";

export type SceneCompileIssue = {
  id: string;
  kind: SceneCompileIssueKind;
  sceneId: string;
  sceneLabel: string;
  variableId?: string;
  moduleKey?: string;
  entityId?: string;
};

export type SceneCompileContext = {
  modules: PromptKeyModule[];
  moduleValues: Record<string, ModuleValues>;
  variables: PromptVariable[];
  layoutActive: boolean;
};

export type SceneCompileResult = {
  output: string;
  issues: SceneCompileIssue[];
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function humanize(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function outputText(value: ModuleOutputValue) {
  return typeof value === "string" ? value.trim() : JSON.stringify(value);
}

function resolvedContentToken(
  ref: SceneContentRef,
  variables: PromptVariable[],
) {
  const variable = variables.find((item) => item.id === ref.variableId);
  if (!variable || variable.enabled === false || !variable.key?.trim()) return "";
  return `{${variable.key.trim()}}`;
}

function findModule(
  modules: PromptKeyModule[],
  moduleKey: string,
) {
  return modules.find((module) => module.key === moduleKey);
}

function findEntity(
  ref: SceneComponentRef,
  moduleValues: Record<string, ModuleValues>,
) {
  return getModuleEntities<ModuleEntityPayload>(
    moduleValues[ref.moduleKey] || {},
  ).find((entity) => entity.id === ref.entityId);
}

function clearScalarOverride(
  module: PromptKeyModule,
  values: ModuleValues,
) {
  const overrideFieldId =
    module.compile?.overrideField ||
    Object.values(module.fields).find((field) => field.isOverride)?.id;

  if (!overrideFieldId) return values;

  return {
    ...values,
    [overrideFieldId]: "",
  };
}

function compileGenericEntity(
  module: PromptKeyModule,
  moduleState: ModuleValues,
  entity: ModuleEntity<ModuleEntityPayload>,
) {
  if (entity.enabled === false) return "";

  const resolved = resolveModuleEntityValues(moduleState, entity);
  return outputText(compileModule(module, clearScalarOverride(module, resolved)));
}

function compileSelectedComponent(
  module: PromptKeyModule,
  moduleState: ModuleValues,
  entity: ModuleEntity<ModuleEntityPayload>,
) {
  if (module.key === "form") {
    const targetedEntity = {
      ...entity,
      targets: normalizeSemanticTargets(
        (entity as Partial<TargetedModuleEntity<ModuleEntityPayload>>).targets,
      ),
    } satisfies TargetedModuleEntity<ModuleEntityPayload>;

    return compileFormEntityConfiguration(module, moduleState, targetedEntity);
  }

  return compileGenericEntity(module, moduleState, entity);
}

function normalizedComponentRefs(scene: SceneEntity) {
  const seen = new Set<string>();

  return scene.components.filter((ref) => {
    const identity = moduleEntityRefIdentity(ref);
    if (!identity || seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

function compileSceneDefinition(
  scene: SceneEntity,
  context: SceneCompileContext,
): { definition: string; issues: SceneCompileIssue[] } {
  const issues: SceneCompileIssue[] = [];
  const sceneLabel = cleanText(scene.name) || humanize(scene.key) || "Scene";

  const contentTokens = scene.content
    .map((ref) => {
      const token = resolvedContentToken(ref, context.variables);
      if (token) return token;

      issues.push({
        id: `scene:${scene.id}:content:${ref.variableId}:missing`,
        kind: "missing_content",
        sceneId: scene.id,
        sceneLabel,
        variableId: ref.variableId,
      });
      return "";
    })
    .filter(Boolean);

  const refs = normalizedComponentRefs(scene);
  const componentBlocks: string[] = [];

  context.modules
    .filter(isSceneExposableModule)
    .forEach((module) => {
      const moduleRefs = refs.filter((ref) => ref.moduleKey === module.key);
      if (!moduleRefs.length) return;

      const selectionMode = getModuleEntitySceneSelection(module);
      const selectedRefs =
        selectionMode === "single" ? moduleRefs.slice(0, 1) : moduleRefs;

      if (selectionMode === "single" && moduleRefs.length > 1) {
        issues.push({
          id: `scene:${scene.id}:component:${module.key}:cardinality`,
          kind: "component_cardinality",
          sceneId: scene.id,
          sceneLabel,
          moduleKey: module.key,
        });
      }

      const outputs = selectedRefs
        .map((ref) => {
          const entity = findEntity(ref, context.moduleValues);
          if (!entity || entity.enabled === false) {
            issues.push({
              id: `scene:${scene.id}:component:${ref.moduleKey}:${ref.entityId}:missing`,
              kind: "missing_component",
              sceneId: scene.id,
              sceneLabel,
              moduleKey: ref.moduleKey,
              entityId: ref.entityId,
            });
            return "";
          }

          return compileSelectedComponent(
            module,
            context.moduleValues[module.key] || {},
            entity,
          );
        })
        .filter(Boolean);

      if (!outputs.length) return;

      const label = humanize(module.key);
      componentBlocks.push(
        outputs.some((output) => output.includes("\n") || output.startsWith("•"))
          ? `${label}:\n${outputs.join("\n")}`
          : `${label}: ${outputs.join("; ")}`,
      );
    });

  // Preserve references to modules that are no longer active/exposable as
  // explicit missing-reference issues instead of silently retargeting.
  refs.forEach((ref) => {
    const module = findModule(context.modules, ref.moduleKey);
    if (module && isSceneExposableModule(module)) return;

    issues.push({
      id: `scene:${scene.id}:component:${ref.moduleKey}:${ref.entityId}:missing-module`,
      kind: "missing_component",
      sceneId: scene.id,
      sceneLabel,
      moduleKey: ref.moduleKey,
      entityId: ref.entityId,
    });
  });

  const lines = [
    `${getSceneVariableToken(scene)} =`,
    `Scene: ${sceneLabel}`,
    cleanText(scene.description) ? `Description: ${cleanText(scene.description)}` : "",
    contentTokens.length ? `Content: ${contentTokens.join(", ")}` : "",
    ...componentBlocks,
    cleanText(scene.extraDetails) ? `Details: ${cleanText(scene.extraDetails)}` : "",
  ].filter(Boolean);

  return {
    definition: lines.join("\n"),
    issues,
  };
}

export function compileSceneModule(
  values: ModuleValues,
  context: SceneCompileContext,
): SceneCompileResult {
  if (!context.layoutActive) {
    return { output: "", issues: [] };
  }

  const compiled = getSceneEntities(values)
    .filter((scene) => scene.enabled !== false)
    .map((scene) => compileSceneDefinition(scene, context));

  return {
    output: compiled.map((item) => item.definition).filter(Boolean).join("\n\n"),
    issues: compiled.flatMap((item) => item.issues),
  };
}
