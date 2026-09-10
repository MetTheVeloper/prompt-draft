<script setup lang="ts">
defineProps<{
  src: string
  alt?: string
}>()

defineEmits<{
  close: []
}>()
</script>

<template>
  <el-flex rules="ccc" class="w100 blog-image-lightbox">
    <img
      :src="src"
      :alt="alt || ''"
      decoding="async"
      class="blog-image-lightbox-image"
      @click="$emit('close')"
    >
  </el-flex>
</template>

<style scoped>
.blog-image-lightbox {
  min-height: 0;
}

.blog-image-lightbox-image {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: calc(100vh - 152px);
  object-fit: contain;
  border-radius: 14px;
  cursor: zoom-out;
}
</style>
