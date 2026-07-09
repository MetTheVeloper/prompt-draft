import { computed, ref } from "vue";
import type { PromptVariable } from "~/modules/types";

const promptVariables = ref<PromptVariable[]>([]);
const systemPromptVariables = ref<PromptVariable[]>([]);

function cloneVariables(variables: PromptVariable[]) {
  try {
    return JSON.parse(JSON.stringify(variables)) as PromptVariable[];
  } catch {
    return [...variables];
  }
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase();
}

export function usePromptVariables() {
  const enabledPromptVariables = computed(() => {
    return promptVariables.value.filter((variable) => {
      return variable.enabled !== false && variable.key?.trim() && variable.value?.trim();
    });
  });

  const enabledSystemPromptVariables = computed(() => {
    return systemPromptVariables.value.filter((variable) => {
      return variable.enabled !== false && variable.key?.trim() && variable.value?.trim();
    });
  });

  const enabledPromptVariableKeys = computed(() => {
    return enabledPromptVariables.value.map((variable) => normalizeKey(variable.key));
  });

  const activeSystemVariableKeys = computed(() => {
    return enabledSystemPromptVariables.value.map((variable) => normalizeKey(variable.key));
  });

  const enabledVariablesWithSystem = computed(() => {
    const userKeys = new Set(enabledPromptVariableKeys.value);

    return [
      ...enabledPromptVariables.value,
      ...enabledSystemPromptVariables.value.filter((variable) => {
        return !userKeys.has(normalizeKey(variable.key));
      }),
    ];
  });

  const hasPromptVariables = computed(() => enabledPromptVariables.value.length > 0);
  const hasSystemPromptVariables = computed(() => enabledSystemPromptVariables.value.length > 0);
  const hasInsertableVariables = computed(() => enabledVariablesWithSystem.value.length > 0);

  function setPromptVariables(variables: PromptVariable[]) {
    promptVariables.value = cloneVariables(variables);
  }

  function setSystemPromptVariables(variables: PromptVariable[]) {
    systemPromptVariables.value = cloneVariables(variables);
  }

  function clearPromptVariables() {
    promptVariables.value = [];
  }

  function clearSystemPromptVariables() {
    systemPromptVariables.value = [];
  }

  function getVariableToken(key: string) {
    return `{${key}}`;
  }

  return {
    promptVariables,
    systemPromptVariables,
    enabledPromptVariables,
    enabledSystemPromptVariables,
    enabledPromptVariableKeys,
    activeSystemVariableKeys,
    enabledVariablesWithSystem,
    hasPromptVariables,
    hasSystemPromptVariables,
    hasInsertableVariables,
    setPromptVariables,
    setSystemPromptVariables,
    clearPromptVariables,
    clearSystemPromptVariables,
    getVariableToken,
  };
}
