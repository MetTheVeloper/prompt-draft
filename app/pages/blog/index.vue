<script setup lang="ts">
import type { PublicBlogLocale } from '~/shared/public-blog'
import { PUBLIC_ROUTE_PATHS, publicBlogPostPath } from '~/utils/publicRoutes'
import {
  buildPublicBlogIndexStructuredData,
  normalizeBlogSiteUrl,
  toAbsoluteBlogUrl,
} from '~/utils/publicBlogSeo'

definePageMeta({
  key: route => route.fullPath,
})

const config = useRuntimeConfig()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const publicBlog = usePublicBlog()
const analytics = useProductAnalytics()

const activeLocale = computed<PublicBlogLocale>(() => locale.value === 'fa' ? 'fa' : 'en')
const { data: response } = await useAsyncData(
  `public-blog-index:${activeLocale.value}`,
  async () => {
    try {
      return await publicBlog.list(activeLocale.value)
    } catch (error) {
      console.error('[Prompt Draft] public Blog index SSR fetch failed', error)
      throw createError({ statusCode: 502, statusMessage: 'Blog is temporarily unavailable' })
    }
  },
)

const articles = computed(() => response.value?.articles ?? [])
const siteUrl = computed(() => normalizeBlogSiteUrl(config.public.siteUrl))
const canonicalPath = PUBLIC_ROUTE_PATHS.blog
const canonicalUrl = computed(() => toAbsoluteBlogUrl(
  siteUrl.value,
  localePath(canonicalPath, activeLocale.value),
))
const structuredData = computed(() => buildPublicBlogIndexStructuredData({
  articles: articles.value,
  locale: activeLocale.value,
  canonicalUrl: canonicalUrl.value,
  articleUrl: article => toAbsoluteBlogUrl(
    siteUrl.value,
    localePath(publicBlogPostPath(article.slug), activeLocale.value),
  ),
}))

usePublicSeo({
  title: () => t('blog.title'),
  description: () => t('blog.description'),
  canonicalPath,
  alternateLocales: ['en', 'fa'],
  structuredData,
})

onMounted(() => {
  void analytics.track('public_blog_index_view', {
    resource: {
      type: 'public_blog',
      id: 'index',
    },
  })
})

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
  <main class="public-blog-index w100">
    <section class="public-blog-shell">
      <header class="public-blog-heading">
        <p class="public-blog-eyebrow">{{ t('blog.eyebrow') }}</p>
        <h1>{{ t('blog.title') }}</h1>
        <p>{{ t('blog.description') }}</p>
      </header>

      <section v-if="articles.length" class="public-blog-grid" :aria-label="t('blog.title')">
        <article v-for="article in articles" :key="article.slug" class="public-blog-card">
          <NuxtLink
            v-if="article.hero"
            :to="localePath(publicBlogPostPath(article.slug), activeLocale)"
            class="public-blog-card-media">
            <img
              :src="article.hero.thumbnailUrl || article.hero.fullUrl"
              :alt="article.hero.alt"
              loading="lazy"
              decoding="async"
            >
          </NuxtLink>

          <div class="public-blog-card-body">
            <div class="public-blog-card-meta">
              <time :datetime="article.publishedAt">{{ formatDate(article.publishedAt) }}</time>
              <span aria-hidden="true">·</span>
              <span>{{ article.author.name }}</span>
            </div>

            <h2>
              <NuxtLink :to="localePath(publicBlogPostPath(article.slug), activeLocale)">
                {{ article.title }}
              </NuxtLink>
            </h2>
            <p>{{ article.description }}</p>

            <NuxtLink
              :to="localePath(publicBlogPostPath(article.slug), activeLocale)"
              class="public-blog-read-link">
              {{ t('blog.readArticle') }}
            </NuxtLink>
          </div>
        </article>
      </section>

      <section v-else class="public-blog-empty">
        <h2>{{ t('blog.emptyTitle') }}</h2>
        <p>{{ t('blog.emptyDescription') }}</p>
      </section>
    </section>
  </main>
</template>

<style scoped>
.public-blog-index {
  min-height: 100%;
  background: var(--themeBackground);
}

.public-blog-shell {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 72px 0 96px;
}

.public-blog-heading {
  max-width: 760px;
  margin-bottom: 40px;
}

.public-blog-eyebrow,
.public-blog-card-meta {
  color: var(--themeNormal55);
  font-size: 13px;
  font-weight: 700;
}

.public-blog-heading h1 {
  margin: 8px 0 12px;
  font-size: clamp(38px, 6vw, 64px);
  line-height: 1.05;
}

.public-blog-heading > p:last-child,
.public-blog-card-body > p,
.public-blog-empty p {
  color: var(--themeNormal65);
  line-height: 1.8;
}

.public-blog-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 24px;
}

.public-blog-card {
  overflow: hidden;
  border: 1px solid var(--themeNormal15);
  border-radius: 20px;
  background: var(--themeSurface);
}

.public-blog-card-media {
  display: block;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--themeNormal10);
}

.public-blog-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.public-blog-card-body {
  padding: 22px;
}

.public-blog-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.public-blog-card h2 {
  margin: 12px 0 8px;
  font-size: 24px;
  line-height: 1.25;
}

.public-blog-card a {
  color: inherit;
  text-decoration: none;
}

.public-blog-read-link {
  display: inline-flex;
  margin-top: 8px;
  font-weight: 800;
}

.public-blog-empty {
  padding: 36px;
  border: 1px dashed var(--themeNormal20);
  border-radius: 20px;
  text-align: center;
}

.public-blog-empty h2 {
  margin: 0 0 8px;
}

@media (max-width: 640px) {
  .public-blog-shell {
    width: min(100% - 24px, 1120px);
    padding: 48px 0 72px;
  }
}
</style>
