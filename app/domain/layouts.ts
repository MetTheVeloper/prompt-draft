import type {
  LayoutEditorGrid,
  LayoutFit,
  LayoutHorizontalAlign,
  LayoutOverflow,
  LayoutRegion,
  LayoutRegionRole,
  LayoutRegionsState,
  LayoutVerticalAlign,
} from "../modules/layout.types";
import type { PromptDraftState } from "../modules/promptDraft.types";
import type { ModuleValues, PromptKeyModule } from "../modules/types";
import { getSceneEntities, getSceneVariableToken } from "../utils/scene";
import {
  cloneLayoutRegion,
  cloneLayoutRegionsState,
  createLayoutRegion,
  createLayoutRegionId,
  normalizeLayoutGrid,
  normalizeLayoutRegion,
} from "../utils/layoutRegions";
import { createDefaultModuleValues } from "../utils/compileModules";
import {
  domainFailure,
  domainSuccess,
  type DomainResult,
} from "./types";

export type LayoutRegionPatch = {
  name?: string;
  role?: LayoutRegionRole;
  customRole?: string;
  contentKey?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  horizontalAlign?: LayoutHorizontalAlign;
  verticalAlign?: LayoutVerticalAlign;
  fit?: LayoutFit;
  overflow?: LayoutOverflow;
  layer?: number;
  description?: string;
};

export type LayoutMutation = {
  draft: PromptDraftState;
  moduleValues: ModuleValues;
  state: LayoutRegionsState;
  region?: LayoutRegion;
};

const REGION_ROLES: readonly LayoutRegionRole[] = [
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
];

const HORIZONTAL_ALIGNS: readonly LayoutHorizontalAlign[] = [
  "none",
  "start",
  "center",
  "end",
  "stretch",
];

const VERTICAL_ALIGNS: readonly LayoutVerticalAlign[] = [
  "none",
  "start",
  "center",
  "end",
  "stretch",
];

const FITS: readonly LayoutFit[] = ["none", "cover", "contain", "fill", "natural"];
const OVERFLOWS: readonly LayoutOverflow[] = ["none", "visible", "hidden"];

function cloneValue<T>(value: T): T {
  if (value === undefined || value === null) return value;

  try {
    return JSON.parse(JSON.stringify(value)) as T;
  } catch {
    return value;
  }
}

function currentModuleValues(
  draft: PromptDraftState,
  module: PromptKeyModule,
): ModuleValues {
  return draft.moduleValues[module.key]
    ? cloneValue(draft.moduleValues[module.key])
    : createDefaultModuleValues(module);
}

function validateLayoutTarget(
  draft: PromptDraftState,
  module: PromptKeyModule,
): DomainResult<ModuleValues> {
  if (module.key !== "layout") {
    return domainFailure({
      code: "layout_module_invalid",
      details: { moduleKey: module.key },
    });
  }

  if (!draft.selectedModuleKeys.includes("layout")) {
    return domainFailure({
      code: "module_not_active",
      details: { moduleKey: "layout" },
    });
  }

  return domainSuccess(currentModuleValues(draft, module));
}

function stateFromValues(values: ModuleValues) {
  return cloneLayoutRegionsState(values.regions);
}

function findRegionIndex(state: LayoutRegionsState, regionId: string) {
  return state.regions.findIndex((region) => region.id === regionId);
}

function regionNotFound(regionId: string) {
  return domainFailure({
    code: "layout_region_not_found",
    path: "regionId",
    details: { regionId },
  });
}

function withState(
  draft: PromptDraftState,
  module: PromptKeyModule,
  moduleValues: ModuleValues,
  state: LayoutRegionsState,
  region?: LayoutRegion,
): DomainResult<LayoutMutation> {
  const nextState = cloneLayoutRegionsState(state);
  const nextModuleValues: ModuleValues = {
    ...moduleValues,
    regions: nextState,
  };
  const nextDraft = cloneValue(draft);
  nextDraft.moduleValues = {
    ...nextDraft.moduleValues,
    [module.key]: cloneValue(nextModuleValues),
  };

  return domainSuccess({
    draft: nextDraft,
    moduleValues: cloneValue(nextModuleValues),
    state: cloneLayoutRegionsState(nextState),
    region: region ? cloneLayoutRegion(region) : undefined,
  });
}

