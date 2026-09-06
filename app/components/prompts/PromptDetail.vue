<script setup lang="ts">
import type {
  PromptArchiveDetailItem,
  PromptArchiveNavigationItem,
} from '~/types/promptArchive'

const props = defineProps<{
  item: PromptArchiveDetailItem
  previousItem?: PromptArchiveNavigationItem | null
  nextItem?: PromptArchiveNavigationItem | null
}>()

const emit = defineEmits<{
  (event: 'telegram', item: PromptArchiveDetailItem): void
}>()

const { t, locale } = useI18n()
const { mobile, tablet, mini } = useScreen()
const analytics = useProductAnalytics()
const promptArchive = usePromptArchive()
const promptUnlock = usePromptArchiveUnlock()

const rootRef = ref<HTMLElement | null>(null)
const activePromptKey = ref('main')
const copied = ref(false)
const copyBusy = ref(false)
const copyError = ref<'insufficient' | 'unlock' | 'clipboard' | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | undefined

const localizedTitle = computed(() => {
  return locale.value === 'fa' ? props.item.title.fa : props.item.title.en
})
const imageSources = computed(() => props.item.images.map(image => image.fullUrl))
const coverImage = computed(() => imageSources.value[0] || '')
const hasCanvasSlider = computed(() => imageSources.value.length > 1)
const hasTelegram = computed(() => Boolean(props.item.telegramUrl))

const modelLabel = computed(() => {
  return props.item.model.previewGeneratedWith === 'gpt-image-1'
    ? t('prompts.models.gptImage1')
    : t('prompts.models.dallE')
})

const modelMarker = computed(() => {
  return props.item.model.previewGeneratedWith === 'gpt-image-1'
    ? 'green'
    : 'blue'
})

const heroTitleSize = computed(() => {
  if (mobile.value) return 42
  if (tablet.value || mini.value) return 58
  return 82
})

const contentPadding = computed(() => {
  if (mobile.value) return 16
  if (tablet.value || mini.value) return 24
  return 40
})

const heroStyle = computed(() => ({
  minHeight: `calc(100vh - ${dimension().header.height}px)`,
}))

const promptSectionCols = computed(() => {
  if (mobile.value) return 1
  return ['minmax(230px, .72fr)', 'minmax(0, 1.55fr)']
})

const promptOptions = computed(() => {
  const options = [
    {
      key: 'main',
      label: t('prompts.detail.primaryVersion'),
      prompt: props.item.prompt,
    },
  ]

  for (const variant of props.item.variants || []) {
    options.push({
      key: variant.key,
      label: locale.value === 'fa' ? variant.label.fa : variant.label.en,
      prompt: variant.prompt,
    })
  }

  return options
})

const activePrompt = computed(() => {
  return promptOptions.value.find(option => option.key === activePromptKey.value)
    || promptOptions.value[0]
})

