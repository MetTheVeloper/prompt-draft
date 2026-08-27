import type { PromptKeyModule, PromptVariable } from "../modules/types";
import type {
  ModuleOutputMap,
  PromptOutputFormat,
  PromptSettings,
} from "./compilePromptCore";
import {
  compilePromptOutputPure,
  type UserVariableOwnership,
} from "./compilePromptPure";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";
import { usePromptSubjectContext } from "~/composables/prompt/usePromptSubjectContext";

export * from "./compilePromptCore";

function getUserVariableOwnership(): UserVariableOwnership {
  const { enabledPromptVariables } = usePromptVariables();
  const variables = enabledPromptVariables.value;

  return {
    hasSubject: variables.some((variable) => variable.type === "subject"),
    hasReference: variables.some((variable) => variable.type === "reference"),
  };
}

function syncPromptRuntimeState(
  settings: PromptSettings,
  systemVariables: PromptVariable[],
) {
  const { setSystemPromptVariables } = usePromptVariables();
  const { setSubjectType } = usePromptSubjectContext();

  setSubjectType(settings.subjectType || "unspecified");
  setSystemPromptVariables(systemVariables);
}

export function compilePromptOutput(
  modules: PromptKeyModule[],
  outputs: ModuleOutputMap,
  settings: PromptSettings,
  format: PromptOutputFormat = "modular",
) {
  const result = compilePromptOutputPure(
    modules,
    outputs,
    settings,
    format,
    getUserVariableOwnership(),
  );

  syncPromptRuntimeState(result.effectiveSettings, result.systemVariables);

  return result.output;
}
