<script setup lang="ts">
import BlogArticlePresentation from '~/components/blog/BlogArticlePresentation.vue'
import type { GlobalMenuItem } from '~/composables/useMenu'

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
  focus?: (options?: FocusOptions) => void
}

type EditorRange = {
  start: number
  end: number
  selected: string
}

type TextFieldContextMenuContext = {
  value: string
  selectionStart: number
  selectionEnd: number
}

const editorField = ref<TextFieldHandle | null>(null)
const direction = computed(() => props.locale === 'fa' ? 'rtl' : 'ltr')

function getTextarea() {
  const element = editorField.value?.el
  if (!element || !('selectionStart' in element)) return null
  return element as HTMLTextAreaElement
}

function syncEditorHeight() {
  const element = getTextarea()
  if (!element) return

  element.style.height = 'auto'
  element.style.overflowY = 'hidden'
  element.style.resize = 'none'
  element.style.height = `${element.scrollHeight}px`
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
  syncEditorHeight()
  const element = getTextarea()
  editorField.value?.focus?.({ preventScroll: true })
  element?.setSelectionRange(range.start, range.start + replacement.length)
}

async function replaceSelection(
  transform: (selected: string) => string,
  range: EditorRange = currentRange(),
) {
  await replaceRange(range, transform(range.selected))
}

function wrap(
  prefix: string,
  suffix = prefix,
  fallback = 'text',
  range: EditorRange = currentRange(),
) {
  return replaceSelection(selected => `${prefix}${selected || fallback}${suffix}`, range)
}

function prefixLines(
  prefix: string,
  fallback = 'text',
  range: EditorRange = currentRange(),
) {
  return replaceSelection((selected) => {
    const source = selected || fallback
    return source.split('\n').map(line => `${prefix}${line}`).join('\n')
  }, range)
}

function escapeMarkdownText(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll('[', '\\[').replaceAll(']', '\\]')
}

function insertLink(range: EditorRange = currentRange()) {
  linkModal.open({
    initialLabel: range.selected,
    onInsert: ({ label, url }) => replaceRange(
      range,
      `[${escapeMarkdownText(label)}](${url})`,
    ),
  })
}

function insertImage(range: EditorRange = currentRange()) {
  mediaGallery.open({
    onSelect: (asset) => {
      imageAltModal.open({
        asset,
        initialAlt: range.selected.trim() || asset.alt,
        onInsert: alt => replaceRange(
          range,
          `![${escapeMarkdownText(alt)}](${asset.fullUrl})`,
        ),
      })
    },
  })
}

function markdownMenuItems(range: EditorRange): GlobalMenuItem[] {
  return [
    {
      type: 'header',
      label: t('manage.blog.markdown.toolbarLabel'),
    },
    {
      label: 'H2',
      handler: () => prefixLines('## ', 'Heading', range),
    },
    {
      label: 'H3',
      handler: () => prefixLines('### ', 'Heading', range),
    },
    {
      label: t('manage.blog.markdown.bold'),
      icon: 'format_bold',
      handler: () => wrap('**', '**', 'bold', range),
    },
    {
      label: t('manage.blog.markdown.italic'),
      icon: 'format_italic',
      handler: () => wrap('*', '*', 'italic', range),
    },
    {
      label: t('manage.blog.markdown.quote'),
      icon: 'format_quote',
      handler: () => prefixLines('> ', 'Quote', range),
    },
    {
      label: t('manage.blog.markdown.code'),
      icon: 'code',
      handler: () => wrap('`', '`', 'code', range),
    },
    {
      label: t('manage.blog.markdown.list'),
      icon: 'format_list_bulleted',
      handler: () => prefixLines('- ', 'List item', range),
    },
    {
      label: t('manage.blog.markdown.link'),
      icon: 'link',
      handler: () => insertLink(range),
    },
    {
      label: t('manage.blog.markdown.image'),
      icon: 'image',
      handler: () => insertImage(range),
    },
  ]
}

function markdownContextMenuItems(context: TextFieldContextMenuContext): GlobalMenuItem[] {
  const length = context.value.length
  const start = Math.min(Math.max(context.selectionStart, 0), length)
  const end = Math.min(Math.max(context.selectionEnd, start), length)

  return markdownMenuItems({
    start,
    end,
    selected: context.value.slice(start, end),
  })
}

watch(model, () => {
  void nextTick(syncEditorHeight)
}, { flush: 'post' })

onMounted(() => {
  void nextTick(syncEditorHeight)
})
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
      <el-button type="fab" mode="flat" icon="link" :tooltip="t('manage.blog.markdown.link')" @click="insertLink()" />
      <el-button type="fab" mode="flat" icon="image" :tooltip="t('manage.blog.markdown.image')" @click="insertImage()" />
    </el-flex>

    <el-grid
      cols="minmax(0, 1fr) minmax(0, 1fr)"
      :gap="12"
      align-items="start"
      class="w100 blog-markdown-panes"
    >
      <el-flex rules="css" :gap="6" class="w100">
        <el-text color="normal55" :size="11" :weight="700">
          {{ t('manage.blog.markdown.source') }}
        </el-text>
        <el-text-field
          ref="editorField"
          v-model="model"
          type="textarea"
          :rows="15"
          :actions="false"
          :context-menu-items="markdownContextMenuItems"
          :dir="direction"
          :placeholder="placeholder"
          spellcheck="true"
        />
      </el-flex>

      <el-flex rules="css" :gap="6" class="w100" :dir="direction">
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
          <BlogArticlePresentation
            v-if="model.trim()"
            :markdown="model"
            :dir="direction"
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
