<script setup lang="ts">
import type { PublicCreatorLinkType, PublicCreatorLocale } from '~/composables/usePublicCreator'
import { renderPublicCreatorMarkdown } from '~/utils/publicCreatorMarkdown'
import {
  buildPublicCreatorStructuredData,
  publicCreatorSeoImage,
} from '~/utils/publicCreatorSeo'
import {
  normalizePublicSiteUrl,
  toAbsolutePublicUrl,
} from '~/utils/publicPromptSeo'
import {
  normalizePublicCreatorUsername,
  publicCreatorPath,
  publicPromptPath,
} from '~/utils/publicRoutes'

definePageMeta({
  key: route => route.fullPath,
})

const route = useRoute()
const config = useRuntimeConfig()
const { locale, t } = useI18n()
const localePath = useLocalePath()
const publicCreatorApi = usePublicCreator()
const analytics = useProductAnalytics()

function readRouteUsername(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' ? raw : ''
}

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

const rawUsername = readRouteUsername(route.params.username)
let canonicalUsername = ''
try {
  canonicalUsername = normalizePublicCreatorUsername(rawUsername)
} catch {
  throw createError({ statusCode: 404, statusMessage: 'Public Creator not found' })
}

if (rawUsername !== canonicalUsername) {
  await navigateTo(localePath(publicCreatorPath(canonicalUsername), locale.value), {
    redirectCode: 301,
    replace: true,
  })
}

const { data: creator } = await useAsyncData(
  `public-creator:${canonicalUsername}`,
  async () => {
    try {
      return await publicCreatorApi.load(canonicalUsername)
    } catch (error) {
      if (readHttpStatus(error) === 404) {
        throw createError({ statusCode: 404, statusMessage: 'Public Creator not found' })
      }

      console.error('[Prompt Draft] public Creator SSR fetch failed', error)
      throw createError({ statusCode: 502, statusMessage: 'Public Creator is temporarily unavailable' })
    }
  },
)

if (!creator.value) {
  throw createError({ statusCode: 404, statusMessage: 'Public Creator not found' })
}

const activeLocale = computed<PublicCreatorLocale>(() => locale.value === 'fa' ? 'fa' : 'en')
const pageDirection = computed(() => activeLocale.value === 'fa' ? 'rtl' : 'ltr')
const identity = computed(() => creator.value!.identity)
const localizedName = computed(() => identity.value.screenName[activeLocale.value] || identity.value.username)
const localizedBio = computed(() => identity.value.bio[activeLocale.value] || '')
const localizedArticle = computed(() => identity.value.article[activeLocale.value] || '')
const articleHtml = computed(() => renderPublicCreatorMarkdown(localizedArticle.value))
const coverUrl = computed(() => identity.value.cover?.fullUrl || identity.value.cover?.thumbnailUrl || '')

const canonicalPath = publicCreatorPath(canonicalUsername)
const siteUrl = computed(() => normalizePublicSiteUrl(config.public.siteUrl))
const seoImage = computed(() => publicCreatorSeoImage(creator.value!))
const canonicalUrl = computed(() => toAbsolutePublicUrl(
  siteUrl.value,
  localePath(canonicalPath, activeLocale.value),
))
const absoluteSeoImage = computed(() => toAbsolutePublicUrl(siteUrl.value, seoImage.value))
const creatorNoindex = computed(() => !creator.value!.policy.indexable)
const structuredData = computed(() => {
  if (!creator.value || !canonicalUrl.value) return null

  return buildPublicCreatorStructuredData({
    creator: creator.value,
    locale: activeLocale.value,
    localizedName: localizedName.value,
    description: localizedBio.value,
    canonicalUrl: canonicalUrl.value,
    imageUrl: absoluteSeoImage.value,
    siteUrl: siteUrl.value,
  })
})

usePublicSeo({
  title: localizedName,
  description: localizedBio,
  canonicalPath,
  imageUrl: seoImage,
  alternateLocales: ['en', 'fa'],
  noindex: creatorNoindex,
  structuredData,
})