function validatePatch(patch: LayoutRegionPatch): DomainResult<true> {
  if (patch.role !== undefined && !REGION_ROLES.includes(patch.role)) {
    return domainFailure({
      code: "layout_region_invalid_role",
      path: "role",
      details: { role: patch.role },
    });
  }

  if (
    patch.horizontalAlign !== undefined &&
    !HORIZONTAL_ALIGNS.includes(patch.horizontalAlign)
  ) {
    return domainFailure({
      code: "layout_region_invalid_horizontal_align",
      path: "horizontalAlign",
    });
  }

  if (
    patch.verticalAlign !== undefined &&
    !VERTICAL_ALIGNS.includes(patch.verticalAlign)
  ) {
    return domainFailure({
      code: "layout_region_invalid_vertical_align",
      path: "verticalAlign",
    });
  }

  if (patch.fit !== undefined && !FITS.includes(patch.fit)) {
    return domainFailure({
      code: "layout_region_invalid_fit",
      path: "fit",
    });
  }

  if (patch.overflow !== undefined && !OVERFLOWS.includes(patch.overflow)) {
    return domainFailure({
      code: "layout_region_invalid_overflow",
      path: "overflow",
    });
  }

  const numericFields = ["x", "y", "width", "height", "layer"] as const;
  for (const field of numericFields) {
    const value = patch[field];
    if (value !== undefined && !Number.isFinite(value)) {
      return domainFailure({
        code: "layout_region_invalid_number",
        path: field,
      });
    }
  }

  return domainSuccess(true);
}

function validateNormalizedRegion(region: LayoutRegion): DomainResult<true> {
  if (region.role === "custom" && !String(region.customRole || "").trim()) {
    return domainFailure({
      code: "layout_region_custom_role_required",
      path: "customRole",
      details: { regionId: region.id },
    });
  }

  if (!(region.width > 0) || !(region.height > 0)) {
    return domainFailure({
      code: "layout_region_invalid_geometry",
      details: {
        regionId: region.id,
        width: region.width,
        height: region.height,
      },
    });
  }

  return domainSuccess(true);
}

function applyRegionPatch(
  source: LayoutRegion,
  patch: LayoutRegionPatch,
  index: number,
): DomainResult<LayoutRegion> {
  const patchValidation = validatePatch(patch);
  if (!patchValidation.ok) return patchValidation;

  const next: LayoutRegion = {
    ...cloneLayoutRegion(source),
    ...cloneValue(patch),
    id: source.id,
  };

  if (patch.contentKey !== undefined && source.contentRef?.kind === "scene") {
    const expectedToken = String(source.contentRef.token || "").trim();
    if (String(patch.contentKey).trim() !== expectedToken) {
      delete next.contentRef;
    }
  }

  const normalized = normalizeLayoutRegion(next, index);
  const regionValidation = validateNormalizedRegion(normalized);
  if (!regionValidation.ok) return regionValidation;

  return domainSuccess(normalized);
}

export function createPromptLayoutRegion(
  draft: PromptDraftState,
  module: PromptKeyModule,
  patch: LayoutRegionPatch = {},
  idFactory?: () => string,
): DomainResult<LayoutMutation> {
  const target = validateLayoutTarget(draft, module);
  if (!target.ok) return target;

  const moduleValues = target.value;
  const state = stateFromValues(moduleValues);
  const patchValidation = validatePatch(patch);
  if (!patchValidation.ok) return patchValidation;

  const id = String(idFactory?.() || createLayoutRegionId()).trim();
  if (!id) {
    return domainFailure({ code: "layout_region_invalid_id" });
  }
  if (state.regions.some((region) => region.id === id)) {
    return domainFailure({
      code: "layout_region_id_conflict",
      details: { regionId: id },
    });
  }

  const region = createLayoutRegion(state.regions.length, {
    ...cloneValue(patch),
    id,
  });
  const regionValidation = validateNormalizedRegion(region);
  if (!regionValidation.ok) return regionValidation;

  const nextState: LayoutRegionsState = {
    grid: { ...state.grid },
    regions: [...state.regions.map(cloneLayoutRegion), region],
  };

  return withState(draft, module, moduleValues, nextState, region);
}

