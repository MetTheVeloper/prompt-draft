import { computed, ref } from "vue";
import type { ModuleSubjectType } from "~/modules/types";

const subjectType = ref<ModuleSubjectType>("unspecified");

export function usePromptSubjectContext() {
  const hasSpecificSubjectType = computed(() => {
    return subjectType.value !== "unspecified" && subjectType.value !== "custom";
  });

  function setSubjectType(value?: ModuleSubjectType | null) {
    subjectType.value = value || "unspecified";
  }

  function clearSubjectType() {
    subjectType.value = "unspecified";
  }

  return {
    subjectType,
    hasSpecificSubjectType,
    setSubjectType,
    clearSubjectType,
  };
}