onMounted(() => {
  void analytics.track('public_creator_view', {
    resource: {
      type: 'public_creator',
      id: canonicalUsername,
    },
  })
})

const localizedSkills = computed(() => identity.value.skills.map(skill => ({
  ...skill,
  label: skill.title[activeLocale.value] || skill.title.en,
})))

const localizedPublications = computed(() => creator.value!.publications
  .filter(publication => publication.availableLocales.includes(activeLocale.value))
  .map(publication => ({
    ...publication,
    titleText: publication.title[activeLocale.value] || '',
    descriptionText: publication.description[activeLocale.value] || '',
    href: localePath(publicPromptPath(publication.id), activeLocale.value),
  })))

const linkIcons: Record<PublicCreatorLinkType, string> = {
  website: 'language',
  github: 'code',
  linkedin: 'work',
  instagram: 'photo_camera',
  telegram: 'send',
  x: 'alternate_email',
  youtube: 'play_circle',
  other: 'link',
}

function linkLabel(type: PublicCreatorLinkType, label: string | null) {
  return label || t(`growth.publicCreator.linkTypes.${type}`)
}

function formatPublishedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(activeLocale.value === 'fa' ? 'fa-IR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}
</script>

<template>
  <main class="public-creator-page w100" :dir="pageDirection">
    <section class="public-creator-hero w100 por ofh">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        alt=""
        class="public-creator-hero__image poa t0 r0 b0 l0 w100 h100"
      >
      <div v-else class="public-creator-hero__fallback poa t0 r0 b0 l0" />
      <div class="public-creator-hero__shade poa t0 r0 b0 l0" />
      <div class="public-creator-hero__watermark poa pen" aria-hidden="true">
        @{{ identity.username }}
      </div>
    </section>

    <div class="public-creator-shell w100">
      <section class="public-creator-identity-card por">
        <div class="public-creator-avatar-wrap poa">
          <el-avatar
            :src="identity.avatarUrl"
            :name="localizedName"
            :alt="localizedName"
            :size="30"
            :size-offset="58"
            :br="5"
            bc="surface"
          />
        </div>

        <div class="public-creator-identity-card__content">
          <div class="public-creator-copy">
            <div class="public-creator-eyebrow">{{ t('growth.publicCreator.eyebrow') }}</div>
            <h1 class="public-creator-name">{{ localizedName }}</h1>
            <div class="public-creator-handle" dir="ltr">@{{ identity.username }}</div>
            <p v-if="localizedBio" class="public-creator-bio">{{ localizedBio }}</p>

            <div v-if="identity.location" class="public-creator-location">
              <el-icon icon="location_on" :size="16" color="normal55" />
              <span>{{ identity.location.text }}</span>
            </div>
          </div>

          <div v-if="identity.links.length" class="public-creator-link-row">
            <a
              v-for="link in identity.links"
              :key="`${link.type}:${link.url}`"
              :href="link.url"
              target="_blank"
              rel="ugc noopener noreferrer"
              class="public-creator-link">
              <el-icon :icon="linkIcons[link.type]" :size="16" />
              <span>{{ linkLabel(link.type, link.label) }}</span>
              <el-icon icon="open_in_new" :size="14" color="normal55" />
            </a>
          </div>
        </div>
      </section>

      <div class="public-creator-content-grid">
        <article class="public-creator-panel public-creator-article">
          <div class="public-creator-panel__eyebrow">{{ t('growth.publicCreator.articleEyebrow') }}</div>
          <h2 class="public-creator-panel__title">{{ t('growth.publicCreator.articleTitle') }}</h2>
          <div
            v-if="articleHtml"
            class="creator-markdown"
            v-html="articleHtml"
          />
          <p v-else class="public-creator-muted">{{ t('growth.publicCreator.articleEmpty') }}</p>
        </article>

        <aside class="public-creator-side-stack">
          <section class="public-creator-panel">
            <div class="public-creator-panel__eyebrow">{{ t('growth.publicCreator.skillsEyebrow') }}</div>
            <h2 class="public-creator-panel__title">{{ t('growth.publicCreator.skillsTitle') }}</h2>
            <div v-if="localizedSkills.length" class="public-creator-skills">
              <span
                v-for="skill in localizedSkills"
                :key="skill.slug"
                class="public-creator-skill">
                {{ skill.label }}
              </span>
            </div>
            <p v-else class="public-creator-muted">{{ t('growth.publicCreator.skillsEmpty') }}</p>
          </section>

          <section class="public-creator-panel public-creator-facts">
            <div class="public-creator-panel__eyebrow">{{ t('growth.publicCreator.identityEyebrow') }}</div>
            <h2 class="public-creator-panel__title">{{ t('growth.publicCreator.identityTitle') }}</h2>
            <div class="public-creator-fact">
              <span>{{ t('growth.publicCreator.usernameLabel') }}</span>
              <strong dir="ltr">@{{ identity.username }}</strong>
            </div>
            <div v-if="identity.location" class="public-creator-fact">
              <span>{{ t('growth.publicCreator.locationLabel') }}</span>
              <strong>{{ identity.location.text }}</strong>
            </div>
          </section>
        </aside>
      </div>

      <section class="public-creator-publications">
        <div class="public-creator-publications__header">
          <div>
            <div class="public-creator-panel__eyebrow">{{ t('growth.publicCreator.publicationsEyebrow') }}</div>
            <h2 class="public-creator-panel__title">{{ t('growth.publicCreator.publicationsTitle') }}</h2>
          </div>
          <span class="public-creator-publications__count">{{ localizedPublications.length }}</span>
        </div>

        <div v-if="localizedPublications.length" class="public-creator-publication-grid">
          <NuxtLink
            v-for="publication in localizedPublications"
            :key="publication.id"
            :to="publication.href"
            class="public-creator-publication-card">
            <div class="public-creator-publication-card__media">
              <img
                v-if="publication.coverImage"
                :src="publication.coverImage.thumbnailUrl || publication.coverImage.fullUrl"
                alt=""
                loading="lazy"
              >
              <div v-else class="public-creator-publication-card__fallback" />
            </div>
            <div class="public-creator-publication-card__body">
              <div class="public-creator-publication-card__meta">
                <span>{{ formatPublishedAt(publication.publishedAt) }}</span>
                <span>#{{ publication.id }}</span>
              </div>
              <h3>{{ publication.titleText }}</h3>
              <p>{{ publication.descriptionText }}</p>
              <span class="public-creator-publication-card__action">
                {{ t('growth.publicCreator.viewPrompt') }}
                <el-icon :icon="activeLocale === 'fa' ? 'arrow_back' : 'arrow_forward'" :size="15" />
              </span>
            </div>
          </NuxtLink>
        </div>

        <div v-else class="public-creator-publications__empty">
          <el-icon icon="auto_awesome" :size="28" color="normal45" />
          <span>{{ t('growth.publicCreator.publicationsEmpty') }}</span>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.public-creator-page {
  min-height: 100%;
  background: var(--themeBackground);
  color: var(--normalText);
}

.public-creator-hero {
  height: clamp(220px, 29vw, 390px);
  background: var(--themeSurface);
}

.public-creator-hero__image {
  object-fit: cover;
}

.public-creator-hero__fallback {
  background:
    radial-gradient(circle at 14% 18%, rgba(73, 104, 255, .52), transparent 34%),
    radial-gradient(circle at 82% 30%, rgba(170, 78, 255, .38), transparent 36%),
    radial-gradient(circle at 58% 90%, rgba(45, 196, 159, .22), transparent 34%),
    linear-gradient(135deg, #141722, #25283a 58%, #101219);
}

.public-creator-hero__shade {
  background: linear-gradient(to bottom, rgba(7, 9, 14, .08), rgba(7, 9, 14, .62));
}

.public-creator-hero__watermark {
  inset-inline-end: max(24px, calc((100vw - 1180px) / 2));
  inset-block-end: 28px;
  max-width: 70vw;
  overflow: hidden;
  color: rgba(255, 255, 255, .16);
  font-size: clamp(24px, 5vw, 72px);
  font-weight: 900;
  letter-spacing: -.04em;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.public-creator-shell {
  max-width: 1180px;
  margin: 0 auto;
  padding: 0 24px 72px;
}

.public-creator-identity-card {
  margin-top: -64px;
  min-height: 190px;
  border: 1px solid var(--normalText15);
  border-radius: 24px;
  background: color-mix(in srgb, var(--themeSurface) 94%, transparent);
  box-shadow: 0 22px 60px rgba(0, 0, 0, .16);
  backdrop-filter: blur(18px);
}

.public-creator-avatar-wrap {
  inset-inline-start: 28px;
  inset-block-start: -54px;
  z-index: 2;
  filter: drop-shadow(0 14px 30px rgba(0, 0, 0, .3));
}

.public-creator-identity-card__content {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  padding: 58px 28px 26px;
}

.public-creator-copy {
  min-width: 0;
}

.public-creator-eyebrow,
.public-creator-panel__eyebrow {
  margin-bottom: 7px;
  color: var(--primary);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: .11em;
  text-transform: uppercase;
}

.public-creator-name {
  margin: 0;
  font-size: clamp(29px, 4vw, 46px);
  line-height: 1.06;
  letter-spacing: -.035em;
}

.public-creator-handle {
  margin-top: 6px;
  color: var(--normalText55);
  font-size: 14px;
}

.public-creator-bio {
  max-width: 760px;
  margin: 16px 0 0;
  color: var(--normalText75);
  font-size: 15px;
  line-height: 1.75;
}

.public-creator-location {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 14px;
  color: var(--normalText55);
  font-size: 12px;
}

.public-creator-link-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  max-width: 430px;
}

.public-creator-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid var(--normalText15);
  border-radius: 12px;
  background: var(--normalText5);
  color: var(--normalText);
  text-decoration: none;
  font-size: 12px;
  font-weight: 700;
  transition: transform .16s ease, border-color .16s ease, background .16s ease;
}

.public-creator-link:hover {
  transform: translateY(-1px);
  border-color: var(--normalText25);
  background: var(--normalText10);
}

.public-creator-content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.72fr) minmax(280px, .72fr);
  gap: 18px;
  margin-top: 18px;
}

