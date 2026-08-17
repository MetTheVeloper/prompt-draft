<script setup lang="ts">
import type { ImageConverterImageItem } from '~/types/imageConverter'

const props = withDefaults(
  defineProps<{
    items?: ImageConverterImageItem[]
    onRemove?: (id: string) => void
  }>(),
  {
    items: () => [],
    onRemove: undefined,
  },
)

const visibleItems = ref<ImageConverterImageItem[]>([...props.items])

watch(
  () => props.items,
  (items) => {
    visibleItems.value = [...items]
  },
)

function removeItem(id: string) {
  visibleItems.value = visibleItems.value.filter((item) => item.id !== id)
  props.onRemove?.(id)
}
</script>

<template>
  <div class="image-converter-files-modal">
    <div v-if="visibleItems.length" class="image-converter-files-grid">
      <div v-for="item in visibleItems" :key="item.id" class="image-converter-file-card">
        <img :src="item.url" :alt="item.name" class="image-converter-file-image" />

        <el-button
          class="image-converter-file-remove"
          type="fab"
          mode="normal"
          color="red"
          icon="delete"
          :size="18"
          :p="10"
          :label="$t('tools.imageConverter.preview.remove')"
          @click="removeItem(item.id)"
        />
      </div>
    </div>

    <el-flex v-else rules="ccc" :gap="10" :p="24" bg="normal5" :radius="18">
      <el-icon icon="delete" :size="28" />
      <el-text :size="13" :weight="400">
        {{ $t('tools.imageConverter.preview.empty') }}
      </el-text>
    </el-flex>
  </div>
</template>

<style scoped>
.image-converter-files-modal {
  width: 100%;
}

.image-converter-files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 12px;
}

.image-converter-file-card {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1;
  border-radius: 18px;
  background: color-mix(in srgb, currentColor 5%, transparent);
}

.image-converter-file-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-converter-file-remove {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 12px 40px rgb(0 0 0 / 35%);
}
</style>
