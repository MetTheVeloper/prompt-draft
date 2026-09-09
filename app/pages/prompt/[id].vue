<script setup lang="ts">
import type { PublicPromptLocale } from '~/composables/usePublicPrompt'
import { publicCreatorPath, publicPromptPath } from '~/utils/publicRoutes'
import {
  buildPublicPromptStructuredData,
  normalizePublicSiteUrl,
  publicPromptSeoImage,
  toAbsolutePublicUrl,
} from '~/utils/publicPromptSeo'

definePageMeta({
  key: route => route.fullPath,
})

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const publicPromptApi = usePublicPrompt()

function readRouteId(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || !/^[1-9]\d*$/.test(raw)) return null
  const id = Number(raw)
  return Number.isSafeInteger(id) && id > 0 ? id : null
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

const publicId = readRouteId(route.params.id)
if (!publicId) {
  throw createError({ statusCode: 404, statusMessage: 'Public Prompt not found' })
}

const { data: prompt } = await useAsyncData(
  `public-prompt:${publicId}`,
  async () => {
    try {
      return await publicPromptApi.load(publicId)
    } catch (error) {
      if (readHttpStatus(error) === 404) {
        throw createError({ statusCode: 404, statusMessage: 'Public Prompt not found' })
      }

      console.error('[Prompt Draft] public Prompt SSR fetch failed', error)
      throw createError({ statusCode: 502, statusMessage: 'Public Prompt is temporarily unavailable' })
    }
  },
)

if (!prompt.value) {
  throw createError({ statusCode: 404, statusMessage: 'Public Prompt not found' })
}

const activeLocale = computed<PublicPromptLocale>(() => locale.value === 'fa' ? 'fa' : 'en')
const localeAvailable = computed(() => {
  return Boolean(
    prompt.value?.availableLocales.includes(activeLocale.value) &&
    prompt.value?.title[activeLocale.value] &&
    prompt.value?.description[activeLocale.value],
  )
})

if (!localeAvailable.value) {
  throw createError({ statusCode: 404, statusMessage: 'Public Prompt not found' })
}

watch(activeLocale, () => {
  if (!localeAvailable.value) {
    showError(createError({ statusCode: 404, statusMessage: 'Public Prompt not found' }))
  }
})

const localizedTitle = computed(() => prompt.value?.title[activeLocale.value] || '')
const localizedDescription = computed(() => prompt.value?.description[activeLocale.value] || '')
const publishedAt = computed(() => prompt.value?.publishedAt || '')
const canonicalPath = publicPromptPath(publicId)
const siteUrl = computed(() => normalizePublicSiteUrl(config.public.siteUrl))
const seoDescription = computed(() => localizedDescription.value)
const seoImage = computed(() => publicPromptSeoImage(prompt.value!))
const canonicalUrl = computed(() => toAbsolutePublicUrl(
  siteUrl.value,
  localePath(canonicalPath, activeLocale.value),
))
const absoluteSeoImage = computed(() => toAbsolutePublicUrl(siteUrl.value, seoImage.value))
const alternateLocales = computed(() => prompt.value?.availableLocales ?? [])
const structuredData = computed(() => {
  if (!prompt.value || !canonicalUrl.value) return null

  return buildPublicPromptStructuredData({
    prompt: prompt.value,
    locale: activeLocale.value,
    localizedTitle: localizedTitle.value,
    description: localizedDescription.value,
    canonicalUrl: canonicalUrl.value,
    imageUrl: absoluteSeoImage.value,
    siteUrl: siteUrl.value,
  })
})

usePublicSeo({
  title: localizedTitle,
  description: seoDescription,
  canonicalPath,
  imageUrl: seoImage,
  alternateLocales,
  structuredData,
})

const modelLabel = computed(() => {
  const model = prompt.value?.model.previewGeneratedWith || ''
  if (model === 'gpt-image-1') return 'GPT Image 1'
  if (model === 'dall-e') return 'DALL·E'
  return model
})

const presentationMedia = computed(() => {
  return (prompt.value?.images ?? []).map(image => ({
    position: image.position,
    fullUrl: image.fullUrl,
    thumbnailUrl: image.thumbnailUrl,
  }))
})

const previewCountLabel = computed(() => {
  return t('prompts.detail.previewCount', { count: presentationMedia.value.length })
})

const backIcon = computed(() => activeLocale.value === 'fa' ? 'arrow_forward' : 'arrow_back')
const creatorUrl = computed(() => prompt.value?.creator
  ? localePath(publicCreatorPath(prompt.value.creator.username), activeLocale.value)
  : '')

const protectedPromptPath = computed(() => localePath({
  path: '/prompts',
  query: { id: String(publicId) },
}))
</script>

<template>
  <main class="public-prompt-page w100">
    <PromptPresentation
      :title="localizedTitle"
      :description="localizedDescription"
      :tags="prompt?.tags ?? []"
      :public-id="publicId"
      :published-at="publishedAt"
      :model-label="modelLabel"
      :media="presentationMedia"
      :locale="activeLocale"
      :eyebrow="t('growth.publicPrompt.eyebrow')"
      :preview-count-label="previewCountLabel"
      :telegram-message-id="prompt?.telegramMessageId ?? null">
      <template #topbar-leading>
        <el-button
          mode="flat"
          color="normal"
          :icon="backIcon"
          :label="t('prompts.detail.back')"
          @click="router.back()"
        />
      </template>

      <template #meta>
        <NuxtLink
          v-if="prompt?.creator"
          :to="creatorUrl"
          class="public-prompt-creator">
          <el-avatar
            :src="prompt.creator.avatarUrl"
            :name="prompt.creator.username"
            :size="7"
            :size-offset="2"
            :br="2"
            bc="surface"
          />
          <span>@{{ prompt.creator.username }}</span>
        </NuxtLink>
      </template>

      <template #actions>
        <el-button
          color="normal"
          icon="lock_open"
          :label="t('growth.publicPrompt.openProtected')"
          :to="protectedPromptPath"
        />
      </template>
    </PromptPresentation>
  </main>
</template>

<style scoped>
.public-prompt-page {
  min-height: 100%;
  background: var(--themeBackground);
}

.public-prompt-creator {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: inherit;
  text-decoration: none;
  font-size: 12px;
  font-weight: 700;
}

.public-prompt-creator:hover {
  opacity: .82;
}
</style>
