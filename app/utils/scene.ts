import type { ModuleFieldValue, ModuleValues } from "../modules/types";
import type {
  SceneComponentRef,
  SceneEntity,
} from "../modules/scene.types";
import { normalizeVariableKey } from "./promptVariables";
import { moduleEntityRefIdentity } from "../modules/entityContracts";

export const SCENE_STATE_KEY = "scenes" as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeSceneComponentRefs(value: unknown): SceneComponentRef[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();

  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const moduleKey = typeof item.moduleKey === "string" ? item.moduleKey.trim() : "";
    const entityId = typeof item.entityId === "string" ? item.entityId.trim() : "";
    if (!moduleKey || !entityId) return [];

    const ref: SceneComponentRef = {
      moduleKey,
      entityId,
      token: typeof item.token === "string" ? item.token : undefined,
      label: typeof item.label === "string" ? item.label : undefined,
    };
    const identity = moduleEntityRefIdentity(ref);
    if (!identity || seen.has(identity)) return [];
    seen.add(identity);
    return [ref];
  });
}

export function isSceneEntity(value: unknown): value is SceneEntity {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || !value.id.trim()) return false;
  if (typeof value.key !== "string") return false;
  if (typeof value.name !== "string") return false;
  if (value.enabled !== undefined && typeof value.enabled !== "boolean") return false;
  return true;
}

export function normalizeSceneEntities(value: unknown): SceneEntity[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isSceneEntity).map((scene) => ({
    id: scene.id,
    key: scene.key,
    name: scene.name,
    enabled: scene.enabled,
    description: typeof scene.description === "string" ? scene.description : "",
    extraDetails: typeof scene.extraDetails === "string" ? scene.extraDetails : "",
    components: normalizeSceneComponentRefs(scene.components),
  }));
}

export function getSceneEntities(values?: ModuleValues | null) {
  return normalizeSceneEntities(values?.[SCENE_STATE_KEY]);
}

export function setSceneEntities(
  values: ModuleValues,
  scenes: SceneEntity[],
): ModuleValues {
  return {
    ...values,
    [SCENE_STATE_KEY]: scenes as unknown as ModuleFieldValue,
  };
}

export function getSceneVariableKey(scene: Pick<SceneEntity, "key" | "name">) {
  const semanticKey = normalizeVariableKey(scene.key || scene.name || "scene");
  return normalizeVariableKey(`scene_${semanticKey}`);
}

export function getSceneVariableToken(scene: Pick<SceneEntity, "key" | "name">) {
  return `{${getSceneVariableKey(scene)}}`;
}
