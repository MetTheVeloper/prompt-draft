import type {
  ModuleValues,
  PromptKeyModule,
} from "../modules/types";
import type {
  ModuleEntityPayload,
} from "../modules/entityContracts";
import type {
  SceneComponentRef,
  SceneEntity,
} from "../modules/scene.types";
import {
  getModuleEntities,
  getModuleEntitySceneSelection,
  isSceneExposableModule,
  moduleEntityRefIdentity,
} from "../modules/entityContracts";
import { getModuleEntitySceneInstruction } from "../modules/entityCapabilities";
import {
  getSceneEntities,
  getSceneVariableToken,
} from "./scene";
import { getModuleEntityVariableToken } from "./moduleEntityVariables";

export type SceneCompileIssueKind =
  | "missing_component"
  | "component_cardinality";

export type SceneCompileIssue = {
  id: string;
  kind: SceneCompileIssueKind;
  sceneId: string;
  sceneLabel: string;
  moduleKey?: string;
  entityId?: string;
};

export type SceneCompileContext = {
  modules: PromptKeyModule[];
  moduleValues: Record<string, ModuleValues>;
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

function normalizedComponentRefs(scene: SceneEntity) {
  const seen = new Set<string>();

  return scene.components.filter((ref) => {
    const identity = moduleEntityRefIdentity(ref);
    if (!identity || seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

function joinTokens(tokens: string[]) {
  if (!tokens.length) return "";
  if (tokens.length === 1) return tokens[0];
  if (tokens.length === 2) return `${tokens[0]} and ${tokens[1]}`;

  return `${tokens.slice(0, -1).join(", ")}, and ${tokens[tokens.length - 1]}`;
}

function componentInstruction(module: PromptKeyModule, tokens: string[]) {
  const tokenText = joinTokens(tokens);
  if (!tokenText) return "";

  return getModuleEntitySceneInstruction(module).replaceAll("{tokens}", tokenText);
}

function appendSentence(base: string, sentence: string) {
  const nextSentence = cleanText(sentence);
  if (!nextSentence) return base;

  const current = base.trim();
  if (!current) return nextSentence;

  const separator = /[.!?]$/.test(current) ? " " : ". ";
  return `${current}${separator}${nextSentence}`;
}

function compileSceneDefinition(
  scene: SceneEntity,
  context: SceneCompileContext,
): { definition: string; issues: SceneCompileIssue[] } {
  const issues: SceneCompileIssue[] = [];
  const sceneLabel = cleanText(scene.name) || humanize(scene.key) || "Scene";
  const refs = normalizedComponentRefs(scene);
  const instructions: string[] = [];

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

      const tokens = selectedRefs.flatMap((ref) => {
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
          return [];
        }

        return [getModuleEntityVariableToken(module.key, entity)];
      });

      const instruction = componentInstruction(module, tokens);
      if (instruction) instructions.push(instruction);
    });

  // Preserve refs to modules that are no longer active/exposable as explicit
  // missing-reference issues instead of silently dropping or retargeting them.
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

  let body = cleanText(scene.description);
  body = appendSentence(body, cleanText(scene.extraDetails));
  instructions.forEach((instruction) => {
    body = appendSentence(body, instruction);
  });

  return {
    definition: body ? `• ${getSceneVariableToken(scene)} = ${body}` : "",
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
    // A leading bullet keeps the Scenes block protected from Natural prompt
    // comma-splitting while the modular formatter supplies the {scenes} alias.
    output: compiled
      .map((item) => item.definition)
      .filter(Boolean)
      .join("\n"),
    issues: compiled.flatMap((item) => item.issues),
  };
}
