import { computed, ref } from "vue";
import type { PromptVariable } from "~/modules/types";

const promptVariables = ref<PromptVariable[]>([]);

function cloneVariables(variables: PromptVariable[]) {
  try {
    return JSON.parse(JSON.stringify(variables)) as PromptVariable[];
  } catch {
    return [...variables];
  }
}

export function usePromptVariables() {
  const enabledPromptVariables = computed(() => {
    return promptVariables.value.filter((variable) => {
      return variable.enabled !== false && variable.key?.trim() && variable.value?.trim();
    });
  });

  const hasPromptVariables = computed(() => enabledPromptVariables.value.length > 0);

  function setPromptVariables(variables: PromptVariable[]) {
    promptVariables.value = cloneVariables(variables);
  }

  function clearPromptVariables() {
    promptVariables.value = [];
  }

  function getVariableToken(key: string) {
    return `{${key}}`;
  }

  return {
    promptVariables,
    enabledPromptVariables,
    hasPromptVariables,
    setPromptVariables,
    clearPromptVariables,
    getVariableToken,
  };
}