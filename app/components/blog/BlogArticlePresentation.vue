<script setup lang="ts">
import { renderPublicBlogMarkdown } from '~/utils/publicBlogMarkdown'

const props = withDefaults(defineProps<{
  markdown: string
  dir?: 'ltr' | 'rtl'
}>(), {
  dir: 'ltr',
})

const lightbox = useBlogImageLightbox()
const renderedBody = computed(() => renderPublicBlogMarkdown(props.markdown))

function zoomTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLImageElement)) return false
  if (target.dataset.blogZoom !== 'true') return false

  lightbox.open({
    src: target.currentSrc || target.src,
    alt: target.alt,
  })
  return true
}

function onContentClick(event: MouseEvent) {
  zoomTarget(event.target)
}

function onContentKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  if (!zoomTarget(event.target)) return
  event.preventDefault()
}
</script>

<template>
  <el-flex rules="csc" class="blog-article-presentation w100" :dir="dir">
    <div
      class="blog-article-rich-text w100"
      v-html="renderedBody"
      @click="onContentClick"
      @keydown="onContentKeydown"
    />
  </el-flex>
</template>

<style scoped>
.blog-article-rich-text {
  color: var(--normalText);
  font-size: 16px;
  line-height: 1.9;
  overflow-wrap: anywhere;
}

.blog-article-rich-text :deep(.blog-article-intro) {
  margin-bottom: 18px;
}

.blog-article-rich-text :deep(.blog-article-section) {
  margin: 0;
}

.blog-article-rich-text :deep(.blog-article-intro + .blog-article-section),
.blog-article-rich-text :deep(.blog-article-section + .blog-article-section),
.blog-article-rich-text :deep(.blog-article-section-content > .blog-article-section) {
  border-top: 1px solid var(--normalText10);
}

.blog-article-rich-text :deep(.blog-article-section[data-heading-level="3"]),
.blog-article-rich-text :deep(.blog-article-section[data-heading-level="4"]),
.blog-article-rich-text :deep(.blog-article-section[data-heading-level="5"]),
.blog-article-rich-text :deep(.blog-article-section[data-heading-level="6"]) {
  margin-inline-start: 14px;
}

.blog-article-rich-text :deep(summary) {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  list-style: none;
  cursor: pointer;
  user-select: none;
}

.blog-article-rich-text :deep(summary::-webkit-details-marker) {
  display: none;
}

.blog-article-rich-text :deep(summary::after) {
  content: '−';
  display: inline-grid;
  place-items: center;
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: var(--normalText5);
  color: var(--normalText55);
  font-size: 16px;
  font-weight: 700;
  line-height: 1;
}

.blog-article-rich-text :deep(details:not([open]) > summary::after) {
  content: '+';
}

.blog-article-rich-text :deep(.blog-article-section-content) {
  padding-bottom: 14px;
}

.blog-article-rich-text :deep(h2),
.blog-article-rich-text :deep(h3),
.blog-article-rich-text :deep(h4),
.blog-article-rich-text :deep(h5),
.blog-article-rich-text :deep(h6) {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  color: var(--normalText);
  line-height: 1.3;
  letter-spacing: -.01em;
}

.blog-article-rich-text :deep(h2) {
  font-size: clamp(25px, 3vw, 32px);
  font-weight: 850;
}

.blog-article-rich-text :deep(h3) {
  font-size: clamp(21px, 2.5vw, 26px);
  font-weight: 820;
}

.blog-article-rich-text :deep(h4) {
  font-size: 19px;
  font-weight: 800;
}

.blog-article-rich-text :deep(h5) {
  font-size: 17px;
  font-weight: 780;
}

.blog-article-rich-text :deep(h6) {
  font-size: 15px;
  font-weight: 760;
  color: var(--normalText70);
}

.blog-article-rich-text :deep(p),
.blog-article-rich-text :deep(ul),
.blog-article-rich-text :deep(ol),
.blog-article-rich-text :deep(blockquote),
.blog-article-rich-text :deep(pre) {
  margin: 1em 0;
}

.blog-article-rich-text :deep(p) {
  color: var(--normalText85);
}

.blog-article-rich-text :deep(strong) {
  color: var(--normalText);
  font-weight: 800;
}

.blog-article-rich-text :deep(ul),
.blog-article-rich-text :deep(ol) {
  padding-inline-start: 1.45em;
}

.blog-article-rich-text :deep(li) {
  margin: .45em 0;
}

.blog-article-rich-text :deep(a) {
  color: var(--primary);
  font-weight: 650;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

.blog-article-rich-text :deep(.public-markdown-citation) {
  display: inline-flex;
  align-items: center;
  vertical-align: .1em;
  margin-inline: .18em;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--normalText15);
  color: var(--normalText70);
  font-size: 10px;
  font-weight: 400;
  line-height: 1.5;
  direction: ltr;
  unicode-bidi: isolate;
}

.blog-article-rich-text :deep(blockquote) {
  padding: 12px 16px;
  border-inline-start: 3px solid var(--normalText25);
  border-radius: 12px;
  background: var(--normalText5);
  color: var(--normalText70);
}

.blog-article-rich-text :deep(pre) {
  overflow: auto;
  padding: 16px;
  border: 1px solid var(--normalText15);
  border-radius: 12px;
  background: var(--normalText5);
  font-size: 13px;
  line-height: 1.7;
}

.blog-article-rich-text :deep(code) {
  padding: .12em .38em;
  border-radius: 6px;
  background: var(--normalText10);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .9em;
}

.blog-article-rich-text :deep(pre code) {
  padding: 0;
  background: transparent;
  font-size: inherit;
}

.blog-article-rich-text :deep(hr) {
  margin: 24px 0;
  border: 0;
  border-top: 1px solid var(--normalText15);
}

.blog-article-rich-text :deep(img[data-blog-zoom="true"]) {
  display: block;
  width: auto;
  height: auto;
  max-width: min(100%, 400px);
  max-height: 400px;
  margin: 18px auto;
  object-fit: contain;
  border-radius: 12px;
  cursor: zoom-in;
  transition: transform 160ms ease, opacity 160ms ease;
}

.blog-article-rich-text :deep(img[data-blog-zoom="true"]:hover) {
  transform: scale(1.01);
  opacity: .92;
}

.blog-article-rich-text :deep(img[data-blog-zoom="true"]:focus-visible) {
  outline: 2px solid var(--primary);
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .blog-article-rich-text {
    font-size: 15px;
    line-height: 1.85;
  }

  .blog-article-rich-text :deep(.blog-article-section[data-heading-level="3"]),
  .blog-article-rich-text :deep(.blog-article-section[data-heading-level="4"]),
  .blog-article-rich-text :deep(.blog-article-section[data-heading-level="5"]),
  .blog-article-rich-text :deep(.blog-article-section[data-heading-level="6"]) {
    margin-inline-start: 8px;
  }
}
</style>
