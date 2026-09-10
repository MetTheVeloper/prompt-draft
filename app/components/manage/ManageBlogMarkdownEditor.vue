<script setup lang="ts">
const props = withDefaults(defineProps<{
  locale: 'en' | 'fa'
  placeholder?: string
}>(), {
  placeholder: '',
})

const { t } = useI18n()
const model = defineModel<string>({ default: '' })
const linkModal = useBlogLinkModal()
const mediaGallery = useMediaGalleryModal()
const imageAltModal = useBlogImageAltModal()

type TextFieldHandle = {
  el?: HTMLInputElement | HTMLTextAreaElement | null
  focus?: () => void
}

type EditorRange = {
  start: number
  end: number
  selected: string
}

const editorField = ref<TextFieldHandle | null>(null)
const previewHtml = computed(() => renderPublicBlogMarkdown(model.value))
const direction = computed(() => props.locale === 'fa' ? 'rtl' : 'ltr')

function getTextarea() {
  const element = editorField.value?.el
  if (!element || !('selectionStart' in element)) return null
  return element as HTMLTextAreaElement
}

function currentRange(): EditorRange {
  const element = getTextarea()
  if (!element) {
    return { start: model.value.length, end: model.value.length, selected: '' }
  }

  const start = element.selectionStart ?? 0
  const end = element.selectionEnd ?? start
  return {
    start,
    end,
    selected: model.value.slice(start, end),
  }
}

async function replaceRange(range: Pick<EditorRange, 'start' | 'end'>, replacement: string) {
  model.value = `${model.value.slice(0, range.start)}${replacement}${model.value.slice(range.end)}`

  await nextTick()
  const element = getTextarea()
  editorField.value?.focus?.()
  element?.setSelectionRange(range.start, range.start + replacement.length)
}

async function replaceSelection(transform: (selected: string) => string) {
  const range = currentRange()
  await replaceRange(range, transform(range.selected))
}

function wrap(prefix: string, suffix = prefix, fallback = 'text') {
  return replaceSelection(selected => `${prefix}${selected || fallback}${suffix}`)
}

function prefixLines(prefix: string, fallback = 'text') {
  return replaceSelection((selected) => {
    const source = selected || fallback
    return source.split('\n').map(line => `${prefix}${line}`).join('\n')
  })
}

function escapeMarkdownText(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll('[', '\\[').replaceAll(']', '\\]')
}

function insertLink() {
  const range = currentRange()
  linkModal.open({
    initialLabel: range.selected,
    onInsert: ({ label, url }) => replaceRange(
      range,
      `[${escapeMarkdownText(label)}](${url})`,
    ),
  })
}

function insertImage() {
  const range = currentRange()
  mediaGallery.open({
    onSelect: (asset) => {
      imageAltModal.open({
        initialAlt: range.selected.trim(),
        onInsert: alt => replaceRange(
          range,
          `![${escapeMarkdownText(alt)}](${asset.fullUrl})`,
        ),
      })
    },
  })
}
</script>

<template>
  <el-flex rules="csc" :gap="10" class="w100">
    <el-flex
      rules="rsc"
      :gap="6"
      class="w100 fw"
      role="toolbar"
      :aria-label="t('manage.blog.markdown.toolbarLabel')"
    >
      <el-button mode="flat" label="H2" @click="prefixLines('## ', 'Heading')" />
      <el-button mode="flat" label="H3" @click="prefixLines('### ', 'Heading')" />
      <el-button type="fab" mode="flat" icon="format_bold" :tooltip="t('manage.blog.markdown.bold')" @click="wrap('**', '**', 'bold')" />
      <el-button type="fab" mode="flat" icon="format_italic" :tooltip="t('manage.blog.markdown.italic')" @click="wrap('*', '*', 'italic')" />
      <el-button type="fab" mode="flat" icon="format_quote" :tooltip="t('manage.blog.markdown.quote')" @click="prefixLines('> ', 'Quote')" />
      <el-button type="fab" mode="flat" icon="code" :tooltip="t('manage.blog.markdown.code')" @click="wrap('`', '`', 'code')" />
      <el-button type="fab" mode="flat" icon="format_list_bulleted" :tooltip="t('manage.blog.markdown.list')" @click="prefixLines('- ', 'List item')" />
      <el-button type="fab" mode="flat" icon="link" :tooltip="t('manage.blog.markdown.link')" @click="insertLink" />
      <el-button type="fab" mode="flat" icon="image" :tooltip="t('manage.blog.markdown.image')" @click="insertImage" />
    </el-flex>

    <el-grid
      cols="minmax(0, 1fr) minmax(0, 1fr)"
      :gap="12"
      class="w100 blog-markdown-panes"
    >
      <el-flex rules="ccs" :gap="6" class="w100">
        <el-text color="normal55" :size="11" :weight="700">
          {{ t('manage.blog.markdown.source') }}
        </el-text>
        <el-text-field
          ref="editorField"
          v-model="model"
          type="textarea"
          :rows="15"
          :actions="false"
          :dir="direction"
          :placeholder="placeholder"
          spellcheck="true"
        />
      </el-flex>

      <el-flex rules="ccs" :gap="6" class="w100" :dir="direction">
        <el-text color="normal55" :size="11" :weight="700">
          {{ t('manage.blog.markdown.preview') }}
        </el-text>

        <el-flex
          rules="css"
          :gap="8"
          :p="14"
          bg="normal5"
          :radius="12"
          :br="1"
          bc="normal15"
          class="w100 blog-markdown-preview-shell"
        >
          <div
            v-if="previewHtml"
            class="blog-markdown-preview w100"
            v-html="previewHtml"
          />
          <el-text v-else color="normal40" :size="12">
            {{ t('manage.blog.markdown.emptyPreview') }}
          </el-text>
        </el-flex>
      </el-flex>
    </el-grid>
  </el-flex>
</template>

<style scoped>
.blog-markdown-preview-shell {
  min-height: 360px;
  overflow-wrap: anywhere;
}

.blog-markdown-preview {
  color: var(--normalText);
  line-height: 1.8;
}

.blog-markdown-preview :deep(a) {
  color: var(--primary);
}

.blog-markdown-preview :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
}

.blog-markdown-preview :deep(pre) {
  overflow: auto;
  padding: 12px;
  border-radius: 10px;
  background: var(--normalText5);
}

@media (max-width: 980px) {
  .blog-markdown-panes {
    grid-template-columns: 1fr !important;
  }

  .blog-markdown-preview-shell {
    min-height: 260px;
  }
}
</style>