const formattedDate = computed(() => {
  const date = new Date(props.item.publishedAt)
  if (Number.isNaN(date.getTime())) return props.item.publishedAt

  return new Intl.DateTimeFormat(
    locale.value === 'fa' ? 'fa-IR' : 'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  ).format(date)
})

const backIcon = computed(() => locale.value === 'fa' ? 'arrow-right' : 'arrow-left')

const copyActionLabel = computed(() => {
  if (copied.value) return t('prompts.detail.copied')
  if (promptUnlock.pending.value) return t('prompts.detail.unlocking')
  if (copyBusy.value) return t('prompts.detail.copying')

  if (!promptUnlock.unlocked.value && promptUnlock.policy.value) {
    return t('prompts.detail.unlockAndCopy', {
      cost: promptUnlock.policy.value.costGoin,
    })
  }

  if (promptUnlock.loading.value && !promptUnlock.state.value) {
    return t('prompts.detail.checkingUnlock')
  }

  return t('prompts.detail.copyPrompt')
})

const copyActionIcon = computed(() => {
  if (copied.value) return 'check_circle'
  if (promptUnlock.pending.value || copyBusy.value || promptUnlock.loading.value) return 'refresh'
  if (!promptUnlock.unlocked.value && promptUnlock.policy.value) return 'lock_open'
  return 'content_copy'
})

const copyActionColor = computed(() => copied.value ? 'green' : 'normal')

const copyFeedback = computed(() => {
  const failure = promptUnlock.failure.value

  if (copyError.value === 'insufficient') {
    return t('prompts.detail.insufficientGoin', {
      required: failure?.required ?? promptUnlock.policy.value?.costGoin ?? 0,
      balance: failure?.balance ?? promptUnlock.economy.value?.balance ?? 0,
    })
  }

  if (copyError.value === 'unlock') return t('prompts.detail.unlockError')
  if (copyError.value === 'clipboard') return t('prompts.detail.copyError')

  if (promptUnlock.loading.value && !promptUnlock.state.value) {
    return t('prompts.detail.checkingUnlock')
  }

  if (promptUnlock.state.value && !promptUnlock.unlocked.value) {
    return t('prompts.detail.unlockInfo', {
      cost: promptUnlock.policy.value?.costGoin ?? 0,
      balance: promptUnlock.economy.value?.balance ?? 0,
    })
  }

  if (promptUnlock.unlocked.value) return t('prompts.detail.unlockedInfo')

  return ''
})

const copyFeedbackColor = computed(() => copyError.value ? 'red' : 'normal')

const copyFeedbackIcon = computed(() => {
  if (copyError.value === 'insufficient') return 'account_balance_wallet'
  if (copyError.value) return 'warning'
  if (promptUnlock.loading.value && !promptUnlock.state.value) return 'refresh'
  if (promptUnlock.unlocked.value) return 'lock_open'
  if (promptUnlock.state.value) return 'lock'
  return 'info'
})

function trackPromptView() {
  const source = promptArchive.detailSource.value

  void analytics.track('prompt_archive_view', {
    resource: {
      type: 'prompt_archive_item',
      id: String(props.item.id),
    },
    metadata: source ? { source } : {},
  })
}

watch(
  () => props.item.id,
  async () => {
    activePromptKey.value = 'main'
    copied.value = false
    copyBusy.value = false
    copyError.value = null
    promptUnlock.reset()
    trackPromptView()
    void promptUnlock.load(props.item.id)

    await nextTick()

    requestAnimationFrame(() => {
      scrollDetailToTop()
    })
  },
)

onMounted(() => {
  trackPromptView()
  void promptUnlock.load(props.item.id)
})

onBeforeUnmount(() => {
  if (copiedTimer) clearTimeout(copiedTimer)
})

function formatTag(tag: string) {
  return tag.replaceAll('-', ' ')
}

function scrollDetailToTop() {
  if (!import.meta.client) return

  const scrollContainer = rootRef.value?.closest<HTMLElement>('.ofha')

  if (scrollContainer) {
    scrollContainer.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    })

    return
  }

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth',
  })
}

function detailUrl(item: PromptArchiveNavigationItem) {
  return `/prompts?id=${item.id}`
}

function localizedNavigationTitle(item: PromptArchiveNavigationItem) {
  return locale.value === 'fa' ? item.title.fa : item.title.en
}

function openTelegram() {
  if (!props.item.telegramUrl) return
  emit('telegram', props.item)
}

function scrollToPrompt() {
  if (!import.meta.client) return

  document.getElementById('prompt-detail-content')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

async function copyText(value: string) {
  if (!import.meta.client) return false

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
      return true
    }
  } catch {
    // Fall through to the legacy copy fallback.
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    textarea.style.pointerEvents = 'none'

    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    const success = document.execCommand('copy')
    textarea.remove()

    return success
  } catch {
    return false
  }
}

