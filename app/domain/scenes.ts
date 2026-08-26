import type { PromptDraftState } from "../modules/promptDraft.types";
import type { ModuleValues, PromptKeyModule } from "../modules/types";
import type { SceneComponentRef, SceneEntity } from "../modules/scene.types";
import {
  createModuleEntityId,
  getModuleEntities,
  getModuleEntitySceneSelection,
  isSceneExposableModule,
  moduleEntityRefIdentity,
  type ModuleEntityPayload,
} from "../modules/entityContracts";
import { createDefaultModuleValues } from "../utils/compileModules";
import {
  createModuleEntityReferenceCatalogIndex,
  resolveModuleEntityReferenceCatalogItem,
} from "../utils/moduleEntityReferenceCatalog";
import {
  getSceneEntities,
  setSceneEntities,
} from "../utils/scene";
import {
  domainFailure,
  domainSuccess,
  type DomainResult,
} from "./types";

export type SceneMutation = {
  draft: PromptDraftState;
  moduleValues: ModuleValues;
  scenes: SceneEntity[];
  scene?: SceneEntity;
  component?: SceneComponentRef;
};

export type CreateSceneInput = {
  name?: string;
  key?: string;
  description?: string;
  extraDetails?: string;
};

export type UpdateSceneInput = {
  sceneId: string;
  name?: string;
  key?: string;
  description?: string;
  extraDetails?: string;
};

export type SceneComponentInput = {
  sceneId: string;
  moduleKey: string;
  entityId: string;
};

export type ReplaceSceneComponentInput = SceneComponentInput & {
  replacementEntityId: string;
};

