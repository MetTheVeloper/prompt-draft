<script setup lang="ts">
import { computed } from 'vue'
import VariablePickerModal from '~/components/modals/VariablePickerModal.vue'

import { usePromptEditor } from "~/composables/prompt/usePromptEditor";
import { usePromptVariables } from "~/composables/prompt/usePromptVariables";

const modal = useModal()
const { hasActiveEditor } = usePromptEditor()
const { enabledPromptVariables } = usePromptVariables()

const showFab = computed(() => {
  return hasActiveEditor.value && enabledPromptVariables.value.length > 0
})

function openVariablePicker() {
  if (!showFab.value) return

  modal.open({
    header: {
      icon: 'code',
      title: 'Insert variable',
      subtitle: 'Choose a variable to insert at the cursor position',
      color: 'blue',
    },
    component: VariablePickerModal,
    props: {
      variables: enabledPromptVariables.value,
    },
    actions: [
      {
        label: 'modal.actions.close',
        color: 'normal',
        mode: 'flat',
        icon: 'close-circle',
        size: 14,
        close: true,
      },
    ],
    options: {
      width: 560,
      closeOnBackdrop: true,
      closeOnEsc: true,
      blur: true,
    },
  })
}
</script>

<template>
  <Teleport to="body">
    <el-button
      v-if="showFab"
      label="Insert variable"
      icon="code"
      type="fab"
      color="prim"
      tooltip-position="left"
      :size="16"
      class="variable-fab"
      @click="openVariablePicker" />
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
