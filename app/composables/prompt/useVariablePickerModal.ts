import VariablePickerModal from "~/components/modals/VariablePickerModal.vue";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";

export function useVariablePickerModal() {
  const { t } = useI18n();
  const modal = useModal();
  const { enabledPromptVariables } = usePromptVariables();

  function openVariablePicker() {
    if (!enabledPromptVariables.value.length) return false;

    modal.open({
      header: {
        icon: "code",
        title: t("components.modal.title.insertVariable"),
        subtitle: t("components.modal.title.insertVariableSubtitle"),
        color: "blue",
      },
      component: VariablePickerModal,
      props: {
        variables: enabledPromptVariables.value,
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
    openVariablePicker,
  };
}