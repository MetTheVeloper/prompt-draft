import type {
  ModuleFieldValue,
  ModuleValues,
  PromptKeyModule,
  SemanticTargetRef,
} from "./types";

/**
 * Reserved sibling state key for generic named module entities.
 *
 * Existing top-level ModuleValues remain the module's global/default state.
 * Older drafts simply do not contain this key and therefore require no
 * destructive migration.
 */
export const MODULE_ENTITY_STATE_KEY = "entities" as const;

/**
 * Semantic target kinds that a generic module entity may opt into.
 * Scene exposure is intentionally separate from this policy: Camera is a
 * useful Scene component even though it normally has no subject/object target.
 */
export type ModuleEntityTargetPolicy = "subject" | "object";

/**
 * Small shared contract for repeatable module-owned configurations.
 *
 * `id` is canonical persistence identity.
 * `key`, `name`, generated tokens, and labels are representation metadata and
 * may change without invalidating cross-module references.
 *
 * `inheritGlobal` defaults to true when omitted. Setting it to false makes the
 * entity independent from the module's global/default scalar state, so only
 * values explicitly present in `payload` participate in resolution/compile.
 */
export type ModuleEntity<TPayload extends object = Record<string, unknown>> = {
  id: string;
  key: string;
  name: string;
  enabled?: boolean;
  inheritGlobal?: boolean;
  payload: TPayload;
};

/**
 * Optional semantic-target specialization used by modules such as Form.
 * Camera and other scene-only configurations keep the smaller ModuleEntity
 * shape and are not forced to own meaningless target arrays.
 */
export type TargetedModuleEntity<
  TPayload extends object = Record<string, unknown>,
> = ModuleEntity<TPayload> & {
  targets: SemanticTargetRef[];
};

/**
 * Stable cross-module reference to a repeatable module entity.
 * Only `moduleKey + entityId` participate in identity.
 */
export type ModuleEntityRef = {
  moduleKey: string;
  entityId: string;
  token?: string;
  label?: string;
};

/**
 * Module-level capability metadata for the generic entity architecture.
 *
 * This deliberately does not reuse `semanticTargets`, which describes
 * color/material assignment eligibility for compiled module outputs.
 */
export type ModuleEntityConfig = {
  enabled: boolean;
  sceneExposable?: boolean;
  targetPolicy?: ModuleEntityTargetPolicy[];
};

/**
 * Runtime module shape after entity capability metadata has been attached.
 * PromptKeyModule remains backward compatible for existing module definitions;
 * consumers that need entity metadata can use this narrower extended shape.
 */
export type EntityCapablePromptKeyModule = PromptKeyModule & {
  entity?: ModuleEntityConfig;
};

/**
 * Generic scalar-module entity payloads are patches over existing global
 * ModuleValues. Specialized modules such as Hair/Outfit may keep their own
 * structured state and expose references through adapters instead of being
 * forced into this storage model.
 */
export type ModuleEntityPayload = Partial<ModuleValues>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function randomEntitySuffix() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Generate a persistence ID that is independent from editable entity key/name.
 * A module-key prefix is included only for debugging/readability; identity must
 * still be treated as the full opaque generated ID.
 */
export function createModuleEntityId(moduleKey = "module") {
  const prefix = moduleKey
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "module";

  return `${prefix}-entity-${randomEntitySuffix()}`;
}

export function isModuleEntity(
  value: unknown,
): value is ModuleEntity<ModuleEntityPayload> {
  if (!isRecord(value)) return false;

  if (typeof value.id !== "string" || !value.id.trim()) return false;
  if (typeof value.key !== "string") return false;
  if (typeof value.name !== "string") return false;
  if (!isRecord(value.payload)) return false;
  if (value.enabled !== undefined && typeof value.enabled !== "boolean") return false;
  if (
    value.inheritGlobal !== undefined &&
    typeof value.inheritGlobal !== "boolean"
  ) {
    return false;
  }

  return true;
}

/**
 * Non-destructive normalizer for persisted entity collections.
 * Missing `entities` state (the legacy/default case) resolves to an empty list.
 */
export function normalizeModuleEntities<
  TPayload extends object = ModuleEntityPayload,
>(value: unknown): ModuleEntity<TPayload>[] {
  if (!Array.isArray(value)) return [];

  return value.filter(isModuleEntity) as unknown as ModuleEntity<TPayload>[];
}

