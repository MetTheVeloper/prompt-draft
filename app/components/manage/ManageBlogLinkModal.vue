<script setup lang="ts">
import { normalizeBlogPublicUrl } from '~/shared/blog-article'

const props = withDefaults(defineProps<{
  initialLabel?: string
  onInsert?: (value: { label: string; url: string }) => void | Promise<void>
}>(), {
  initialLabel: '',
  onInsert: undefined,
})

const modal = useModal()
const { t } = useI18n()
const label = ref(props.initialLabel)
const url = ref('')
const error = ref('')

function normalizedDestination() {
  const normalized = normalizeBlogPublicUrl(url.value)
  if (!normalized || /\s/.test(normalized)) return null
  return normalized.replaceAll(')', '%29')
}

async function submit() {
  const normalizedLabel = label.value.trim()
  const normalizedUrl = normalizedDestination()

  if (!normalizedLabel) {
    error.value = t('manage.blog.markdown.linkLabelRequired')
    return
  }

  if (!normalizedUrl) {
    error.value = t('manage.blog.markdown.linkUrlInvalid')
    return
  }

  error.value = ''
  await props.onInsert?.({ label: normalizedLabel, url: normalizedUrl })
  modal.close()
}
</script>

<template>
  <el-flex rules="csc" :gap="14" class="w100">
    <el-flex rules="ccs" :gap="6" class="w100">
      <el-text :size="11" :weight="700">
        {{ t('manage.blog.markdown.linkLabel') }}
      </el-text>
      <el-text-field
        v-model="label"
        :actions="false"
        :placeholder="t('manage.blog.markdown.linkLabelPlaceholder')"
      />
    </el-flex>

    <el-flex rules="ccs" :gap="6" class="w100">
      <el-text :size="11" :weight="700">
        {{ t('manage.blog.markdown.linkUrl') }}
      </el-text>
      <el-text-field
        v-model="url"
        :actions="false"
        dir="ltr"
        placeholder="https://example.com"
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
        icon="link"
        :label="t('manage.blog.markdown.insertLink')"
        color="prim"
        @click="submit"
      />
    </el-flex>
  </el-flex>
</template>
