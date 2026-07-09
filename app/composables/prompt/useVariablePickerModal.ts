import VariablePickerModal from "~/components/modals/VariablePickerModal.vue";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";
import type { PromptVariable } from "~/modules/types";

type VariablePickerModalOpenOptions = {
  variables?: PromptVariable[];
  systemVariables?: PromptVariable[];
  force?: boolean;
  insertOnSelect?: boolean;
  closeOnSelect?: boolean;
  onSelect?: (variable: PromptVariable) => void;
};

function hasVisibleVariables(variables: PromptVariable[]) {
  return variables.some((variable) => {
    return variable.enabled !== false && !!String(variable.key || "").trim();
  });
}

export function useVariablePickerModal() {
  const { t } = useI18n();
  const modal = useModal();
  const {
    enabledPromptVariables,
    enabledSystemPromptVariables,
    hasInsertableVariables,
  } = usePromptVariables();

  function openVariablePicker(options: VariablePickerModalOpenOptions = {}) {
    const variables = Array.isArray(options.variables)
      ? options.variables
      : enabledPromptVariables.value;

    const systemVariables = Array.isArray(options.systemVariables)
      ? options.systemVariables
      : enabledSystemPromptVariables.value;

    const hasVariables = hasVisibleVariables(variables) || hasVisibleVariables(systemVariables);

    if (!options.force && !hasInsertableVariables.value) return false;
    if (!options.force && !hasVariables) return false;

    modal.open({
      header: {
        icon: "code",
        title: t("components.modal.title.insertVariable"),
        subtitle: t("components.modal.title.insertVariableSubtitle"),
        color: "blue",
      },
      component: VariablePickerModal,
      props: {
        variables,
        systemVariables,
        insertOnSelect: options.insertOnSelect !== false,
        closeOnSelect: options.closeOnSelect !== false,
        onSelect: options.onSelect,
      },
      options: {
        width: 560,
        closeOnBackdrop: true,
        closeOnEsc: true,
        blur: true,
      },
    });

    return true;
  }

  return {
    enabledPromptVariables,
    enabledSystemPromptVariables,
    hasInsertableVariables,
    openVariablePicker,
  };
}