async function copyPrompt() {
  const value = activePrompt.value?.prompt || ''
  if (!value || copyBusy.value || promptUnlock.pending.value) return

  copyError.value = null

  if (!promptUnlock.unlocked.value) {
    const unlockResult = await promptUnlock.unlock(props.item.id)

    if (!unlockResult) {
      copyError.value = promptUnlock.failure.value?.code === 'INSUFFICIENT_GOIN_BALANCE'
        ? 'insufficient'
        : 'unlock'
      return
    }
  }

  copyBusy.value = true

  try {
    const success = await copyText(value)
    if (!success) {
      copyError.value = 'clipboard'
      return
    }

    copied.value = true

    void analytics.track('prompt_archive_copy', {
      resource: {
        type: 'prompt_archive_item',
        id: String(props.item.id),
      },
      metadata: {
        variantKey: activePrompt.value?.key || 'main',
      },
    })

    if (copiedTimer) clearTimeout(copiedTimer)

    copiedTimer = setTimeout(() => {
      copied.value = false
    }, 1800)
  } finally {
    copyBusy.value = false
  }
}
</script>

<template>
  <div ref="rootRef" class="prompt-detail w100 por">
    <visual-slider
      v-if="hasCanvasSlider"
      :sources="imageSources"
      :interval="4200"
      :transition-duration="2400"
      :edge-blur="320"
      :random="false"
      :z-index="0"
      :opacity="1"
      :start-index="1"
    />

    <div v-else-if="coverImage" class="prompt-detail__static-bg">
      <img
        :src="coverImage"
        :alt="localizedTitle"
        class="prompt-detail__static-image"
      />
    </div>

    <div v-else class="prompt-detail__fallback-bg" />

    <div class="prompt-detail__cinema-overlay" />
    <div class="prompt-detail__grain" />

    <section
      class="prompt-detail__hero w100 por zi20"
      :style="heroStyle">
      <el-flex
        rules="rbc"
        class="prompt-detail__topbar w100"
        :gap="12"
        :p="contentPadding">
        <el-button
          type="fab"
          to="/prompts"
          :label="t('prompts.detail.back')"
          :icon="backIcon"
          mode="flat"
          color="white"
          text-color="white"
          icon-color="white"
          :size="13"
          :p="10"
        />

        <el-flex rules="rcc" :gap="16" wrap>
          <el-text
            :size="18"
            :weight="800"
            :p="[2, 5]"
            :radius="100"
            marker="white"
            color="blue"
            class="wsnw">
            #{{ item.id }}
          </el-text>

          <el-text
            :size="16"
            :weight="800"
            :p="[2, 5]"
            :radius="100"
            :marker="modelMarker"
            color="white"
            class="wsnw">
            {{ modelLabel }}
          </el-text>
        </el-flex>
      </el-flex>

      <el-flex
        rules="cbs"
        class="prompt-detail__hero-content w100"
        :gap="18"
        :p="contentPadding">
        <el-flex rules="rsc" :gap="16" wrap class="w100">
          <el-text
            v-for="tag in item.tags"
            :key="tag"
            :size="10"
            :p="[2, 5]"
            :radius="100"
            marker="surface50"
            class="wsnw">
            {{ formatTag(tag) }}
          </el-text>
        </el-flex>

        <el-text
          type="h1"
          :size="heroTitleSize"
          :weight="600"
          effect="glitch">
          {{ localizedTitle }}
        </el-text>

        <el-flex
          rules="rsc"
          class="prompt-detail__meta w100"
          :gap="mobile ? 10 : 18"
          wrap>
          <el-text
            :size="mobile ? 10 : 12"
            icon="calendar_month"
            icon-color="normal50">
            {{ formattedDate }}
          </el-text>

          <el-text
            :size="mobile ? 10 : 12"
            icon="photo_library"
            icon-color="normal50">
            {{ t('prompts.detail.previewCount', { count: item.images.length }) }}
          </el-text>

          <el-text
            :size="mobile ? 10 : 12"
            icon="auto_fix_high"
            icon-color="normal50">
            {{ t('prompts.detail.readyToUse') }}
          </el-text>
        </el-flex>

        <el-flex rules="rsc" :gap="8" wrap class="w100">
          <el-button
            :label="copyActionLabel"
            :icon="copyActionIcon"
            :color="copyActionColor"
            mode="outline"
            :size="12"
            :p="[8, 14]"
            @click="copyPrompt"
          />

          <el-button
            v-if="hasTelegram"
            :label="t('prompts.detail.openTelegram')"
            icon="send"
            color="blue"
            :size="14"
            :p="[10, 14]"
            @click="openTelegram"
          />

          <el-text
            v-if="copyFeedback"
            :size="10"
            :weight="700"
            :color="copyFeedbackColor"
            :icon="copyFeedbackIcon"
            :icon-color="copyFeedbackColor"
            class="w100">
            {{ copyFeedback }}
          </el-text>
        </el-flex>
      </el-flex>

      <el-flex
        rules="rcc"
        class="prompt-detail__scroll-cue"
        :gap="6">
        <el-button
          :label="t('prompts.detail.explorePrompt')"
          icon="arrow_downward"
          mode="flat"
          :invert="true"
          :size="14"
          :p="8"
          @click="scrollToPrompt"
        />
      </el-flex>
    </section>

    <section
      id="prompt-detail-content"
      class="prompt-detail__content por zi20">
      <el-grid
        :cols="promptSectionCols"
        :gap="mobile ? 18 : 28"
        class="prompt-detail__content-grid w100"
        :p="contentPadding">
        <el-flex
          rules="ccs"
          class="prompt-detail__intro w100"
          :gap="16">
          <el-text
            :size="10"
            :weight="800"
            marker="prim"
            color="white"
            class="wsnw">
            {{ t('prompts.detail.promptEyebrow') }}
          </el-text>

          <el-text
            type="h2"
            :size="mobile ? 18 : 24"
            :weight="600"
            class="prompt-detail__section-title">
            {{ t('prompts.detail.promptTitle').toUpperCase() }}
          </el-text>

          <el-text
            type="p"
            :size="mobile ? 12 : 14"
            class="prompt-detail__intro-copy">
            {{ t('prompts.detail.promptDescription') }}
          </el-text>

          <el-divider />
        </el-flex>

        <el-flex
          rules="csc"
          class="prompt-detail__prompt-panel w100"
          :gap="0"
          :radius="mobile ? 18 : 24"
          :br="1"
          bc="normal25">
          <el-flex
            rules="rbc"
            class="prompt-detail__prompt-toolbar w100"
            :gap="10"
            :p="mobile ? 12 : 16">
            <el-flex rules="rsc" :gap="8" wrap class="fg100">
              <el-text
                :size="10"
                :weight="800"
                class="wsnw">
                {{ t('prompts.detail.promptLabel') }}
              </el-text>

              <el-text :size="10" class="wsnw">
                {{ activePrompt?.label }}
              </el-text>
            </el-flex>

            <el-button
              type="fab"
              :label="copyActionLabel"
              :icon="copyActionIcon"
              :color="copyActionColor"
              :size="12"
              :p="8"
              @click="copyPrompt"
            />
          </el-flex>

          <el-flex
            v-if="copyFeedback"
            rules="rsc"
            class="w100"
            :gap="6"
            :p="[0, mobile ? 12 : 16, 12, mobile ? 12 : 16]">
            <el-text
              :size="10"
              :weight="700"
              :color="copyFeedbackColor"
              :icon="copyFeedbackIcon"
              :icon-color="copyFeedbackColor">
              {{ copyFeedback }}
            </el-text>
          </el-flex>

          <el-flex
            v-if="promptOptions.length > 1"
            rules="rsc"
            class="prompt-detail__variants w100"
            :gap="6"
            :p="[0, mobile ? 12 : 16, mobile ? 12 : 16, mobile ? 12 : 16]"
            wrap>
            <el-button
              v-for="option in promptOptions"
              :key="option.key"
              :label="option.label"
              :size="10"
              :p="[7, 9]"
              @click="activePromptKey = option.key"
            />
          </el-flex>

          <el-flex rules="csc" class="prompt-detail__prompt-copy">
            <pre>{{ activePrompt?.prompt }}</pre>
          </el-flex>

          <el-flex
            rules="rbc"
            class="prompt-detail__prompt-footer w100"
            :gap="8"
            :p="mobile ? 12 : 16"
            wrap>
            <el-text :size="10" color="normal65">
              {{ t('prompts.detail.modelNote', { model: modelLabel }) }}
            </el-text>

            <el-button
              v-if="hasTelegram"
              :label="t('prompts.detail.openTelegram')"
              icon="send"
              mode="flat"
              color="blue"
              :size="11"
              :p="[8, 10]"
              @click="openTelegram"
            />
          </el-flex>
        </el-flex>
      </el-grid>

      <el-grid
        v-if="previousItem || nextItem"
        :br="[1, 0, 0, 0]"
        bc="normal15"
        :cols="2"
        :gap="1"
        class="w100">
        <el-flex
          v-if="previousItem"
          type="link"
          :to="detailUrl(previousItem)"
          rules="ccs"
          class="prompt-detail__nav-item w100"
          :gap="8"
          :p="mobile ? 18 : 28">
          <el-text
            :size="12"
            icon="arrow_left"
            icon-color="blue">
            {{ t('prompts.detail.previous') }}
          </el-text>

          <el-text
            type="h3"
            :size="mobile ? 14 : 18"
            :weight="400">
            {{ localizedNavigationTitle(previousItem) }}
          </el-text>
        </el-flex>

        <el-flex
          v-if="nextItem"
          type="link"
          :to="detailUrl(nextItem)"
          rules="cce"
          class="prompt-detail__nav-item w100"
          :gap="8"
          :p="mobile ? 18 : 28">
          <el-text
            :size="12"
            icon="arrow_right"
            icon-color="blue">
            {{ t('prompts.detail.next') }}
          </el-text>

          <el-text
            type="h3"
            :size="mobile ? 14 : 18"
            :weight="400">
            {{ localizedNavigationTitle(nextItem) }}
          </el-text>
        </el-flex>
      </el-grid>
    </section>
  </div>
