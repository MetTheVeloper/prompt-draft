import type { ModuleEntityRef } from "./entityContracts";

/**
 * Scene configuration components reuse the generic module-entity reference.
 * Canonical identity is always moduleKey + entityId.
 */
export type SceneComponentRef = ModuleEntityRef;

/**
 * Scene is a specialized repeatable entity. Its description is the canonical
 * nested content definition; module configurations remain stable references.
 */
export type SceneEntity = {
  id: string;
  key: string;
  name: string;
  enabled?: boolean;
  description?: string;
  components: SceneComponentRef[];
  extraDetails?: string;
};
