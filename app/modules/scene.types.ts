import type { ModuleEntityRef } from "./entityContracts";
import type { PromptVariableSource, PromptVariableType } from "./types";

/** @deprecated Scene content is now expressed directly through nested Description text. */
export type SceneContentRef = {
  variableId: string;
  token?: string;
  label?: string;
  source?: PromptVariableSource;
  type?: PromptVariableType;
};

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
  /** @deprecated Always normalized to an empty array; kept for draft compatibility. */
  content: SceneContentRef[];
  components: SceneComponentRef[];
  extraDetails?: string;
};
