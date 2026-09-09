<script setup lang="ts">
import type { PublicBlogLocale } from '~/shared/public-blog'
import { normalizePublicBlogSlug, publicBlogPostPath } from '~/utils/publicRoutes'
import { renderPublicBlogMarkdown } from '~/utils/publicBlogMarkdown'
import {
  buildPublicBlogPostingStructuredData,
  normalizeBlogSiteUrl,
  toAbsoluteBlogUrl,
} from '~/utils/publicBlogSeo'

definePageMeta({
  key: route => route.fullPath,
})

const route = useRoute()
const config = useRuntimeConfig()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const publicBlog = usePublicBlog()

function readHttpStatus(error: unknown) {
  if (!error || typeof error !== 'object') return null
  const candidate = error as {
    statusCode?: unknown
    status?: unknown
    response?: { status?: unknown }
  }
  const value = Number(candidate.statusCode ?? candidate.status ?? candidate.response?.status)
  return Number.isInteger(value) ? value : null
}

const rawSlugValue = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
if (typeof rawSlugValue !== 'string' || !rawSlugValue.trim()) {
  throw createError({ statusCode: 404, statusMessage: 'Blog Article not found' })
}

let canonicalSlug = ''
try {
  canonicalSlug = normalizePublicBlogSlug(rawSlugValue)
} catch {
  throw createError({ statusCode: 404, statusMessage: 'Blog Article not found' })
}

const activeLocale = computed<PublicBlogLocale>(() => locale.value === 'fa' ? 'fa' : 'en')
const { data: response } = await useAsyncData(
  () => `public-blog-article:${activeLocale.value}:${canonicalSlug}`,
  async () => {
    try {
      return await publicBlog.load(canonicalSlug, activeLocale.value)
    } catch (error) {
      if (readHttpStatus(error) === 404) {
        throw createError({ statusCode: 404, statusMessage: 'Blog Article not found' })
      }
      console.error('[Prompt Draft] public Blog Article SSR fetch failed', error)
      throw createError({ statusCode: 502, statusMessage: 'Blog Article is temporarily unavailable' })
    }
  },
  { watch: [activeLocale] },
)

const article = computed(() => response.value?.article ?? null)
if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: 'Blog Article not found' })
}

if (rawSlugValue !== article.value.slug) {
  await navigateTo(
    localePath(publicBlogPostPath(article.value.slug), activeLocale.value),
    { redirectCode: 301, replace: true },
  )
}

const canonicalPath = publicBlogPostPath(article.value.slug)
const siteUrl = computed(() => normalizeBlogSiteUrl(config.public.siteUrl))
const canonicalUrl = computed(() => toAbsoluteBlogUrl(
  siteUrl.value,
  localePath(canonicalPath, activeLocale.value),
))
const seoImage = computed(() => article.value?.hero?.fullUrl || null)
const absoluteSeoImage = computed(() => toAbsoluteBlogUrl(siteUrl.value, seoImage.value))
const structuredData = computed(() => article.value
  ? buildPublicBlogPostingStructuredData({
      article: article.value,
      locale: activeLocale.value,
      canonicalUrl: canonicalUrl.value,
      imageUrl: absoluteSeoImage.value,
      siteUrl: siteUrl.value,
    })
  : null)
const renderedBody = computed(() => renderPublicBlogMarkdown(article.value?.body ?? ''))
const authorIsInternal = computed(() => article.value?.author.url?.startsWith('/') ?? false)
const authorInternalUrl = computed(() => article.value?.author.url
  ? localePath(article.value.author.url, activeLocale.value)
  : '')

usePublicSeo({
  title: () => article.value?.title || 'Prompt Draft',
  description: () => article.value?.description || '',
  canonicalPath,
  imageUrl: seoImage,
  contentType: 'article',
  alternateLocales: () => article.value?.availableLocales ?? [activeLocale.value],
  structuredData,
})

useHead(() => ({
  meta: article.value
    ? [
        { property: 'article:published_time', content: article.value.publishedAt, key: 'blog-published-at' },
        { property: 'article:modified_time', content: article.value.updatedAt, key: 'blog-updated-at' },
        { name: 'author', content: article.value.author.name, key: 'blog-author' },
      ]
    : [],
}))

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(activeLocale.value === 'fa' ? 'fa-IR' : 'en-US', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(date)
}
</script>

