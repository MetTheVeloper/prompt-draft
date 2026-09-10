<script setup lang="ts">
import type { BlogMediaAsset } from '~/types/blogMedia'

const props = withDefaults(defineProps<{
  asset: BlogMediaAsset
  initialAlt?: string
  onInsert?: (alt: string) => void | Promise<void>
}>(), {
  initialAlt: '',
  onInsert: undefined,
})

const modal = useModal()
const { t } = useI18n()
const alt = ref(props.initialAlt || props.asset.alt || '')
const error = ref('')

async function submit() {
  const normalized = alt.value.trim()
  if (!normalized) {
    error.value = t('manage.blog.markdown.imageAltRequired')
    return
  }
  error.value = ''
  await props.onInsert?.(normalized)
  modal.close()
}
</script>

<template>
  <el-flex rules="csc" :gap="14" class="w100">
    <img
      :src="asset.thumbnailUrl || asset.fullUrl"
      :alt="alt || asset.alt || asset.sourceName"
      class="blog-image-alt-preview"
    >

    <el-flex rules="ccs" :gap="6" class="w100">
      <el-text :size="11" :weight="700">
        {{ t('manage.blog.markdown.imageAlt') }}
      </el-text>
      <el-text-field
        v-model="alt"
        :actions="false"
        :placeholder="t('manage.blog.markdown.imageAltPlaceholder')"
        @input="error = ''"
      />
      <el-text v-if="error" color="red" :size="10">
        {{ error }}
      </el-text>
    </el-flex>

    <el-flex rules="rbc" :gap="8" class="w100">
      <el-button
        :label="t('manage.blog.actions.cancel')"
        mode="flat"
        @click="modal.close()"
      />
      <el-button
        icon="image"
        :label="t('manage.blog.markdown.insertImage')"
        color="prim"
        @click="submit"
      />
    </el-flex>
  </el-flex>
</template>

<style scoped>
.blog-image-alt-preview {
  display: block;
  max-width: 100%;
  max-height: 280px;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 12px;
}
</style>
