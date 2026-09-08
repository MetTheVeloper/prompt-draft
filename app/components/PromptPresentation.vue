<script setup lang="ts">
import PromptsPromptPresentation from './prompts/PromptPresentation.vue'

defineOptions({ inheritAttrs: false })
</script>

<template>
  <PromptsPromptPresentation v-bind="$attrs">
    <template #topbar-leading>
      <slot name="topbar-leading" />
    </template>

    <template #meta>
      <slot name="meta" />
    </template>

    <template #actions>
      <slot name="actions" />
    </template>

    <template #status>
      <slot name="status" />
    </template>

    <template #scroll-cue>
      <slot name="scroll-cue" />
    </template>
  </PromptsPromptPresentation>
</template>
