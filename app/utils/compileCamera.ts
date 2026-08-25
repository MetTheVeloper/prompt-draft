import type {
  ModuleOutputValue,
} from "./compilePrompt";
import type {
  ModuleValues,
  PromptKeyModule,
} from "../modules/types";
import type {
  ModuleEntity,
  ModuleEntityPayload,
} from "../modules/entityContracts";
import {
  getGlobalModuleValues,
  getModuleEntities,
  resolveModuleEntityValues,
} from "../modules/entityContracts";
import { compileModule } from "./compileModules";
import { getModuleEntityVariableToken } from "./moduleEntityVariables";

function outputText(value: ModuleOutputValue) {
  return typeof value === "string" ? value.trim() : JSON.stringify(value);
}

function clearScalarOverride(
  module: PromptKeyModule,
  values: ModuleValues,
) {
  const overrideFieldId =
    module.compile?.overrideField ||
    Object.values(module.fields).find((field) => field.isOverride)?.id;

  if (!overrideFieldId) return values;

  return {
    ...values,
    [overrideFieldId]: "",
  };
}

function compileCameraEntity(
  module: PromptKeyModule,
  moduleState: ModuleValues,
  entity: ModuleEntity<ModuleEntityPayload>,
) {
  if (entity.enabled === false) return "";

  const resolved = resolveModuleEntityValues(moduleState, entity);
  const specification = outputText(
    compileModule(module, clearScalarOverride(module, resolved)),
  );

  if (!specification) return "";

  return `• ${getModuleEntityVariableToken(module.key, entity)} = ${specification}`;
}

export function compileCameraModule(
  module: PromptKeyModule,
  values: ModuleValues,
  options: { customMode?: boolean } = {},
) {
  const globalValues = getGlobalModuleValues(values);

  if (options.customMode) {
    const overrideFieldId =
      module.compile?.overrideField ||
      Object.values(module.fields).find((field) => field.isOverride)?.id;
    const override = overrideFieldId ? globalValues[overrideFieldId] : "";
    return typeof override === "string" ? override.trim() : "";
  }

  const globalOutput = outputText(
    compileModule(module, clearScalarOverride(module, globalValues)),
  );

  const entityLines = getModuleEntities<ModuleEntityPayload>(values)
    .map((entity) => compileCameraEntity(module, values, entity))
    .filter(Boolean);

  // Preserve legacy/no-entity Camera output exactly.
  if (!entityLines.length) return globalOutput;

  return [
    globalOutput ? `• Global/default camera: ${globalOutput}` : "",
    ...entityLines,
  ]
    .filter(Boolean)
    .join("\n");
}
