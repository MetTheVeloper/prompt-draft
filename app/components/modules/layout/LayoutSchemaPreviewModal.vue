<script setup lang="ts">
import { onBeforeUnmount } from "vue"

const props = withDefaults(
  defineProps<{
    imageUrl: string
    alt?: string
    onDispose?: () => void
  }>(),
  {
    alt: "",
  },
)

onBeforeUnmount(() => {
  props.onDispose?.()
})
</script>

<template>
  <el-flex
    rules="ccc"
    class="layout-schema-preview w100"
    :p="12"
    :radius="16"
  >
    <img
      :src="imageUrl"
      :alt="alt"
      class="layout-schema-preview__image"
    />
  </el-flex>
</template>

<style scoped>
.layout-schema-preview {
  min-height: 260px;
  overflow: auto;
  background: var(--themeBackground);
}

.layout-schema-preview__image {
  display: block;
  max-width: 100%;
  max-height: min(68vh, 760px);
  object-fit: contain;
  border: 1px solid var(--normalText15);
  border-radius: 10px;
  background: var(--themeSurface);
}
</style>
