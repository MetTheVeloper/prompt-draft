import VariablePickerModal from "~/components/modals/VariablePickerModal.vue"
import { usePromptVariables } from "~/composables/prompt/usePromptVariables"
import type {
  PromptVariable,
  PromptVariableGroup,
} from "~/modules/types"

export type VariablePickerModalOpenOptions = {
  groups?: PromptVariableGroup[]
  variables?: PromptVariable[]
  systemVariables?: PromptVariable[]
  groupIds?: string[]
  excludeKeys?: string[]
  force?: boolean
  insertOnSelect?: boolean
  closeOnSelect?: boolean
  onSelect?: (variable: PromptVariable) => void
}

function hasVisibleVariables(groups: PromptVariableGroup[]) {
  return groups.some((group) => {
    return group.variables.some((variable) => {
      return variable.enabled !== false && Boolean(variable.key?.trim())
    })
  })
}

function cloneGroups(groups: PromptVariableGroup[]) {
  return groups.map((group) => ({
    ...group,
    variables: group.variables.map((variable) => ({ ...variable })),
  }))
}

export function useVariablePickerModal() {
  const { t } = useI18n()
  const modal = useModal()
  const {
    enabledPromptVariables,
    enabledSystemPromptVariables,
    enabledModuleVariableGroups,
    variableGroups,
    hasInsertableVariables,
  } = usePromptVariables()

  function resolveGroups(options: VariablePickerModalOpenOptions) {
    let groups: PromptVariableGroup[]

    if (Array.isArray(options.groups)) {
      groups = cloneGroups(options.groups)
    } else if (
      Array.isArray(options.variables) ||
      Array.isArray(options.systemVariables)
    ) {
      groups = []

      const userVariables = Array.isArray(options.variables)
        ? options.variables
        : enabledPromptVariables.value

      const systemVariables = Array.isArray(options.systemVariables)
        ? options.systemVariables
        : enabledSystemPromptVariables.value

      if (userVariables.length) {
        groups.push({
          id: "user",
          labelKey: "modules.variables.fields.variables.picker.tabs.user",
          label: "User",
          order: 0,
          source: "user",
          variables: userVariables,
        })
      }

      if (systemVariables.length) {
        groups.push({
          id: "system",
          labelKey: "modules.variables.fields.variables.picker.tabs.system",
          label: "System",
          order: 999,
          source: "system",
          variables: systemVariables,
        })
      }
    } else {
      groups = cloneGroups(variableGroups.value)
    }

    const allowedGroups = Array.isArray(options.groupIds)
      ? new Set(options.groupIds)
      : null

    const excludedKeys = new Set(
      (options.excludeKeys || []).map((key) => key.trim().toLowerCase()),
    )

    return groups
      .filter((group) => !allowedGroups || allowedGroups.has(group.id))
      .map((group) => ({
        ...group,
        variables: group.variables.filter((variable) => {
          return !excludedKeys.has(variable.key.trim().toLowerCase())
        }),
      }))
      .filter((group) => group.variables.length > 0)
  }

  function openVariablePicker(options: VariablePickerModalOpenOptions = {}) {
    const groups = resolveGroups(options)

    if (!options.force && !hasInsertableVariables.value) return false
    if (!options.force && !hasVisibleVariables(groups)) return false

    modal.open({
      header: {
        icon: "code",
        title: t("components.modal.title.insertVariable"),
        subtitle: t("components.modal.title.insertVariableSubtitle"),
        color: "blue",
      },
      component: VariablePickerModal,
      props: {
        groups,
        insertOnSelect: options.insertOnSelect !== false,
        closeOnSelect: options.closeOnSelect !== false,
        onSelect: options.onSelect,
      },
      options: {
        width: 640,
        closeOnBackdrop: true,
        closeOnEsc: true,
        blur: true,
      },
    })

    return true
  }

  return {
    enabledPromptVariables,
    enabledSystemPromptVariables,
    enabledModuleVariableGroups,
    variableGroups,
    hasInsertableVariables,
    openVariablePicker,
  }
}