</template>

<style scoped>
.prompt-detail {
  min-height: 100%;
  isolation: isolate;
  background: #09090d;
}

.prompt-detail__static-bg,
.prompt-detail__fallback-bg,
.prompt-detail__cinema-overlay,
.prompt-detail__grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.prompt-detail__static-bg,
.prompt-detail__fallback-bg {
  z-index: 0;
}

.prompt-detail__static-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  animation: prompt-detail-static-breathe 16s ease-in-out infinite alternate;
}

.prompt-detail__fallback-bg {
  background:
    radial-gradient(circle at 18% 18%, rgba(89, 70, 255, 0.38), transparent 34%),
    radial-gradient(circle at 82% 30%, rgba(0, 180, 255, 0.22), transparent 28%),
    radial-gradient(circle at 48% 88%, rgba(255, 80, 140, 0.18), transparent 34%),
    #0b0b10;
}

.prompt-detail__cinema-overlay {
  z-index: 4;
  background:
    radial-gradient(circle at 50% 32%, transparent 0%, var(--themeSurface15) 42%, var(--themeSurface75) 100%),
    linear-gradient(180deg, var(--themeSurface5) 0%, var(--themeSurface15) 38%, var(--themeSurface85) 100%);
}

.prompt-detail__grain {
  z-index: 5;
  opacity: 0.12;
  background-image:
    repeating-radial-gradient(circle at 0 0, var(--themeSurface15) 0, var(--themeSurface15) .6px, transparent .7px, transparent 3px);
  background-size: 5px 5px;
  mix-blend-mode: soft-light;
}

