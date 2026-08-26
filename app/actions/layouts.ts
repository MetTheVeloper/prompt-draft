import type { LayoutRegion, LayoutRegionsState } from "../modules/layout.types";
import type { ModuleValues, PromptKeyModule } from "../modules/types";
import {
  assignPromptLayoutRegionScene,
  clearPromptLayoutRegionScene,
  createPromptLayoutRegion,
  deletePromptLayoutRegion,
  duplicatePromptLayoutRegion,
  movePromptLayoutRegion,
  updatePromptLayoutGrid,
  updatePromptLayoutRegion,
  type LayoutRegionPatch,
} from "../domain/layouts";
import type { DomainIssue } from "../domain/types";
import { ActionRegistry } from "./registry";
import type { ActionContext, ActionDefinition, ActionIssue } from "./types";

function actionIssues(issues: DomainIssue[]): ActionIssue[] {
  return issues.map((issue) => ({ ...issue }));
}

function resolveLayoutModule(context: ActionContext): PromptKeyModule | null {
  return context.modules.find((module) => module.key === "layout") || null;
}

function moduleNotFound(context: ActionContext) {
  return {
    ok: false as const,
    draft: context.draft,
    issues: [{ code: "module_not_found", details: { moduleKey: "layout" } }],
  };
}

type LayoutData = {
  moduleValues: ModuleValues;
  state: LayoutRegionsState;
  region?: LayoutRegion;
};

function normalizeResult(
  context: ActionContext,
  result: ReturnType<typeof createPromptLayoutRegion>,
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
      state: result.value.state,
      region: result.value.region,
    },
  };
}

const regionPatchProperties = {
  name: { type: "string" as const },
  role: {
    type: "string" as const,
    enum: [
      "none",
      "background",
      "hero_image",
      "supporting_image",
      "text",
      "logo",
      "badge",
      "cta",
      "metadata",
      "decoration",
      "empty_space",
      "custom",
    ] as const,
  },
  customRole: { type: "string" as const },
  contentKey: { type: "string" as const },
  x: { type: "number" as const },
  y: { type: "number" as const },
  width: { type: "number" as const },
  height: { type: "number" as const },
  horizontalAlign: {
    type: "string" as const,
    enum: ["none", "start", "center", "end", "stretch"] as const,
  },
  verticalAlign: {
    type: "string" as const,
    enum: ["none", "start", "center", "end", "stretch"] as const,
  },
  fit: {
    type: "string" as const,
    enum: ["none", "cover", "contain", "fill", "natural"] as const,
  },
  overflow: {
    type: "string" as const,
    enum: ["none", "visible", "hidden"] as const,
  },
  layer: { type: "number" as const },
  description: { type: "string" as const },
};

export const layoutRegionCreateAction: ActionDefinition<
  LayoutRegionPatch,
  LayoutData
> = {
  id: "layout.region.create",
  description: "Create a normalized Layout Region with a new stable ID. Scene binding is handled separately through explicit relation actions.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: regionPatchProperties,
  },
  execute: (context, input) => {
    const module = resolveLayoutModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      createPromptLayoutRegion(
        context.draft,
        module,
        input,
        context.idFactory?.layoutRegion,
      ),
    );
  },
};

export const layoutRegionUpdateAction: ActionDefinition<
  { regionId: string } & LayoutRegionPatch,
  LayoutData
> = {
  id: "layout.region.update",
  description: "Update one exact Layout Region while preserving stable identity and canonical geometry. Direct contentRef patches are not accepted.",
  inputSchema: {
    type: "object",
    required: ["regionId"],
    additionalProperties: false,
    properties: {
      regionId: { type: "string", minLength: 1 },
      ...regionPatchProperties,
    },
  },
  execute: (context, input) => {
    const module = resolveLayoutModule(context);
    if (!module) return moduleNotFound(context);
    const { regionId, ...patch } = input;
    return normalizeResult(
      context,
      updatePromptLayoutRegion(context.draft, module, regionId, patch),
    );
  },
};

export const layoutRegionDuplicateAction: ActionDefinition<
  { regionId: string },
  LayoutData
