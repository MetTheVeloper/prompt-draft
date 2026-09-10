<script setup lang="ts">
const props = withDefaults(defineProps<{
  src: string
  alt?: string
  width?: number | null
  height?: number | null
  loading?: 'lazy' | 'eager'
}>(), {
  alt: '',
  width: null,
  height: null,
  loading: 'lazy',
})

const lightbox = useBlogImageLightbox()

function openImage() {
  lightbox.open({
    src: props.src,
    alt: props.alt,
  })
}
</script>

<template>
  <img
    :src="src"
    :alt="alt"
    :width="width || undefined"
    :height="height || undefined"
    :loading="loading"
    decoding="async"
    role="button"
    tabindex="0"
    class="blog-zoomable-image"
    @click="openImage"
    @keydown.enter.prevent="openImage"
    @keydown.space.prevent="openImage"
  >
</template>

<style scoped>
.blog-zoomable-image {
  cursor: zoom-in;
}
</style>
