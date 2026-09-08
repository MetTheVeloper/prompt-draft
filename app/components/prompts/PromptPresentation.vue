<script setup lang="ts">
type PromptPresentationMedia = {
  position?: number
  fullUrl: string
  thumbnailUrl?: string | null
}

const props = withDefaults(defineProps<{
  title: string
  description?: string
  tags?: string[]
  publicId: number
  publishedAt: string
  modelLabel: string
  media?: PromptPresentationMedia[]
  locale?: 'en' | 'fa'
  eyebrow?: string
  previewCountLabel?: string
}>(), {
  description: '',
  tags: () => [],
  media: () => [],
  locale: 'en',
  eyebrow: '',
  previewCountLabel: '',
})

const normalizedMedia = computed(() => {
  const seen = new Set<string>()

  return props.media
    .map((item, index) => ({
      position: Number.isInteger(item.position) ? Number(item.position) : index,
      fullUrl: typeof item.fullUrl === 'string' ? item.fullUrl.trim() : '',
      thumbnailUrl: typeof item.thumbnailUrl === 'string' ? item.thumbnailUrl.trim() : '',
    }))
    .filter((item) => {
      if (!item.fullUrl || seen.has(item.fullUrl)) return false
      seen.add(item.fullUrl)
      return true
    })
    .sort((first, second) => first.position - second.position)
})

const firstMedia = computed(() => normalizedMedia.value[0] ?? null)
const sliderSources = computed(() => normalizedMedia.value.map(item => item.fullUrl))
const hasSlider = computed(() => sliderSources.value.length > 1)
const direction = computed(() => props.locale === 'fa' ? 'rtl' : 'ltr')

const formattedDate = computed(() => {
  const date = new Date(props.publishedAt)
  if (Number.isNaN(date.getTime())) return props.publishedAt

  return new Intl.DateTimeFormat(
    props.locale === 'fa' ? 'fa-IR' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  ).format(date)
})

function formatTag(tag: string) {
  return tag.replaceAll('-', ' ')
}
</script>

<template>
  <section
    class="prompt-presentation"
    :dir="direction"
    :data-prompt-id="publicId">
    <div v-if="firstMedia" class="prompt-presentation__ssr-media" aria-hidden="true">
      <img
        :src="firstMedia.fullUrl"
        :alt="title"
        class="prompt-presentation__ssr-image"
      />
    </div>

    <div v-else class="prompt-presentation__fallback" aria-hidden="true" />

    <ClientOnly>
      <visual-slider
        v-if="hasSlider"
        :sources="sliderSources"
        :interval="4200"
        :transition-duration="2400"
        :edge-blur="320"
        :random="false"
        :z-index="1"
        :opacity="1"
        :start-index="1"
      />
    </ClientOnly>

    <div class="prompt-presentation__overlay" aria-hidden="true" />
    <div class="prompt-presentation__grain" aria-hidden="true" />

    <div class="prompt-presentation__stage">
      <div class="prompt-presentation__topbar">
        <div class="prompt-presentation__topbar-leading">
          <slot name="topbar-leading" />
        </div>

        <div class="prompt-presentation__markers">
          <span class="prompt-presentation__marker prompt-presentation__marker--id">
            #{{ publicId }}
          </span>
          <span class="prompt-presentation__marker">
            {{ modelLabel }}
          </span>
        </div>
      </div>

      <div class="prompt-presentation__content">
        <p v-if="eyebrow" class="prompt-presentation__eyebrow">
          {{ eyebrow }}
        </p>

        <div v-if="tags.length" class="prompt-presentation__tags">
          <span
            v-for="tag in tags"
            :key="tag"
            class="prompt-presentation__tag">
            {{ formatTag(tag) }}
          </span>
        </div>

        <h1 class="prompt-presentation__title">
          {{ title }}
        </h1>

        <p v-if="description" class="prompt-presentation__description">
          {{ description }}
        </p>

        <div class="prompt-presentation__meta">
          <span class="prompt-presentation__meta-item">
            <el-icon name="calendar_month" :size="14" />
            {{ formattedDate }}
          </span>
          <span v-if="previewCountLabel" class="prompt-presentation__meta-item">
            <el-icon name="photo_library" :size="14" />
            {{ previewCountLabel }}
          </span>
          <slot name="meta" />
        </div>

        <div class="prompt-presentation__actions">
          <slot name="actions" />
        </div>

        <div class="prompt-presentation__status">
          <slot name="status" />
        </div>
      </div>

      <div class="prompt-presentation__scroll-cue">
        <slot name="scroll-cue" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.prompt-presentation {
  position: relative;
  isolation: isolate;
  min-height: calc(100svh - 50px);
  overflow: hidden;
  background: #09090d;
  color: var(--normalText);
}