export function updatePromptLayoutRegion(
  draft: PromptDraftState,
  module: PromptKeyModule,
  regionId: string,
  patch: LayoutRegionPatch,
): DomainResult<LayoutMutation> {
  const target = validateLayoutTarget(draft, module);
  if (!target.ok) return target;

  if (!Object.keys(patch).length) {
    return domainFailure({
      code: "layout_region_empty_update",
      details: { regionId },
    });
  }

  const moduleValues = target.value;
  const state = stateFromValues(moduleValues);
  const index = findRegionIndex(state, regionId);
  if (index < 0) return regionNotFound(regionId);

  const updated = applyRegionPatch(state.regions[index], patch, index);
  if (!updated.ok) return updated;

  const regions = state.regions.map(cloneLayoutRegion);
  regions[index] = updated.value;

  return withState(
    draft,
    module,
    moduleValues,
    { grid: { ...state.grid }, regions },
    updated.value,
  );
}

export function duplicatePromptLayoutRegion(
  draft: PromptDraftState,
  module: PromptKeyModule,
  regionId: string,
  idFactory?: () => string,
): DomainResult<LayoutMutation> {
  const target = validateLayoutTarget(draft, module);
  if (!target.ok) return target;

  const moduleValues = target.value;
  const state = stateFromValues(moduleValues);
  const index = findRegionIndex(state, regionId);
  if (index < 0) return regionNotFound(regionId);

  const id = String(idFactory?.() || createLayoutRegionId()).trim();
  if (!id) return domainFailure({ code: "layout_region_invalid_id" });
  if (state.regions.some((region) => region.id === id)) {
    return domainFailure({
      code: "layout_region_id_conflict",
      details: { regionId: id },
    });
  }

  const source = state.regions[index];
  const offsetX = 1 / state.grid.columns;
  const offsetY = 1 / state.grid.rows;
  const duplicate = normalizeLayoutRegion(
    {
      ...cloneLayoutRegion(source),
      id,
      name: "",
      x: Math.min(source.x + offsetX, 1 - source.width),
      y: Math.min(source.y + offsetY, 1 - source.height),
      layer: state.regions.length,
    },
    index + 1,
  );

  const regionValidation = validateNormalizedRegion(duplicate);
  if (!regionValidation.ok) return regionValidation;

  const regions = state.regions.map(cloneLayoutRegion);
  regions.splice(index + 1, 0, duplicate);

  return withState(
    draft,
    module,
    moduleValues,
    { grid: { ...state.grid }, regions },
    duplicate,
  );
}

export function deletePromptLayoutRegion(
  draft: PromptDraftState,
  module: PromptKeyModule,
  regionId: string,
): DomainResult<LayoutMutation> {
  const target = validateLayoutTarget(draft, module);
  if (!target.ok) return target;

  const moduleValues = target.value;
  const state = stateFromValues(moduleValues);
  const index = findRegionIndex(state, regionId);
  if (index < 0) return regionNotFound(regionId);

  return withState(draft, module, moduleValues, {
    grid: { ...state.grid },
    regions: state.regions
      .filter((region) => region.id !== regionId)
      .map(cloneLayoutRegion),
  });
}

export function movePromptLayoutRegion(
  draft: PromptDraftState,
  module: PromptKeyModule,
  regionId: string,
  toIndex: number,
): DomainResult<LayoutMutation> {
  const target = validateLayoutTarget(draft, module);
  if (!target.ok) return target;

  const moduleValues = target.value;
  const state = stateFromValues(moduleValues);
  const index = findRegionIndex(state, regionId);
  if (index < 0) return regionNotFound(regionId);

  if (
    !Number.isInteger(toIndex) ||
    toIndex < 0 ||
    toIndex >= state.regions.length
  ) {
    return domainFailure({
      code: "layout_region_invalid_move_index",
      path: "toIndex",
      details: { regionId, toIndex },
    });
  }

  const regions = state.regions.map(cloneLayoutRegion);
  const [region] = regions.splice(index, 1);
  regions.splice(toIndex, 0, region);

  return withState(
    draft,
    module,
    moduleValues,
    { grid: { ...state.grid }, regions },
    region,
  );
}

