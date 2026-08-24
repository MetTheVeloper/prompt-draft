import type { ModuleEntityRef } from "./entityContracts";
import type { PromptVariableSource, PromptVariableType } from "./types";

/** Stable reference to semantic content used by a Scene. */
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
 * Scene is a specialized repeatable entity: it composes references rather than
 * duplicating scalar module payloads.
 */
export type SceneEntity = {
  id: string;
  key: string;
  name: string;
  enabled?: boolean;
  description?: string;
  content: SceneContentRef[];
  components: SceneComponentRef[];
  extraDetails?: string;
};
