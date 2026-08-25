import type { LayoutRegionContentRef } from "../modules/layout.types";
import type { PromptVariable } from "../modules/types";
import {
  createReferenceCatalogIndex,
  resolveReferenceCatalogItem,
  type ReferenceCatalogItem,
} from "./referenceCatalog";

export type SceneReferenceCatalogItem = ReferenceCatalogItem<
  LayoutRegionContentRef,
  string,
  PromptVariable
>;

export function sceneVariableToken(variable: PromptVariable) {
  const key = String(variable.key || "").trim();
  return key ? `{${key}}` : "";
}

export function sceneVariableLabel(variable: PromptVariable) {
  return String(variable.label || "").trim() || sceneVariableToken(variable);
}

export function isSceneReferenceVariable(variable: PromptVariable) {
  return (
    variable.moduleKey === "scene" &&
    variable.entityType === "scene" &&
    Boolean(String(variable.entityId || "").trim()) &&
    Boolean(sceneVariableToken(variable))
  );
}

export function sceneContentRefIdentity(reference: LayoutRegionContentRef) {
  if (reference.kind !== "scene") return "";

  const entityId = String(reference.entityId || "").trim();
  return entityId ? `scene:${entityId}` : "";
}

export function createSceneReferenceCatalogItem(
  variable: PromptVariable,
): SceneReferenceCatalogItem {
  if (!isSceneReferenceVariable(variable)) {
    throw new Error("Scene reference catalog requires a valid Scene variable.");
  }

  const entityId = String(variable.entityId).trim();
  const token = sceneVariableToken(variable);
  const label = sceneVariableLabel(variable);
  const reference: LayoutRegionContentRef = {
    kind: "scene",
    entityId,
    token,
    label,
  };

  return {
    identity: sceneContentRefIdentity(reference),
    reference,
    presentation: {
      label,
      description: token,
      token,
      name: label,
    },
    kind: "scene",
    scope: "layout_region_content",
    state: {
      available: variable.enabled !== false,
      enabled: variable.enabled !== false,
    },
    metadata: variable,
  };
}

export function createSceneReferenceCatalogItems(
  variables: readonly PromptVariable[],
) {
  return variables
    .filter(isSceneReferenceVariable)
    .map(createSceneReferenceCatalogItem);
}

export function createSceneReferenceCatalogIndex(
  variables: readonly PromptVariable[],
) {
  return createReferenceCatalogIndex(createSceneReferenceCatalogItems(variables));
}

export function resolveSceneReferenceCatalogItem(
  reference: LayoutRegionContentRef,
  index: ReadonlyMap<string, SceneReferenceCatalogItem>,
) {
  return resolveReferenceCatalogItem(reference, index, sceneContentRefIdentity);
}

/**
 * Compatibility-only lookup for legacy Layout drafts that have a `{scene_*}`
 * contentKey but no stable contentRef yet. Never use this as fallback resolution
 * for an existing stable ref: a missing stable Scene reference must stay missing.
 */
export function findLegacySceneReferenceByToken(
  token: unknown,
  items: readonly SceneReferenceCatalogItem[],
) {
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) return undefined;

  return items.find((item) => item.presentation.token === normalizedToken);
}