.public-creator-side-stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.public-creator-panel,
.public-creator-publications {
  border: 1px solid var(--normalText15);
  border-radius: 20px;
  background: var(--themeSurface);
}

.public-creator-panel {
  padding: 24px;
}

.public-creator-panel__title {
  margin: 0 0 18px;
  font-size: 19px;
  line-height: 1.3;
}

.public-creator-muted {
  margin: 0;
  color: var(--normalText55);
  font-size: 13px;
  line-height: 1.7;
}

.public-creator-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.public-creator-skill {
  padding: 7px 10px;
  border: 1px solid var(--normalText15);
  border-radius: 999px;
  background: var(--normalText5);
  font-size: 11px;
  font-weight: 700;
}

.public-creator-fact {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  padding: 11px 0;
  border-bottom: 1px solid var(--normalText10);
  font-size: 12px;
}

.public-creator-fact:last-child {
  border-bottom: 0;
}

.public-creator-fact span {
  color: var(--normalText55);
}

.public-creator-fact strong {
  max-width: 62%;
  overflow: hidden;
  text-align: end;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.creator-markdown {
  color: var(--normalText75);
  font-size: 15px;
  line-height: 1.9;
}

.creator-markdown :deep(h2),
.creator-markdown :deep(h3),
.creator-markdown :deep(h4),
.creator-markdown :deep(h5),
.creator-markdown :deep(h6) {
  margin: 30px 0 12px;
  color: var(--normalText);
  line-height: 1.25;
  letter-spacing: -.02em;
}

.creator-markdown :deep(h2) { font-size: 26px; }
.creator-markdown :deep(h3) { font-size: 21px; }
.creator-markdown :deep(h4) { font-size: 18px; }
.creator-markdown :deep(p) { margin: 0 0 18px; }
.creator-markdown :deep(strong) { color: var(--normalText); }
.creator-markdown :deep(a) { color: var(--primary); text-decoration: underline; text-underline-offset: 3px; }
.creator-markdown :deep(img) {
  display: block;
  width: 100%;
  max-height: 620px;
  margin: 22px 0;
  border: 1px solid var(--normalText15);
  border-radius: 16px;
  object-fit: cover;
}
.creator-markdown :deep(ul),
.creator-markdown :deep(ol) { margin: 0 0 18px; padding-inline-start: 24px; }
.creator-markdown :deep(li) { margin: 6px 0; }
.creator-markdown :deep(blockquote) {
  margin: 22px 0;
  padding: 12px 16px;
  border-inline-start: 3px solid var(--primary);
  border-radius: 8px;
  background: var(--normalText5);
}
.creator-markdown :deep(code) {
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--normalText10);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: .9em;
}
.creator-markdown :deep(pre) {
  overflow: auto;
  margin: 22px 0;
  padding: 16px;
  border-radius: 14px;
  background: var(--normalText5);
}
.creator-markdown :deep(pre code) { padding: 0; background: transparent; }
.creator-markdown :deep(hr) { margin: 28px 0; border: 0; border-top: 1px solid var(--normalText15); }

