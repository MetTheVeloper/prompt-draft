import { readonly, ref } from "vue";
import type { PromptOutputFormat } from "~/utils/compilePrompt";

const activePromptOutputFormat = ref<PromptOutputFormat>("modular");

export function usePromptOutputFormat() {
  function setPromptOutputFormat(format: PromptOutputFormat) {
    activePromptOutputFormat.value = format;
  }

  return {
    outputFormat: readonly(activePromptOutputFormat),
    setPromptOutputFormat,
  };
}