> = {
  id: "layout.region.duplicate",
  description: "Duplicate one exact Layout Region adjacent to its source with a new stable ID while preserving explicit content binding semantics.",
  inputSchema: {
    type: "object",
    required: ["regionId"],
    additionalProperties: false,
    properties: { regionId: { type: "string", minLength: 1 } },
  },
  execute: (context, input) => {
    const module = resolveLayoutModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      duplicatePromptLayoutRegion(
        context.draft,
        module,
        input.regionId,
        context.idFactory?.layoutRegion,
      ),
    );
  },
};

export const layoutRegionDeleteAction: ActionDefinition<
  { regionId: string },
  LayoutData
> = {
  id: "layout.region.delete",
  description: "Delete one exact Layout Region without rewriting external references that may now become missing.",
  inputSchema: {
    type: "object",
    required: ["regionId"],
    additionalProperties: false,
    properties: { regionId: { type: "string", minLength: 1 } },
  },
  execute: (context, input) => {
    const module = resolveLayoutModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      deletePromptLayoutRegion(context.draft, module, input.regionId),
    );
  },
};

export const layoutRegionMoveAction: ActionDefinition<
  { regionId: string; toIndex: number },
  LayoutData
> = {
  id: "layout.region.move",
  description: "Move one exact Layout Region to an explicit collection index without silently rewriting its authored layer value.",
  inputSchema: {
    type: "object",
    required: ["regionId", "toIndex"],
    additionalProperties: false,
    properties: {
      regionId: { type: "string", minLength: 1 },
      toIndex: { type: "number", min: 0 },
    },
  },
  execute: (context, input) => {
    const module = resolveLayoutModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      movePromptLayoutRegion(
        context.draft,
        module,
        input.regionId,
        input.toIndex,
      ),
    );
  },
};

export const layoutGridUpdateAction: ActionDefinition<
  { columns?: number; rows?: number },
  LayoutData
> = {
  id: "layout.grid.update",
  description: "Update Layout grid dimensions using the canonical grid clamp/round rules while preserving Region geometry.",
  inputSchema: {
    type: "object",
    additionalProperties: false,
    properties: {
      columns: { type: "number" },
      rows: { type: "number" },
    },
  },
  execute: (context, input) => {
    const module = resolveLayoutModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      updatePromptLayoutGrid(context.draft, module, input),
    );
  },
};

export const layoutRegionAssignSceneAction: ActionDefinition<
  { regionId: string; sceneId: string },
  LayoutData
> = {
  id: "layout.region.assignScene",
  description: "Bind one exact active Scene to one exact Layout Region and synchronize the prompt-facing Scene token cache.",
  inputSchema: {
    type: "object",
    required: ["regionId", "sceneId"],
    additionalProperties: false,
    properties: {
      regionId: { type: "string", minLength: 1 },
      sceneId: { type: "string", minLength: 1 },
    },
  },
  execute: (context, input) => {
    const module = resolveLayoutModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      assignPromptLayoutRegionScene(
        context.draft,
        module,
        input.regionId,
        input.sceneId,
      ),
    );
  },
};

export const layoutRegionClearSceneAction: ActionDefinition<
  { regionId: string },
  LayoutData
> = {
  id: "layout.region.clearScene",
  description: "Explicitly clear a Layout Region Scene binding while preserving unrelated manual content text.",
  inputSchema: {
    type: "object",
    required: ["regionId"],
    additionalProperties: false,
    properties: { regionId: { type: "string", minLength: 1 } },
  },
  execute: (context, input) => {
    const module = resolveLayoutModule(context);
    if (!module) return moduleNotFound(context);
    return normalizeResult(
      context,
      clearPromptLayoutRegionScene(context.draft, module, input.regionId),
    );
  },
};

export const layoutActions = [
  layoutRegionCreateAction,
  layoutRegionUpdateAction,
  layoutRegionDuplicateAction,
  layoutRegionDeleteAction,
  layoutRegionMoveAction,
  layoutGridUpdateAction,
  layoutRegionAssignSceneAction,
  layoutRegionClearSceneAction,
] as const;

export function registerLayoutActions(registry: ActionRegistry) {
  layoutActions.forEach((action) => registry.register(action as any));
  return registry;
}