.public-creator-publications {
  margin-top: 18px;
  padding: 24px;
}

.public-creator-publications__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.public-creator-publications__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 28px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--normalText10);
  font-size: 11px;
  font-weight: 800;
}

.public-creator-publication-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.public-creator-publication-card {
  overflow: hidden;
  border: 1px solid var(--normalText15);
  border-radius: 16px;
  background: var(--themeBackground);
  color: inherit;
  text-decoration: none;
  transition: transform .18s ease, border-color .18s ease;
}

.public-creator-publication-card:hover {
  transform: translateY(-2px);
  border-color: var(--normalText25);
}

.public-creator-publication-card__media {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--normalText5);
}

.public-creator-publication-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .24s ease;
}

.public-creator-publication-card:hover .public-creator-publication-card__media img {
  transform: scale(1.025);
}

.public-creator-publication-card__fallback {
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 30% 20%, rgba(72, 104, 255, .3), transparent 36%),
    linear-gradient(135deg, var(--normalText5), var(--normalText10));
}

.public-creator-publication-card__body {
  padding: 15px;
}

.public-creator-publication-card__meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--normalText45);
  font-size: 10px;
}

.public-creator-publication-card h3 {
  margin: 0;
  font-size: 15px;
  line-height: 1.35;
}

.public-creator-publication-card p {
  display: -webkit-box;
  overflow: hidden;
  margin: 8px 0 14px;
  color: var(--normalText55);
  font-size: 11px;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.public-creator-publication-card__action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--primary);
  font-size: 11px;
  font-weight: 800;
}

