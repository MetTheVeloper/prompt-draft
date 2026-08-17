import { computed, ref } from "vue"
import type {
  PromptVariable,
  PromptVariableGroup,
} from "~/modules/types"

const promptVariables = ref<PromptVariable[]>([])
const systemPromptVariables = ref<PromptVariable[]>([])
const moduleVariableGroups = ref<PromptVariableGroup[]>([])

function cloneVariables(variables: PromptVariable[]) {
  try {
    return JSON.parse(JSON.stringify(variables)) as PromptVariable[]
  } catch {
    return [...variables]
  }
}

function cloneGroups(groups: PromptVariableGroup[]) {
  try {
    return JSON.parse(JSON.stringify(groups)) as PromptVariableGroup[]
  } catch {
    return groups.map((group) => ({
      ...group,
      variables: cloneVariables(group.variables),
    }))
  }
}

function normalizeKey(key: string) {
  return key.trim().toLowerCase()
}

function enabledVariables(variables: PromptVariable[]) {
  return variables.filter((variable) => {
    return (
      variable.enabled !== false &&
      Boolean(variable.key?.trim()) &&
      Boolean(variable.value?.trim())
    )
  })
}

export function usePromptVariables() {
  const enabledPromptVariables = computed(() => {
    return enabledVariables(promptVariables.value)
  })

  const enabledSystemPromptVariables = computed(() => {
    return enabledVariables(systemPromptVariables.value)
  })

  const enabledModuleVariableGroups = computed(() => {
    return moduleVariableGroups.value
      .map((group) => ({
        ...group,
        variables: enabledVariables(group.variables),
      }))
      .filter((group) => group.variables.length > 0)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  })

  const enabledModulePromptVariables = computed(() => {
    return enabledModuleVariableGroups.value.flatMap(
      (group) => group.variables,
    )
  })

  const enabledPromptVariableKeys = computed(() => {
    return enabledPromptVariables.value.map((variable) => {
      return normalizeKey(variable.key)
    })
  })

  const activeSystemVariableKeys = computed(() => {
    return [
      ...enabledSystemPromptVariables.value,
      ...enabledModulePromptVariables.value,
    ].map((variable) => normalizeKey(variable.key))
  })

  const enabledVariablesWithSystem = computed(() => {
    const userKeys = new Set(enabledPromptVariableKeys.value)

    return [
      ...enabledPromptVariables.value,
      ...enabledModulePromptVariables.value.filter((variable) => {
        return !userKeys.has(normalizeKey(variable.key))
      }),
      ...enabledSystemPromptVariables.value.filter((variable) => {
        return !userKeys.has(normalizeKey(variable.key))
      }),
    ]
  })

  const variableGroups = computed<PromptVariableGroup[]>(() => {
    const groups: PromptVariableGroup[] = []

    if (enabledPromptVariables.value.length) {
      groups.push({
        id: "user",
        labelKey: "modules.variables.fields.variables.picker.tabs.user",
        label: "User",
        icon: "person",
        order: 0,
        source: "user",
        variables: enabledPromptVariables.value,
      })
    }

    groups.push(...enabledModuleVariableGroups.value)

    if (enabledSystemPromptVariables.value.length) {
      groups.push({
        id: "system",
        labelKey: "modules.variables.fields.variables.picker.tabs.system",
        label: "System",
        icon: "tune",
        order: 999,
        source: "system",
        variables: enabledSystemPromptVariables.value,
      })
    }

    return groups.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  })

  const hasPromptVariables = computed(() => {
    return enabledPromptVariables.value.length > 0
  })

  const hasSystemPromptVariables = computed(() => {
    return enabledSystemPromptVariables.value.length > 0
  })

  const hasInsertableVariables = computed(() => {
    return variableGroups.value.some((group) => group.variables.length > 0)
  })

  function setPromptVariables(variables: PromptVariable[]) {
    promptVariables.value = cloneVariables(variables)
  }

  function setSystemPromptVariables(variables: PromptVariable[]) {
    systemPromptVariables.value = cloneVariables(variables)
  }

  function setModuleVariableGroups(groups: PromptVariableGroup[]) {
    moduleVariableGroups.value = cloneGroups(groups)
  }

  function clearPromptVariables() {
    promptVariables.value = []
  }

  function clearSystemPromptVariables() {
    systemPromptVariables.value = []
  }

  function clearModuleVariableGroups() {
    moduleVariableGroups.value = []
  }

  function getVariableToken(key: string) {
    return `{${key}}`
  }

  function getVariableGroup(groupId: string) {
    return variableGroups.value.find((group) => group.id === groupId)
  }

  return {
    promptVariables,
    systemPromptVariables,
    moduleVariableGroups,
    enabledPromptVariables,
    enabledSystemPromptVariables,
    enabledModuleVariableGroups,
    enabledModulePromptVariables,
    enabledPromptVariableKeys,
    activeSystemVariableKeys,
    enabledVariablesWithSystem,
    variableGroups,
    hasPromptVariables,
    hasSystemPromptVariables,
    hasInsertableVariables,
    setPromptVariables,
    setSystemPromptVariables,
    setModuleVariableGroups,
    clearPromptVariables,
    clearSystemPromptVariables,
    clearModuleVariableGroups,
    getVariableToken,
    getVariableGroup,
  }
}
