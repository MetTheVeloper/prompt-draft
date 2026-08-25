import type { ModuleOutputValue } from "./compilePrompt";
import type { ModuleValues, PromptKeyModule } from "../modules/types";
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

export type SceneResourceScalarCompiler = (
  module: PromptKeyModule,
  values: ModuleValues,
) => ModuleOutputValue;

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

function compileScalar(
  module: PromptKeyModule,
  values: ModuleValues,
  compiler?: SceneResourceScalarCompiler,
  preserveOverride = false,
) {
  const compileValues = preserveOverride
    ? values
    : clearScalarOverride(module, values);

  return compiler
    ? compiler(module, compileValues)
    : compileModule(module, compileValues);
}

function compileSceneResourceEntity(
  module: PromptKeyModule,
  moduleState: ModuleValues,
  entity: ModuleEntity<ModuleEntityPayload>,
  compiler?: SceneResourceScalarCompiler,
) {
  if (entity.enabled === false) return "";

  const resolved = resolveModuleEntityValues(moduleState, entity);
  const specification = outputText(compileScalar(module, resolved, compiler));

  if (!specification) return "";

  return `• ${getModuleEntityVariableToken(module.key, entity)} = ${specification}`;
}

/**
 * Compile a scalar module that owns named Scene resources.
 *
 * Global/default scalar behavior remains backward compatible. Named entities
 * are definitions only and are emitted exclusively when an active Scene holds
 * a stable reference to them. This keeps unused entity state out of prompts.
 *
 * Modules with specialized scalar wording may pass `compileValues`; generic
 * scalar modules continue using the normal `compileModule` path. Modules whose
 * existing global compiler treats the override field as an inline override can
 * opt into `preserveGlobalOverride` without exposing that override to entities.
 */
export function compileSceneResourceModule(
  module: PromptKeyModule,
  values: ModuleValues,
  options: {
    customMode?: boolean;
    referencedEntityIds?: string[];
    compileValues?: SceneResourceScalarCompiler;
    preserveGlobalOverride?: boolean;
  } = {},
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
    compileScalar(
      module,
      globalValues,
      options.compileValues,
      options.preserveGlobalOverride,
    ),
  );

  const referencedIds = new Set(
    (options.referencedEntityIds || []).map((id) => id.trim()).filter(Boolean),
  );

  if (!referencedIds.size) return globalOutput;

  const entityLines = getModuleEntities<ModuleEntityPayload>(values)
    .filter((entity) => referencedIds.has(entity.id))
    .map((entity) =>
      compileSceneResourceEntity(
        module,
        values,
        entity,
        options.compileValues,
      ),
    )
    .filter(Boolean);

  if (!entityLines.length) return globalOutput;

  return [
    globalOutput ? `• Global/default ${module.key}: ${globalOutput}` : "",
    ...entityLines,
  ]
    .filter(Boolean)
    .join("\n");
}
