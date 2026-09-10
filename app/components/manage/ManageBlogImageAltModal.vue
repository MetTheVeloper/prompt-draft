<script setup lang="ts">
const props = withDefaults(defineProps<{
  initialAlt?: string
  onInsert?: (alt: string) => void | Promise<void>
}>(), {
  initialAlt: '',
  onInsert: undefined,
})

const modal = useModal()
const { t } = useI18n()
const alt = ref(props.initialAlt)
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
    <el-flex rules="ccs" :gap="6" class="w100">
      <el-text :size="11" :weight="700">
        {{ t('manage.blog.markdown.imageAlt') }}
      </el-text>
      <el-text-field
        v-model="alt"
        :actions="false"
        :placeholder="t('manage.blog.markdown.imageAltPlaceholder')"
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
