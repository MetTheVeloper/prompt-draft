<script setup lang="ts">
import type { PublicPromptLocale } from '~/composables/usePublicPrompt'

definePageMeta({
  key: route => route.fullPath,
})

const route = useRoute()
const { t, locale } = useI18n()
const localePath = useLocalePath()
const { mobile, tablet } = useScreen()
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
    prompt.value?.title[activeLocale.value],
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
const primaryImage = computed(() => prompt.value?.images[0] ?? null)
const galleryImages = computed(() => prompt.value?.images.slice(1) ?? [])

const publishedLabel = computed(() => {
  if (!prompt.value) return ''
  const date = new Date(prompt.value.publishedAt)
  return new Intl.DateTimeFormat(activeLocale.value === 'fa' ? 'fa-IR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
})

const modelLabel = computed(() => {
  const model = prompt.value?.model.previewGeneratedWith || ''
  if (model === 'gpt-image-1') return 'GPT Image 1'
  if (model === 'dall-e') return 'DALL·E'
  return model
})

const protectedPromptPath = computed(() => localePath({
  path: '/prompts',
  query: { id: String(publicId) },
}))

const homePath = computed(() => localePath('/'))

function formatTag(tag: string) {
  return tag.replaceAll('-', ' ')
}
</script>

<template>
  <main class="public-prompt-page w100">
    <section class="public-prompt-page__hero por ofh">
      <img
        v-if="primaryImage"
        :src="primaryImage.fullUrl"
        :alt="localizedTitle"
        class="public-prompt-page__hero-image pen"
        decoding="async"
        fetchpriority="high"
        draggable="false"
      >
      <div class="public-prompt-page__hero-fallback pen" />
      <div class="public-prompt-page__hero-shade pen" />

      <el-flex
        rules="cbs"
        class="public-prompt-page__hero-content w100 h100 por zi10"
        :gap="20"
        :p="mobile ? 22 : 40">
        <el-flex rules="csc" class="w100" :gap="10">
          <el-text :size="10" :weight="900" color="prim" class="w100">
            {{ t('growth.publicPrompt.eyebrow') }}
          </el-text>

          <el-text
            type="h1"
            :size="mobile ? 42 : tablet ? 58 : 76"
            :weight="850"
            class="public-prompt-page__title w100">
            {{ localizedTitle }}
          </el-text>

          <el-text
            type="p"
            :size="mobile ? 13 : 16"
            color="normal70"
            class="public-prompt-page__description w100">
            {{ t('growth.publicPrompt.description') }}
          </el-text>

          <el-flex rules="rsc" class="w100 fw" :gap="8" wrap>
            <el-text
              :size="10"
              icon="calendar_month"
              marker="invert"
              :p="[5, 8]"
              :radius="100">
              {{ publishedLabel }}
            </el-text>
            <el-text
              :size="10"
              icon="auto_awesome"
              marker="invert"
              :p="[5, 8]"
              :radius="100">
              {{ modelLabel }}
            </el-text>
            <el-text
              :size="10"
              icon="tag"
              marker="invert"
              :p="[5, 8]"
              :radius="100">
              #{{ prompt?.id }}
            </el-text>
          </el-flex>
        </el-flex>

        <el-flex rules="rsc" class="w100 fw" :gap="8" wrap>
          <el-button
            color="normal"
            icon="lock_open"
            :label="t('growth.publicPrompt.openProtected')"
            :to="protectedPromptPath"
          />
          <el-button
            mode="flat"
            color="normal"
            icon="home"
            :label="t('growth.publicPrompt.backHome')"
            :to="homePath"
          />
        </el-flex>
      </el-flex>
    </section>

    <section class="public-prompt-page__body">
      <el-flex
        rules="csc"
        class="public-prompt-page__content w100"
        :gap="22">
        <el-flex rules="csc" class="w100" :gap="8">
          <el-text :size="10" :weight="900" color="prim">
            {{ t('growth.publicPrompt.publicMetadataEyebrow') }}
          </el-text>
          <el-text type="h2" :size="mobile ? 26 : 34" :weight="820">
            {{ t('growth.publicPrompt.publicMetadataTitle') }}
          </el-text>
          <el-text :size="13" color="normal55" class="public-prompt-page__notice">
            {{ t('growth.publicPrompt.previewNotice') }}
          </el-text>
        </el-flex>

        <el-flex v-if="prompt?.tags.length" rules="rsc" class="w100 fw" :gap="7" wrap>
          <el-text
            v-for="tag in prompt.tags"
            :key="tag"
            :size="10"
            marker="surface"
            :p="[5, 8]"
            :radius="100">
            {{ formatTag(tag) }}
          </el-text>
        </el-flex>

        <div
          v-if="galleryImages.length"
          class="public-prompt-page__gallery w100">
          <img
            v-for="image in galleryImages"
            :key="image.position"
            :src="image.thumbnailUrl || image.fullUrl"
            :alt="localizedTitle"
            class="public-prompt-page__gallery-image"
            loading="lazy"
            decoding="async"
            draggable="false"
          >
        </div>
      </el-flex>
    </section>
  </main>
</template>

<style scoped>
.public-prompt-page {
  min-height: 100%;
  background: var(--themeBackground);
}

.public-prompt-page__hero {
  min-height: min(78vh, 820px);
  isolation: isolate;
  background: var(--themeSurface);
}

.public-prompt-page__hero-image,
.public-prompt-page__hero-fallback,
.public-prompt-page__hero-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.public-prompt-page__hero-image {
  z-index: 0;
  object-fit: cover;
  opacity: .5;
  filter: saturate(.9);
}

.public-prompt-page__hero-fallback {
  z-index: 1;
  background:
    radial-gradient(circle at 18% 22%, var(--primary20), transparent 42%),
    radial-gradient(circle at 82% 68%, var(--themeBlue15), transparent 46%),
    var(--themeSurface);
}

.public-prompt-page__hero-shade {
  z-index: 2;
  background:
    linear-gradient(180deg, var(--themeSurface20), var(--themeSurface35) 48%, var(--themeBackground) 100%),
    linear-gradient(90deg, var(--themeSurface75), var(--themeSurface25) 72%);
}

.public-prompt-page__hero-content {
  max-width: 1280px;
  margin: 0 auto;
}

.public-prompt-page__title {
  max-width: 1040px;
  line-height: .96 !important;
  letter-spacing: -.045em;
  text-wrap: balance;
}

.public-prompt-page__description,
.public-prompt-page__notice {
  max-width: 760px;
  line-height: 1.65 !important;
}

.public-prompt-page__body {
  width: 100%;
}

.public-prompt-page__content {
  max-width: 1280px;
  margin: 0 auto;
  padding: clamp(28px, 5vw, 64px);
}

.public-prompt-page__gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
  gap: 12px;
}

.public-prompt-page__gallery-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 18px;
  border: 1px solid var(--normalText10);
  background: var(--themeSurface);
}
</style>
