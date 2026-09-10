<script setup lang="ts">
const props = withDefaults(defineProps<{
  locale: 'en' | 'fa'
  placeholder?: string
}>(), {
  placeholder: '',
})

const model = defineModel<string>({ default: '' })
const textarea = ref<HTMLTextAreaElement | null>(null)
const previewHtml = computed(() => renderPublicBlogMarkdown(model.value))
const direction = computed(() => props.locale === 'fa' ? 'rtl' : 'ltr')

async function replaceSelection(transform: (selected: string) => string) {
  const element = textarea.value
  if (!element) return

  const start = element.selectionStart ?? 0
  const end = element.selectionEnd ?? start
  const selected = model.value.slice(start, end)
  const replacement = transform(selected)
  model.value = `${model.value.slice(0, start)}${replacement}${model.value.slice(end)}`

  await nextTick()
  element.focus()
  element.setSelectionRange(start, start + replacement.length)
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

function insertLink() {
  return replaceSelection(selected => `[${selected || 'label'}](https://example.com)`)
}

function insertImage() {
  return replaceSelection(selected => `![${selected || 'alt text'}](https://example.com/image.webp)`)
}
</script>

<template>
  <div class="blog-markdown-editor">
    <div class="blog-markdown-editor__toolbar" role="toolbar" aria-label="Markdown formatting">
      <button type="button" @click="prefixLines('## ', 'Heading')">H2</button>
      <button type="button" @click="prefixLines('### ', 'Heading')">H3</button>
      <button type="button" @click="wrap('**', '**', 'bold')"><strong>B</strong></button>
      <button type="button" @click="wrap('*', '*', 'italic')"><em>I</em></button>
      <button type="button" @click="prefixLines('> ', 'Quote')">❝</button>
      <button type="button" @click="wrap('`', '`', 'code')">&lt;/&gt;</button>
      <button type="button" @click="prefixLines('- ', 'List item')">• List</button>
      <button type="button" @click="insertLink">Link</button>
      <button type="button" @click="insertImage">Image</button>
    </div>

    <div class="blog-markdown-editor__panes">
      <label class="blog-markdown-editor__pane">
        <span class="blog-markdown-editor__label">Markdown</span>
        <textarea
          ref="textarea"
          v-model="model"
          :dir="direction"
          :placeholder="placeholder"
          spellcheck="true"
        />
      </label>

      <section class="blog-markdown-editor__pane" :dir="direction">
        <span class="blog-markdown-editor__label">Preview</span>
        <div
          v-if="previewHtml"
          class="blog-markdown-editor__preview"
          v-html="previewHtml"
        />
        <div v-else class="blog-markdown-editor__empty">Nothing to preview yet.</div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.blog-markdown-editor {
  display: grid;
  gap: 10px;
  width: 100%;
  color: var(--normalText);
}

.blog-markdown-editor__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.blog-markdown-editor__toolbar button {
  border: 1px solid var(--normalText15);
  border-radius: 8px;
  background: var(--normalText5);
  color: var(--normalText);
  padding: 6px 9px;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
}

.blog-markdown-editor__toolbar button:hover {
  background: var(--normalText10);
}

.blog-markdown-editor__panes {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}

.blog-markdown-editor__pane {
  display: grid;
  align-content: start;
  gap: 6px;
  min-width: 0;
}

.blog-markdown-editor__label {
  color: var(--normalText55);
  font-size: 12px;
  font-weight: 700;
}

.blog-markdown-editor textarea,
.blog-markdown-editor__preview,
.blog-markdown-editor__empty {
  min-height: 360px;
  border: 1px solid var(--normalText15);
  border-radius: 12px;
  background: var(--normalText5);
  color: var(--normalText);
  padding: 14px;
}

.blog-markdown-editor textarea {
  width: 100%;
  resize: vertical;
  outline: none;
  font: 500 13px/1.75 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.blog-markdown-editor textarea:focus {
  border-color: var(--primary);
  background: var(--normalText10);
  box-shadow: 0 0 0 3px var(--primary15);
}

.blog-markdown-editor__preview {
  overflow-wrap: anywhere;
  line-height: 1.8;
}

.blog-markdown-editor__preview :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
}

.blog-markdown-editor__preview :deep(pre) {
  overflow: auto;
  padding: 12px;
  border-radius: 10px;
  background: var(--normalText5);
}

.blog-markdown-editor__empty {
  color: var(--normalText40);
}

@media (max-width: 980px) {
  .blog-markdown-editor__panes {
    grid-template-columns: 1fr;
  }

  .blog-markdown-editor textarea,
  .blog-markdown-editor__preview,
  .blog-markdown-editor__empty {
    min-height: 260px;
  }
}
</style>
