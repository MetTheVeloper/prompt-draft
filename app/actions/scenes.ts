import type { ModuleValues, PromptKeyModule } from "../modules/types";
import type { SceneComponentRef, SceneEntity } from "../modules/scene.types";
import {
  attachPromptSceneComponent,
  createPromptScene,
  deletePromptScene,
  detachPromptSceneComponent,
  duplicatePromptScene,
  replacePromptSceneComponent,
  setPromptSceneEnabled,
  updatePromptScene,
  type CreateSceneInput,
  type UpdateSceneInput,
} from "../domain/scenes";
import type { DomainIssue } from "../domain/types";
import { ActionRegistry } from "./registry";
import type { ActionContext, ActionDefinition, ActionIssue } from "./types";

function actionIssues(issues: DomainIssue[]): ActionIssue[] {
  return issues.map((issue) => ({ ...issue }));
}

function resolveSceneModule(context: ActionContext): PromptKeyModule | null {
  return context.modules.find((module) => module.key === "scene") || null;
}

function moduleNotFound(context: ActionContext) {
  return {
    ok: false as const,
    draft: context.draft,
    issues: [{ code: "module_not_found", details: { moduleKey: "scene" } }],
  };
}

type SceneData = {
  moduleValues: ModuleValues;
  scenes: SceneEntity[];
  scene?: SceneEntity;
  component?: SceneComponentRef;
};

function normalizeResult(
  context: ActionContext,
  result: ReturnType<typeof createPromptScene>,
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
      scenes: result.value.scenes,
      scene: result.value.scene,
      component: result.value.component,
    },
  };
}

const scenePatchProperties = {
  name: { type: "string" as const },
  key: { type: "string" as const },
  description: { type: "string" as const },
  extraDetails: { type: "string" as const },
};

const componentProperties = {
  sceneId: { type: "string" as const, minLength: 1 },
  moduleKey: { type: "string" as const, minLength: 1 },
  entityId: { type: "string" as const, minLength: 1 },
};

export const sceneCreateAction: ActionDefinition<
  CreateSceneInput,
  SceneData
> = {
  id: "scene.create",
  description: "Create a Scene with a new stable ID and canonical unique semantic key.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: scenePatchProperties,
  },
  execute: (context, input) => {
    const module = resolveSceneModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      createPromptScene(
        context.draft,
        module,
        input,
        context.idFactory?.scene,
      ),
    );
  },
};

export const sceneUpdateAction: ActionDefinition<
  UpdateSceneInput,
  SceneData
> = {
  id: "scene.update",
  description: "Update one exact Scene metadata/description while preserving stable ID and component references.",
  inputSchema: {
    type: "object",
    required: ["sceneId"],
    additionalProperties: false,
    properties: {
      sceneId: { type: "string", minLength: 1 },
      ...scenePatchProperties,
    },
  },
  execute: (context, input) => {
    const module = resolveSceneModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(context, updatePromptScene(context.draft, module, input));
  },
};

export const sceneDuplicateAction: ActionDefinition<
  { sceneId: string },
  SceneData
> = {
  id: "scene.duplicate",
  description: "Duplicate one exact Scene adjacent to its source with new identity/key and copied explicit references.",
  inputSchema: {
    type: "object",
    required: ["sceneId"],
    additionalProperties: false,
    properties: { sceneId: { type: "string", minLength: 1 } },
  },
  execute: (context, input) => {
    const module = resolveSceneModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      duplicatePromptScene(
        context.draft,
        module,
        input.sceneId,
        context.idFactory?.scene,
      ),
    );
  },
};

export const sceneDeleteAction: ActionDefinition<
  { sceneId: string },
  SceneData
> = {
  id: "scene.delete",
  description: "Delete one exact Scene without rewriting external Layout references to that stable Scene ID.",
  inputSchema: {
    type: "object",
    required: ["sceneId"],
    additionalProperties: false,
    properties: { sceneId: { type: "string", minLength: 1 } },
  },
  execute: (context, input) => {
    const module = resolveSceneModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      deletePromptScene(context.draft, module, input.sceneId),
    );
  },
};

export const sceneSetEnabledAction: ActionDefinition<
  { sceneId: string; enabled: boolean },
  SceneData
> = {
  id: "scene.setEnabled",
  description: "Enable or disable one exact Scene while preserving its stable identity and references.",
  inputSchema: {
    type: "object",
    required: ["sceneId", "enabled"],
    additionalProperties: false,
    properties: {
      sceneId: { type: "string", minLength: 1 },
      enabled: { type: "boolean" },
    },
  },
  execute: (context, input) => {
    const module = resolveSceneModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      setPromptSceneEnabled(context.draft, module, input.sceneId, input.enabled),
    );
  },
};

export const sceneComponentAttachAction: ActionDefinition<
  { sceneId: string; moduleKey: string; entityId: string },
  SceneData
> = {
  id: "scene.component.attach",
  description: "Attach one exact available module-entity reference to a Scene without implicit replacement.",
  inputSchema: {
    type: "object",
    required: ["sceneId", "moduleKey", "entityId"],
    additionalProperties: false,
    properties: componentProperties,
  },
  execute: (context, input) => {
    const module = resolveSceneModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      attachPromptSceneComponent(context.draft, module, context.modules, input),
    );
  },
};

export const sceneComponentDetachAction: ActionDefinition<
  { sceneId: string; moduleKey: string; entityId: string },
  SceneData
> = {
  id: "scene.component.detach",
  description: "Detach one exact stable module-entity reference, including missing or unavailable references.",
  inputSchema: {
    type: "object",
    required: ["sceneId", "moduleKey", "entityId"],
    additionalProperties: false,
    properties: componentProperties,
  },
  execute: (context, input) => {
    const module = resolveSceneModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      detachPromptSceneComponent(context.draft, module, input),
    );
  },
};

export const sceneComponentReplaceAction: ActionDefinition<
  {
    sceneId: string;
    moduleKey: string;
    entityId: string;
    replacementEntityId: string;
  },
  SceneData
> = {
  id: "scene.component.replace",
  description: "Explicitly replace one exact Scene component reference with another available entity from the same module.",
  inputSchema: {
    type: "object",
    required: ["sceneId", "moduleKey", "entityId", "replacementEntityId"],
    additionalProperties: false,
    properties: {
      ...componentProperties,
      replacementEntityId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const module = resolveSceneModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      replacePromptSceneComponent(context.draft, module, context.modules, input),
    );
  },
};

export const sceneActions = [
  sceneCreateAction,
  sceneUpdateAction,
  sceneDuplicateAction,
  sceneDeleteAction,
  sceneSetEnabledAction,
  sceneComponentAttachAction,
  sceneComponentDetachAction,
  sceneComponentReplaceAction,
] as const;

export function registerSceneActions(registry: ActionRegistry) {
  sceneActions.forEach((action) => registry.register(action as any));
  return registry;
}
