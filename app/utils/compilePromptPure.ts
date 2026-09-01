import type {
  ModuleValues,
  PromptVariable,
  PromptKeyModule,
} from "../modules/types";
import type {
  ModuleOutputMap,
  ModuleOutputValue,
  PromptOutputFormat,
  PromptSettings,
} from "./compilePromptCore";
import {
  compilePromptOutput as compilePromptOutputCore,
  getSystemPromptVariables,
} from "./compilePromptCore";
import { rewritePromptFacingStructuredOutput } from "./promptOutputAliases";
import { createPromptIdentityRegistry } from "./promptIdentity";

export type UserVariableOwnership = {
  hasSubject: boolean;
  hasReference: boolean;
};

export type PurePromptCompileResult = {
  output: string;
  effectiveSettings: PromptSettings;
  systemVariables: PromptVariable[];
};

const SCENE_LAYOUT_RULE =
  "Match each scene's dimensions exactly to its corresponding region in {layout}.";

function hasOutput(value: ModuleOutputValue | undefined) {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return Boolean(value.trim());
  return true;
}

export function withAutomaticSceneLayoutRule(
  modules: PromptKeyModule[],
  outputs: ModuleOutputMap,
  settings: PromptSettings,
): PromptSettings {
  const hasScenes =
    modules.some((module) => module.key === "scene") && hasOutput(outputs.scene);
  const hasLayout =
    modules.some((module) => module.key === "layout") && hasOutput(outputs.layout);

  if (!hasScenes || !hasLayout) return settings;

  const existingRules = settings.globalRules.trim();
  const alreadyIncluded = existingRules
    .toLowerCase()
    .includes(SCENE_LAYOUT_RULE.toLowerCase());

  if (alreadyIncluded) return settings;

  return {
    ...settings,
    globalRules: [existingRules, SCENE_LAYOUT_RULE].filter(Boolean).join(" "),
  };
}

function filterOwnedSystemVariables(
  variables: PromptVariable[],
  ownership: UserVariableOwnership,
) {
  const suppressSubject = ownership.hasSubject || ownership.hasReference;

  return variables.filter((variable) => {
    if (suppressSubject && variable.key === "subject") return false;
    if (ownership.hasReference && variable.key === "reference") return false;
    return true;
  });
}

function removePromptDefinition(output: string, key: string) {
  const pattern = new RegExp(`^\\{${key}\\} = [^\\n]*(?:\\n|$)`, "gm");
  return output.replace(pattern, "");
}

export function applyUserVariableOwnership(
  output: string,
  format: PromptOutputFormat,
  ownership: UserVariableOwnership,
) {
  if (!output || format === "json") return output;

  let nextOutput = output;
  const suppressSubject = ownership.hasSubject || ownership.hasReference;

  if (suppressSubject) {
    nextOutput = removePromptDefinition(nextOutput, "subject");
  }

  if (ownership.hasReference) {
    nextOutput = removePromptDefinition(nextOutput, "reference");
  }

  return nextOutput.replace(/^\n+/, "").replace(/\n{3,}/g, "\n\n");
}

export function aliasScenePresentation(
  output: string,
  format: PromptOutputFormat,
) {
  if (!output) return output;

  if (format === "json") {
    try {
      const parsed = JSON.parse(output) as Record<string, unknown>;
      const modules = parsed.modules;

      if (modules && typeof modules === "object" && !Array.isArray(modules)) {
        const moduleRecord = modules as Record<string, unknown>;

        if (Object.prototype.hasOwnProperty.call(moduleRecord, "scene")) {
          const { scene, ...rest } = moduleRecord;
          parsed.modules = {
            ...rest,
            scenes: scene,
          };
        }
      }

      return JSON.stringify(parsed, null, 2);
    } catch {
      return output;
    }
  }

  if (format === "natural") {
    return output.replace(/(^|\n\n)Scene:\n(?=•\s+\{)/g, "$1Scenes:\n");
  }

  return output.replace(/(^|\n)\{scene\} =(?=\n•\s+\{)/g, "$1{scenes} =");
}

export function compilePromptOutputPure(
  modules: PromptKeyModule[],
  outputs: ModuleOutputMap,
  settings: PromptSettings,
  format: PromptOutputFormat = "modular",
  ownership: UserVariableOwnership = {
    hasSubject: false,
    hasReference: false,
  },
  moduleValues: Record<string, ModuleValues> = {},
): PurePromptCompileResult {
  const effectiveSettings = withAutomaticSceneLayoutRule(
    modules,
    outputs,
    settings,
  );
  const allSystemVariables = getSystemPromptVariables(
    effectiveSettings,
  ) as PromptVariable[];
  const systemVariables = filterOwnedSystemVariables(
    allSystemVariables,
    ownership,
  );
  const identityRegistry = createPromptIdentityRegistry({
    modules,
    moduleValues,
    outputs,
    reservedKeys: allSystemVariables.map((variable) => variable.key),
  });
  const compiled = compilePromptOutputCore(
    modules,
    outputs,
    effectiveSettings,
    format,
  );
  const ownershipAdjustedOutput = applyUserVariableOwnership(
    compiled,
    format,
    ownership,
  );
  const semanticOutput = rewritePromptFacingStructuredOutput(
    ownershipAdjustedOutput,
    outputs,
    format,
    JSON.stringify(effectiveSettings),
    {
      modules,
      moduleValues,
      reservedKeys: allSystemVariables.map((variable) => variable.key),
      registry: identityRegistry,
    },
  );

  return {
    output: aliasScenePresentation(semanticOutput, format),
    effectiveSettings,
    systemVariables,
  };
}