function cloneValue<T>(value: T): T {
  if (value === undefined || value === null) return value;

  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

export function normalizeSceneKey(value: string) {
  const parts = value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "scene";

  return parts
    .map((part, index) => {
      const normalized = part.replace(/[^a-zA-Z0-9]/g, "");
      if (!normalized) return "";
      return index === 0
        ? normalized.charAt(0).toLowerCase() + normalized.slice(1)
        : normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join("");
}

export function uniqueSceneKey(
  scenes: readonly SceneEntity[],
  base: string,
  ignoreSceneId = "",
) {
  const normalized = normalizeSceneKey(base);
  const used = new Set(
    scenes
      .filter((scene) => scene.id !== ignoreSceneId)
      .map((scene) => scene.key.trim())
      .filter(Boolean),
  );

  if (!used.has(normalized)) return normalized;

  let suffix = 2;
  while (used.has(`${normalized}${suffix}`)) suffix += 1;
  return `${normalized}${suffix}`;
}

function currentSceneModuleValues(
  draft: PromptDraftState,
  sceneModule: PromptKeyModule,
) {
  const existing = draft.moduleValues[sceneModule.key];
  return existing
    ? cloneValue(existing)
    : createDefaultModuleValues(sceneModule);
}

function validateSceneTarget(
  draft: PromptDraftState,
  sceneModule: PromptKeyModule,
): DomainResult<ModuleValues> {
  if (sceneModule.key !== "scene") {
    return domainFailure({
      code: "scene_module_invalid",
      details: { moduleKey: sceneModule.key },
    });
  }

  if (!draft.selectedModuleKeys.includes(sceneModule.key)) {
    return domainFailure({
      code: "module_not_active",
      details: { moduleKey: sceneModule.key },
    });
  }

  return domainSuccess(currentSceneModuleValues(draft, sceneModule));
}

function sceneNotFound(sceneId: string) {
  return domainFailure({
    code: "scene_not_found",
    path: "sceneId",
    details: { sceneId },
  });
}

function findSceneIndex(scenes: readonly SceneEntity[], sceneId: string) {
  return scenes.findIndex((scene) => scene.id === sceneId);
}

function withScenes(
  draft: PromptDraftState,
  sceneModule: PromptKeyModule,
  moduleValues: ModuleValues,
  scenes: SceneEntity[],
  scene?: SceneEntity,
  component?: SceneComponentRef,
): DomainResult<SceneMutation> {
  const nextModuleValues = setSceneEntities(
    moduleValues,
    cloneValue(scenes),
  );
  const nextDraft = cloneValue(draft);
  nextDraft.moduleValues = {
    ...nextDraft.moduleValues,
    [sceneModule.key]: cloneValue(nextModuleValues),
  };

  return domainSuccess({
    draft: nextDraft,
    moduleValues: cloneValue(nextModuleValues),
    scenes: cloneValue(scenes),
    scene: scene ? cloneValue(scene) : undefined,
    component: component ? cloneValue(component) : undefined,
  });
}

function resolveComponentModule(
  draft: PromptDraftState,
  modules: readonly PromptKeyModule[],
  moduleKey: string,
): DomainResult<PromptKeyModule> {
  const module = modules.find((item) => item.key === moduleKey);
  if (!module) {
    return domainFailure({
      code: "module_not_found",
      path: "moduleKey",
      details: { moduleKey },
    });
  }

  if (!draft.selectedModuleKeys.includes(moduleKey)) {
    return domainFailure({
      code: "module_not_active",
      path: "moduleKey",
      details: { moduleKey },
    });
  }

  if (!isSceneExposableModule(module)) {
    return domainFailure({
      code: "scene_component_module_unsupported",
      path: "moduleKey",
      details: { moduleKey },
    });
  }

  return domainSuccess(module);
}

function resolveAvailableComponent(
  draft: PromptDraftState,
  module: PromptKeyModule,
  entityId: string,
): DomainResult<SceneComponentRef> {
  const entities = getModuleEntities<ModuleEntityPayload>(
    draft.moduleValues[module.key] || {},
  );
  const index = createModuleEntityReferenceCatalogIndex(module.key, entities);
  const resolution = resolveModuleEntityReferenceCatalogItem(
    { moduleKey: module.key, entityId },
    index,
  );

  if (resolution.status === "missing") {
    return domainFailure({
      code: "scene_component_entity_not_found",
      path: "entityId",
      details: { moduleKey: module.key, entityId },
    });
  }

  if (resolution.status === "unavailable") {
    return domainFailure({
      code: "scene_component_unavailable",
      path: "entityId",
      details: { moduleKey: module.key, entityId },
    });
  }

  return domainSuccess(cloneValue(resolution.item.reference));
}

export function createPromptScene(
  draft: PromptDraftState,
  sceneModule: PromptKeyModule,
  input: CreateSceneInput = {},
  idFactory?: () => string,
): DomainResult<SceneMutation> {
  const target = validateSceneTarget(draft, sceneModule);
  if (!target.ok) return target;

  const moduleValues = target.value;
  const scenes = getSceneEntities(moduleValues).map(cloneValue);
  const number = scenes.length + 1;
  const id = String(idFactory?.() || createModuleEntityId("scene")).trim();

  if (!id) {
    return domainFailure({ code: "scene_invalid_id" });
  }

  if (scenes.some((scene) => scene.id === id)) {
    return domainFailure({
      code: "scene_id_conflict",
      details: { sceneId: id },
    });
  }

  const scene: SceneEntity = {
    id,
    key: uniqueSceneKey(scenes, input.key ?? `scene${number}`),
    name: input.name ?? `Scene ${number}`,
    enabled: true,
    description: input.description ?? "",
    content: [],
    components: [],
    extraDetails: input.extraDetails ?? "",
  };

  return withScenes(
    draft,
    sceneModule,
    moduleValues,
    [...scenes, scene],
    scene,
  );
}

export function updatePromptScene(
  draft: PromptDraftState,
  sceneModule: PromptKeyModule,
  input: UpdateSceneInput,
): DomainResult<SceneMutation> {
  const target = validateSceneTarget(draft, sceneModule);
  if (!target.ok) return target;

  if (
    input.name === undefined &&
    input.key === undefined &&
    input.description === undefined &&
    input.extraDetails === undefined
  ) {
    return domainFailure({
      code: "scene_empty_update",
      details: { sceneId: input.sceneId },
    });
  }

  const moduleValues = target.value;
  const scenes = getSceneEntities(moduleValues).map(cloneValue);
  const index = findSceneIndex(scenes, input.sceneId);
  if (index < 0) return sceneNotFound(input.sceneId);

  const source = scenes[index];
  const scene: SceneEntity = {
    ...source,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.key !== undefined
      ? { key: uniqueSceneKey(scenes, input.key, source.id) }
      : {}),
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    ...(input.extraDetails !== undefined
      ? { extraDetails: input.extraDetails }
      : {}),
  };

  scenes[index] = scene;
  return withScenes(draft, sceneModule, moduleValues, scenes, scene);
}

export function duplicatePromptScene(
  draft: PromptDraftState,
  sceneModule: PromptKeyModule,
  sceneId: string,
  idFactory?: () => string,
): DomainResult<SceneMutation> {
  const target = validateSceneTarget(draft, sceneModule);
  if (!target.ok) return target;

  const moduleValues = target.value;
  const scenes = getSceneEntities(moduleValues).map(cloneValue);
  const index = findSceneIndex(scenes, sceneId);
  if (index < 0) return sceneNotFound(sceneId);

  const source = scenes[index];
  const id = String(idFactory?.() || createModuleEntityId("scene")).trim();

  if (!id) {
    return domainFailure({ code: "scene_invalid_id" });
  }

  if (scenes.some((scene) => scene.id === id)) {
    return domainFailure({
      code: "scene_id_conflict",
      details: { sceneId: id },
    });
  }

  const scene: SceneEntity = {
    ...cloneValue(source),
    id,
    key: uniqueSceneKey(scenes, `${source.key || "scene"}Copy`),
    name: `${source.name || "Scene"} Copy`,
  };

  const nextScenes = [
    ...scenes.slice(0, index + 1),
    scene,
    ...scenes.slice(index + 1),
  ];

  return withScenes(draft, sceneModule, moduleValues, nextScenes, scene);
}

export function deletePromptScene(
  draft: PromptDraftState,
  sceneModule: PromptKeyModule,
  sceneId: string,
): DomainResult<SceneMutation> {
  const target = validateSceneTarget(draft, sceneModule);
  if (!target.ok) return target;

  const moduleValues = target.value;
  const scenes = getSceneEntities(moduleValues).map(cloneValue);
  const index = findSceneIndex(scenes, sceneId);
  if (index < 0) return sceneNotFound(sceneId);

  return withScenes(
    draft,
    sceneModule,
    moduleValues,
    scenes.filter((scene) => scene.id !== sceneId),
  );
}

export function setPromptSceneEnabled(
  draft: PromptDraftState,
  sceneModule: PromptKeyModule,
  sceneId: string,
  enabled: boolean,
): DomainResult<SceneMutation> {
  const target = validateSceneTarget(draft, sceneModule);
  if (!target.ok) return target;

  const moduleValues = target.value;
  const scenes = getSceneEntities(moduleValues).map(cloneValue);
  const index = findSceneIndex(scenes, sceneId);
  if (index < 0) return sceneNotFound(sceneId);

  const scene = { ...scenes[index], enabled };
  scenes[index] = scene;
  return withScenes(draft, sceneModule, moduleValues, scenes, scene);
}

export function attachPromptSceneComponent(
  draft: PromptDraftState,
  sceneModule: PromptKeyModule,
  modules: readonly PromptKeyModule[],
  input: SceneComponentInput,
): DomainResult<SceneMutation> {
  const target = validateSceneTarget(draft, sceneModule);
  if (!target.ok) return target;

  const moduleValues = target.value;
  const scenes = getSceneEntities(moduleValues).map(cloneValue);
  const sceneIndex = findSceneIndex(scenes, input.sceneId);
  if (sceneIndex < 0) return sceneNotFound(input.sceneId);

  const moduleResult = resolveComponentModule(draft, modules, input.moduleKey);
  if (!moduleResult.ok) return moduleResult;
  const module = moduleResult.value;

  const componentResult = resolveAvailableComponent(
    draft,
    module,
    input.entityId,
  );
  if (!componentResult.ok) return componentResult;
  const component = componentResult.value;

  const scene = scenes[sceneIndex];
  const identity = moduleEntityRefIdentity(component);
  if (
    scene.components.some((ref) => moduleEntityRefIdentity(ref) === identity)
  ) {
    return domainFailure({
      code: "scene_component_already_attached",
      details: {
        sceneId: input.sceneId,
        moduleKey: input.moduleKey,
        entityId: input.entityId,
      },
    });
  }

  const sameModuleRefs = scene.components.filter(
    (ref) => ref.moduleKey === module.key,
  );
  if (
    getModuleEntitySceneSelection(module) === "single" &&
    sameModuleRefs.length > 0
  ) {
    return domainFailure({
      code: "scene_component_cardinality",
      details: {
        sceneId: input.sceneId,
        moduleKey: input.moduleKey,
        selection: "single",
      },
    });
  }

  const nextScene: SceneEntity = {
    ...scene,
    components: [...scene.components, component],
  };
  scenes[sceneIndex] = nextScene;

  return withScenes(
    draft,
    sceneModule,
    moduleValues,
    scenes,
    nextScene,
    component,
  );
}

export function detachPromptSceneComponent(
  draft: PromptDraftState,
  sceneModule: PromptKeyModule,
  input: SceneComponentInput,
): DomainResult<SceneMutation> {
  const target = validateSceneTarget(draft, sceneModule);
  if (!target.ok) return target;

  const moduleValues = target.value;
  const scenes = getSceneEntities(moduleValues).map(cloneValue);
  const sceneIndex = findSceneIndex(scenes, input.sceneId);
  if (sceneIndex < 0) return sceneNotFound(input.sceneId);

  const scene = scenes[sceneIndex];
  const identity = moduleEntityRefIdentity({
    moduleKey: input.moduleKey,
    entityId: input.entityId,
  });
  const component = scene.components.find(
    (ref) => moduleEntityRefIdentity(ref) === identity,
  );

  if (!component) {
    return domainFailure({
      code: "scene_component_not_attached",
      details: {
        sceneId: input.sceneId,
        moduleKey: input.moduleKey,
        entityId: input.entityId,
      },
    });
  }

  const nextScene: SceneEntity = {
    ...scene,
    components: scene.components.filter(
      (ref) => moduleEntityRefIdentity(ref) !== identity,
    ),
  };
  scenes[sceneIndex] = nextScene;

  return withScenes(
    draft,
    sceneModule,
    moduleValues,
    scenes,
    nextScene,
    component,
  );
}

export function replacePromptSceneComponent(
  draft: PromptDraftState,
  sceneModule: PromptKeyModule,
  modules: readonly PromptKeyModule[],
  input: ReplaceSceneComponentInput,
): DomainResult<SceneMutation> {
  const target = validateSceneTarget(draft, sceneModule);
  if (!target.ok) return target;

  const moduleValues = target.value;
  const scenes = getSceneEntities(moduleValues).map(cloneValue);
  const sceneIndex = findSceneIndex(scenes, input.sceneId);
  if (sceneIndex < 0) return sceneNotFound(input.sceneId);

  const scene = scenes[sceneIndex];
  const sourceIdentity = moduleEntityRefIdentity({
    moduleKey: input.moduleKey,
    entityId: input.entityId,
  });
  const sourceIndex = scene.components.findIndex(
    (ref) => moduleEntityRefIdentity(ref) === sourceIdentity,
  );
  if (sourceIndex < 0) {
    return domainFailure({
      code: "scene_component_not_attached",
      details: {
        sceneId: input.sceneId,
        moduleKey: input.moduleKey,
        entityId: input.entityId,
      },
    });
  }

  const moduleResult = resolveComponentModule(draft, modules, input.moduleKey);
  if (!moduleResult.ok) return moduleResult;
  const module = moduleResult.value;

  const replacementResult = resolveAvailableComponent(
    draft,
    module,
    input.replacementEntityId,
  );
  if (!replacementResult.ok) return replacementResult;
  const replacement = replacementResult.value;
  const replacementIdentity = moduleEntityRefIdentity(replacement);

  const duplicateIndex = scene.components.findIndex(
    (ref, index) =>
      index !== sourceIndex &&
      moduleEntityRefIdentity(ref) === replacementIdentity,
  );
  if (duplicateIndex >= 0) {
    return domainFailure({
      code: "scene_component_already_attached",
      details: {
        sceneId: input.sceneId,
        moduleKey: input.moduleKey,
        entityId: input.replacementEntityId,
      },
    });
  }

  const nextComponents = [...scene.components];
  nextComponents[sourceIndex] = replacement;
  const nextScene: SceneEntity = {
    ...scene,
    components: nextComponents,
  };
  scenes[sceneIndex] = nextScene;

  return withScenes(
    draft,
    sceneModule,
    moduleValues,
    scenes,
    nextScene,
    replacement,
  );
}