.prompt-detail__hero {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.prompt-detail__topbar {
  position: relative;
}

.prompt-detail__ghost-id {
  position: absolute;
  top: 7%;
  inset-inline-end: 2%;
  z-index: 0;
  font-size: clamp(130px, 24vw, 420px);
  line-height: 0.78;
  font-weight: 900;
  letter-spacing: -0.08em;
  color: rgba(255,255,255,.055);
  user-select: none;
  pointer-events: none;
}

.prompt-detail__hero-content {
  position: relative;
  max-width: 1240px;
  margin-inline: auto;
  padding-top: 120px !important;
  padding-bottom: 72px !important;
}

.prompt-detail__title {
  max-width: 1080px;
  line-height: 0.92;
  letter-spacing: -0.045em;
  text-wrap: balance;
  text-shadow: 0 10px 50px rgba(0,0,0,.32);
}

.prompt-detail__meta {
  opacity: .88;
}

.prompt-detail__scroll-cue {
  position: absolute;
  inset-inline-end: 32px;
  bottom: 24px;
  opacity: .82;
}

.prompt-detail__content {
  background:
    linear-gradient(180deg, var(--themeSurface75) 0%, var(--themeSurface90) 30%, var(--themeSurface95) 100%);
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--themeSurface85);
}

.prompt-detail__content-grid {
  max-width: 1440px;
  margin-inline: auto;
  padding-top: 72px !important;
  padding-bottom: 72px !important;
}