.public-creator-publications__empty {
  display: flex;
  min-height: 150px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  border: 1px dashed var(--normalText15);
  border-radius: 15px;
  color: var(--normalText55);
  text-align: center;
  font-size: 12px;
}

@media (max-width: 900px) {
  .public-creator-content-grid {
    grid-template-columns: 1fr;
  }

  .public-creator-publication-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .public-creator-shell {
    padding-inline: 14px;
    padding-bottom: 48px;
  }

  .public-creator-hero {
    height: 210px;
  }

  .public-creator-identity-card {
    margin-top: -34px;
    min-height: 0;
    border-radius: 18px;
  }

  .public-creator-avatar-wrap {
    inset-inline-start: 18px;
    inset-block-start: -46px;
  }

  .public-creator-identity-card__content {
    align-items: flex-start;
    flex-direction: column;
    padding: 58px 18px 18px;
  }

  .public-creator-link-row {
    justify-content: flex-start;
    max-width: none;
  }

  .public-creator-panel,
  .public-creator-publications {
    padding: 18px;
    border-radius: 17px;
  }

  .public-creator-publication-grid {
    grid-template-columns: 1fr;
  }

  .public-creator-hero__watermark {
    inset-inline-end: 16px;
    inset-block-end: 18px;
  }
}
</style>