.prompt-presentation__ssr-media,
.prompt-presentation__fallback,
.prompt-presentation__overlay,
.prompt-presentation__grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.prompt-presentation__ssr-media,
.prompt-presentation__fallback {
  z-index: 0;
}

.prompt-presentation__ssr-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transform: scale(1.015);
}

.prompt-presentation__fallback {
  background:
    radial-gradient(circle at 18% 18%, rgba(89, 70, 255, .38), transparent 34%),
    radial-gradient(circle at 82% 30%, rgba(0, 180, 255, .22), transparent 28%),
    radial-gradient(circle at 48% 88%, rgba(255, 80, 140, .18), transparent 34%),
    #0b0b10;
}

.prompt-presentation__overlay {
  z-index: 4;
  background:
    radial-gradient(circle at 50% 32%, transparent 0%, rgba(9, 9, 13, .38) 44%, rgba(9, 9, 13, .82) 100%),
    linear-gradient(180deg, rgba(9, 9, 13, .06) 0%, rgba(9, 9, 13, .28) 42%, rgba(9, 9, 13, .93) 100%);
}

.prompt-presentation__grain {
  z-index: 5;
  opacity: .1;
  background-image: repeating-radial-gradient(circle at 0 0, rgba(255,255,255,.12) 0, rgba(255,255,255,.12) .6px, transparent .7px, transparent 3px);
  background-size: 5px 5px;
  mix-blend-mode: soft-light;
}

.prompt-presentation__stage {
  position: relative;
  z-index: 10;
  min-height: calc(100svh - 50px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  max-width: 1440px;
  margin-inline: auto;
  padding: clamp(18px, 2.5vw, 40px);
}

.prompt-presentation__topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.prompt-presentation__markers,
.prompt-presentation__tags,
.prompt-presentation__meta,
.prompt-presentation__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.prompt-presentation__markers {
  gap: 8px;
}

.prompt-presentation__marker,
.prompt-presentation__tag {
  border-radius: 999px;
  backdrop-filter: blur(12px);
  box-shadow: 0 6px 24px rgba(0, 0, 0, .18);
}

.prompt-presentation__marker {
  padding: 5px 9px;
  background: rgba(12, 12, 18, .72);
  border: 1px solid rgba(255,255,255,.12);
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.prompt-presentation__marker--id {
  color: var(--themePrim, #45bced);
}

.prompt-presentation__content {
  width: min(1120px, 100%);
  padding-block: clamp(88px, 18vh, 190px) clamp(68px, 10vh, 110px);
}

.prompt-presentation__eyebrow {
  margin: 0 0 18px;
  color: var(--themePrim, #45bced);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.prompt-presentation__tags {
  gap: 7px;
  margin-bottom: 18px;
}

.prompt-presentation__tag {
  padding: 4px 8px;
  background: rgba(15,15,20,.52);
  border: 1px solid rgba(255,255,255,.1);
  font-size: 10px;
  text-transform: lowercase;
}

.prompt-presentation__title {
  max-width: 1100px;
  margin: 0;
  font-size: clamp(44px, 6.2vw, 92px);
  line-height: .94;
  letter-spacing: -.045em;
  text-wrap: balance;
  text-shadow: 0 12px 50px rgba(0,0,0,.34);
}

.prompt-presentation__description {
  max-width: 820px;
  margin: 24px 0 0;
  font-size: clamp(14px, 1.35vw, 19px);
  line-height: 1.7;
  color: rgba(255,255,255,.78);
  text-wrap: pretty;
}

.prompt-presentation__meta {
  gap: 14px 20px;
  margin-top: 24px;
  color: rgba(255,255,255,.78);
  font-size: 12px;
}

.prompt-presentation__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.prompt-presentation__actions {
  gap: 8px;
  margin-top: 20px;
}

.prompt-presentation__status {
  margin-top: 8px;
}

.prompt-presentation__scroll-cue {
  position: absolute;
  inset-inline-end: clamp(14px, 2.5vw, 40px);
  bottom: clamp(14px, 2vw, 28px);
}

@media (max-width: 760px) {
  .prompt-presentation__stage {
    min-height: calc(100svh - 50px);
  }

  .prompt-presentation__content {
    padding-block: 96px 80px;
  }

  .prompt-presentation__title {
    font-size: clamp(40px, 13vw, 62px);
    line-height: .98;
  }

  .prompt-presentation__description {
    margin-top: 18px;
    font-size: 14px;
  }

  .prompt-presentation__scroll-cue {
    bottom: 10px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .prompt-presentation__ssr-image {
    transform: none;
  }
}
</style>