.prompt-detail__intro {
  position: sticky;
  top: 24px;
  align-self: start;
}

.prompt-detail__section-title {
  line-height: 1;
  letter-spacing: -0.03em;
  max-width: 440px;
}

.prompt-detail__intro-copy {
  max-width: 420px;
  opacity: .72;
  line-height: 1.8;
}

.prompt-detail__prompt-panel {
  overflow: hidden;
  background: var(--themeBackground);
  box-shadow:
    0 24px 80px rgba(0, 0, 0, .28),
    inset 0 8px 0 var(--normalText15);
  backdrop-filter: blur(8px);
}

.prompt-detail__prompt-toolbar,
.prompt-detail__prompt-footer {
  background: var(--themeSurface85);
}

.prompt-detail__variants {
  border-bottom: 1px solid var(--themeBackground10);
}

.prompt-detail__prompt-copy {
  min-height: 360px;
  max-height: min(68vh, 760px);
  overflow: auto;
  padding: 20px;
  scrollbar-width: thin;
}

.prompt-detail__prompt-copy pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  direction: ltr;
  unicode-bidi: plaintext;
  text-align: left;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 13px;
  line-height: 1.9;
  color: var(--normalText)
}

.prompt-detail__navigation {
  border-top: 1px solid rgba(255,255,255,.08);
}

.prompt-detail__nav-item {
  min-height: 170px;
  transition:
    background-color 260ms ease,
    transform 260ms ease;
}

.prompt-detail__nav-item:hover {
  background: var(--normalText15);
}

@keyframes prompt-detail-static-breathe {
  from {
    transform: scale(1);
  }

  to {
    transform: scale(1.045);
  }
}

@media (max-width: 760px) {
  .prompt-detail__ghost-id {
    top: 13%;
    inset-inline-end: -2%;
    font-size: clamp(110px, 42vw, 190px);
  }

  .prompt-detail__hero-content {
    padding-top: 86px !important;
    padding-bottom: 76px !important;
  }

  .prompt-detail__title {
    line-height: .98;
  }

  .prompt-detail__scroll-cue {
    inset-inline-end: 12px;
    bottom: 12px;
  }

  .prompt-detail__content-grid {
    padding-top: 48px !important;
    padding-bottom: 48px !important;
  }

  .prompt-detail__intro {
    position: static;
  }

  .prompt-detail__prompt-copy {
    min-height: 320px;
    max-height: none;
    padding: 16px;
  }

  .prompt-detail__prompt-copy pre {
    font-size: 12px;
    line-height: 1.8;
  }

  .prompt-detail__nav-item {
    min-height: 130px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .prompt-detail__static-image {
    animation: none;
  }

  .prompt-detail__nav-item {
    transition: none;
  }
}
</style>