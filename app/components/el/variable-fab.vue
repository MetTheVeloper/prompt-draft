<script setup lang="ts">
import { computed } from "vue";

import { usePromptEditor } from "~/composables/prompt/usePromptEditor";
import { useVariablePickerModal } from "~/composables/prompt/useVariablePickerModal";

const { t } = useI18n();
const { mobile } = useScreen();

const { hasActiveEditor } = usePromptEditor();
const { enabledPromptVariables, openVariablePicker } = useVariablePickerModal();

const showFab = computed(() => {
  return hasActiveEditor.value && enabledPromptVariables.value.length > 0;
});
</script>

<template>
  <Teleport to="body">
    <el-button
      v-if="showFab"
      :label="t('components.modal.insertVariable')"
      icon="code"
      :type="mobile ? 'fab' : 'normal'"
      color="prim"
      tooltip-position="left"
      :size="14"
      class="variable-fab"
      @click="openVariablePicker"
    />
  </Teleport>
</template>

<style scoped>
.variable-fab {
  position: fixed;
  right: max(16px, env(safe-area-inset-right));
  bottom: max(16px, env(safe-area-inset-bottom));
  z-index: 900;
}

</style>