export function getModuleEntities<
  TPayload extends object = ModuleEntityPayload,
>(values?: ModuleValues | null): ModuleEntity<TPayload>[] {
  return normalizeModuleEntities<TPayload>(values?.[MODULE_ENTITY_STATE_KEY]);
}

/**
 * Return a new ModuleValues object with the named-entity collection updated.
 * Top-level scalar/global values are preserved byte-for-byte by this helper.
 */
export function setModuleEntities<TPayload extends object>(
  values: ModuleValues,
  entities: ModuleEntity<TPayload>[],
): ModuleValues {
  return {
    ...values,
    [MODULE_ENTITY_STATE_KEY]: entities as unknown as ModuleFieldValue,
  };
}

/**
 * Remove generic named-entity state while preserving the legacy scalar state.
 * This is the canonical global/default configuration seen by entity resolvers.
 */
export function getGlobalModuleValues(values: ModuleValues): ModuleValues {
  const {
    [MODULE_ENTITY_STATE_KEY]: _entities,
    ...globalValues
  } = values;

  return globalValues;
}

function getModuleEntityPayloadValues(
  entity: ModuleEntity<ModuleEntityPayload>,
): ModuleValues {
  return Object.entries(entity.payload).reduce<ModuleValues>(
    (result, [key, value]) => {
      if (key === MODULE_ENTITY_STATE_KEY || value === undefined) return result;
      result[key] = value;
      return result;
    },
    {},
  );
}

/**
 * Resolve a named scalar-module entity.
 *
 * By default, payload values overlay the existing global/default configuration.
 * Omitted/undefined payload keys therefore inherit global values. Explicit
 * empty strings, nulls, false values, and empty arrays remain valid overrides.
 *
 * When `inheritGlobal === false`, the entity is independent and resolves from
 * its local payload only. This keeps the global/default state active elsewhere
 * while preventing it from leaking into the entity's target scope.
 */
export function resolveModuleEntityValues(
  values: ModuleValues,
  entity: ModuleEntity<ModuleEntityPayload>,
): ModuleValues {
  const payload = getModuleEntityPayloadValues(entity);

  if (entity.inheritGlobal === false) {
    return payload;
  }

  return {
    ...getGlobalModuleValues(values),
    ...payload,
  };
}

export function createModuleEntityRef(
  moduleKey: string,
  entity: Pick<ModuleEntity, "id">,
  presentation: Pick<ModuleEntityRef, "token" | "label"> = {},
): ModuleEntityRef {
  return {
    moduleKey,
    entityId: entity.id,
    ...presentation,
  };
}

export function moduleEntityRefIdentity(ref: ModuleEntityRef) {
  const moduleKey = ref.moduleKey.trim();
  const entityId = ref.entityId.trim();

  if (!moduleKey || !entityId) return "";
  return `module_entity:${moduleKey}:${entityId}`;
}

export function sameModuleEntityRef(
  first: ModuleEntityRef,
  second: ModuleEntityRef,
) {
  const firstIdentity = moduleEntityRefIdentity(first);
  return Boolean(firstIdentity && firstIdentity === moduleEntityRefIdentity(second));
}

export function withModuleEntityConfig(
  module: PromptKeyModule,
  config: ModuleEntityConfig,
): EntityCapablePromptKeyModule {
  return {
    ...module,
    entity: {
      ...config,
      targetPolicy: config.targetPolicy ? [...config.targetPolicy] : undefined,
    },
  };
}

export function getModuleEntityConfig(
  module: PromptKeyModule,
): ModuleEntityConfig | undefined {
  const config = (module as EntityCapablePromptKeyModule).entity;
  if (!config) return undefined;

  return {
    ...config,
    targetPolicy: config.targetPolicy ? [...config.targetPolicy] : undefined,
  };
}

export function moduleSupportsEntities(module: PromptKeyModule) {
  return getModuleEntityConfig(module)?.enabled === true;
}

export function isSceneExposableModule(module: PromptKeyModule) {
  const config = getModuleEntityConfig(module);
  return config?.enabled === true && config.sceneExposable === true;
}

export function getModuleEntityTargetPolicy(
  module: PromptKeyModule,
): ModuleEntityTargetPolicy[] {
  return getModuleEntityConfig(module)?.targetPolicy || [];
}