export function updatePromptLayoutGrid(
  draft: PromptDraftState,
  module: PromptKeyModule,
  patch: Partial<LayoutEditorGrid>,
): DomainResult<LayoutMutation> {
  const target = validateLayoutTarget(draft, module);
  if (!target.ok) return target;

  if (patch.columns === undefined && patch.rows === undefined) {
    return domainFailure({ code: "layout_grid_empty_update" });
  }

  for (const key of ["columns", "rows"] as const) {
    if (patch[key] !== undefined && !Number.isFinite(patch[key])) {
      return domainFailure({
        code: "layout_grid_invalid_number",
        path: key,
      });
    }
  }

  const moduleValues = target.value;
  const state = stateFromValues(moduleValues);
  const grid = normalizeLayoutGrid({ ...state.grid, ...patch });

  return withState(draft, module, moduleValues, {
    grid,
    regions: state.regions.map(cloneLayoutRegion),
  });
}

function getAvailableScene(
  draft: PromptDraftState,
  sceneId: string,
): DomainResult<ReturnType<typeof getSceneEntities>[number]> {
  if (!draft.selectedModuleKeys.includes("scene")) {
    return domainFailure({
      code: "scene_module_not_active",
      details: { sceneId },
    });
  }

  const scene = getSceneEntities(draft.moduleValues.scene || {}).find(
    (candidate) => candidate.id === sceneId,
  );
  if (!scene) {
    return domainFailure({
      code: "scene_not_found",
      path: "sceneId",
      details: { sceneId },
    });
  }
  if (scene.enabled === false) {
    return domainFailure({
      code: "scene_unavailable",
      path: "sceneId",
      details: { sceneId },
    });
  }

  return domainSuccess(scene);
}

export function assignPromptLayoutRegionScene(
  draft: PromptDraftState,
  module: PromptKeyModule,
  regionId: string,
  sceneId: string,
): DomainResult<LayoutMutation> {
  const target = validateLayoutTarget(draft, module);
  if (!target.ok) return target;

  const sceneResult = getAvailableScene(draft, sceneId);
  if (!sceneResult.ok) return sceneResult;

  const moduleValues = target.value;
  const state = stateFromValues(moduleValues);
  const index = findRegionIndex(state, regionId);
  if (index < 0) return regionNotFound(regionId);

  const scene = sceneResult.value;
  const token = getSceneVariableToken(scene);
  const label = String(scene.name || "").trim() || token;
  const region = normalizeLayoutRegion(
    {
      ...cloneLayoutRegion(state.regions[index]),
      contentRef: {
        kind: "scene",
        entityId: scene.id,
        token,
        label,
      },
      contentKey: token,
    },
    index,
  );

  const regions = state.regions.map(cloneLayoutRegion);
  regions[index] = region;

  return withState(
    draft,
    module,
    moduleValues,
    { grid: { ...state.grid }, regions },
    region,
  );
}

export function clearPromptLayoutRegionScene(
  draft: PromptDraftState,
  module: PromptKeyModule,
  regionId: string,
): DomainResult<LayoutMutation> {
  const target = validateLayoutTarget(draft, module);
  if (!target.ok) return target;

  const moduleValues = target.value;
  const state = stateFromValues(moduleValues);
  const index = findRegionIndex(state, regionId);
  if (index < 0) return regionNotFound(regionId);

  const source = cloneLayoutRegion(state.regions[index]);
  const previousRef = source.contentRef;
  if (
    previousRef?.kind === "scene" &&
    String(previousRef.token || "").trim() &&
    String(source.contentKey || "").trim() === String(previousRef.token).trim()
  ) {
    source.contentKey = "";
  }
  delete source.contentRef;

  const region = normalizeLayoutRegion(source, index);
  const regions = state.regions.map(cloneLayoutRegion);
  regions[index] = region;

  return withState(
    draft,
    module,
    moduleValues,
    { grid: { ...state.grid }, regions },
    region,
  );
}
