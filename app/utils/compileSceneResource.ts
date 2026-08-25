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

function outputLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim());
}

/**
 * Keep single-line resource definitions compact while making structured,
 * multi-line compiler output unambiguously owned by its parent definition.
 * This matters for assignment-driven resources such as Texture/Material.
 */
function formatResourceDefinition(
  prefix: string,
  specification: string,
) {
  const lines = outputLines(specification);
  if (!lines.length) return "";
  if (lines.length === 1) return `${prefix}${lines[0]}`;

  return [
    prefix.trimEnd(),
    ...lines.map((line) => `  ${line}`),
  ].join("\n");
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

  return formatResourceDefinition(
    `• ${getModuleEntityVariableToken(module.key, entity)} = `,
    specification,
  );
}

function getCustomOverride(
  module: PromptKeyModule,
  globalValues: ModuleValues,
) {
  const overrideFieldId =
    module.compile?.overrideField ||
    Object.values(module.fields).find((field) => field.isOverride)?.id;
  const override = overrideFieldId ? globalValues[overrideFieldId] : "";

  return typeof override === "string" ? override.trim() : "";
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
 *
 * `preserveEntitiesInCustomMode` is intentionally opt-in. It supports modules
 * such as Lighting where Global/default custom mode changes only the global
 * presentation while Scene-referenced named configurations remain valid. The
 * default keeps existing adapter behavior (for example Background) unchanged.
 *
 * Structured compiler output is kept byte-for-byte at the semantic level. When
 * named resources are present, multi-line Global/default and entity output is
 * merely indented beneath its owning definition so nested assignment bullets
 * cannot be mistaken for sibling resource definitions.
 */
export function compileSceneResourceModule(
  module: PromptKeyModule,
  values: ModuleValues,
  options: {
    customMode?: boolean;
    referencedEntityIds?: string[];
    compileValues?: SceneResourceScalarCompiler;
    preserveGlobalOverride?: boolean;
    preserveEntitiesInCustomMode?: boolean;
  } = {},
) {
  const globalValues = getGlobalModuleValues(values);
  const globalOutput = options.customMode
    ? getCustomOverride(module, globalValues)
    : outputText(
        compileScalar(
          module,
          globalValues,
          options.compileValues,
          options.preserveGlobalOverride,
        ),
      );

  if (options.customMode && !options.preserveEntitiesInCustomMode) {
    return globalOutput;
  }

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

  const globalDefinition = globalOutput
    ? formatResourceDefinition(
        `• Global/default ${module.key}: `,
        globalOutput,
      )
    : "";

  return [globalDefinition, ...entityLines]
    .filter(Boolean)
    .join("\n");
}