<template>
  <main v-if="article" class="public-blog-article w100">
    <article class="public-blog-article-shell">
      <NuxtLink :to="localePath('/blog', activeLocale)" class="public-blog-back-link">
        {{ t('blog.backToBlog') }}
      </NuxtLink>

      <header class="public-blog-article-header">
        <p class="public-blog-eyebrow">{{ t('blog.eyebrow') }}</p>
        <h1>{{ article.title }}</h1>
        <p class="public-blog-deck">{{ article.description }}</p>

        <div class="public-blog-article-meta">
          <span>{{ t('blog.by') }}</span>
          <NuxtLink v-if="article.author.url && authorIsInternal" :to="authorInternalUrl">
            {{ article.author.name }}
          </NuxtLink>
          <a
            v-else-if="article.author.url"
            :href="article.author.url"
            target="_blank"
            rel="noopener noreferrer">
            {{ article.author.name }}
          </a>
          <strong v-else>{{ article.author.name }}</strong>
          <span aria-hidden="true">·</span>
          <time :datetime="article.publishedAt">
            {{ t('blog.published') }} {{ formatDate(article.publishedAt) }}
          </time>
          <template v-if="article.updatedAt !== article.publishedAt">
            <span aria-hidden="true">·</span>
            <time :datetime="article.updatedAt">
              {{ t('blog.updated') }} {{ formatDate(article.updatedAt) }}
            </time>
          </template>
        </div>
      </header>

      <figure v-if="article.hero" class="public-blog-hero">
        <img
          :src="article.hero.fullUrl"
          :alt="article.hero.alt"
          :width="article.hero.width || undefined"
          :height="article.hero.height || undefined"
          decoding="async"
        >
      </figure>

      <div class="public-blog-markdown" v-html="renderedBody" />
    </article>
  </main>
</template>

<style scoped>
.public-blog-article {
  min-height: 100%;
  background: var(--themeBackground);
}

.public-blog-article-shell {
  width: min(820px, calc(100% - 32px));
  margin: 0 auto;
  padding: 48px 0 112px;
}

.public-blog-back-link {
  display: inline-flex;
  margin-bottom: 44px;
  color: var(--themeNormal65);
  text-decoration: none;
  font-size: 14px;
  font-weight: 750;
}

.public-blog-eyebrow,
.public-blog-article-meta {
  color: var(--themeNormal55);
  font-size: 13px;
  font-weight: 700;
}

.public-blog-article-header h1 {
  margin: 10px 0 18px;
  font-size: clamp(38px, 6vw, 64px);
  line-height: 1.08;
  letter-spacing: -.025em;
}

.public-blog-deck {
  margin: 0;
  color: var(--themeNormal65);
  font-size: 19px;
  line-height: 1.75;
}

.public-blog-article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 22px;
}

.public-blog-article-meta a {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.public-blog-hero {
  margin: 42px 0;
  overflow: hidden;
  border-radius: 22px;
  background: var(--themeNormal10);
}

.public-blog-hero img {
  display: block;
  width: 100%;
  height: auto;
}

.public-blog-markdown {
  margin-top: 44px;
  font-size: 17px;
  line-height: 1.9;
}

.public-blog-markdown :deep(h2),
.public-blog-markdown :deep(h3),
.public-blog-markdown :deep(h4),
.public-blog-markdown :deep(h5),
.public-blog-markdown :deep(h6) {
  margin: 2em 0 .7em;
  line-height: 1.25;
}

.public-blog-markdown :deep(p),
.public-blog-markdown :deep(ul),
.public-blog-markdown :deep(ol),
.public-blog-markdown :deep(blockquote),
.public-blog-markdown :deep(pre) {
  margin: 1.1em 0;
}

.public-blog-markdown :deep(a) {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.public-blog-markdown :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 14px;
}

.public-blog-markdown :deep(blockquote) {
  padding-inline-start: 18px;
  border-inline-start: 3px solid var(--themeNormal25);
  color: var(--themeNormal65);
}

.public-blog-markdown :deep(pre) {
  overflow: auto;
  padding: 18px;
  border-radius: 14px;
  background: var(--themeNormal10);
}

.public-blog-markdown :deep(code) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

@media (max-width: 640px) {
  .public-blog-article-shell {
    width: min(100% - 24px, 820px);
    padding-bottom: 80px;
  }
}
</style>
