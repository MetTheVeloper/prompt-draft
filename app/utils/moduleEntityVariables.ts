import type { ModuleEntity } from "../modules/entityContracts";
import { normalizeVariableKey } from "./promptVariables";

export function getModuleEntityVariableKey(
  moduleKey: string,
  entity: Pick<ModuleEntity, "id" | "key" | "name">,
) {
  const semanticKey = normalizeVariableKey(
    entity.key || entity.name || entity.id || "configuration",
  );

  return normalizeVariableKey(`${moduleKey}_${semanticKey}`);
}

export function getModuleEntityVariableToken(
  moduleKey: string,
  entity: Pick<ModuleEntity, "id" | "key" | "name">,
) {
  return `{${getModuleEntityVariableKey(moduleKey, entity)}}`;
}
